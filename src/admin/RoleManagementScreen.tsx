import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
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
import { useSnackbar } from '../components/Snackbar';
import { ConfirmDialog } from '../components/Dialog';
import bcrypt from 'react-native-bcrypt';
import PasswordValidator from '../../services/auth/PasswordValidator';
import { PasswordResetService } from '../../services/auth/PasswordResetService';
import {
  validatePasswordStrength,
  calculatePasswordStrength,
  getPasswordRequirements,
} from '../../utils/passwordValidator';
import { useAuth } from '../auth/AuthContext';

interface UserFormData {
  username: string;
  password: string;
  fullName: string;
  email: string;
  phone: string;
  roleId: string;
  projectId: string; // v2.9: Project assignment for supervisors
  isActive: boolean;
}

const RoleManagementScreen = () => {
  const { showSnackbar } = useSnackbar();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserModel[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserModel[]>([]);
  const [roles, setRoles] = useState<RoleModel[]>([]);
  const [projects, setProjects] = useState<any[]>([]); // v2.9: Load projects for assignment
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<UserModel | null>(null);
  const [roleMenuVisible, setRoleMenuVisible] = useState(false);
  const [projectMenuVisible, setProjectMenuVisible] = useState(false); // v2.9: Project dropdown
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserModel | null>(null);
  const [formData, setFormData] = useState<UserFormData>({
    username: '',
    password: '',
    fullName: '',
    email: '',
    phone: '',
    roleId: '',
    projectId: '', // v2.9: Initialize project assignment
    isActive: true,
  });

  // Password reset state
  const [showResetPasswordDialog, setShowResetPasswordDialog] = useState(false);
  const [userToReset, setUserToReset] = useState<UserModel | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [searchQuery, users]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersList, rolesList, projectsList] = await Promise.all([
        database.collections.get<UserModel>('users').query().fetch(),
        database.collections.get<RoleModel>('roles').query().fetch(),
        database.collections.get('projects').query().fetch(), // v2.9: Load projects
      ]);
      setUsers(usersList);
      setRoles(rolesList);
      setProjects(projectsList); // v2.9: Store projects
    } catch (error) {
      console.error('Error loading data:', error);
      showSnackbar('Failed to load data', 'error');
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
      projectId: '', // v2.9: Initialize project assignment
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
      projectId: user.projectId || '', // v2.9: Load project assignment
      isActive: user.isActive,
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    // Validation
    if (!formData.username.trim()) {
      setModalVisible(false);
      showSnackbar('Username is required', 'warning');
      return;
    }
    if (!editingUser && !formData.password.trim()) {
      setModalVisible(false);
      showSnackbar('Password is required for new users', 'warning');
      return;
    }
    if (!formData.fullName.trim()) {
      setModalVisible(false);
      showSnackbar('Full name is required', 'warning');
      return;
    }
    if (!formData.roleId) {
      setModalVisible(false);
      showSnackbar('Please select a role', 'warning');
      return;
    }

    // Check for duplicate username
    if (!editingUser || editingUser.username !== formData.username) {
      const existingUser = await database.collections
        .get<UserModel>('users')
        .query(Q.where('username', formData.username))
        .fetch();
      if (existingUser.length > 0) {
        setModalVisible(false);
        showSnackbar('Username already exists', 'warning');
        return;
      }
    }

    try {
      // Validate password if provided (v2.2)
      if (formData.password.trim()) {
        const validation = PasswordValidator.validate(formData.password);
        if (!validation.isValid) {
          showSnackbar(validation.errors[0], 'warning');
          return;
        }
      } else if (!editingUser) {
        // Password required for new users
        showSnackbar('Password is required for new users', 'warning');
        return;
      }

      // Hash password if provided (v2.2)
      let passwordHash: string | null = null;
      if (formData.password.trim()) {
        passwordHash = await new Promise<string>((resolve, reject) => {
          bcrypt.hash(formData.password, 8, (err: Error | undefined, hash: string) => {
            if (err) {
              reject(err);
            } else {
              resolve(hash);
            }
          });
        });
      }

      await database.write(async () => {
        if (editingUser) {
          // Update existing user
          await editingUser.update((user: any) => {
            user.username = formData.username;
            if (passwordHash) {
              // Store hashed password (v2.2)
              user._raw.password_hash = passwordHash;
            }
            user.fullName = formData.fullName;
            user.email = formData.email;
            user.phone = formData.phone;
            user.roleId = formData.roleId;
            user.projectId = formData.projectId || null; // v2.9: Project assignment
            user.isActive = formData.isActive;
          });
        } else {
          // Create new user
          await database.collections.get('users').create((user: any) => {
            user.username = formData.username;
            user._raw.password_hash = passwordHash; // Store hashed password (v2.2)
            user.fullName = formData.fullName;
            user.email = formData.email;
            user.phone = formData.phone;
            user.roleId = formData.roleId;
            user.projectId = formData.projectId || null; // v2.9: Project assignment
            user.isActive = formData.isActive;
          });
        }
      });

      setModalVisible(false);
      loadData();
      showSnackbar(
        editingUser ? 'User updated successfully' : 'User created successfully',
        'success'
      );
    } catch (error) {
      console.error('Error saving user:', error);
      showSnackbar('Failed to save user', 'error');
    }
  };

  const handleDelete = async (user: UserModel) => {
    setUserToDelete(user);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;

    setShowDeleteDialog(false);
    try {
      await database.write(async () => {
        await userToDelete.markAsDeleted();
      });

      loadData();
      showSnackbar('User deleted successfully', 'success');
      setUserToDelete(null);
    } catch (error) {
      console.error('Error deleting user:', error);
      showSnackbar('Failed to delete user', 'error');
    }
  };

  // Password Reset Functions
  const openResetPasswordDialog = (user: UserModel) => {
    setUserToReset(user);
    setNewPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowResetPasswordDialog(true);
  };

  const closeResetPasswordDialog = () => {
    setShowResetPasswordDialog(false);
    setUserToReset(null);
    setNewPassword('');
    setConfirmPassword('');
    setShowPassword(false);
  };

  const handleResetPassword = async () => {
    if (!userToReset || !currentUser) return;

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      showSnackbar('Passwords do not match', 'error');
      return;
    }

    // Validate password strength
    const validation = validatePasswordStrength(newPassword);
    if (!validation.isValid) {
      showSnackbar(`Password validation failed:\n${validation.errors.join('\n')}`, 'error');
      return;
    }

    setResetPasswordLoading(true);

    try {
      const result = await PasswordResetService.resetPasswordByAdmin(
        userToReset.id,
        newPassword,
        currentUser.userId
      );

      if (result.success) {
        showSnackbar(`Password reset successful for ${userToReset.username}`, 'success');
        closeResetPasswordDialog();
      } else {
        showSnackbar(result.details || result.error || 'Failed to reset password', 'error');
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      showSnackbar('Failed to reset password', 'error');
    } finally {
      setResetPasswordLoading(false);
    }
  };

  const toggleUserStatus = async (user: UserModel) => {
    try {
      await database.write(async () => {
        await user.update((u: any) => {
          u.isActive = !u.isActive;
        });
      });
      loadData();
      showSnackbar(
        `User ${user.isActive ? 'deactivated' : 'activated'} successfully`,
        'success'
      );
    } catch (error) {
      console.error('Error toggling user status:', error);
      showSnackbar('Failed to update user status', 'error');
    }
  };

  const getRoleName = (roleId: string) => {
    const role = roles.find((r) => r.id === roleId);
    return role ? role.name : 'Unknown';
  };

  // v2.9: Helper to get project name
  const getProjectName = (projectId: string) => {
    if (!projectId) return 'No Project Assigned';
    const project = projects.find((p) => p.id === projectId);
    return project ? project.name : 'Unknown Project';
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
                {/* v2.9/v2.10: Show project assignment for supervisors and managers */}
                {(getRoleName(user.roleId) === 'Supervisor' || getRoleName(user.roleId) === 'Manager') && (
                  <Paragraph style={styles.detail}>
                    📁 Project: {getProjectName(user.projectId || '')}
                  </Paragraph>
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
              <Card.Actions style={styles.cardActions}>
                <View style={styles.buttonRow}>
                  <Button
                    onPress={() => toggleUserStatus(user)}
                    style={styles.actionButton}
                  >
                    {user.isActive ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button
                    onPress={() => openEditModal(user)}
                    style={styles.actionButton}
                  >
                    Edit
                  </Button>
                </View>
                <View style={styles.buttonRow}>
                  <Button
                    mode="outlined"
                    onPress={() => openResetPasswordDialog(user)}
                    icon="lock-reset"
                    style={styles.actionButton}
                  >
                    Reset Password
                  </Button>
                  <Button
                    textColor="#F44336"
                    onPress={() => handleDelete(user)}
                    style={styles.actionButton}
                  >
                    Delete
                  </Button>
                </View>
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

            {/* v2.9/v2.10: Project Assignment for Supervisors and Managers */}
            {/* Show for all roles during testing, can be restricted later */}
            <View style={styles.projectSection}>
              <Paragraph style={styles.label}>
                Assigned Project {(getRoleName(formData.roleId) === 'Supervisor' || getRoleName(formData.roleId) === 'Manager') ? '(Required)' : '(Optional)'}
              </Paragraph>
                <Menu
                  visible={projectMenuVisible}
                  onDismiss={() => setProjectMenuVisible(false)}
                  anchor={
                    <Button
                      mode="outlined"
                      onPress={() => setProjectMenuVisible(true)}
                      style={styles.roleButton}
                    >
                      {getProjectName(formData.projectId)}
                    </Button>
                  }
                >
                  <Menu.Item
                    onPress={() => {
                      setFormData({ ...formData, projectId: '' });
                      setProjectMenuVisible(false);
                    }}
                    title="No Project Assigned"
                  />
                  <Divider />
                  {projects.map((project) => (
                    <Menu.Item
                      key={project.id}
                      onPress={() => {
                        setFormData({ ...formData, projectId: project.id });
                        setProjectMenuVisible(false);
                      }}
                      title={project.name}
                    />
                  ))}
                </Menu>
            </View>

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

      {/* Password Reset Dialog */}
      <Portal>
        <Modal
          visible={showResetPasswordDialog}
          onDismiss={closeResetPasswordDialog}
          contentContainerStyle={styles.modalContent}
        >
          <ScrollView>
            <Title style={styles.modalTitle}>Reset Password</Title>
            <Paragraph style={styles.modalSubtitle}>
              Reset password for: {userToReset?.fullName} ({userToReset?.username})
            </Paragraph>
            <Divider style={{ marginVertical: 16 }} />

            <Paragraph style={styles.requirementsTitle}>Password Requirements:</Paragraph>
            {getPasswordRequirements().map((req, index) => (
              <Paragraph key={index} style={styles.requirement}>
                • {req}
              </Paragraph>
            ))}

            <TextInput
              label="New Password"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry={!showPassword}
              mode="outlined"
              style={styles.input}
              right={
                <TextInput.Icon
                  icon={showPassword ? 'eye-off' : 'eye'}
                  onPress={() => setShowPassword(!showPassword)}
                />
              }
            />

            {newPassword.length > 0 && (
              <View style={styles.strengthContainer}>
                <Paragraph style={styles.strengthLabel}>
                  Password Strength: {calculatePasswordStrength(newPassword).label}
                </Paragraph>
                <View
                  style={[
                    styles.strengthBar,
                    {
                      width: `${(calculatePasswordStrength(newPassword).score / 6) * 100}%`,
                      backgroundColor: calculatePasswordStrength(newPassword).color,
                    },
                  ]}
                />
              </View>
            )}

            <TextInput
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showPassword}
              mode="outlined"
              style={styles.input}
            />

            {confirmPassword.length > 0 && newPassword !== confirmPassword && (
              <Paragraph style={styles.errorText}>Passwords do not match</Paragraph>
            )}

            <View style={styles.dialogActions}>
              <Button onPress={closeResetPasswordDialog} disabled={resetPasswordLoading}>
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleResetPassword}
                loading={resetPasswordLoading}
                disabled={
                  resetPasswordLoading ||
                  !newPassword ||
                  !confirmPassword ||
                  newPassword !== confirmPassword
                }
              >
                Reset Password
              </Button>
            </View>
          </ScrollView>
        </Modal>
      </Portal>

      <ConfirmDialog
        visible={showDeleteDialog}
        title="Delete User"
        message={`Are you sure you want to delete ${userToDelete?.fullName}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onCancel={() => {
          setShowDeleteDialog(false);
          setUserToDelete(null);
        }}
        destructive={true}
      />
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
  // Password Reset Dialog Styles
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  requirementsTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 8,
  },
  requirement: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
    marginBottom: 4,
  },
  strengthContainer: {
    marginBottom: 15,
  },
  strengthLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  strengthBar: {
    height: 4,
    borderRadius: 2,
    marginTop: 4,
  },
  errorText: {
    color: '#F44336',
    fontSize: 12,
    marginTop: -10,
    marginBottom: 10,
  },
  dialogActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 20,
  },
  cardActions: {
    flexDirection: 'column',
    alignItems: 'stretch',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginVertical: 4,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  projectSection: {
    marginVertical: 10,
  },
});

export default RoleManagementScreen;
