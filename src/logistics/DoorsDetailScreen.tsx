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
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { database } from '../../models/database';
import DoorsPackageModel from '../../models/DoorsPackageModel';
import DoorsRequirementModel from '../../models/DoorsRequirementModel';
import { Q } from '@nozbe/watermelondb';
import withObservables from '@nozbe/with-observables';
import type {
  DoorsRequirement,
  RequirementCategory,
  ComplianceStatus,
  ReviewStatus,
} from '../../types/doors';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import { COLORS } from '../theme/colors';

/**
 * DOORS Detail Screen
 *
 * Shows detailed view of a DOORS package with:
 * - Requirements tab: All requirements with filtering
 * - Compliance tab: Category-wise compliance breakdown
 * - Documents tab: Related documents (placeholder for Phase 3)
 */

interface DoorsDetailScreenProps {
  navigation: any;
  route: any;
  doorsPackage: DoorsPackageModel;
  requirements: DoorsRequirementModel[];
}

type TabView = 'requirements' | 'compliance' | 'documents';

const DoorsDetailScreen: React.FC<DoorsDetailScreenProps> = ({
  navigation,
  route,
  doorsPackage,
  requirements,
}) => {
  const [activeTab, setActiveTab] = useState<TabView>('requirements');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<RequirementCategory | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<ComplianceStatus | 'all'>('all');
  const [selectedRequirement, setSelectedRequirement] = useState<DoorsRequirementModel | null>(null);
  const [showRequirementModal, setShowRequirementModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Force refresh when screen comes into focus (after returning from edit)
  useFocusEffect(
    React.useCallback(() => {
      logger.info('[DoorsDetail] Screen focused, refreshing data');
      setRefreshKey(prev => prev + 1);
    }, [])
  );

  // Filter requirements based on search and filters
  const filteredRequirements = useMemo(() => {
    let filtered = [...requirements];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (req) =>
          req.requirementCode.toLowerCase().includes(query) ||
          req.requirementText.toLowerCase().includes(query) ||
          (req.specificationClause && req.specificationClause.toLowerCase().includes(query))
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((req) => req.category === selectedCategory);
    }

    // Status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter((req) => req.complianceStatus === selectedStatus);
    }

    // Sort by category and code
    filtered.sort((a, b) => {
      if (a.category !== b.category) {
        return a.category.localeCompare(b.category);
      }
      return a.requirementCode.localeCompare(b.requirementCode);
    });

    return filtered;
  }, [requirements, searchQuery, selectedCategory, selectedStatus, refreshKey]);

  // Calculate category-wise compliance statistics
  const complianceStats = useMemo(() => {
    const categories: RequirementCategory[] = [
      'technical',
      'datasheet',
      'type_test',
      'routine_test',
      'site',
    ];

    return categories.map((cat) => {
      const catReqs = requirements.filter((r) => r.category === cat);
      const compliant = catReqs.filter((r) => r.complianceStatus === 'compliant').length;
      const partial = catReqs.filter((r) => r.complianceStatus === 'partial').length;
      const nonCompliant = catReqs.filter((r) => r.complianceStatus === 'non_compliant').length;
      const pending = catReqs.filter((r) => r.complianceStatus === 'pending').length;

      const percentage =
        catReqs.length > 0
          ? ((compliant + partial * 0.5) / catReqs.length) * 100
          : 0;

      return {
        category: cat,
        total: catReqs.length,
        compliant,
        partial,
        nonCompliant,
        pending,
        percentage: Math.round(percentage * 10) / 10,
      };
    });
  }, [requirements, refreshKey]);

  // Category display names
  const categoryNames: Record<RequirementCategory, string> = {
    technical: 'Technical Requirements',
    datasheet: 'Datasheet Parameters',
    type_test: 'Type Tests',
    routine_test: 'Routine Tests',
    site: 'Site Requirements',
  };

  // Status colors
  const getStatusColor = (status: ComplianceStatus): string => {
    switch (status) {
      case 'compliant':
        return COLORS.SUCCESS;
      case 'partial':
        return COLORS.WARNING;
      case 'non_compliant':
        return COLORS.ERROR;
      case 'not_verified':
      default:
        return COLORS.DISABLED;
    }
  };

  // Render requirement card
  const renderRequirementCard = ({ item }: { item: DoorsRequirementModel }) => {
    const statusColor = getStatusColor(item.complianceStatus as ComplianceStatus);

    return (
      <TouchableOpacity
        style={styles.requirementCard}
        onPress={() => {
          setSelectedRequirement(item);
          setShowRequirementModal(true);
        }}
      >
        {/* Header: Code and Status Badge */}
        <View style={styles.requirementHeader}>
          <View style={styles.requirementHeaderLeft}>
            <Text style={styles.requirementCode}>{item.requirementCode}</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
              <Text style={styles.statusBadgeText}>{item.complianceStatus}</Text>
            </View>
          </View>
          {/* Edit Icon */}
          <TouchableOpacity
            style={styles.editButton}
            onPress={(e) => {
              e.stopPropagation(); // Prevent card tap
              navigation.navigate('DoorsRequirementEdit', { requirementId: item.id });
            }}
          >
            <Text style={styles.editIcon}>✏️</Text>
          </TouchableOpacity>
        </View>

        {/* Requirement Text */}
        <Text style={styles.requirementText} numberOfLines={2}>
          {item.requirementText}
        </Text>

        {/* Clause Reference */}
        {item.specificationClause && (
          <Text style={styles.clauseReference}>{item.specificationClause}</Text>
        )}

        {/* Footer: Category and Percentage */}
        <View style={styles.requirementFooter}>
          <Text style={styles.categoryTag}>{categoryNames[item.category as RequirementCategory]}</Text>
          {item.complianceStatus !== 'pending' && (
            <Text style={[styles.compliancePercentage, { color: statusColor }]}>
              {item.compliancePercentage}%
            </Text>
          )}
        </View>

        {/* Review Status Indicator - Removed to avoid visual clutter */}
        {/* Review status is visible in the detail modal when card is tapped */}
      </TouchableOpacity>
    );
  };

  // Render compliance breakdown card
  const renderComplianceCard = (stat: {
    category: RequirementCategory;
    total: number;
    compliant: number;
    partial: number;
    nonCompliant: number;
    pending: number;
    percentage: number;
  }) => {
    const progressColor =
      stat.percentage >= 95 ? COLORS.SUCCESS : stat.percentage >= 80 ? COLORS.WARNING : COLORS.ERROR;

    return (
      <View key={stat.category} style={styles.complianceCard}>
        {/* Category Header */}
        <View style={styles.complianceHeader}>
          <Text style={styles.complianceCategoryName}>{categoryNames[stat.category]}</Text>
          <Text style={[styles.compliancePercentageLarge, { color: progressColor }]}>
            {stat.percentage}%
          </Text>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressBarContainer}>
          <View
            style={[
              styles.progressBar,
              { width: `${stat.percentage}%`, backgroundColor: progressColor },
            ]}
          />
        </View>

        {/* Breakdown Stats */}
        <View style={styles.breakdownRow}>
          <View style={styles.breakdownItem}>
            <Text style={styles.breakdownLabel}>Total</Text>
            <Text style={styles.breakdownValue}>{stat.total}</Text>
          </View>
          <View style={styles.breakdownItem}>
            <Text style={styles.breakdownLabel}>Compliant</Text>
            <Text style={[styles.breakdownValue, { color: COLORS.SUCCESS }]}>{stat.compliant}</Text>
          </View>
          <View style={styles.breakdownItem}>
            <Text style={styles.breakdownLabel}>Partial</Text>
            <Text style={[styles.breakdownValue, { color: COLORS.WARNING }]}>{stat.partial}</Text>
          </View>
          <View style={styles.breakdownItem}>
            <Text style={styles.breakdownLabel}>Non-Compliant</Text>
            <Text style={[styles.breakdownValue, { color: COLORS.ERROR }]}>
              {stat.nonCompliant}
            </Text>
          </View>
          <View style={styles.breakdownItem}>
            <Text style={styles.breakdownLabel}>Pending</Text>
            <Text style={[styles.breakdownValue, { color: COLORS.DISABLED }]}>{stat.pending}</Text>
          </View>
        </View>
      </View>
    );
  };

  // Render requirements tab
  const renderRequirementsTab = () => {
    return (
      <View style={styles.tabContent}>
        {/* Search and Filters */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search requirements..."
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

        {/* Category Filter Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterPill, selectedCategory === 'all' && styles.filterPillActive]}
            onPress={() => setSelectedCategory('all')}
          >
            <Text
              style={[styles.filterPillText, selectedCategory === 'all' && styles.filterPillTextActive]}
            >
              All ({requirements.length})
            </Text>
          </TouchableOpacity>
          {Object.entries(categoryNames).map(([key, name]) => {
            const count = requirements.filter((r) => r.category === key).length;
            return (
              <TouchableOpacity
                key={key}
                style={[styles.filterPill, selectedCategory === key && styles.filterPillActive]}
                onPress={() => setSelectedCategory(key as RequirementCategory)}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    selectedCategory === key && styles.filterPillTextActive,
                  ]}
                >
                  {name} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Status Filter Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterPill, selectedStatus === 'all' && styles.filterPillActive]}
            onPress={() => setSelectedStatus('all')}
          >
            <Text
              style={[styles.filterPillText, selectedStatus === 'all' && styles.filterPillTextActive]}
            >
              All Status
            </Text>
          </TouchableOpacity>
          {['compliant', 'partial', 'non_compliant', 'not_verified'].map((status) => (
            <TouchableOpacity
              key={status}
              style={[styles.filterPill, selectedStatus === status && styles.filterPillActive]}
              onPress={() => setSelectedStatus(status as ComplianceStatus)}
            >
              <Text
                style={[
                  styles.filterPillText,
                  selectedStatus === status && styles.filterPillTextActive,
                ]}
              >
                {status.replace('_', ' ')}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Requirements List */}
        <FlatList
          data={filteredRequirements}
          renderItem={renderRequirementCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No requirements found</Text>
            </View>
          }
        />
      </View>
    );
  };

  // Render compliance tab
  const renderComplianceTab = () => {
    return (
      <ScrollView style={styles.tabContent} contentContainerStyle={styles.complianceContent}>
        {/* Overall Package Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Overall Compliance</Text>
          <Text style={styles.summaryPercentage}>
            {doorsPackage.compliancePercentage}%
          </Text>
          <View style={styles.summaryStats}>
            <View style={styles.summaryStatItem}>
              <Text style={styles.summaryStatLabel}>Total Requirements</Text>
              <Text style={styles.summaryStatValue}>{doorsPackage.totalRequirements}</Text>
            </View>
            <View style={styles.summaryStatItem}>
              <Text style={styles.summaryStatLabel}>Compliant</Text>
              <Text style={styles.summaryStatValue}>{doorsPackage.compliantRequirements}</Text>
            </View>
            <View style={styles.summaryStatItem}>
              <Text style={styles.summaryStatLabel}>Remaining</Text>
              <Text style={styles.summaryStatValue}>
                {doorsPackage.totalRequirements - doorsPackage.compliantRequirements}
              </Text>
            </View>
          </View>
        </View>

        {/* Category-wise Breakdown */}
        <Text style={styles.sectionTitle}>Category Breakdown</Text>
        {complianceStats.map((stat) => renderComplianceCard(stat))}
      </ScrollView>
    );
  };

  // Render documents tab (placeholder)
  const renderDocumentsTab = () => {
    return (
      <View style={styles.tabContent}>
        <View style={styles.placeholderContainer}>
          <Text style={styles.placeholderIcon}>📄</Text>
          <Text style={styles.placeholderTitle}>Documents</Text>
          <Text style={styles.placeholderText}>
            Document management will be available in Phase 3
          </Text>
          <View style={styles.placeholderList}>
            <Text style={styles.placeholderItem}>• Technical Datasheets</Text>
            <Text style={styles.placeholderItem}>• Test Reports</Text>
            <Text style={styles.placeholderItem}>• Compliance Certificates</Text>
            <Text style={styles.placeholderItem}>• Vendor Submissions</Text>
          </View>
        </View>
      </View>
    );
  };

  // Render requirement detail modal
  const renderRequirementModal = () => {
    if (!selectedRequirement) return null;

    const statusColor = getStatusColor(selectedRequirement.complianceStatus as ComplianceStatus);

    return (
      <Modal
        visible={showRequirementModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowRequirementModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{selectedRequirement.requirementCode}</Text>
                <TouchableOpacity onPress={() => setShowRequirementModal(false)}>
                  <Text style={styles.modalCloseButton}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Status Badge */}
              <View style={[styles.modalStatusBadge, { backgroundColor: statusColor }]}>
                <Text style={styles.modalStatusText}>
                  {selectedRequirement.complianceStatus.replace('_', ' ')}
                </Text>
              </View>

              {/* Requirement Details */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Requirement</Text>
                <Text style={styles.modalSectionContent}>{selectedRequirement.requirementText}</Text>
              </View>

              {selectedRequirement.specificationClause && (
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Specification Clause</Text>
                  <Text style={styles.modalSectionContent}>
                    {selectedRequirement.specificationClause}
                  </Text>
                </View>
              )}

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Acceptance Criteria</Text>
                <Text style={styles.modalSectionContent}>
                  {selectedRequirement.acceptanceCriteria}
                </Text>
              </View>

              {/* Vendor Response */}
              {selectedRequirement.vendorResponse && (
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Vendor Response</Text>
                  <Text style={styles.modalSectionContent}>
                    {selectedRequirement.vendorResponse}
                  </Text>
                </View>
              )}

              {/* Review Comments */}
              {selectedRequirement.reviewComments && (
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Review Comments</Text>
                  <Text style={styles.modalSectionContent}>
                    {selectedRequirement.reviewComments}
                  </Text>
                </View>
              )}

              {/* Metadata */}
              <View style={styles.modalMetadata}>
                <View style={styles.modalMetadataRow}>
                  <Text style={styles.modalMetadataLabel}>Category:</Text>
                  <Text style={styles.modalMetadataValue}>
                    {categoryNames[selectedRequirement.category as RequirementCategory]}
                  </Text>
                </View>
                <View style={styles.modalMetadataRow}>
                  <Text style={styles.modalMetadataLabel}>Verification:</Text>
                  <Text style={styles.modalMetadataValue}>
                    {selectedRequirement.verificationMethod}
                  </Text>
                </View>
                <View style={styles.modalMetadataRow}>
                  <Text style={styles.modalMetadataLabel}>Review Status:</Text>
                  <Text style={styles.modalMetadataValue}>
                    {selectedRequirement.reviewStatus}
                  </Text>
                </View>
                {selectedRequirement.compliancePercentage != null && selectedRequirement.compliancePercentage > 0 && (
                  <View style={styles.modalMetadataRow}>
                    <Text style={styles.modalMetadataLabel}>Compliance:</Text>
                    <Text style={[styles.modalMetadataValue, { color: statusColor }]}>
                      {selectedRequirement.compliancePercentage}%
                    </Text>
                  </View>
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      {/* Package Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.doorsId}>{doorsPackage.doorsId}</Text>
        <Text style={styles.equipmentName}>{doorsPackage.equipmentName}</Text>
        <View style={styles.headerBadges}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>{doorsPackage.category}</Text>
          </View>
          <View style={styles.priorityBadge}>
            <Text style={styles.priorityBadgeText}>{doorsPackage.priority}</Text>
          </View>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'requirements' && styles.tabActive]}
          onPress={() => setActiveTab('requirements')}
        >
          <Text style={[styles.tabText, activeTab === 'requirements' && styles.tabTextActive]}>
            Requirements ({requirements.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'compliance' && styles.tabActive]}
          onPress={() => setActiveTab('compliance')}
        >
          <Text style={[styles.tabText, activeTab === 'compliance' && styles.tabTextActive]}>
            Compliance
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'documents' && styles.tabActive]}
          onPress={() => setActiveTab('documents')}
        >
          <Text style={[styles.tabText, activeTab === 'documents' && styles.tabTextActive]}>
            Documents
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {activeTab === 'requirements' && renderRequirementsTab()}
      {activeTab === 'compliance' && renderComplianceTab()}
      {activeTab === 'documents' && renderDocumentsTab()}

      {/* Requirement Detail Modal */}
      {renderRequirementModal()}
    </View>
  );
};

// Observable enhancement
const enhance = withObservables(['route'], ({ route }: any) => {
  const packageId = route.params?.packageId;

  return {
    doorsPackage: database.collections
      .get<DoorsPackageModel>('doors_packages')
      .findAndObserve(packageId),
    requirements: database.collections
      .get<DoorsRequirementModel>('doors_requirements')
      .query(Q.where('doors_package_id', packageId))
      .observe(),
  };
});

const EnhancedDoorsDetailScreen = enhance(DoorsDetailScreen);

// Wrap with ErrorBoundary for graceful error handling
const DoorsDetailScreenWithBoundary = () => (
  <ErrorBoundary name="Logistics - DoorsDetailScreen">
    <EnhancedDoorsDetailScreen />
  </ErrorBoundary>
);

export default DoorsDetailScreenWithBoundary;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#FFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    marginBottom: 8,
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 16,
  },
  doorsId: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
    marginBottom: 4,
  },
  equipmentName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  headerBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryBadge: {
    backgroundColor: COLORS.INFO_BG,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryBadgeText: {
    color: '#1976D2',
    fontSize: 12,
    fontWeight: '600',
  },
  priorityBadge: {
    backgroundColor: COLORS.WARNING_BG,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityBadgeText: {
    color: '#F57C00',
    fontSize: 12,
    fontWeight: '600',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#FFF',
  },
  searchInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  clearButton: {
    position: 'absolute',
    right: 28,
    top: 28,
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
  filterRow: {
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingBottom: 12,
    maxHeight: 50,
  },
  filterPill: {
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
  filterPillActive: {
    backgroundColor: '#007AFF',
    borderColor: 'transparent',
  },
  filterPillText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  filterPillTextActive: {
    color: '#fff',
    fontWeight: '500', // Keep same weight to prevent size change
  },
  listContent: {
    padding: 16,
  },
  requirementCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  requirementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  requirementHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  requirementCode: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  editButton: {
    padding: 8,
    marginRight: -8, // Offset padding for alignment
  },
  editIcon: {
    fontSize: 18,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  requirementText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 20,
    marginBottom: 8,
  },
  clauseReference: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  requirementFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryTag: {
    fontSize: 12,
    color: '#999',
  },
  compliancePercentage: {
    fontSize: 14,
    fontWeight: '600',
  },
  approvedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: COLORS.SUCCESS,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  approvedBadgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '600',
  },
  rejectedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: COLORS.ERROR,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  rejectedBadgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  complianceContent: {
    padding: 16,
  },
  summaryCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  summaryTitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  summaryPercentage: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 16,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  summaryStatItem: {
    alignItems: 'center',
  },
  summaryStatLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  summaryStatValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  complianceCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  complianceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  complianceCategoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  compliancePercentageLarge: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  breakdownItem: {
    alignItems: 'center',
  },
  breakdownLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 4,
  },
  breakdownValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  placeholderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  placeholderIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  placeholderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  placeholderText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  placeholderList: {
    alignItems: 'flex-start',
  },
  placeholderItem: {
    fontSize: 14,
    color: '#999',
    marginBottom: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalCloseButton: {
    fontSize: 28,
    color: '#666',
    fontWeight: '300',
  },
  modalStatusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginBottom: 20,
  },
  modalStatusText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  modalSection: {
    marginBottom: 20,
  },
  modalSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
    marginBottom: 8,
  },
  modalSectionContent: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  modalMetadata: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 16,
    marginTop: 8,
  },
  modalMetadataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modalMetadataLabel: {
    fontSize: 14,
    color: '#666',
  },
  modalMetadataValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
});
