import React, { useState, useMemo } from 'react';
import { logger } from '../services/LoggingService';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { database } from '../../models/database';
import DoorsPackageModel from '../../models/DoorsPackageModel';
import { Q } from '@nozbe/watermelondb';
import withObservables from '@nozbe/with-observables';
import { useAuth } from '../auth/AuthContext';
import { createDoorsDemoData } from '../utils/demoData/DoorsSeeder';
import { linkBomItemsToDoors } from '../services/BomDoorsLinkingService';
import type { DoorsPackage, DoorsPackageStatus, DoorsPriority } from '../../types/doors';


/**
 * DOORS Register Screen
 *
 * Displays all DOORS packages (equipment-level tracking) with compliance %
 * Allows filtering by status, priority, category, and compliance range
 */

interface DoorsRegisterScreenProps {
  navigation: any;
  doorsPackages: DoorsPackageModel[];
}

const DoorsRegisterScreen: React.FC<DoorsRegisterScreenProps> = ({ navigation, doorsPackages }) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'all' | DoorsPackageStatus>('all');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Force refresh when screen comes into focus (after returning from edit)
  useFocusEffect(
    React.useCallback(() => {
      logger.debug('[DoorsRegister] Screen focused, refreshing data');
      setRefreshKey(prev => prev + 1);
    }, [])
  );

  // Filter packages based on search and filters
  const filteredPackages = useMemo(() => {
    let filtered = [...doorsPackages];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (pkg) =>
          pkg.doorsId.toLowerCase().includes(query) ||
          pkg.equipmentName.toLowerCase().includes(query) ||
          pkg.category.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter((pkg) => pkg.status === selectedStatus);
    }

    // Category filter
    if (selectedCategory) {
      filtered = filtered.filter((pkg) => pkg.category === selectedCategory);
    }

    // Sort by priority and compliance
    filtered.sort((a, b) => {
      // High priority first
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority as DoorsPriority] - priorityOrder[a.priority as DoorsPriority];
      if (priorityDiff !== 0) return priorityDiff;

      // Then by compliance (lower compliance first - needs attention)
      return a.compliancePercentage - b.compliancePercentage;
    });

    return filtered;
  }, [doorsPackages, searchQuery, selectedStatus, selectedCategory, refreshKey]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = doorsPackages.length;
    const draft = doorsPackages.filter((p) => p.status === 'draft').length;
    const underReview = doorsPackages.filter((p) => p.status === 'under_review').length;
    const approved = doorsPackages.filter((p) => p.status === 'approved').length;
    const closed = doorsPackages.filter((p) => p.status === 'closed').length;
    const avgCompliance =
      total > 0
        ? doorsPackages.reduce((sum, p) => sum + p.compliancePercentage, 0) / total
        : 0;
    const critical = doorsPackages.filter((p) => p.compliancePercentage < 80).length;

    return { total, draft, underReview, approved, closed, avgCompliance, critical };
  }, [doorsPackages, refreshKey]);

  // Handle clear all DOORS data (for testing)
  const handleClearAllData = async () => {
    try {
      setLoading(true);
      logger.info('[DoorsRegister] Clearing all DOORS data...');

      await database.write(async () => {
        const packagesCollection = database.collections.get<DoorsPackageModel>('doors_packages');
        const requirementsCollection = database.collections.get('doors_requirements');

        // Delete all packages
        const allPackages = await packagesCollection.query().fetch();
        for (const pkg of allPackages) {
          await pkg.destroyPermanently();
        }

        // Delete all requirements
        const allRequirements = await requirementsCollection.query().fetch();
        for (const req of allRequirements) {
          await req.destroyPermanently();
        }

        logger.info('[DoorsRegister] All DOORS data cleared successfully');
      });
    } catch (error) {
      logger.error('[DoorsRegister] Error clearing DOORS data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle load demo data
  const handleLoadDemoData = async () => {
    try {
      setLoading(true);
      logger.info('[DoorsRegister] Loading demo DOORS data...');

      // Get first project
      const projects = await database.collections.get('projects').query().fetch();
      if (projects.length === 0) {
        logger.warn('[DoorsRegister] No projects found');
        return;
      }

      const projectId = projects[0].id;
      const userId = user?.userId || 'demo-user';

      // Create DOORS demo data
      await createDoorsDemoData(projectId, userId);
      logger.info('[DoorsRegister] Demo data loaded successfully');

      // Link BOM items to DOORS packages (for Material Tracking integration)
      const linkedCount = await linkBomItemsToDoors(projectId);
      logger.info(`[DoorsRegister] Linked ${linkedCount} BOM items to DOORS packages`);
    } catch (error) {
      logger.error('[DoorsRegister] Error loading demo data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Render package card
  const renderPackageCard = ({ item }: { item: DoorsPackageModel }) => {
    const statusColors = {
      draft: '#9E9E9E',
      under_review: '#FF9800',
      approved: '#4CAF50',
      closed: '#2196F3',
    };

    const priorityColors = {
      high: '#F44336',
      medium: '#FF9800',
      low: '#4CAF50',
    };

    const complianceColor =
      item.compliancePercentage >= 95 ? '#4CAF50' :
      item.compliancePercentage >= 80 ? '#FF9800' : '#F44336';

    return (
      <TouchableOpacity
        style={styles.packageCard}
        onPress={() => navigation.navigate('DoorsDetail', { packageId: item.id })}
        activeOpacity={0.7}
      >
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Text style={styles.doorsId}>{item.doorsId}</Text>
            <View style={styles.badges}>
              <View style={[styles.statusBadge, { backgroundColor: statusColors[item.status as DoorsPackageStatus] }]}>
                <Text style={styles.badgeText}>{item.status.toUpperCase().replace('_', ' ')}</Text>
              </View>
              <View style={[styles.priorityBadge, { backgroundColor: priorityColors[item.priority as DoorsPriority] }]}>
                <Text style={styles.badgeText}>{item.priority.toUpperCase()}</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity
            style={styles.editButton}
            onPress={(e) => {
              e.stopPropagation(); // Prevent card tap
              navigation.navigate('DoorsPackageEdit', { packageId: item.id });
            }}
          >
            <Text style={styles.editIcon}>✏️</Text>
          </TouchableOpacity>
        </View>

        {/* Equipment Name */}
        <Text style={styles.equipmentName}>{item.equipmentName}</Text>
        <Text style={styles.equipmentInfo}>
          Qty: {item.quantity} {item.unit} • {item.category} • {item.equipmentType}
        </Text>

        {/* Compliance Progress */}
        <View style={styles.complianceSection}>
          <View style={styles.complianceHeader}>
            <Text style={styles.complianceLabel}>Overall Compliance</Text>
            <Text style={[styles.compliancePercentage, { color: complianceColor }]}>
              {item.compliancePercentage.toFixed(1)}%
            </Text>
          </View>
          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBar,
                { width: `${item.compliancePercentage}%`, backgroundColor: complianceColor },
              ]}
            />
          </View>
          <Text style={styles.complianceDetail}>
            {item.compliantRequirements}/{item.totalRequirements} requirements
          </Text>
        </View>

        {/* Category Breakdown */}
        <View style={styles.categoryBreakdown}>
          <Text style={styles.breakdownItem}>Tech: {item.technicalReqCompliance.toFixed(0)}%</Text>
          <Text style={styles.breakdownItem}>Data: {item.datasheetCompliance.toFixed(0)}%</Text>
          <Text style={styles.breakdownItem}>Type: {item.typeTestCompliance.toFixed(0)}%</Text>
          <Text style={styles.breakdownItem}>Routine: {item.routineTestCompliance.toFixed(0)}%</Text>
          <Text style={styles.breakdownItem}>Site: {item.siteReqCompliance.toFixed(0)}%</Text>
        </View>

        {/* Footer Info */}
        {item.rfqNo && (
          <Text style={styles.footerInfo}>RFQ: {item.rfqNo} • PO: {item.poNo || '-'}</Text>
        )}
      </TouchableOpacity>
    );
  };

  // Render empty state
  if (doorsPackages.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateIcon}>📋</Text>
          <Text style={styles.emptyStateTitle}>No DOORS Packages</Text>
          <Text style={styles.emptyStateText}>
            Load demo data to see DOORS packages with requirements
          </Text>
          <TouchableOpacity
            style={styles.loadDemoButton}
            onPress={handleLoadDemoData}
            disabled={loading}
          >
            <Text style={styles.loadDemoButtonText}>
              {loading ? 'Loading...' : 'Load Demo DOORS Data'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* KPI Summary */}
      <View style={styles.kpiSection}>
        <View style={styles.kpiRow}>
          <View style={styles.kpiItem}>
            <Text style={styles.kpiValue}>{stats.total}</Text>
            <Text style={styles.kpiLabel}>Total</Text>
          </View>
          <View style={styles.kpiItem}>
            <Text style={[styles.kpiValue, { color: '#4CAF50' }]}>
              {stats.avgCompliance.toFixed(1)}%
            </Text>
            <Text style={styles.kpiLabel}>Avg Compliance</Text>
          </View>
          <View style={styles.kpiItem}>
            <Text style={styles.kpiValue}>{stats.closed}</Text>
            <Text style={styles.kpiLabel}>Closed</Text>
          </View>
          {stats.critical > 0 && (
            <View style={styles.kpiItem}>
              <Text style={[styles.kpiValue, { color: '#F44336' }]}>{stats.critical}</Text>
              <Text style={styles.kpiLabel}>Critical</Text>
            </View>
          )}
        </View>
        {/* Clear Data Button (for testing) */}
        <TouchableOpacity
          style={styles.clearDataButton}
          onPress={handleClearAllData}
          disabled={loading}
        >
          <Text style={styles.clearDataButtonText}>
            {loading ? 'Clearing...' : '🗑️ Clear All Data (Testing)'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search DOORS ID, equipment..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity style={styles.clearButton} onPress={() => setSearchQuery('')}>
            <Text style={styles.clearText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Status Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersContainer}
        contentContainerStyle={styles.filtersContent}
      >
        <TouchableOpacity
          style={[styles.filterChip, selectedStatus === 'all' && styles.filterChipActive]}
          onPress={() => setSelectedStatus('all')}
        >
          <Text style={[styles.filterText, selectedStatus === 'all' && styles.filterTextActive]}>
            All ({stats.total})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, selectedStatus === 'draft' && styles.filterChipActive]}
          onPress={() => setSelectedStatus('draft')}
        >
          <Text style={[styles.filterText, selectedStatus === 'draft' && styles.filterTextActive]}>
            Draft ({stats.draft})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, selectedStatus === 'under_review' && styles.filterChipActive]}
          onPress={() => setSelectedStatus('under_review')}
        >
          <Text style={[styles.filterText, selectedStatus === 'under_review' && styles.filterTextActive]}>
            Review ({stats.underReview})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, selectedStatus === 'approved' && styles.filterChipActive]}
          onPress={() => setSelectedStatus('approved')}
        >
          <Text style={[styles.filterText, selectedStatus === 'approved' && styles.filterTextActive]}>
            Approved ({stats.approved})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, selectedStatus === 'closed' && styles.filterChipActive]}
          onPress={() => setSelectedStatus('closed')}
        >
          <Text style={[styles.filterText, selectedStatus === 'closed' && styles.filterTextActive]}>
            Closed ({stats.closed})
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Packages List */}
      <FlatList
        data={filteredPackages}
        renderItem={renderPackageCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

// WatermelonDB Observable Wrapper
const enhance = withObservables([], () => ({
  doorsPackages: database.collections.get<DoorsPackageModel>('doors_packages').query().observe(),
}));

export default enhance(DoorsRegisterScreen);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  kpiSection: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  kpiRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  kpiItem: {
    alignItems: 'center',
  },
  kpiValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
  },
  kpiLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  searchContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    position: 'relative',
  },
  searchInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingRight: 40,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
  },
  clearButton: {
    position: 'absolute',
    right: 20,
    top: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearText: {
    fontSize: 18,
    color: '#999',
    fontWeight: '600',
  },
  filtersContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filtersContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    height: 40, // Fixed height instead of minHeight
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterChipActive: {
    backgroundColor: '#007AFF',
    borderColor: 'transparent',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  filterTextActive: {
    color: '#fff',
    fontWeight: '500', // Keep same weight to prevent size change
  },
  listContent: {
    padding: 12,
  },
  packageCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardHeaderLeft: {
    flex: 1,
  },
  editButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 18,
    marginLeft: 8,
  },
  editIcon: {
    fontSize: 18,
  },
  doorsId: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2196F3',
    marginBottom: 6,
  },
  badges: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  priorityBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  equipmentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  equipmentInfo: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
  },
  complianceSection: {
    marginBottom: 12,
  },
  complianceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  complianceLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  compliancePercentage: {
    fontSize: 18,
    fontWeight: '700',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  complianceDetail: {
    fontSize: 12,
    color: '#666',
  },
  categoryBreakdown: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 8,
  },
  breakdownItem: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  footerInfo: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  loadDemoButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  loadDemoButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  clearDataButton: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#FFB74D',
  },
  clearDataButtonText: {
    color: '#F57C00',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});
