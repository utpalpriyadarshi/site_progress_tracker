import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const TeamManagementScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Team Management</Text>
      <Text>Manage construction teams and assign tasks</Text>
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

export default TeamManagementScreen;