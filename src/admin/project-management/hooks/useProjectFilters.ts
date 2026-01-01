import { useState, useEffect } from 'react';
import ProjectModel from '../../../../models/ProjectModel';

export const useProjectFilters = (projects: ProjectModel[]) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProjects, setFilteredProjects] = useState<ProjectModel[]>([]);

  useEffect(() => {
    filterProjects();
  }, [searchQuery, projects]);

  const filterProjects = () => {
    if (!searchQuery.trim()) {
      setFilteredProjects(projects);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = projects.filter(
      (project) =>
        project.name.toLowerCase().includes(query) ||
        project.client.toLowerCase().includes(query) ||
        project.status.toLowerCase().includes(query)
    );
    setFilteredProjects(filtered);
  };

  return {
    searchQuery,
    setSearchQuery,
    filteredProjects,
  };
};
