import { useReducer, useCallback } from 'react';
import { database } from '../../../../models/database';
import UserModel from '../../../../models/UserModel';
import RoleModel from '../../../../models/RoleModel';
import bcrypt from 'react-native-bcrypt';
import PasswordValidator from '../../../../services/auth/PasswordValidator';
import { logger } from '../../../services/LoggingService';
import {
  validateUserForm,
  checkDuplicateUsername,
} from '../utils/userValidation';
import {
  userManagementReducer,
  createInitialState,
  UserFormData,
} from '../../state/user-management';

interface UseUserFormProps {
  roles: RoleModel[];
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
  onDataReload: () => void;
}

export const useUserForm = ({ roles, onSuccess, onError, onDataReload }: UseUserFormProps) => {
  const defaultRoleId = roles.length > 0 ? roles[0].id : '';
  const [state, dispatch] = useReducer(
    userManagementReducer,
    defaultRoleId,
    createInitialState
  );

  const openCreateModal = useCallback(() => {
    dispatch({ type: 'OPEN_CREATE_MODAL', payload: { defaultRoleId } });
  }, [defaultRoleId]);

  const openEditModal = useCallback((user: UserModel) => {
    dispatch({ type: 'OPEN_EDIT_MODAL', payload: { user } });
  }, []);

  const handleSave = useCallback(async () => {
    const { form, data } = state;
    const { editingUser } = data;

    // Validation
    const validation = validateUserForm(form, !!editingUser);
    if (!validation.isValid) {
      dispatch({ type: 'CLOSE_MODAL' });
      onError(validation.error || 'Validation failed');
      return;
    }

    // Check for duplicate username
    const duplicateCheck = await checkDuplicateUsername(
      form.username,
      editingUser?.id
    );
    if (!duplicateCheck.isValid) {
      dispatch({ type: 'CLOSE_MODAL' });
      onError(duplicateCheck.error || 'Username already exists');
      return;
    }

    try {
      // Validate password if provided
      if (form.password.trim()) {
        const passwordValidation = PasswordValidator.validate(form.password);
        if (!passwordValidation.isValid) {
          onError(passwordValidation.errors[0]);
          return;
        }
      } else if (!editingUser) {
        onError('Password is required for new users');
        return;
      }

      // Hash password if provided
      let passwordHash: string | null = null;
      if (form.password.trim()) {
        passwordHash = await new Promise<string>((resolve, reject) => {
          bcrypt.hash(form.password, 8, (err: Error | undefined, hash: string) => {
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
            user.username = form.username;
            if (passwordHash) {
              user._raw.password_hash = passwordHash;
            }
            user.fullName = form.fullName;
            user.email = form.email;
            user.phone = form.phone;
            user.roleId = form.roleId;
            user.projectId = form.projectId || null;
            user.isActive = form.isActive;
          });
        } else {
          // Create new user
          await database.collections.get('users').create((user: any) => {
            user.username = form.username;
            user._raw.password_hash = passwordHash;
            user.fullName = form.fullName;
            user.email = form.email;
            user.phone = form.phone;
            user.roleId = form.roleId;
            user.projectId = form.projectId || null;
            user.isActive = form.isActive;
          });
        }
      });

      dispatch({ type: 'CLOSE_MODAL' });
      onDataReload();
      onSuccess(editingUser ? 'User updated successfully' : 'User created successfully');
    } catch (error) {
      logger.error('Error saving user:', error);
      onError('Failed to save user');
    }
  }, [state, onError, onDataReload, onSuccess]);

  const handleDelete = useCallback((user: UserModel) => {
    dispatch({ type: 'OPEN_DELETE_DIALOG', payload: { user } });
  }, []);

  const confirmDelete = useCallback(async () => {
    const { userToDelete } = state.data;
    if (!userToDelete) return;

    dispatch({ type: 'CLOSE_DELETE_DIALOG' });
    try {
      await database.write(async () => {
        await userToDelete.markAsDeleted();
      });

      onDataReload();
      onSuccess('User deleted successfully');
    } catch (error) {
      logger.error('Error deleting user:', error);
      onError('Failed to delete user');
    }
  }, [state.data, onDataReload, onSuccess, onError]);

  const toggleUserStatus = useCallback(async (user: UserModel) => {
    try {
      await database.write(async () => {
        await user.update((u: any) => {
          u.isActive = !u.isActive;
        });
      });
      onDataReload();
      onSuccess(`User ${user.isActive ? 'deactivated' : 'activated'} successfully`);
    } catch (error) {
      logger.error('Error toggling user status:', error);
      onError('Failed to update user status');
    }
  }, [onDataReload, onSuccess, onError]);

  const updateFormData = useCallback((data: Partial<UserFormData>) => {
    dispatch({ type: 'UPDATE_FORM_DATA', payload: data });
  }, []);

  return {
    // UI state
    modalVisible: state.ui.modalVisible,
    setModalVisible: useCallback((visible: boolean) => {
      if (!visible) {
        dispatch({ type: 'CLOSE_MODAL' });
      }
    }, []),
    roleMenuVisible: state.ui.roleMenuVisible,
    setRoleMenuVisible: useCallback(() => {
      dispatch({ type: 'TOGGLE_ROLE_MENU' });
    }, []),
    projectMenuVisible: state.ui.projectMenuVisible,
    setProjectMenuVisible: useCallback(() => {
      dispatch({ type: 'TOGGLE_PROJECT_MENU' });
    }, []),
    showDeleteDialog: state.ui.showDeleteDialog,
    setShowDeleteDialog: useCallback((visible: boolean) => {
      if (!visible) {
        dispatch({ type: 'CLOSE_DELETE_DIALOG' });
      }
    }, []),

    // Data state
    editingUser: state.data.editingUser,
    userToDelete: state.data.userToDelete,
    setUserToDelete: useCallback((user: UserModel | null) => {
      if (user) {
        dispatch({ type: 'OPEN_DELETE_DIALOG', payload: { user } });
      } else {
        dispatch({ type: 'CLOSE_DELETE_DIALOG' });
      }
    }, []),

    // Form state
    formData: state.form,
    updateFormData,

    // Actions
    openCreateModal,
    openEditModal,
    handleSave,
    handleDelete,
    confirmDelete,
    toggleUserStatus,
  };
};
