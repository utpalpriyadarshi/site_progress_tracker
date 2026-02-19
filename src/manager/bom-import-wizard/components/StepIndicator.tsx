/**
 * StepIndicator - Single step circle with title and description
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Paragraph } from 'react-native-paper';
import { StepStatus } from '../utils/wizardHelpers';
import { COLORS } from '../../../theme/colors';

interface StepIndicatorProps {
  stepNumber: number;
  title: string;
  description: string;
  status: StepStatus;
  showConnector?: boolean;
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({
  stepNumber,
  title,
  description,
  status,
  showConnector = false,
}) => {
  return (
    <View style={styles.stepWrapper}>
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
            {status === 'completed' ? '✓' : stepNumber}
          </Paragraph>
        </View>
        <View style={styles.stepText}>
          <Paragraph
            style={[
              styles.stepTitle,
              status === 'active' && styles.stepTitleActive,
            ]}
          >
            {title}
          </Paragraph>
          <Paragraph style={styles.stepDescription}>{description}</Paragraph>
        </View>
      </View>
      {showConnector && (
        <View
          style={[
            styles.stepConnector,
            status === 'completed' && styles.stepConnectorCompleted,
          ]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
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
    backgroundColor: COLORS.SUCCESS,
  },
  stepCircleActive: {
    backgroundColor: COLORS.INFO,
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
    color: COLORS.INFO,
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
    backgroundColor: COLORS.SUCCESS,
  },
});
