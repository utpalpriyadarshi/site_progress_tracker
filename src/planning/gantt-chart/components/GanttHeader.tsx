/**
 * Gantt chart header with task info and timeline
 */

import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text } from 'react-native-paper';
import { TimelineHeader } from './TimelineHeader';
import { TimelineColumn } from '../utils/ganttCalculations';
import { LEFT_COLUMN_WIDTH, GANTT_COLORS } from '../utils/ganttConstants';

interface GanttHeaderProps {
  timelineColumns: TimelineColumn[];
  columnWidth: number;
  scrollViewRef: React.RefObject<ScrollView | null>;
  onScrollX: (x: number) => void;
}

export const GanttHeader: React.FC<GanttHeaderProps> = ({
  timelineColumns,
  columnWidth,
  scrollViewRef,
  onScrollX,
}) => {
  return (
    <View style={styles.row}>
      <View style={[styles.infoColumn, styles.headerColumn]}>
        <Text style={styles.text}>Task</Text>
      </View>
      <ScrollView
        horizontal
        ref={scrollViewRef}
        showsHorizontalScrollIndicator={true}
        scrollEventThrottle={16}
        onScroll={(e) => onScrollX(e.nativeEvent.contentOffset.x)}
        style={{ flex: 1 }}
      >
        <TimelineHeader columns={timelineColumns} columnWidth={columnWidth} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    backgroundColor: GANTT_COLORS.headerBg,
    borderBottomWidth: 2,
    borderBottomColor: GANTT_COLORS.borderColor,
  },
  infoColumn: {
    width: LEFT_COLUMN_WIDTH,
  },
  headerColumn: {
    backgroundColor: GANTT_COLORS.headerBg,
    borderRightWidth: 2,
    borderRightColor: GANTT_COLORS.borderColor,
  },
  text: {
    fontWeight: 'bold',
    fontSize: 14,
    padding: 12,
  },
});
