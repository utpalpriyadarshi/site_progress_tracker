/**
 * Project and Site Selector Component
 */

import React from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { Card, Title, Text, Chip } from 'react-native-paper';

interface ProjectSiteSelectorProps {
  projects: any[];
  sites: any[];
  selectedProjectId: string;
  selectedSiteId: string;
  onSelectProject: (projectId: string) => void;
  onSelectSite: (siteId: string) => void;
}

export const ProjectSiteSelector: React.FC<ProjectSiteSelectorProps> = ({
  projects,
  sites,
  selectedProjectId,
  selectedSiteId,
  onSelectProject,
  onSelectSite,
}) => {
  const filteredSites = sites.filter(s => s.projectId === selectedProjectId);

  return (
    <Card style={styles.selectorCard}>
      <Card.Content>
        <Title>Select Project & Site</Title>

        {/* Project Selector */}
        <Text style={styles.label}>Project:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipContainer}>
          {projects.map((project) => (
            <Chip
              key={project.id}
              mode={selectedProjectId === project.id ? 'flat' : 'outlined'}
              selected={selectedProjectId === project.id}
              onPress={() => onSelectProject(project.id)}
              style={styles.chip}
            >
              {project.name}
            </Chip>
          ))}
        </ScrollView>

        {/* Site Selector */}
        <Text style={styles.label}>Site:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipContainer}>
          <Chip
            mode={selectedSiteId === '' ? 'flat' : 'outlined'}
            selected={selectedSiteId === ''}
            onPress={() => onSelectSite('')}
            style={styles.chip}
          >
            All Sites
          </Chip>
          {filteredSites.map((site) => (
            <Chip
              key={site.id}
              mode={selectedSiteId === site.id ? 'flat' : 'outlined'}
              selected={selectedSiteId === site.id}
              onPress={() => onSelectSite(site.id)}
              style={styles.chip}
            >
              {site.name}
            </Chip>
          ))}
        </ScrollView>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  selectorCard: {
    margin: 16,
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 8,
  },
  chipContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  chip: {
    marginRight: 8,
  },
});
