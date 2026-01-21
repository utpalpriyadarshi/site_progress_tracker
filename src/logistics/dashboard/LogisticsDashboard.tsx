/**
 * LogisticsDashboard
 *
 * Main dashboard component for the Logistics role featuring
 * modular, refreshable widgets with real database data.
 *
 * Widgets:
 * 1. InventoryStatusWidget - Stock levels, low stock alerts
 * 2. DeliveryStatusWidget - Pending, in-transit, completed
 * 3. PurchaseOrderWidget - Open POs, approval pending
 * 4. MaterialRequirementsWidget - BOM requirements, shortages
 * 5. DoorsPackageWidget - DOORS package status
 * 6. RfqStatusWidget - RFQ counts by status
 * 7. RecentActivityWidget - Last 10 logistics actions
 *
 * @version 1.0.0
 * @since Logistics Phase 3
 */

import React, { useCallback, useReducer, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useLogisticsContext } from '../context/LogisticsContext';
import { EmptyState } from '../../components/common/EmptyState';
import { OfflineIndicator } from '../../components/common/OfflineIndicator';
import { dashboardReducer, initialDashboardState } from './dashboardReducer';
import {
  InventoryStatusWidget,
  DeliveryStatusWidget,
  PurchaseOrderWidget,
  MaterialRequirementsWidget,
  DoorsPackageWidget,
  RfqStatusWidget,
  RecentActivityWidget,
} from './widgets';

// ==================== Types ====================

interface LogisticsDashboardProps {
  onNavigateToInventory?: () => void;
  onNavigateToDeliveries?: () => void;
  onNavigateToPurchaseOrders?: () => void;
  onNavigateToMaterials?: () => void;
  onNavigateToDoors?: () => void;
  onNavigateToRfq?: () => void;
}

// ==================== Component ====================

export const LogisticsDashboard: React.FC<LogisticsDashboardProps> = ({
  onNavigateToInventory,
  onNavigateToDeliveries,
  onNavigateToPurchaseOrders,
  onNavigateToMaterials,
  onNavigateToDoors,
  onNavigateToRfq,
}) => {
  const theme = useTheme();
  const {
    selectedProjectId,
    selectedProject,
    isOffline,
    pendingSyncCount,
    triggerSync,
    refresh: refreshContext,
  } = useLogisticsContext();

  const [state, dispatch] = useReducer(dashboardReducer, initialDashboardState);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    dispatch({ type: 'REFRESH_ALL' });
    await refreshContext();
    setRefreshing(false);
  }, [refreshContext]);

  // Get project name
  const projectName = selectedProject
    ? (selectedProject as any).name || 'Unknown Project'
    : null;

  // No project selected state
  if (!selectedProjectId) {
    return (
      <EmptyState
        icon="package-variant-closed"
        title="Select a Project"
        message="Choose a project to view logistics dashboard with inventory, deliveries, and procurement data."
        helpText="Projects are assigned by your administrator. Contact them if you don't see your project."
        tips={[
          'View inventory levels and stock alerts',
          'Track deliveries and purchase orders',
          'Monitor RFQ and DOORS package status',
        ]}
        variant="large"
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Offline Indicator - positioned absolutely at top */}
      <OfflineIndicator
        isOnline={!isOffline}
        pendingCount={pendingSyncCount}
        onSync={triggerSync}
        showWhenPending={true}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        accessible
        accessibilityLabel={`Logistics dashboard for project ${projectName || 'Unknown'}`}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text variant="titleLarge" style={styles.projectName}>
            {projectName || 'Logistics Dashboard'}
          </Text>
          <Text variant="bodySmall" style={styles.headerSubtext}>
            Pull down to refresh all widgets
          </Text>
        </View>

        {/* Dashboard Widgets */}
        <View style={styles.widgetsContainer} key={state.refreshKey}>
          {/* Row 1: Inventory Status */}
          <InventoryStatusWidget />

          {/* Row 2: Delivery Status */}
          <DeliveryStatusWidget />

          {/* Row 3: Purchase Orders */}
          <PurchaseOrderWidget />

          {/* Row 4: Material Requirements */}
          <MaterialRequirementsWidget />

          {/* Row 5: DOORS Packages */}
          <DoorsPackageWidget />

          {/* Row 6: RFQ Status */}
          <RfqStatusWidget />

          {/* Row 7: Recent Activity */}
          <RecentActivityWidget />
        </View>

        {/* Footer spacing */}
        <View style={styles.footer} />
      </ScrollView>
    </View>
  );
};

// ==================== Styles ====================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 24,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  projectName: {
    fontWeight: '700',
    color: '#333',
  },
  headerSubtext: {
    color: '#888',
    marginTop: 4,
  },
  widgetsContainer: {
    gap: 0,
  },
  footer: {
    height: 20,
  },
});

export default LogisticsDashboard;
