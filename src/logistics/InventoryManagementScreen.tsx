import React, { useState, useEffect } from 'react';
import { logger } from '../services/LoggingService';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { useLogistics } from './context/LogisticsContext';
import { InventoryItem, InventoryLocation } from '../services/InventoryOptimizationService';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import { EmptyState } from '../components/common/EmptyState';
import { OfflineIndicator } from '../components/common/OfflineIndicator';
import { useDebounce } from '../utils/performance';
import { useAccessibility } from '../utils/accessibility';

// Import all inventory components
import {
  ViewModeTabs,
  StatCards,
  FiltersBar,
  OverviewSection,
  LocationsView,
  TransfersView,
  AnalyticsSection,
} from './inventory/components';

// Import all inventory hooks
import {
  useInventoryData,
  useInventoryFilters,
  useInventoryStats,
} from './inventory/hooks';

// Import types
import { ViewMode, StatusFilter, ABCFilter } from './inventory/utils';

/**
 * InventoryManagementScreen (Week 5 - Enhanced & Refactored)
 *
 * Multi-location inventory management with:
 * - ABC analysis for prioritization
 * - Multi-location tracking and valuation
 * - Stock transfers between locations
 * - Inventory health monitoring
 * - EOQ and safety stock recommendations
 *
 * Refactored in Phase 1-5:
 * - Phase 1: Utils & Constants
 * - Phase 2: Data Hooks
 * - Phase 3: Small Components
 * - Phase 4: Major Components
 * - Phase 5: Integration (this file)
 */

const InventoryManagementScreen = () => {
  const {
    selectedProjectId,
    isOffline,
    pendingSyncCount,
    triggerSync,
  } = useLogistics();
  const { announce } = useAccessibility();

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [abcFilter, setAbcFilter] = useState<ABCFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Debounce search for performance (300ms delay)
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Data hooks
  const {
    items,
    locations,
    transfers,
    inventoryHealth,
    loading,
    refreshing,
    refresh,
  } = useInventoryData();

  // Filter items using debounced search
  const filteredItems = useInventoryFilters(
    items,
    statusFilter,
    'all', // locationFilter - currently not used in UI
    abcFilter,
    debouncedSearchQuery
  );

  // Announce search results for accessibility
  useEffect(() => {
    if (debouncedSearchQuery && !loading) {
      announce(`Found ${filteredItems.length} items matching "${debouncedSearchQuery}"`);
    }
  }, [filteredItems.length, debouncedSearchQuery, loading, announce]);

  // Calculate statistics
  const stats = useInventoryStats(items);

  // Refresh handler
  const handleRefresh = () => {
    logger.info('[Inventory] Refreshing data...');
    refresh();
  };

  // Item selection handler
  const handleItemPress = (item: InventoryItem) => {
    logger.info('[Inventory] Item selected:', { itemId: item.id, name: item.materialName });
    // TODO: Show item details modal or navigate to detail screen
  };

  // Location selection handler
  const handleLocationPress = (location: InventoryLocation) => {
    logger.info('[Inventory] Location selected:', { locationId: location.id, name: location.name });
    // TODO: Show location details modal or navigate to detail screen
  };

  // View mode tabs badge counts
  const badges = {
    overview: stats.lowStock + stats.outOfStock,
    locations: locations.length,
    transfers: transfers.filter(t => t.status === 'requested').length,
  };

  // Empty state rendering for overview mode
  const renderOverviewEmptyState = () => {
    const hasNoData = items.length === 0;
    const hasSearchQuery = debouncedSearchQuery.length > 0;
    const hasFilter = statusFilter !== 'all' || abcFilter !== 'all';
    const noFilteredResults = filteredItems.length === 0;

    // No data at all
    if (hasNoData) {
      return (
        <EmptyState
          icon="package-variant"
          title="No Inventory Items"
          message="Start tracking inventory by adding your first item."
          helpText="Inventory items can be linked to BOM requirements and purchase orders."
          actionText="Add Item"
          onAction={() => {
            logger.info('[Inventory] Add item action pressed');
            // TODO: Open add item dialog
          }}
        />
      );
    }

    // No search results
    if (hasSearchQuery && noFilteredResults) {
      return (
        <EmptyState
          icon="magnify"
          title="No Items Found"
          message={`No items match "${debouncedSearchQuery}"`}
          variant="search"
          actionText="Clear Search"
          onAction={() => setSearchQuery('')}
        />
      );
    }

    // No filter results
    if (hasFilter && noFilteredResults) {
      const filterDesc = statusFilter !== 'all' ? statusFilter : abcFilter;
      return (
        <EmptyState
          icon="filter-off"
          title={`No ${filterDesc.charAt(0).toUpperCase() + filterDesc.slice(1)} Items`}
          message="Try selecting a different filter or remove filters."
          actionText="Clear Filters"
          onAction={() => {
            setStatusFilter('all');
            setAbcFilter('all');
          }}
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
        <Text style={styles.loadingText}>Loading inventory...</Text>
      </View>
    );
  }

  // Main render
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
        <Text style={styles.title}>Inventory Management</Text>
        <Text style={styles.subtitle}>Multi-location optimization & ABC analysis</Text>
      </View>

      {/* Statistics Cards */}
      <StatCards stats={stats} />

      {/* View Mode Tabs */}
      <ViewModeTabs
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        badges={badges}
      />

      {/* Filters (only show in overview mode) */}
      {viewMode === 'overview' && (
        <FiltersBar
          searchQuery={searchQuery}
          statusFilter={statusFilter}
          abcFilter={abcFilter}
          onSearchChange={setSearchQuery}
          onStatusFilterChange={setStatusFilter}
          onABCFilterChange={setAbcFilter}
        />
      )}

      {/* Content based on view mode */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {viewMode === 'overview' && (
          renderOverviewEmptyState() || (
            <OverviewSection items={filteredItems} onItemPress={handleItemPress} />
          )
        )}
        {viewMode === 'locations' && (
          <LocationsView
            locations={locations}
            items={items}
            onLocationPress={handleLocationPress}
          />
        )}
        {viewMode === 'transfers' && (
          <TransfersView transfers={transfers} />
        )}
        {viewMode === 'analytics' && (
          <AnalyticsSection
            inventoryHealth={inventoryHealth}
            items={items}
            totalValue={stats.totalValue}
          />
        )}
      </ScrollView>
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
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
});

// ============================================================================
// EXPORT WITH ERROR BOUNDARY
// ============================================================================

const InventoryManagementScreenWithBoundary = () => (
  <ErrorBoundary name="Logistics - Inventory Management">
    <InventoryManagementScreen />
  </ErrorBoundary>
);

export default InventoryManagementScreenWithBoundary;
