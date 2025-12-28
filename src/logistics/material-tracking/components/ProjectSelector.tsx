import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import ProjectModel from '../../../../models/ProjectModel';

interface ProjectSelectorProps {
  projects: ProjectModel[];
  selectedProjectId: string | null;
  onProjectSelect: (projectId: string) => void;
}

/**
 * ProjectSelector Component
 *
 * Displays a horizontal scrollable list of project chips for selection.
 * Extracted from MaterialTrackingScreen for reusability.
 */
export const ProjectSelector: React.FC<ProjectSelectorProps> = ({
  projects,
  selectedProjectId,
  onProjectSelect,
}) => {
  if (projects.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateText}>No projects available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Project:</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.projectScroll}
      >
        {projects.map((project) => (
          <TouchableOpacity
            key={project.id}
            style={[
              styles.projectChip,
              selectedProjectId === project.id && styles.projectChipActive,
            ]}
            onPress={() => onProjectSelect(project.id)}
          >
            <Text
              style={[
                styles.projectText,
                selectedProjectId === project.id && styles.projectTextActive,
              ]}
            >
              {project.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginRight: 8,
  },
  projectScroll: {
    flexGrow: 0,
  },
  projectChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  projectChipActive: {
    backgroundColor: '#2196F3',
  },
  projectText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  projectTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  emptyState: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});
