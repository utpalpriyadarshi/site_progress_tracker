/**
 * Legend for Gantt chart
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { GANTT_COLORS } from '../utils/ganttConstants';

interface GanttLegendProps {
  showTodayMarker: boolean;
  showBaseline?: boolean;
}

export const GanttLegend: React.FC<GanttLegendProps> = ({ showTodayMarker, showBaseline = false }) => {
  return (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, { backgroundColor: GANTT_COLORS.progress }]} />
            <Text style={styles.legendText}>Progress</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[
              styles.legendBox,
              { borderColor: GANTT_COLORS.critical, borderWidth: 3 }
            ]} />
            <Text style={styles.legendText}>Critical Path</Text>
          </View>
          {showTodayMarker && (
            <View style={styles.legendItem}>
              <View style={[styles.legendBox, { backgroundColor: GANTT_COLORS.today }]} />
              <Text style={styles.legendText}>Today</Text>
            </View>
          )}
          {showBaseline && (
            <View style={styles.legendItem}>
              <View style={[styles.legendBox, { backgroundColor: GANTT_COLORS.baseline, opacity: 0.5 }]} />
              <Text style={styles.legendText}>Baseline</Text>
            </View>
          )}
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 8,
    elevation: 2,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendBox: {
    width: 20,
    height: 20,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
});
