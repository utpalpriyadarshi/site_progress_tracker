/**
 * useWizardNavigation - Manages wizard step navigation
 */

import { useState } from 'react';
import { Alert } from 'react-native'; // kept for Cancel Import confirmation
import { WizardStep } from '../utils/wizardConstants';
import { ImportData } from './useImportData';

export const useWizardNavigation = (
  importData: ImportData,
  resetImportData: () => void,
  validateMapping: () => boolean,
  validateData: () => boolean,
  executeImport: () => void,
  showSnackbar: (message: string) => void
) => {
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);

  const handleNext = () => {
    // Step 1: Check if file is uploaded
    if (currentStep === 1) {
      if (!importData.fileName) {
        showSnackbar('Please upload a file first');
        return;
      }
    }
    // Step 2: Validate column mapping
    else if (currentStep === 2) {
      if (!validateMapping()) {
        return;
      }
    }
    // Step 3: Validate data
    else if (currentStep === 3) {
      if (!validateData()) {
        showSnackbar(`Found ${importData.validationErrors.length} errors. Please review and fix them.`);
        return;
      }
    }

    // Move to next step or execute import
    if (currentStep < 5) {
      setCurrentStep(prev => (prev + 1) as WizardStep);
    } else {
      executeImport();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => (prev - 1) as WizardStep);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Import',
      'Are you sure you want to cancel? All progress will be lost.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          onPress: () => {
            setCurrentStep(1);
            resetImportData();
          },
        },
      ]
    );
  };

  return {
    currentStep,
    setCurrentStep,
    handleNext,
    handleBack,
    handleCancel,
  };
};
