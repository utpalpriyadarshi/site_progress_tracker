/**
 * BOM Import Wizard Screen - v2.10 Phase 6A
 *
 * 5-Step Import Process:
 * Step 1: Upload File (Excel/CSV)
 * Step 2: Map Columns
 * Step 3: Validate Data
 * Step 4: Preview & Confirm
 * Step 5: Import
 */

import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  ProgressBar,
  Divider,
} from 'react-native-paper';
import { useManagerContext } from './context/ManagerContext';

type WizardStep = 1 | 2 | 3 | 4 | 5;

interface ImportData {
  fileName: string;
  fileSize: number;
  fileType: string;
  rawData: any[];
  mappedData: any[];
  validationErrors: ValidationError[];
}

interface ValidationError {
  row: number;
  column: string;
  message: string;
}

const BomImportWizardScreen = () => {
  const { projectId } = useManagerContext();
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [_importData, setImportData] = useState<ImportData>({
    fileName: '',
    fileSize: 0,
    fileType: '',
    rawData: [],
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

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep((prev) => (prev + 1) as WizardStep);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as WizardStep);
    }
  };

  const handleCancel = () => {
    // Reset wizard and navigate back
    setCurrentStep(1);
    setImportData({
      fileName: '',
      fileSize: 0,
      fileType: '',
      rawData: [],
      mappedData: [],
      validationErrors: [],
    });
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
                      <Paragraph style={styles.stepDescription}>
                        {step.description}
                      </Paragraph>
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

          <View style={styles.uploadContainer}>
            <View style={styles.dropZone}>
              <Paragraph style={styles.dropZoneText}>
                📁 Drag and drop your file here
              </Paragraph>
              <Paragraph style={styles.dropZoneSubtext}>or</Paragraph>
              <Button mode="contained" onPress={() => {}}>
                Browse Files
              </Button>
            </View>

            <View style={styles.infoBox}>
              <Paragraph style={styles.infoTitle}>Supported Formats:</Paragraph>
              <Paragraph style={styles.infoText}>• Excel (.xlsx, .xls)</Paragraph>
              <Paragraph style={styles.infoText}>• CSV (.csv)</Paragraph>
              <Paragraph style={styles.infoText}>• Maximum file size: 10MB</Paragraph>
            </View>

            <Divider style={styles.divider} />

            <View style={styles.templateSection}>
              <Paragraph style={styles.templateTitle}>
                Don't have a file ready?
              </Paragraph>
              <Button
                mode="outlined"
                onPress={() => {}}
                icon="download"
                style={styles.templateButton}
              >
                Download BOM Template
              </Button>
              <Paragraph style={styles.templateNote}>
                The template includes sample data and instructions
              </Paragraph>
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderStep2MapColumns = () => {
    return (
      <Card style={styles.contentCard}>
        <Card.Content>
          <Title style={styles.contentTitle}>Step 2: Map Columns</Title>
          <Paragraph style={styles.contentSubtitle}>
            Coming soon: Column mapping interface
          </Paragraph>
        </Card.Content>
      </Card>
    );
  };

  const renderStep3Validate = () => {
    return (
      <Card style={styles.contentCard}>
        <Card.Content>
          <Title style={styles.contentTitle}>Step 3: Validate Data</Title>
          <Paragraph style={styles.contentSubtitle}>
            Coming soon: Data validation
          </Paragraph>
        </Card.Content>
      </Card>
    );
  };

  const renderStep4Preview = () => {
    return (
      <Card style={styles.contentCard}>
        <Card.Content>
          <Title style={styles.contentTitle}>Step 4: Preview & Confirm</Title>
          <Paragraph style={styles.contentSubtitle}>
            Coming soon: Preview interface
          </Paragraph>
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
            Coming soon: Import execution
          </Paragraph>
        </Card.Content>
      </Card>
    );
  };

  const renderActions = () => {
    return (
      <View style={styles.actionsContainer}>
        <Button
          mode="outlined"
          onPress={handleCancel}
          style={styles.actionButton}
        >
          Cancel
        </Button>
        <View style={styles.actionButtonGroup}>
          {currentStep > 1 && (
            <Button
              mode="outlined"
              onPress={handleBack}
              style={styles.actionButton}
            >
              Back
            </Button>
          )}
          {currentStep < 5 ? (
            <Button
              mode="contained"
              onPress={handleNext}
              style={styles.actionButton}
            >
              Next
            </Button>
          ) : (
            <Button
              mode="contained"
              onPress={() => {}}
              style={styles.actionButton}
            >
              Finish
            </Button>
          )}
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
    marginBottom: 10,
  },
  dropZoneSubtext: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
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
  divider: {
    marginVertical: 20,
  },
  templateSection: {
    alignItems: 'center',
  },
  templateTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  templateButton: {
    marginBottom: 10,
  },
  templateNote: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
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
