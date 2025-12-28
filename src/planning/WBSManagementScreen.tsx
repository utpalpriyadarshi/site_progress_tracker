import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, ScrollView, FlatList } from 'react-native';
import { Card, Text, FAB, Chip, Button } from 'react-native-paper';
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
import { SearchBar, FilterChips, SortMenu, FilterOption, SortOption } from '../components';
import { logger } from '../services/LoggingService';

type Props = NativeStackScreenProps<PlanningStackParamList, 'WBSManagement'>;

// Status filter options
const STATUS_FILTERS: FilterOption[] = [
  { id: 'all', label: 'All Status' },
  { id: 'not_started', label: 'Not Started', icon: 'circle-outline' },
  { id: 'in_progress', label: 'In Progress', icon: 'progress-clock' },
  { id: 'completed', label: 'Completed', icon: 'check-circle' },
];

// Sort options
const SORT_OPTIONS: SortOption[] = [
  { id: 'wbs', label: 'WBS Code', icon: 'numeric' },
  { id: 'name', label: 'Name', icon: 'format-letter-case' },
  { id: 'duration', label: 'Duration', icon: 'clock-outline' },
  { id: 'progress', label: 'Progress', icon: 'chart-line' },
];

const WBSManagementScreen: React.FC<Props> = ({ navigation }) => {
  const { showSnackbar } = useSnackbar();
  const [selectedSite, setSelectedSite] = useState<SiteModel | null>(null);
  const [items, setItems] = useState<ItemModel[]>([]);
  const [selectedPhase, setSelectedPhase] = useState<ProjectPhase | 'all'>('all');
  const [loading, setLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ItemModel | null>(null);

  // Search, filter, sort state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string[]>(['all']);
  const [showCriticalPathOnly, setShowCriticalPathOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'wbs' | 'name' | 'duration' | 'progress'>('wbs');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const loadItems = React.useCallback(async () => {
    if (!selectedSite) return;

    setLoading(true);
    try {
      const query = [Q.where('site_id', selectedSite.id)];

      // Note: We don't filter by phase in the query anymore
      // We'll do it in the displayedItems useMemo for better UX

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

      setItems(siteItems);
    } catch (error) {
      logger.error('[WBS] Error loading items', error as Error);
      showSnackbar('Failed to load items', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedSite]);

  // Combined filtering and sorting logic
  const displayedItems = useMemo(() => {
    let result = items;

    // 1. Search filter (name OR WBS code)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(item =>
        item.name.toLowerCase().includes(query) ||
        item.wbsCode.toLowerCase().includes(query)
      );
    }

    // 2. Phase filter
    if (selectedPhase !== 'all') {
      result = result.filter(item => item.projectPhase === selectedPhase);
    }

    // 3. Status filter
    if (!selectedStatus.includes('all')) {
      result = result.filter(item => selectedStatus.includes(item.status));
    }

    // 4. Critical path filter
    if (showCriticalPathOnly) {
      result = result.filter(item => item.isCriticalPath);
    }

    // 5. Sort
    result = [...result].sort((a, b) => {
      let comparison = 0;

      if (sortBy === 'wbs') {
        comparison = a.wbsCode.localeCompare(b.wbsCode, undefined, { numeric: true });
      } else if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === 'duration') {
        const durationA = a.plannedEndDate && a.plannedStartDate
          ? (a.plannedEndDate - a.plannedStartDate) / (1000 * 60 * 60 * 24)
          : 0;
        const durationB = b.plannedEndDate && b.plannedStartDate
          ? (b.plannedEndDate - b.plannedStartDate) / (1000 * 60 * 60 * 24)
          : 0;
        comparison = durationA - durationB;
      } else if (sortBy === 'progress') {
        const progressA = a.getProgressPercentage();
        const progressB = b.getProgressPercentage();
        comparison = progressA - progressB;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [items, searchQuery, selectedPhase, selectedStatus, showCriticalPathOnly, sortBy, sortDirection]);

  // Load items when site changes
  useEffect(() => {
    if (selectedSite) {
      loadItems();
    } else {
      setItems([]);
    }
  }, [selectedSite, loadItems]);

  // Reload items when screen comes into focus (after creating/editing)
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (selectedSite) {
        loadItems();
      }
    });

    return unsubscribe;
  }, [navigation, selectedSite, loadItems]);

  // Filter toggle handlers
  const handleStatusToggle = (id: string) => {
    if (id === 'all') {
      setSelectedStatus(['all']);
    } else {
      const newFilters = selectedStatus.includes(id)
        ? selectedStatus.filter(f => f !== id && f !== 'all')
        : [...selectedStatus.filter(f => f !== 'all'), id];
      setSelectedStatus(newFilters.length === 0 ? ['all'] : newFilters);
    }
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedPhase('all');
    setSelectedStatus(['all']);
    setShowCriticalPathOnly(false);
    setSortBy('wbs');
    setSortDirection('asc');
  };

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return searchQuery.trim() !== '' ||
           selectedPhase !== 'all' ||
           !selectedStatus.includes('all') ||
           showCriticalPathOnly;
  }, [searchQuery, selectedPhase, selectedStatus, showCriticalPathOnly]);

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
      logger.error('[WBS] Error deleting item', error as Error);
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
        <View style={styles.contentWrapper}>
          {/* Search Bar */}
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by name or WBS code..."
          />

          {/* Phase Filter Chips (Existing - Enhanced) */}
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

          {/* Status Filter Chips (New) */}
          <FilterChips
            filters={STATUS_FILTERS}
            selectedFilters={selectedStatus}
            onFilterToggle={handleStatusToggle}
          />

          {/* Critical Path Only Filter (New) */}
          <View style={styles.criticalPathFilter}>
            <Chip
              selected={showCriticalPathOnly}
              onPress={() => setShowCriticalPathOnly(!showCriticalPathOnly)}
              icon={showCriticalPathOnly ? 'check' : 'alert'}
              style={[
                styles.criticalPathChip,
                showCriticalPathOnly && styles.criticalPathChipActive,
              ]}
              textStyle={showCriticalPathOnly && styles.criticalPathChipText}
            >
              Critical Path Only
            </Chip>
          </View>

          {/* Results Row with Sort and Clear All */}
          <View style={styles.resultsRow}>
            <Text variant="bodySmall" style={styles.resultCount}>
              Showing {displayedItems.length} of {items.length} items
            </Text>

            {hasActiveFilters && (
              <Button mode="text" onPress={clearAllFilters} compact>
                Clear All
              </Button>
            )}

            <SortMenu
              sortOptions={SORT_OPTIONS}
              currentSort={sortBy}
              onSortChange={(id) => setSortBy(id as any)}
              sortDirection={sortDirection}
              onDirectionChange={setSortDirection}
            />
          </View>

          {/* Items List */}
          <FlatList
            data={displayedItems}
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
                  {loading
                    ? 'Loading items...'
                    : hasActiveFilters
                    ? 'No items match your filters'
                    : 'No items yet'}
                </Text>
                {!loading && (
                  <Text variant="bodyMedium" style={styles.emptySubtext}>
                    {hasActiveFilters
                      ? 'Try adjusting the search or filters'
                      : 'Tap the + button to add items'}
                  </Text>
                )}
              </View>
            }
            style={styles.itemsList}
            contentContainerStyle={displayedItems.length === 0 ? styles.emptyList : styles.itemsListContent}
          />

          {/* FAB */}
          <FAB
            icon="plus"
            style={styles.fab}
            onPress={handleAddItem}
            label="Add Item"
          />
        </View>
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
  contentWrapper: {
    flex: 1,
  },
  selectorCard: {
    margin: 12,
    marginBottom: 6,
    elevation: 2,
  },
  phaseFilter: {
    maxHeight: 50,
  },
  phaseFilterContent: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    gap: 6,
  },
  phaseChip: {
    marginRight: 6,
  },
  criticalPathFilter: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  criticalPathChip: {
    alignSelf: 'flex-start',
  },
  criticalPathChipActive: {
    backgroundColor: '#F44336',
  },
  criticalPathChipText: {
    color: '#fff',
    fontWeight: '600',
  },
  resultsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 4,
    backgroundColor: 'white',
  },
  resultCount: {
    flex: 1,
    color: '#666',
  },
  itemsList: {
    flex: 1,
  },
  itemsListContent: {
    paddingBottom: 100, // Extra padding for bottom tab bar + FAB
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
