import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Card, Title, Paragraph, Menu, Button, Divider, ActivityIndicator } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAdminContext, AdminRole } from './context/AdminContext';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { database } from '../../models/database';
import PasswordMigrationService from '../../services/auth/PasswordMigrationService';
import { SimpleDatabaseService } from '../../services/db/SimpleDatabaseService';
import { migrateCategoryNames, verifyCategoryMigration } from '../../scripts/migrateCategoryNames';

type RootStackParamList = {
  Auth: undefined;
  Admin: undefined;
  Supervisor: undefined;
  Manager: undefined;
  Planning: undefined;
  Logistics: undefined;
  CommercialManager: undefined;
};

type AdminDashboardNavigationProp = StackNavigationProp<RootStackParamList, 'Admin'>;

const AdminDashboardScreen = () => {
  const { selectedRole, setSelectedRole } = useAdminContext();
  const navigation = useNavigation<AdminDashboardNavigationProp>();
  const [menuVisible, setMenuVisible] = useState(false);
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalSites: 0,
    totalUsers: 0,
    totalItems: 0,
  });
  const [migrationStatus, setMigrationStatus] = useState({
    totalUsers: 0,
    migratedUsers: 0,
    pendingUsers: 0,
    percentComplete: 0,
  });
  const [isMigrating, setIsMigrating] = useState(false);
  const [isMigratingCategories, setIsMigratingCategories] = useState(false);

  // Load statistics
  useEffect(() => {
    loadStats();
    loadMigrationStatus();
  }, []);

  const loadStats = async () => {
    try {
      const [projects, sites, users, items] = await Promise.all([
        database.collections.get('projects').query().fetch(),
        database.collections.get('sites').query().fetch(),
        database.collections.get('users').query().fetch(),
        database.collections.get('items').query().fetch(),
      ]);

      setStats({
        totalProjects: projects.length,
        totalSites: sites.length,
        totalUsers: users.length,
        totalItems: items.length,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleRoleSwitch = (role: AdminRole) => {
    setMenuVisible(false);
    if (role) {
      setSelectedRole(role);

      // Navigate to the selected role's navigator
      const roleMap: Record<NonNullable<AdminRole>, keyof RootStackParamList> = {
        Supervisor: 'Supervisor',
        Manager: 'Manager',
        Planner: 'Planning',
        Logistics: 'Logistics',
        DesignEngineer: 'DesignEngineer',
        CommercialManager: 'CommercialManager',
      };

      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: roleMap[role] }],
        })
      );
    }
  };

  const handleManageProjects = () => {
    navigation.navigate('ProjectManagement' as any);
  };

  const handleManageUsers = () => {
    navigation.navigate('RoleManagement' as any);
  };

  const loadMigrationStatus = async () => {
    try {
      const status = await PasswordMigrationService.getMigrationStatus();
      setMigrationStatus(status);
    } catch (error) {
      console.error('Error loading migration status:', error);
    }
  };

  const handleRunMigration = async () => {
    Alert.alert(
      'Migrate Passwords',
      'This will hash all plaintext passwords with bcrypt. This operation cannot be undone. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Migrate',
          style: 'destructive',
          onPress: async () => {
            setIsMigrating(true);
            try {
              const result = await PasswordMigrationService.hashAllPasswords();
              if (result.success) {
                const verification = await PasswordMigrationService.verifyMigration();
                if (verification.success) {
                  Alert.alert(
                    'Migration Successful',
                    `Migrated ${result.migratedCount} users in ${result.duration}ms. All passwords verified.`
                  );
                } else {
                  Alert.alert(
                    'Migration Warning',
                    `Migration completed but verification failed for ${verification.failedCount} users.`
                  );
                }
              } else {
                Alert.alert(
                  'Migration Failed',
                  `Failed to migrate ${result.failedCount} users. Errors: ${result.errors.join(', ')}`
                );
              }
              await loadMigrationStatus();
            } catch (error) {
              Alert.alert('Migration Error', `Failed: ${error}`);
            } finally {
              setIsMigrating(false);
            }
          },
        },
      ]
    );
  };

  const handleCategoryMigration = async () => {
    Alert.alert(
      'Migrate Category Names',
      'This will rename:\n• "Finishing" → "Handing Over"\n• "Framing" → "Punch List"\n\nExisting items will remain linked to their categories. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Migrate',
          style: 'default',
          onPress: async () => {
            setIsMigratingCategories(true);
            try {
              console.log('🔄 Starting category migration...');

              // Run migration
              await migrateCategoryNames();

              // Verify migration
              await verifyCategoryMigration();

              // Reload stats to reflect changes
              await loadStats();

              Alert.alert(
                'Migration Successful',
                'Category names have been updated successfully!\n\nNew names:\n• "Handing Over" (was "Finishing")\n• "Punch List" (was "Framing")\n\nAll items remain linked correctly.'
              );
            } catch (error) {
              console.error('❌ Category migration failed:', error);
              Alert.alert(
                'Migration Error',
                `Failed to migrate categories: ${error}\n\nCheck console for details.`
              );
            } finally {
              setIsMigratingCategories(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Title style={styles.headerTitle}>Admin Dashboard</Title>
        <Paragraph style={styles.headerSubtitle}>
          Welcome to the Administration Panel
        </Paragraph>
      </View>

      {/* Role Switcher Card */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Switch Role View</Title>
          <Paragraph style={styles.cardDescription}>
            View the app as a different role to test functionality
          </Paragraph>
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <Button
                mode="outlined"
                onPress={() => setMenuVisible(true)}
                style={styles.roleButton}
              >
                {selectedRole ? `Current: ${selectedRole}` : 'Select Role to Switch'}
              </Button>
            }
          >
            <Menu.Item
              onPress={() => handleRoleSwitch('Supervisor')}
              title="Supervisor"
            />
            <Menu.Item
              onPress={() => handleRoleSwitch('Manager')}
              title="Manager"
            />
            <Menu.Item
              onPress={() => handleRoleSwitch('Planner')}
              title="Planner"
            />
            <Menu.Item
              onPress={() => handleRoleSwitch('Logistics')}
              title="Logistics"
            />
            <Menu.Item
              onPress={() => handleRoleSwitch('DesignEngineer')}
              title="Design Engineer"
            />
            <Menu.Item
              onPress={() => handleRoleSwitch('CommercialManager')}
              title="Commercial Manager"
            />
          </Menu>
        </Card.Content>
      </Card>

      {/* Statistics Cards */}
      <View style={styles.statsContainer}>
        <Card style={styles.statCard}>
          <Card.Content>
            <Title style={styles.statNumber}>{stats.totalProjects}</Title>
            <Paragraph>Total Projects</Paragraph>
          </Card.Content>
        </Card>

        <Card style={styles.statCard}>
          <Card.Content>
            <Title style={styles.statNumber}>{stats.totalSites}</Title>
            <Paragraph>Total Sites</Paragraph>
          </Card.Content>
        </Card>
      </View>

      <View style={styles.statsContainer}>
        <Card style={styles.statCard}>
          <Card.Content>
            <Title style={styles.statNumber}>{stats.totalUsers}</Title>
            <Paragraph>Total Users</Paragraph>
          </Card.Content>
        </Card>

        <Card style={styles.statCard}>
          <Card.Content>
            <Title style={styles.statNumber}>{stats.totalItems}</Title>
            <Paragraph>Total Items</Paragraph>
          </Card.Content>
        </Card>
      </View>

      {/* Management Cards */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Project Management</Title>
          <Paragraph style={styles.cardDescription}>
            Create, edit, and delete projects
          </Paragraph>
          <Button
            mode="contained"
            onPress={handleManageProjects}
            style={styles.actionButton}
          >
            Manage Projects
          </Button>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title>User & Role Management</Title>
          <Paragraph style={styles.cardDescription}>
            Manage users and assign roles
          </Paragraph>
          <Button
            mode="contained"
            onPress={handleManageUsers}
            style={styles.actionButton}
          >
            Manage Users
          </Button>
        </Card.Content>
      </Card>

      {/* Password Migration Card (v2.2) */}
      <Card style={[styles.card, { backgroundColor: '#FFF3CD' }]}>
        <Card.Content>
          <Title>🔐 Password Migration (v2.2)</Title>
          <Paragraph style={styles.cardDescription}>
            Migrate plaintext passwords to bcrypt hashed passwords
          </Paragraph>
          <View style={styles.migrationStats}>
            <Paragraph>Total Users: {migrationStatus.totalUsers}</Paragraph>
            <Paragraph>Migrated: {migrationStatus.migratedUsers}</Paragraph>
            <Paragraph>Pending: {migrationStatus.pendingUsers}</Paragraph>
            <Paragraph style={{ fontWeight: 'bold', color: migrationStatus.percentComplete === 100 ? 'green' : 'orange' }}>
              Progress: {migrationStatus.percentComplete}%
            </Paragraph>
          </View>
          <Button
            mode="contained"
            onPress={handleRunMigration}
            style={[styles.actionButton, { backgroundColor: '#FFC107' }]}
            disabled={isMigrating || migrationStatus.percentComplete === 100}
            loading={isMigrating}
          >
            {migrationStatus.percentComplete === 100 ? 'Migration Complete ✓' : 'Run Migration'}
          </Button>
          {isMigrating && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#FFC107" />
              <Paragraph style={{ marginLeft: 10 }}>Migrating passwords...</Paragraph>
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Category Migration Card (v2.18) */}
      <Card style={[styles.card, { backgroundColor: '#E3F2FD' }]}>
        <Card.Content>
          <Title>📋 Category Names Migration (v2.18)</Title>
          <Paragraph style={styles.cardDescription}>
            Update category names to reflect construction sequence
          </Paragraph>
          <View style={styles.migrationStats}>
            <Paragraph style={{ fontWeight: 'bold', marginBottom: 5 }}>Changes:</Paragraph>
            <Paragraph>• "Finishing" → "Handing Over"</Paragraph>
            <Paragraph>• "Framing" → "Punch List"</Paragraph>
            <Paragraph style={{ marginTop: 10, fontSize: 12, color: '#666' }}>
              ✓ Safe - only renames categories{'\n'}
              ✓ Non-destructive - items remain linked{'\n'}
              ✓ Reversible - can be rolled back
            </Paragraph>
          </View>
          <Button
            mode="contained"
            onPress={handleCategoryMigration}
            style={[styles.actionButton, { backgroundColor: '#2196F3' }]}
            disabled={isMigratingCategories}
            loading={isMigratingCategories}
          >
            {isMigratingCategories ? 'Migrating...' : 'Migrate Category Names'}
          </Button>
          {isMigratingCategories && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#2196F3" />
              <Paragraph style={{ marginLeft: 10 }}>Updating categories...</Paragraph>
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Database Reset Card (v2.11) */}
      <Card style={[styles.card, { backgroundColor: '#FFE5E5' }]}>
        <Card.Content>
          <Title>🗄️ Database Reset (v2.11)</Title>
          <Paragraph style={styles.cardDescription}>
            Clear all data and re-initialize with default users (including new Design Engineer)
          </Paragraph>
          <Paragraph style={{ color: '#D32F2F', fontWeight: 'bold', marginVertical: 10 }}>
            ⚠️ WARNING: This will delete ALL local data!
          </Paragraph>
          <Button
            mode="contained"
            onPress={async () => {
              Alert.alert(
                'Reset Database',
                'This will delete ALL local data and re-initialize with default users. Are you sure?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Reset',
                    style: 'destructive',
                    onPress: async () => {
                      try {
                        console.log('🔄 Starting database reset...');

                        // Clear database FIRST (most important)
                        const collections = [
                          'users', 'roles', 'projects', 'sites', 'categories', 'items',
                          'reports', 'materials', 'material_requests', 'material_deliveries',
                          'suppliers', 'sessions', 'milestones', 'milestone_progress',
                          'doors_packages', 'doors_requirements', 'rfqs', 'rfq_vendors',
                          'rfq_vendor_quotes', 'purchase_orders', 'vendors', 'boms',
                          'bom_items', 'budgets', 'costs', 'invoices'
                        ];

                        let totalDeleted = 0;
                        for (const collectionName of collections) {
                          try {
                            const collection = database.collections.get(collectionName);
                            const records = await collection.query().fetch();
                            if (records.length > 0) {
                              await database.write(async () => {
                                await database.batch(
                                  ...records.map((record: any) => record.prepareDestroyPermanently())
                                );
                              });
                              totalDeleted += records.length;
                              console.log(`  ✅ Deleted ${records.length} records from ${collectionName}`);
                            }
                          } catch (error) {
                            console.log(`  ⚠️  Collection ${collectionName} error:`, error);
                          }
                        }

                        console.log(`🗑️  Total records deleted: ${totalDeleted}`);

                        // Clear AsyncStorage (this will force re-login)
                        await AsyncStorage.clear();
                        console.log('🧹 AsyncStorage cleared');

                        // IMPORTANT: Re-initialize default data after reset
                        console.log('🔄 Re-initializing database with default data...');
                        await SimpleDatabaseService.initializeDefaultData();
                        console.log('✅ Database re-initialization complete!');

                        Alert.alert(
                          'Success',
                          `Database reset complete!\n\nDeleted ${totalDeleted} records and re-initialized with default users.\n\nYou can now login with:\n• designer / Designer@2025\n• admin / Admin@2025\n• supervisor / Supervisor@2025\n• manager / Manager@2025\n• planner / Planner@2025\n• logistics / Logistics@2025`,
                          [
                            {
                              text: 'Go to Login',
                              onPress: () => {
                                // Navigate to Auth screen
                                navigation.dispatch(
                                  CommonActions.reset({
                                    index: 0,
                                    routes: [{ name: 'Auth' }],
                                  })
                                );
                              }
                            }
                          ]
                        );
                      } catch (error) {
                        console.error('❌ Reset failed:', error);
                        Alert.alert('Error', 'Failed to reset database: ' + error);
                      }
                    },
                  },
                ]
              );
            }}
            style={[styles.actionButton, { backgroundColor: '#D32F2F' }]}
          >
            Reset Database
          </Button>
          <Paragraph style={{ fontSize: 12, color: '#666', marginTop: 10 }}>
            After reset, restart app to re-initialize. New user: designer / Designer@2025
          </Paragraph>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#007AFF',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#fff',
    fontSize: 14,
    marginTop: 5,
  },
  card: {
    margin: 15,
    marginBottom: 10,
  },
  cardDescription: {
    marginTop: 5,
    marginBottom: 15,
    color: '#666',
  },
  roleButton: {
    marginTop: 10,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    marginBottom: 10,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 5,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
    textAlign: 'center',
  },
  actionButton: {
    marginTop: 10,
  },
  migrationStats: {
    marginVertical: 10,
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 5,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 5,
  },
});

export default AdminDashboardScreen;
