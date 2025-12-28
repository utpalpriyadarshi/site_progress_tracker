import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { FAB, Card, Searchbar, Chip, Menu, Portal, Dialog, Button, TextInput } from 'react-native-paper';
import { database } from '../../models/database';
import { useCommercial } from './context/CommercialContext';
import { Q } from '@nozbe/watermelondb';
import { useAuth } from '../auth/AuthContext';
import { logger } from '../services/LoggingService';
import ErrorBoundary from '../components/common/ErrorBoundary';

/**
 * BudgetManagementScreen (v2.11 Phase 5 - Sprint 4)
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

interface Budget {
  id: string;
  projectId: string;
  category: string;
  allocatedAmount: number;
  description: string;
  createdBy: string;
  createdAt: number;
  actualSpent?: number; // Calculated from costs table
}

const BUDGET_CATEGORIES = [
  { value: 'labor', label: 'Labor' },
  { value: 'material', label: 'Materials' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'other', label: 'Subcontractors & Other' },
];

const BudgetManagementScreen = () => {
  const { projectId, projectName, selectedBudgetCategory, setSelectedBudgetCategory, refreshTrigger } = useCommercial();
  const { user } = useAuth();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [filteredBudgets, setFilteredBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

  // Form state
  const [formCategory, setFormCategory] = useState('labor');
  const [formAmount, setFormAmount] = useState('');
  const [formDescription, setFormDescription] = useState('');

  const loadBudgets = useCallback(async () => {
    if (!projectId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      logger.debug('[Budget] Loading budgets for project:', projectId);

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

      logger.debug('[Budget] Loaded budgets:', budgetsWithActuals.length);
      setBudgets(budgetsWithActuals);
    } catch (error) {
      logger.error('[Budget] Error loading budgets:', error);
      Alert.alert('Error', 'Failed to load budgets');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const applyFilters = useCallback(() => {
    let filtered = [...budgets];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (budget) =>
          budget.category.toLowerCase().includes(query) ||
          budget.description.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (selectedBudgetCategory) {
      filtered = filtered.filter((budget) => budget.category === selectedBudgetCategory);
    }

    setFilteredBudgets(filtered);
  }, [budgets, searchQuery, selectedBudgetCategory]);

  useEffect(() => {
    loadBudgets();
  }, [loadBudgets, refreshTrigger]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const handleCreateBudget = async () => {
    if (!formDescription.trim()) {
      Alert.alert('Validation Error', 'Please enter a description');
      return;
    }

    const amount = parseFloat(formAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid amount');
      return;
    }

    try {
      const budgetsCollection = database.collections.get('budgets');

      await database.write(async () => {
        await budgetsCollection.create((record: any) => {
          record.projectId = projectId;
          record.category = formCategory;
          record.allocatedAmount = amount;
          record.description = formDescription.trim();
          record.createdBy = user?.userId || '';
          record.appSyncStatus = 'pending';
          record.version = 1;
        });
      });

      Alert.alert('Success', 'Budget entry created successfully');
      setShowCreateDialog(false);
      resetForm();
      loadBudgets();
    } catch (error) {
      logger.error('[Budget] Error creating budget:', error);
      Alert.alert('Error', 'Failed to create budget entry');
    }
  };

  const handleEditBudget = async () => {
    if (!editingBudget || !formDescription.trim()) {
      Alert.alert('Validation Error', 'Please enter a description');
      return;
    }

    const amount = parseFloat(formAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid amount');
      return;
    }

    try {
      const budgetsCollection = database.collections.get('budgets');
      const budgetRecord = await budgetsCollection.find(editingBudget.id);

      await database.write(async () => {
        await budgetRecord.update((record: any) => {
          record.category = formCategory;
          record.allocatedAmount = amount;
          record.description = formDescription.trim();
          record.appSyncStatus = 'pending';
        });
      });

      Alert.alert('Success', 'Budget entry updated successfully');
      setShowEditDialog(false);
      setEditingBudget(null);
      resetForm();
      loadBudgets();
    } catch (error) {
      logger.error('[Budget] Error updating budget:', error);
      Alert.alert('Error', 'Failed to update budget entry');
    }
  };

  const handleDeleteBudget = (budget: Budget) => {
    Alert.alert(
      'Delete Budget',
      `Are you sure you want to delete this budget entry?\n\n${budget.category.toUpperCase()}: ${budget.description}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const budgetsCollection = database.collections.get('budgets');
              const budgetRecord = await budgetsCollection.find(budget.id);

              await database.write(async () => {
                await budgetRecord.markAsDeleted();
              });

              Alert.alert('Success', 'Budget entry deleted successfully');
              loadBudgets();
            } catch (error) {
              logger.error('[Budget] Error deleting budget:', error);
              Alert.alert('Error', 'Failed to delete budget entry');
            }
          },
        },
      ]
    );
  };

  const openEditDialog = (budget: Budget) => {
    setEditingBudget(budget);
    setFormCategory(budget.category);
    setFormAmount(budget.allocatedAmount.toString());
    setFormDescription(budget.description);
    setShowEditDialog(true);
  };

  const resetForm = () => {
    setFormCategory('labor');
    setFormAmount('');
    setFormDescription('');
  };

  const getCategoryLabel = (category: string) => {
    const cat = BUDGET_CATEGORIES.find((c) => c.value === category);
    return cat ? cat.label : category;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      labor: '#2196F3',
      material: '#4CAF50',
      equipment: '#FF9800',
      other: '#9C27B0',
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
      <Card style={styles.budgetCard}>
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
              <Text style={styles.amountValue}>${item.allocatedAmount.toLocaleString()}</Text>
            </View>
            <View style={styles.amountRow}>
              <Text style={styles.amountLabel}>Actual Spent:</Text>
              <Text style={styles.amountValue}>${(item.actualSpent || 0).toLocaleString()}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.amountRow}>
              <Text style={styles.amountLabel}>Variance:</Text>
              <Text style={[styles.varianceValue, isOverBudget && styles.overBudget]}>
                ${Math.abs(variance).toLocaleString()} ({percentage}%)
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
            selected={formCategory === cat.value}
            onPress={() => setFormCategory(cat.value)}
            style={styles.categoryButton}
            selectedColor="#007AFF"
          >
            {cat.label}
          </Chip>
        ))}
      </View>

      <TextInput
        label="Allocated Amount *"
        value={formAmount}
        onChangeText={setFormAmount}
        keyboardType="numeric"
        mode="outlined"
        style={styles.input}
        left={<TextInput.Affix text="$" />}
      />

      <TextInput
        label="Description *"
        value={formDescription}
        onChangeText={setFormDescription}
        mode="outlined"
        multiline
        numberOfLines={3}
        style={styles.input}
      />
    </ScrollView>
  );

  const totalAllocated = budgets.reduce((sum, b) => sum + b.allocatedAmount, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + (b.actualSpent || 0), 0);
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
            <Text style={styles.summaryValue}>${totalAllocated.toLocaleString()}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Spent</Text>
            <Text style={styles.summaryValue}>${totalSpent.toLocaleString()}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Variance</Text>
            <Text style={[styles.summaryValue, totalVariance < 0 && styles.overBudget]}>
              ${Math.abs(totalVariance).toLocaleString()}
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
          visible={showFilterMenu}
          onDismiss={() => setShowFilterMenu(false)}
          anchor={
            <Button
              mode="outlined"
              onPress={() => setShowFilterMenu(true)}
              style={styles.filterButton}
            >
              {selectedBudgetCategory ? getCategoryLabel(selectedBudgetCategory) : 'All Categories'}
            </Button>
          }
        >
          <Menu.Item
            onPress={() => {
              setSelectedBudgetCategory(null);
              setShowFilterMenu(false);
            }}
            title="All Categories"
          />
          {BUDGET_CATEGORIES.map((cat) => (
            <Menu.Item
              key={cat.value}
              onPress={() => {
                setSelectedBudgetCategory(cat.value);
                setShowFilterMenu(false);
              }}
              title={cat.label}
            />
          ))}
        </Menu>
      </View>

      {/* Budget list */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading budgets...</Text>
        </View>
      ) : filteredBudgets.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {searchQuery || selectedBudgetCategory
              ? 'No budgets match your filters'
              : 'No budget entries yet. Tap + to create one.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredBudgets}
          renderItem={renderBudgetCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* Create FAB */}
      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => {
          resetForm();
          setShowCreateDialog(true);
        }}
        label="Add Budget"
      />

      {/* Create Dialog */}
      <Portal>
        <Dialog visible={showCreateDialog} onDismiss={() => setShowCreateDialog(false)}>
          <Dialog.Title>Create Budget Entry</Dialog.Title>
          <Dialog.ScrollArea>{renderBudgetForm()}</Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button onPress={handleCreateBudget}>Create</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Edit Dialog */}
      <Portal>
        <Dialog visible={showEditDialog} onDismiss={() => setShowEditDialog(false)}>
          <Dialog.Title>Edit Budget Entry</Dialog.Title>
          <Dialog.ScrollArea>{renderBudgetForm()}</Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setShowEditDialog(false)}>Cancel</Button>
            <Button onPress={handleEditBudget}>Save</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
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
    color: '#4CAF50',
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
    backgroundColor: '#007AFF',
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
