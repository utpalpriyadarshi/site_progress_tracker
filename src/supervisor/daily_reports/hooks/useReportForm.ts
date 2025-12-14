import { useReducer, useCallback } from 'react';
import { database } from '../../../../models/database';
import ItemModel from '../../../../models/ItemModel';
import { logger } from '../../../services/LoggingService';
import { validateProgressUpdate, exceedsPlannedQuantity, determineItemStatus } from '../utils';
import {
  reportFormReducer,
  initialReportFormState,
  openDialog as openDialogAction,
  closeDialog as closeDialogAction,
  setQuantityInput as setQuantityInputAction,
  setNotesInput as setNotesInputAction,
  incrementQuantity as incrementQuantityAction,
  showExceedsWarning as showExceedsWarningAction,
  hideExceedsWarning as hideExceedsWarningAction,
} from '../state';

interface UseReportFormParams {
  supervisorId: string;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
  onLoadPhotoCounts: () => Promise<void>;
  photos: string[];
  setPhotos: (photos: string[]) => void;
}

interface UseReportFormReturn {
  // Dialog state
  dialogVisible: boolean;
  setDialogVisible: (visible: boolean) => void;
  closeDialog: () => void;

  // Form fields
  selectedItem: ItemModel | null;
  quantityInput: string;
  setQuantityInput: (value: string) => void;
  notesInput: string;
  setNotesInput: (value: string) => void;

  // Warning dialogs
  showExceedsWarning: boolean;
  setShowExceedsWarning: (show: boolean) => void;
  pendingQuantity: number;

  // Actions
  openUpdateDialog: (item: ItemModel) => void;
  incrementQuantity: (amount: number) => void;
  handleUpdateProgress: () => Promise<void>;
  saveProgress: (newQuantity: number) => Promise<void>;
}

/**
 * useReportForm Hook (Refactored with useReducer)
 *
 * Manages form state for updating item progress
 * - Replaced 6 useState hooks with 1 useReducer
 * - Handles dialog visibility
 * - Manages form inputs (quantity, notes)
 * - Validates input
 * - Saves progress to database
 * - Creates progress logs
 *
 * @version 2.0 - Refactored with useReducer (Phase 2, Task 2.1)
 */
export const useReportForm = ({
  supervisorId,
  onSuccess,
  onError,
  onLoadPhotoCounts,
  photos,
  setPhotos,
}: UseReportFormParams): UseReportFormReturn => {
  // ==================== State Management with useReducer ====================
  const [state, dispatch] = useReducer(reportFormReducer, initialReportFormState);

  // ==================== Wrapper Functions for Dispatch ====================

  /**
   * Set dialog visibility
   */
  const setDialogVisible = useCallback((visible: boolean) => {
    dispatch({ type: 'SET_DIALOG_VISIBLE', payload: visible });
  }, []);

  /**
   * Set quantity input
   */
  const setQuantityInput = useCallback((value: string) => {
    dispatch(setQuantityInputAction(value));
  }, []);

  /**
   * Set notes input
   */
  const setNotesInput = useCallback((value: string) => {
    dispatch(setNotesInputAction(value));
  }, []);

  /**
   * Set show exceeds warning
   */
  const setShowExceedsWarning = useCallback((show: boolean) => {
    dispatch({ type: 'SET_SHOW_EXCEEDS_WARNING', payload: show });
  }, []);

  // ==================== Action Functions ====================

  /**
   * Open the update dialog for an item
   */
  const openUpdateDialog = useCallback(
    (item: ItemModel) => {
      dispatch(openDialogAction(item));
      setPhotos([]);
    },
    [setPhotos]
  );

  /**
   * Close the dialog and reset form
   */
  const closeDialog = useCallback(() => {
    dispatch(closeDialogAction());
    setPhotos([]);
  }, [setPhotos]);

  /**
   * Increment or decrement quantity
   */
  const incrementQuantity = useCallback((amount: number) => {
    dispatch(incrementQuantityAction(amount));
  }, []);

  /**
   * Save progress to database
   */
  const saveProgress = useCallback(
    async (newQuantity: number) => {
      if (!state.selectedItem) return;

      try {
        const plannedQty = state.selectedItem.plannedQuantity;

        await database.write(async () => {
          // Update item's completed quantity and status
          try {
            await state.selectedItem!.update((item: any) => {
              item.completedQuantity = newQuantity;
              item.status = determineItemStatus(newQuantity, plannedQty);
            });

            logger.debug('Item progress updated successfully', {
              component: 'useReportForm',
              action: 'updateProgress',
              itemId: state.selectedItem!.id,
            });
          } catch (updateError) {
            logger.error('Failed to update item progress', updateError as Error, {
              component: 'useReportForm',
              action: 'updateProgress',
              itemId: state.selectedItem!.id,
            });
            throw updateError;
          }

          // Create a progress log entry (pending until report is submitted)
          try {
            const photosJson = JSON.stringify(photos);

            await database.collections
              .get('progress_logs')
              .create((log: any) => {
                log.itemId = state.selectedItem!.id;
                log.date = new Date().getTime();
                log.completedQuantity = newQuantity;
                log.reportedBy = supervisorId;
                log.photos = photosJson;
                log.notes = state.form.notesInput || '';
                log.appSyncStatus = 'pending';
              });

            logger.debug('Progress log created successfully', {
              component: 'useReportForm',
              action: 'updateProgress',
              itemId: state.selectedItem!.id,
              photoCount: photos.length,
            });
          } catch (logError) {
            logger.error('Failed to create progress log', logError as Error, {
              component: 'useReportForm',
              action: 'updateProgress',
              itemId: state.selectedItem!.id,
            });
            throw logError;
          }
        });

        onSuccess(
          'Progress updated successfully. Click "Submit Progress Reports" to finalize your daily report'
        );

        // Reload photo counts to update the UI
        await onLoadPhotoCounts();

        closeDialog();
      } catch (error) {
        logger.error('Failed to update progress', error as Error, {
          component: 'useReportForm',
          action: 'updateProgress',
          itemId: state.selectedItem?.id,
        });
        onError('Failed to update progress: ' + (error as Error).message);
      }
    },
    [state.selectedItem, state.form.notesInput, supervisorId, photos, onSuccess, onError, onLoadPhotoCounts, closeDialog]
  );

  /**
   * Handle update progress button click
   * Validates input and shows warning if quantity exceeds planned
   */
  const handleUpdateProgress = useCallback(async () => {
    if (!state.selectedItem) return;

    // Validate form
    const error = validateProgressUpdate({
      quantity: state.form.quantityInput,
      item: state.selectedItem,
    });

    if (error) {
      onError(error);
      return;
    }

    const newQuantity = parseFloat(state.form.quantityInput) || 0;

    // Check if quantity exceeds planned
    if (exceedsPlannedQuantity(newQuantity, state.selectedItem.plannedQuantity)) {
      dispatch(showExceedsWarningAction(newQuantity));
    } else {
      await saveProgress(newQuantity);
    }
  }, [state.selectedItem, state.form.quantityInput, onError, saveProgress]);

  // ==================== Return Interface ====================

  return {
    // Dialog state
    dialogVisible: state.dialogVisible,
    setDialogVisible,
    closeDialog,

    // Form fields
    selectedItem: state.selectedItem,
    quantityInput: state.form.quantityInput,
    setQuantityInput,
    notesInput: state.form.notesInput,
    setNotesInput,

    // Warning dialogs
    showExceedsWarning: state.showExceedsWarning,
    setShowExceedsWarning,
    pendingQuantity: state.pendingQuantity,

    // Actions
    openUpdateDialog,
    incrementQuantity,
    handleUpdateProgress,
    saveProgress,
  };
};
