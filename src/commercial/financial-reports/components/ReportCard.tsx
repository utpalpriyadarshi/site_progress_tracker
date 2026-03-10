import React from 'react';
import { StyleSheet } from 'react-native';
import { Card } from 'react-native-paper';

interface ReportCardProps {
  children: React.ReactNode;
  style?: object;
}

export const ReportCard: React.FC<ReportCardProps> = ({ children, style }) => {
  return (
    <Card mode="elevated" style={[styles.card, style]}>
      <Card.Content>{children}</Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    margin: 16,
    marginBottom: 0,
  },
});
