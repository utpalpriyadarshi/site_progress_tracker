/**
 * ManagerDashboard
 *
 * Main dashboard component for the Manager role featuring
 * modular, refreshable widgets with real database data.
 *
 * @version 1.0.0
 * @since Manager Phase 3
 */

import React, { useCallback, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useManagerContext } from '../context/ManagerContext';
import { EmptyState } from '../../components/common/EmptyState';
import {
  KPIOverviewWidget,
  EngineeringProgressWidget,
  SiteProgressWidget,
  KeyDateProgressWidget,
  EquipmentMaterialsWidget,
  FinancialSummaryWidget,
  TestingCommissioningWidget,
  HandoverStatusWidget,
} from './widgets';

// ==================== Types ====================

interface ManagerDashboardProps {
  onNavigateToSites?: () => void;
  onNavigateToEngineering?: () => void;
  onNavigateToFinancials?: () => void;
  onNavigateToBom?: () => void;
  onNavigateToTesting?: () => void;
  onNavigateToHandover?: () => void;
}

// ==================== Component ====================

export const ManagerDashboard: React.FC<ManagerDashboardProps> = ({
  onNavigateToSites,
  onNavigateToEngineering,
  onNavigateToFinancials,
  onNavigateToBom,
  onNavigateToTesting,
  onNavigateToHandover,
}) => {
  const theme = useTheme();
  const { projectId, projectName } = useManagerContext();
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    // Increment key to force all widgets to refresh
    setRefreshKey(prev => prev + 1);
    // Small delay to show refresh indicator
    await new Promise<void>(resolve => setTimeout(() => resolve(), 500));
    setRefreshing(false);
  }, []);

  // No project assigned state
  if (!projectId) {
    return (
      <EmptyState
        icon="briefcase-off-outline"
        title="No Project Assigned"
        message="You haven't been assigned to any project yet. Contact your administrator to get started."
        helpText="Once assigned, you'll see your project dashboard with all KPIs, site progress, and financial data."
        tips={[
          'Project assignment is managed by administrators',
          'You can view multiple projects if assigned to more than one',
          'All your project data will sync automatically',
        ]}
        variant="large"
      />
    );
  }

  return (
    <ScrollView
      style={styles.container}
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
      accessibilityLabel={`Manager dashboard for project ${projectName || 'Unknown'}`}
    >
      {/* Project Header */}
      <View style={styles.header}>
        <Text variant="titleLarge" style={styles.projectName}>
          {projectName || 'Project Dashboard'}
        </Text>
        <Text variant="bodySmall" style={styles.headerSubtext}>
          Pull down to refresh all widgets
        </Text>
      </View>

      {/* Dashboard Widgets */}
      <View style={styles.widgetsContainer} key={refreshKey}>
        {/* Row 1: KPI Overview */}
        <KPIOverviewWidget />

        {/* Row 2: Site Progress */}
        <SiteProgressWidget />

        {/* Row 3: Key Date Progress (design vs activities split) */}
        <KeyDateProgressWidget />

        {/* Row 4: Engineering Progress */}
        <EngineeringProgressWidget />

        {/* Row 4: Equipment & Materials */}
        <EquipmentMaterialsWidget />

        {/* Row 5: Financial Summary */}
        <FinancialSummaryWidget />

        {/* Row 6: Testing & Commissioning */}
        <TestingCommissioningWidget />

        {/* Row 7: Handover Status */}
        <HandoverStatusWidget />
      </View>
    </ScrollView>
  );
};

// ==================== Styles ====================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    color: '#333',
    textAlign: 'center',
    marginBottom: 12,
  },
  emptyMessage: {
    color: '#666',
    textAlign: 'center',
  },
});

export default ManagerDashboard;
