import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, FlatList, Alert } from 'react-native';
import { Card, Text, FAB, Chip } from 'react-native-paper';
import { database } from '../../models/database';
import { Q } from '@nozbe/watermelondb';
import ItemModel, { ProjectPhase } from '../../models/ItemModel';
import SiteModel from '../../models/SiteModel';
import WBSItemCard from './components/WBSItemCard';
import SimpleSiteSelector from './components/SimpleSiteSelector';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PlanningStackParamList } from '../nav/types';

type Props = NativeStackScreenProps<PlanningStackParamList, 'WBSManagement'>;

const WBSManagementScreen: React.FC<Props> = ({ navigation }) => {
  const [selectedSite, setSelectedSite] = useState<SiteModel | null>(null);
  const [items, setItems] = useState<ItemModel[]>([]);
  const [selectedPhase, setSelectedPhase] = useState<ProjectPhase | 'all'>('all');
  const [loading, setLoading] = useState(false);

  const loadItems = React.useCallback(async () => {
    if (!selectedSite) return;

    setLoading(true);
    try {
      const query = [Q.where('site_id', selectedSite.id)];

      if (selectedPhase !== 'all') {
        query.push(Q.where('project_phase', selectedPhase));
      }

      const siteItems = await database.collections
        .get<ItemModel>('items')
        .query(...query)
        .fetch();

      // Sort by WBS code
      siteItems.sort((a, b) => {
        return a.wbsCode.localeCompare(b.wbsCode, undefined, { numeric: true });
      });

      setItems(siteItems);
    } catch (error) {
      console.error('Error loading items:', error);
      Alert.alert('Error', 'Failed to load items');
    } finally {
      setLoading(false);
    }
  }, [selectedSite, selectedPhase]);

  // Load items when site or phase changes
  useEffect(() => {
    if (selectedSite) {
      loadItems();
    } else {
      setItems([]);
    }
  }, [selectedSite, selectedPhase, loadItems]);

  const handleAddItem = () => {
    if (!selectedSite) {
      Alert.alert('No Site Selected', 'Please select a site first.');
      return;
    }

    navigation.navigate('ItemCreation', {
      siteId: selectedSite.id,
    });
  };

  const handleEditItem = (item: ItemModel) => {
    if (item.isBaselineLocked) {
      Alert.alert(
        'Baseline Locked',
        'Cannot edit items after baseline is locked.',
        [{ text: 'OK' }]
      );
      return;
    }
    Alert.alert(
      'Edit Item',
      'Item editing will be implemented in Sprint 3',
      [{ text: 'OK' }]
    );
  };

  const handleDeleteItem = async (item: ItemModel) => {
    if (item.isBaselineLocked) {
      Alert.alert(
        'Baseline Locked',
        'Cannot delete items after baseline is locked.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Delete Item',
      `Are you sure you want to delete "${item.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await database.write(async () => {
                await item.destroyPermanently();
              });
              loadItems();
              Alert.alert('Success', 'Item deleted successfully');
            } catch (error) {
              console.error('Error deleting item:', error);
              Alert.alert('Error', 'Failed to delete item');
            }
          },
        },
      ]
    );
  };

  const phases: Array<{ key: ProjectPhase | 'all'; label: string }> = [
    { key: 'all', label: 'All Phases' },
    { key: 'design', label: 'Design' },
    { key: 'approvals', label: 'Approvals' },
    { key: 'mobilization', label: 'Mobilization' },
    { key: 'procurement', label: 'Procurement' },
    { key: 'interface', label: 'Interface' },
    { key: 'site_prep', label: 'Site Prep' },
    { key: 'construction', label: 'Construction' },
    { key: 'testing', label: 'Testing' },
    { key: 'commissioning', label: 'Commissioning' },
    { key: 'sat', label: 'SAT' },
    { key: 'handover', label: 'Handover' },
  ];

  return (
    <View style={styles.container}>
      {/* Site Selector */}
      <Card style={styles.selectorCard}>
        <Card.Content>
          <SimpleSiteSelector
            selectedSite={selectedSite}
            onSiteChange={setSelectedSite}
          />
        </Card.Content>
      </Card>

      {selectedSite && (
        <>
          {/* Phase Filter Chips */}
          <ScrollView
            horizontal
            style={styles.phaseFilter}
            contentContainerStyle={styles.phaseFilterContent}
            showsHorizontalScrollIndicator={false}
          >
            {phases.map(phase => (
              <Chip
                key={phase.key}
                selected={selectedPhase === phase.key}
                onPress={() => setSelectedPhase(phase.key)}
                style={styles.phaseChip}
              >
                {phase.label}
              </Chip>
            ))}
          </ScrollView>

          {/* Items List Header */}
          <View style={styles.itemsHeader}>
            <Text variant="titleMedium">
              Work Breakdown Structure ({items.length} items)
            </Text>
            {selectedPhase !== 'all' && (
              <Text variant="bodySmall" style={styles.filterInfo}>
                Filtered by: {phases.find(p => p.key === selectedPhase)?.label}
              </Text>
            )}
          </View>

          {/* Items List */}
          <FlatList
            data={items}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <WBSItemCard
                item={item}
                onPress={() => {}}
                onEdit={() => handleEditItem(item)}
                onDelete={() => handleDeleteItem(item)}
              />
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text variant="bodyLarge" style={styles.emptyText}>
                  {loading ? 'Loading items...' : 'No items in this phase'}
                </Text>
                {!loading && (
                  <Text variant="bodyMedium" style={styles.emptySubtext}>
                    Tap the + button to add items
                  </Text>
                )}
              </View>
            }
            style={styles.itemsList}
            contentContainerStyle={items.length === 0 ? styles.emptyList : undefined}
          />

          {/* FAB */}
          <FAB
            icon="plus"
            style={styles.fab}
            onPress={handleAddItem}
            label="Add Item"
          />
        </>
      )}

      {!selectedSite && (
        <View style={styles.noSiteContainer}>
          <Text variant="headlineSmall" style={styles.noSiteText}>
            Select a Site
          </Text>
          <Text variant="bodyMedium" style={styles.noSiteSubtext}>
            Choose a site from the selector above to view and manage work breakdown structure
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  selectorCard: {
    margin: 16,
    elevation: 2,
  },
  phaseFilter: {
    maxHeight: 60,
  },
  phaseFilterContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  phaseChip: {
    marginRight: 8,
  },
  itemsHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterInfo: {
    color: '#666',
    marginTop: 4,
  },
  itemsList: {
    flex: 1,
  },
  emptyList: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    color: '#999',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
  noSiteContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  noSiteText: {
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  noSiteSubtext: {
    color: '#999',
    textAlign: 'center',
  },
});

export default WBSManagementScreen;
