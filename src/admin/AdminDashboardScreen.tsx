import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Text } from 'react-native';
import { useAdminContext } from './context/AdminContext';
import { useNavigation } from '@react-navigation/native';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import TutorialModal from '../tutorial/TutorialModal';
import adminTutorialSteps from '../tutorial/adminTutorialSteps';
import TutorialService from '../services/TutorialService';
import { useAuth } from '../auth/AuthContext';
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
  const { user } = useAuth();

  // Tutorial state
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialInitialStep, setTutorialInitialStep] = useState(0);

  // Auto-show tutorial on first login
  useEffect(() => {
    const checkTutorial = async () => {
      if (!user) return;
      const shouldShow = await TutorialService.shouldShowTutorial(user.userId, 'admin');
      if (shouldShow) {
        const progress = await TutorialService.getTutorialProgress(user.userId, 'admin');
        setTutorialInitialStep(progress.currentStep);
        setShowTutorial(true);
      }
    };
    checkTutorial();
  }, [user]);

  const handleTutorialDismiss = useCallback(async () => {
    if (user) {
      await TutorialService.dismissTutorial(user.userId, 'admin', tutorialInitialStep);
    }
    setShowTutorial(false);
  }, [user, tutorialInitialStep]);

  const handleTutorialComplete = useCallback(async () => {
    if (user) {
      await TutorialService.markTutorialCompleted(user.userId, 'admin');
    }
    setShowTutorial(false);
  }, [user]);

  const handleTutorialStepChange = useCallback(async (step: number) => {
    if (user) {
      await TutorialService.markStepCompleted(user.userId, 'admin', step);
    }
  }, [user]);

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
    <>
    <View style={styles.screen}>
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

    {/* Tutorial FAB */}
    <TouchableOpacity
      style={styles.tutorialFab}
      onPress={async () => {
        if (user) await TutorialService.resetTutorial(user.userId, 'admin');
        setTutorialInitialStep(0);
        setShowTutorial(true);
      }}
      activeOpacity={0.8}
    >
      <Text style={styles.tutorialFabText}>?</Text>
    </TouchableOpacity>
    </View>

    {/* Tutorial Modal */}
    <TutorialModal
      visible={showTutorial}
      steps={adminTutorialSteps}
      initialStep={tutorialInitialStep}
      onDismiss={handleTutorialDismiss}
      onComplete={handleTutorialComplete}
      onStepChange={handleTutorialStepChange}
    />
    </>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  bottomPadding: {
    height: 80, // Extra space so FAB doesn't overlap last card
  },
  tutorialFab: {
    position: 'absolute',
    bottom: 24,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1565C0',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  tutorialFabText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
    lineHeight: 26,
  },
});

// Wrap with ErrorBoundary for graceful error handling
const AdminDashboardScreenWithBoundary = () => (
  <ErrorBoundary name="AdminDashboardScreen">
    <AdminDashboardScreen />
  </ErrorBoundary>
);

export default AdminDashboardScreenWithBoundary;
