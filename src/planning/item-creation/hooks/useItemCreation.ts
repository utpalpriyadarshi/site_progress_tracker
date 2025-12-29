import { useState } from 'react';
import { database } from '../../../../models/database';
import { WBSCodeGenerator } from '../../../../services/planning/WBSCodeGenerator';
import { logger } from '../../../services/LoggingService';
import { FormData } from './useItemForm';

interface UseItemCreationProps {
  siteId: string;
  generatedWbsCode: string;
  formData: FormData;
  validateForm: () => boolean;
  onSuccess: () => void;
  onError: (message: string) => void;
}

export const useItemCreation = ({
  siteId,
  generatedWbsCode,
  formData,
  validateForm,
  onSuccess,
  onError,
}: UseItemCreationProps) => {
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // Calculate planned dates
      const plannedStartDate = formData.startDate.getTime();
      const plannedEndDate = formData.endDate.getTime();

      // Calculate WBS level from code
      const wbsLevel = WBSCodeGenerator.calculateLevel(generatedWbsCode);

      // Calculate status based on completed quantity
      const completedQty = parseFloat(formData.completedQuantity) || 0;
      const plannedQty = parseFloat(formData.quantity);
      let itemStatus = 'not_started';

      if (completedQty >= plannedQty) {
        itemStatus = 'completed';
      } else if (completedQty > 0) {
        itemStatus = 'in_progress';
      }

      // Save to database
      await database.write(async () => {
        await database.collections.get('items').create((item: any) => {
          // Basic fields
          item.name = formData.name.trim();
          item.categoryId = formData.categoryId;
          item.siteId = siteId;

          // Quantity and measurements
          item.plannedQuantity = plannedQty;
          item.completedQuantity = completedQty;
          item.unitOfMeasurement = formData.unit.trim() || 'Set';

          // Schedule
          item.plannedStartDate = plannedStartDate;
          item.plannedEndDate = plannedEndDate;
          item.status = itemStatus; // Auto-calculated from progress
          item.weightage = parseFloat(formData.weightage) || 0;

          // Planning fields
          item.baselineStartDate = plannedStartDate;
          item.baselineEndDate = plannedEndDate;
          item.isBaselineLocked = false;
          item.dependencies = JSON.stringify([]); // Empty dependencies for now

          // WBS Structure
          item.wbsCode = generatedWbsCode;
          item.wbsLevel = wbsLevel;
          item.parentWbsCode = formData.parentWbsCode || null;

          // Phase and Milestone
          item.projectPhase = formData.phase;
          item.isMilestone = formData.isMilestone;
          item.createdByRole = 'planner';

          // Critical Path and Risk
          item.isCriticalPath = formData.isCriticalPath;
          item.floatDays = formData.isCriticalPath ? 0 : (parseFloat(formData.floatDays) || 0);
          item.dependencyRisk = formData.dependencyRisk;
          item.riskNotes = formData.riskNotes.trim() || null;
        });
      });

      // Success
      onSuccess();
    } catch (error) {
      logger.error('[ItemCreation] Error saving item', error as Error);
      onError('Failed to create item. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    handleSave,
  };
};
