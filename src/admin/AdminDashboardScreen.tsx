import React from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useAdminContext } from './context/AdminContext';
import { useNavigation } from '@react-navigation/native';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import {
  RoleSwitcherCard,
  ManagementCard,
  PasswordMigrationCard,
  CategoryMigrationCard,
  DatabaseResetCard,
  DatabaseBackupCard,
  DemoDataCard,
} from './dashboard/components';
import {
  SystemHealthWidget,
  UserActivityWidget,
  SyncStatusWidget,
  QuickStatsWidget,
} from './dashboard/widgets';
import { useAdminDashboard, useWidgetData } from './dashboard/hooks';

/**
 * AdminDashboardScreen Component
 *
 * Main dashboard for Admin role with:
 * - System health monitoring widget
 * - User activity metrics widget
 * - Sync status widget
 * - Quick stats with navigation
 * - Role switcher
 * - Management navigation cards
 * - Migration and maintenance tools
 *
 * Phase 3 - Task 3.1: Dashboard Redesign
 */
const AdminDashboardScreen = () => {
  const { selectedRole, setSelectedRole } = useAdminContext();
  const navigation = useNavigation();

  // Existing dashboard hook for role switching and migrations
  const {
    menuVisible,
    setMenuVisible,
    handleRoleSwitch,
    migrationStatus,
    isMigrating,
    handleRunMigration,
    isMigratingCategories,
    handleCategoryMigration,
    handleDatabaseReset,
  } = useAdminDashboard(selectedRole, setSelectedRole);

  // New widget data hook
  const {
    loading,
    error,
    healthStatus,
    userActivity,
    syncStatus,
    isConnected,
    quickStats,
    refresh,
    handleManualSync,
  } = useWidgetData();

  // Navigation handlers
  const handleManageProjects = () => {
    navigation.navigate('ProjectManagement' as never);
  };

  const handleManageUsers = () => {
    navigation.navigate('RoleManagement' as never);
  };

  const handleSyncMonitoring = () => {
    navigation.navigate('SyncMonitoring' as never);
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={refresh} />
      }
    >
      <RoleSwitcherCard
        selectedRole={selectedRole}
        menuVisible={menuVisible}
        onMenuToggle={setMenuVisible}
        onRoleSelect={handleRoleSwitch}
      />

      {/* System Health Widget */}
      <SystemHealthWidget
        health={healthStatus}
        loading={loading}
        error={error}
        onPress={handleSyncMonitoring}
      />

      {/* Quick Stats Widget */}
      <QuickStatsWidget
        stats={quickStats}
        loading={loading}
        error={error}
        onProjectsPress={handleManageProjects}
        onUsersPress={handleManageUsers}
      />

      {/* User Activity Widget */}
      <UserActivityWidget
        data={userActivity}
        loading={loading}
        error={error}
        onPress={handleManageUsers}
      />

      {/* Sync Status Widget */}
      <SyncStatusWidget
        data={syncStatus}
        isConnected={isConnected}
        loading={loading}
        error={error}
        onPress={handleSyncMonitoring}
        onSyncPress={handleManualSync}
      />

      {/* Management Cards */}
      <ManagementCard
        title="Project Management"
        description="Create, edit, and delete projects"
        buttonLabel="Manage Projects"
        onPress={handleManageProjects}
      />

      <ManagementCard
        title="User & Role Management"
        description="Manage users and assign roles"
        buttonLabel="Manage Users"
        onPress={handleManageUsers}
      />

      {/* Migration and Maintenance Cards */}
      <PasswordMigrationCard
        migrationStatus={migrationStatus}
        isMigrating={isMigrating}
        onMigrate={handleRunMigration}
      />

      <CategoryMigrationCard
        isMigrating={isMigratingCategories}
        onMigrate={handleCategoryMigration}
      />

      <DatabaseBackupCard />

      <DemoDataCard />

      <DatabaseResetCard onReset={handleDatabaseReset} />

      {/* Bottom padding */}
      <View style={styles.bottomPadding} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  bottomPadding: {
    height: 24,
  },
});

// Wrap with ErrorBoundary for graceful error handling
const AdminDashboardScreenWithBoundary = () => (
  <ErrorBoundary name="AdminDashboardScreen">
    <AdminDashboardScreen />
  </ErrorBoundary>
);

export default AdminDashboardScreenWithBoundary;
