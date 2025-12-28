import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { InventoryItem, InventoryLocation } from '../../../services/InventoryOptimizationService';
import InventoryOptimizationService from '../../../services/InventoryOptimizationService';

interface LocationsViewProps {
  locations: InventoryLocation[];
  items: InventoryItem[];
  onLocationPress?: (location: InventoryLocation) => void;
}

/**
 * LocationsView Component
 *
 * Displays inventory locations with:
 * - Location details and status
 * - Capacity usage visualization
 * - Stock valuation per location
 * - Operating costs
 * - Special features (climate control, security)
 *
 * Extracted from InventoryManagementScreen.tsx Phase 4.
 */
export const LocationsView: React.FC<LocationsViewProps> = ({
  locations,
  items,
  onLocationPress,
}) => {
  const renderLocationCard = (location: InventoryLocation) => {
    const locationItems = items.filter(item => item.locationId === location.id);
    const valuation = InventoryOptimizationService.calculateInventoryValuation(
      location.id,
      location.name,
      items
    );

    const capacityPercent = (location.usedCapacity / location.totalCapacity) * 100;
    const capacityColor = capacityPercent > 90 ? '#ef4444' : capacityPercent > 70 ? '#f59e0b' : '#10b981';

    return (
      <TouchableOpacity
        key={location.id}
        style={styles.card}
        onPress={() => onLocationPress?.(location)}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.name}>{location.name}</Text>
            <Text style={styles.type}>{location.type.toUpperCase()}</Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: location.isActive ? '#10b981' : '#6b7280' },
            ]}
          >
            <Text style={styles.statusText}>
              {location.isActive ? 'ACTIVE' : 'INACTIVE'}
            </Text>
          </View>
        </View>

        {/* Capacity */}
        <View style={styles.capacityContainer}>
          <Text style={styles.capacityLabel}>Capacity Usage</Text>
          <View style={styles.capacityBar}>
            <View
              style={[
                styles.capacityFill,
                {
                  width: `${capacityPercent}%`,
                  backgroundColor: capacityColor,
                },
              ]}
            />
          </View>
          <Text style={styles.capacityText}>
            {location.usedCapacity}m³ / {location.totalCapacity}m³ ({capacityPercent.toFixed(0)}%)
          </Text>
        </View>

        {/* Stats */}
        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{locationItems.length}</Text>
            <Text style={styles.statLabel}>Items</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>
              ₹{(valuation.totalValue / 1000).toFixed(0)}K
            </Text>
            <Text style={styles.statLabel}>Value</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>
              ₹{(location.operatingCost / 1000).toFixed(0)}K
            </Text>
            <Text style={styles.statLabel}>Op Cost/mo</Text>
          </View>
        </View>

        {/* Features */}
        {(location.hasClimateControl || location.hasSecurity) && (
          <View style={styles.features}>
            {location.hasClimateControl && (
              <View style={styles.featureBadge}>
                <Text style={styles.featureText}>Climate</Text>
              </View>
            )}
            {location.hasSecurity && (
              <View style={styles.featureBadge}>
                <Text style={styles.featureText}>Security</Text>
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView style={styles.scroll}>
      {locations.map(location => renderLocationCard(location))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  type: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  capacityContainer: {
    marginBottom: 16,
  },
  capacityLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  capacityBar: {
    height: 12,
    backgroundColor: '#e5e7eb',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 4,
  },
  capacityFill: {
    height: '100%',
  },
  capacityText: {
    fontSize: 12,
    color: '#6b7280',
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: '#6b7280',
  },
  features: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  featureBadge: {
    backgroundColor: '#dbeafe',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  featureText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1e40af',
  },
});
