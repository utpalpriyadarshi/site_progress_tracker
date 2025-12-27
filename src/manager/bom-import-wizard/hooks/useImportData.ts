/**
 * useImportData - Manages all import data state
 */

import { useState } from 'react';
import { ParsedBomRow } from '../../../utils/BomFileParser';

export interface ValidationError {
  row: number;
  column: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ImportData {
  fileName: string;
  fileSize: number;
  fileType: string;
  fileContent: string;
  headers: string[];
  rawData: any[];
  columnMapping: Record<string, string>;
  mappedData: ParsedBomRow[];
  validationErrors: ValidationError[];
}

const initialImportData: ImportData = {
  fileName: '',
  fileSize: 0,
  fileType: '',
  fileContent: '',
  headers: [],
  rawData: [],
  columnMapping: {},
  mappedData: [],
  validationErrors: [],
};

export const useImportData = () => {
  const [importData, setImportData] = useState<ImportData>(initialImportData);

  const resetImportData = () => {
    setImportData(initialImportData);
  };

  const updateImportData = (updates: Partial<ImportData>) => {
    setImportData(prev => ({ ...prev, ...updates }));
  };

  return {
    importData,
    setImportData,
    resetImportData,
    updateImportData,
  };
};
