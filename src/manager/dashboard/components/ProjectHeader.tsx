import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Title, Paragraph, Chip, Divider, ProgressBar } from 'react-native-paper';
import { COLORS } from '../../../theme/colors';

interface ProjectHeaderProps {
  projectName: string;
  client: string;
  startDate: string;
  endDate: string;
  overallCompletion: number;
  healthLabel: string;
  healthColor: string;
}

export const ProjectHeader: React.FC<ProjectHeaderProps> = ({
  projectName,
  client,
  startDate,
  endDate,
  overallCompletion,
  healthLabel,
  healthColor,
}) => {
  return (
    <Card mode="elevated" style={styles.headerCard}>
      <Card.Content>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Title style={styles.projectTitle}>{projectName}</Title>
            <Paragraph style={styles.projectClient}>Client: {client}</Paragraph>
            <Paragraph style={styles.projectDates}>
              {startDate} - {endDate}
            </Paragraph>
          </View>
          <Chip
            style={[styles.healthChip, { backgroundColor: healthColor }]}
            textStyle={styles.healthChipText}
          >
            {healthLabel}
          </Chip>
        </View>
        <Divider style={styles.divider} />
        <View style={styles.progressSection}>
          <Paragraph style={styles.progressLabel}>Overall Progress</Paragraph>
          <Title style={styles.progressValue}>{overallCompletion.toFixed(1)}%</Title>
          <ProgressBar
            progress={overallCompletion / 100}
            color={healthColor}
            style={styles.progressBar}
          />
          <Paragraph style={styles.progressSubtext}>
            Hybrid Calculation: 60% Items + 40% Milestones
          </Paragraph>
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  headerCard: {
    margin: 8,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerLeft: {
    flex: 1,
  },
  projectTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  projectClient: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  projectDates: {
    fontSize: 12,
    color: '#999',
  },
  healthChip: {
    marginLeft: 8,
  },
  healthChipText: {
    color: '#fff',
    fontWeight: '600',
  },
  divider: {
    marginVertical: 12,
  },
  progressSection: {
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  progressValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.INFO,
    marginBottom: 12,
  },
  progressBar: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  progressSubtext: {
    fontSize: 11,
    color: '#999',
    fontStyle: 'italic',
  },
});
