import React from 'react';
import { StyleSheet } from 'react-native';
import { Card, Title, Paragraph } from 'react-native-paper';

interface StatCardProps {
  value: number;
  label: string;
}

export const StatCard: React.FC<StatCardProps> = ({ value, label }) => {
  return (
    <Card mode="elevated" style={styles.statCard}>
      <Card.Content>
        <Title style={styles.statNumber}>{value}</Title>
        <Paragraph>{label}</Paragraph>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  statCard: {
    flex: 1,
    marginHorizontal: 5,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
    textAlign: 'center',
  },
});
