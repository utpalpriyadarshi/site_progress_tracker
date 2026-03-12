/**
 * BomImportWizardScreen - 5-step import wizard for BOM data from CSV
 */

import React from 'react';
import { View, ScrollView, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Snackbar, Dialog, Portal, Text, Button, Divider } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useManagerContext } from '../context/ManagerContext';

import { useImportData } from './hooks/useImportData';
import { useFileUpload } from './hooks/useFileUpload';
import { useDataValidation } from './hooks/useDataValidation';
import { useImportExecution } from './hooks/useImportExecution';
import { useWizardNavigation } from './hooks/useWizardNavigation';

import { ProgressStepper } from './components/ProgressStepper';
import { WizardActions } from './components/WizardActions';
import { Step1UploadFile } from './components/Step1UploadFile';
import { Step2MapColumns } from './components/Step2MapColumns';
import { Step3Validate } from './components/Step3Validate';
import { Step4Preview } from './components/Step4Preview';
import { Step5Import } from './components/Step5Import';

export const BomImportWizardScreen: React.FC = () => {
  const navigation = useNavigation();
  const { projectId } = useManagerContext();

  const [snackbarVisible, setSnackbarVisible] = React.useState(false);
  const [snackbarMessage, setSnackbarMessage] = React.useState('');

  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  const { importData, setImportData, resetImportData } = useImportData();

  const {
    handleFilePicker,
    handleSelectFile,
    loadDemoData,
    filePickerVisible,
    setFilePickerVisible,
    availableFiles,
  } = useFileUpload(importData, setImportData, showSnackbar);

  const { validateMapping, validateData } = useDataValidation(importData, setImportData, showSnackbar);

  const handleImportComplete = () => {
    showSnackbar(`Successfully imported ${importData.mappedData.length} items`);
    setTimeout(() => navigation.goBack(), 1500);
  };

  const { importing, importProgress, executeImport } = useImportExecution(
    projectId,
    importData,
    handleImportComplete,
    showSnackbar
  );

  const { currentStep, handleNext, handleBack, handleCancel } = useWizardNavigation(
    importData,
    resetImportData,
    validateMapping,
    validateData,
    executeImport,
    showSnackbar
  );

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step1UploadFile
            fileName={importData.fileName}
            fileSize={importData.fileSize}
            rowCount={importData.rawData.length}
            onFilePicker={handleFilePicker}
          />
        );
      case 2:
        return <Step2MapColumns columnMapping={importData.columnMapping} />;
      case 3:
        return (
          <Step3Validate
            validationErrors={importData.validationErrors}
            rowCount={importData.rawData.length}
          />
        );
      case 4:
        return <Step4Preview mappedData={importData.mappedData} />;
      case 5:
        return (
          <Step5Import
            importing={importing}
            importProgress={importProgress}
            itemCount={importData.mappedData.length}
          />
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <ProgressStepper currentStep={currentStep} />
        {renderStep()}

        {/* Demo data hint on step 1 */}
        {currentStep === 1 && (
          <Button
            mode="text"
            icon="flask-outline"
            onPress={loadDemoData}
            style={styles.demoButton}
          >
            Load demo data instead
          </Button>
        )}
      </ScrollView>

      <WizardActions
        currentStep={currentStep}
        importing={importing}
        onCancel={handleCancel}
        onBack={handleBack}
        onNext={handleNext}
      />

      {/* File picker dialog — lists CSV files from Downloads */}
      <Portal>
        <Dialog
          visible={filePickerVisible}
          onDismiss={() => setFilePickerVisible(false)}
          style={styles.dialog}
        >
          <Dialog.Title>Select CSV file from Downloads</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodySmall" style={styles.dialogHint}>
              Place your BOM CSV file in the device Downloads folder, then select it below.
            </Text>
            <FlatList
              data={availableFiles}
              keyExtractor={item => item.path}
              ItemSeparatorComponent={() => <Divider />}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.fileItem}
                  onPress={() => handleSelectFile(item)}
                >
                  <Text variant="bodyMedium" style={styles.fileName}>{item.name}</Text>
                  <Text variant="bodySmall" style={styles.fileSize}>
                    {(item.size / 1024).toFixed(1)} KB
                  </Text>
                </TouchableOpacity>
              )}
              style={styles.fileList}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setFilePickerVisible(false)}>Cancel</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
      >
        {snackbarMessage}
      </Snackbar>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  demoButton: {
    marginHorizontal: 15,
    marginTop: 4,
  },
  dialog: {
    maxHeight: '80%',
  },
  dialogHint: {
    color: '#666',
    marginBottom: 12,
  },
  fileList: {
    maxHeight: 300,
  },
  fileItem: {
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  fileName: {
    fontWeight: '500',
  },
  fileSize: {
    color: '#888',
    marginTop: 2,
  },
});

export default BomImportWizardScreen;
