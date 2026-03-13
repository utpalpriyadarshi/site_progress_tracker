import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { FAB, Searchbar } from 'react-native-paper';
import { SpinnerLoading } from '../components/common/LoadingState';
import { useSnackbar } from '../components/Snackbar';
import { ConfirmDialog } from '../components/Dialog';
import { useAuth } from '../auth/AuthContext';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import {
  UserCard,
  UserFormDialog,
  PasswordResetDialog,
} from './role-management/components';
import {
  useUserData,
  useUserFilters,
  useUserForm,
  usePasswordReset,
} from './role-management/hooks';
import { EmptyState } from '../components/common/EmptyState';
import { COLORS } from '../theme/colors';

const RoleManagementScreen = () => {
  const { showSnackbar } = useSnackbar();
  const { user: currentUser } = useAuth();

  // Load user data
  const { users, roles, projects, loading, reloadData } = useUserData();

  // Filter users
  const { searchQuery, setSearchQuery, filteredUsers } = useUserFilters(users);

  // User form management
  const {
    modalVisible,
    setModalVisible,
    editingUser,
    formData,
    updateFormData,
    roleMenuVisible,
    setRoleMenuVisible,
    projectMenuVisible,
    setProjectMenuVisible,
    showDeleteDialog,
    setShowDeleteDialog,
    userToDelete,
    setUserToDelete,
    openCreateModal,
    openEditModal,
    handleSave,
    handleDelete,
    confirmDelete,
    toggleUserStatus,
  } = useUserForm({
    roles,
    onSuccess: (message) => showSnackbar(message, 'success'),
    onError: (message) => showSnackbar(message, 'error'),
    onDataReload: reloadData,
  });

  // Password reset management
  const {
    showResetPasswordDialog,
    userToReset,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    showPassword,
    setShowPassword,
    resetPasswordLoading,
    openResetPasswordDialog,
    closeResetPasswordDialog,
    handleResetPassword,
  } = usePasswordReset({
    currentUserId: currentUser?.userId || '',
    onSuccess: (message) => showSnackbar(message, 'success'),
    onError: (message) => showSnackbar(message, 'error'),
  });

  if (loading) {
    return <SpinnerLoading message="Loading..." />;
  }

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search users..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
        accessibilityLabel="Search users"
        accessibilityHint="Type to search by name, username, or email"
        accessibilityRole="search"
      />

      <ScrollView style={styles.scrollView}>
        {filteredUsers.length === 0 ? (
          <EmptyState
            icon={searchQuery ? 'magnify-close' : 'account-group-outline'}
            title={searchQuery ? 'No users found' : 'No users yet'}
            message={searchQuery ? `No users match "${searchQuery}"` : 'Add your first user to get started.'}
            actionText={!searchQuery ? 'Add User' : undefined}
            onAction={!searchQuery ? openCreateModal : undefined}
            variant="compact"
          />
        ) : (
          filteredUsers.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              roles={roles}
              projects={projects}
              onEdit={openEditModal}
              onDelete={handleDelete}
              onToggleStatus={toggleUserStatus}
              onResetPassword={openResetPasswordDialog}
            />
          ))
        )}
      </ScrollView>

      <FAB
        style={styles.fab}
          color="#FFFFFF"
        icon="plus"
        onPress={openCreateModal}
        accessibilityLabel="Add new user"
        accessibilityHint="Opens form to create a new user"
        accessibilityRole="button"
      />

      <UserFormDialog
        visible={modalVisible}
        editingUser={editingUser}
        formData={formData}
        roles={roles}
        projects={projects}
        roleMenuVisible={roleMenuVisible}
        projectMenuVisible={projectMenuVisible}
        onDismiss={() => setModalVisible(false)}
        onFormDataChange={updateFormData}
        onSave={handleSave}
        onRoleMenuToggle={setRoleMenuVisible}
        onProjectMenuToggle={setProjectMenuVisible}
      />

      <PasswordResetDialog
        visible={showResetPasswordDialog}
        userToReset={userToReset}
        newPassword={newPassword}
        confirmPassword={confirmPassword}
        showPassword={showPassword}
        loading={resetPasswordLoading}
        onDismiss={closeResetPasswordDialog}
        onNewPasswordChange={setNewPassword}
        onConfirmPasswordChange={setConfirmPassword}
        onTogglePasswordVisibility={() => setShowPassword(!showPassword)}
        onResetPassword={handleResetPassword}
      />

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
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.PRIMARY,
  },
});

// Wrap with ErrorBoundary for graceful error handling
const RoleManagementScreenWithBoundary = () => (
  <ErrorBoundary name="RoleManagementScreen">
    <RoleManagementScreen />
  </ErrorBoundary>
);

export default RoleManagementScreenWithBoundary;
