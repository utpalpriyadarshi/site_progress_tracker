import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from 'react-native-paper';
import { Alert, getAlertIcon, getAlertColor } from '../utils';

interface AlertsCardProps {
  alerts: Alert[];
}

export const AlertsCard: React.FC<AlertsCardProps> = ({ alerts }) => {
  if (alerts.length === 0) return null;

  return (
    <Card mode="elevated" style={styles.card}>
      <Card.Content>
        <Text style={styles.sectionTitle}>Alerts</Text>
        {alerts.map((alert, index) => (
          <View
            key={index}
            style={[styles.alertItem, { borderLeftColor: getAlertColor(alert.type) }]}
          >
            <Text style={styles.alertIcon}>{getAlertIcon(alert.type)}</Text>
            <Text style={[styles.alertText, { color: getAlertColor(alert.type) }]}>
              {alert.message}
            </Text>
          </View>
        ))}
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    margin: 16,
    marginBottom: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderLeftWidth: 4,
    marginBottom: 8,
  },
  alertIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  alertText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
});
