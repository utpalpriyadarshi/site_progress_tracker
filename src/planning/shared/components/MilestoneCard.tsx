/**
 * MilestoneCard - Shared milestone display component
 *
 * A reusable card component for displaying milestone information with progress tracking.
 * Supports both default and compact variants for different use cases.
 *
 * @example
 * ```tsx
 * <MilestoneCard
 *   milestone={milestone}
 *   onEdit={handleEditMilestone}
 *   onDelete={handleDeleteMilestone}
 *   showActions
 *   variant="default"
 * />
 * ```
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Text, Button, ProgressBar, Chip } from 'react-native-paper';
import { MilestoneCardProps, MilestoneStatus } from '../types';

/**
 * Status colors mapping
 */
const STATUS_COLORS: Record<MilestoneStatus, string> = {
  'pending': '#9E9E9E',       // Gray
  'in-progress': '#2196F3',   // Blue
  'completed': '#4CAF50',     // Green
  'delayed': '#F44336',       // Red
};

/**
 * Status display names
 */
const STATUS_NAMES: Record<MilestoneStatus, string> = {
  'pending': 'Pending',
  'in-progress': 'In Progress',
  'completed': 'Completed',
  'delayed': 'Delayed',
};

/**
 * Format timestamp to readable date string
 */
const formatDate = (timestamp: number | null): string => {
  if (!timestamp) return 'Not set';
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Calculate days until target date
 */
const getDaysUntilTarget = (targetDate: number): number => {
  const now = Date.now();
  const diff = targetDate - now;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

/**
 * Format countdown text
 */
const getCountdownText = (targetDate: number, status: MilestoneStatus): string => {
  if (status === 'completed') return 'Completed';

  const days = getDaysUntilTarget(targetDate);

  if (days < 0) return `${Math.abs(days)} days overdue`;
  if (days === 0) return 'Due today';
  if (days === 1) return '1 day remaining';
  return `${days} days remaining`;
};

/**
 * Shared Milestone Card component
 */
export const MilestoneCard: React.FC<MilestoneCardProps> = ({
  milestone,
  onPress,
  onEdit,
  onDelete,
  showActions = true,
  variant = 'default',
}) => {
  const statusColor = STATUS_COLORS[milestone.status];
  const progressValue = milestone.progress / 100;
  const isDelayed = milestone.status === 'delayed';
  const isCompleted = milestone.status === 'completed';

  const handleCardPress = () => {
    if (onPress) {
      onPress(milestone);
    }
  };

  if (variant === 'compact') {
    // Compact variant for list views
    return (
      <TouchableOpacity onPress={handleCardPress} disabled={!onPress}>
        <Card style={styles.compactCard}>
          <Card.Content style={styles.compactContent}>
            <View style={styles.compactHeader}>
              <View style={styles.compactInfo}>
                <Text variant="titleSmall" numberOfLines={1}>
                  {milestone.code} - {milestone.name}
                </Text>
                <Text variant="bodySmall" style={styles.compactDate}>
                  {formatDate(milestone.targetDate)}
                </Text>
              </View>
              <Chip
                mode="flat"
                style={[styles.statusChip, { backgroundColor: statusColor }]}
                textStyle={styles.statusChipText}
              >
                {milestone.progress}%
              </Chip>
            </View>
            <ProgressBar
              progress={progressValue}
              color={statusColor}
              style={styles.compactProgress}
            />
          </Card.Content>
        </Card>
      </TouchableOpacity>
    );
  }

  // Default variant with full details
  return (
    <Card style={styles.card}>
      <Card.Content>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerInfo}>
            <Text variant="labelSmall" style={styles.code}>
              {milestone.code}
            </Text>
            <Text variant="titleMedium" style={styles.name}>
              {milestone.name}
            </Text>
            {milestone.description && (
              <Text variant="bodySmall" style={styles.description}>
                {milestone.description}
              </Text>
            )}
          </View>
          <Chip
            mode="flat"
            style={[styles.statusChip, { backgroundColor: statusColor }]}
            textStyle={styles.statusChipText}
          >
            {STATUS_NAMES[milestone.status]}
          </Chip>
        </View>

        {/* Progress Section */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text variant="bodyMedium">Progress</Text>
            <Text variant="bodyMedium" style={styles.progressText}>
              {milestone.progress}%
            </Text>
          </View>
          <ProgressBar
            progress={progressValue}
            color={statusColor}
            style={styles.progressBar}
          />
        </View>

        {/* Dates Section */}
        <View style={styles.datesSection}>
          <View style={styles.dateRow}>
            <Text variant="bodySmall" style={styles.dateLabel}>
              Target Date:
            </Text>
            <Text variant="bodySmall" style={styles.dateValue}>
              {formatDate(milestone.targetDate)}
            </Text>
          </View>

          {milestone.actualDate && (
            <View style={styles.dateRow}>
              <Text variant="bodySmall" style={styles.dateLabel}>
                Actual Date:
              </Text>
              <Text variant="bodySmall" style={styles.dateValue}>
                {formatDate(milestone.actualDate)}
              </Text>
            </View>
          )}

          {!isCompleted && (
            <View style={styles.countdownContainer}>
              <Text
                variant="bodySmall"
                style={[styles.countdown, isDelayed && styles.delayedText]}
              >
                {getCountdownText(milestone.targetDate, milestone.status)}
              </Text>
            </View>
          )}
        </View>

        {/* Dependent Items */}
        {milestone.dependentItems.length > 0 && (
          <View style={styles.dependentSection}>
            <Text variant="bodySmall" style={styles.dependentLabel}>
              Dependent Items: {milestone.dependentItems.length}
            </Text>
          </View>
        )}

        {/* Notes */}
        {milestone.notes && (
          <View style={styles.notesSection}>
            <Text variant="bodySmall" style={styles.notesLabel}>
              Notes:
            </Text>
            <Text variant="bodySmall" style={styles.notesText}>
              {milestone.notes}
            </Text>
          </View>
        )}

        {/* Actions */}
        {showActions && (
          <View style={styles.actions}>
            {onEdit && (
              <Button
                mode="outlined"
                onPress={() => onEdit(milestone)}
                style={styles.actionButton}
                compact
              >
                Edit
              </Button>
            )}
            {onDelete && !isCompleted && (
              <Button
                mode="outlined"
                onPress={() => onDelete(milestone)}
                style={styles.actionButton}
                textColor="#F44336"
                compact
              >
                Delete
              </Button>
            )}
          </View>
        )}
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    elevation: 2,
  },
  compactCard: {
    marginBottom: 8,
    elevation: 1,
  },
  compactContent: {
    paddingVertical: 12,
  },
  compactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  compactInfo: {
    flex: 1,
    marginRight: 8,
  },
  compactDate: {
    color: '#666',
    marginTop: 2,
  },
  compactProgress: {
    height: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerInfo: {
    flex: 1,
    marginRight: 12,
  },
  code: {
    color: '#666',
    marginBottom: 4,
  },
  name: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  description: {
    color: '#666',
    lineHeight: 18,
  },
  statusChip: {
    height: 28,
  },
  statusChipText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  progressSection: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressText: {
    fontWeight: 'bold',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  datesSection: {
    marginBottom: 12,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  dateLabel: {
    color: '#666',
  },
  dateValue: {
    fontWeight: '500',
  },
  countdownContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  countdown: {
    fontWeight: '500',
  },
  delayedText: {
    color: '#F44336',
    fontWeight: 'bold',
  },
  dependentSection: {
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 4,
  },
  dependentLabel: {
    color: '#666',
  },
  notesSection: {
    marginBottom: 12,
  },
  notesLabel: {
    color: '#666',
    marginBottom: 4,
  },
  notesText: {
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
  },
});
