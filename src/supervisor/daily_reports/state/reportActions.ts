/**
 * Report Form Action Creators
 *
 * Type-safe action creators for report form reducer
 * Provides better DX with autocomplete and type checking
 */

import ItemModel from '../../../../models/ItemModel';
import { ReportFormAction } from './reportReducer';

// ==================== Dialog Actions ====================

/**
 * Open the update dialog for an item
 * Pre-populates form with current item data
 */
export const openDialog = (item: ItemModel): ReportFormAction => ({
  type: 'OPEN_DIALOG',
  payload: { item },
});

/**
 * Close the dialog and reset form state
 */
export const closeDialog = (): ReportFormAction => ({
  type: 'CLOSE_DIALOG',
});

/**
 * Set dialog visibility directly
 */
export const setDialogVisible = (visible: boolean): ReportFormAction => ({
  type: 'SET_DIALOG_VISIBLE',
  payload: visible,
});

// ==================== Form Field Actions ====================

/**
 * Update quantity input value
 */
export const setQuantityInput = (value: string): ReportFormAction => ({
  type: 'SET_QUANTITY_INPUT',
  payload: value,
});

/**
 * Update notes input value
 */
export const setNotesInput = (value: string): ReportFormAction => ({
  type: 'SET_NOTES_INPUT',
  payload: value,
});

/**
 * Increment or decrement quantity by amount
 * @param amount - Positive to increment, negative to decrement
 */
export const incrementQuantity = (amount: number): ReportFormAction => ({
  type: 'INCREMENT_QUANTITY',
  payload: amount,
});

// ==================== Warning Dialog Actions ====================

/**
 * Show exceeds planned quantity warning
 * @param pendingQuantity - The quantity that exceeds planned
 */
export const showExceedsWarning = (pendingQuantity: number): ReportFormAction => ({
  type: 'SHOW_EXCEEDS_WARNING',
  payload: pendingQuantity,
});

/**
 * Hide exceeds planned quantity warning
 */
export const hideExceedsWarning = (): ReportFormAction => ({
  type: 'HIDE_EXCEEDS_WARNING',
});

/**
 * Set exceeds warning visibility directly
 */
export const setShowExceedsWarning = (show: boolean): ReportFormAction => ({
  type: 'SET_SHOW_EXCEEDS_WARNING',
  payload: show,
});

// ==================== Reset Action ====================

/**
 * Reset entire form state to initial values
 */
export const resetForm = (): ReportFormAction => ({
  type: 'RESET_FORM',
});
