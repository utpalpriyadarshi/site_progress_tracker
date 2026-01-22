/**
 * DashboardEmptyState Component
 *
 * Dashboard-specific empty state showing when no financial data exists.
 * Provides setup guidance and quick actions to get started.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAccessibility } from '../../../utils/accessibility';

interface SetupStep {
  icon: string;
  title: string;
  description: string;
  completed: boolean;
  onPress?: () => void;
}

export interface DashboardEmptyStateProps {
  onCreateBudget?: () => void;
  onAddCost?: () => void;
  onCreateInvoice?: () => void;
  hasBudgets?: boolean;
  hasCosts?: boolean;
  hasInvoices?: boolean;
}

export const DashboardEmptyState: React.FC<DashboardEmptyStateProps> = ({
  onCreateBudget,
  onAddCost,
  onCreateInvoice,
  hasBudgets = false,
  hasCosts = false,
  hasInvoices = false,
}) => {
  const { announce } = useAccessibility();

  // Calculate setup progress
  const setupSteps: SetupStep[] = [
    {
      icon: '📋',
      title: 'Create a budget',
      description: 'Set up your project budget to track spending',
      completed: hasBudgets,
      onPress: onCreateBudget,
    },
    {
      icon: '💵',
      title: 'Record costs',
      description: 'Add costs to track expenses against your budget',
      completed: hasCosts,
      onPress: onAddCost,
    },
    {
      icon: '🧾',
      title: 'Manage invoices',
      description: 'Create and track invoices for your project',
      completed: hasInvoices,
      onPress: onCreateInvoice,
    },
  ];

  const completedSteps = setupSteps.filter((s) => s.completed).length;
  const progress = Math.round((completedSteps / setupSteps.length) * 100);
  const isSetupComplete = completedSteps === setupSteps.length;

  // Announce setup state
  React.useEffect(() => {
    if (isSetupComplete) {
      announce('Dashboard setup complete. Your financial data will appear here.');
    } else {
      announce(
        `Dashboard setup ${progress}% complete. ${setupSteps.length - completedSteps} ${
          setupSteps.length - completedSteps === 1 ? 'step' : 'steps'
        } remaining.`
      );
    }
  }, [progress, completedSteps, setupSteps.length, isSetupComplete, announce]);

  if (isSetupComplete) {
    return (
      <View style={styles.container} accessibilityRole="text">
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>📊</Text>
        </View>
        <Text style={styles.title}>No data to display yet</Text>
        <Text style={styles.description}>
          Your dashboard will populate with financial insights once you have more transaction data.
        </Text>
      </View>
    );
  }

  return (
    <View
      style={styles.container}
      accessibilityRole="text"
      accessibilityLabel={`Dashboard setup ${progress}% complete`}
    >
      {/* Welcome Header */}
      <View style={styles.headerContainer}>
        <Text style={styles.welcomeIcon}>👋</Text>
        <Text style={styles.title}>Welcome to Commercial Dashboard</Text>
        <Text style={styles.subtitle}>
          Complete the setup steps below to start tracking your project finances
        </Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Setup Progress</Text>
          <Text style={styles.progressValue}>{progress}%</Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressHint}>
          {completedSteps} of {setupSteps.length} steps completed
        </Text>
      </View>

      {/* Setup Steps */}
      <View style={styles.stepsContainer}>
        {setupSteps.map((step, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.stepCard, step.completed && styles.stepCardCompleted]}
            onPress={step.onPress}
            disabled={step.completed || !step.onPress}
            accessibilityRole="button"
            accessibilityLabel={`${step.title}${step.completed ? ', completed' : ''}`}
            accessibilityHint={step.completed ? undefined : `Tap to ${step.title.toLowerCase()}`}
            accessibilityState={{ disabled: step.completed }}
          >
            <View style={styles.stepIconContainer}>
              <Text style={styles.stepIcon}>
                {step.completed ? '✓' : step.icon}
              </Text>
            </View>
            <View style={styles.stepContent}>
              <Text
                style={[styles.stepTitle, step.completed && styles.stepTitleCompleted]}
              >
                {step.title}
              </Text>
              <Text style={styles.stepDescription}>{step.description}</Text>
            </View>
            {!step.completed && step.onPress && (
              <View style={styles.stepArrow}>
                <Text style={styles.stepArrowText}>→</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Quick Tips */}
      <View style={styles.tipsContainer}>
        <Text style={styles.tipsTitle}>Quick Tips</Text>
        <View style={styles.tipItem}>
          <Text style={styles.tipIcon}>💡</Text>
          <Text style={styles.tipText}>
            Start with creating a budget to set spending limits for your project
          </Text>
        </View>
        <View style={styles.tipItem}>
          <Text style={styles.tipIcon}>📈</Text>
          <Text style={styles.tipText}>
            The dashboard will show real-time KPIs once you have financial data
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e8f4fd',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  icon: {
    fontSize: 36,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  welcomeIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  description: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 300,
    alignSelf: 'center',
  },
  progressContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  progressValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1976D2',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4caf50',
    borderRadius: 4,
  },
  progressHint: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  stepsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  stepCardCompleted: {
    backgroundColor: '#f1f8e9',
    borderColor: '#c5e1a5',
  },
  stepIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#e3f2fd',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepIcon: {
    fontSize: 20,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  stepTitleCompleted: {
    color: '#4caf50',
  },
  stepDescription: {
    fontSize: 13,
    color: '#666',
  },
  stepArrow: {
    paddingLeft: 8,
  },
  stepArrowText: {
    fontSize: 18,
    color: '#1976D2',
  },
  tipsContainer: {
    backgroundColor: '#fff8e1',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  tipItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  tipIcon: {
    fontSize: 14,
    marginRight: 8,
    width: 20,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
});

export default DashboardEmptyState;
