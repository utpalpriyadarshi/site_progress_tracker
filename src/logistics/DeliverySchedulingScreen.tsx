import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TextInput,
  RefreshControl,
} from 'react-native';
import { useLogistics } from './context/LogisticsContext';
import { DeliverySchedule, RouteOptimization } from '../services/DeliverySchedulingService';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import { EmptyState } from '../components/common/EmptyState';
import { OfflineIndicator } from '../components/common/OfflineIndicator';
import { useDebounce } from '../utils/performance';
import { useAccessibility } from '../utils/accessibility';
import {
  ViewModeTabs,
  StatCards,
  StatusFilterChips,
  ScheduleView,
  TrackingView,
  RoutesView,
  PerformanceView,
  DeliveryDetailsModal,
} from './delivery-scheduling/components';
import { useDeliveryData, useDeliveryFilters } from './delivery-scheduling/hooks';
import { ViewMode } from './delivery-scheduling/utils/deliveryConstants';

/**
 * DeliverySchedulingScreen (Week 4 - Enhanced)
 *
 * Smart delivery scheduling with:
 * - Just-in-time delivery optimization
 * - Real-time tracking and status
 * - Route optimization
 * - Site readiness validation
 * - Exception management
 * - Performance analytics
 */

const DeliverySchedulingScreen = () => {
  const {
    selectedProjectId,
    isOffline,
    pendingSyncCount,
    triggerSync,
  } = useLogistics();
  const { announce } = useAccessibility();

  // View mode state
  const [viewMode, setViewMode] = useState<ViewMode>('schedule');

  // Modal state
  const [selectedDelivery, setSelectedDelivery] = useState<DeliverySchedule | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<RouteOptimization | null>(null);

  // Local search state for debouncing
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(localSearchQuery, 300);

  // Data hooks
  const {
    loading,
    refreshing,
    deliveries,
    routes,
    exceptions,
    performance,
    stats,
    handleRefresh,
  } = useDeliveryData();

  // Filter hooks - use debounced search
  const {
    statusFilter,
    setStatusFilter,
    searchQuery,
    setSearchQuery,
    filteredDeliveries,
  } = useDeliveryFilters(deliveries, selectedProjectId);

  // Sync debounced search to filter hook
  useEffect(() => {
    setSearchQuery(debouncedSearchQuery);
  }, [debouncedSearchQuery, setSearchQuery]);

  // Announce search results for accessibility
  useEffect(() => {
    if (debouncedSearchQuery && !loading) {
      announce(`Found ${filteredDeliveries.length} deliveries matching "${debouncedSearchQuery}"`);
    }
  }, [filteredDeliveries.length, debouncedSearchQuery, loading, announce]);

  // Handlers
  const handleDeliveryPress = (delivery: DeliverySchedule) => {
    setSelectedDelivery(delivery);
    setShowDetailsModal(true);
  };

  const handleCloseModal = () => {
    setShowDetailsModal(false);
    setSelectedDelivery(null);
  };

  // Empty state rendering for schedule view
  const renderScheduleEmptyState = () => {
    const hasNoData = deliveries.length === 0;
    const hasSearchQuery = debouncedSearchQuery.length > 0;
    const hasFilter = statusFilter !== 'all';
    const noFilteredResults = filteredDeliveries.length === 0;

    // No deliveries at all
    if (hasNoData) {
      return (
        <EmptyState
          icon="truck-delivery-outline"
          title="No Deliveries Scheduled"
          message="Schedule your first delivery to start tracking."
          helpText="Deliveries can be linked to purchase orders and material requirements."
          actionText="Schedule Delivery"
          onAction={() => {
            // TODO: Open schedule delivery dialog
          }}
        />
      );
    }

    // No search results
    if (hasSearchQuery && noFilteredResults) {
      return (
        <EmptyState
          icon="magnify"
          title="No Deliveries Found"
          message={`No deliveries match "${debouncedSearchQuery}"`}
          variant="search"
          actionText="Clear Search"
          onAction={() => setLocalSearchQuery('')}
        />
      );
    }

    // No filter results
    if (hasFilter && noFilteredResults) {
      return (
        <EmptyState
          icon="filter-off"
          title={`No ${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1).replace('_', ' ')} Deliveries`}
          message="Try selecting a different status filter."
          actionText="Clear Filter"
          onAction={() => setStatusFilter('all')}
        />
      );
    }

    return null;
  };

  // Loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

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
        <Text style={styles.title}>Delivery Scheduling</Text>
        <Text style={styles.subtitle}>Smart scheduling & real-time tracking</Text>
      </View>

      {/* Statistics Cards */}
      <StatCards stats={stats} />

      {/* View Mode Tabs */}
      <ViewModeTabs
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        scheduledCount={stats.scheduled}
        inTransitCount={stats.inTransit}
        routesCount={routes.length}
      />

      {/* Search and Filters (Only for schedule view) */}
      {viewMode === 'schedule' && (
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search deliveries..."
            value={localSearchQuery}
            onChangeText={setLocalSearchQuery}
          />
          <StatusFilterChips
            selectedFilter={statusFilter}
            onFilterChange={setStatusFilter}
          />
        </View>
      )}

      {/* Content Views */}
      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {viewMode === 'schedule' && (
          renderScheduleEmptyState() || (
            <ScheduleView deliveries={filteredDeliveries} onDeliveryPress={handleDeliveryPress} />
          )
        )}
        {viewMode === 'tracking' && <TrackingView deliveries={deliveries} />}
        {viewMode === 'routes' && <RoutesView routes={routes} />}
        {viewMode === 'performance' && (
          <PerformanceView performance={performance} exceptions={exceptions} />
        )}
      </ScrollView>

      {/* Delivery Details Modal */}
      <DeliveryDetailsModal
        delivery={selectedDelivery}
        visible={showDetailsModal}
        onClose={handleCloseModal}
      />
    </View>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchInput: {
    height: 40,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  content: {
    flex: 1,
  },
});

// Wrap with ErrorBoundary for graceful error handling
const DeliverySchedulingScreenWithBoundary = () => (
  <ErrorBoundary name="Logistics - DeliverySchedulingScreen">
    <DeliverySchedulingScreen />
  </ErrorBoundary>
);

export default DeliverySchedulingScreenWithBoundary;
