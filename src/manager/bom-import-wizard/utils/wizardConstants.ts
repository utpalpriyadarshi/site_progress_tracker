/**
 * BOM Import Wizard Constants
 */

export type WizardStep = 1 | 2 | 3 | 4 | 5;

export interface StepInfo {
  number: WizardStep;
  title: string;
  description: string;
}

export const WIZARD_STEPS: StepInfo[] = [
  { number: 1, title: 'Upload File', description: 'Select Excel/CSV file' },
  { number: 2, title: 'Map Columns', description: 'Match columns to fields' },
  { number: 3, title: 'Validate Data', description: 'Check for errors' },
  { number: 4, title: 'Preview', description: 'Review before import' },
  { number: 5, title: 'Import', description: 'Save to database' },
];

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const SUPPORTED_FILE_TYPES = {
  excel: ['.xlsx', '.xls'],
  csv: ['.csv'],
};

export const FILE_INFO = {
  formats: ['Excel (.xlsx, .xls)', 'CSV (.csv)'],
  maxSize: '10MB',
};
