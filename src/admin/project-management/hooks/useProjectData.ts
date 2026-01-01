import { useState, useEffect } from 'react';
import { database } from '../../../../models/database';
import ProjectModel from '../../../../models/ProjectModel';
import { logger } from '../../../services/LoggingService';

export const useProjectData = () => {
  const [projects, setProjects] = useState<ProjectModel[]>([]);
  const [loading, setLoading] = useState(true);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const projectsList = await database.collections
        .get<ProjectModel>('projects')
        .query()
        .fetch();
      setProjects(projectsList);
    } catch (error) {
      logger.error('Error loading projects:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  return {
    projects,
    loading,
    reloadProjects: loadProjects,
  };
};
