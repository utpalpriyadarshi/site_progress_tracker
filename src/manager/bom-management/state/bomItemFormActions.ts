/**
 * BOM Item Form Action Creators
 *
 * Type-safe action creators for BOM item form reducer
 * Provides better DX with autocomplete and type checking
 */

import BomItemModel from '../../../../models/BomItemModel';
import { BomItemFormAction } from './bomItemFormReducer';

// ==================== Dialog Actions ====================

/**
 * Open the add BOM item dialog
 * Pre-populates form with BOM ID
 */
export const openAddItemDialog = (bomId: string): BomItemFormAction => ({
  type: 'OPEN_ADD_DIALOG',
  payload: { bomId },
});

/**
 * Open the edit BOM item dialog
 * Pre-populates form with existing item data
 */
export const openEditItemDialog = (item: BomItemModel): BomItemFormAction => ({
  type: 'OPEN_EDIT_DIALOG',
  payload: { item },
});

/**
 * Close the dialog and reset form state
 */
export const closeItemDialog = (): BomItemFormAction => ({
  type: 'CLOSE_DIALOG',
});

// ==================== Form Field Actions ====================

/**
 * Update item description input value
 */
export const setItemDescription = (value: string): BomItemFormAction => ({
  type: 'SET_ITEM_DESCRIPTION',
  payload: value,
});

/**
 * Update item category
 */
export const setItemCategory = (
  value: 'material' | 'labor' | 'equipment' | 'subcontractor'
): BomItemFormAction => ({
  type: 'SET_ITEM_CATEGORY',
  payload: value,
});

/**
 * Update item quantity input value
 */
export const setItemQuantity = (value: string): BomItemFormAction => ({
  type: 'SET_ITEM_QUANTITY',
  payload: value,
});

/**
 * Update item unit input value
 */
export const setItemUnit = (value: string): BomItemFormAction => ({
  type: 'SET_ITEM_UNIT',
  payload: value,
});

/**
 * Update item unit cost input value
 */
export const setItemUnitCost = (value: string): BomItemFormAction => ({
  type: 'SET_ITEM_UNIT_COST',
  payload: value,
});

/**
 * Update item phase input value
 */
export const setItemPhase = (value: string): BomItemFormAction => ({
  type: 'SET_ITEM_PHASE',
  payload: value,
});

// ==================== Delete Confirmation Actions ====================

/**
 * Open delete confirmation dialog
 * @param item - The BOM item to delete
 */
export const openDeleteItemDialog = (item: BomItemModel): BomItemFormAction => ({
  type: 'OPEN_DELETE_DIALOG',
  payload: { item },
});

/**
 * Close delete confirmation dialog
 */
export const closeDeleteItemDialog = (): BomItemFormAction => ({
  type: 'CLOSE_DELETE_DIALOG',
});

// ==================== Reset Action ====================

/**
 * Reset entire form state to initial values
 * @param bomId - Optional BOM ID to associate with new items
 */
export const resetItemForm = (bomId?: string): BomItemFormAction => ({
  type: 'RESET_FORM',
  payload: { bomId },
});
