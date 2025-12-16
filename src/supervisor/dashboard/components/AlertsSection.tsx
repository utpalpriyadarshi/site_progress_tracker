import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Card } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';

/**
 * AlertsSection Component
 *
 * Displays alerts and notifications on dashboard
 * Part of Phase 3 - Task 3.1: Navigation UX Restructure
 */

interface Alert {
  id: string;
  type: 'warning' | 'error' | 'info';
  title: string;
  message: string;
  itemId?: string;
}

interface AlertsSectionProps {
  alerts: Alert[];
  onAlertPress?: (alert: Alert) => void;
}

export const AlertsSection: React.FC<AlertsSectionProps> = ({ alerts, onAlertPress }) => {
  if (alerts.length === 0) {
    return null; // Don't show section if no alerts
  }

  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      case 'info':
        return 'info';
      default:
        return 'info';
    }
  };

  const getAlertColor = (type: Alert['type']) => {
    switch (type) {
      case 'error':
        return '#f44336';
      case 'warning':
        return '#ff9800';
      case 'info':
        return '#2196f3';
      default:
        return '#2196f3';
    }
  };

  return (
    <View style={styles.container}>
      <Text variant="titleMedium" style={styles.sectionTitle}>
        Alerts & Notifications
      </Text>
      {alerts.map(alert => {
        const icon = getAlertIcon(alert.type);
        const color = getAlertColor(alert.type);

        return (
          <TouchableOpacity key={alert.id} onPress={() => onAlertPress?.(alert)}>
            <Card style={styles.alertCard}>
              <Card.Content style={styles.alertContent}>
                <Icon name={icon} size={24} color={color} />
                <View style={styles.alertText}>
                  <Text variant="titleSmall" style={styles.alertTitle}>
                    {alert.title}
                  </Text>
                  <Text variant="bodySmall" style={styles.alertMessage}>
                    {alert.message}
                  </Text>
                </View>
              </Card.Content>
            </Card>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
  },
  sectionTitle: {
    marginHorizontal: 16,
    marginBottom: 8,
    fontWeight: 'bold',
  },
  alertCard: {
    marginHorizontal: 16,
    marginVertical: 4,
    elevation: 1,
  },
  alertContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertText: {
    flex: 1,
    marginLeft: 12,
  },
  alertTitle: {
    fontWeight: 'bold',
  },
  alertMessage: {
    color: '#666',
    marginTop: 2,
  },
});
