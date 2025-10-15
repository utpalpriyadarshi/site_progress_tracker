import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Menu, Button, Text } from 'react-native-paper';
import ProjectModel from '../../../models/ProjectModel';

interface ProjectSelectorProps {
  projects: ProjectModel[];
  selectedProject: ProjectModel | null;
  onProjectChange: (project: ProjectModel) => void;
}

const ProjectSelector: React.FC<ProjectSelectorProps> = ({
  projects,
  selectedProject,
  onProjectChange,
}) => {
  const [menuVisible, setMenuVisible] = React.useState(false);

  const openMenu = () => setMenuVisible(true);
  const closeMenu = () => setMenuVisible(false);

  const handleSelectProject = (project: ProjectModel) => {
    onProjectChange(project);
    closeMenu();
  };

  return (
    <View style={styles.container}>
      <Text variant="labelLarge" style={styles.label}>
        Select Project:
      </Text>
      <Menu
        visible={menuVisible}
        onDismiss={closeMenu}
        anchor={
          <Button
            mode="outlined"
            onPress={openMenu}
            style={styles.button}
            contentStyle={styles.buttonContent}
          >
            {selectedProject ? selectedProject.name : 'Choose Project'}
          </Button>
        }
      >
        {projects.map(project => (
          <Menu.Item
            key={project.id}
            onPress={() => handleSelectProject(project)}
            title={project.name}
            leadingIcon={selectedProject?.id === project.id ? 'check' : undefined}
          />
        ))}
      </Menu>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  label: {
    marginBottom: 8,
    color: '#666',
  },
  button: {
    width: '100%',
  },
  buttonContent: {
    justifyContent: 'flex-start',
  },
});

export default ProjectSelector;
