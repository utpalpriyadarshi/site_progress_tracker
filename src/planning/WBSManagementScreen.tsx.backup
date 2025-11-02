import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, FlatList } from 'react-native';
import { Card, Text, FAB, Chip } from 'react-native-paper';
import { database } from '../../models/database';
import { Q } from '@nozbe/watermelondb';
import ItemModel, { ProjectPhase } from '../../models/ItemModel';
import SiteModel from '../../models/SiteModel';
import WBSItemCard from './components/WBSItemCard';
import SimpleSiteSelector from './components/SimpleSiteSelector';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PlanningStackParamList } from '../nav/types';
import { useSnackbar } from '../components/Snackbar';
import { ConfirmDialog } from '../components/Dialog';

type Props = NativeStackScreenProps<PlanningStackParamList, 'WBSManagement'>;

const WBSManagementScreen: React.FC<Props> = ({ navigation }) => {
  const { showSnackbar } = useSnackbar();
  const [selectedSite, setSelectedSite] = useState<SiteModel | null>(null);
  const [items, setItems] = useState<ItemModel[]>([]);
  const [selectedPhase, setSelectedPhase] = useState<ProjectPhase | 'all'>('all');
  const [loading, setLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ItemModel | null>(null);

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

      // Fix status for items where status doesn't match progress
      // This handles items created before auto-status was implemented
      await database.write(async () => {
        for (const item of siteItems) {
          const progress = item.getProgressPercentage();
          let correctStatus = 'not_started';

          if (progress >= 100) {
            correctStatus = 'completed';
          } else if (progress > 0) {
            correctStatus = 'in_progress';
          }

          // Only update if status is incorrect
          if (item.status !== correctStatus) {
            await item.update((i: any) => {
              i.status = correctStatus;
            });
          }
        }
      });

      // Sort by WBS code
      siteItems.sort((a, b) => {
        return a.wbsCode.localeCompare(b.wbsCode, undefined, { numeric: true });
      });

      setItems(siteItems);
    } catch (error) {
      console.error('Error loading items:', error);
      showSnackbar('Failed to load items', 'error');
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

  // Reload items when screen comes into focus (after creating/editing)
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (selectedSite) {
        loadItems();
      }
    });

    return unsubscribe;
  }, [navigation, selectedSite, loadItems]);

  const handleAddItem = () => {
    if (!selectedSite) {
      showSnackbar('Please select a site first', 'warning');
      return;
    }

    navigation.navigate('ItemCreation', {
      siteId: selectedSite.id,
    });
  };

  const handleAddChildItem = (parentItem: ItemModel) => {
    if (parentItem.isBaselineLocked) {
      showSnackbar('Cannot add child items after baseline is locked', 'warning');
      return;
    }

    if (parentItem.wbsLevel >= 4) {
      showSnackbar('Cannot create child items beyond level 4', 'warning');
      return;
    }

    navigation.navigate('ItemCreation', {
      siteId: selectedSite!.id,
      parentWbsCode: parentItem.wbsCode,
    });
  };

  const handleEditItem = (item: ItemModel) => {
    if (item.isBaselineLocked) {
      showSnackbar('Cannot edit items after baseline is locked', 'warning');
      return;
    }

    navigation.navigate('ItemEdit', {
      itemId: item.id,
    });
  };

  const handleDeleteItem = async (item: ItemModel) => {
    if (item.isBaselineLocked) {
      showSnackbar('Cannot delete items after baseline is locked', 'warning');
      return;
    }

    setItemToDelete(item);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;

    setShowDeleteDialog(false);
    try {
      await database.write(async () => {
        await itemToDelete.destroyPermanently();
      });
      loadItems();
      showSnackbar(`"${itemToDelete.name}" deleted successfully`, 'success');
      setItemToDelete(null);
    } catch (error) {
      console.error('Error deleting item:', error);
      showSnackbar('Failed to delete item', 'error');
    }
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
                onAddChild={() => handleAddChildItem(item)}
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

      <ConfirmDialog
        visible={showDeleteDialog}
        title="Delete Item"
        message={`Are you sure you want to delete "${itemToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onCancel={() => {
          setShowDeleteDialog(false);
          setItemToDelete(null);
        }}
        destructive={true}
      />
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
