/**
 * useBomItemData Hook
 * Manages BOM Item CRUD operations and related state
 */

import { useState } from 'react';
import { database } from '../../../../models/database';
import BomModel from '../../../../models/BomModel';
import BomItemModel from '../../../../models/BomItemModel';
import { useSnackbar } from '../../../components/Snackbar';
import { logger } from '../../../services/LoggingService';
import { getBomItems } from '../utils/bomCalculations';

export const useBomItemData = (allBomItems: BomItemModel[]) => {
  const { showSnackbar } = useSnackbar();

  // Dialog state
  const [itemDialogVisible, setItemDialogVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<BomItemModel | null>(null);
  const [showDeleteItemDialog, setShowDeleteItemDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<BomItemModel | null>(null);

  // BOM Item Form state
  const [selectedBomId, setSelectedBomId] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [itemCategory, setItemCategory] = useState<'material' | 'labor' | 'equipment' | 'subcontractor'>('material');
  const [itemQuantity, setItemQuantity] = useState('');
  const [itemUnit, setItemUnit] = useState('');
  const [itemUnitCost, setItemUnitCost] = useState('');
  const [itemPhase, setItemPhase] = useState('');

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
          const items = getBomItems(editingItem.bomId, allBomItems);
          const total = items.reduce((sum, i) => sum + i.totalCost, 0);
          await bom.update((b: any) => {
            b.totalEstimatedCost = total;
            b.updatedDate = Date.now();
          });
        } else {
          // Create new item - generate item code automatically
          const bomItems = getBomItems(selectedBomId, allBomItems);
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
            item.wbsCode = '';
            item.createdDate = Date.now();
            item.updatedDate = Date.now();
            item.appSyncStatus = 'pending';
            item._version = 1;
          });
          showSnackbar('Item added successfully', 'success');

          // Update BOM total cost
          const bom = await database.collections.get<BomModel>('boms').find(selectedBomId);
          const items = getBomItems(selectedBomId, allBomItems);
          const total = items.reduce((sum, i) => sum + i.totalCost, 0);
          await bom.update((b: any) => {
            b.totalEstimatedCost = total;
            b.updatedDate = Date.now();
          });
        }
      });
      closeItemDialog();
    } catch (error) {
      logger.error('Error saving item', error as Error);
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
        const items = getBomItems(bomId, allBomItems);
        const total = items.reduce((sum, i) => sum + i.totalCost, 0);
        await bom.update((b: any) => {
          b.totalEstimatedCost = total;
          b.updatedDate = Date.now();
        });
      });
      showSnackbar('Item deleted successfully', 'success');
      setItemToDelete(null);
    } catch (error) {
      logger.error('Error deleting item', error as Error);
      showSnackbar('Failed to delete item: ' + (error as Error).message, 'error');
    }
  };

  return {
    // Dialog state
    itemDialogVisible,
    setItemDialogVisible,
    editingItem,
    showDeleteItemDialog,
    setShowDeleteItemDialog,
    itemToDelete,
    setItemToDelete,

    // Form state
    selectedBomId,
    setSelectedBomId,
    itemDescription,
    setItemDescription,
    itemCategory,
    setItemCategory,
    itemQuantity,
    setItemQuantity,
    itemUnit,
    setItemUnit,
    itemUnitCost,
    setItemUnitCost,
    itemPhase,
    setItemPhase,

    // Handlers
    openAddItemDialog,
    openEditItemDialog,
    closeItemDialog,
    handleSaveItem,
    handleDeleteItem,
    confirmDeleteItem,
  };
};
