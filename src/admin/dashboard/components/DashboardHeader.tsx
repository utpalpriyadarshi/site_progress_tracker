import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Title, Paragraph } from 'react-native-paper';

export const DashboardHeader: React.FC = () => {
  return (
    <View style={styles.header}>
      <Title style={styles.headerTitle}>Admin Dashboard</Title>
      <Paragraph style={styles.headerSubtitle}>
        Welcome to the Administration Panel
      </Paragraph>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    padding: 20,
    backgroundColor: '#007AFF',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#fff',
    fontSize: 14,
    marginTop: 5,
  },
});
