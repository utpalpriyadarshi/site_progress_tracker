/**
 * useImportExecution - Handles database import execution
 */

import { useState } from 'react';
import { database } from '../../../../models/database';
import { ImportData } from './useImportData';
import { useAuth } from '../../../auth/AuthContext';

export const useImportExecution = (
  projectId: string | null,
  importData: ImportData,
  onImportComplete: () => void,
  showSnackbar: (message: string) => void
) => {
  const { user } = useAuth();
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);

  const executeImport = async () => {
    if (!projectId) {
      showSnackbar('No project selected');
      return;
    }

    setImporting(true);
    setImportProgress(0);

    try {
      await database.write(async () => {
        const bomCollection = database.collections.get('boms');

        const now = Date.now();
        const totalEstimated = importData.mappedData.reduce(
          (sum, item) => sum + (Number(item.totalCost) || 0),
          0
        );

        // Create a new BOM for this import
        const bom = await bomCollection.create((record: any) => {
          record.projectId = projectId;
          record.name = `Imported from ${importData.fileName}`;
          record.description = `Imported on ${new Date().toLocaleString()}`;
          record.type = 'estimating';
          record.status = 'draft';
          record.version = 'v1.0';
          record.siteCategory = 'General';
          record.quantity = 1;
          record.unit = 'lot';
          record.contingency = 5;
          record.profitMargin = 10;
          record.totalEstimatedCost = totalEstimated;
          record.totalActualCost = 0;
          record.createdBy = user?.userId || '';
          record.createdDate = now;
          record.updatedDate = now;
          record.appSyncStatus = 'pending';
          record._version = 1;
        });

        // Import BOM items
        const bomItemsCollection = database.collections.get('bom_items');
        const totalItems = importData.mappedData.length;

        for (let i = 0; i < totalItems; i++) {
          const item = importData.mappedData[i];

          const categoryPrefix = (item.category || 'mat').substring(0, 3).toUpperCase();
          const itemCode = `${categoryPrefix}-${String(i + 1).padStart(3, '0')}`;
          await bomItemsCollection.create((record: any) => {
            record.bomId = bom.id;
            record.itemCode = itemCode;
            record.description = item.description || `Item ${i + 1}`;
            record.category = item.category || 'material';
            record.subCategory = item.subCategory || '';
            record.quantity = Number(item.quantity) || 0;
            record.unit = item.unit || 'nos';
            record.unitCost = Number(item.unitCost) || 0;
            record.totalCost = Number(item.totalCost) || (Number(item.quantity) || 0) * (Number(item.unitCost) || 0);
            record.wbsCode = '';
            record.phase = item.phase || '';
            record.notes = item.notes || '';
            record.createdDate = now;
            record.updatedDate = now;
            record.appSyncStatus = 'pending';
            record._version = 1;
          });

          // Update progress
          setImportProgress(((i + 1) / totalItems) * 100);
        }
      });

      showSnackbar(`Successfully imported ${importData.mappedData.length} items`);
      onImportComplete();
    } catch (error) {
      showSnackbar(`Import failed: ${error}`);
    } finally {
      setImporting(false);
      setImportProgress(0);
    }
  };

  return {
    importing,
    importProgress,
    executeImport,
  };
};
