import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const FinancialReportsScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Financial Reports</Text>
      <Text>Generate and analyze financial reports for projects</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});

export default FinancialReportsScreen;