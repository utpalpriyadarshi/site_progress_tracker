/**
 * Timeline header for Gantt chart
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { TimelineColumn } from '../utils/ganttCalculations';
import { TIMELINE_HEIGHT, GANTT_COLORS } from '../utils/ganttConstants';

interface TimelineHeaderProps {
  columns: TimelineColumn[];
  columnWidth: number;
}

export const TimelineHeader: React.FC<TimelineHeaderProps> = ({
  columns,
  columnWidth,
}) => {
  return (
    <View style={styles.container}>
      {columns.map((col, index) => (
        <View
          key={index}
          style={[
            styles.column,
            { width: columnWidth },
            col.isWeekend && styles.weekendColumn,
          ]}
        >
          <Text style={styles.text}>{col.label}</Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: TIMELINE_HEIGHT,
  },
  column: {
    borderRightWidth: 1,
    borderRightColor: GANTT_COLORS.lightBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  weekendColumn: {
    backgroundColor: GANTT_COLORS.weekendBg,
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
  },
});
