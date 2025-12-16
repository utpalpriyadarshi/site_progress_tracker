import { useState } from 'react';
import { database } from '../../../../models/database';
import HindranceModel from '../../../../models/HindranceModel';
import { logger } from '../../../services/LoggingService';
import { HindranceWithDetails, HindrancePriority, HindranceStatus, HindranceFormData } from '../types';
import { validateHindranceForm, canAddHindrance } from '../utils';
import { parsePhotos } from '../utils';

interface UseHindranceFormProps {
  supervisorId: string;
  selectedSiteId: string | null;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
  onLoadHindrances: () => Promise<void>;
  photos: string[];
  setPhotos: (photos: string[]) => void;
}

export const useHindranceForm = ({
  supervisorId,
  selectedSiteId,
  onSuccess,
  onError,
  onLoadHindrances,
  photos,
  setPhotos,
}: UseHindranceFormProps) => {
  const [dialogVisible, setDialogVisible] = useState(false);
  const [editingHindrance, setEditingHindrance] = useState<HindranceModel | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [hindranceToDelete, setHindranceToDelete] = useState<HindranceModel | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<HindrancePriority>('medium');
  const [status, setStatus] = useState<HindranceStatus>('open');
  const [selectedItemId, setSelectedItemId] = useState<string>('');

  // Reset form to initial state
  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPriority('medium');
    setStatus('open');
    setSelectedItemId('');
    setPhotos([]);
    setEditingHindrance(null);
  };

  // Handle adding new hindrance
  const handleAdd = () => {
    if (!canAddHindrance(selectedSiteId)) {
      onError('Please select a specific site to add a hindrance');
      return;
    }

    setEditingHindrance(null);
    resetForm();
    setDialogVisible(true);
  };

  // Handle editing existing hindrance
  const handleEdit = (hindranceWithDetails: HindranceWithDetails) => {
    const { hindrance } = hindranceWithDetails;
    setEditingHindrance(hindrance);
    setTitle(hindrance.title);
    setDescription(hindrance.description);
    setPriority(hindrance.priority as HindrancePriority);
    setStatus(hindrance.status as HindranceStatus);
    setSelectedItemId(hindrance.itemId || '');

    // Load photos
    const photosArray = parsePhotos(hindrance.photos);
    setPhotos(photosArray);

    setDialogVisible(true);
  };

  // Handle saving hindrance (create or update)
  const handleSave = async () => {
    const validation = validateHindranceForm(title, selectedSiteId);

    if (!validation.isValid) {
      setDialogVisible(false);
      onError(validation.errorMessage);
      return;
    }

    setIsSaving(true);
    try {
      let savedHindrance: HindranceModel | null = null;

      await database.write(async () => {
        if (editingHindrance) {
          // Update existing
          await editingHindrance.update((h) => {
            h.title = title;
            h.description = description;
            h.priority = priority;
            h.status = status;
            h.itemId = selectedItemId || '';
            h.photos = JSON.stringify(photos);
            h.appSyncStatus = 'pending'; // Mark as pending when edited
          });
          savedHindrance = editingHindrance;
        } else {
          // Create new
          const hindrancesCollection = database.collections.get<HindranceModel>('hindrances');
          savedHindrance = await hindrancesCollection.create((h) => {
            h.title = title;
            h.description = description;
            h.siteId = selectedSiteId!;
            h.itemId = selectedItemId || '';
            h.priority = priority;
            h.status = status;
            h.assignedTo = ''; // Default empty, can be assigned later
            h.reportedBy = supervisorId;
            h.reportedAt = new Date().getTime();
            h.photos = JSON.stringify(photos);
            h.appSyncStatus = 'pending';
          });
        }
      });

      onSuccess(editingHindrance ? 'Hindrance updated successfully' : 'Hindrance created successfully');
      setDialogVisible(false);
      resetForm();
      await onLoadHindrances();

      // Simulate sync to server after 2 seconds
      if (savedHindrance) {
        const hindranceId = (savedHindrance as HindranceModel).id;
        setTimeout(async () => {
          try {
            const hindrancesCollection = database.collections.get<HindranceModel>('hindrances');
            const hindrance = await hindrancesCollection.find(hindranceId);

            await database.write(async () => {
              await hindrance.update((h) => {
                h.appSyncStatus = 'synced';
              });
            });

            logger.info('Hindrance synced successfully', {
              component: 'useHindranceForm',
              action: 'handleSave',
              hindranceId,
            });
            // Reload to show updated sync status
            await onLoadHindrances();
          } catch (error) {
            logger.error('Failed to update sync status', error as Error, {
              component: 'useHindranceForm',
              action: 'handleSave',
              hindranceId,
            });
          }
        }, 2000);
      }
    } catch (error) {
      logger.error('Failed to save hindrance', error as Error, {
        component: 'useHindranceForm',
        action: 'handleSave',
        description,
      });
      onError('Failed to save hindrance');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle delete button click
  const handleDelete = (hindrance: HindranceModel) => {
    setHindranceToDelete(hindrance);
    setShowDeleteDialog(true);
  };

  // Confirm and execute delete
  const confirmDelete = async () => {
    if (!hindranceToDelete) return;

    setShowDeleteDialog(false);
    setIsSaving(true);
    try {
      await database.write(async () => {
        await hindranceToDelete.markAsDeleted();
      });
      onSuccess('Hindrance deleted successfully');
      await onLoadHindrances();
      setHindranceToDelete(null);
    } catch (error) {
      logger.error('Failed to delete hindrance', error as Error, {
        component: 'useHindranceForm',
        action: 'confirmDelete',
        hindranceId: hindranceToDelete?.id,
      });
      onError('Failed to delete hindrance');
    } finally {
      setIsSaving(false);
    }
  };

  // Cancel delete
  const cancelDelete = () => {
    setShowDeleteDialog(false);
    setHindranceToDelete(null);
  };

  // Close dialog
  const closeDialog = () => {
    setDialogVisible(false);
  };

  // Get form data
  const formData: HindranceFormData = {
    title,
    description,
    priority,
    status,
    selectedItemId,
    photos,
  };

  return {
    // Dialog state
    dialogVisible,
    setDialogVisible,
    closeDialog,

    // Delete state
    showDeleteDialog,
    hindranceToDelete,

    // Form state
    formData,
    title,
    setTitle,
    description,
    setDescription,
    priority,
    setPriority,
    status,
    setStatus,
    selectedItemId,
    setSelectedItemId,
    editingHindrance,

    // Loading state
    isSaving,

    // Actions
    handleAdd,
    handleEdit,
    handleSave,
    handleDelete,
    confirmDelete,
    cancelDelete,
    resetForm,
  };
};
