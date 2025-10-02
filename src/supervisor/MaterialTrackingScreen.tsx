import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { withObservables } from '@nozbe/watermelondb/react';
import { database } from '../../models/database';

// Define an interface for the material data
interface Material {
  id: string;
  name: string;
  required: number;
  available: number;
  used: number;
  unit: string;
  status: 'shortage' | 'low' | 'ok';
}

// Sample Material Tracking screen for construction supervisors
const MaterialTrackingScreenComponent = () => {
  // Sample material data structure
  const materials: Material[] = [
    { id: '1', name: 'Concrete', required: 100, available: 90, used: 25, unit: 'm³', status: 'shortage' },
    { id: '2', name: 'Steel Beams', required: 50, available: 45, used: 30, unit: 'pieces', status: 'low' },
    { id: '3', name: 'Cement Bags', required: 200, available: 210, used: 120, unit: 'bags', status: 'ok' },
    { id: '4', name: 'Rebar', required: 1000, available: 950, used: 600, unit: 'kg', status: 'shortage' },
  ];

  const renderMaterial = ({ item }: { item: Material }) => (
    <View style={[
      styles.materialItem, 
      item.status === 'shortage' && styles.shortage,
      item.status === 'low' && styles.low,
      item.status === 'ok' && styles.ok
    ]}>
      <View style={styles.materialInfo}>
        <Text style={styles.materialName}>{item.name}</Text>
        <Text style={styles.materialDetails}>
          Required: {item.required} {item.unit} | Available: {item.available} {item.unit} | Used: {item.used} {item.unit}
        </Text>
      </View>
      <TouchableOpacity style={styles.updateButton}>
        <Text style={styles.updateButtonText}>Update</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Material Tracking</Text>
      <Text style={styles.subtitle}>Track material usage and identify shortages</Text>
      
      <FlatList
        data={materials}
        renderItem={renderMaterial}
        keyExtractor={item => item.id}
        style={styles.list}
      />
      
      <TouchableOpacity style={styles.scanButton}>
        <Text style={styles.scanButtonText}>Scan Material Delivery</Text>
      </TouchableOpacity>
    </View>
  );
};

const enhance = withObservables([], () => ({}));

const MaterialTrackingScreen = enhance(MaterialTrackingScreenComponent);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 24,
    color: '#666',
  },
  list: {
    flex: 1,
  },
  materialItem: {
    backgroundColor: 'white',
    padding: 16,
    marginVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
  },
  shortage: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF3B30', // Red for shortage
  },
  low: {
    borderLeftWidth: 4,
    borderLeftColor: '#FFCC00', // Yellow for low
  },
  ok: {
    borderLeftWidth: 4,
    borderLeftColor: '#4CD964', // Green for OK
  },
  materialInfo: {
    flex: 1,
  },
  materialName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  materialDetails: {
    fontSize: 14,
    color: '#666',
  },
  updateButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
  updateButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  scanButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  scanButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default MaterialTrackingScreen;