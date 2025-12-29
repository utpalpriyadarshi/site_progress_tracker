/**
 * Task row component for Gantt chart
 */

import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import ItemModel from '../../../../models/ItemModel';
import { TaskInfo } from './TaskInfo';
import { TaskBar } from './TaskBar';
import { ZoomLevel, TASK_HEIGHT, SCREEN_WIDTH, LEFT_COLUMN_WIDTH, GANTT_COLORS } from '../utils/ganttConstants';
import dayjs from 'dayjs';

interface TaskRowProps {
  item: ItemModel;
  timelineStart: dayjs.Dayjs;
  zoomLevel: ZoomLevel;
  totalTimelineWidth: number;
  todayPosition: number | null;
}

export const TaskRow: React.FC<TaskRowProps> = ({
  item,
  timelineStart,
  zoomLevel,
  totalTimelineWidth,
  todayPosition,
}) => {
  return (
    <View style={styles.wrapper}>
      <TaskInfo item={item} />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        style={{ width: SCREEN_WIDTH - LEFT_COLUMN_WIDTH }}
      >
        <TaskBar
          item={item}
          timelineStart={timelineStart}
          zoomLevel={zoomLevel}
          totalWidth={totalTimelineWidth}
          todayPosition={todayPosition}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: GANTT_COLORS.emptyBorder,
    minHeight: TASK_HEIGHT,
  },
});
