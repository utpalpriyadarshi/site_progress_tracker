import React, { useContext } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { Text, Appbar } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useSiteContext } from '../context/SiteContext';
import { useAuth } from '../../auth/AuthContext';
import { useDashboardData } from './hooks/useDashboardData';
import { MetricCard } from './components/MetricCard';
import { QuickActionButton } from './components/QuickActionButton';
import { AlertsSection } from './components/AlertsSection';
import { EmptyState, SupervisorHeader } from '../../components/common';

/**
 * DashboardScreen Component
 *
 * Overview screen showing KPIs, quick actions, and alerts
 * Part of Phase 3 - Task 3.1: Navigation UX Restructure
 */
const DashboardScreen: React.FC = () => {
  const { supervisorId } = useSiteContext();
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const { metrics, alerts, loading, error, refresh } = useDashboardData(supervisorId);

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  if (error) {
    return (
      <View style={styles.container}>
        <SupervisorHeader
          title="Dashboard"
          rightActions={
            <Appbar.Action icon="refresh" onPress={refresh} />
          }
        />
        <EmptyState
          icon="alert-circle-outline"
          title="Error Loading Dashboard"
          message={error || 'Failed to load dashboard data. Please try again.'}
          variant="error"
          actionText="Retry"
          onAction={refresh}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SupervisorHeader
        title="Dashboard"
        rightActions={
          <Appbar.Action
            icon="refresh"
            onPress={refresh}
            disabled={loading}
            color="#fff"
          />
        }
      />

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} />
        }
      >
        {/* Header Section */}
        <View style={styles.header}>
          <Text variant="bodyLarge" style={styles.dateText}>
            {currentDate}
          </Text>
          <Text variant="headlineSmall" style={styles.greeting}>
            Welcome, {user?.fullName || user?.username || 'Supervisor'}!
          </Text>
        </View>

        {/* KPI Metrics Grid (2x2) */}
        <View style={styles.metricsGrid}>
          <MetricCard
            title="Active Sites"
            value={metrics?.activeSites || 0}
            icon="location-city"
            color="#1976d2"
            loading={loading}
            onPress={() => navigation.navigate('Sites')}
          />
          <MetricCard
            title="Today's Progress"
            value={metrics?.todayProgress || 0}
            icon="trending-up"
            color="#388e3c"
            loading={loading}
            onPress={() => navigation.navigate('DailyWork')}
          />
        </View>

        <View style={styles.metricsGrid}>
          <MetricCard
            title="Pending Items"
            value={metrics?.pendingItems || 0}
            icon="pending-actions"
            color="#f57c00"
            loading={loading}
            onPress={() => navigation.navigate('Items')}
          />
          <MetricCard
            title="Reports Submitted"
            value={metrics?.reportsSubmitted || 0}
            icon="description"
            color="#7b1fa2"
            loading={loading}
            onPress={() => navigation.navigate('History')}
          />
        </View>

        {/* Quick Actions Section */}
        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Quick Actions
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.quickActionsContainer}
          >
            <QuickActionButton
              icon="today"
              label="Update Progress"
              color="#388e3c"
              onPress={() => navigation.navigate('DailyWork')}
            />
            <QuickActionButton
              icon="fact-check"
              label="Site Inspection"
              color="#1976d2"
              onPress={() => navigation.navigate('Inspection')}
            />
            <QuickActionButton
              icon="report-problem"
              label="Report Issue"
              color="#d32f2f"
              onPress={() => navigation.navigate('Issues')}
            />
            <QuickActionButton
              icon="history"
              label="Report History"
              color="#f57c00"
              onPress={() => navigation.navigate('History')}
            />
            <QuickActionButton
              icon="inventory"
              label="Materials"
              color="#7b1fa2"
              onPress={() => navigation.navigate('Materials')}
            />
          </ScrollView>
        </View>

        {/* Alerts Section */}
        {alerts.length > 0 && (
          <AlertsSection
            alerts={alerts}
            onAlertPress={(alert) => {
              // Navigate to relevant screen based on alert type
              if (alert.id === 'exceeding-items' || alert.id === 'many-pending-items') {
                navigation.navigate('Items');
              }
            }}
          />
        )}

        {/* Empty State */}
        {!loading && metrics &&
         metrics.activeSites === 0 &&
         metrics.pendingItems === 0 && (
          <View style={styles.emptyStateContainer}>
            <EmptyState
              icon="rocket-launch-outline"
              title="Welcome to Your Dashboard"
              message="Get started by setting up your construction sites and work items to track progress and manage your projects."
              helpText="Your dashboard provides a quick overview of active sites, daily progress, pending items, and submitted reports."
              tips={[
                'Create sites from the Sites tab',
                'Add work items to track construction activities',
                'Update daily progress to see real-time metrics',
              ]}
              variant="large"
              actionText="Manage Sites"
              onAction={() => navigation.navigate('Sites')}
              secondaryActionText="Manage Items"
              onSecondaryAction={() => navigation.navigate('Items')}
            />
          </View>
        )}

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  dateText: {
    color: '#666',
  },
  greeting: {
    fontWeight: 'bold',
    marginTop: 4,
  },
  metricsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    marginHorizontal: 16,
    marginBottom: 12,
    fontWeight: 'bold',
  },
  quickActionsContainer: {
    paddingHorizontal: 8,
  },
  emptyStateContainer: {
    marginTop: 32,
    paddingHorizontal: 16,
  },
  bottomSpacing: {
    height: 24,
  },
});

export default DashboardScreen;
