/**
 * TutorialModal Component
 *
 * Full-screen modal overlay for step-by-step tutorials.
 * Shows a card with step indicator, icon, title, description,
 * progress dots, and navigation buttons.
 *
 * @version 1.0.0
 * @since v2.13 - App Tutorial & Demo Data
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  Dimensions,
} from 'react-native';
import { Text, Button, useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { TutorialStep } from './plannerTutorialSteps';
import { COLORS } from '../theme/colors';

// Note: react-native-vector-icons does not render reliably inside React Native
// Modal on Android. We use emoji Text as the primary icon in the circle, and
// keep <Icon> only for the hint row (outside the Modal circle) where it works.

interface TutorialModalProps {
  visible: boolean;
  steps: TutorialStep[];
  initialStep?: number;
  onDismiss: () => void;
  onComplete: () => void;
  onStepChange?: (step: number) => void;
}

const TutorialModal: React.FC<TutorialModalProps> = ({
  visible,
  steps,
  initialStep = 0,
  onDismiss,
  onComplete,
  onStepChange,
}) => {
  const theme = useTheme();
  const [currentStepIndex, setCurrentStepIndex] = useState(initialStep);
  // Reset step when modal becomes visible
  useEffect(() => {
    if (visible) {
      setCurrentStepIndex(initialStep);
    }
  }, [visible, initialStep]);

  const totalSteps = steps.length;
  const currentStep = steps[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === totalSteps - 1;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
      return;
    }
    const nextIndex = currentStepIndex + 1;
    setCurrentStepIndex(nextIndex);
    onStepChange?.(nextIndex);
  };

  const handleBack = () => {
    if (isFirstStep) return;
    const prevIndex = currentStepIndex - 1;
    setCurrentStepIndex(prevIndex);
    onStepChange?.(prevIndex);
  };

  if (!currentStep) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <View>
            {/* Step Indicator */}
            <Text style={[styles.stepIndicator, { color: theme.colors.primary }]}>
              Step {currentStepIndex + 1} of {totalSteps}
            </Text>

            {/* Icon */}
            <View style={styles.iconContainer}>
              <View style={[styles.iconCircle, { backgroundColor: theme.colors.primary + '15' }]}>
                <Text style={styles.emojiIcon}>{currentStep.emoji}</Text>
              </View>
            </View>

            {/* Title */}
            <Text style={styles.title}>{currentStep.title}</Text>

            {/* Description */}
            <Text style={styles.description}>{currentStep.description}</Text>

            {/* Screen Hint */}
            {currentStep.actionHint && (
              <View style={styles.hintContainer}>
                <Icon name="lightbulb-outline" size={16} color={COLORS.WARNING} />
                <Text style={styles.hintText}>{currentStep.actionHint}</Text>
              </View>
            )}
          </View>

          {/* Progress Dots */}
          <View style={styles.dotsContainer}>
            {steps.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  {
                    backgroundColor:
                      index === currentStepIndex
                        ? theme.colors.primary
                        : index < currentStepIndex
                        ? theme.colors.primary + '80'
                        : '#D0D0D0',
                  },
                  index === currentStepIndex && styles.dotActive,
                ]}
              />
            ))}
          </View>

          {/* Buttons */}
          <View style={styles.buttonRow}>
            <Button
              mode="text"
              onPress={onDismiss}
              textColor="#999"
              compact
            >
              Skip Tutorial
            </Button>

            <View style={styles.navButtons}>
              {!isFirstStep && (
                <Button
                  mode="outlined"
                  onPress={handleBack}
                  style={styles.backButton}
                  compact
                >
                  Back
                </Button>
              )}
              <Button
                mode="contained"
                onPress={handleNext}
                style={styles.nextButton}
              >
                {isLastStep ? 'Got it!' : 'Next'}
              </Button>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const { width: screenWidth } = Dimensions.get('window');
const cardWidth = Math.min(screenWidth - 48, 400);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: cardWidth,
    borderRadius: 16,
    padding: 24,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  stepIndicator: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiIcon: {
    fontSize: 44,
    textAlign: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
    color: '#212121',
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    color: '#555',
    marginBottom: 8,
  },
  hintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FFF8E1',
    borderRadius: 8,
  },
  hintText: {
    fontSize: 13,
    color: '#F57C00',
    marginLeft: 6,
    fontWeight: '500',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 3,
  },
  dotActive: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backButton: {
    borderColor: '#CCC',
  },
  nextButton: {
    minWidth: 80,
  },
});

export default TutorialModal;
