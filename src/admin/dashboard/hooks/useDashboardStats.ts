import { useState, useEffect } from 'react';
import { database } from '../../../../models/database';
import { logger } from '../../../services/LoggingService';

interface DashboardStats {
  totalProjects: number;
  totalSites: number;
  totalUsers: number;
  totalItems: number;
}

export const useDashboardStats = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalProjects: 0,
    totalSites: 0,
    totalUsers: 0,
    totalItems: 0,
  });

  const loadStats = async () => {
    try {
      const [projects, sites, users, items] = await Promise.all([
        database.collections.get('projects').query().fetch(),
        database.collections.get('sites').query().fetch(),
        database.collections.get('users').query().fetch(),
        database.collections.get('items').query().fetch(),
      ]);

      setStats({
        totalProjects: projects.length,
        totalSites: sites.length,
        totalUsers: users.length,
        totalItems: items.length,
      });
    } catch (error) {
      logger.error('Error loading stats:', error as Error);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  return { stats, reloadStats: loadStats };
};
