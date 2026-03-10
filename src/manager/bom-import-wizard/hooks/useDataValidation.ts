/**
 * useDataValidation - Validation logic for column mapping and data
 */

import {
  validateColumnMapping,
  getRequiredFields,
  ParsedBomRow,
} from '../../../utils/BomFileParser';
import { ImportData, ValidationError } from './useImportData';

export const useDataValidation = (
  importData: ImportData,
  setImportData: (data: ImportData) => void,
  showSnackbar: (message: string) => void
) => {
  const validateMapping = (): boolean => {
    const missing = validateColumnMapping(importData.columnMapping);
    if (missing.length > 0) {
      showSnackbar(`Please map the following required fields: ${missing.join(', ')}`);
      return false;
    }
    return true;
  };

  const validateData = (): boolean => {
    const errors: ValidationError[] = [];
    const mappedData: ParsedBomRow[] = [];

    importData.rawData.forEach((row, index) => {
      try {
        const mappedRow: any = {};

        // Map columns
        Object.keys(importData.columnMapping).forEach(field => {
          const column = importData.columnMapping[field];
          mappedRow[field] = row[column] || '';
        });

        // Validate required fields
        const requiredFields = getRequiredFields();
        requiredFields.forEach(field => {
          if (!mappedRow[field] || String(mappedRow[field]).trim() === '') {
            errors.push({
              row: index + 2, // +2 because index 0 = row 2 (after header)
              column: field,
              message: `${field} is required`,
              severity: 'error',
            });
          }
        });

        // Validate numbers
        if (mappedRow.quantity && isNaN(Number(mappedRow.quantity))) {
          errors.push({
            row: index + 2,
            column: 'quantity',
            message: 'Quantity must be a number',
            severity: 'error',
          });
        }

        if (mappedRow.unitCost && isNaN(Number(mappedRow.unitCost))) {
          errors.push({
            row: index + 2,
            column: 'unitCost',
            message: 'Unit Cost must be a number',
            severity: 'error',
          });
        }

        // Calculate total cost if not provided
        if (!mappedRow.totalCost && mappedRow.quantity && mappedRow.unitCost) {
          mappedRow.totalCost = Number(mappedRow.quantity) * Number(mappedRow.unitCost);
        }

        mappedData.push(mappedRow as ParsedBomRow);
      } catch (err) {
        errors.push({
          row: index + 2,
          column: 'general',
          message: `Error processing row: ${err}`,
          severity: 'error',
        });
      }
    });

    setImportData({
      ...importData,
      mappedData,
      validationErrors: errors,
    });

    return errors.filter(e => e.severity === 'error').length === 0;
  };

  return {
    validateMapping,
    validateData,
  };
};
