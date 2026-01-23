/**
 * Admin State Management Module
 *
 * Barrel export for all Admin state modules
 * Note: createInitialState is exported with module-specific names to avoid conflicts
 */

// User Management exports
export {
  createInitialState as createUserManagementInitialState,
  userManagementReducer,
} from './user-management';
export type {
  UserManagementState,
  UserManagementAction,
} from './user-management';

// Project Management exports
export {
  createInitialState as createProjectManagementInitialState,
  projectManagementReducer,
} from './project-management';
export type {
  ProjectManagementState,
  ProjectManagementAction,
} from './project-management';

// Dashboard exports
export {
  createInitialState as createDashboardInitialState,
  adminDashboardReducer,
} from './dashboard';
export type {
  AdminDashboardState,
  AdminDashboardAction,
} from './dashboard';
