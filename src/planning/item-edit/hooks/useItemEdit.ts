/**
 * useItemEdit Hook
 *
 * Handles item data loading, saving, and state management
 */

import { useState, useEffect } from 'react';
import { database } from '../../../../models/database';
import ItemModel from '../../../../models/ItemModel';
import { logger } from '../../../services/LoggingService';

interface ItemUpdateData {
  name: string;
  categoryId: string;
  phase: string;
  plannedQuantity: number;
  completedQuantity: number;
  unitOfMeasurement: string;
  plannedStartDate: number;
  plannedEndDate: number;
  isMilestone: boolean;
  isCriticalPath: boolean;
  floatDays: number;
  dependencyRisk: 'low' | 'medium' | 'high' | '';
  riskNotes: string | null;
}

export const useItemEdit = (itemId: string | undefined) => {
  const [item, setItem] = useState<ItemModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load item data on mount
  useEffect(() => {
    const loadItem = async () => {
      if (!itemId) {
        logger.error('[useItemEdit] No item ID provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const loadedItem = await database.collections
          .get('items')
          .find(itemId) as ItemModel;

        setItem(loadedItem);
        setIsLocked(loadedItem.isBaselineLocked);
      } catch (error) {
        logger.error('[useItemEdit] Error loading item', error as Error);
        throw error;
      } finally {
        setLoading(false);
      }
    };

    loadItem();
  }, [itemId]);

  // Save/update item
  const saveItem = async (updateData: ItemUpdateData) => {
    if (!item) {
      throw new Error('No item to update');
    }

    setSaving(true);
    try {
      // Calculate status based on completed quantity
      const completedQty = updateData.completedQuantity || 0;
      const plannedQty = updateData.plannedQuantity;
      let itemStatus = 'not_started';

      if (completedQty >= plannedQty) {
        itemStatus = 'completed';
      } else if (completedQty > 0) {
        itemStatus = 'in_progress';
      }

      // Update database record
      await database.write(async () => {
        await item.update((i: any) => {
          // Basic fields
          i.name = updateData.name.trim();
          i.categoryId = updateData.categoryId;

          // Quantity and measurements
          i.plannedQuantity = plannedQty;
          i.completedQuantity = completedQty;
          i.unitOfMeasurement = updateData.unitOfMeasurement.trim() || 'Set';

          // Status (auto-calculated from progress)
          i.status = itemStatus;

          // Schedule
          i.plannedStartDate = updateData.plannedStartDate;
          i.plannedEndDate = updateData.plannedEndDate;

          // Planning fields (only update if not locked)
          if (!isLocked) {
            i.baselineStartDate = updateData.plannedStartDate;
            i.baselineEndDate = updateData.plannedEndDate;
          }

          // Phase and Milestone
          i.projectPhase = updateData.phase;
          i.isMilestone = updateData.isMilestone;

          // Critical Path and Risk
          i.isCriticalPath = updateData.isCriticalPath;
          i.floatDays = updateData.isCriticalPath ? 0 : updateData.floatDays;
          i.dependencyRisk = updateData.dependencyRisk;
          i.riskNotes = updateData.riskNotes;
        });
      });

      logger.info('[useItemEdit] Item updated successfully', { itemId: item.id });
    } catch (error) {
      logger.error('[useItemEdit] Error updating item', error as Error);
      throw error;
    } finally {
      setSaving(false);
    }
  };

  return {
    item,
    loading,
    isLocked,
    saving,
    saveItem,
  };
};
