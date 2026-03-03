import React, { useReducer, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert } from 'react-native';
import { FAB, Searchbar } from 'react-native-paper';
import { useRoute, RouteProp } from '@react-navigation/native';
import { useCommercial } from './context/CommercialContext';
import { useAuth } from '../auth/AuthContext';
import ErrorBoundary from '../components/common/ErrorBoundary';
import { database } from '../../models/database';
import { Q } from '@nozbe/watermelondb';
import { logger } from '../services/LoggingService';
import { costTrackingReducer, initialCostTrackingState } from './state/cost/costTrackingReducer';
import { costTrackingActions } from './state/cost/costTrackingActions';
import type { Cost } from './state/cost/costTrackingReducer';
import {
  HeaderSection,
  CostCard,
  CostFormDialog,
  CategoryFilterMenu,
} from './cost-tracking/components';
import type { CommercialTabParamList } from '../nav/CommercialNavigator';
import { useDebounceSearch } from './shared/hooks/useDebounceSearch';

/**
 * CostTrackingScreen (v2.20 - Refactored)
 * Phase 2 Task 2.1 - State Management Refactor
 *
 * Commercial Manager tracks actual costs incurred on the project.
 *
 * Features:
 * - View all cost entries for the project
 * - Filter by category (Labor, Materials, Equipment, Subcontractors)
 * - Create new cost entries with date
 * - Edit/Delete cost entries
 * - Show cost vs budget comparison
 * - Link to Purchase Orders (optional)
 * - Date-based filtering
 */

const CostTrackingScreen = () => {
  const { projectId, projectName, selectedCostCategory, setSelectedCostCategory, refreshTrigger } =
    useCommercial();
  const { user } = useAuth();
  const route = useRoute<RouteProp<CommercialTabParamList, 'CostTracking'>>();
  const [state, dispatch] = useReducer(costTrackingReducer, initialCostTrackingState);

  const { searchQuery, setSearchQuery, filteredItems: textSearchedCosts } = useDebounceSearch<Cost>({
    items: state.data.costs,
    searchFields: ['description', 'category', 'poId'],
  });

  const displayedCosts = useMemo(() => {
    if (!selectedCostCategory) return textSearchedCosts;
    return textSearchedCosts.filter((c) => c.category === selectedCostCategory);
  }, [textSearchedCosts, selectedCostCategory]);

  // Apply drill-down filter from dashboard navigation
  useEffect(() => {
    const filterCategory = route.params?.filterCategory;
    if (filterCategory) {
      setSelectedCostCategory(filterCategory);
    }
  }, [route.params?.filterCategory]);

  // Load costs and budgets from database
  const loadCosts = useCallback(async (silent = false) => {
    if (!projectId) {
      dispatch(costTrackingActions.setLoading(false));
      return;
    }

    try {
      if (!silent) dispatch(costTrackingActions.setLoading(true));
      logger.debug('[Cost] Loading costs for project', { projectId });

      const costsCollection = database.collections.get('costs');
      const costsData = await costsCollection
        .query(Q.where('project_id', projectId), Q.sortBy('cost_date', Q.desc))
        .fetch();

      const costsArray = costsData.map((cost: any) => ({
        id: cost.id,
        projectId: cost.projectId,
        poId: cost.poId,
        category: cost.category,
        amount: cost.amount,
        description: cost.description,
        costDate: cost.costDate,
        createdBy: cost.createdBy,
        createdAt: cost.createdAt,
      }));

      // Load budgets for comparison
      const budgetsCollection = database.collections.get('budgets');
      const budgetsData = await budgetsCollection
        .query(Q.where('project_id', projectId))
        .fetch();

      const budgetsArray = budgetsData.map((budget: any) => ({
        category: budget.category,
        allocated: budget.allocatedAmount,
      }));

      logger.debug('[Cost] Loaded costs', { count: costsArray.length });
      dispatch(costTrackingActions.setCosts(costsArray));
      dispatch(costTrackingActions.setBudgets(budgetsArray));

      // Calculate totals
      const totalCosts = costsArray.reduce((sum, c) => sum + c.amount, 0);
      const totalBudgets = budgetsArray.reduce((sum, b) => sum + b.allocated, 0);
      const totalVariance = totalBudgets - totalCosts;
      dispatch(costTrackingActions.setTotals(totalBudgets, totalCosts, totalVariance));
    } catch (error) {
      logger.error('[Cost] Error loading costs', error as Error);
      Alert.alert('Error', 'Failed to load costs');
    } finally {
      dispatch(costTrackingActions.setLoading(false));
    }
  }, [projectId]);

  useEffect(() => {
    loadCosts();
  }, [loadCosts, refreshTrigger]);

  // Reactive subscription — silently refresh when costs or budgets change (e.g. after sync)
  useEffect(() => {
    if (!projectId) return;
    const subscription = database
      .withChangesForTables(['costs', 'budgets'])
      .subscribe(() => loadCosts(true));
    return () => subscription.unsubscribe();
  }, [projectId, loadCosts]);

  // Helper functions
  const getBudgetForCategory = (category: string): number => {
    const budget = state.data.budgets.find((b) => b.category === category);
    return budget ? budget.allocated : 0;
  };

  const getTotalSpentForCategory = (category: string): number => {
    return state.data.costs
      .filter((c) => c.category === category)
      .reduce((sum, c) => sum + c.amount, 0);
  };

  const handleCreateCost = async () => {
    if (!state.form.description.trim()) {
      Alert.alert('Validation Error', 'Please enter a description');
      return;
    }

    const amount = parseFloat(state.form.amount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid amount');
      return;
    }

    try {
      const costsCollection = database.collections.get('costs');

      await database.write(async () => {
        await costsCollection.create((record: any) => {
          record.projectId = projectId;
          record.poId = state.form.poId.trim() || null;
          record.category = state.form.category;
          record.amount = amount;
          record.description = state.form.description.trim();
          record.costDate = state.form.costDate.getTime();
          record.createdBy = user?.userId || '';
          record.appSyncStatus = 'pending';
          record.version = 1;
        });
      });

      Alert.alert('Success', 'Cost entry created successfully');
      dispatch(costTrackingActions.closeDialogs());
      dispatch(costTrackingActions.resetForm());
      loadCosts();
    } catch (error) {
      logger.error('[Cost] Error creating cost', error as Error);
      Alert.alert('Error', 'Failed to create cost entry');
    }
  };

  const handleEditCost = async () => {
    if (!state.data.editingCost || !state.form.description.trim()) {
      Alert.alert('Validation Error', 'Please enter a description');
      return;
    }

    const amount = parseFloat(state.form.amount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid amount');
      return;
    }

    try {
      const costsCollection = database.collections.get('costs');
      const costRecord = await costsCollection.find(state.data.editingCost.id);

      await database.write(async () => {
        await costRecord.update((record: any) => {
          record.poId = state.form.poId.trim() || null;
          record.category = state.form.category;
          record.amount = amount;
          record.description = state.form.description.trim();
          record.costDate = state.form.costDate.getTime();
          record.appSyncStatus = 'pending';
        });
      });

      Alert.alert('Success', 'Cost entry updated successfully');
      dispatch(costTrackingActions.closeDialogs());
      dispatch(costTrackingActions.resetForm());
      loadCosts();
    } catch (error) {
      logger.error('[Cost] Error updating cost', error as Error);
      Alert.alert('Error', 'Failed to update cost entry');
    }
  };

  const handleDeleteCost = (cost: Cost) => {
    Alert.alert(
      'Delete Cost',
      `Are you sure you want to delete this cost entry?\n\n${cost.category.toUpperCase()}: ${cost.description}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const costsCollection = database.collections.get('costs');
              const costRecord = await costsCollection.find(cost.id);

              await database.write(async () => {
                await costRecord.markAsDeleted();
              });

              Alert.alert('Success', 'Cost entry deleted successfully');
              loadCosts();
            } catch (error) {
              logger.error('[Cost] Error deleting cost', error as Error);
              Alert.alert('Error', 'Failed to delete cost entry');
            }
          },
        },
      ]
    );
  };

  const openEditDialog = (cost: Cost) => {
    dispatch(costTrackingActions.openEditDialog(cost));
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    dispatch(costTrackingActions.setShowDatePicker(false));
    if (selectedDate) {
      dispatch(costTrackingActions.setFormDate(selectedDate));
    }
  };

  if (!projectId) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No project assigned</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <HeaderSection
        projectName={projectName}
        totalBudgets={state.data.totalBudgets}
        totalCosts={state.data.totalCosts}
        totalVariance={state.data.totalVariance}
      />

      {/* Search and filter */}
      <View style={styles.controls}>
        <Searchbar
          placeholder="Search costs..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />
        <CategoryFilterMenu
          visible={state.ui.showFilterMenu}
          onDismiss={() => dispatch(costTrackingActions.toggleFilterMenu())}
          selectedCategory={selectedCostCategory}
          onSelectCategory={setSelectedCostCategory}
        />
      </View>

      {/* Cost list */}
      {state.ui.loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading costs...</Text>
        </View>
      ) : displayedCosts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {searchQuery || selectedCostCategory
              ? 'No costs match your filters'
              : 'No cost entries yet. Tap + to create one.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={displayedCosts}
          renderItem={({ item }) => (
            <CostCard
              cost={item}
              budgetAmount={getBudgetForCategory(item.category)}
              totalSpent={getTotalSpentForCategory(item.category)}
              onEdit={openEditDialog}
              onDelete={handleDeleteCost}
            />
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* Create FAB */}
      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => {
          dispatch(costTrackingActions.resetForm());
          dispatch(costTrackingActions.openCreateDialog());
        }}
        label="Add Cost"
      />

      {/* Create Dialog */}
      <CostFormDialog
        visible={state.ui.showCreateDialog}
        onDismiss={() => dispatch(costTrackingActions.closeDialogs())}
        onSave={handleCreateCost}
        title="Create Cost Entry"
        formCategory={state.form.category}
        setFormCategory={(value) => dispatch(costTrackingActions.setFormField('category', value))}
        formAmount={state.form.amount}
        setFormAmount={(value) => dispatch(costTrackingActions.setFormField('amount', value))}
        formDescription={state.form.description}
        setFormDescription={(value) => dispatch(costTrackingActions.setFormField('description', value))}
        formPoId={state.form.poId}
        setFormPoId={(value) => dispatch(costTrackingActions.setFormField('poId', value))}
        formCostDate={state.form.costDate}
        showDatePicker={state.ui.showDatePicker}
        setShowDatePicker={(show) => dispatch(costTrackingActions.setShowDatePicker(show))}
        handleDateChange={handleDateChange}
      />

      {/* Edit Dialog */}
      <CostFormDialog
        visible={state.ui.showEditDialog}
        onDismiss={() => dispatch(costTrackingActions.closeDialogs())}
        onSave={handleEditCost}
        title="Edit Cost Entry"
        formCategory={state.form.category}
        setFormCategory={(value) => dispatch(costTrackingActions.setFormField('category', value))}
        formAmount={state.form.amount}
        setFormAmount={(value) => dispatch(costTrackingActions.setFormField('amount', value))}
        formDescription={state.form.description}
        setFormDescription={(value) => dispatch(costTrackingActions.setFormField('description', value))}
        formPoId={state.form.poId}
        setFormPoId={(value) => dispatch(costTrackingActions.setFormField('poId', value))}
        formCostDate={state.form.costDate}
        showDatePicker={state.ui.showDatePicker}
        setShowDatePicker={(show) => dispatch(costTrackingActions.setShowDatePicker(show))}
        handleDateChange={handleDateChange}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  controls: {
    padding: 16,
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchbar: {
    flex: 1,
    elevation: 0,
  },
  listContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
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
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: '#007AFF',
  },
});

export default function CostTrackingScreenWithErrorBoundary(props: any) {
  return (
    <ErrorBoundary name="CostTrackingScreen">
      <CostTrackingScreen {...props} />
    </ErrorBoundary>
  );
}
