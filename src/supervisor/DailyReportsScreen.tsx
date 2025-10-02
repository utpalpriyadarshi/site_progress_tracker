import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { database } from '../../models/database';
import { withObservables } from '@nozbe/watermelondb/react';
import { StackNavigationProp } from '@react-navigation/stack';

// Define the type for the navigation prop
type RootStackParamList = {
  // Define your screen names here
};

type DailyReportsScreenNavigationProp = StackNavigationProp<RootStackParamList>;

// Sample component for daily reports screen
const DailyReportsScreenComponent = ({ navigation }: { navigation: DailyReportsScreenNavigationProp }) => {
  const [reportDate, setReportDate] = useState(new Date());
  
  const handleSaveReport = async () => {
    try {
      // In a real implementation, this would save the report to the database
      Alert.alert('Success', 'Daily report saved locally');
    } catch (error) {
      Alert.alert('Error', 'Failed to save report: ' + (error as Error).message);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Daily Progress Report</Text>
      <Text style={styles.subtitle}>Date: {reportDate.toDateString()}</Text>
      
      {/* Report sections */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Work Completed</Text>
        <Text>Foundation pouring - 100%</Text>
        <Text>Framing - 75%</Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Issues Identified</Text>
        <Text>Delivery delay on concrete</Text>
        <Text>Weather impact on schedule</Text>
      </View>
      
      <TouchableOpacity style={styles.saveButton} onPress={handleSaveReport}>
        <Text style={styles.saveButtonText}>Save Report</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const enhance = withObservables([], () => ({}));

const DailyReportsScreen = enhance(DailyReportsScreenComponent);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 24,
    color: '#666',
  },
  section: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 16,
    borderRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default DailyReportsScreen;