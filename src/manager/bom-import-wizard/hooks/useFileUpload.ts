/**
 * useFileUpload - Handles file upload and demo data loading
 */

import { Alert } from 'react-native';
import { autoDetectColumns } from '../../../utils/BomFileParser';
import { ImportData } from './useImportData';

export const useFileUpload = (
  importData: ImportData,
  setImportData: (data: ImportData) => void,
  showSnackbar: (message: string) => void
) => {
  const handleFilePicker = async () => {
    // NOTE: File picker temporarily disabled due to react-native-document-picker
    // incompatibility with React Native 0.81
    Alert.alert(
      'File Upload Not Available',
      'File picker is temporarily unavailable due to React Native version compatibility.\n\n' +
        'To enable file upload:\n' +
        '1. Upgrade React Native to 0.74+\n' +
        '2. Install @react-native-community/document-picker\n\n' +
        'For now, you can test with the demo below.',
      [
        { text: 'OK' },
        {
          text: 'Load Demo Data',
          onPress: () => loadDemoData(),
        },
      ]
    );
  };

  const loadDemoData = () => {
    const demoHeaders = [
      'S.N',
      'Description',
      'Category',
      'Quantity',
      'Unit',
      'Unit Cost',
      'Total Cost',
    ];
    const demoData = [
      {
        'S.N': '1',
        Description: 'Sample Item 1',
        Category: 'Electrical',
        Quantity: '10',
        Unit: 'pcs',
        'Unit Cost': '100',
        'Total Cost': '1000',
      },
      {
        'S.N': '2',
        Description: 'Sample Item 2',
        Category: 'Mechanical',
        Quantity: '5',
        Unit: 'units',
        'Unit Cost': '200',
        'Total Cost': '1000',
      },
    ];

    const autoMapping = autoDetectColumns(demoHeaders);

    setImportData({
      ...importData,
      fileName: 'demo_bom.csv',
      fileSize: 1024,
      fileType: 'csv',
      fileContent: '',
      headers: demoHeaders,
      rawData: demoData,
      columnMapping: autoMapping,
    });

    showSnackbar(`${demoData.length} sample rows loaded for testing`);
  };

  return {
    handleFilePicker,
    loadDemoData,
  };
};
