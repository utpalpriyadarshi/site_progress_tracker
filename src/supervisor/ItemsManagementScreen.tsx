import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
} from 'react-native';
import {
  Card,
  Button,
  TextInput,
  Portal,
  Dialog,
  IconButton,
  Chip,
  Text,
  SegmentedButtons,
  Menu,
} from 'react-native-paper';
import { database } from '../../models/database';
import { withObservables } from '@nozbe/watermelondb/react';
import { Q } from '@nozbe/watermelondb';
import ItemModel, { ProjectPhase } from '../../models/ItemModel';
import SiteModel from '../../models/SiteModel';
import CategoryModel from '../../models/CategoryModel';
import { useSiteContext } from './context/SiteContext';
import SiteSelector from './components/SiteSelector';
import { useSnackbar } from '../components/Snackbar';
import { ConfirmDialog } from '../components/Dialog';
import { CopyItemsDialog, DuplicateItemsDialog } from '../components/dialogs';
import { SearchBar, FilterChips, SortMenu, FilterOption, SortOption } from '../components';
import { logger } from '../services/LoggingService';
import { SupervisorHeader, EmptyState } from '../components/common';
import { useDebounce } from '../hooks';
import { sortCategoriesByOrder } from '../utils/categoryOrder';
import { COLORS } from '../theme/colors';

// Status filter options
const STATUS_FILTERS: FilterOption[] = [
  { id: 'all', label: 'All Status' },
  { id: 'not_started', label: 'Not Started', icon: 'circle-outline' },
  { id: 'in_progress', label: 'In Progress', icon: 'progress-clock' },
  { id: 'completed', label: 'Completed', icon: 'check-circle' },
];

// Phase filter options (6 site-relevant phases for supervisors)
// Removed: design, approvals, mobilization, procurement, interface (office/planning phases)
const PHASE_FILTERS: FilterOption[] = [
  { id: 'all', label: 'All Phases' },
  { id: 'site_prep', label: 'Site Prep', icon: 'bulldozer', color: '#8BC34A' },
  { id: 'construction', label: 'Construction', icon: 'hammer', color: COLORS.SUCCESS },
  { id: 'testing', label: 'Testing', icon: 'test-tube', color: COLORS.INFO },
  { id: 'commissioning', label: 'Commissioning', icon: 'power-plug', color: '#3F51B5' },
  { id: 'sat', label: 'SAT', icon: 'clipboard-check', color: COLORS.PRIMARY },
  { id: 'handover', label: 'Handover', icon: 'handshake', color: '#009688' },
];

// Sort options
const SORT_OPTIONS: SortOption[] = [
  { id: 'name', label: 'Name', icon: 'format-letter-case' },
  { id: 'date', label: 'Start Date', icon: 'calendar' },
  { id: 'progress', label: 'Progress', icon: 'chart-line' },
];

const ItemsManagementScreenComponent = ({
  items,
  sites: _sites,
  categories,
}: {
  items: ItemModel[];
  sites: SiteModel[];
  categories: CategoryModel[];
}) => {
  const { selectedSiteId } = useSiteContext();
  const { showSnackbar } = useSnackbar();

  // Search, filter, sort state
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300); // Debounce search (Phase 3.4)
  const [selectedStatus, setSelectedStatus] = useState<string[]>(['all']);
  const [selectedPhases, setSelectedPhases] = useState<string[]>(['all']);
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'progress'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Existing state
  const [filteredItems, setFilteredItems] = useState<ItemModel[]>([]);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<ItemModel | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ItemModel | null>(null);

  // Copy feature state
  const [overflowMenuVisible, setOverflowMenuVisible] = useState(false);
  const [copyDialogVisible, setCopyDialogVisible] = useState(false);
  const [duplicateDialogVisible, setDuplicateDialogVisible] = useState(false);
  const [duplicateItems, setDuplicateItems] = useState<string[]>([]);
  const [pendingCopyCallback, setPendingCopyCallback] = useState<
    ((skipDuplicates: boolean, selectedDuplicates: string[]) => void) | null
  >(null);

  // Form fields
  const [itemName, setItemName] = useState('');
  const [plannedQuantity, setPlannedQuantity] = useState('');
  const [completedQuantity, setCompletedQuantity] = useState('');
  const [unitOfMeasurement, setUnitOfMeasurement] = useState('cubic_meters');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [plannedStartDate, setPlannedStartDate] = useState('');
  const [plannedEndDate, setPlannedEndDate] = useState('');
  const [weightage, setWeightage] = useState('');
  const [status, setStatus] = useState('not_started');
  const [unitMenuVisible, setUnitMenuVisible] = useState(false);

  // Common units
  const commonUnits = [
    { value: 'cubic_meters', label: 'm³' },
    { value: 'square_meters', label: 'm²' },
    { value: 'linear_meters', label: 'm' },
    { value: 'tons', label: 'tons' },
    { value: 'pieces', label: 'pcs' },
    { value: 'bags', label: 'bags' },
    { value: 'kg', label: 'kg' },
    { value: 'numbers', label: 'nos' },
  ];

  // Deduplicate and sort categories by predefined order (memoized)
  const sortedCategories = useMemo(() => {
    // Remove duplicates by name (keep first occurrence)
    const uniqueCategories = categories.reduce((acc, category) => {
      const exists = acc.find(c => c.name === category.name);
      if (!exists) {
        acc.push(category);
      }
      return acc;
    }, [] as CategoryModel[]);

    return sortCategoriesByOrder(uniqueCategories);
  }, [categories]);

  // Combined filtering and sorting logic (memoized for performance)
  const displayedItems = useMemo(() => {
    let result = items;

    // 1. Filter by selected site (existing logic)
    if (selectedSiteId !== 'all') {
      result = result.filter(item => item.siteId === selectedSiteId);
    }

    // 2. Search filter (using debounced value for better performance)
    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase();
      result = result.filter(item =>
        item.name.toLowerCase().includes(query)
      );
    }

    // 3. Status filter
    if (!selectedStatus.includes('all')) {
      result = result.filter(item => selectedStatus.includes(item.status));
    }

    // 4. Phase filter
    if (!selectedPhases.includes('all')) {
      result = result.filter(item => {
        const itemPhase = item.projectPhase || '';
        return selectedPhases.includes(itemPhase);
      });
    }

    // 5. Sort
    result = [...result].sort((a, b) => {
      let comparison = 0;

      if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === 'date') {
        const dateA = a.plannedStartDate || 0;
        const dateB = b.plannedStartDate || 0;
        comparison = dateA - dateB;
      } else if (sortBy === 'progress') {
        const progressA = getProgressPercentage(a);
        const progressB = getProgressPercentage(b);
        comparison = progressA - progressB;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [items, selectedSiteId, debouncedSearchQuery, selectedStatus, selectedPhases, sortBy, sortDirection]);

  // Update filteredItems when displayedItems changes
  useEffect(() => {
    setFilteredItems(displayedItems);
  }, [displayedItems]);

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

  const handlePhaseToggle = (id: string) => {
    if (id === 'all') {
      setSelectedPhases(['all']);
    } else {
      const newFilters = selectedPhases.includes(id)
        ? selectedPhases.filter(f => f !== id && f !== 'all')
        : [...selectedPhases.filter(f => f !== 'all'), id];
      setSelectedPhases(newFilters.length === 0 ? ['all'] : newFilters);
    }
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedStatus(['all']);
    setSelectedPhases(['all']);
    setSortBy('name');
    setSortDirection('asc');
  };

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return debouncedSearchQuery.trim() !== '' ||
           !selectedStatus.includes('all') ||
           !selectedPhases.includes('all');
  }, [debouncedSearchQuery, selectedStatus, selectedPhases]);

  // Check if copy is available (need items in current site)
  const canCopy = useMemo(() => {
    if (selectedSiteId === 'all') return false;
    const siteItems = items.filter(item => item.siteId === selectedSiteId);
    return siteItems.length > 0;
  }, [selectedSiteId, items]);

  // Copy feature handlers
  const handleCopySuccess = (copiedCount: number, destinationSiteName: string) => {
    showSnackbar(
      `✓ ${copiedCount} items copied to ${destinationSiteName}`,
      'success'
    );
    setCopyDialogVisible(false);
  };

  const handleDuplicatesFound = (
    duplicates: string[],
    proceedWithCopy: (skipDuplicates: boolean, selectedDuplicates: string[]) => void
  ) => {
    setDuplicateItems(duplicates);
    setPendingCopyCallback(() => proceedWithCopy);
    setDuplicateDialogVisible(true);
  };

  const handleSkipDuplicates = (namesToSkip: string[]) => {
    if (pendingCopyCallback) {
      pendingCopyCallback(true, namesToSkip);
    }
    setDuplicateDialogVisible(false);
    setPendingCopyCallback(null);
  };

  const handleCreateAllDuplicates = () => {
    if (pendingCopyCallback) {
      pendingCopyCallback(false, []);
    }
    setDuplicateDialogVisible(false);
    setPendingCopyCallback(null);
  };

  const handleDuplicateCancel = () => {
    setDuplicateDialogVisible(false);
    setCopyDialogVisible(false);
    setPendingCopyCallback(null);
  };

  const openAddDialog = () => {
    if (selectedSiteId === 'all') {
      showSnackbar('Please select a specific site to add items to', 'warning');
      return;
    }

    setEditingItem(null);
    setItemName('');
    setPlannedQuantity('');
    setCompletedQuantity('0');
    setUnitOfMeasurement('cubic_meters');
    setSelectedCategoryId(sortedCategories[0]?.id || '');
    setPlannedStartDate('');
    setPlannedEndDate('');
    setWeightage('');
    setStatus('not_started');
    setDialogVisible(true);
  };

  const openEditDialog = (item: ItemModel) => {
    setEditingItem(item);
    setItemName(item.name);
    setPlannedQuantity(item.plannedQuantity.toString());
    setCompletedQuantity(item.completedQuantity.toString());
    setUnitOfMeasurement(item.unitOfMeasurement);
    setSelectedCategoryId(item.categoryId);
    setPlannedStartDate(item.plannedStartDate?.toString() || '');
    setPlannedEndDate(item.plannedEndDate?.toString() || '');
    setWeightage(item.weightage?.toString() || '');
    setStatus(item.status);
    setDialogVisible(true);
  };

  const saveItem = async () => {
    if (!itemName.trim()) {
      showSnackbar('Please enter item name', 'warning');
      return;
    }

    if (!selectedCategoryId) {
      showSnackbar('Please select a category', 'warning');
      return;
    }

    try {
      await database.write(async () => {
        if (editingItem) {
          // Update existing item
          await editingItem.update(item => {
            item.name = itemName.trim();
            item.plannedQuantity = parseFloat(plannedQuantity) || 0;
            item.completedQuantity = parseFloat(completedQuantity) || 0;
            item.unitOfMeasurement = unitOfMeasurement;
            item.categoryId = selectedCategoryId;
            item.weightage = parseFloat(weightage) || 0;
            item.status = status;

            if (plannedStartDate) {
              item.plannedStartDate = parseInt(plannedStartDate, 10);
            }
            if (plannedEndDate) {
              item.plannedEndDate = parseInt(plannedEndDate, 10);
            }
          });
          showSnackbar('Item updated successfully', 'success');
        } else {
          // Create new item
          await database.collections.get('items').create(item => {
            item.name = itemName.trim();
            item.siteId = selectedSiteId;
            item.categoryId = selectedCategoryId;
            item.plannedQuantity = parseFloat(plannedQuantity) || 0;
            item.completedQuantity = parseFloat(completedQuantity) || 0;
            item.unitOfMeasurement = unitOfMeasurement;
            item.weightage = parseFloat(weightage) || 0;
            item.status = status;

            if (plannedStartDate) {
              item.plannedStartDate = parseInt(plannedStartDate, 10);
            }
            if (plannedEndDate) {
              item.plannedEndDate = parseInt(plannedEndDate, 10);
            }
          });
          showSnackbar('Item created successfully', 'success');
        }
      });

      setDialogVisible(false);
    } catch (error) {
      logger.error('Failed to save item', error as Error, {
        component: 'ItemsManagementScreen',
        action: 'saveItem',
        itemName,
      });
      showSnackbar('Failed to save item: ' + (error as Error).message, 'error');
    }
  };

  const handleDelete = (item: ItemModel) => {
    setItemToDelete(item);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      await database.write(async () => {
        await itemToDelete.markAsDeleted();
      });

      showSnackbar('Item deleted successfully', 'success');
      setShowDeleteDialog(false);
      setItemToDelete(null);
    } catch (error) {
      logger.error('Failed to delete item', error as Error, {
        component: 'ItemsManagementScreen',
        action: 'deleteItem',
        itemId: itemToDelete?.id,
      });
      showSnackbar('Failed to delete item: ' + (error as Error).message, 'error');
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed':
        return COLORS.SUCCESS;
      case 'in_progress':
        return COLORS.INFO;
      case 'not_started':
        return COLORS.DISABLED;
      default:
        return COLORS.DISABLED;
    }
  };

  const getCategoryName = (categoryId: string): string => {
    const category = categories.find(c => c.id === categoryId);
    return category?.name || 'Unknown';
  };

  const getProgressPercentage = (item: ItemModel): number => {
    if (item.plannedQuantity === 0) return 0;
    return Math.min((item.completedQuantity / item.plannedQuantity) * 100, 100);
  };

  return (
    <View style={styles.container}>
      <SupervisorHeader
        title="Manage Items"
        rightActions={
          <Menu
            visible={overflowMenuVisible}
            onDismiss={() => setOverflowMenuVisible(false)}
            anchor={
              <IconButton
                icon="dots-vertical"
                iconColor="#fff"
                onPress={() => setOverflowMenuVisible(true)}
              />
            }
          >
            <Menu.Item
              onPress={() => {
                setOverflowMenuVisible(false);
                if (canCopy) {
                  setCopyDialogVisible(true);
                } else {
                  showSnackbar('Please select a site with items to copy', 'warning');
                }
              }}
              title="Copy Items to Another Site"
              leadingIcon="content-copy"
              disabled={!canCopy}
            />
          </Menu>
        }
      />

      <View style={styles.header}>
        <Button
          mode="contained"
          icon="plus"
          onPress={openAddDialog}
          style={styles.addButton}
        >
          Add Item
        </Button>
      </View>

      {/* Site Selector */}
      <View style={styles.selectorContainer}>
        <SiteSelector />
      </View>

      {/* Search Bar */}
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search items by name..."
      />

      {/* Status Filter Chips */}
      <FilterChips
        filters={STATUS_FILTERS}
        selectedFilters={selectedStatus}
        onFilterToggle={handleStatusToggle}
      />

      {/* Phase Filter Chips */}
      <FilterChips
        filters={PHASE_FILTERS}
        selectedFilters={selectedPhases}
        onFilterToggle={handlePhaseToggle}
      />

      {/* Results Row with Sort and Clear All */}
      <View style={styles.resultsRow}>
        <Text variant="bodySmall" style={styles.resultCount}>
          Showing {filteredItems.length} of {items.filter(item => selectedSiteId === 'all' || item.siteId === selectedSiteId).length} items
        </Text>

        {hasActiveFilters ? (
          <Button mode="text" onPress={clearAllFilters} compact>
            Clear All
          </Button>
        ) : null}

        <SortMenu
          sortOptions={SORT_OPTIONS}
          currentSort={sortBy}
          onSortChange={(id) => setSortBy(id as any)}
          sortDirection={sortDirection}
          onDirectionChange={setSortDirection}
        />
      </View>

      <ScrollView style={styles.scrollView}>
        {filteredItems.length === 0 ? (
          <EmptyState
            icon={
              hasActiveFilters
                ? 'filter-variant'
                : selectedSiteId === 'all'
                ? 'map-marker-outline'
                : 'package-variant-closed-plus'
            }
            title={
              hasActiveFilters
                ? 'No Items Found'
                : selectedSiteId === 'all'
                ? 'Select a Site'
                : 'No Work Items Yet'
            }
            message={
              hasActiveFilters
                ? 'No items match your current search or filter criteria.'
                : selectedSiteId === 'all'
                ? 'Please select a specific site to view and manage work items.'
                : 'Add your first work item to start tracking progress for this site.'
            }
            helpText={
              hasActiveFilters || selectedSiteId === 'all'
                ? undefined
                : 'Work items represent specific tasks or activities. Track quantities, phases, and progress for each item.'
            }
            tips={
              hasActiveFilters || selectedSiteId === 'all'
                ? undefined
                : [
                    'Assign items to specific project phases',
                    'Track planned vs actual quantities',
                    'Monitor progress with status updates',
                  ]
            }
            variant={hasActiveFilters ? 'search' : 'default'}
            actionText={selectedSiteId === 'all' || hasActiveFilters ? undefined : 'Create Item'}
            onAction={selectedSiteId === 'all' || hasActiveFilters ? undefined : openAddDialog}
            secondaryActionText={hasActiveFilters ? 'Clear Filters' : undefined}
            onSecondaryAction={
              hasActiveFilters
                ? () => {
                    setSearchQuery('');
                    setSelectedStatus(['all']);
                    setSelectedPhases(['all']);
                  }
                : undefined
            }
          />
        ) : (
          filteredItems.map((item) => {
            const progress = getProgressPercentage(item);

            return (
              <Card key={item.id} style={styles.itemCard}>
                <Card.Content>
                  <View style={styles.itemHeader}>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName}>{item.name}</Text>
                      <Text style={styles.categoryText}>
                        {getCategoryName(item.categoryId)}
                      </Text>
                      <Text style={styles.quantityText}>
                        {item.completedQuantity.toFixed(1)} / {item.plannedQuantity.toFixed(1)} {item.unitOfMeasurement}
                      </Text>
                      <Text style={styles.progressText}>
                        Progress: {progress.toFixed(1)}% • Weight: {item.weightage}%
                      </Text>
                    </View>
                    <View style={styles.statusContainer}>
                      <Chip
                        mode="flat"
                        style={{ backgroundColor: getStatusColor(item.status) }}
                        textStyle={styles.statusChipText}
                      >
                        {item.status.replace('_', ' ')}
                      </Chip>
                      <View style={styles.actions}>
                        <IconButton
                          icon="pencil"
                          size={20}
                          onPress={() => openEditDialog(item)}
                        />
                        <IconButton
                          icon="delete"
                          size={20}
                          iconColor="#FF3B30"
                          onPress={() => handleDelete(item)}
                        />
                      </View>
                    </View>
                  </View>
                </Card.Content>
              </Card>
            );
          })
        )}
      </ScrollView>

      {/* Add/Edit Dialog */}
      <Portal>
        <Dialog
          visible={dialogVisible}
          onDismiss={() => setDialogVisible(false)}
          style={styles.dialog}
        >
          <Dialog.Title>{editingItem ? 'Edit Item' : 'Add New Item'}</Dialog.Title>
          <Dialog.ScrollArea>
            <ScrollView>
              <TextInput
                label="Item Name *"
                value={itemName}
                onChangeText={setItemName}
                mode="outlined"
                style={styles.input}
              />

              <Text style={styles.label}>Category *</Text>
              <View style={styles.categoryButtons}>
                {sortedCategories.map((category) => (
                  <Chip
                    key={category.id}
                    selected={selectedCategoryId === category.id}
                    onPress={() => setSelectedCategoryId(category.id)}
                    style={styles.categoryChip}
                  >
                    {category.name}
                  </Chip>
                ))}
              </View>

              <TextInput
                label="Planned Quantity"
                value={plannedQuantity}
                onChangeText={setPlannedQuantity}
                mode="outlined"
                keyboardType="numeric"
                style={styles.input}
              />

              <TextInput
                label="Completed Quantity"
                value={completedQuantity}
                onChangeText={setCompletedQuantity}
                mode="outlined"
                keyboardType="numeric"
                style={styles.input}
              />

              <Text style={styles.label}>Unit of Measurement</Text>
              <Menu
                visible={unitMenuVisible}
                onDismiss={() => setUnitMenuVisible(false)}
                anchor={
                  <Button
                    mode="outlined"
                    onPress={() => setUnitMenuVisible(true)}
                    style={styles.dropdownButton}
                  >
                    {commonUnits.find(u => u.value === unitOfMeasurement)?.label || unitOfMeasurement}
                  </Button>
                }
              >
                {commonUnits.map((unit) => (
                  <Menu.Item
                    key={unit.value}
                    title={unit.label}
                    onPress={() => {
                      setUnitOfMeasurement(unit.value);
                      setUnitMenuVisible(false);
                    }}
                  />
                ))}
              </Menu>

              <TextInput
                label="Weightage (%)"
                value={weightage}
                onChangeText={setWeightage}
                mode="outlined"
                keyboardType="numeric"
                style={styles.input}
              />

              <Text style={styles.label}>Status</Text>
              <SegmentedButtons
                value={status}
                onValueChange={setStatus}
                buttons={[
                  { value: 'not_started', label: 'Not Started' },
                  { value: 'in_progress', label: 'In Progress' },
                  { value: 'completed', label: 'Completed' },
                ]}
                style={styles.segmentedButtons}
              />
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setDialogVisible(false)}>Cancel</Button>
            <Button onPress={saveItem}>Save</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Delete Confirmation Dialog */}
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

      {/* Copy Items Dialog */}
      <CopyItemsDialog
        visible={copyDialogVisible}
        sourceSiteId={selectedSiteId === 'all' ? '' : selectedSiteId}
        sourceSiteName={
          _sites.find(s => s.id === selectedSiteId)?.name || 'Current Site'
        }
        sourceItemCount={
          items.filter(item => item.siteId === selectedSiteId).length
        }
        onClose={() => setCopyDialogVisible(false)}
        onSuccess={handleCopySuccess}
        onDuplicatesFound={handleDuplicatesFound}
      />

      {/* Duplicate Items Dialog */}
      <DuplicateItemsDialog
        visible={duplicateDialogVisible}
        duplicateNames={duplicateItems}
        onSkip={handleSkipDuplicates}
        onCreateAll={handleCreateAllDuplicates}
        onCancel={handleDuplicateCancel}
      />
    </View>
  );
};

// Enhance component with WatermelonDB observables
const enhance = withObservables(['supervisorId', 'projectId'], ({ supervisorId, projectId }: { supervisorId: string; projectId: string }) => ({
  items: database.collections
    .get('items')
    .query(
      Q.on('sites', 'project_id', projectId)
    ),
  sites: database.collections
    .get('sites')
    .query(Q.where('supervisor_id', supervisorId)),
  categories: database.collections.get('categories').query(),
}));

const EnhancedItemsManagementScreen = enhance(ItemsManagementScreenComponent);

// Wrapper component that provides context
const ItemsManagementScreen = () => {
  const { supervisorId, projectId } = useSiteContext();
  return <EnhancedItemsManagementScreen supervisorId={supervisorId} projectId={projectId} />;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    elevation: 2,
  },
  addButton: {
    marginLeft: 8,
  },
  selectorContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingBottom: 8,
    elevation: 1,
  },
  resultsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'white',
  },
  resultCount: {
    flex: 1,
    color: '#666',
  },
  scrollView: {
    flex: 1,
  },
  emptyCard: {
    margin: 16,
    elevation: 2,
  },
  itemCard: {
    margin: 16,
    marginBottom: 8,
    elevation: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  categoryText: {
    fontSize: 12,
    color: COLORS.INFO,
    marginBottom: 4,
  },
  quantityText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#999',
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusChipText: {
    color: 'white',
    fontSize: 11,
    textTransform: 'capitalize',
  },
  actions: {
    flexDirection: 'row',
    marginTop: 8,
  },
  dialog: {
    maxHeight: '90%',
  },
  input: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 8,
  },
  segmentedButtons: {
    marginBottom: 12,
  },
  dropdownButton: {
    justifyContent: 'flex-start',
  },
  categoryButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  categoryChip: {
    marginRight: 8,
    marginBottom: 8,
  },
});

export default ItemsManagementScreen;
