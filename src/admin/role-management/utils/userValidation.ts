import { database } from '../../../../models/database';
import UserModel from '../../../../models/UserModel';
import { Q } from '@nozbe/watermelondb';

export interface UserFormData {
  username: string;
  password: string;
  fullName: string;
  email: string;
  phone: string;
  roleId: string;
  projectId: string;
  isActive: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validate user form data
 */
export const validateUserForm = (
  formData: UserFormData,
  isEditing: boolean
): ValidationResult => {
  if (!formData.username.trim()) {
    return { isValid: false, error: 'Username is required' };
  }

  if (!isEditing && !formData.password.trim()) {
    return { isValid: false, error: 'Password is required for new users' };
  }

  if (!formData.fullName.trim()) {
    return { isValid: false, error: 'Full name is required' };
  }

  if (!formData.roleId) {
    return { isValid: false, error: 'Please select a role' };
  }

  return { isValid: true };
};

/**
 * Check if username already exists
 */
export const checkDuplicateUsername = async (
  username: string,
  editingUserId?: string
): Promise<ValidationResult> => {
  const existingUsers = await database.collections
    .get<UserModel>('users')
    .query(Q.where('username', username))
    .fetch();

  // If editing, allow the same username for the current user
  const isDuplicate = existingUsers.some((user) => user.id !== editingUserId);

  if (isDuplicate) {
    return { isValid: false, error: 'Username already exists' };
  }

  return { isValid: true };
};
