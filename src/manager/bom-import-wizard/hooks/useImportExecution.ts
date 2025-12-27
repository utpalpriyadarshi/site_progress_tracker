/**
 * useImportExecution - Handles database import execution
 */

import { useState } from 'react';
import { Alert } from 'react-native';
import { database } from '../../../../models/database';
import { ImportData } from './useImportData';

export const useImportExecution = (
  projectId: string | null,
  importData: ImportData,
  onImportComplete: () => void
) => {
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);

  const executeImport = async () => {
    if (!projectId) {
      Alert.alert('Error', 'No project selected');
      return;
    }

    setImporting(true);
    setImportProgress(0);

    try {
      await database.write(async () => {
        const bomCollection = database.collections.get('boms');

        // Create a new BOM for this import
        const bom = await bomCollection.create((record: any) => {
          record.projectId = projectId;
          record.name = `Imported from ${importData.fileName}`;
          record.description = `Imported on ${new Date().toLocaleString()}`;
          record.status = 'draft';
          record.totalCost = importData.mappedData.reduce(
            (sum, item) => sum + (Number(item.totalCost) || 0),
            0
          );
          record.createdBy = 'manager'; // TODO: Use actual user ID
        });

        // Import BOM items
        const bomItemsCollection = database.collections.get('bom_items');
        const totalItems = importData.mappedData.length;

        for (let i = 0; i < totalItems; i++) {
          const item = importData.mappedData[i];

          await bomItemsCollection.create((record: any) => {
            record.bomId = bom.id;
            record.serialNumber = item.sn || `${i + 1}`;
            record.description = item.description;
            record.category = item.category;
            record.subCategory = item.subCategory || '';
            record.quantity = Number(item.quantity) || 0;
            record.unit = item.unit;
            record.unitCost = Number(item.unitCost) || 0;
            record.totalCost = Number(item.totalCost) || 0;
            record.phase = item.phase || '';
            record.doorsId = item.doorsId || '';
            record.notes = item.notes || '';
          });

          // Update progress
          setImportProgress(((i + 1) / totalItems) * 100);
        }
      });

      Alert.alert(
        'Import Complete',
        `Successfully imported ${importData.mappedData.length} items`,
        [
          {
            text: 'OK',
            onPress: onImportComplete,
          },
        ]
      );
    } catch (error) {
      Alert.alert('Import Failed', `Error: ${error}`);
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
