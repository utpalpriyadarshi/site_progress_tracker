import React, { useReducer, useEffect, useCallback, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
} from 'react-native';
import { FAB, Card, Searchbar, Chip, Menu, Portal, Dialog, Button, TextInput, Snackbar } from 'react-native-paper';
import { database } from '../../models/database';
import { useCommercial } from './context/CommercialContext';
import { Q } from '@nozbe/watermelondb';
import { useAuth } from '../auth/AuthContext';
import { logger } from '../services/LoggingService';
import ErrorBoundary from '../components/common/ErrorBoundary';
import { useSnackbar } from '../hooks/useSnackbar';
import { ConfirmDialog } from '../components/dialogs/ConfirmDialog';
import { budgetManagementReducer, initialBudgetManagementState } from './state/budget/budgetManagementReducer';
import { budgetManagementActions } from './state/budget/budgetManagementActions';
import type { Budget } from './state/budget/budgetManagementReducer';
import { useDebounceSearch } from './shared/hooks/useDebounceSearch';
import { COLORS } from '../theme/colors';
import { SpinnerLoading } from '../components/common/LoadingState';
import { formatCurrencySmart } from '../utils/currencyFormatter';

/**
 * BudgetManagementScreen (v2.11 Phase 5 - Sprint 4)
 * Phase 2 Task 2.1 - State Management Refactor
 *
 * Commercial Manager manages project-level budgets.
 *
 * Features:
 * - View all budget entries for the project
 * - Filter by category (Labor, Materials, Equipment, Subcontractors, Overhead)
 * - Create new budget entries
 * - Edit/Delete budget entries
 * - Show allocated vs actual costs
 * - Budget variance display
 */

const BUDGET_CATEGORIES = [
  { value: 'labor', label: 'Labor' },
  { value: 'material', label: 'Materials' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'other', label: 'Subcontractors & Other' },
];

const BudgetManagementScreen = () => {
  const { projectId, projectName, selectedBudgetCategory, setSelectedBudgetCategory, refreshTrigger } = useCommercial();
  const { user } = useAuth();
  const [state, dispatch] = useReducer(budgetManagementReducer, initialBudgetManagementState);
  const [pendingDeleteBudget, setPendingDeleteBudget] = useState<Budget | null>(null);
  const { show: showSnackbar, snackbarProps } = useSnackbar();

  const { searchQuery, setSearchQuery, filteredItems: textSearchedBudgets } = useDebounceSearch<Budget>({
    items: state.data.budgets,
    searchFields: ['description', 'category'],
  });

  const displayedBudgets = useMemo(() => {
    if (!selectedBudgetCategory) return textSearchedBudgets;
    return textSearchedBudgets.filter((b) => b.category === selectedBudgetCategory);
  }, [textSearchedBudgets, selectedBudgetCategory]);

  const loadBudgets = useCallback(async (silent = false) => {
    if (!projectId) {
      dispatch(budgetManagementActions.setLoading(false));
      return;
    }

    try {
      if (!silent) dispatch(budgetManagementActions.setLoading(true));
      logger.debug('[Budget] Loading budgets for project:', { projectId });

      const budgetsCollection = database.collections.get('budgets');
      const budgetsData = await budgetsCollection
        .query(Q.where('project_id', projectId))
        .fetch();

      // Calculate actual spent for each budget category
      const costsCollection = database.collections.get('costs');
      const costsData = await costsCollection
        .query(Q.where('project_id', projectId))
        .fetch();

      const budgetsWithActuals = budgetsData.map((budget: any) => {
        // Sum all costs in this category
        const actualSpent = costsData
          .filter((cost: any) => cost.category === budget.category)
          .reduce((sum: number, cost: any) => sum + (cost.amount || 0), 0);

        return {
          id: budget.id,
          projectId: budget.projectId,
          category: budget.category,
          allocatedAmount: budget.allocatedAmount,
          description: budget.description,
          createdBy: budget.createdBy,
          createdAt: budget.createdAt,
          actualSpent,
        };
      });

      logger.debug('[Budget] Loaded budgets:', { value: budgetsWithActuals.length });
      dispatch(budgetManagementActions.setBudgets(budgetsWithActuals));
    } catch (error) {
      logger.error('[Budget] Error loading budgets:', error as Error);
      showSnackbar('Failed to load budgets');
    } finally {
      dispatch(budgetManagementActions.setLoading(false));
    }
  }, [projectId]);

  useEffect(() => {
    loadBudgets();
  }, [loadBudgets, refreshTrigger]);

  // Reactive subscription — silently refresh when budgets or costs change (e.g. after sync)
  useEffect(() => {
    if (!projectId) return;
    const subscription = database
      .withChangesForTables(['budgets', 'costs'])
      .subscribe(() => loadBudgets(true));
    return () => subscription.unsubscribe();
  }, [projectId, loadBudgets]);

  const handleCreateBudget = async () => {
    if (!state.form.description.trim()) {
      showSnackbar('Please enter a description');
      return;
    }

    const amount = parseFloat(state.form.amount);
    if (isNaN(amount) || amount <= 0) {
      showSnackbar('Please enter a valid amount');
      return;
    }

    try {
      const budgetsCollection = database.collections.get('budgets');

      await database.write(async () => {
        await budgetsCollection.create((record: any) => {
          record.projectId = projectId;
          record.category = state.form.category;
          record.allocatedAmount = amount;
          record.description = state.form.description.trim();
          record.createdBy = user?.userId || '';
          record.appSyncStatus = 'pending';
          record.version = 1;
        });
      });

      showSnackbar('Budget entry created');
      dispatch(budgetManagementActions.closeDialogs());
      dispatch(budgetManagementActions.resetForm());
      loadBudgets();
    } catch (error) {
      logger.error('[Budget] Error creating budget:', error as Error);
      showSnackbar('Failed to create budget entry');
    }
  };

  const handleEditBudget = async () => {
    if (!state.data.editingBudget || !state.form.description.trim()) {
      showSnackbar('Please enter a description');
      return;
    }

    const amount = parseFloat(state.form.amount);
    if (isNaN(amount) || amount <= 0) {
      showSnackbar('Please enter a valid amount');
      return;
    }

    try {
      const budgetsCollection = database.collections.get('budgets');
      const budgetRecord = await budgetsCollection.find(state.data.editingBudget.id);

      await database.write(async () => {
        await budgetRecord.update((record: any) => {
          record.category = state.form.category;
          record.allocatedAmount = amount;
          record.description = state.form.description.trim();
          record.appSyncStatus = 'pending';
        });
      });

      showSnackbar('Budget entry updated');
      dispatch(budgetManagementActions.closeDialogs());
      dispatch(budgetManagementActions.resetForm());
      loadBudgets();
    } catch (error) {
      logger.error('[Budget] Error updating budget:', error as Error);
      showSnackbar('Failed to update budget entry');
    }
  };

  const handleDeleteBudget = (budget: Budget) => {
    setPendingDeleteBudget(budget);
  };

  const handleConfirmDeleteBudget = async () => {
    if (!pendingDeleteBudget) return;
    const budget = pendingDeleteBudget;
    setPendingDeleteBudget(null);
    try {
      const budgetsCollection = database.collections.get('budgets');
      const budgetRecord = await budgetsCollection.find(budget.id);
      await database.write(async () => {
        await budgetRecord.markAsDeleted();
      });
      showSnackbar('Budget entry deleted');
      loadBudgets();
    } catch (error) {
      logger.error('[Budget] Error deleting budget:', error as Error);
      showSnackbar('Failed to delete budget entry');
    }
  };

  const openEditDialog = (budget: Budget) => {
    dispatch(budgetManagementActions.openEditDialog(budget));
  };

  const getCategoryLabel = (category: string) => {
    const cat = BUDGET_CATEGORIES.find((c) => c.value === category);
    return cat ? cat.label : category;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      labor: COLORS.INFO,
      material: COLORS.SUCCESS,
      equipment: COLORS.WARNING,
      other: COLORS.STATUS_EVALUATED,
    };
    return colors[category] || '#757575';
  };

  const calculateVariance = (budget: Budget) => {
    const variance = budget.allocatedAmount - (budget.actualSpent || 0);
    const percentage = budget.allocatedAmount > 0
      ? ((variance / budget.allocatedAmount) * 100).toFixed(1)
      : '0.0';
    return { variance, percentage };
  };

  const renderBudgetCard = ({ item }: { item: Budget }) => {
    const { variance, percentage } = calculateVariance(item);
    const isOverBudget = variance < 0;

    return (
      <Card mode="elevated" style={styles.budgetCard}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <Chip
              style={[styles.categoryChip, { backgroundColor: getCategoryColor(item.category) }]}
              textStyle={styles.categoryChipText}
            >
              {getCategoryLabel(item.category)}
            </Chip>
            <View style={styles.cardActions}>
              <Button
                mode="text"
                onPress={() => openEditDialog(item)}
                compact
                textColor="#007AFF"
              >
                Edit
              </Button>
              <Button
                mode="text"
                onPress={() => handleDeleteBudget(item)}
                compact
                textColor="#ff6b6b"
              >
                Delete
              </Button>
            </View>
          </View>

          <Text style={styles.description}>{item.description}</Text>

          <View style={styles.amountsContainer}>
            <View style={styles.amountRow}>
              <Text style={styles.amountLabel}>Allocated:</Text>
              <Text style={styles.amountValue}>{formatCurrencySmart(item.allocatedAmount)}</Text>
            </View>
            <View style={styles.amountRow}>
              <Text style={styles.amountLabel}>Actual Spent:</Text>
              <Text style={styles.amountValue}>{formatCurrencySmart(item.actualSpent || 0)}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.amountRow}>
              <Text style={styles.amountLabel}>Variance:</Text>
              <Text style={[styles.varianceValue, isOverBudget && styles.overBudget]}>
                {formatCurrencySmart(Math.abs(variance))} ({percentage}%)
              </Text>
            </View>
          </View>

          {isOverBudget && (
            <Chip
              mode="flat"
              style={styles.warningChip}
              textStyle={styles.warningChipText}
            >
              ⚠️ OVER BUDGET
            </Chip>
          )}

          <Text style={styles.timestamp}>
            Created: {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </Card.Content>
      </Card>
    );
  };

  const renderBudgetForm = () => (
    <ScrollView style={styles.dialogContent}>
      <Text style={styles.dialogLabel}>Category *</Text>
      <View style={styles.categoryButtons}>
        {BUDGET_CATEGORIES.map((cat) => (
          <Chip
            key={cat.value}
            selected={state.form.category === cat.value}
            onPress={() => dispatch(budgetManagementActions.setFormField('category', cat.value))}
            style={styles.categoryButton}
            selectedColor="#007AFF"
          >
            {cat.label}
          </Chip>
        ))}
      </View>

      <TextInput
        label="Allocated Amount *"
        value={state.form.amount}
        onChangeText={(value) => dispatch(budgetManagementActions.setFormField('amount', value))}
        keyboardType="numeric"
        mode="outlined"
        style={styles.input}
        left={<TextInput.Affix text="₹" />}
      />

      <TextInput
        label="Description *"
        value={state.form.description}
        onChangeText={(value) => dispatch(budgetManagementActions.setFormField('description', value))}
        mode="outlined"
        multiline
        numberOfLines={3}
        style={styles.input}
      />
    </ScrollView>
  );

  const totalAllocated = state.data.budgets.reduce((sum, b) => sum + b.allocatedAmount, 0);
  const totalSpent = state.data.budgets.reduce((sum, b) => sum + (b.actualSpent || 0), 0);
  const totalVariance = totalAllocated - totalSpent;

  if (!projectId) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No project assigned</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with project info */}
      <View style={styles.header}>
        <Text style={styles.projectName}>{projectName}</Text>
        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Budget</Text>
            <Text style={styles.summaryValue}>{formatCurrencySmart(totalAllocated)}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Spent</Text>
            <Text style={styles.summaryValue}>{formatCurrencySmart(totalSpent)}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Variance</Text>
            <Text style={[styles.summaryValue, totalVariance < 0 && styles.overBudget]}>
              {formatCurrencySmart(Math.abs(totalVariance))}
            </Text>
          </View>
        </View>
      </View>

      {/* Search and filter */}
      <View style={styles.controls}>
        <Searchbar
          placeholder="Search budgets..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />
        <Menu
          visible={state.ui.showFilterMenu}
          onDismiss={() => dispatch(budgetManagementActions.toggleFilterMenu())}
          anchor={
            <Button
              mode="outlined"
              onPress={() => dispatch(budgetManagementActions.toggleFilterMenu())}
              style={styles.filterButton}
            >
              {selectedBudgetCategory ? getCategoryLabel(selectedBudgetCategory) : 'All Categories'}
            </Button>
          }
        >
          <Menu.Item
            onPress={() => {
              setSelectedBudgetCategory(null);
              dispatch(budgetManagementActions.toggleFilterMenu());
            }}
            title="All Categories"
          />
          {BUDGET_CATEGORIES.map((cat) => (
            <Menu.Item
              key={cat.value}
              onPress={() => {
                setSelectedBudgetCategory(cat.value);
                dispatch(budgetManagementActions.toggleFilterMenu());
              }}
              title={cat.label}
            />
          ))}
        </Menu>
      </View>

      {/* Budget list */}
      {state.ui.loading ? (
        <SpinnerLoading message="Loading budgets..." />
      ) : displayedBudgets.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {searchQuery || selectedBudgetCategory
              ? 'No budgets match your filters'
              : 'No budget entries yet. Tap + to create one.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={displayedBudgets}
          renderItem={renderBudgetCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* Create FAB */}
      <FAB
        style={styles.fab}
          color="#FFFFFF"
        icon="plus"
        onPress={() => {
          dispatch(budgetManagementActions.resetForm());
          dispatch(budgetManagementActions.openCreateDialog());
        }}
        label="Add Budget"
      />

      {/* Create Dialog */}
      <Portal>
        <Dialog visible={state.ui.showCreateDialog} onDismiss={() => dispatch(budgetManagementActions.closeDialogs())}>
          <Dialog.Title>Create Budget Entry</Dialog.Title>
          <Dialog.ScrollArea>{renderBudgetForm()}</Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => dispatch(budgetManagementActions.closeDialogs())}>Cancel</Button>
            <Button onPress={handleCreateBudget}>Create</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Edit Dialog */}
      <Portal>
        <Dialog visible={state.ui.showEditDialog} onDismiss={() => dispatch(budgetManagementActions.closeDialogs())}>
          <Dialog.Title>Edit Budget Entry</Dialog.Title>
          <Dialog.ScrollArea>{renderBudgetForm()}</Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => dispatch(budgetManagementActions.closeDialogs())}>Cancel</Button>
            <Button onPress={handleEditBudget}>Save</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <ConfirmDialog
        visible={!!pendingDeleteBudget}
        title="Delete Budget Entry"
        message={pendingDeleteBudget ? `Delete ${pendingDeleteBudget.category.toUpperCase()}: ${pendingDeleteBudget.description}? This action cannot be undone.` : ''}
        confirmText="Delete"
        destructive
        onConfirm={handleConfirmDeleteBudget}
        onCancel={() => setPendingDeleteBudget(null)}
      />

      <Snackbar
        {...snackbarProps}
        duration={3000}
        action={{ label: 'Dismiss', onPress: snackbarProps.onDismiss }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  projectName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryCard: {
    flex: 1,
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
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
  filterButton: {
    borderColor: '#007AFF',
  },
  listContent: {
    padding: 16,
  },
  budgetCard: {
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryChip: {
    alignSelf: 'flex-start',
  },
  categoryChipText: {
    color: 'white',
    fontWeight: 'bold',
  },
  cardActions: {
    flexDirection: 'row',
  },
  description: {
    fontSize: 16,
    color: '#333',
    marginBottom: 12,
  },
  amountsContainer: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  amountLabel: {
    fontSize: 14,
    color: '#666',
  },
  amountValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 8,
  },
  varianceValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.SUCCESS,
  },
  overBudget: {
    color: '#ff6b6b',
  },
  warningChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff3cd',
    marginBottom: 8,
  },
  warningChipText: {
    color: '#856404',
    fontWeight: 'bold',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
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
    backgroundColor: COLORS.PRIMARY,
  },
  dialogContent: {
    paddingHorizontal: 24,
  },
  dialogLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    marginTop: 16,
  },
  categoryButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  categoryButton: {
    marginRight: 8,
  },
  input: {
    marginBottom: 16,
  },
});

export default function BudgetManagementScreenWithErrorBoundary(props: any) {
  return (
    <ErrorBoundary name="BudgetManagementScreen">
      <BudgetManagementScreen {...props} />
    </ErrorBoundary>
  );
}
