/**
 * Milestone Card Component
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Button, ProgressBar } from 'react-native-paper';
import MilestoneModel from '../../../../models/MilestoneModel';
import MilestoneProgressModel from '../../../../models/MilestoneProgressModel';
import { StatusChip } from './StatusChip';
import { STATUS_COLORS } from '../utils/milestoneConstants';
import { formatDate, formatProgressPercentage } from '../utils/milestoneFormatters';

interface MilestoneCardProps {
  milestone: MilestoneModel;
  progress: MilestoneProgressModel | null;
  selectedSiteId: string;
  onEditProgress: (milestone: MilestoneModel) => void;
  onMarkAsAchieved: (milestone: MilestoneModel) => void;
}

export const MilestoneCard: React.FC<MilestoneCardProps> = ({
  milestone,
  progress,
  selectedSiteId,
  onEditProgress,
  onMarkAsAchieved,
}) => {
  const progressValue = progress ? progress.progressPercentage / 100 : 0;
  const statusValue = progress?.status || 'not_started';
  const statusColor = STATUS_COLORS[statusValue as keyof typeof STATUS_COLORS] || STATUS_COLORS.not_started;

  return (
    <Card mode="elevated" style={styles.milestoneCard}>
      <Card.Content>
        {/* Header */}
        <View style={styles.milestoneHeader}>
          <View style={styles.milestoneInfo}>
            <Text style={styles.milestoneCode}>{milestone.milestoneCode}</Text>
            <Text style={styles.milestoneName}>{milestone.milestoneName}</Text>
            {milestone.description && (
              <Text style={styles.description}>{milestone.description}</Text>
            )}
          </View>
          <StatusChip status={statusValue} />
        </View>

        {/* Progress */}
        <View style={styles.progressSection}>
          <Text style={styles.progressLabel}>
            Progress: {formatProgressPercentage(progressValue)}%
          </Text>
          <ProgressBar
            progress={progressValue}
            color={statusColor}
            style={styles.progressBar}
          />
        </View>

        {/* Dates & Notes */}
        {progress && (
          <View style={styles.datesSection}>
            {progress.plannedStartDate && (
              <Text style={styles.dateText}>
                📅 Planned: {formatDate(progress.plannedStartDate)} -
                {' '}{formatDate(progress.plannedEndDate) || 'TBD'}
              </Text>
            )}
            {progress.actualStartDate && (
              <Text style={styles.dateText}>
                ✅ Actual: {formatDate(progress.actualStartDate)} -
                {' '}{progress.actualEndDate ? formatDate(progress.actualEndDate) : 'In Progress'}
              </Text>
            )}
            {progress.notes && (
              <Text style={styles.notesText}>📝 {progress.notes}</Text>
            )}
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            mode="outlined"
            onPress={() => onEditProgress(milestone)}
            style={styles.actionButton}
            disabled={!selectedSiteId}
          >
            Edit Progress
          </Button>
          {statusValue !== 'completed' && (
            <Button
              mode="contained"
              onPress={() => onMarkAsAchieved(milestone)}
              style={styles.actionButton}
              disabled={!selectedSiteId}
            >
              Mark Achieved
            </Button>
          )}
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  milestoneCard: {
    margin: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  milestoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  milestoneInfo: {
    flex: 1,
  },
  milestoneCode: {
    fontSize: 12,
    color: '#666',
    fontWeight: 'bold',
  },
  milestoneName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 2,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  progressSection: {
    marginBottom: 12,
  },
  progressLabel: {
    fontSize: 14,
    marginBottom: 4,
    color: '#333',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  datesSection: {
    marginBottom: 12,
    padding: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 4,
  },
  dateText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
  },
});
