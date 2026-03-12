/**
 * useBomItemData Hook
 * Manages BOM Item CRUD operations and related state
 *
 * Refactored to use useReducer pattern (Phase 2, Task 2.1)
 */

import { useReducer, useCallback } from 'react';
import { database } from '../../../../models/database';
import BomModel from '../../../../models/BomModel';
import BomItemModel from '../../../../models/BomItemModel';
import { useSnackbar } from '../../../components/Snackbar';
import { logger } from '../../../services/LoggingService';
import { getBomItems } from '../utils/bomCalculations';
import { LOCKED_BOM_STATUSES } from '../utils/bomConstants';
import {
  bomItemFormReducer,
  initialBomItemFormState,
  openAddItemDialog as openAddAction,
  openEditItemDialog as openEditAction,
  closeItemDialog as closeAction,
  setItemDescription as setItemDescriptionAction,
  setItemCategory as setItemCategoryAction,
  setItemQuantity as setItemQuantityAction,
  setItemUnit as setItemUnitAction,
  setItemUnitCost as setItemUnitCostAction,
  setItemPhase as setItemPhaseAction,
  openDeleteItemDialog as openDeleteAction,
  closeDeleteItemDialog as closeDeleteAction,
} from '../state';

export const useBomItemData = (allBomItems: BomItemModel[]) => {
  const { showSnackbar } = useSnackbar();

  // Replace 10 useState hooks with single useReducer
  const [state, dispatch] = useReducer(bomItemFormReducer, initialBomItemFormState);

  // Wrap dispatch calls in useCallback
  const openAddItemDialog = useCallback((bomId: string) => {
    dispatch(openAddAction(bomId));
  }, []);

  const openEditItemDialog = useCallback((item: BomItemModel) => {
    dispatch(openEditAction(item));
  }, []);

  const closeItemDialog = useCallback(() => {
    dispatch(closeAction());
  }, []);

  const setItemDescription = useCallback((value: string) => {
    dispatch(setItemDescriptionAction(value));
  }, []);

  const setItemCategory = useCallback((value: 'material' | 'labor' | 'equipment' | 'subcontractor') => {
    dispatch(setItemCategoryAction(value));
  }, []);

  const setItemQuantity = useCallback((value: string) => {
    dispatch(setItemQuantityAction(value));
  }, []);

  const setItemUnit = useCallback((value: string) => {
    dispatch(setItemUnitAction(value));
  }, []);

  const setItemUnitCost = useCallback((value: string) => {
    dispatch(setItemUnitCostAction(value));
  }, []);

  const setItemPhase = useCallback((value: string) => {
    dispatch(setItemPhaseAction(value));
  }, []);

  const handleDeleteItem = useCallback((item: BomItemModel) => {
    dispatch(openDeleteAction(item));
  }, []);

  const setShowDeleteItemDialog = useCallback((visible: boolean) => {
    if (!visible) {
      dispatch(closeDeleteAction());
    }
  }, []);

  const setItemDialogVisible = useCallback((visible: boolean) => {
    if (!visible) {
      closeItemDialog();
    }
  }, [closeItemDialog]);

  const setSelectedBomId = useCallback((_bomId: string) => {
    // This is typically only used internally, but we expose it for compatibility
    // Note: Setting bomId directly is not common in the new reducer pattern
  }, []);

  const setEditingItem = useCallback((item: BomItemModel | null) => {
    if (item) {
      dispatch(openEditAction(item));
    }
  }, []);

  const setItemToDelete = useCallback((item: BomItemModel | null) => {
    if (item) {
      dispatch(openDeleteAction(item));
    } else {
      dispatch(closeDeleteAction());
    }
  }, []);

  // Create or Update BOM Item
  const handleSaveItem = async () => {
    const { itemDescription, itemQuantity, itemUnit, itemUnitCost, itemCategory, itemPhase, selectedBomId } = state.form;
    const { editingItem } = state.dialog;

    if (!itemDescription.trim() || !itemQuantity || !itemUnit.trim() || !itemUnitCost) {
      dispatch(closeAction());
      showSnackbar('Please fill in all required fields', 'warning');
      return;
    }

    try {
      // Guard: reject if BOM is locked
      const bomId = editingItem ? editingItem.bomId : selectedBomId;
      const parentBom = await database.collections.get<BomModel>('boms').find(bomId);
      if (LOCKED_BOM_STATUSES.includes((parentBom as any).status)) {
        dispatch(closeAction());
        showSnackbar('This BOM is locked — items cannot be modified', 'warning');
        return;
      }

      const qty = parseFloat(itemQuantity);
      const cost = parseFloat(itemUnitCost);

      // Validate positive numbers
      if (isNaN(qty) || qty <= 0) {
        dispatch(closeAction());
        showSnackbar('Quantity must be a positive number', 'warning');
        return;
      }

      if (isNaN(cost) || cost < 0) {
        dispatch(closeAction());
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

  const confirmDeleteItem = async () => {
    const { itemToDelete } = state.deleteConfirmation;
    if (!itemToDelete) return;

    // Guard: reject if BOM is locked
    const parentBom = await database.collections.get<BomModel>('boms').find(itemToDelete.bomId);
    if (LOCKED_BOM_STATUSES.includes((parentBom as any).status)) {
      dispatch(closeDeleteAction());
      showSnackbar('This BOM is locked — items cannot be modified', 'warning');
      return;
    }

    dispatch(closeDeleteAction());
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
    } catch (error) {
      logger.error('Error deleting item', error as Error);
      showSnackbar('Failed to delete item: ' + (error as Error).message, 'error');
    }
  };

  // Return interface - map from nested state to flat interface (no breaking changes!)
  return {
    // Dialog state (mapped from state.dialog)
    itemDialogVisible: state.dialog.visible,
    setItemDialogVisible,
    editingItem: state.dialog.editingItem,
    setEditingItem,
    showDeleteItemDialog: state.deleteConfirmation.visible,
    setShowDeleteItemDialog,
    itemToDelete: state.deleteConfirmation.itemToDelete,
    setItemToDelete,

    // Form state (mapped from state.form)
    selectedBomId: state.form.selectedBomId,
    setSelectedBomId,
    itemDescription: state.form.itemDescription,
    setItemDescription,
    itemCategory: state.form.itemCategory,
    setItemCategory,
    itemQuantity: state.form.itemQuantity,
    setItemQuantity,
    itemUnit: state.form.itemUnit,
    setItemUnit,
    itemUnitCost: state.form.itemUnitCost,
    setItemUnitCost,
    itemPhase: state.form.itemPhase,
    setItemPhase,

    // Handlers (unchanged)
    openAddItemDialog,
    openEditItemDialog,
    closeItemDialog,
    handleSaveItem,
    handleDeleteItem,
    confirmDeleteItem,
  };
};
