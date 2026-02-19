/**
 * HealthScoreCircle Component
 *
 * Circular display for logistics health score with visual indicator
 * Phase 3: Small Components
 *
 * WCAG 2.1 AA Accessibility:
 * - Text alternative for circular score display
 * - Proper accessibility label with score context
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../../theme/colors';

interface HealthScoreCircleProps {
  score: number;
  maxScore?: number;
  color?: string;
  label?: string;
}

export const HealthScoreCircle: React.FC<HealthScoreCircleProps> = ({
  score,
  maxScore = 100,
  color = COLORS.INFO,
  label = 'Health score',
}) => {
  const scorePercentage = Math.round((score / maxScore) * 100);
  const scoreStatus = scorePercentage >= 80 ? 'good' : scorePercentage >= 60 ? 'moderate' : 'needs attention';

  return (
    <View
      style={[styles.circle, { borderColor: color }]}
      accessible
      accessibilityRole="text"
      accessibilityLabel={`${label}: ${score.toFixed(0)} out of ${maxScore}, ${scorePercentage}%, status ${scoreStatus}`}
    >
      <Text style={[styles.value, { color }]}>{score.toFixed(0)}</Text>
      <Text style={styles.label}>/ {maxScore}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  circle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
  },
  value: {
    fontSize: 32,
    fontWeight: '700',
  },
  label: {
    fontSize: 12,
    color: '#666',
  },
});
