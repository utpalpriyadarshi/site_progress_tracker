/**
 * BOM Import Wizard Helper Functions
 */

import { WizardStep } from './wizardConstants';

export type StepStatus = 'completed' | 'active' | 'pending';

export const getStepStatus = (stepNumber: number, currentStep: WizardStep): StepStatus => {
  if (stepNumber < currentStep) return 'completed';
  if (stepNumber === currentStep) return 'active';
  return 'pending';
};

export const calculateProgress = (currentStep: WizardStep): number => {
  return currentStep / 5;
};
