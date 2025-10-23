import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
} from 'react-native';
import {
  Card,
  Title,
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
import ItemModel from '../../models/ItemModel';
import SiteModel from '../../models/SiteModel';
import CategoryModel from '../../models/CategoryModel';
import { useSiteContext } from './context/SiteContext';
import SiteSelector from './components/SiteSelector';
import { useSnackbar } from '../components/Snackbar';
import { ConfirmDialog } from '../components/Dialog';

const ItemsManagementScreenComponent = ({
  items,
  sites,
  categories,
}: {
  items: ItemModel[];
  sites: SiteModel[];
  categories: CategoryModel[];
}) => {
  const { selectedSiteId } = useSiteContext();
  const { showSnackbar } = useSnackbar();
  const [filteredItems, setFilteredItems] = useState<ItemModel[]>([]);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<ItemModel | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ItemModel | null>(null);

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

  // Filter items by selected site
  useEffect(() => {
    if (selectedSiteId === 'all') {
      setFilteredItems(items);
    } else {
      const siteItems = items.filter(item => item.siteId === selectedSiteId);
      setFilteredItems(siteItems);
    }
  }, [items, selectedSiteId]);

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
    setSelectedCategoryId(categories[0]?.id || '');
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
    setPlannedStartDate('');
    setPlannedEndDate('');
    setWeightage(item.weightage.toString());
    setStatus(item.status);
    setDialogVisible(true);
  };

  const closeDialog = () => {
    setDialogVisible(false);
    setEditingItem(null);
  };

  const handleSave = async () => {
    if (!itemName.trim() || !plannedQuantity || !selectedCategoryId) {
      setDialogVisible(false);
      showSnackbar('Please fill in all required fields (Name, Quantity, Category)', 'warning');
      return;
    }

    const plannedQty = parseFloat(plannedQuantity);
    const completedQty = parseFloat(completedQuantity) || 0;
    const itemWeightage = parseFloat(weightage) || 0;

    if (isNaN(plannedQty) || plannedQty <= 0) {
      setDialogVisible(false);
      showSnackbar('Please enter a valid planned quantity', 'warning');
      return;
    }

    try {
      await database.write(async () => {
        if (editingItem) {
          // Update existing item
          await editingItem.update((item: any) => {
            item.name = itemName.trim();
            item.plannedQuantity = plannedQty;
            item.completedQuantity = completedQty;
            item.unitOfMeasurement = unitOfMeasurement;
            item.categoryId = selectedCategoryId;
            item.weightage = itemWeightage;
            item.status = status;
            // Update dates if needed
            if (plannedStartDate) {
              item.plannedStartDate = new Date(plannedStartDate).getTime();
            }
            if (plannedEndDate) {
              item.plannedEndDate = new Date(plannedEndDate).getTime();
            }
          });
          showSnackbar('Item updated successfully', 'success');
        } else {
          // Create new item
          await database.collections.get('items').create((item: any) => {
            item.name = itemName.trim();
            item.categoryId = selectedCategoryId;
            item.siteId = selectedSiteId;
            item.plannedQuantity = plannedQty;
            item.completedQuantity = completedQty;
            item.unitOfMeasurement = unitOfMeasurement;
            item.plannedStartDate = plannedStartDate
              ? new Date(plannedStartDate).getTime()
              : new Date().getTime();
            item.plannedEndDate = plannedEndDate
              ? new Date(plannedEndDate).getTime()
              : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).getTime(); // 30 days from now
            item.status = status;
            item.weightage = itemWeightage;
          });
          showSnackbar('Item created successfully', 'success');
        }
      });
      closeDialog();
    } catch (error) {
      console.error('Error saving item:', error);
      showSnackbar('Failed to save item: ' + (error as Error).message, 'error');
    }
  };

  const handleDelete = (item: ItemModel) => {
    setItemToDelete(item);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;

    setShowDeleteDialog(false);
    try {
      await database.write(async () => {
        await itemToDelete.markAsDeleted();
      });
      showSnackbar('Item deleted successfully', 'success');
      setItemToDelete(null);
    } catch (error) {
      console.error('Error deleting item:', error);
      showSnackbar('Failed to delete item: ' + (error as Error).message, 'error');
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed':
        return '#4CAF50';
      case 'in_progress':
        return '#2196F3';
      case 'not_started':
        return '#9E9E9E';
      default:
        return '#9E9E9E';
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
      <View style={styles.header}>
        <Title>Items Management</Title>
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

      <ScrollView style={styles.scrollView}>
        {filteredItems.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content>
              <Text>
                {selectedSiteId === 'all'
                  ? 'No items found. Select a site and create your first item!'
                  : 'No items for this site. Add your first work item!'}
              </Text>
            </Card.Content>
          </Card>
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

      {/* Add/Edit Item Dialog */}
      <Portal>
        <Dialog visible={dialogVisible} onDismiss={closeDialog} style={styles.dialog}>
          <Dialog.ScrollArea>
            <ScrollView>
              <Dialog.Title>
                {editingItem ? 'Edit Item' : 'Add New Item'}
              </Dialog.Title>
              <Dialog.Content>
                <TextInput
                  label="Item Name *"
                  value={itemName}
                  onChangeText={setItemName}
                  mode="outlined"
                  style={styles.input}
                />

                <TextInput
                  label="Planned Quantity *"
                  value={plannedQuantity}
                  onChangeText={setPlannedQuantity}
                  keyboardType="numeric"
                  mode="outlined"
                  style={styles.input}
                />

                <TextInput
                  label="Completed Quantity"
                  value={completedQuantity}
                  onChangeText={setCompletedQuantity}
                  keyboardType="numeric"
                  mode="outlined"
                  style={styles.input}
                />

                <Text style={styles.label}>Unit of Measurement *</Text>
                <Menu
                  visible={unitMenuVisible}
                  onDismiss={() => setUnitMenuVisible(false)}
                  anchor={
                    <Button
                      mode="outlined"
                      onPress={() => setUnitMenuVisible(true)}
                      icon="chevron-down"
                      contentStyle={styles.dropdownButton}
                    >
                      {commonUnits.find(u => u.value === unitOfMeasurement)?.label || 'Select Unit'}
                    </Button>
                  }
                >
                  {commonUnits.map((unit) => (
                    <Menu.Item
                      key={unit.value}
                      onPress={() => {
                        setUnitOfMeasurement(unit.value);
                        setUnitMenuVisible(false);
                      }}
                      title={unit.label}
                      leadingIcon={unitOfMeasurement === unit.value ? 'check' : undefined}
                    />
                  ))}
                </Menu>

                <Text style={styles.label}>Category *</Text>
                <View style={styles.categoryButtons}>
                  {categories.map((category) => (
                    <Chip
                      key={category.id}
                      selected={selectedCategoryId === category.id}
                      onPress={() => setSelectedCategoryId(category.id)}
                      style={styles.categoryChip}
                      mode={selectedCategoryId === category.id ? 'flat' : 'outlined'}
                    >
                      {category.name}
                    </Chip>
                  ))}
                </View>

                <TextInput
                  label="Weightage (%)"
                  value={weightage}
                  onChangeText={setWeightage}
                  keyboardType="numeric"
                  mode="outlined"
                  style={styles.input}
                  placeholder="e.g., 15"
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
              </Dialog.Content>
              <Dialog.Actions>
                <Button onPress={closeDialog}>Cancel</Button>
                <Button onPress={handleSave}>
                  {editingItem ? 'Update' : 'Create'}
                </Button>
              </Dialog.Actions>
            </ScrollView>
          </Dialog.ScrollArea>
        </Dialog>
      </Portal>

      <ConfirmDialog
        visible={showDeleteDialog}
        title="Delete Item"
        message={`Are you sure you want to delete "${itemToDelete?.name}"? This will also delete all associated progress logs and materials.`}
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

// Enhance component with WatermelonDB observables
const enhance = withObservables(['supervisorId'], ({ supervisorId }: { supervisorId: string }) => ({
  items: database.collections.get('items').query(),
  sites: database.collections
    .get('sites')
    .query(Q.where('supervisor_id', supervisorId)),
  categories: database.collections.get('categories').query(),
}));

const EnhancedItemsManagementScreen = enhance(ItemsManagementScreenComponent);

// Wrapper component that provides context
const ItemsManagementScreen = () => {
  const { supervisorId } = useSiteContext();
  return <EnhancedItemsManagementScreen supervisorId={supervisorId} />;
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
    color: '#2196F3',
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
