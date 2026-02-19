/**
 * ProgressStepper - Full stepper with progress bar
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, ProgressBar } from 'react-native-paper';
import { StepIndicator } from './StepIndicator';
import { WIZARD_STEPS, WizardStep } from '../utils/wizardConstants';
import { getStepStatus, calculateProgress } from '../utils/wizardHelpers';
import { COLORS } from '../../../theme/colors';

interface ProgressStepperProps {
  currentStep: WizardStep;
}

export const ProgressStepper: React.FC<ProgressStepperProps> = ({ currentStep }) => {
  return (
    <Card style={styles.stepperCard}>
      <Card.Content>
        <View style={styles.stepperContainer}>
          {WIZARD_STEPS.map((step, index) => (
            <StepIndicator
              key={step.number}
              stepNumber={step.number}
              title={step.title}
              description={step.description}
              status={getStepStatus(step.number, currentStep)}
              showConnector={index < WIZARD_STEPS.length - 1}
            />
          ))}
        </View>
        <ProgressBar
          progress={calculateProgress(currentStep)}
          color={COLORS.INFO}
          style={styles.progressBar}
        />
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  stepperCard: {
    margin: 15,
    marginBottom: 10,
  },
  stepperContainer: {
    marginBottom: 15,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
});
