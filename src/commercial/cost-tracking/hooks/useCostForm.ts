import { useState } from 'react';
import { Alert, Platform } from 'react-native';
import { database } from '../../../models/database';
import { logger } from '../../services/LoggingService';
import { Cost } from './useCostData';

export const useCostForm = (userId: string | undefined, projectId: string | null, onSuccess: () => void) => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingCost, setEditingCost] = useState<Cost | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Form state
  const [formCategory, setFormCategory] = useState('labor');
  const [formAmount, setFormAmount] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPoId, setFormPoId] = useState('');
  const [formCostDate, setFormCostDate] = useState<Date>(new Date());

  const resetForm = () => {
    setFormCategory('labor');
    setFormAmount('');
    setFormDescription('');
    setFormPoId('');
    setFormCostDate(new Date());
  };

  const handleCreateCost = async () => {
    if (!formDescription.trim()) {
      Alert.alert('Validation Error', 'Please enter a description');
      return;
    }

    const amount = parseFloat(formAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid amount');
      return;
    }

    try {
      const costsCollection = database.collections.get('costs');

      await database.write(async () => {
        await costsCollection.create((record: any) => {
          record.projectId = projectId;
          record.poId = formPoId.trim() || null;
          record.category = formCategory;
          record.amount = amount;
          record.description = formDescription.trim();
          record.costDate = formCostDate.getTime();
          record.createdBy = userId || '';
          record.appSyncStatus = 'pending';
          record.version = 1;
        });
      });

      Alert.alert('Success', 'Cost entry created successfully');
      setShowCreateDialog(false);
      resetForm();
      onSuccess();
    } catch (error) {
      logger.error('[Cost] Error creating cost:', error);
      Alert.alert('Error', 'Failed to create cost entry');
    }
  };

  const handleEditCost = async () => {
    if (!editingCost || !formDescription.trim()) {
      Alert.alert('Validation Error', 'Please enter a description');
      return;
    }

    const amount = parseFloat(formAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid amount');
      return;
    }

    try {
      const costsCollection = database.collections.get('costs');
      const costRecord = await costsCollection.find(editingCost.id);

      await database.write(async () => {
        await costRecord.update((record: any) => {
          record.poId = formPoId.trim() || null;
          record.category = formCategory;
          record.amount = amount;
          record.description = formDescription.trim();
          record.costDate = formCostDate.getTime();
          record.appSyncStatus = 'pending';
        });
      });

      Alert.alert('Success', 'Cost entry updated successfully');
      setShowEditDialog(false);
      setEditingCost(null);
      resetForm();
      onSuccess();
    } catch (error) {
      logger.error('[Cost] Error updating cost:', error);
      Alert.alert('Error', 'Failed to update cost entry');
    }
  };

  const handleDeleteCost = (cost: Cost) => {
    Alert.alert(
      'Delete Cost',
      `Are you sure you want to delete this cost entry?\n\n${cost.category.toUpperCase()}: ${cost.description}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const costsCollection = database.collections.get('costs');
              const costRecord = await costsCollection.find(cost.id);

              await database.write(async () => {
                await costRecord.markAsDeleted();
              });

              Alert.alert('Success', 'Cost entry deleted successfully');
              onSuccess();
            } catch (error) {
              logger.error('[Cost] Error deleting cost:', error);
              Alert.alert('Error', 'Failed to delete cost entry');
            }
          },
        },
      ]
    );
  };

  const openEditDialog = (cost: Cost) => {
    setEditingCost(cost);
    setFormCategory(cost.category);
    setFormAmount(cost.amount.toString());
    setFormDescription(cost.description);
    setFormPoId(cost.poId || '');
    setFormCostDate(new Date(cost.costDate));
    setShowEditDialog(true);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setFormCostDate(selectedDate);
    }
  };

  return {
    showCreateDialog,
    setShowCreateDialog,
    showEditDialog,
    setShowEditDialog,
    editingCost,
    showDatePicker,
    setShowDatePicker,
    formCategory,
    setFormCategory,
    formAmount,
    setFormAmount,
    formDescription,
    setFormDescription,
    formPoId,
    setFormPoId,
    formCostDate,
    resetForm,
    handleCreateCost,
    handleEditCost,
    handleDeleteCost,
    openEditDialog,
    handleDateChange,
  };
};
