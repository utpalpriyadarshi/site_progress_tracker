/**
 * ProjectCard - Shared Component
 * Display project information with status and metrics
 *
 * Features:
 * - Project header with code and name
 * - Status badge (active/completed/on-hold)
 * - Date range display with progress bar
 * - Budget display
 * - Project metrics (optional)
 * - Action buttons (Edit, Delete)
 * - Compact variant for lists
 * - Color-coded status indicators
 * - Overdue warning
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card, Chip, Button, ProgressBar, IconButton } from 'react-native-paper';
import type { ProjectCardProps } from '../types';

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  metrics,
  onPress,
  onEdit,
  onDelete,
  showMetrics = false,
  showActions = true,
  variant = 'default',
}) => {
  // Calculate project progress based on dates
  const calculateProgress = () => {
    const now = Date.now();
    const start = project.startDate;
    const end = project.endDate;

    if (now < start) return 0;
    if (now > end) return 1;

    const total = end - start;
    const elapsed = now - start;
    return elapsed / total;
  };

  // Check if project is overdue
  const isOverdue = () => {
    return Date.now() > project.endDate && project.status !== 'completed';
  };

  // Calculate days remaining
  const getDaysRemaining = () => {
    const now = Date.now();
    const diff = project.endDate - now;
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  };

  // Get status color
  const getStatusColor = () => {
    switch (project.status) {
      case 'active':
        return '#4CAF50';
      case 'completed':
        return '#2196F3';
      case 'on-hold':
        return '#FF9800';
      default:
        return '#9E9E9E';
    }
  };

  // Get status label
  const getStatusLabel = () => {
    return project.status.toUpperCase().replace('-', ' ');
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Format date
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Render compact variant
  if (variant === 'compact') {
    return (
      <Card style={styles.card} onPress={onPress ? () => onPress(project) : undefined}>
        <Card.Content>
          <View style={styles.compactContainer}>
            <View style={styles.compactLeft}>
              <View style={styles.compactHeader}>
                <Text style={styles.projectName}>{project.name}</Text>
                <Chip
                  mode="flat"
                  style={[styles.statusChip, { backgroundColor: getStatusColor() + '20' }]}
                  textStyle={[styles.statusText, { color: getStatusColor() }]}
                  compact
                >
                  {getStatusLabel()}
                </Chip>
              </View>
              <Text style={styles.clientText} numberOfLines={1}>
                Client: {project.client}
              </Text>
              {isOverdue() && (
                <Chip
                  mode="flat"
                  style={styles.overdueChip}
                  textStyle={styles.overdueText}
                  icon="alert"
                  compact
                >
                  OVERDUE
                </Chip>
              )}
            </View>
            <View style={styles.compactRight}>
              <Text style={styles.budgetCompact}>{formatCurrency(project.budget)}</Text>
              {showActions && onEdit && (
                <IconButton
                  icon="pencil"
                  size={18}
                  onPress={() => onEdit(project)}
                />
              )}
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  }

  // Render default variant
  const progress = calculateProgress();
  const daysRemaining = getDaysRemaining();
  const overdue = isOverdue();

  return (
    <Card style={styles.card} onPress={onPress ? () => onPress(project) : undefined}>
      <Card.Content>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.projectName}>{project.name}</Text>
            <Text style={styles.clientText}>Client: {project.client}</Text>
          </View>
          <Chip
            mode="flat"
            style={[styles.statusChip, { backgroundColor: getStatusColor() + '20' }]}
            textStyle={[styles.statusText, { color: getStatusColor() }]}
          >
            {getStatusLabel()}
          </Chip>
        </View>

        {/* Date Range & Progress */}
        <View style={styles.dateSection}>
          <View style={styles.dateRow}>
            <View style={styles.dateItem}>
              <Text style={styles.dateLabel}>Start Date</Text>
              <Text style={styles.dateValue}>{formatDate(project.startDate)}</Text>
            </View>
            <View style={styles.dateItem}>
              <Text style={styles.dateLabel}>End Date</Text>
              <Text style={styles.dateValue}>{formatDate(project.endDate)}</Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressSection}>
            <ProgressBar
              progress={progress}
              color={overdue ? '#f44336' : '#2196F3'}
              style={styles.progressBar}
            />
            <Text style={[styles.progressText, overdue && styles.overdueProgressText]}>
              {overdue
                ? `Overdue by ${Math.abs(daysRemaining)} days`
                : daysRemaining > 0
                ? `${daysRemaining} days remaining`
                : 'Starting soon'}
            </Text>
          </View>
        </View>

        {/* Budget */}
        <View style={styles.budgetSection}>
          <Text style={styles.budgetLabel}>Budget</Text>
          <Text style={styles.budgetValue}>{formatCurrency(project.budget)}</Text>
        </View>

        {/* Metrics (optional) */}
        {showMetrics && metrics && (
          <View style={styles.metricsSection}>
            <Text style={styles.metricsTitle}>Project Metrics</Text>
            <View style={styles.metricsGrid}>
              <View style={styles.metricItem}>
                <Text style={styles.metricValue}>{metrics.totalUsers}</Text>
                <Text style={styles.metricLabel}>Users</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricValue}>{metrics.totalItems}</Text>
                <Text style={styles.metricLabel}>Items</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricValue}>{metrics.completionPercentage}%</Text>
                <Text style={styles.metricLabel}>Complete</Text>
              </View>
            </View>
          </View>
        )}

        {/* Project ID */}
        <View style={styles.metadataSection}>
          <Text style={styles.metadataText}>Project ID: {project.id}</Text>
        </View>

        {/* Action Buttons */}
        {showActions && (
          <View style={styles.actionsContainer}>
            {onEdit && (
              <Button
                mode="contained"
                onPress={() => onEdit(project)}
                style={styles.actionButton}
                compact
              >
                Edit
              </Button>
            )}
            {onDelete && (
              <Button
                mode="outlined"
                onPress={() => onDelete(project)}
                style={styles.actionButton}
                textColor="#f44336"
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
    marginHorizontal: 15,
    marginVertical: 8,
    elevation: 2,
  },

  // Compact variant styles
  compactContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  compactLeft: {
    flex: 1,
  },
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  clientText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  compactRight: {
    alignItems: 'flex-end',
  },
  budgetCompact: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
    marginBottom: 4,
  },

  // Default variant styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerLeft: {
    flex: 1,
    marginRight: 12,
  },
  projectName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },

  // Date section
  dateSection: {
    marginBottom: 12,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dateItem: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 11,
    color: '#999',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  dateValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  progressSection: {
    marginTop: 8,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  overdueProgressText: {
    color: '#f44336',
    fontWeight: '600',
  },

  // Budget section
  budgetSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 12,
  },
  budgetLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  budgetValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4CAF50',
  },

  // Metrics section
  metricsSection: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  metricsTitle: {
    fontSize: 12,
    color: '#999',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  metricItem: {
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2196F3',
  },
  metricLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },

  // Metadata
  metadataSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  metadataText: {
    fontSize: 11,
    color: '#999',
  },

  // Actions
  actionsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
  },

  // Status chips
  statusChip: {
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  overdueChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#f44336',
    marginTop: 4,
  },
  overdueText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
});
