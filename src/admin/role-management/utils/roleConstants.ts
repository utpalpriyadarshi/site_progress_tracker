import RoleModel from '../../../../models/RoleModel';
import { COLORS } from '../../../theme/colors';

/**
 * Get role color based on role name
 */
export const getRoleColor = (roleName: string): string => {
  switch (roleName) {
    case 'Admin':
      return COLORS.ERROR;
    case 'Supervisor':
      return COLORS.SUCCESS;
    case 'Manager':
      return COLORS.INFO;
    case 'Planner':
      return COLORS.WARNING;
    case 'Logistics':
      return COLORS.STATUS_EVALUATED;
    case 'DesignEngineer':
      return '#00BCD4';
    case 'CommercialManager':
      return '#FF5722';
    default:
      return COLORS.DISABLED;
  }
};

/**
 * Get role name from role ID
 */
export const getRoleName = (roleId: string, roles: RoleModel[]): string => {
  const role = roles.find((r) => r.id === roleId);
  return role ? role.name : 'Unknown';
};

/**
 * Get project name from project ID
 */
export const getProjectName = (projectId: string, projects: any[]): string => {
  if (!projectId) return 'No Project Assigned';
  const project = projects.find((p) => p.id === projectId);
  return project ? project.name : 'Unknown Project';
};

/**
 * Check if role requires project assignment
 */
export const roleRequiresProject = (roleName: string): boolean => {
  return ['Supervisor', 'Manager', 'DesignEngineer'].includes(roleName);
};
