/**
 * BOM Import Wizard Screen - v2.10 Phase 6B - COMPLETE
 *
 * 5-Step Import Process:
 * Step 1: Upload File (Excel/CSV) ✅
 * Step 2: Map Columns ✅
 * Step 3: Validate Data ✅
 * Step 4: Preview & Confirm ✅
 * Step 5: Import ✅
 */

import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  ProgressBar,
  Divider,
  DataTable,
  Chip,
} from 'react-native-paper';
import DocumentPicker from 'react-native-document-picker';
import RNFS from 'react-native-fs';
import { useManagerContext } from './context/ManagerContext';
import {
  parseCSV,
  parseExcel,
  validateFileType,
  validateFileSize,
  formatFileSize,
  autoDetectColumns,
  validateColumnMapping,
  getRequiredFields,
  ParsedBomRow,
} from '../utils/BomFileParser';
import { database } from '../../models/database';

type WizardStep = 1 | 2 | 3 | 4 | 5;

interface ImportData {
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

interface ValidationError {
  row: number;
  column: string;
  message: string;
  severity: 'error' | 'warning';
}

const BomImportWizardScreen = () => {
  const { projectId } = useManagerContext();
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importData, setImportData] = useState<ImportData>({
    fileName: '',
    fileSize: 0,
    fileType: '',
    fileContent: '',
    headers: [],
    rawData: [],
    columnMapping: {},
    mappedData: [],
    validationErrors: [],
  });

  const steps = [
    { number: 1, title: 'Upload File', description: 'Select Excel/CSV file' },
    { number: 2, title: 'Map Columns', description: 'Match columns to fields' },
    { number: 3, title: 'Validate Data', description: 'Check for errors' },
    { number: 4, title: 'Preview', description: 'Review before import' },
    { number: 5, title: 'Import', description: 'Save to database' },
  ];

  const getStepStatus = (stepNumber: number) => {
    if (stepNumber < currentStep) return 'completed';
    if (stepNumber === currentStep) return 'active';
    return 'pending';
  };

  // Step 1: File Upload
  const handleFilePicker = async () => {
    try {
      const result = await DocumentPicker.pick({
        type: [DocumentPicker.types.allFiles],
      });

      const file = result[0];
      const fileName = file.name || '';
      const fileSize = file.size || 0;
      const fileType = fileName.split('.').pop()?.toLowerCase() || '';

      // Validate file type
      if (!validateFileType(fileName)) {
        Alert.alert('Invalid File', 'Please select an Excel (.xlsx, .xls) or CSV (.csv) file');
        return;
      }

      // Validate file size
      if (!validateFileSize(fileSize)) {
        Alert.alert('File Too Large', 'Maximum file size is 10MB');
        return;
      }

      // Read file content
      const fileContent = await RNFS.readFile(file.uri, 'base64');

      // Parse file
      let parseResult;
      if (fileType === 'csv') {
        const csvContent = await RNFS.readFile(file.uri, 'utf8');
        parseResult = parseCSV(csvContent);
      } else {
        parseResult = await parseExcel(fileContent);
      }

      if (!parseResult.success) {
        Alert.alert('Parse Error', parseResult.errors.join('\n'));
        return;
      }

      // Auto-detect column mapping
      const autoMapping = autoDetectColumns(parseResult.headers);

      setImportData({
        ...importData,
        fileName,
        fileSize,
        fileType,
        fileContent,
        headers: parseResult.headers,
        rawData: parseResult.data,
        columnMapping: autoMapping,
      });

      Alert.alert('Success', `File uploaded: ${fileName}\n${parseResult.rowCount} rows found`);
    } catch (err: any) {
      if (!DocumentPicker.isCancel(err)) {
        Alert.alert('Error', `Failed to pick file: ${err.message}`);
      }
    }
  };

  // Step 2: Validate column mapping
  const validateMapping = () => {
    const missing = validateColumnMapping(importData.columnMapping);
    if (missing.length > 0) {
      Alert.alert(
        'Missing Required Columns',
        `Please map the following required fields:\n${missing.join(', ')}`
      );
      return false;
    }
    return true;
  };

  // Step 3: Validate data
  const validateData = () => {
    const errors: ValidationError[] = [];
    const mappedData: ParsedBomRow[] = [];

    importData.rawData.forEach((row, index) => {
      try {
        const mappedRow: any = {};

        // Map columns
        Object.keys(importData.columnMapping).forEach((field) => {
          const column = importData.columnMapping[field];
          mappedRow[field] = row[column] || '';
        });

        // Validate required fields
        const requiredFields = getRequiredFields();
        requiredFields.forEach((field) => {
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

    return errors.filter((e) => e.severity === 'error').length === 0;
  };

  // Step 5: Import to database
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
            onPress: () => {
              // Reset wizard
              setCurrentStep(1);
              setImportData({
                fileName: '',
                fileSize: 0,
                fileType: '',
                fileContent: '',
                headers: [],
                rawData: [],
                columnMapping: {},
                mappedData: [],
                validationErrors: [],
              });
            },
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

  const handleNext = () => {
    if (currentStep === 1) {
      if (!importData.fileName) {
        Alert.alert('No File', 'Please upload a file first');
        return;
      }
    } else if (currentStep === 2) {
      if (!validateMapping()) {
        return;
      }
    } else if (currentStep === 3) {
      if (!validateData()) {
        Alert.alert(
          'Validation Errors',
          `Found ${importData.validationErrors.length} errors. Please review and fix them.`
        );
        return;
      }
    }

    if (currentStep < 5) {
      setCurrentStep((prev) => (prev + 1) as WizardStep);
    } else {
      executeImport();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as WizardStep);
    }
  };

  const handleCancel = () => {
    Alert.alert('Cancel Import', 'Are you sure you want to cancel? All progress will be lost.', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes',
        onPress: () => {
          setCurrentStep(1);
          setImportData({
            fileName: '',
            fileSize: 0,
            fileType: '',
            fileContent: '',
            headers: [],
            rawData: [],
            columnMapping: {},
            mappedData: [],
            validationErrors: [],
          });
        },
      },
    ]);
  };

  const renderStepper = () => {
    return (
      <Card style={styles.stepperCard}>
        <Card.Content>
          <View style={styles.stepperContainer}>
            {steps.map((step, index) => {
              const status = getStepStatus(step.number);
              return (
                <View key={step.number} style={styles.stepWrapper}>
                  <View style={styles.stepItem}>
                    <View
                      style={[
                        styles.stepCircle,
                        status === 'completed' && styles.stepCircleCompleted,
                        status === 'active' && styles.stepCircleActive,
                      ]}
                    >
                      <Paragraph
                        style={[
                          styles.stepNumber,
                          status === 'completed' && styles.stepNumberCompleted,
                          status === 'active' && styles.stepNumberActive,
                        ]}
                      >
                        {status === 'completed' ? '✓' : step.number}
                      </Paragraph>
                    </View>
                    <View style={styles.stepText}>
                      <Paragraph
                        style={[
                          styles.stepTitle,
                          status === 'active' && styles.stepTitleActive,
                        ]}
                      >
                        {step.title}
                      </Paragraph>
                      <Paragraph style={styles.stepDescription}>{step.description}</Paragraph>
                    </View>
                  </View>
                  {index < steps.length - 1 && (
                    <View
                      style={[
                        styles.stepConnector,
                        status === 'completed' && styles.stepConnectorCompleted,
                      ]}
                    />
                  )}
                </View>
              );
            })}
          </View>
          <ProgressBar
            progress={currentStep / 5}
            color="#2196F3"
            style={styles.progressBar}
          />
        </Card.Content>
      </Card>
    );
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderStep1UploadFile();
      case 2:
        return renderStep2MapColumns();
      case 3:
        return renderStep3Validate();
      case 4:
        return renderStep4Preview();
      case 5:
        return renderStep5Import();
      default:
        return null;
    }
  };

  const renderStep1UploadFile = () => {
    return (
      <Card style={styles.contentCard}>
        <Card.Content>
          <Title style={styles.contentTitle}>Step 1: Upload File</Title>
          <Paragraph style={styles.contentSubtitle}>
            Select an Excel (.xlsx, .xls) or CSV file containing your BOM data
          </Paragraph>

          {!importData.fileName ? (
            <View style={styles.uploadContainer}>
              <View style={styles.dropZone}>
                <Paragraph style={styles.dropZoneText}>📁 Select your BOM file</Paragraph>
                <Button mode="contained" onPress={handleFilePicker} style={styles.browseButton}>
                  Browse Files
                </Button>
              </View>

              <View style={styles.infoBox}>
                <Paragraph style={styles.infoTitle}>Supported Formats:</Paragraph>
                <Paragraph style={styles.infoText}>• Excel (.xlsx, .xls)</Paragraph>
                <Paragraph style={styles.infoText}>• CSV (.csv)</Paragraph>
                <Paragraph style={styles.infoText}>• Maximum file size: 10MB</Paragraph>
              </View>
            </View>
          ) : (
            <View style={styles.fileInfoContainer}>
              <Chip icon="check-circle" style={styles.successChip}>
                File Uploaded
              </Chip>
              <View style={styles.fileDetails}>
                <Paragraph style={styles.fileDetailLabel}>File Name:</Paragraph>
                <Paragraph style={styles.fileDetailValue}>{importData.fileName}</Paragraph>
              </View>
              <View style={styles.fileDetails}>
                <Paragraph style={styles.fileDetailLabel}>File Size:</Paragraph>
                <Paragraph style={styles.fileDetailValue}>
                  {formatFileSize(importData.fileSize)}
                </Paragraph>
              </View>
              <View style={styles.fileDetails}>
                <Paragraph style={styles.fileDetailLabel}>Rows Found:</Paragraph>
                <Paragraph style={styles.fileDetailValue}>{importData.rawData.length}</Paragraph>
              </View>
              <Button mode="outlined" onPress={handleFilePicker} style={styles.changeFileButton}>
                Change File
              </Button>
            </View>
          )}
        </Card.Content>
      </Card>
    );
  };

  const renderStep2MapColumns = () => {
    const requiredFields = getRequiredFields();

    return (
      <Card style={styles.contentCard}>
        <Card.Content>
          <Title style={styles.contentTitle}>Step 2: Map Columns</Title>
          <Paragraph style={styles.contentSubtitle}>
            Auto-detected column mapping (modify if needed)
          </Paragraph>

          <View style={styles.mappingContainer}>
            <Paragraph style={styles.mappingNote}>
              ✓ {Object.keys(importData.columnMapping).length} columns auto-mapped
            </Paragraph>
            <Paragraph style={styles.mappingNote}>
              Required fields: {requiredFields.join(', ')}
            </Paragraph>

            <Divider style={styles.divider} />

            <DataTable>
              <DataTable.Header>
                <DataTable.Title>BOM Field</DataTable.Title>
                <DataTable.Title>Excel Column</DataTable.Title>
                <DataTable.Title>Required</DataTable.Title>
              </DataTable.Header>

              {Object.keys(importData.columnMapping).map((field) => (
                <DataTable.Row key={field}>
                  <DataTable.Cell>{field}</DataTable.Cell>
                  <DataTable.Cell>{importData.columnMapping[field]}</DataTable.Cell>
                  <DataTable.Cell>
                    {requiredFields.includes(field) ? '✓' : ''}
                  </DataTable.Cell>
                </DataTable.Row>
              ))}
            </DataTable>
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderStep3Validate = () => {
    const errorCount = importData.validationErrors.filter((e) => e.severity === 'error').length;
    const warningCount = importData.validationErrors.filter((e) => e.severity === 'warning')
      .length;

    return (
      <Card style={styles.contentCard}>
        <Card.Content>
          <Title style={styles.contentTitle}>Step 3: Validate Data</Title>
          <Paragraph style={styles.contentSubtitle}>
            Checking {importData.rawData.length} rows for errors
          </Paragraph>

          <View style={styles.validationSummary}>
            {errorCount === 0 ? (
              <Chip icon="check-circle" style={styles.validChip}>
                No Errors Found
              </Chip>
            ) : (
              <Chip icon="alert-circle" style={styles.errorChip}>
                {errorCount} Errors Found
              </Chip>
            )}

            {warningCount > 0 && (
              <Chip icon="alert" style={styles.warningChip}>
                {warningCount} Warnings
              </Chip>
            )}
          </View>

          {importData.validationErrors.length > 0 && (
            <View style={styles.errorList}>
              <Paragraph style={styles.errorListTitle}>Validation Issues:</Paragraph>
              <ScrollView style={styles.errorScroll}>
                {importData.validationErrors.slice(0, 20).map((error, index) => (
                  <View key={index} style={styles.errorItem}>
                    <Paragraph style={styles.errorText}>
                      Row {error.row}: {error.column} - {error.message}
                    </Paragraph>
                  </View>
                ))}
                {importData.validationErrors.length > 20 && (
                  <Paragraph style={styles.errorMore}>
                    ...and {importData.validationErrors.length - 20} more
                  </Paragraph>
                )}
              </ScrollView>
            </View>
          )}
        </Card.Content>
      </Card>
    );
  };

  const renderStep4Preview = () => {
    const totalCost = importData.mappedData.reduce(
      (sum, item) => sum + (Number(item.totalCost) || 0),
      0
    );

    return (
      <Card style={styles.contentCard}>
        <Card.Content>
          <Title style={styles.contentTitle}>Step 4: Preview & Confirm</Title>
          <Paragraph style={styles.contentSubtitle}>
            Review the data before importing
          </Paragraph>

          <View style={styles.previewSummary}>
            <View style={styles.summaryItem}>
              <Paragraph style={styles.summaryLabel}>Total Items:</Paragraph>
              <Paragraph style={styles.summaryValue}>{importData.mappedData.length}</Paragraph>
            </View>
            <View style={styles.summaryItem}>
              <Paragraph style={styles.summaryLabel}>Total Cost:</Paragraph>
              <Paragraph style={styles.summaryValue}>${totalCost.toLocaleString()}</Paragraph>
            </View>
          </View>

          <Divider style={styles.divider} />

          <Paragraph style={styles.previewTitle}>First 10 Items:</Paragraph>
          <ScrollView horizontal style={styles.previewTable}>
            <DataTable>
              <DataTable.Header>
                <DataTable.Title style={styles.tableCell}>Description</DataTable.Title>
                <DataTable.Title style={styles.tableCell}>Category</DataTable.Title>
                <DataTable.Title style={styles.tableCell}>Quantity</DataTable.Title>
                <DataTable.Title style={styles.tableCell}>Unit</DataTable.Title>
                <DataTable.Title style={styles.tableCell}>Unit Cost</DataTable.Title>
                <DataTable.Title style={styles.tableCell}>Total Cost</DataTable.Title>
              </DataTable.Header>

              {importData.mappedData.slice(0, 10).map((item, index) => (
                <DataTable.Row key={index}>
                  <DataTable.Cell style={styles.tableCell}>{item.description}</DataTable.Cell>
                  <DataTable.Cell style={styles.tableCell}>{item.category}</DataTable.Cell>
                  <DataTable.Cell style={styles.tableCell}>{item.quantity}</DataTable.Cell>
                  <DataTable.Cell style={styles.tableCell}>{item.unit}</DataTable.Cell>
                  <DataTable.Cell style={styles.tableCell}>${item.unitCost}</DataTable.Cell>
                  <DataTable.Cell style={styles.tableCell}>${item.totalCost}</DataTable.Cell>
                </DataTable.Row>
              ))}
            </DataTable>
          </ScrollView>

          {importData.mappedData.length > 10 && (
            <Paragraph style={styles.previewMore}>
              ...and {importData.mappedData.length - 10} more items
            </Paragraph>
          )}
        </Card.Content>
      </Card>
    );
  };

  const renderStep5Import = () => {
    return (
      <Card style={styles.contentCard}>
        <Card.Content>
          <Title style={styles.contentTitle}>Step 5: Import</Title>
          <Paragraph style={styles.contentSubtitle}>
            {importing ? 'Importing data to database...' : 'Ready to import'}
          </Paragraph>

          {importing && (
            <View style={styles.importProgress}>
              <ProgressBar progress={importProgress / 100} color="#4CAF50" />
              <Paragraph style={styles.progressText}>{Math.round(importProgress)}%</Paragraph>
            </View>
          )}

          {!importing && (
            <View style={styles.importReady}>
              <Paragraph style={styles.readyText}>
                ✓ {importData.mappedData.length} items ready to import
              </Paragraph>
              <Paragraph style={styles.readyNote}>
                Click "Finish" to start the import process
              </Paragraph>
            </View>
          )}
        </Card.Content>
      </Card>
    );
  };

  const renderActions = () => {
    return (
      <View style={styles.actionsContainer}>
        <Button mode="outlined" onPress={handleCancel} style={styles.actionButton}>
          Cancel
        </Button>
        <View style={styles.actionButtonGroup}>
          {currentStep > 1 && (
            <Button mode="outlined" onPress={handleBack} style={styles.actionButton}>
              Back
            </Button>
          )}
          <Button
            mode="contained"
            onPress={handleNext}
            style={styles.actionButton}
            loading={importing}
            disabled={importing}
          >
            {currentStep < 5 ? 'Next' : 'Finish'}
          </Button>
        </View>
      </View>
    );
  };

  if (!projectId) {
    return (
      <View style={styles.emptyContainer}>
        <Paragraph style={styles.emptyText}>No project assigned</Paragraph>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Title style={styles.headerTitle}>BOM Import Wizard</Title>
        <Paragraph style={styles.headerSubtitle}>
          Import Bill of Materials from Excel or CSV files
        </Paragraph>
      </View>

      {renderStepper()}
      {renderStepContent()}
      {renderActions()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  stepperCard: {
    margin: 15,
    marginBottom: 10,
  },
  stepperContainer: {
    marginBottom: 15,
  },
  stepWrapper: {
    marginBottom: 10,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  stepCircleCompleted: {
    backgroundColor: '#4CAF50',
  },
  stepCircleActive: {
    backgroundColor: '#2196F3',
  },
  stepNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  stepNumberCompleted: {
    color: '#fff',
  },
  stepNumberActive: {
    color: '#fff',
  },
  stepText: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  stepTitleActive: {
    fontWeight: 'bold',
    color: '#2196F3',
  },
  stepDescription: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  stepConnector: {
    width: 2,
    height: 20,
    backgroundColor: '#E0E0E0',
    marginLeft: 19,
    marginTop: 5,
    marginBottom: 5,
  },
  stepConnectorCompleted: {
    backgroundColor: '#4CAF50',
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
  contentCard: {
    margin: 15,
    marginTop: 10,
  },
  contentTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  contentSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  uploadContainer: {
    marginTop: 10,
  },
  dropZone: {
    borderWidth: 2,
    borderColor: '#2196F3',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 40,
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
  },
  dropZoneText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 15,
  },
  browseButton: {
    marginTop: 10,
  },
  infoBox: {
    backgroundColor: '#FFF3E0',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  infoText: {
    fontSize: 13,
    color: '#666',
    marginVertical: 2,
  },
  fileInfoContainer: {
    padding: 15,
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
  },
  successChip: {
    backgroundColor: '#4CAF50',
    alignSelf: 'flex-start',
    marginBottom: 15,
  },
  fileDetails: {
    flexDirection: 'row',
    marginVertical: 5,
  },
  fileDetailLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginRight: 10,
    width: 100,
  },
  fileDetailValue: {
    fontSize: 14,
    color: '#666',
  },
  changeFileButton: {
    marginTop: 15,
  },
  mappingContainer: {
    marginTop: 10,
  },
  mappingNote: {
    fontSize: 13,
    color: '#666',
    marginVertical: 3,
  },
  divider: {
    marginVertical: 15,
  },
  validationSummary: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 15,
  },
  validChip: {
    backgroundColor: '#4CAF50',
    marginRight: 10,
    marginBottom: 10,
  },
  errorChip: {
    backgroundColor: '#F44336',
    marginRight: 10,
    marginBottom: 10,
  },
  warningChip: {
    backgroundColor: '#FFC107',
    marginRight: 10,
    marginBottom: 10,
  },
  errorList: {
    marginTop: 10,
  },
  errorListTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  errorScroll: {
    maxHeight: 200,
  },
  errorItem: {
    padding: 10,
    backgroundColor: '#FFEBEE',
    borderRadius: 4,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 13,
    color: '#C62828',
  },
  errorMore: {
    fontSize: 13,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 10,
  },
  previewSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 15,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  previewTable: {
    marginBottom: 15,
  },
  tableCell: {
    minWidth: 120,
  },
  previewMore: {
    fontSize: 13,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 10,
  },
  importProgress: {
    marginVertical: 20,
  },
  progressText: {
    textAlign: 'center',
    marginTop: 10,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  importReady: {
    padding: 20,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    alignItems: 'center',
  },
  readyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 10,
  },
  readyNote: {
    fontSize: 14,
    color: '#666',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    paddingTop: 10,
    paddingBottom: 30,
  },
  actionButtonGroup: {
    flexDirection: 'row',
  },
  actionButton: {
    marginHorizontal: 5,
  },
});

export default BomImportWizardScreen;
