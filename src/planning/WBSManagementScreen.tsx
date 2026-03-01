import React, { useReducer, useEffect, useMemo, useCallback, useState } from 'react';
import { View, StyleSheet, ScrollView, FlatList } from 'react-native';
import { Card, Text, FAB, Chip, Button } from 'react-native-paper';
import { database } from '../../models/database';
import { Q } from '@nozbe/watermelondb';
import ItemModel, { ProjectPhase } from '../../models/ItemModel';
import SiteModel from '../../models/SiteModel';
import DesignDocumentModel from '../../models/DesignDocumentModel';
import WBSItemCard, { LinkedDocSummary } from './components/WBSItemCard';
import SimpleSiteSelector from './components/SimpleSiteSelector';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { PlanningStackParamList } from '../nav/types';
import { usePlanningContext } from './context';
import type { PlanningDrawerParamList } from '../nav/PlanningNavigator';
import { useSnackbar } from '../components/Snackbar';
import { ConfirmDialog } from '../components/Dialog';
import { SearchBar, FilterChips, SortMenu, FilterOption, SortOption } from '../components';
import { logger } from '../services/LoggingService';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import { EmptyState } from '../components/common/EmptyState';
import { useAccessibility } from '../utils/accessibility';
import { useDebounce } from '../utils/performance';

// State management
import {
  wbsManagementReducer,
  createWBSManagementInitialState,
  type SortBy,
} from './state/wbs-management';
import { COLORS } from '../theme/colors';

type NavigationProp = NativeStackNavigationProp<PlanningStackParamList>;

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

const WBSManagementScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp<PlanningDrawerParamList, 'WBS'>>();
  const { showSnackbar } = useSnackbar();
  const { announce } = useAccessibility();
  const { sites } = usePlanningContext();

  // Initialize reducer state
  const [state, dispatch] = useReducer(wbsManagementReducer, createWBSManagementInitialState());

  // Map of designDocumentId → LinkedDocSummary for items that have a linked doc
  const [linkedDocsMap, setLinkedDocsMap] = useState<Map<string, LinkedDocSummary>>(new Map());

  // Debounce search query for performance (300ms)
  const debouncedSearchQuery = useDebounce(state.filters.searchQuery, 300);

  const loadItems = useCallback(async () => {
    if (!state.selection.selectedSite) return;

    dispatch({ type: 'START_LOADING' });
    try {
      const query = [Q.where('site_id', state.selection.selectedSite.id)];

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

      dispatch({ type: 'SET_ITEMS', payload: { items: siteItems } });

      // Batch-load design documents linked to these items
      const linkedDocIds = [...new Set(
        siteItems.map(i => i.designDocumentId).filter((id): id is string => !!id)
      )];
      if (linkedDocIds.length > 0) {
        const docs = await database.collections
          .get<DesignDocumentModel>('design_documents')
          .query(Q.where('id', Q.oneOf(linkedDocIds)))
          .fetch();
        const map = new Map<string, LinkedDocSummary>();
        docs.forEach(doc => {
          map.set(doc.id, { docNumber: doc.documentNumber, title: doc.title, status: doc.status });
        });
        setLinkedDocsMap(map);
      } else {
        setLinkedDocsMap(new Map());
      }
    } catch (error) {
      logger.error('[WBS] Error loading items', error as Error);
      showSnackbar('Failed to load items', 'error');
      dispatch({ type: 'LOADING_ERROR' });
    }
  }, [state.selection.selectedSite, showSnackbar]);

  // Combined filtering and sorting logic
  const displayedItems = useMemo(() => {
    let result = state.data.items;

    // 1. Search filter (name OR WBS code) - using debounced query
    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase();
      result = result.filter(item =>
        item.name.toLowerCase().includes(query) ||
        item.wbsCode.toLowerCase().includes(query)
      );
    }

    // 2. Phase filter
    if (state.selection.selectedPhase !== 'all') {
      result = result.filter(item => item.projectPhase === state.selection.selectedPhase);
    }

    // 3. Status filter
    if (!state.filters.selectedStatus.includes('all')) {
      result = result.filter(item => state.filters.selectedStatus.includes(item.status));
    }

    // 4. Critical path filter
    if (state.filters.showCriticalPathOnly) {
      result = result.filter(item => item.isCriticalPath);
    }

    // 5. Sort
    result = [...result].sort((a, b) => {
      let comparison = 0;

      if (state.sort.sortBy === 'wbs') {
        comparison = a.wbsCode.localeCompare(b.wbsCode, undefined, { numeric: true });
      } else if (state.sort.sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (state.sort.sortBy === 'duration') {
        const durationA = a.plannedEndDate && a.plannedStartDate
          ? (a.plannedEndDate - a.plannedStartDate) / (1000 * 60 * 60 * 24)
          : 0;
        const durationB = b.plannedEndDate && b.plannedStartDate
          ? (b.plannedEndDate - b.plannedStartDate) / (1000 * 60 * 60 * 24)
          : 0;
        comparison = durationA - durationB;
      } else if (state.sort.sortBy === 'progress') {
        const progressA = a.getProgressPercentage();
        const progressB = b.getProgressPercentage();
        comparison = progressA - progressB;
      }

      return state.sort.sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [state.data.items, debouncedSearchQuery, state.filters.selectedStatus, state.filters.showCriticalPathOnly, state.selection.selectedPhase, state.sort]);

  // Announce search results for accessibility
  useEffect(() => {
    if (debouncedSearchQuery) {
      announce(`Found ${displayedItems.length} items matching "${debouncedSearchQuery}"`);
    }
  }, [displayedItems.length, debouncedSearchQuery, announce]);

  // Auto-select site when navigated from Dashboard with a siteId param.
  // appliedSiteId ref prevents re-applying on unrelated re-renders.
  const appliedSiteId = React.useRef<string | null>(null);
  useEffect(() => {
    const siteId = route.params?.siteId;
    if (!siteId || sites.length === 0 || siteId === appliedSiteId.current) return;
    const site = sites.find(s => s.id === siteId) ?? null;
    if (site) {
      dispatch({ type: 'SET_SELECTED_SITE', payload: { site } });
      appliedSiteId.current = siteId;
    }
  }, [route.params?.siteId, sites]);

  // Load items when site changes
  useEffect(() => {
    if (state.selection.selectedSite) {
      loadItems();
    }
  }, [state.selection.selectedSite, loadItems]);

  // Reload items when screen comes into focus (after creating/editing)
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (state.selection.selectedSite) {
        loadItems();
      }
    });

    return unsubscribe;
  }, [navigation, state.selection.selectedSite, loadItems]);

  // Filter toggle handlers
  const handleStatusToggle = useCallback((id: string) => {
    if (id === 'all') {
      dispatch({ type: 'SET_SELECTED_STATUS', payload: { status: ['all'] } });
    } else {
      const newFilters = state.filters.selectedStatus.includes(id)
        ? state.filters.selectedStatus.filter(f => f !== id && f !== 'all')
        : [...state.filters.selectedStatus.filter(f => f !== 'all'), id];
      dispatch({ type: 'SET_SELECTED_STATUS', payload: { status: newFilters.length === 0 ? ['all'] : newFilters } });
    }
  }, [state.filters.selectedStatus]);

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    dispatch({ type: 'CLEAR_FILTERS' });
  }, []);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return debouncedSearchQuery.trim() !== '' ||
           state.selection.selectedPhase !== 'all' ||
           !state.filters.selectedStatus.includes('all') ||
           state.filters.showCriticalPathOnly;
  }, [debouncedSearchQuery, state.filters.selectedStatus, state.filters.showCriticalPathOnly, state.selection.selectedPhase]);

  const handleAddItem = useCallback(() => {
    if (!state.selection.selectedSite) {
      showSnackbar('Please select a site first', 'warning');
      return;
    }

    navigation.navigate('ItemCreation', {
      siteId: state.selection.selectedSite.id,
    });
  }, [state.selection.selectedSite, showSnackbar, navigation]);

  const handleAddChildItem = useCallback((parentItem: ItemModel) => {
    if (parentItem.isBaselineLocked) {
      showSnackbar('Cannot add child items after baseline is locked', 'warning');
      return;
    }

    if (parentItem.wbsLevel >= 4) {
      showSnackbar('Cannot create child items beyond level 4', 'warning');
      return;
    }

    navigation.navigate('ItemCreation', {
      siteId: state.selection.selectedSite!.id,
      parentWbsCode: parentItem.wbsCode,
    });
  }, [state.selection.selectedSite, showSnackbar, navigation]);

  const handleEditItem = useCallback((item: ItemModel) => {
    if (item.isBaselineLocked) {
      showSnackbar('Cannot edit items after baseline is locked', 'warning');
      return;
    }

    navigation.navigate('ItemEdit', {
      itemId: item.id,
    });
  }, [showSnackbar, navigation]);

  const handleDeleteItem = useCallback((item: ItemModel) => {
    if (item.isBaselineLocked) {
      showSnackbar('Cannot delete items after baseline is locked', 'warning');
      return;
    }

    dispatch({ type: 'OPEN_DELETE_DIALOG', payload: { item } });
  }, [showSnackbar]);

  const confirmDelete = useCallback(async () => {
    if (!state.data.itemToDelete) return;

    try {
      await database.write(async () => {
        await state.data.itemToDelete!.destroyPermanently();
      });
      dispatch({ type: 'CONFIRM_DELETE' });
      loadItems();
      showSnackbar(`"${state.data.itemToDelete.name}" deleted successfully`, 'success');
    } catch (error) {
      logger.error('[WBS] Error deleting item', error as Error);
      showSnackbar('Failed to delete item', 'error');
      dispatch({ type: 'CLOSE_DELETE_DIALOG' });
    }
  }, [state.data.itemToDelete, loadItems, showSnackbar]);

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
            selectedSite={state.selection.selectedSite}
            onSiteChange={(site) => dispatch({ type: 'SET_SELECTED_SITE', payload: { site } })}
          />
        </Card.Content>
      </Card>

      {state.selection.selectedSite && (
        <View style={styles.contentWrapper}>
          {/* Search Bar */}
          <SearchBar
            value={state.filters.searchQuery}
            onChangeText={(query) => dispatch({ type: 'SET_SEARCH_QUERY', payload: { query } })}
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
                selected={state.selection.selectedPhase === phase.key}
                onPress={() => dispatch({ type: 'SET_SELECTED_PHASE', payload: { phase: phase.key } })}
                style={styles.phaseChip}
              >
                {phase.label}
              </Chip>
            ))}
          </ScrollView>

          {/* Status Filter Chips (New) */}
          <FilterChips
            filters={STATUS_FILTERS}
            selectedFilters={state.filters.selectedStatus}
            onFilterToggle={handleStatusToggle}
          />

          {/* Critical Path Only Filter (New) */}
          <View style={styles.criticalPathFilter}>
            <Chip
              selected={state.filters.showCriticalPathOnly}
              onPress={() => dispatch({ type: 'TOGGLE_CRITICAL_PATH_FILTER' })}
              icon={state.filters.showCriticalPathOnly ? 'check' : 'alert'}
              style={[
                styles.criticalPathChip,
                state.filters.showCriticalPathOnly && styles.criticalPathChipActive,
              ]}
              textStyle={state.filters.showCriticalPathOnly && styles.criticalPathChipText}
            >
              Critical Path Only
            </Chip>
          </View>

          {/* Results Row with Sort and Clear All */}
          <View style={styles.resultsRow}>
            <Text variant="bodySmall" style={styles.resultCount}>
              Showing {displayedItems.length} of {state.data.items.length} items
            </Text>

            {hasActiveFilters && (
              <Button mode="text" onPress={clearAllFilters} compact>
                Clear All
              </Button>
            )}

            <SortMenu
              sortOptions={SORT_OPTIONS}
              currentSort={state.sort.sortBy}
              onSortChange={(id) => dispatch({ type: 'SET_SORT_BY', payload: { sortBy: id as SortBy } })}
              sortDirection={state.sort.sortDirection}
              onDirectionChange={(direction) => dispatch({ type: 'SET_SORT_DIRECTION', payload: { direction } })}
            />
          </View>

          {/* Items List */}
          <FlatList
            data={displayedItems}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <WBSItemCard
                item={item}
                linkedDoc={item.designDocumentId ? linkedDocsMap.get(item.designDocumentId) ?? null : null}
                onPress={() => {}}
                onEdit={() => handleEditItem(item)}
                onDelete={() => handleDeleteItem(item)}
                onAddChild={() => handleAddChildItem(item)}
              />
            )}
            ListEmptyComponent={
              state.ui.loading ? (
                <View style={styles.emptyContainer}>
                  <Text variant="bodyLarge" style={styles.emptyText}>Loading items...</Text>
                </View>
              ) : debouncedSearchQuery ? (
                <EmptyState
                  icon="magnify"
                  title="No Items Found"
                  message={`No WBS items match "${debouncedSearchQuery}"`}
                  actionText="Clear Search"
                  onAction={clearAllFilters}
                  variant="compact"
                />
              ) : hasActiveFilters ? (
                <EmptyState
                  icon="filter-off"
                  title="No Matching Items"
                  message="No items match your current filters"
                  actionText="Clear Filters"
                  onAction={clearAllFilters}
                  variant="compact"
                />
              ) : (
                <EmptyState
                  icon="sitemap"
                  title="No WBS Items"
                  message="Create a work breakdown structure to organize your project"
                  actionText="Add Item"
                  onAction={handleAddItem}
                  variant="default"
                />
              )
            }
            style={styles.itemsList}
            contentContainerStyle={displayedItems.length === 0 ? styles.emptyList : styles.itemsListContent}
            accessible
            accessibilityLabel={`Work breakdown structure items, ${displayedItems.length} items`}
          />

          {/* FAB */}
          <FAB
            icon="plus"
            style={styles.fab}
            onPress={handleAddItem}
            label="Add Item"
            accessible
            accessibilityLabel="Add new WBS item"
            accessibilityRole="button"
            accessibilityHint="Opens form to create a new work breakdown structure item"
          />
        </View>
      )}

      {!state.selection.selectedSite && (
        <EmptyState
          icon="office-building-outline"
          title="Select a Site"
          message="Choose a site from the selector above to view and manage work breakdown structure"
          variant="large"
        />
      )}

      <ConfirmDialog
        visible={state.ui.showDeleteDialog}
        title="Delete Item"
        message={`Are you sure you want to delete "${state.data.itemToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onCancel={() => dispatch({ type: 'CLOSE_DELETE_DIALOG' })}
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
    backgroundColor: COLORS.ERROR,
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

// Wrap with ErrorBoundary for graceful error handling
const WBSManagementScreenWithBoundary = (props: Record<string, unknown>) => (
  <ErrorBoundary name="WBSManagementScreen">
    <WBSManagementScreen {...props} />
  </ErrorBoundary>
);

export default WBSManagementScreenWithBoundary;
