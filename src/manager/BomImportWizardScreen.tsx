/**
 * BOM Import Wizard Screen - v2.10 Phase 6B - REFACTORED
 *
 * 5-Step Import Process:
 * Step 1: Upload File (Excel/CSV) ✅
 * Step 2: Map Columns ✅
 * Step 3: Validate Data ✅
 * Step 4: Preview & Confirm ✅
 * Step 5: Import ✅
 */

import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Title, Paragraph, Snackbar } from 'react-native-paper';
import { useSnackbar } from '../hooks/useSnackbar';
import { useManagerContext } from './context/ManagerContext';
import { ErrorBoundary } from '../components/common/ErrorBoundary';

// Import all components and hooks
import {
  ProgressStepper,
  Step1UploadFile,
  Step2MapColumns,
  Step3Validate,
  Step4Preview,
  Step5Import,
  WizardActions,
} from './bom-import-wizard/components';

import { useImportData } from './bom-import-wizard/hooks/useImportData';
import { useFileUpload } from './bom-import-wizard/hooks/useFileUpload';
import { useDataValidation } from './bom-import-wizard/hooks/useDataValidation';
import { useImportExecution } from './bom-import-wizard/hooks/useImportExecution';
import { useWizardNavigation } from './bom-import-wizard/hooks/useWizardNavigation';

const BomImportWizardScreen = () => {
  const { projectId } = useManagerContext();
  const { show: showSnackbar, snackbarProps } = useSnackbar();

  // Initialize all hooks
  const { importData, setImportData, resetImportData } = useImportData();

  const { handleFilePicker } = useFileUpload(importData, setImportData, showSnackbar);

  const { validateMapping, validateData } = useDataValidation(importData, setImportData, showSnackbar);

  const { importing, importProgress, executeImport } = useImportExecution(
    projectId,
    importData,
    () => {
      // Reset wizard after successful import
      resetImportData();
      setCurrentStep(1);
    },
    showSnackbar
  );

  const { currentStep, setCurrentStep, handleNext, handleBack, handleCancel } =
    useWizardNavigation(
      importData,
      resetImportData,
      validateMapping,
      validateData,
      executeImport,
      showSnackbar
    );

  // Render appropriate step content based on current step
  const renderStepContent = () => {
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

  // Handle no project selected case
  if (!projectId) {
    return (
      <View style={styles.emptyContainer}>
        <Paragraph style={styles.emptyText}>No project assigned</Paragraph>
      </View>
    );
  }

  return (
    <>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Title style={styles.headerTitle}>BOM Import Wizard</Title>
          <Paragraph style={styles.headerSubtitle}>
            Import Bill of Materials from Excel or CSV files
          </Paragraph>
        </View>

        <ProgressStepper currentStep={currentStep} />

        {renderStepContent()}

        <WizardActions
          currentStep={currentStep}
          importing={importing}
          onCancel={handleCancel}
          onBack={handleBack}
          onNext={handleNext}
        />
      </ScrollView>
      <Snackbar {...snackbarProps} duration={3000} />
    </>
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
});

// Wrap with ErrorBoundary for graceful error handling
const BomImportWizardScreenWithBoundary = () => (
  <ErrorBoundary name="BomImportWizardScreen">
    <BomImportWizardScreen />
  </ErrorBoundary>
);

export default BomImportWizardScreenWithBoundary;
