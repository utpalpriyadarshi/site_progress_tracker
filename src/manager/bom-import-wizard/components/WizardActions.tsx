/**
 * WizardActions - Navigation buttons for wizard
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';
import { WizardStep } from '../utils/wizardConstants';

interface WizardActionsProps {
  currentStep: WizardStep;
  importing: boolean;
  onCancel: () => void;
  onBack: () => void;
  onNext: () => void;
}

export const WizardActions: React.FC<WizardActionsProps> = ({
  currentStep,
  importing,
  onCancel,
  onBack,
  onNext,
}) => {
  return (
    <View style={styles.actionsContainer}>
      <Button mode="outlined" onPress={onCancel} style={styles.actionButton}>
        Cancel
      </Button>
      <View style={styles.actionButtonGroup}>
        {currentStep > 1 && (
          <Button mode="outlined" onPress={onBack} style={styles.actionButton}>
            Back
          </Button>
        )}
        <Button
          mode="contained"
          onPress={onNext}
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

const styles = StyleSheet.create({
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
