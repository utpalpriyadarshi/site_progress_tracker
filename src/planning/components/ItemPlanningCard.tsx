import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Text, Chip, IconButton, Button } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import ItemModel from '../../../models/ItemModel';
import { database } from '../../../models/database';
import { COLORS } from '../../theme/colors';

interface ItemPlanningCardProps {
  item: ItemModel;
  isCriticalPath: boolean;
  isLocked: boolean;
  onManageDependencies: () => void;
  onUpdate: () => void;
}

const ItemPlanningCard: React.FC<ItemPlanningCardProps> = ({
  item,
  isCriticalPath,
  isLocked,
  onManageDependencies,
  onUpdate,
}) => {
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [startDate, setStartDate] = useState(new Date(item.plannedStartDate));
  const [endDate, setEndDate] = useState(new Date(item.plannedEndDate));

  const handleStartDateChange = async (event: any, selectedDate?: Date) => {
    setShowStartPicker(false);
    if (selectedDate) {
      setStartDate(selectedDate);
      await database.write(async () => {
        await item.update(i => {
          i.plannedStartDate = selectedDate.getTime();
          // Clear critical path flag when dates change - user must recalculate
          if (i.criticalPathFlag) {
            i.criticalPathFlag = false;
          }
        });
      });
      onUpdate();
    }
  };

  const handleEndDateChange = async (event: any, selectedDate?: Date) => {
    setShowEndPicker(false);
    if (selectedDate) {
      setEndDate(selectedDate);
      await database.write(async () => {
        await item.update(i => {
          i.plannedEndDate = selectedDate.getTime();
          // Clear critical path flag when dates change - user must recalculate
          if (i.criticalPathFlag) {
            i.criticalPathFlag = false;
          }
        });
      });
      onUpdate();
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const dependencies = item.getDependencies();
  const duration = item.getPlannedDuration();
  const progress = item.getProgressPercentage();

  return (
    <Card
      mode="elevated"
      style={[
        styles.card,
        isCriticalPath && styles.criticalPathCard,
      ]}
    >
      <Card.Content>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text variant="titleMedium" style={styles.title}>
              {item.name}
            </Text>
            {isCriticalPath && (
              <Chip
                icon="alert-circle"
                mode="flat"
                style={styles.criticalChip}
                textStyle={styles.criticalChipText}
              >
                Critical Path
              </Chip>
            )}
            {isLocked && (
              <Chip
                icon="lock"
                mode="flat"
                style={styles.lockedChip}
                textStyle={styles.lockedChipText}
              >
                Locked
              </Chip>
            )}
          </View>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Text variant="bodySmall" style={styles.infoLabel}>Duration:</Text>
            <Text variant="bodyMedium" style={styles.infoValue}>{duration} days</Text>
          </View>
          <View style={styles.infoItem}>
            <Text variant="bodySmall" style={styles.infoLabel}>Status:</Text>
            <Text variant="bodyMedium" style={styles.infoValue}>{item.status.replace('_', ' ')}</Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <Text variant="bodySmall" style={styles.progressLabel}>Progress</Text>
            <Text variant="bodySmall" style={styles.progressPercentage}>{progress.toFixed(0)}%</Text>
          </View>
          <View style={styles.progressBarBackground}>
            <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
          </View>
        </View>

        <View style={styles.datesContainer}>
          <View style={styles.dateField}>
            <Text variant="labelSmall" style={styles.dateLabel}>
              Start Date
            </Text>
            <TouchableOpacity
              onPress={() => !isLocked && setShowStartPicker(true)}
              disabled={isLocked}
            >
              <View style={[styles.dateButton, isLocked && styles.dateButtonDisabled]}>
                <Text style={styles.dateText}>{formatDate(item.plannedStartDate)}</Text>
                {!isLocked && <IconButton icon="calendar" size={16} />}
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.dateField}>
            <Text variant="labelSmall" style={styles.dateLabel}>
              End Date
            </Text>
            <TouchableOpacity
              onPress={() => !isLocked && setShowEndPicker(true)}
              disabled={isLocked}
            >
              <View style={[styles.dateButton, isLocked && styles.dateButtonDisabled]}>
                <Text style={styles.dateText}>{formatDate(item.plannedEndDate)}</Text>
                {!isLocked && <IconButton icon="calendar" size={16} />}
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {item.baselineStartDate && (
          <View style={styles.baselineInfo}>
            <Text variant="bodySmall" style={styles.baselineText}>
              Baseline: {formatDate(item.baselineStartDate)} - {formatDate(item.baselineEndDate || 0)}
            </Text>
            {item.getBaselineVariance() !== 0 && (
              <Text
                variant="bodySmall"
                style={[
                  styles.varianceText,
                  item.getBaselineVariance() > 0 ? styles.delayedText : styles.aheadText,
                ]}
              >
                {item.getBaselineVariance() > 0 ? '+' : ''}{item.getBaselineVariance()} days
              </Text>
            )}
          </View>
        )}

        <View style={styles.dependenciesContainer}>
          <Text variant="labelSmall" style={styles.dependenciesLabel}>
            Dependencies: {dependencies.length}
          </Text>
          <Button
            mode="text"
            onPress={onManageDependencies}
            disabled={isLocked}
            compact
            style={styles.manageDepsButton}
          >
            Manage
          </Button>
        </View>
      </Card.Content>

      {showStartPicker && (
        <DateTimePicker
          value={startDate}
          mode="date"
          display="default"
          onChange={handleStartDateChange}
        />
      )}

      {showEndPicker && (
        <DateTimePicker
          value={endDate}
          mode="date"
          display="default"
          onChange={handleEndDateChange}
        />
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    elevation: 3,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  criticalPathCard: {
    borderWidth: 4,
    borderColor: COLORS.ERROR,
    elevation: 6,
    shadowColor: COLORS.ERROR,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  header: {
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  title: {
    fontWeight: 'bold',
    flex: 1,
  },
  criticalChip: {
    backgroundColor: COLORS.ERROR_BG,
  },
  criticalChipText: {
    color: COLORS.ERROR,
    fontSize: 10,
  },
  lockedChip: {
    backgroundColor: COLORS.WARNING_BG,
  },
  lockedChipText: {
    color: COLORS.WARNING,
    fontSize: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 16,
  },
  infoItem: {
    flex: 1,
  },
  infoLabel: {
    color: '#999',
    fontSize: 11,
    marginBottom: 2,
  },
  infoValue: {
    color: '#333',
    fontWeight: '600',
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    color: '#666',
    fontSize: 12,
  },
  progressPercentage: {
    color: '#007AFF',
    fontSize: 12,
    fontWeight: '600',
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.SUCCESS,
    borderRadius: 4,
  },
  datesContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  dateField: {
    flex: 1,
  },
  dateLabel: {
    marginBottom: 4,
    color: '#666',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5F5F5',
    padding: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  dateButtonDisabled: {
    backgroundColor: '#FAFAFA',
    opacity: 0.6,
  },
  dateText: {
    fontSize: 14,
  },
  baselineInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.INFO_BG,
    padding: 8,
    borderRadius: 4,
    marginBottom: 12,
  },
  baselineText: {
    color: '#1976D2',
  },
  varianceText: {
    fontWeight: 'bold',
  },
  delayedText: {
    color: COLORS.ERROR,
  },
  aheadText: {
    color: COLORS.SUCCESS,
  },
  dependenciesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dependenciesLabel: {
    color: '#666',
  },
  manageDepsButton: {
    marginLeft: 8,
  },
});

export default ItemPlanningCard;
