/**
 * User-related type definitions for Admin shared components
 */

import type UserModel from '../../../../models/UserModel';
import type RoleModel from '../../../../models/RoleModel';
import type ProjectModel from '../../../../models/ProjectModel';

/**
 * UserRoleCard component props
 */
export interface UserRoleCardProps {
  /** User to display */
  user: UserModel;
  /** User's role (optional) */
  role?: RoleModel;
  /** User's assigned project (optional) */
  project?: ProjectModel;
  /** Callback when card is pressed */
  onPress?: (user: UserModel) => void;
  /** Callback when edit button is pressed */
  onEdit?: (user: UserModel) => void;
  /** Callback when delete button is pressed */
  onDelete?: (user: UserModel) => void;
  /** Callback when toggle status button is pressed */
  onToggleStatus?: (user: UserModel) => void;
  /** Callback when reset password button is pressed */
  onResetPassword?: (user: UserModel) => void;
  /** Whether to show action buttons */
  showActions?: boolean;
  /** Card display variant */
  variant?: 'default' | 'compact' | 'detailed';
}
