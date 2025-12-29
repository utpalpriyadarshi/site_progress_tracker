/**
 * Task information column for Gantt chart
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Chip } from 'react-native-paper';
import ItemModel from '../../../../models/ItemModel';
import { LEFT_COLUMN_WIDTH, GANTT_COLORS } from '../utils/ganttConstants';

interface TaskInfoProps {
  item: ItemModel;
}

export const TaskInfo: React.FC<TaskInfoProps> = ({ item }) => {
  const phaseColor = item.getPhaseColor();
  const isCritical = item.isOnCriticalPath();

  return (
    <View style={styles.container}>
      <Text style={styles.taskName} numberOfLines={1}>
        {item.wbsCode} - {item.name}
      </Text>
      <View style={styles.metadata}>
        <Chip
          compact
          style={[styles.phaseChip, { backgroundColor: phaseColor + '20' }]}
        >
          <Text style={[styles.phaseText, { color: phaseColor }]}>
            {item.getPhaseLabel()}
          </Text>
        </Chip>
        {isCritical && (
          <Chip compact style={styles.criticalChip}>
            <Text style={styles.criticalText}>Critical</Text>
          </Chip>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: LEFT_COLUMN_WIDTH,
    padding: 8,
    borderRightWidth: 2,
    borderRightColor: GANTT_COLORS.borderColor,
    justifyContent: 'center',
  },
  taskName: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  metadata: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  phaseChip: {
    height: 20,
  },
  phaseText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  criticalChip: {
    height: 20,
    backgroundColor: '#ffebee',
  },
  criticalText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: GANTT_COLORS.critical,
  },
});
