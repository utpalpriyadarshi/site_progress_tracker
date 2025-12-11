import { useState, useCallback } from 'react';
import { database } from '../../../../models/database';
import ItemModel from '../../../../models/ItemModel';
import { logger } from '../../../services/LoggingService';
import { validateProgressUpdate, exceedsPlannedQuantity, determineItemStatus } from '../utils';

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
 * useReportForm Hook
 *
 * Manages form state for updating item progress
 * - Handles dialog visibility
 * - Manages form inputs (quantity, notes)
 * - Validates input
 * - Saves progress to database
 * - Creates progress logs
 */
export const useReportForm = ({
  supervisorId,
  onSuccess,
  onError,
  onLoadPhotoCounts,
  photos,
  setPhotos,
}: UseReportFormParams): UseReportFormReturn => {
  const [dialogVisible, setDialogVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ItemModel | null>(null);
  const [quantityInput, setQuantityInput] = useState('');
  const [notesInput, setNotesInput] = useState('');
  const [showExceedsWarning, setShowExceedsWarning] = useState(false);
  const [pendingQuantity, setPendingQuantity] = useState(0);

  /**
   * Open the update dialog for an item
   */
  const openUpdateDialog = useCallback((item: ItemModel) => {
    setSelectedItem(item);
    setQuantityInput(item.completedQuantity.toString());
    setNotesInput('');
    setPhotos([]);
    setDialogVisible(true);
  }, [setPhotos]);

  /**
   * Close the dialog and reset form
   */
  const closeDialog = useCallback(() => {
    setDialogVisible(false);
    setSelectedItem(null);
    setQuantityInput('');
    setNotesInput('');
    setPhotos([]);
  }, [setPhotos]);

  /**
   * Increment or decrement quantity
   */
  const incrementQuantity = useCallback((amount: number) => {
    setQuantityInput(prev => {
      const currentValue = parseFloat(prev) || 0;
      const newValue = Math.max(0, currentValue + amount);
      return newValue.toString();
    });
  }, []);

  /**
   * Save progress to database
   */
  const saveProgress = useCallback(async (newQuantity: number) => {
    if (!selectedItem) return;

    try {
      const plannedQty = selectedItem.plannedQuantity;

      await database.write(async () => {
        // Update item's completed quantity and status
        try {
          await selectedItem.update((item: any) => {
            item.completedQuantity = newQuantity;
            item.status = determineItemStatus(newQuantity, plannedQty);
          });

          logger.debug('Item progress updated successfully', {
            component: 'useReportForm',
            action: 'updateProgress',
            itemId: selectedItem.id,
          });
        } catch (updateError) {
          logger.error('Failed to update item progress', updateError as Error, {
            component: 'useReportForm',
            action: 'updateProgress',
            itemId: selectedItem.id,
          });
          throw updateError;
        }

        // Create a progress log entry (pending until report is submitted)
        try {
          const photosJson = JSON.stringify(photos);

          await database.collections
            .get('progress_logs')
            .create((log: any) => {
              log.itemId = selectedItem.id;
              log.date = new Date().getTime();
              log.completedQuantity = newQuantity;
              log.reportedBy = supervisorId;
              log.photos = photosJson;
              log.notes = notesInput || '';
              log.appSyncStatus = 'pending';
            });

          logger.debug('Progress log created successfully', {
            component: 'useReportForm',
            action: 'updateProgress',
            itemId: selectedItem.id,
            photoCount: photos.length,
          });
        } catch (logError) {
          logger.error('Failed to create progress log', logError as Error, {
            component: 'useReportForm',
            action: 'updateProgress',
            itemId: selectedItem.id,
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
        itemId: selectedItem?.id,
      });
      onError('Failed to update progress: ' + (error as Error).message);
    }
  }, [selectedItem, supervisorId, photos, notesInput, onSuccess, onError, onLoadPhotoCounts, closeDialog]);

  /**
   * Handle update progress button click
   * Validates input and shows warning if quantity exceeds planned
   */
  const handleUpdateProgress = useCallback(async () => {
    if (!selectedItem) return;

    // Validate form
    const error = validateProgressUpdate({
      quantity: quantityInput,
      item: selectedItem,
    });

    if (error) {
      onError(error);
      return;
    }

    const newQuantity = parseFloat(quantityInput) || 0;

    // Check if quantity exceeds planned
    if (exceedsPlannedQuantity(newQuantity, selectedItem.plannedQuantity)) {
      setPendingQuantity(newQuantity);
      setShowExceedsWarning(true);
    } else {
      await saveProgress(newQuantity);
    }
  }, [selectedItem, quantityInput, onError, saveProgress]);

  return {
    // Dialog state
    dialogVisible,
    setDialogVisible,
    closeDialog,

    // Form fields
    selectedItem,
    quantityInput,
    setQuantityInput,
    notesInput,
    setNotesInput,

    // Warning dialogs
    showExceedsWarning,
    setShowExceedsWarning,
    pendingQuantity,

    // Actions
    openUpdateDialog,
    incrementQuantity,
    handleUpdateProgress,
    saveProgress,
  };
};
