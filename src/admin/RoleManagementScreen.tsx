import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import {
  FAB,
  Searchbar,
  Card,
  Title,
  Paragraph,
  Button,
  Portal,
  Modal,
  TextInput,
  Chip,
  Menu,
  ActivityIndicator,
  Divider,
} from 'react-native-paper';
import { database } from '../../models/database';
import UserModel from '../../models/UserModel';
import RoleModel from '../../models/RoleModel';
import { Q } from '@nozbe/watermelondb';

interface UserFormData {
  username: string;
  password: string;
  fullName: string;
  email: string;
  phone: string;
  roleId: string;
  isActive: boolean;
}

const RoleManagementScreen = () => {
  const [users, setUsers] = useState<UserModel[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserModel[]>([]);
  const [roles, setRoles] = useState<RoleModel[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<UserModel | null>(null);
  const [roleMenuVisible, setRoleMenuVisible] = useState(false);
  const [formData, setFormData] = useState<UserFormData>({
    username: '',
    password: '',
    fullName: '',
    email: '',
    phone: '',
    roleId: '',
    isActive: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [searchQuery, users]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersList, rolesList] = await Promise.all([
        database.collections.get<UserModel>('users').query().fetch(),
        database.collections.get<RoleModel>('roles').query().fetch(),
      ]);
      setUsers(usersList);
      setRoles(rolesList);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    if (!searchQuery.trim()) {
      setFilteredUsers(users);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = users.filter(
      (user) =>
        user.username.toLowerCase().includes(query) ||
        user.fullName.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query)
    );
    setFilteredUsers(filtered);
  };

  const openCreateModal = () => {
    setEditingUser(null);
    setFormData({
      username: '',
      password: '',
      fullName: '',
      email: '',
      phone: '',
      roleId: roles.length > 0 ? roles[0].id : '',
      isActive: true,
    });
    setModalVisible(true);
  };

  const openEditModal = (user: UserModel) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: '', // Don't pre-fill password for security
      fullName: user.fullName,
      email: user.email || '',
      phone: user.phone || '',
      roleId: user.roleId,
      isActive: user.isActive,
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    // Validation
    if (!formData.username.trim()) {
      Alert.alert('Validation Error', 'Username is required');
      return;
    }
    if (!editingUser && !formData.password.trim()) {
      Alert.alert('Validation Error', 'Password is required for new users');
      return;
    }
    if (!formData.fullName.trim()) {
      Alert.alert('Validation Error', 'Full name is required');
      return;
    }
    if (!formData.roleId) {
      Alert.alert('Validation Error', 'Please select a role');
      return;
    }

    // Check for duplicate username
    if (!editingUser || editingUser.username !== formData.username) {
      const existingUser = await database.collections
        .get<UserModel>('users')
        .query(Q.where('username', formData.username))
        .fetch();
      if (existingUser.length > 0) {
        Alert.alert('Validation Error', 'Username already exists');
        return;
      }
    }

    try {
      await database.write(async () => {
        if (editingUser) {
          // Update existing user
          await editingUser.update((user: any) => {
            user.username = formData.username;
            if (formData.password.trim()) {
              user.password = formData.password; // In production, hash this
            }
            user.fullName = formData.fullName;
            user.email = formData.email;
            user.phone = formData.phone;
            user.roleId = formData.roleId;
            user.isActive = formData.isActive;
          });
        } else {
          // Create new user
          await database.collections.get('users').create((user: any) => {
            user.username = formData.username;
            user.password = formData.password; // In production, hash this
            user.fullName = formData.fullName;
            user.email = formData.email;
            user.phone = formData.phone;
            user.roleId = formData.roleId;
            user.isActive = formData.isActive;
          });
        }
      });

      setModalVisible(false);
      loadData();
      Alert.alert(
        'Success',
        editingUser ? 'User updated successfully' : 'User created successfully'
      );
    } catch (error) {
      console.error('Error saving user:', error);
      Alert.alert('Error', 'Failed to save user');
    }
  };

  const handleDelete = async (user: UserModel) => {
    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to delete user "${user.username}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await database.write(async () => {
                await user.markAsDeleted();
              });

              loadData();
              Alert.alert('Success', 'User deleted successfully');
            } catch (error) {
              console.error('Error deleting user:', error);
              Alert.alert('Error', 'Failed to delete user');
            }
          },
        },
      ]
    );
  };

  const toggleUserStatus = async (user: UserModel) => {
    try {
      await database.write(async () => {
        await user.update((u: any) => {
          u.isActive = !u.isActive;
        });
      });
      loadData();
    } catch (error) {
      console.error('Error toggling user status:', error);
      Alert.alert('Error', 'Failed to update user status');
    }
  };

  const getRoleName = (roleId: string) => {
    const role = roles.find((r) => r.id === roleId);
    return role ? role.name : 'Unknown';
  };

  const getRoleColor = (roleId: string) => {
    const roleName = getRoleName(roleId);
    switch (roleName) {
      case 'Admin':
        return '#F44336';
      case 'Supervisor':
        return '#4CAF50';
      case 'Manager':
        return '#2196F3';
      case 'Planner':
        return '#FF9800';
      case 'Logistics':
        return '#9C27B0';
      default:
        return '#9E9E9E';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search users..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
      />

      <ScrollView style={styles.scrollView}>
        {filteredUsers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Paragraph>No users found</Paragraph>
          </View>
        ) : (
          filteredUsers.map((user) => (
            <Card key={user.id} style={styles.card}>
              <Card.Content>
                <View style={styles.cardHeader}>
                  <View style={styles.userInfo}>
                    <Title style={styles.userName}>{user.fullName}</Title>
                    <Paragraph style={styles.username}>@{user.username}</Paragraph>
                  </View>
                  <Chip
                    style={[styles.roleChip, { backgroundColor: getRoleColor(user.roleId) }]}
                    textStyle={styles.roleChipText}
                  >
                    {getRoleName(user.roleId)}
                  </Chip>
                </View>

                {user.email && (
                  <Paragraph style={styles.detail}>Email: {user.email}</Paragraph>
                )}
                {user.phone && (
                  <Paragraph style={styles.detail}>Phone: {user.phone}</Paragraph>
                )}

                <View style={styles.statusContainer}>
                  <Chip
                    style={[
                      styles.statusChip,
                      { backgroundColor: user.isActive ? '#4CAF50' : '#F44336' },
                    ]}
                    textStyle={styles.statusChipText}
                  >
                    {user.isActive ? 'ACTIVE' : 'INACTIVE'}
                  </Chip>
                </View>
              </Card.Content>
              <Card.Actions>
                <Button onPress={() => toggleUserStatus(user)}>
                  {user.isActive ? 'Deactivate' : 'Activate'}
                </Button>
                <Button onPress={() => openEditModal(user)}>Edit</Button>
                <Button textColor="#F44336" onPress={() => handleDelete(user)}>
                  Delete
                </Button>
              </Card.Actions>
            </Card>
          ))
        )}
      </ScrollView>

      <FAB style={styles.fab} icon="plus" onPress={openCreateModal} />

      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          contentContainerStyle={styles.modalContent}
        >
          <ScrollView>
            <Title style={styles.modalTitle}>
              {editingUser ? 'Edit User' : 'Create New User'}
            </Title>

            <TextInput
              label="Username"
              value={formData.username}
              onChangeText={(text) => setFormData({ ...formData, username: text })}
              style={styles.input}
              mode="outlined"
              autoCapitalize="none"
            />

            <TextInput
              label={editingUser ? 'Password (leave blank to keep current)' : 'Password'}
              value={formData.password}
              onChangeText={(text) => setFormData({ ...formData, password: text })}
              style={styles.input}
              mode="outlined"
              secureTextEntry
              autoCapitalize="none"
            />

            <TextInput
              label="Full Name"
              value={formData.fullName}
              onChangeText={(text) => setFormData({ ...formData, fullName: text })}
              style={styles.input}
              mode="outlined"
            />

            <TextInput
              label="Email (optional)"
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              style={styles.input}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <TextInput
              label="Phone (optional)"
              value={formData.phone}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
              style={styles.input}
              mode="outlined"
              keyboardType="phone-pad"
            />

            <Paragraph style={styles.label}>Role</Paragraph>
            <Menu
              visible={roleMenuVisible}
              onDismiss={() => setRoleMenuVisible(false)}
              anchor={
                <Button
                  mode="outlined"
                  onPress={() => setRoleMenuVisible(true)}
                  style={styles.roleButton}
                >
                  {formData.roleId ? getRoleName(formData.roleId) : 'Select Role'}
                </Button>
              }
            >
              {roles.map((role) => (
                <Menu.Item
                  key={role.id}
                  onPress={() => {
                    setFormData({ ...formData, roleId: role.id });
                    setRoleMenuVisible(false);
                  }}
                  title={role.name}
                />
              ))}
            </Menu>

            <View style={styles.activeToggle}>
              <Paragraph style={styles.label}>Account Status</Paragraph>
              <View style={styles.statusButtons}>
                <Chip
                  selected={formData.isActive}
                  onPress={() => setFormData({ ...formData, isActive: true })}
                  style={styles.statusOption}
                >
                  Active
                </Chip>
                <Chip
                  selected={!formData.isActive}
                  onPress={() => setFormData({ ...formData, isActive: false })}
                  style={styles.statusOption}
                >
                  Inactive
                </Chip>
              </View>
            </View>

            <View style={styles.modalActions}>
              <Button onPress={() => setModalVisible(false)}>Cancel</Button>
              <Button mode="contained" onPress={handleSave}>
                {editingUser ? 'Update' : 'Create'}
              </Button>
            </View>
          </ScrollView>
        </Modal>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchbar: {
    margin: 15,
  },
  scrollView: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 50,
  },
  card: {
    margin: 15,
    marginTop: 0,
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
  },
  username: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  roleChip: {
    marginLeft: 10,
  },
  roleChipText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  detail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  statusContainer: {
    marginTop: 10,
  },
  statusChip: {
    alignSelf: 'flex-start',
  },
  statusChipText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#007AFF',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
    maxHeight: '80%',
  },
  modalTitle: {
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    marginBottom: 15,
  },
  label: {
    marginTop: 10,
    marginBottom: 10,
    fontWeight: 'bold',
  },
  roleButton: {
    marginBottom: 15,
  },
  activeToggle: {
    marginTop: 10,
  },
  statusButtons: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  statusOption: {
    marginRight: 10,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 20,
  },
});

export default RoleManagementScreen;
