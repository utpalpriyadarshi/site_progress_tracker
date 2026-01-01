import RoleModel from '../../../../models/RoleModel';

/**
 * Get role color based on role name
 */
export const getRoleColor = (roleName: string): string => {
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
    case 'DesignEngineer':
      return '#00BCD4';
    case 'CommercialManager':
      return '#FF5722';
    default:
      return '#9E9E9E';
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
