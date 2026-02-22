import React, { useState, useMemo, useEffect } from 'react';
import { logger } from '../services/LoggingService';

import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { database } from '../../models/database';
import RfqModel from '../../models/RfqModel';
import DoorsPackageModel from '../../models/DoorsPackageModel';
import { Q } from '@nozbe/watermelondb';
import withObservables from '@nozbe/with-observables';
import { useAuth } from '../auth/AuthContext';
import RfqService from '../services/RfqService';
import { createRfqsDemoData, clearRfqDemoData } from '../utils/demoData/RfqSeeder';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import { OfflineIndicator } from '../components/common/OfflineIndicator';
import { useDebounce } from '../utils/performance';
import { useAccessibility } from '../utils/accessibility';
import { useLogistics } from './context/LogisticsContext';
import { useFlatListProps } from '../hooks/useFlatListProps';

/**
 * RFQ List Screen
 *
 * Displays all RFQs (Request for Quotations) with filtering and search
 * Allows navigation to RFQ details and creation of new RFQs
 *
 * Phase 3: Activity 4 - Days 5-7
 */

type RfqStatus = 'draft' | 'issued' | 'quotes_received' | 'evaluated' | 'awarded' | 'cancelled';

interface RfqListScreenProps {
  navigation: any;
  rfqs: RfqModel[];
}

const RfqListScreen: React.FC<RfqListScreenProps> = ({ navigation, rfqs }) => {
  const { user } = useAuth();
  const { announce } = useAccessibility();
  const { isOffline, pendingSyncCount, triggerSync } = useLogistics();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'all' | RfqStatus>('all');
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const flatListProps = useFlatListProps<RfqModel>();

  // Debounce search for performance (300ms delay)
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Force refresh when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      logger.info('[RfqList] Screen focused, refreshing data');
      setRefreshKey((prev) => prev + 1);
    }, [])
  );

  // Filter RFQs based on search and filters
  const filteredRfqs = useMemo(() => {
    let filtered = [...rfqs];

    // Search filter - use debounced value
    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase();
      filtered = filtered.filter(
        (rfq) =>
          rfq.rfqNumber.toLowerCase().includes(query) ||
          rfq.title.toLowerCase().includes(query) ||
          rfq.doorsId.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter((rfq) => rfq.status === selectedStatus);
    }

    // Sort by created date (newest first)
    filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return filtered;
  }, [rfqs, debouncedSearchQuery, selectedStatus, refreshKey]);

  // Announce search results for accessibility
  useEffect(() => {
    if (debouncedSearchQuery && !loading) {
      announce(`Found ${filteredRfqs.length} RFQs matching "${debouncedSearchQuery}"`);
    }
  }, [filteredRfqs.length, debouncedSearchQuery, loading, announce]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = rfqs.length;
    const draft = rfqs.filter((r) => r.status === 'draft').length;
    const issued = rfqs.filter((r) => r.status === 'issued').length;
    const quotesReceived = rfqs.filter((r) => r.status === 'quotes_received').length;
    const evaluated = rfqs.filter((r) => r.status === 'evaluated').length;
    const awarded = rfqs.filter((r) => r.status === 'awarded').length;
    const cancelled = rfqs.filter((r) => r.status === 'cancelled').length;

    const totalQuotes = rfqs.reduce((sum, r) => sum + r.totalQuotesReceived, 0);
    const avgQuotesPerRfq = total > 0 ? Math.round((totalQuotes / total) * 10) / 10 : 0;

    return {
      total,
      draft,
      issued,
      quotesReceived,
      evaluated,
      awarded,
      cancelled,
      avgQuotesPerRfq,
    };
  }, [rfqs, refreshKey]);

  // Get status color
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'draft':
        return '#6B7280'; // Gray
      case 'issued':
        return '#3B82F6'; // Blue
      case 'quotes_received':
        return '#06B6D4'; // Cyan
      case 'evaluated':
        return '#8B5CF6'; // Purple
      case 'awarded':
        return '#10B981'; // Green
      case 'cancelled':
        return '#EF4444'; // Red
      default:
        return '#6B7280';
    }
  };

  // Format date
  const formatDate = (timestamp: number | undefined): string => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  // Handle load demo data
  const handleLoadDemoData = async () => {
    try {
      setLoading(true);

      // Get first project
      const projects = await database.collections.get('projects').query().fetch();
      if (projects.length === 0) {
        Alert.alert('Error', 'No projects found. Please create a project first.');
        return;
      }

      const projectId = projects[0].id;
      const userId = user?.userId || 'demo-user';

      await createRfqsDemoData(projectId, userId);

      setRefreshKey((prev) => prev + 1);
      Alert.alert('Success', 'RFQ demo data loaded successfully!');
    } catch (error) {
      logger.error('[RfqList] Error loading demo data:', error as Error);
      Alert.alert('Error', 'Failed to load demo data');
    } finally {
      setLoading(false);
    }
  };

  // Handle clear all data
  const handleClearAllData = () => {
    Alert.alert(
      'Clear All RFQ Data',
      'Are you sure you want to delete all RFQs, quotes, and vendors? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await clearRfqDemoData();
              setRefreshKey((prev) => prev + 1);
              Alert.alert('Success', 'All RFQ data cleared');
            } catch (error) {
              logger.error('[RfqList] Error clearing data:', error as Error);
              Alert.alert('Error', 'Failed to clear data');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  // Render RFQ card
  const renderRfqCard = ({ item }: { item: RfqModel }) => {
    const statusColor = getStatusColor(item.status);
    const daysOpen = Math.floor((Date.now() - item.createdAt.getTime()) / (1000 * 60 * 60 * 24));

    return (
      <TouchableOpacity
        style={styles.rfqCard}
        onPress={() => navigation.navigate('RfqDetail', { rfqId: item.id })}
        activeOpacity={0.7}
      >
        {/* Header */}
        <View style={styles.rfqHeader}>
          <View style={styles.rfqHeaderLeft}>
            <Text style={styles.rfqNumber}>{item.rfqNumber}</Text>
            <View style={[styles.statusChip, { backgroundColor: statusColor }]}>
              <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
            </View>
          </View>
          <Text style={styles.daysOpen}>{daysOpen}d ago</Text>
        </View>

        {/* Title */}
        <Text style={styles.rfqTitle} numberOfLines={2}>
          {item.title}
        </Text>

        {/* DOORS ID */}
        <Text style={styles.doorsId}>DOORS: {item.doorsId}</Text>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{item.totalVendorsInvited}</Text>
            <Text style={styles.statLabel}>Invited</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{item.totalQuotesReceived}</Text>
            <Text style={styles.statLabel}>Quotes</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {item.closingDate ? formatDate(item.closingDate) : 'N/A'}
            </Text>
            <Text style={styles.statLabel}>Closing</Text>
          </View>
        </View>

        {/* Award info if awarded */}
        {item.status === 'awarded' && item.awardedValue && (
          <View style={styles.awardBanner}>
            <Text style={styles.awardText}>
              ✓ Awarded: ₹{(item.awardedValue / 100000).toFixed(2)}L
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // Render status filter pill
  const renderStatusPill = (status: 'all' | RfqStatus, label: string, count: number) => {
    const isSelected = selectedStatus === status;
    return (
      <TouchableOpacity
        style={[styles.filterPill, isSelected && styles.filterPillActive]}
        onPress={() => setSelectedStatus(status)}
        activeOpacity={0.7}
      >
        <Text style={[styles.filterPillText, isSelected && styles.filterPillTextActive]}>
          {label} ({count})
        </Text>
      </TouchableOpacity>
    );
  };

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>📋</Text>
      <Text style={styles.emptyTitle}>No RFQs Found</Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery
          ? 'Try adjusting your search filters'
          : 'Create your first RFQ from a DOORS package'}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Offline Indicator */}
      <OfflineIndicator
        isOnline={!isOffline}
        pendingCount={pendingSyncCount}
        onSync={triggerSync}
        showWhenPending={true}
      />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>RFQs</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.demoButton}
            onPress={handleLoadDemoData}
            activeOpacity={0.7}
            disabled={loading}
          >
            <Text style={styles.demoButtonText}>Load Demo</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.clearButton}
            onPress={handleClearAllData}
            activeOpacity={0.7}
            disabled={loading}
          >
            <Text style={styles.clearButtonText}>Clear All</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => navigation.navigate('RfqCreate')}
            activeOpacity={0.7}
          >
            <Text style={styles.createButtonText}>+ Create RFQ</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Statistics Cards */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statCardValue}>{stats.total}</Text>
          <Text style={styles.statCardLabel}>Total RFQs</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statCardValue}>{stats.issued + stats.quotesReceived}</Text>
          <Text style={styles.statCardLabel}>Active</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statCardValue}>{stats.awarded}</Text>
          <Text style={styles.statCardLabel}>Awarded</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statCardValue}>{stats.avgQuotesPerRfq}</Text>
          <Text style={styles.statCardLabel}>Avg Quotes</Text>
        </View>
      </ScrollView>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search RFQs by number, title, or DOORS ID..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#9CA3AF"
        />
      </View>

      {/* Status Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
        {renderStatusPill('all', 'All', stats.total)}
        {renderStatusPill('draft', 'Draft', stats.draft)}
        {renderStatusPill('issued', 'Issued', stats.issued)}
        {renderStatusPill('quotes_received', 'Quotes Received', stats.quotesReceived)}
        {renderStatusPill('evaluated', 'Evaluated', stats.evaluated)}
        {renderStatusPill('awarded', 'Awarded', stats.awarded)}
      </ScrollView>

      {/* RFQ List */}
      <FlatList
        {...flatListProps}
        data={filteredRfqs}
        renderItem={renderRfqCard}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={renderEmptyState}
        refreshing={loading}
        onRefresh={() => setRefreshKey((prev) => prev + 1)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  demoButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  demoButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  clearButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  clearButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  createButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  statsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  statCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    minWidth: 100,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statCardValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  statCardLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  searchInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterPill: {
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterPillActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
  },
  listContainer: {
    padding: 16,
  },
  rfqCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  rfqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  rfqHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rfqNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginRight: 8,
  },
  statusChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  daysOpen: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  rfqTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 6,
  },
  doorsId: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E5E7EB',
  },
  awardBanner: {
    backgroundColor: '#D1FAE5',
    borderRadius: 6,
    padding: 8,
    marginTop: 12,
  },
  awardText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#065F46',
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});

// HOC to inject observable RFQs
const enhance = withObservables([], () => ({
  rfqs: database.collections.get<RfqModel>('rfqs').query().observe(),
}));

const EnhancedRfqListScreen = enhance(RfqListScreen);

// Wrap with ErrorBoundary for graceful error handling
const RfqListScreenWithBoundary = () => (
  <ErrorBoundary name="Logistics - RfqListScreen">
    <EnhancedRfqListScreen />
  </ErrorBoundary>
);

export default RfqListScreenWithBoundary;
