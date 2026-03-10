/**
 * Legend for Gantt chart
 * Supports two variants: 'tasks' (default) and 'key_dates'
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { GANTT_COLORS } from '../utils/ganttConstants';
import { COLORS } from '../../../theme/colors';

interface GanttLegendProps {
  showTodayMarker: boolean;
  showBaseline?: boolean;
  variant?: 'tasks' | 'key_dates';
}

export const GanttLegend: React.FC<GanttLegendProps> = ({
  showTodayMarker,
  showBaseline = false,
  variant = 'tasks',
}) => {
  return (
    <Card mode="elevated" style={styles.card}>
      <Card.Content>
        <View style={styles.legend}>
          {variant === 'key_dates' ? (
            // Key Dates legend — milestone status colours with diamond markers
            <>
              <View style={styles.legendItem}>
                <View style={[styles.diamond, { backgroundColor: COLORS.DISABLED }]} />
                <Text style={styles.legendText}>Not Started</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.diamond, { backgroundColor: COLORS.INFO }]} />
                <Text style={styles.legendText}>In Progress</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.diamond, { backgroundColor: COLORS.SUCCESS }]} />
                <Text style={styles.legendText}>Completed</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.diamond, { backgroundColor: COLORS.ERROR }]} />
                <Text style={styles.legendText}>Delayed</Text>
              </View>
            </>
          ) : (
            // Tasks legend — progress, critical path, today marker, baseline
            <>
              <View style={styles.legendItem}>
                <View style={[styles.legendBox, { backgroundColor: GANTT_COLORS.progress }]} />
                <Text style={styles.legendText}>Progress</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[
                  styles.legendBox,
                  { borderColor: GANTT_COLORS.critical, borderWidth: 3 },
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
            </>
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
  // Diamond shape for key date milestones
  diamond: {
    width: 14,
    height: 14,
    borderRadius: 2,
    transform: [{ rotate: '45deg' }],
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
});
