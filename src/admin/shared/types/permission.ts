/**
 * Permission-related type definitions for Admin shared components
 */

/**
 * Permission interface
 */
export interface Permission {
  /** Unique permission ID */
  id: string;
  /** Permission name */
  name: string;
  /** Permission category */
  category: 'admin' | 'manager' | 'logistics' | 'commercial' | 'planning' | 'design';
  /** Module this permission belongs to */
  module: string;
  /** Action type */
  action: 'create' | 'read' | 'update' | 'delete' | 'execute';
  /** Permission description (optional) */
  description?: string;
  /** Whether this permission is enabled */
  enabled: boolean;
}

/**
 * PermissionEditor component props
 */
export interface PermissionEditorProps {
  /** Role ID for the permissions */
  roleId: string;
  /** Array of permissions */
  permissions: Permission[];
  /** Callback when permissions change */
  onPermissionChange: (permissions: Permission[]) => void;
  /** Whether the editor is read-only */
  readOnly?: boolean;
  /** How to group permissions */
  groupBy?: 'category' | 'module';
  /** Whether to show permission descriptions */
  showDescription?: boolean;
}

/**
 * Grouped permissions structure
 */
export interface PermissionGroup {
  /** Group name */
  name: string;
  /** Permissions in this group */
  permissions: Permission[];
  /** Number of enabled permissions */
  enabledCount: number;
  /** Total permissions in group */
  totalCount: number;
}
