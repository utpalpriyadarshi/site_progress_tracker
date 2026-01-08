import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useAdminContext } from './context/AdminContext';
import { useNavigation } from '@react-navigation/native';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import {
  DashboardHeader,
  StatCard,
  RoleSwitcherCard,
  ManagementCard,
  PasswordMigrationCard,
  CategoryMigrationCard,
  DatabaseResetCard,
} from './dashboard/components';
import { useAdminDashboard } from './dashboard/hooks';

const AdminDashboardScreen = () => {
  const { selectedRole, setSelectedRole } = useAdminContext();
  const navigation = useNavigation();

  // Consolidated dashboard hook (replaces 5 individual hooks)
  const {
    stats,
    reloadStats,
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

  // Navigation handlers
  const handleManageProjects = () => {
    navigation.navigate('ProjectManagement' as any);
  };

  const handleManageUsers = () => {
    navigation.navigate('RoleManagement' as any);
  };

  return (
    <ScrollView style={styles.container}>
      <DashboardHeader />

      <RoleSwitcherCard
        selectedRole={selectedRole}
        menuVisible={menuVisible}
        onMenuToggle={setMenuVisible}
        onRoleSelect={handleRoleSwitch}
      />

      {/* Statistics Cards */}
      <View style={styles.statsContainer}>
        <StatCard value={stats.totalProjects} label="Total Projects" />
        <StatCard value={stats.totalSites} label="Total Sites" />
      </View>

      <View style={styles.statsContainer}>
        <StatCard value={stats.totalUsers} label="Total Users" />
        <StatCard value={stats.totalItems} label="Total Items" />
      </View>

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

      <DatabaseResetCard onReset={handleDatabaseReset} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    marginBottom: 10,
  },
});

// Wrap with ErrorBoundary for graceful error handling
const AdminDashboardScreenWithBoundary = () => (
  <ErrorBoundary name="AdminDashboardScreen">
    <AdminDashboardScreen />
  </ErrorBoundary>
);

export default AdminDashboardScreenWithBoundary;
