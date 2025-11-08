import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, FlatList, Alert } from 'react-native';
import {
  Card,
  Title,
  Button,
  TextInput,
  Portal,
  Dialog,
  List,
  IconButton,
  Text,
  Chip,
  Divider,
  Menu,
} from 'react-native-paper';
import { database } from '../../models/database';
import { withObservables } from '@nozbe/watermelondb/react';
import { Q } from '@nozbe/watermelondb';
import BomModel from '../../models/BomModel';
import BomItemModel from '../../models/BomItemModel';
import ProjectModel from '../../models/ProjectModel';
import { useSnackbar } from '../components/Snackbar';
import { ConfirmDialog } from '../components/Dialog';
// import DocumentPicker from 'react-native-document-picker'; // Temporarily disabled - compatibility issue
import { BomImportExportService } from '../services/BomImportExportService';

/**
 * BomManagementScreen - Redesigned to match Supervisor pattern
 *
 * Simple card-based interface:
 * - Create BOM → Shows immediately in list
 * - Add items → Updates card immediately
 * - Edit/Delete → Instant feedback
 */
const BomManagementScreenComponent = ({
  boms,
  projects,
  allBomItems,
}: {
  boms: BomModel[];
  projects: ProjectModel[];
  allBomItems: BomItemModel[];
}) => {
  const { showSnackbar } = useSnackbar();

  // Dialog state
  const [bomDialogVisible, setBomDialogVisible] = useState(false);
  const [itemDialogVisible, setItemDialogVisible] = useState(false);
  const [editingBom, setEditingBom] = useState<BomModel | null>(null);
  const [editingItem, setEditingItem] = useState<BomItemModel | null>(null);
  const [showDeleteBomDialog, setShowDeleteBomDialog] = useState(false);
  const [showDeleteItemDialog, setShowDeleteItemDialog] = useState(false);
  const [bomToDelete, setBomToDelete] = useState<BomModel | null>(null);
  const [itemToDelete, setItemToDelete] = useState<BomItemModel | null>(null);

  // BOM Form state
  const [bomName, setBomName] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [bomType, setBomType] = useState<'estimating' | 'execution'>('estimating');
  const [siteCategory, setSiteCategory] = useState<string>('');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('nos');
  const [description, setDescription] = useState('');

  // BOM Item Form state
  const [selectedBomId, setSelectedBomId] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [itemCategory, setItemCategory] = useState<'material' | 'labor' | 'equipment' | 'subcontractor'>('material');
  const [itemQuantity, setItemQuantity] = useState('');
  const [itemUnit, setItemUnit] = useState('');
  const [itemUnitCost, setItemUnitCost] = useState('');
  const [itemPhase, setItemPhase] = useState('');

  // Tab state
  const [activeTab, setActiveTab] = useState<'estimating' | 'execution'>('estimating');

  // Dropdown menu states
  const [projectMenuVisible, setProjectMenuVisible] = useState(false);
  const [siteMenuVisible, setSiteMenuVisible] = useState(false);

  // Filter BOMs by type
  const filteredBoms = boms.filter(bom => bom.type === activeTab);

  // Get items for a specific BOM
  const getBomItems = (bomId: string): BomItemModel[] => {
    return allBomItems.filter(item => item.bomId === bomId);
  };

  // Calculate total cost for BOM
  const calculateTotalCost = (bomId: string): number => {
    const items = getBomItems(bomId);
    return items.reduce((sum, item) => sum + item.totalCost, 0);
  };

  // Get baseline BOM for execution BOMs
  const getBaselineBom = (baselineBomId: string | undefined): BomModel | undefined => {
    if (!baselineBomId) return undefined;
    return boms.find(b => b.id === baselineBomId);
  };

  // Calculate variance percentage
  const calculateVariance = (baseline: number, actual: number): number => {
    if (baseline === 0) return actual > 0 ? 100 : 0;
    return ((actual - baseline) / baseline) * 100;
  };

  // Site categories for dropdown
  const SITE_CATEGORIES = ['ROCS', 'FOCS', 'RSS', 'AMS', 'TSS', 'ASS', 'Viaduct'];

  // Reset BOM form
  const resetBomForm = () => {
    setBomName('');
    setSelectedProjectId(projects[0]?.id || '');
    setBomType('estimating');
    setSiteCategory(SITE_CATEGORIES[0]);
    setQuantity('1');
    setUnit('nos');
    setDescription('');
    setEditingBom(null);
  };

  // Reset Item form
  const resetItemForm = () => {
    setSelectedBomId('');
    setItemDescription('');
    setItemCategory('material');
    setItemQuantity('');
    setItemUnit('');
    setItemUnitCost('');
    setItemPhase('');
    setEditingItem(null);
  };

  // Open BOM dialog for adding
  const openAddBomDialog = () => {
    if (projects.length === 0) {
      showSnackbar('Please create a project first', 'warning');
      return;
    }
    resetBomForm();
    setBomType(activeTab);
    setSelectedProjectId(projects[0]?.id || '');
    setSiteCategory(SITE_CATEGORIES[0]);
    setBomDialogVisible(true);
  };

  // Open BOM dialog for editing
  const openEditBomDialog = (bom: BomModel) => {
    setEditingBom(bom);
    setBomName(bom.name);
    setSelectedProjectId(bom.projectId);
    setBomType(bom.type as 'estimating' | 'execution');
    setSiteCategory(bom.siteCategory || SITE_CATEGORIES[0]);
    setQuantity(bom.quantity.toString());
    setUnit(bom.unit);
    setDescription(bom.description || '');
    setBomDialogVisible(true);
  };

  // Close BOM dialog
  const closeBomDialog = () => {
    setBomDialogVisible(false);
    resetBomForm();
  };

  // Create or Update BOM
  const handleSaveBom = async () => {
    if (!bomName.trim() || !selectedProjectId || !siteCategory || !quantity || !unit.trim()) {
      setBomDialogVisible(false);
      showSnackbar('Please fill in all required fields', 'warning');
      return;
    }

    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      setBomDialogVisible(false);
      showSnackbar('Quantity must be a positive number', 'warning');
      return;
    }

    try {
      await database.write(async () => {
        if (editingBom) {
          // Update existing BOM
          await editingBom.update((bom: any) => {
            bom.name = bomName.trim();
            bom.siteCategory = siteCategory;
            bom.quantity = qty;
            bom.unit = unit.trim();
            bom.description = description.trim();
            bom.updatedDate = Date.now();
          });
          showSnackbar('BOM updated successfully', 'success');
        } else {
          // Create new BOM
          await database.collections.get<BomModel>('boms').create((bom: any) => {
            bom.projectId = selectedProjectId;
            bom.name = bomName.trim();
            bom.type = bomType;
            bom.status = bomType === 'estimating' ? 'draft' : 'baseline';
            bom.version = 'v1.0';
            bom.siteCategory = siteCategory;
            bom.quantity = qty;
            bom.unit = unit.trim();
            bom.description = description.trim();
            bom.contingency = 5;
            bom.profitMargin = 10;
            bom.totalEstimatedCost = 0;
            bom.totalActualCost = 0;
            bom.createdBy = 'current-user'; // TODO: Get from auth
            bom.createdDate = Date.now();
            bom.updatedDate = Date.now();
            bom.appSyncStatus = 'pending';
            bom._version = 1;
          });
          showSnackbar('BOM created successfully', 'success');
        }
      });
      closeBomDialog();
    } catch (error) {
      console.error('Error saving BOM:', error);
      showSnackbar('Failed to save BOM: ' + (error as Error).message, 'error');
    }
  };

  // Delete BOM
  const handleDeleteBom = (bom: BomModel) => {
    setBomToDelete(bom);
    setShowDeleteBomDialog(true);
  };

  const confirmDeleteBom = async () => {
    if (!bomToDelete) return;

    setShowDeleteBomDialog(false);
    try {
      await database.write(async () => {
        // Delete all BOM items first
        const items = getBomItems(bomToDelete.id);
        for (const item of items) {
          await item.markAsDeleted();
        }
        // Delete BOM
        await bomToDelete.markAsDeleted();
      });
      showSnackbar('BOM deleted successfully', 'success');
      setBomToDelete(null);
    } catch (error) {
      console.error('Error deleting BOM:', error);
      showSnackbar('Failed to delete BOM: ' + (error as Error).message, 'error');
    }
  };

  // Copy BOM to Execution
  const handleCopyToExecution = async (sourceBom: BomModel) => {
    try {
      const sourceItems = getBomItems(sourceBom.id);

      if (sourceItems.length === 0) {
        showSnackbar('Cannot copy BOM with no items', 'warning');
        return;
      }

      await database.write(async () => {
        // Create new execution BOM
        const executionBom = await database.collections.get<BomModel>('boms').create((bom: any) => {
          bom.projectId = sourceBom.projectId;
          bom.name = sourceBom.name + ' (Execution)';
          bom.type = 'execution';
          bom.status = 'baseline';
          bom.version = sourceBom.version;
          bom.siteCategory = sourceBom.siteCategory;
          bom.baselineBomId = sourceBom.id; // Link to original estimating BOM
          bom.quantity = sourceBom.quantity;
          bom.unit = sourceBom.unit;
          bom.description = sourceBom.description || '';
          bom.contingency = sourceBom.contingency;
          bom.profitMargin = sourceBom.profitMargin;
          bom.totalEstimatedCost = sourceBom.totalEstimatedCost;
          bom.totalActualCost = 0;
          bom.createdBy = 'current-user';
          bom.createdDate = Date.now();
          bom.updatedDate = Date.now();
          bom.appSyncStatus = 'pending';
          bom._version = 1;
        });

        // Copy all items
        for (const sourceItem of sourceItems) {
          await database.collections.get<BomItemModel>('bom_items').create((item: any) => {
            item.bomId = executionBom.id;
            item.itemCode = sourceItem.itemCode;
            item.description = sourceItem.description;
            item.category = sourceItem.category;
            item.subCategory = sourceItem.subCategory;
            item.quantity = sourceItem.quantity;
            item.unit = sourceItem.unit;
            item.unitCost = sourceItem.unitCost;
            item.totalCost = sourceItem.totalCost;
            item.phase = sourceItem.phase;
            item.wbsCode = sourceItem.wbsCode || '';
            item.actualQuantity = sourceItem.quantity; // Initialize with baseline quantity
            item.actualCost = sourceItem.totalCost; // Initialize with baseline cost
            item.createdDate = Date.now();
            item.updatedDate = Date.now();
            item.appSyncStatus = 'pending';
            item._version = 1;
          });
        }
      });

      showSnackbar('BOM copied to Execution successfully!', 'success');
      // Switch to execution tab to show the new BOM
      setActiveTab('execution');
    } catch (error) {
      console.error('Error copying BOM:', error);
      showSnackbar('Failed to copy BOM: ' + (error as Error).message, 'error');
    }
  };

  // Export BOM to Excel
  const handleExportBom = async (bom: BomModel) => {
    try {
      const items = getBomItems(bom.id);
      const project = projects.find(p => p.id === bom.projectId);

      showSnackbar('Exporting BOM to Excel...', 'info');

      const filePath = await BomImportExportService.exportBomToExcel({
        bom,
        items,
        projectName: project?.name,
      });

      Alert.alert(
        'Export Successful',
        `BOM exported successfully!\n\nSaved to: ${filePath}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error exporting BOM:', error);
      showSnackbar('Failed to export BOM: ' + (error as Error).message, 'error');
    }
  };

  // Import BOM from file (temporarily disabled - compatibility issue)
  const handleImportBom = async () => {
    Alert.alert(
      'Import Feature',
      'Import feature is currently being upgraded. Please use Export to Excel and manually create BOMs for now.',
      [{ text: 'OK' }]
    );
    /*
    try {
      // Pick file
      const result = await DocumentPicker.pick({
        type: [DocumentPicker.types.xlsx, DocumentPicker.types.xls, DocumentPicker.types.csv],
      });

      if (!result || result.length === 0) {
        return;
      }

      const file = Array.isArray(result) ? result[0] : result;

      showSnackbar('Importing BOM...', 'info');

      // Import data
      const importResult = await BomImportExportService.importBomFromFile(file.uri);

      if (!importResult.success) {
        Alert.alert(
          'Import Failed',
          `Could not import BOM:\n${importResult.errors.join('\n')}`,
          [{ text: 'OK' }]
        );
        return;
      }

      // Show import summary and create BOM
      Alert.alert(
        'Import Summary',
        `Total rows: ${importResult.totalRows}\nValid items: ${importResult.validRows}\nSkipped rows: ${importResult.skippedRows}\n\nCreate a new BOM with these items?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Create BOM',
            onPress: () => createBomFromImport(importResult),
          },
        ]
      );
    } catch (error: any) {
      if (DocumentPicker.isCancel(error)) {
        // User cancelled
        return;
      }
      console.error('Error importing BOM:', error);
      showSnackbar('Failed to import BOM: ' + error.message, 'error');
    }
    */
  };

  // Create BOM from imported data
  const createBomFromImport = async (importResult: any) => {
    try {
      if (projects.length === 0) {
        showSnackbar('Please create a project first', 'warning');
        return;
      }

      await database.write(async () => {
        // Create new BOM
        const newBom = await database.collections.get<BomModel>('boms').create((bom: any) => {
          bom.projectId = projects[0].id;
          bom.name = `Imported BOM ${new Date().toLocaleDateString('en-IN')}`;
          bom.type = 'estimating';
          bom.status = 'draft';
          bom.version = 'v1.0';
          bom.siteCategory = SITE_CATEGORIES[0];
          bom.quantity = 1;
          bom.unit = 'nos';
          bom.description = `Imported on ${new Date().toLocaleString('en-IN')}`;
          bom.contingency = 5;
          bom.profitMargin = 10;
          bom.totalEstimatedCost = 0;
          bom.totalActualCost = 0;
          bom.createdBy = 'current-user';
          bom.createdDate = Date.now();
          bom.updatedDate = Date.now();
          bom.appSyncStatus = 'pending';
          bom._version = 1;
        });

        // Create items
        let totalCost = 0;
        let itemNumber = 1;

        for (const importedItem of importResult.items) {
          const categoryPrefix = importedItem.category.substring(0, 3).toUpperCase();
          const itemCode = `${categoryPrefix}-${String(itemNumber).padStart(3, '0')}`;
          const cost = importedItem.quantity * importedItem.unitCost;

          await database.collections.get<BomItemModel>('bom_items').create((item: any) => {
            item.bomId = newBom.id;
            item.itemCode = itemCode;
            item.description = importedItem.description;
            item.category = importedItem.category;
            item.quantity = importedItem.quantity;
            item.unit = importedItem.unit;
            item.unitCost = importedItem.unitCost;
            item.totalCost = cost;
            item.phase = importedItem.phase || '';
            item.wbsCode = '';
            item.createdDate = Date.now();
            item.updatedDate = Date.now();
            item.appSyncStatus = 'pending';
            item._version = 1;
          });

          totalCost += cost;
          itemNumber++;
        }

        // Update BOM total cost
        await newBom.update((b: any) => {
          b.totalEstimatedCost = totalCost;
        });
      });

      showSnackbar(`BOM imported successfully with ${importResult.validRows} items!`, 'success');
    } catch (error) {
      console.error('Error creating BOM from import:', error);
      showSnackbar('Failed to create BOM: ' + (error as Error).message, 'error');
    }
  };

  // Open Item dialog for adding
  const openAddItemDialog = (bomId: string) => {
    resetItemForm();
    setSelectedBomId(bomId);
    setItemDialogVisible(true);
  };

  // Open Item dialog for editing
  const openEditItemDialog = (item: BomItemModel) => {
    setEditingItem(item);
    setSelectedBomId(item.bomId);
    setItemDescription(item.description);
    setItemCategory(item.category as any);
    setItemQuantity(item.quantity.toString());
    setItemUnit(item.unit);
    setItemUnitCost(item.unitCost.toString());
    setItemPhase(item.phase || '');
    setItemDialogVisible(true);
  };

  // Close Item dialog
  const closeItemDialog = () => {
    setItemDialogVisible(false);
    resetItemForm();
  };

  // Create or Update BOM Item
  const handleSaveItem = async () => {
    if (!itemDescription.trim() || !itemQuantity || !itemUnit.trim() || !itemUnitCost) {
      setItemDialogVisible(false);
      showSnackbar('Please fill in all required fields', 'warning');
      return;
    }

    try {
      const qty = parseFloat(itemQuantity);
      const cost = parseFloat(itemUnitCost);

      // Validate positive numbers
      if (isNaN(qty) || qty <= 0) {
        setItemDialogVisible(false);
        showSnackbar('Quantity must be a positive number', 'warning');
        return;
      }

      if (isNaN(cost) || cost < 0) {
        setItemDialogVisible(false);
        showSnackbar('Unit cost cannot be negative', 'warning');
        return;
      }

      const totalCost = qty * cost;

      await database.write(async () => {
        if (editingItem) {
          // Update existing item
          await editingItem.update((item: any) => {
            item.description = itemDescription.trim();
            item.category = itemCategory;
            item.quantity = qty;
            item.unit = itemUnit.trim();
            item.unitCost = cost;
            item.totalCost = totalCost;
            item.phase = itemPhase.trim();
            item.updatedDate = Date.now();
          });
          showSnackbar('Item updated successfully', 'success');

          // Recalculate BOM total
          const bom = await database.collections.get<BomModel>('boms').find(editingItem.bomId);
          const items = getBomItems(editingItem.bomId);
          const total = items.reduce((sum, i) => sum + i.totalCost, 0);
          await bom.update((b: any) => {
            b.totalEstimatedCost = total;
            b.updatedDate = Date.now();
          });
        } else {
          // Create new item - generate item code automatically
          const bomItems = getBomItems(selectedBomId);
          const itemNumber = bomItems.length + 1;
          const categoryPrefix = itemCategory.substring(0, 3).toUpperCase();
          const generatedItemCode = `${categoryPrefix}-${String(itemNumber).padStart(3, '0')}`;

          await database.collections.get<BomItemModel>('bom_items').create((item: any) => {
            item.bomId = selectedBomId;
            item.itemCode = generatedItemCode;
            item.description = itemDescription.trim();
            item.category = itemCategory;
            item.quantity = qty;
            item.unit = itemUnit.trim();
            item.unitCost = cost;
            item.totalCost = totalCost;
            item.phase = itemPhase.trim();
            item.wbsCode = ''; // No longer used
            item.createdDate = Date.now();
            item.updatedDate = Date.now();
            item.appSyncStatus = 'pending';
            item._version = 1;
          });
          showSnackbar('Item added successfully', 'success');

          // Update BOM total cost
          const bom = await database.collections.get<BomModel>('boms').find(selectedBomId);
          const items = getBomItems(selectedBomId);
          const total = items.reduce((sum, i) => sum + i.totalCost, 0);
          await bom.update((b: any) => {
            b.totalEstimatedCost = total;
            b.updatedDate = Date.now();
          });
        }
      });
      closeItemDialog();
    } catch (error) {
      console.error('Error saving item:', error);
      showSnackbar('Failed to save item: ' + (error as Error).message, 'error');
    }
  };

  // Delete Item
  const handleDeleteItem = (item: BomItemModel) => {
    setItemToDelete(item);
    setShowDeleteItemDialog(true);
  };

  const confirmDeleteItem = async () => {
    if (!itemToDelete) return;

    setShowDeleteItemDialog(false);
    try {
      const bomId = itemToDelete.bomId;
      await database.write(async () => {
        await itemToDelete.markAsDeleted();

        // Recalculate BOM total
        const bom = await database.collections.get<BomModel>('boms').find(bomId);
        const items = getBomItems(bomId);
        const total = items.reduce((sum, i) => sum + i.totalCost, 0);
        await bom.update((b: any) => {
          b.totalEstimatedCost = total;
          b.updatedDate = Date.now();
        });
      });
      showSnackbar('Item deleted successfully', 'success');
      setItemToDelete(null);
    } catch (error) {
      console.error('Error deleting item:', error);
      showSnackbar('Failed to delete item: ' + (error as Error).message, 'error');
    }
  };

  // Get status color and text color for better visibility
  const getStatusColor = (status: string): { bg: string; text: string } => {
    const colors: Record<string, { bg: string; text: string }> = {
      draft: { bg: '#9C27B0', text: '#FFFFFF' },        // Purple - more appealing
      submitted: { bg: '#2196F3', text: '#FFFFFF' },    // Blue
      won: { bg: '#4CAF50', text: '#FFFFFF' },          // Green
      lost: { bg: '#F44336', text: '#FFFFFF' },         // Red
      baseline: { bg: '#FF9800', text: '#FFFFFF' },     // Orange
      active: { bg: '#4CAF50', text: '#FFFFFF' },       // Green
      closed: { bg: '#616161', text: '#FFFFFF' },       // Gray
    };
    return colors[status] || { bg: '#9E9E9E', text: '#FFFFFF' };
  };

  // Format currency
  const formatCurrency = (amount: number): string => {
    return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  };

  // Render BOM Card
  const renderBomCard = (bom: BomModel) => {
    const project = projects.find(p => p.id === bom.projectId);
    const items = getBomItems(bom.id);
    const totalCost = calculateTotalCost(bom.id);
    const statusColors = getStatusColor(bom.status);

    // For execution BOMs, get baseline data
    const baselineBom = bom.type === 'execution' ? getBaselineBom(bom.baselineBomId) : undefined;
    const baselineTotalCost = baselineBom ? calculateTotalCost(baselineBom.id) : 0;
    const variance = baselineBom ? calculateVariance(baselineTotalCost, totalCost) : 0;

    return (
      <Card key={bom.id} style={styles.bomCard}>
        <Card.Content>
          {/* BOM Header */}
          <View style={styles.bomHeader}>
            <View style={styles.bomTitleSection}>
              <Text variant="titleMedium" style={styles.bomName}>{bom.name}</Text>
              <Chip
                mode="flat"
                style={[styles.statusChip, { backgroundColor: statusColors.bg }]}
                textStyle={[styles.statusChipText, { color: statusColors.text }]}
              >
                {bom.status.toUpperCase()}
              </Chip>
            </View>
            <View style={styles.bomActions}>
              <IconButton
                icon="pencil"
                size={20}
                onPress={() => openEditBomDialog(bom)}
              />
              <IconButton
                icon="delete"
                size={20}
                iconColor="#FF3B30"
                onPress={() => handleDeleteBom(bom)}
              />
            </View>
          </View>

          {/* BOM Info */}
          <View style={styles.bomInfo}>
            {project && (
              <Text variant="bodySmall" style={styles.infoText}>
                📁 Project: {project.name}
              </Text>
            )}
            <Text variant="bodySmall" style={styles.infoText}>
              🏗️ Site: {bom.siteCategory}
            </Text>
            <Text variant="bodySmall" style={styles.infoText}>
              📦 Quantity: {bom.quantity} {bom.unit}
            </Text>
            <Text variant="bodySmall" style={styles.infoText}>
              📋 Version: {bom.version}
            </Text>
          </View>

          <Divider style={styles.divider} />

          {/* BOM Items Summary */}
          <View style={styles.itemsSection}>
            <View style={styles.itemsHeader}>
              <Text variant="titleSmall">Items ({items.length})</Text>
              <Button
                mode="outlined"
                icon="plus"
                onPress={() => openAddItemDialog(bom.id)}
                compact
                style={styles.addItemButton}
              >
                Add Item
              </Button>
            </View>

            {items.length === 0 ? (
              <Text variant="bodySmall" style={styles.emptyItemsText}>
                No items added yet. Click "Add Item" to start.
              </Text>
            ) : (
              <View style={styles.itemsList}>
                {items.map((item, index) => (
                  <View key={item.id} style={styles.itemRow}>
                    <View style={styles.itemInfo}>
                      <Text variant="bodyMedium" style={styles.itemCode}>
                        {item.itemCode}
                      </Text>
                      <Text variant="bodySmall" style={styles.itemDescription}>
                        {item.description}
                      </Text>
                      <Text variant="bodySmall" style={styles.itemDetails}>
                        {item.quantity} {item.unit} × {formatCurrency(item.unitCost)} = {formatCurrency(item.totalCost)}
                      </Text>
                      <Chip
                        mode="flat"
                        style={styles.categoryChip}
                        textStyle={styles.categoryChipText}
                      >
                        {item.category.toUpperCase()}
                      </Chip>
                    </View>
                    <View style={styles.itemActions}>
                      <IconButton
                        icon="pencil"
                        size={18}
                        onPress={() => openEditItemDialog(item)}
                      />
                      <IconButton
                        icon="delete"
                        size={18}
                        iconColor="#FF3B30"
                        onPress={() => handleDeleteItem(item)}
                      />
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Total Cost */}
          {items.length > 0 && (
            <>
              <Divider style={styles.divider} />
              {bom.type === 'execution' && baselineBom ? (
                // Execution BOM with baseline comparison
                <View style={styles.varianceSection}>
                  <View style={styles.costRow}>
                    <Text variant="bodySmall" style={styles.costLabel}>Baseline Cost:</Text>
                    <Text variant="bodyMedium" style={styles.baselineCost}>
                      {formatCurrency(baselineTotalCost)}
                    </Text>
                  </View>
                  <View style={styles.costRow}>
                    <Text variant="titleSmall">Actual Cost:</Text>
                    <Text variant="titleMedium" style={styles.totalAmount}>
                      {formatCurrency(totalCost)}
                    </Text>
                  </View>
                  <View style={styles.costRow}>
                    <Text variant="bodySmall" style={styles.costLabel}>Variance:</Text>
                    <View style={styles.varianceContainer}>
                      <Text
                        variant="bodyMedium"
                        style={[
                          styles.varianceText,
                          { color: variance > 0 ? '#F44336' : variance < 0 ? '#4CAF50' : '#666' }
                        ]}
                      >
                        {variance > 0 ? '+' : ''}{variance.toFixed(1)}%
                      </Text>
                      <Text
                        variant="bodySmall"
                        style={[
                          styles.varianceAmount,
                          { color: variance > 0 ? '#F44336' : variance < 0 ? '#4CAF50' : '#666' }
                        ]}
                      >
                        ({variance > 0 ? '+' : ''}{formatCurrency(totalCost - baselineTotalCost)})
                      </Text>
                    </View>
                  </View>
                </View>
              ) : (
                // Regular estimating BOM
                <View style={styles.totalSection}>
                  <Text variant="titleSmall">Total Estimated Cost:</Text>
                  <Text variant="titleMedium" style={styles.totalAmount}>
                    {formatCurrency(totalCost)}
                  </Text>
                </View>
              )}
            </>
          )}

          {/* Copy to Execution Button (only for estimating BOMs) */}
          {bom.type === 'estimating' && items.length > 0 && (
            <>
              <Divider style={styles.divider} />
              <Button
                mode="contained"
                icon="content-copy"
                onPress={() => handleCopyToExecution(bom)}
                style={styles.copyButton}
              >
                Copy to Execution
              </Button>
            </>
          )}

          {/* Baseline Link (only for execution BOMs) */}
          {bom.type === 'execution' && bom.baselineBomId && (
            <>
              <Divider style={styles.divider} />
              <View style={styles.baselineLink}>
                <Text variant="bodySmall" style={styles.baselineLinkText}>
                  🔗 Linked to baseline estimating BOM
                </Text>
              </View>
            </>
          )}

          {/* Export Button (show for any BOM with items) */}
          {items.length > 0 && (
            <>
              <Divider style={styles.divider} />
              <Button
                mode="outlined"
                icon="download"
                onPress={() => handleExportBom(bom)}
                style={styles.exportButton}
              >
                Export to Excel
              </Button>
            </>
          )}
        </Card.Content>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Title>BOM Management</Title>
        <View style={styles.headerButtons}>
          <Button
            mode="outlined"
            icon="upload"
            onPress={handleImportBom}
            style={styles.importButton}
            compact
          >
            Import
          </Button>
          <Button
            mode="contained"
            icon="plus"
            onPress={openAddBomDialog}
            style={styles.addButton}
          >
            Add BOM
          </Button>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <Button
          mode={activeTab === 'estimating' ? 'contained' : 'outlined'}
          onPress={() => setActiveTab('estimating')}
          style={styles.tabButton}
        >
          Pre-Contract (Estimating)
        </Button>
        <Button
          mode={activeTab === 'execution' ? 'contained' : 'outlined'}
          onPress={() => setActiveTab('execution')}
          style={styles.tabButton}
        >
          Post-Contract (Execution)
        </Button>
      </View>

      {/* BOM List */}
      <ScrollView style={styles.scrollView}>
        {filteredBoms.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content>
              <Text variant="bodyLarge" style={styles.emptyText}>
                No {activeTab === 'estimating' ? 'Estimating' : 'Execution'} BOMs found
              </Text>
              <Text variant="bodySmall" style={styles.emptyHint}>
                Click "Add BOM" to create your first BOM
              </Text>
            </Card.Content>
          </Card>
        ) : (
          filteredBoms.map(renderBomCard)
        )}
      </ScrollView>

      {/* Add/Edit BOM Dialog */}
      <Portal>
        <Dialog visible={bomDialogVisible} onDismiss={closeBomDialog} style={styles.dialog}>
          <Dialog.Title>{editingBom ? 'Edit BOM' : 'Add New BOM'}</Dialog.Title>
          <Dialog.ScrollArea>
            <ScrollView>
              <TextInput
                label="BOM Name *"
                value={bomName}
                onChangeText={setBomName}
                mode="outlined"
                style={styles.input}
              />

              {/* Project Selection - Dropdown */}
              {projects.length > 0 && (
                <View style={styles.dropdownContainer}>
                  <Text variant="labelLarge" style={styles.label}>Select Project *</Text>
                  <Menu
                    visible={projectMenuVisible}
                    onDismiss={() => setProjectMenuVisible(false)}
                    anchor={
                      <Button
                        mode="outlined"
                        onPress={() => setProjectMenuVisible(true)}
                        icon="chevron-down"
                        contentStyle={{ flexDirection: 'row-reverse' }}
                        style={styles.dropdownButton}
                      >
                        {projects.find(p => p.id === selectedProjectId)?.name || 'Select Project'}
                      </Button>
                    }
                  >
                    {projects.map((project) => (
                      <Menu.Item
                        key={project.id}
                        onPress={() => {
                          setSelectedProjectId(project.id);
                          setProjectMenuVisible(false);
                        }}
                        title={project.name}
                        leadingIcon={selectedProjectId === project.id ? 'check' : undefined}
                      />
                    ))}
                  </Menu>
                </View>
              )}

              {!editingBom && (
                <View style={styles.typeSelector}>
                  <Text variant="labelLarge" style={styles.label}>BOM Type *</Text>
                  <View style={styles.typeButtons}>
                    <Button
                      mode={bomType === 'estimating' ? 'contained' : 'outlined'}
                      onPress={() => setBomType('estimating')}
                      style={styles.typeButton}
                    >
                      Estimating
                    </Button>
                    <Button
                      mode={bomType === 'execution' ? 'contained' : 'outlined'}
                      onPress={() => setBomType('execution')}
                      style={styles.typeButton}
                    >
                      Execution
                    </Button>
                  </View>
                </View>
              )}

              {/* Site Category - Dropdown */}
              <View style={styles.dropdownContainer}>
                <Text variant="labelLarge" style={styles.label}>Site Category *</Text>
                <Menu
                  visible={siteMenuVisible}
                  onDismiss={() => setSiteMenuVisible(false)}
                  anchor={
                    <Button
                      mode="outlined"
                      onPress={() => setSiteMenuVisible(true)}
                      icon="chevron-down"
                      contentStyle={{ flexDirection: 'row-reverse' }}
                      style={styles.dropdownButton}
                    >
                      {siteCategory || 'Select Site Category'}
                    </Button>
                  }
                >
                  {SITE_CATEGORIES.map((category) => (
                    <Menu.Item
                      key={category}
                      onPress={() => {
                        setSiteCategory(category);
                        setSiteMenuVisible(false);
                      }}
                      title={category}
                      leadingIcon={siteCategory === category ? 'check' : undefined}
                    />
                  ))}
                </Menu>
              </View>

              <View style={styles.row}>
                <TextInput
                  label="Quantity *"
                  value={quantity}
                  onChangeText={setQuantity}
                  keyboardType="numeric"
                  mode="outlined"
                  style={[styles.input, styles.halfInput]}
                />
                <TextInput
                  label="Unit *"
                  value={unit}
                  onChangeText={setUnit}
                  mode="outlined"
                  placeholder="nos, floors, etc."
                  style={[styles.input, styles.halfInput]}
                />
              </View>

              <TextInput
                label="Description"
                value={description}
                onChangeText={setDescription}
                mode="outlined"
                multiline
                numberOfLines={3}
                style={styles.input}
              />
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={closeBomDialog}>Cancel</Button>
            <Button onPress={handleSaveBom}>
              {editingBom ? 'Update' : 'Create'}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Add/Edit Item Dialog */}
      <Portal>
        <Dialog visible={itemDialogVisible} onDismiss={closeItemDialog} style={styles.dialog}>
          <Dialog.Title>{editingItem ? 'Edit Item' : 'Add Item'}</Dialog.Title>
          <Dialog.ScrollArea>
            <ScrollView>
              <TextInput
                label="Description *"
                value={itemDescription}
                onChangeText={setItemDescription}
                mode="outlined"
                multiline
                numberOfLines={2}
                placeholder="e.g., Portland Cement OPC 53"
                style={styles.input}
              />

              <View style={styles.categorySelector}>
                <Text variant="labelLarge" style={styles.label}>Category *</Text>
                <View style={styles.categoryButtons}>
                  {['material', 'labor', 'equipment', 'subcontractor'].map((cat) => (
                    <Chip
                      key={cat}
                      mode={itemCategory === cat ? 'flat' : 'outlined'}
                      selected={itemCategory === cat}
                      onPress={() => setItemCategory(cat as any)}
                      style={styles.categoryChipButton}
                    >
                      {cat}
                    </Chip>
                  ))}
                </View>
              </View>

              <View style={styles.row}>
                <TextInput
                  label="Quantity *"
                  value={itemQuantity}
                  onChangeText={setItemQuantity}
                  keyboardType="numeric"
                  mode="outlined"
                  style={[styles.input, styles.halfInput]}
                />
                <TextInput
                  label="Unit *"
                  value={itemUnit}
                  onChangeText={setItemUnit}
                  mode="outlined"
                  placeholder="kg, m3, etc."
                  style={[styles.input, styles.halfInput]}
                />
              </View>

              <TextInput
                label="Unit Cost *"
                value={itemUnitCost}
                onChangeText={setItemUnitCost}
                keyboardType="numeric"
                mode="outlined"
                style={styles.input}
              />

              <TextInput
                label="Phase (Optional)"
                value={itemPhase}
                onChangeText={setItemPhase}
                mode="outlined"
                placeholder="foundation, structure, etc."
                style={styles.input}
              />
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={closeItemDialog}>Cancel</Button>
            <Button onPress={handleSaveItem}>
              {editingItem ? 'Update' : 'Add'}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Delete BOM Confirmation */}
      <ConfirmDialog
        visible={showDeleteBomDialog}
        title="Delete BOM"
        message={`Are you sure you want to delete "${bomToDelete?.name}"? All items will be deleted.`}
        onConfirm={confirmDeleteBom}
        onCancel={() => {
          setShowDeleteBomDialog(false);
          setBomToDelete(null);
        }}
      />

      {/* Delete Item Confirmation */}
      <ConfirmDialog
        visible={showDeleteItemDialog}
        title="Delete Item"
        message={`Are you sure you want to delete "${itemToDelete?.itemCode}"?`}
        onConfirm={confirmDeleteItem}
        onCancel={() => {
          setShowDeleteItemDialog(false);
          setItemToDelete(null);
        }}
      />
    </View>
  );
};

// Wire up WatermelonDB observables
const enhance = withObservables([], () => ({
  boms: database.collections.get<BomModel>('boms').query().observe(),
  projects: database.collections.get<ProjectModel>('projects').query().observe(),
  allBomItems: database.collections.get<BomItemModel>('bom_items').query().observe(),
}));

const BomManagementScreen = enhance(BomManagementScreenComponent);

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
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  importButton: {
    marginRight: 8,
  },
  addButton: {
    marginLeft: 0,
  },
  tabsContainer: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tabButton: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 12,
  },
  emptyCard: {
    marginTop: 40,
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '600',
  },
  emptyHint: {
    textAlign: 'center',
    color: '#666',
  },
  bomCard: {
    marginBottom: 16,
  },
  bomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  bomTitleSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bomName: {
    fontWeight: '600',
    flex: 1,
  },
  statusChip: {
    height: 28,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusChipText: {
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    textAlign: 'center',
    lineHeight: 14,
  },
  bomActions: {
    flexDirection: 'row',
    marginLeft: 8,
  },
  bomInfo: {
    marginBottom: 12,
  },
  infoText: {
    color: '#666',
    marginBottom: 4,
  },
  divider: {
    marginVertical: 12,
  },
  itemsSection: {
    marginTop: 4,
  },
  itemsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  addItemButton: {
    marginLeft: 8,
  },
  emptyItemsText: {
    color: '#999',
    fontStyle: 'italic',
    marginTop: 8,
  },
  itemsList: {
    marginTop: 8,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemInfo: {
    flex: 1,
  },
  itemCode: {
    fontWeight: '600',
    marginBottom: 2,
  },
  itemDescription: {
    color: '#666',
    marginBottom: 4,
  },
  itemDetails: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  categoryChip: {
    alignSelf: 'flex-start',
    marginTop: 4,
    backgroundColor: '#E3F2FD',
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1976D2',
    lineHeight: 18,
  },
  itemActions: {
    flexDirection: 'row',
    marginLeft: 8,
  },
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  totalAmount: {
    color: '#2196F3',
    fontWeight: 'bold',
  },
  varianceSection: {
    marginTop: 8,
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  costLabel: {
    color: '#666',
  },
  baselineCost: {
    color: '#666',
    fontWeight: '600',
  },
  varianceContainer: {
    alignItems: 'flex-end',
  },
  varianceText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  varianceAmount: {
    fontSize: 12,
    marginTop: 2,
  },
  dialog: {
    maxHeight: '90%',
  },
  input: {
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  halfInput: {
    flex: 1,
  },
  projectSelector: {
    marginBottom: 12,
  },
  label: {
    marginBottom: 8,
  },
  projectList: {
    maxHeight: 150,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
  },
  typeSelector: {
    marginBottom: 12,
  },
  typeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  typeButton: {
    flex: 1,
  },
  categorySelector: {
    marginBottom: 12,
  },
  categoryButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChipButton: {
    marginRight: 4,
  },
  dropdownContainer: {
    marginBottom: 12,
  },
  dropdownButton: {
    marginTop: 4,
    justifyContent: 'flex-start',
  },
  copyButton: {
    marginTop: 8,
  },
  exportButton: {
    marginTop: 8,
  },
  baselineLink: {
    paddingVertical: 8,
    backgroundColor: '#FFF3E0',
    borderRadius: 4,
    paddingHorizontal: 12,
    marginTop: 8,
  },
  baselineLinkText: {
    color: '#E65100',
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default BomManagementScreen;
