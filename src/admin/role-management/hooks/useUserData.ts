import { useState, useEffect } from 'react';
import { database } from '../../../../models/database';
import UserModel from '../../../../models/UserModel';
import RoleModel from '../../../../models/RoleModel';
import { logger } from '../../../services/LoggingService';

export const useUserData = () => {
  const [users, setUsers] = useState<UserModel[]>([]);
  const [roles, setRoles] = useState<RoleModel[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersList, rolesList, projectsList] = await Promise.all([
        database.collections.get<UserModel>('users').query().fetch(),
        database.collections.get<RoleModel>('roles').query().fetch(),
        database.collections.get('projects').query().fetch(),
      ]);
      setUsers(usersList);
      setRoles(rolesList);
      setProjects(projectsList);
    } catch (error) {
      logger.error('Error loading data:', error as Error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return {
    users,
    roles,
    projects,
    loading,
    reloadData: loadData,
  };
};
