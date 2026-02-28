/**
 * Task row component for Gantt chart
 */

import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import ItemModel from '../../../../models/ItemModel';
import { TaskInfo } from './TaskInfo';
import { TaskBar } from './TaskBar';
import { ZoomLevel, TASK_HEIGHT, GANTT_COLORS } from '../utils/ganttConstants';
import dayjs from 'dayjs';

interface TaskRowProps {
  item: ItemModel;
  timelineStart: dayjs.Dayjs;
  zoomLevel: ZoomLevel;
  totalTimelineWidth: number;
  todayPosition: number | null;
  showBaseline?: boolean;
  scrollRefCallback?: (ref: ScrollView | null) => void;
}

export const TaskRow: React.FC<TaskRowProps> = ({
  item,
  timelineStart,
  zoomLevel,
  totalTimelineWidth,
  todayPosition,
  showBaseline = false,
  scrollRefCallback,
}) => {
  return (
    <View style={styles.wrapper}>
      <TaskInfo item={item} />
      <ScrollView
        ref={scrollRefCallback}
        horizontal
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        style={{ flex: 1 }}
      >
        <TaskBar
          item={item}
          timelineStart={timelineStart}
          zoomLevel={zoomLevel}
          totalWidth={totalTimelineWidth}
          todayPosition={todayPosition}
          showBaseline={showBaseline}
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
