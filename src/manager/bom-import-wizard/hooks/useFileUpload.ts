/**
 * useFileUpload - Handles file upload and demo data loading
 *
 * Uses RNFS to list CSV files from the Downloads folder.
 * No native document-picker module required.
 */

import { useState } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import RNFS from 'react-native-fs';
import { autoDetectColumns } from '../../../utils/BomFileParser';
import { ImportData } from './useImportData';

const requestStoragePermission = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') return true;
  // Android 13+ (API 33+) removed READ_EXTERNAL_STORAGE; Downloads are accessible without it
  if (Platform.Version >= 33) return true;
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
      {
        title: 'Storage Permission',
        message: 'App needs access to read CSV files from Downloads.',
        buttonPositive: 'Allow',
        buttonNegative: 'Deny',
      }
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch {
    return false;
  }
};

export const useFileUpload = (
  importData: ImportData,
  setImportData: (data: ImportData) => void,
  showSnackbar: (message: string) => void
) => {
  const [filePickerVisible, setFilePickerVisible] = useState(false);
  const [availableFiles, setAvailableFiles] = useState<RNFS.ReadDirItem[]>([]);

  const handleFilePicker = async () => {
    const hasPermission = await requestStoragePermission();
    if (!hasPermission) {
      showSnackbar('Storage permission denied. Please allow in Settings → App Permissions.');
      return;
    }

    // Try multiple possible Download paths
    const paths = [
      RNFS.DownloadDirectoryPath,
      RNFS.ExternalStorageDirectoryPath + '/Download',
      RNFS.ExternalStorageDirectoryPath + '/Downloads',
    ].filter((p, i, arr) => p && arr.indexOf(p) === i); // deduplicate

    let allFiles: RNFS.ReadDirItem[] = [];
    for (const dirPath of paths) {
      try {
        const items = await RNFS.readDir(dirPath);
        const csv = items.filter(f =>
          f.isFile() &&
          (f.name.toLowerCase().endsWith('.csv') || f.name.toLowerCase().endsWith('.txt'))
        );
        allFiles = allFiles.concat(csv);
      } catch {
        // path not accessible — try next
      }
    }

    if (allFiles.length === 0) {
      showSnackbar('No CSV files in Downloads. Export your BOM as CSV and copy it to Downloads.');
      return;
    }

    setAvailableFiles(allFiles);
    setFilePickerVisible(true);
  };

  const handleSelectFile = async (file: RNFS.ReadDirItem) => {
    setFilePickerVisible(false);
    try {
      const fileSizeMB = file.size / (1024 * 1024);
      if (fileSizeMB > 10) {
        showSnackbar('File too large. Maximum size is 10 MB.');
        return;
      }

      const content = await RNFS.readFile(file.path, 'utf8');
      const ext = file.name.split('.').pop()?.toLowerCase() || 'csv';

      // Parse CSV rows (handle both \r\n and \n)
      const lines = content.split(/\r?\n/).filter(l => l.trim());
      if (lines.length < 2) {
        showSnackbar('File has no data rows.');
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
      const rawData = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        const row: Record<string, string> = {};
        headers.forEach((h, i) => { row[h] = values[i] || ''; });
        return row;
      });

      const autoMapping = autoDetectColumns(headers);

      setImportData({
        ...importData,
        fileName: file.name,
        fileSize: file.size,
        fileType: ext,
        fileContent: content,
        headers,
        rawData,
        columnMapping: autoMapping,
      });

      showSnackbar(`${rawData.length} rows loaded from ${file.name}`);
    } catch {
      showSnackbar('Could not read file. Make sure it is a plain CSV.');
    }
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
    handleSelectFile,
    loadDemoData,
    filePickerVisible,
    setFilePickerVisible,
    availableFiles,
  };
};
