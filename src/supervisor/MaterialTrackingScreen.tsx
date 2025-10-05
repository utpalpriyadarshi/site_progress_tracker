import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { withObservables } from '@nozbe/watermelondb/react';
import { database } from '../../models/database';
import { Q } from '@nozbe/watermelondb';
import { useSiteContext } from './context/SiteContext';
import SiteSelector from './components/SiteSelector';
import MaterialModel from '../../models/MaterialModel';
import ItemModel from '../../models/ItemModel';

// Sample Material Tracking screen for construction supervisors
const MaterialTrackingScreenComponent = ({
  materials,
  items,
}: {
  materials: MaterialModel[];
  items: ItemModel[];
}) => {
  const { selectedSiteId } = useSiteContext();
  const [filteredMaterials, setFilteredMaterials] = useState<MaterialModel[]>([]);

  // Filter materials based on selected site
  useEffect(() => {
    if (selectedSiteId === 'all') {
      setFilteredMaterials(materials);
    } else {
      // Get items for selected site
      const siteItems = items.filter(item => item.siteId === selectedSiteId);
      const siteItemIds = siteItems.map(item => item.id);

      // Filter materials that belong to items of the selected site
      const siteMaterials = materials.filter(material =>
        siteItemIds.includes(material.itemId)
      );
      setFilteredMaterials(siteMaterials);
    }
  }, [materials, items, selectedSiteId]);

  const getStatusColor = (material: MaterialModel): string => {
    const availablePercent = (material.quantityAvailable / material.quantityRequired) * 100;
    if (availablePercent < 50) return 'shortage';
    if (availablePercent < 80) return 'low';
    return 'ok';
  };

  const renderMaterial = ({ item }: { item: MaterialModel }) => {
    const status = getStatusColor(item);

    return (
      <View style={[
        styles.materialItem,
        status === 'shortage' && styles.shortage,
        status === 'low' && styles.low,
        status === 'ok' && styles.ok
      ]}>
        <View style={styles.materialInfo}>
          <Text style={styles.materialName}>{item.name}</Text>
          <Text style={styles.materialDetails}>
            Required: {item.quantityRequired} {item.unit} | Available: {item.quantityAvailable} {item.unit} | Used: {item.quantityUsed} {item.unit}
          </Text>
          {item.supplier && (
            <Text style={styles.supplierText}>Supplier: {item.supplier}</Text>
          )}
          <Text style={[styles.statusText, status === 'shortage' && styles.shortageText]}>
            Status: {item.status}
          </Text>
        </View>
        <TouchableOpacity style={styles.updateButton}>
          <Text style={styles.updateButtonText}>Update</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Material Tracking</Text>
        <Text style={styles.subtitle}>Track material usage and identify shortages</Text>
      </View>

      {/* Site Selector */}
      <View style={styles.selectorContainer}>
        <SiteSelector />
      </View>

      {filteredMaterials.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No materials found for selected site</Text>
        </View>
      ) : (
        <FlatList
          data={filteredMaterials}
          renderItem={renderMaterial}
          keyExtractor={item => item.id}
          style={styles.list}
        />
      )}

      <TouchableOpacity style={styles.scanButton}>
        <Text style={styles.scanButtonText}>Scan Material Delivery</Text>
      </TouchableOpacity>
    </View>
  );
};

const enhance = withObservables([], () => ({
  materials: database.collections.get('materials').query(),
  items: database.collections.get('items').query(),
}));

const MaterialTrackingScreen = enhance(MaterialTrackingScreenComponent);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: 'white',
    padding: 16,
    elevation: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  selectorContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingBottom: 8,
    elevation: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  list: {
    flex: 1,
    padding: 16,
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
    marginBottom: 4,
  },
  supplierText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#4CD964',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  shortageText: {
    color: '#FF3B30',
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