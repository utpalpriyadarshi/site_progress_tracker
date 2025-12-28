import React, { useState } from 'react';
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
  const { selectedProjectId } = useLogistics();

  // View mode state
  const [viewMode, setViewMode] = useState<ViewMode>('schedule');

  // Modal state
  const [selectedDelivery, setSelectedDelivery] = useState<DeliverySchedule | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<RouteOptimization | null>(null);

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

  // Filter hooks
  const {
    statusFilter,
    setStatusFilter,
    searchQuery,
    setSearchQuery,
    filteredDeliveries,
  } = useDeliveryFilters(deliveries, selectedProjectId);

  // Handlers
  const handleDeliveryPress = (delivery: DeliverySchedule) => {
    setSelectedDelivery(delivery);
    setShowDetailsModal(true);
  };

  const handleCloseModal = () => {
    setShowDetailsModal(false);
    setSelectedDelivery(null);
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
            value={searchQuery}
            onChangeText={setSearchQuery}
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
          <ScheduleView deliveries={filteredDeliveries} onDeliveryPress={handleDeliveryPress} />
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
