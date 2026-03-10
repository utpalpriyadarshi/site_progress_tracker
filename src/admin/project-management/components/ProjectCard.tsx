import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Title, Paragraph, Button } from 'react-native-paper';
import ProjectModel from '../../../../models/ProjectModel';
import { StatusChip } from './StatusChip';
import { formatCurrency, formatDate } from '../utils';
import { COLORS } from '../../../theme/colors';

interface ProjectCardProps {
  project: ProjectModel;
  onEdit: (project: ProjectModel) => void;
  onDelete: (project: ProjectModel) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, onEdit, onDelete }) => {
  return (
    <Card
      mode="elevated"
      style={styles.card}
      accessible={true}
      accessibilityLabel={`Project card for ${project.name}, ${project.client}, status ${project.status}`}
      accessibilityRole="button"
    >
      <Card.Content>
        <View style={styles.cardHeader}>
          <Title style={styles.projectName}>{project.name}</Title>
          <StatusChip status={project.status} />
        </View>
        <Paragraph style={styles.client}>Client: {project.client}</Paragraph>
        <Paragraph style={styles.budget}>Budget: {formatCurrency(project.budget)}</Paragraph>
        <Paragraph style={styles.dates}>
          {formatDate(project.startDate)} - {formatDate(project.endDate)}
        </Paragraph>
      </Card.Content>
      <Card.Actions>
        <Button
          onPress={() => onEdit(project)}
          accessibilityLabel={`Edit ${project.name}`}
          accessibilityHint="Opens form to edit project details"
          accessibilityRole="button"
        >
          Edit
        </Button>
        <Button
          textColor={COLORS.ERROR}
          onPress={() => onDelete(project)}
          accessibilityLabel={`Delete ${project.name}`}
          accessibilityHint="Permanently removes this project"
          accessibilityRole="button"
        >
          Delete
        </Button>
      </Card.Actions>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    margin: 15,
    marginTop: 0,
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  projectName: {
    fontSize: 18,
    flex: 1,
  },
  client: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  budget: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.SUCCESS,
    marginBottom: 5,
  },
  dates: {
    fontSize: 12,
    color: '#999',
  },
});
