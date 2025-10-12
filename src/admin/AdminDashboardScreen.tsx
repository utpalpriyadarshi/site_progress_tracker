import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Title, Paragraph, Menu, Button, Divider } from 'react-native-paper';
import { useAdminContext, AdminRole } from './context/AdminContext';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { database } from '../../models/database';

type RootStackParamList = {
  Auth: undefined;
  Admin: undefined;
  Supervisor: undefined;
  Manager: undefined;
  Planning: undefined;
  Logistics: undefined;
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

  // Load statistics
  useEffect(() => {
    loadStats();
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
});

export default AdminDashboardScreen;
