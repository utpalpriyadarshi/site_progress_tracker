import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Alert,
  ActivityIndicator,
  ScrollView,
  Platform,
} from 'react-native';
import { FAB, Card, Searchbar, Chip, Menu, Portal, Dialog, Button, TextInput } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { database } from '../../models/database';
import { useCommercial } from './context/CommercialContext';
import { Q } from '@nozbe/watermelondb';
import { useAuth } from '../auth/AuthContext';
import { logger } from '../services/LoggingService';

/**
 * CostTrackingScreen (v2.11 Phase 5 - Sprint 5)
 *
 * Commercial Manager tracks actual costs incurred on the project.
 *
 * Features:
 * - View all cost entries for the project
 * - Filter by category (Labor, Materials, Equipment, Subcontractors, Overhead)
 * - Create new cost entries with date
 * - Edit/Delete cost entries
 * - Show cost vs budget comparison
 * - Link to Purchase Orders (optional)
 * - Date-based filtering
 */

interface Cost {
  id: string;
  projectId: string;
  poId?: string;
  category: string;
  amount: number;
  description: string;
  costDate: number;
  createdBy: string;
  createdAt: number;
}

interface BudgetInfo {
  category: string;
  allocated: number;
}

const COST_CATEGORIES = [
  { value: 'labor', label: 'Labor' },
  { value: 'material', label: 'Materials' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'other', label: 'Subcontractors & Other' },
];

const CostTrackingScreen = () => {
  const { projectId, projectName, selectedCostCategory, setSelectedCostCategory, refreshTrigger } = useCommercial();
  const { user } = useAuth();
  const [costs, setCosts] = useState<Cost[]>([]);
  const [filteredCosts, setFilteredCosts] = useState<Cost[]>([]);
  const [budgets, setBudgets] = useState<BudgetInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingCost, setEditingCost] = useState<Cost | null>(null);

  // Form state
  const [formCategory, setFormCategory] = useState('labor');
  const [formAmount, setFormAmount] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPoId, setFormPoId] = useState('');
  const [formCostDate, setFormCostDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const loadCosts = useCallback(async () => {
    if (!projectId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      logger.debug('[Cost] Loading costs for project:', projectId);

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

      logger.debug('[Cost] Loaded costs:', costsArray.length);
      setCosts(costsArray);
      setBudgets(budgetsArray);
    } catch (error) {
      logger.error('[Cost] Error loading costs:', error);
      Alert.alert('Error', 'Failed to load costs');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const applyFilters = useCallback(() => {
    let filtered = [...costs];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (cost) =>
          cost.category.toLowerCase().includes(query) ||
          cost.description.toLowerCase().includes(query) ||
          (cost.poId && cost.poId.toLowerCase().includes(query))
      );
    }

    // Category filter
    if (selectedCostCategory) {
      filtered = filtered.filter((cost) => cost.category === selectedCostCategory);
    }

    setFilteredCosts(filtered);
  }, [costs, searchQuery, selectedCostCategory]);

  useEffect(() => {
    loadCosts();
  }, [loadCosts, refreshTrigger]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const handleCreateCost = async () => {
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
      const costsCollection = database.collections.get('costs');

      await database.write(async () => {
        await costsCollection.create((record: any) => {
          record.projectId = projectId;
          record.poId = formPoId.trim() || null;
          record.category = formCategory;
          record.amount = amount;
          record.description = formDescription.trim();
          record.costDate = formCostDate.getTime();
          record.createdBy = user?.userId || '';
          record.appSyncStatus = 'pending';
          record.version = 1;
        });
      });

      Alert.alert('Success', 'Cost entry created successfully');
      setShowCreateDialog(false);
      resetForm();
      loadCosts();
    } catch (error) {
      logger.error('[Cost] Error creating cost:', error);
      Alert.alert('Error', 'Failed to create cost entry');
    }
  };

  const handleEditCost = async () => {
    if (!editingCost || !formDescription.trim()) {
      Alert.alert('Validation Error', 'Please enter a description');
      return;
    }

    const amount = parseFloat(formAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid amount');
      return;
    }

    try {
      const costsCollection = database.collections.get('costs');
      const costRecord = await costsCollection.find(editingCost.id);

      await database.write(async () => {
        await costRecord.update((record: any) => {
          record.poId = formPoId.trim() || null;
          record.category = formCategory;
          record.amount = amount;
          record.description = formDescription.trim();
          record.costDate = formCostDate.getTime();
          record.appSyncStatus = 'pending';
        });
      });

      Alert.alert('Success', 'Cost entry updated successfully');
      setShowEditDialog(false);
      setEditingCost(null);
      resetForm();
      loadCosts();
    } catch (error) {
      logger.error('[Cost] Error updating cost:', error);
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
              logger.error('[Cost] Error deleting cost:', error);
              Alert.alert('Error', 'Failed to delete cost entry');
            }
          },
        },
      ]
    );
  };

  const openEditDialog = (cost: Cost) => {
    setEditingCost(cost);
    setFormCategory(cost.category);
    setFormAmount(cost.amount.toString());
    setFormDescription(cost.description);
    setFormPoId(cost.poId || '');
    setFormCostDate(new Date(cost.costDate));
    setShowEditDialog(true);
  };

  const resetForm = () => {
    setFormCategory('labor');
    setFormAmount('');
    setFormDescription('');
    setFormPoId('');
    setFormCostDate(new Date());
  };

  const getCategoryLabel = (category: string) => {
    const cat = COST_CATEGORIES.find((c) => c.value === category);
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

  const getBudgetForCategory = (category: string) => {
    const budget = budgets.find((b) => b.category === category);
    return budget ? budget.allocated : 0;
  };

  const getTotalSpentForCategory = (category: string) => {
    return costs
      .filter((c) => c.category === category)
      .reduce((sum, c) => sum + c.amount, 0);
  };

  const renderCostCard = ({ item }: { item: Cost }) => {
    const budgetAmount = getBudgetForCategory(item.category);
    const totalSpent = getTotalSpentForCategory(item.category);
    const isOverBudget = totalSpent > budgetAmount;

    return (
      <Card style={styles.costCard}>
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
                onPress={() => handleDeleteCost(item)}
                compact
                textColor="#ff6b6b"
              >
                Delete
              </Button>
            </View>
          </View>

          <Text style={styles.description}>{item.description}</Text>

          <View style={styles.detailsRow}>
            <Text style={styles.detailLabel}>Amount:</Text>
            <Text style={styles.detailValue}>${item.amount.toLocaleString()}</Text>
          </View>

          <View style={styles.detailsRow}>
            <Text style={styles.detailLabel}>Cost Date:</Text>
            <Text style={styles.detailValue}>{new Date(item.costDate).toLocaleDateString()}</Text>
          </View>

          {item.poId && (
            <View style={styles.detailsRow}>
              <Text style={styles.detailLabel}>PO #:</Text>
              <Text style={styles.detailValue}>{item.poId}</Text>
            </View>
          )}

          <View style={styles.budgetComparison}>
            <Text style={styles.comparisonLabel}>
              Category Total: ${totalSpent.toLocaleString()} / ${budgetAmount.toLocaleString()}
            </Text>
            {isOverBudget && (
              <Chip mode="flat" style={styles.warningChip} textStyle={styles.warningChipText}>
                ⚠️ OVER BUDGET
              </Chip>
            )}
          </View>

          <Text style={styles.timestamp}>
            Created: {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </Card.Content>
      </Card>
    );
  };

  const renderCostForm = () => (
    <ScrollView style={styles.dialogContent}>
      <Text style={styles.dialogLabel}>Category *</Text>
      <View style={styles.categoryButtons}>
        {COST_CATEGORIES.map((cat) => (
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
        label="Amount *"
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

      <TextInput
        label="Purchase Order # (Optional)"
        value={formPoId}
        onChangeText={setFormPoId}
        mode="outlined"
        style={styles.input}
      />

      <Text style={styles.dialogLabel}>Cost Date *</Text>
      <Button
        mode="outlined"
        onPress={() => setShowDatePicker(true)}
        style={styles.dateButton}
      >
        {formCostDate.toLocaleDateString()}
      </Button>

      {showDatePicker && (
        <DateTimePicker
          value={formCostDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            setShowDatePicker(Platform.OS === 'ios');
            if (selectedDate) {
              setFormCostDate(selectedDate);
            }
          }}
        />
      )}
    </ScrollView>
  );

  const totalCosts = costs.reduce((sum, c) => sum + c.amount, 0);
  const totalBudgets = budgets.reduce((sum, b) => sum + b.allocated, 0);
  const totalVariance = totalBudgets - totalCosts;

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
            <Text style={styles.summaryValue}>${totalBudgets.toLocaleString()}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Costs</Text>
            <Text style={styles.summaryValue}>${totalCosts.toLocaleString()}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Remaining</Text>
            <Text style={[styles.summaryValue, totalVariance < 0 && styles.overBudget]}>
              ${Math.abs(totalVariance).toLocaleString()}
            </Text>
          </View>
        </View>
      </View>

      {/* Search and filter */}
      <View style={styles.controls}>
        <Searchbar
          placeholder="Search costs..."
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
              {selectedCostCategory ? getCategoryLabel(selectedCostCategory) : 'All Categories'}
            </Button>
          }
        >
          <Menu.Item
            onPress={() => {
              setSelectedCostCategory(null);
              setShowFilterMenu(false);
            }}
            title="All Categories"
          />
          {COST_CATEGORIES.map((cat) => (
            <Menu.Item
              key={cat.value}
              onPress={() => {
                setSelectedCostCategory(cat.value);
                setShowFilterMenu(false);
              }}
              title={cat.label}
            />
          ))}
        </Menu>
      </View>

      {/* Cost list */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading costs...</Text>
        </View>
      ) : filteredCosts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {searchQuery || selectedCostCategory
              ? 'No costs match your filters'
              : 'No cost entries yet. Tap + to create one.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredCosts}
          renderItem={renderCostCard}
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
        label="Add Cost"
      />

      {/* Create Dialog */}
      <Portal>
        <Dialog visible={showCreateDialog} onDismiss={() => setShowCreateDialog(false)}>
          <Dialog.Title>Create Cost Entry</Dialog.Title>
          <Dialog.ScrollArea>{renderCostForm()}</Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button onPress={handleCreateCost}>Create</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Edit Dialog */}
      <Portal>
        <Dialog visible={showEditDialog} onDismiss={() => setShowEditDialog(false)}>
          <Dialog.Title>Edit Cost Entry</Dialog.Title>
          <Dialog.ScrollArea>{renderCostForm()}</Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setShowEditDialog(false)}>Cancel</Button>
            <Button onPress={handleEditCost}>Save</Button>
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
  costCard: {
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
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  budgetComparison: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 8,
  },
  comparisonLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  overBudget: {
    color: '#ff6b6b',
  },
  warningChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff3cd',
    marginTop: 4,
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
  dateButton: {
    marginBottom: 16,
    borderColor: '#007AFF',
  },
});

export default CostTrackingScreen;
