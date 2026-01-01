import { useState } from 'react';
import { database } from '../../../../models/database';
import UserModel from '../../../../models/UserModel';
import RoleModel from '../../../../models/RoleModel';
import bcrypt from 'react-native-bcrypt';
import PasswordValidator from '../../../../services/auth/PasswordValidator';
import { logger } from '../../../services/LoggingService';
import {
  UserFormData,
  validateUserForm,
  checkDuplicateUsername,
} from '../utils/userValidation';

interface UseUserFormProps {
  roles: RoleModel[];
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
  onDataReload: () => void;
}

export const useUserForm = ({ roles, onSuccess, onError, onDataReload }: UseUserFormProps) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<UserModel | null>(null);
  const [roleMenuVisible, setRoleMenuVisible] = useState(false);
  const [projectMenuVisible, setProjectMenuVisible] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserModel | null>(null);
  const [formData, setFormData] = useState<UserFormData>({
    username: '',
    password: '',
    fullName: '',
    email: '',
    phone: '',
    roleId: roles.length > 0 ? roles[0].id : '',
    projectId: '',
    isActive: true,
  });

  const openCreateModal = () => {
    setEditingUser(null);
    setFormData({
      username: '',
      password: '',
      fullName: '',
      email: '',
      phone: '',
      roleId: roles.length > 0 ? roles[0].id : '',
      projectId: '',
      isActive: true,
    });
    setModalVisible(true);
  };

  const openEditModal = (user: UserModel) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: '',
      fullName: user.fullName,
      email: user.email || '',
      phone: user.phone || '',
      roleId: user.roleId,
      projectId: user.projectId || '',
      isActive: user.isActive,
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    // Validation
    const validation = validateUserForm(formData, !!editingUser);
    if (!validation.isValid) {
      setModalVisible(false);
      onError(validation.error || 'Validation failed');
      return;
    }

    // Check for duplicate username
    const duplicateCheck = await checkDuplicateUsername(
      formData.username,
      editingUser?.id
    );
    if (!duplicateCheck.isValid) {
      setModalVisible(false);
      onError(duplicateCheck.error || 'Username already exists');
      return;
    }

    try {
      // Validate password if provided
      if (formData.password.trim()) {
        const passwordValidation = PasswordValidator.validate(formData.password);
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
              user._raw.password_hash = passwordHash;
            }
            user.fullName = formData.fullName;
            user.email = formData.email;
            user.phone = formData.phone;
            user.roleId = formData.roleId;
            user.projectId = formData.projectId || null;
            user.isActive = formData.isActive;
          });
        } else {
          // Create new user
          await database.collections.get('users').create((user: any) => {
            user.username = formData.username;
            user._raw.password_hash = passwordHash;
            user.fullName = formData.fullName;
            user.email = formData.email;
            user.phone = formData.phone;
            user.roleId = formData.roleId;
            user.projectId = formData.projectId || null;
            user.isActive = formData.isActive;
          });
        }
      });

      setModalVisible(false);
      onDataReload();
      onSuccess(editingUser ? 'User updated successfully' : 'User created successfully');
    } catch (error) {
      logger.error('Error saving user:', error);
      onError('Failed to save user');
    }
  };

  const handleDelete = (user: UserModel) => {
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

      onDataReload();
      onSuccess('User deleted successfully');
      setUserToDelete(null);
    } catch (error) {
      logger.error('Error deleting user:', error);
      onError('Failed to delete user');
    }
  };

  const toggleUserStatus = async (user: UserModel) => {
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
  };

  const updateFormData = (data: Partial<UserFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  return {
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
  };
};
