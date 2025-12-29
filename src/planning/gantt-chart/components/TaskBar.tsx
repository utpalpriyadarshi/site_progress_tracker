/**
 * Task bar visualization for Gantt chart
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import ItemModel from '../../../../models/ItemModel';
import { calculateTaskBarLayout } from '../utils/ganttCalculations';
import { ZoomLevel, GANTT_COLORS, TASK_HEIGHT } from '../utils/ganttConstants';
import dayjs from 'dayjs';

interface TaskBarProps {
  item: ItemModel;
  timelineStart: dayjs.Dayjs;
  zoomLevel: ZoomLevel;
  totalWidth: number;
  todayPosition: number | null;
}

export const TaskBar: React.FC<TaskBarProps> = ({
  item,
  timelineStart,
  zoomLevel,
  totalWidth,
  todayPosition,
}) => {
  const { left, width } = calculateTaskBarLayout(item, timelineStart, zoomLevel);
  const progress = item.getProgressPercentage();
  const isCritical = item.isOnCriticalPath();
  const phaseColor = item.getPhaseColor();

  return (
    <View style={[styles.container, { width: totalWidth }]}>
      {/* Today marker */}
      {todayPosition !== null && (
        <View style={[styles.todayMarker, { left: todayPosition }]} />
      )}

      {/* Task bar */}
      <View
        style={[
          styles.bar,
          {
            left,
            width,
            backgroundColor: phaseColor + '30',
            borderColor: isCritical ? GANTT_COLORS.critical : phaseColor,
            borderWidth: isCritical ? 3 : 1,
          },
        ]}
      >
        {/* Progress overlay */}
        {progress > 0 && (
          <View
            style={[
              styles.progressOverlay,
              {
                width: `${progress}%`,
                backgroundColor: GANTT_COLORS.progress,
              },
            ]}
          />
        )}
        {width > 50 && (
          <Text style={styles.text} numberOfLines={1}>
            {Math.round(progress)}%
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: TASK_HEIGHT,
    position: 'relative',
  },
  bar: {
    position: 'absolute',
    height: 30,
    top: 15,
    borderRadius: 4,
    justifyContent: 'center',
    paddingHorizontal: 4,
    overflow: 'hidden',
  },
  progressOverlay: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 4,
  },
  text: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    zIndex: 1,
  },
  todayMarker: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: GANTT_COLORS.today,
    zIndex: 10,
  },
});
