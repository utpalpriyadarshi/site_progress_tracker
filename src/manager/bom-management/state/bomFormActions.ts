/**
 * BOM Form Action Creators
 *
 * Type-safe action creators for BOM form reducer
 * Provides better DX with autocomplete and type checking
 */

import BomModel from '../../../../models/BomModel';
import { BomFormAction } from './bomFormReducer';

// ==================== Dialog Actions ====================

/**
 * Open the add BOM dialog
 * Pre-populates form with defaults for the selected BOM type
 */
export const openAddBomDialog = (
  bomType: 'estimating' | 'execution',
  defaultProjectId: string,
  defaultCategory: string
): BomFormAction => ({
  type: 'OPEN_ADD_DIALOG',
  payload: { bomType, defaultProjectId, defaultCategory },
});

/**
 * Open the edit BOM dialog
 * Pre-populates form with existing BOM data
 */
export const openEditBomDialog = (bom: BomModel): BomFormAction => ({
  type: 'OPEN_EDIT_DIALOG',
  payload: { bom },
});

/**
 * Close the dialog and reset form state
 */
export const closeBomDialog = (): BomFormAction => ({
  type: 'CLOSE_DIALOG',
});

// ==================== Form Field Actions ====================

/**
 * Update BOM name input value
 */
export const setBomName = (value: string): BomFormAction => ({
  type: 'SET_BOM_NAME',
  payload: value,
});

/**
 * Update selected project ID
 */
export const setProjectId = (value: string): BomFormAction => ({
  type: 'SET_PROJECT_ID',
  payload: value,
});

/**
 * Update BOM type (estimating or execution)
 */
export const setBomType = (value: 'estimating' | 'execution'): BomFormAction => ({
  type: 'SET_BOM_TYPE',
  payload: value,
});

/**
 * Update site category
 */
export const setSiteCategory = (value: string): BomFormAction => ({
  type: 'SET_SITE_CATEGORY',
  payload: value,
});

/**
 * Update quantity input value
 */
export const setQuantity = (value: string): BomFormAction => ({
  type: 'SET_QUANTITY',
  payload: value,
});

/**
 * Update unit input value
 */
export const setUnit = (value: string): BomFormAction => ({
  type: 'SET_UNIT',
  payload: value,
});

/**
 * Update description input value
 */
export const setDescription = (value: string): BomFormAction => ({
  type: 'SET_DESCRIPTION',
  payload: value,
});

// ==================== UI Actions ====================

/**
 * Toggle project dropdown menu visibility
 */
export const toggleProjectMenu = (): BomFormAction => ({
  type: 'TOGGLE_PROJECT_MENU',
});

/**
 * Toggle site category dropdown menu visibility
 */
export const toggleSiteMenu = (): BomFormAction => ({
  type: 'TOGGLE_SITE_MENU',
});

/**
 * Set project menu visibility directly
 */
export const setProjectMenuVisible = (visible: boolean): BomFormAction => ({
  type: 'SET_PROJECT_MENU_VISIBLE',
  payload: visible,
});

/**
 * Set site menu visibility directly
 */
export const setSiteMenuVisible = (visible: boolean): BomFormAction => ({
  type: 'SET_SITE_MENU_VISIBLE',
  payload: visible,
});

// ==================== Delete Confirmation Actions ====================

/**
 * Open delete confirmation dialog
 * @param bom - The BOM to delete
 */
export const openDeleteBomDialog = (bom: BomModel): BomFormAction => ({
  type: 'OPEN_DELETE_DIALOG',
  payload: { bom },
});

/**
 * Close delete confirmation dialog
 */
export const closeDeleteBomDialog = (): BomFormAction => ({
  type: 'CLOSE_DELETE_DIALOG',
});

// ==================== Reset Action ====================

/**
 * Reset entire form state to initial values
 * @param defaultProjectId - Optional default project ID
 * @param defaultCategory - Optional default category
 */
export const resetBomForm = (defaultProjectId?: string, defaultCategory?: string): BomFormAction => ({
  type: 'RESET_FORM',
  payload: { defaultProjectId, defaultCategory },
});
