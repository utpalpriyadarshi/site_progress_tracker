/**
 * InsightItem Component
 *
 * Display component for analytics insights with severity indicator
 * Phase 3: Small Components
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

export type InsightSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

interface InsightItemProps {
  title: string;
  description: string;
  recommendation?: string;
  severity: InsightSeverity;
}

export const InsightItem: React.FC<InsightItemProps> = ({
  title,
  description,
  recommendation,
  severity,
}) => {
  const backgroundColor = getSeverityColor(severity);
  const iconName = getSeverityIcon(severity);

  return (
    <View style={styles.container}>
      <View style={[styles.icon, { backgroundColor }]}>
        <Icon name={iconName} size={20} color="#FFF" />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
        {recommendation && (
          <Text style={styles.recommendation}>→ {recommendation}</Text>
        )}
      </View>
    </View>
  );
};

const getSeverityColor = (severity: InsightSeverity): string => {
  switch (severity) {
    case 'critical':
      return '#F44336';
    case 'high':
      return '#FF9800';
    case 'medium':
      return '#2196F3';
    case 'low':
      return '#4CAF50';
    case 'info':
      return '#9E9E9E';
    default:
      return '#999';
  }
};

const getSeverityIcon = (severity: InsightSeverity): string => {
  switch (severity) {
    case 'critical':
      return 'error';
    case 'high':
      return 'warning';
    case 'medium':
      return 'info';
    case 'low':
      return 'check-circle';
    case 'info':
      return 'info-outline';
    default:
      return 'info';
  }
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  icon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  recommendation: {
    fontSize: 12,
    color: '#2196F3',
    fontStyle: 'italic',
  },
});
