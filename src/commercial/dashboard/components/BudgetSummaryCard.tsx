import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card, Divider, ProgressBar } from 'react-native-paper';
import { BudgetSummary } from '../utils';

interface BudgetSummaryCardProps {
  budgetSummary: BudgetSummary;
}

export const BudgetSummaryCard: React.FC<BudgetSummaryCardProps> = ({ budgetSummary }) => {
  return (
    <Card style={styles.card}>
      <Card.Content>
        <Text style={styles.sectionTitle}>Budget Summary</Text>
        <View style={styles.budgetSummaryContainer}>
          <View style={styles.budgetRow}>
            <Text style={styles.budgetLabel}>Total Budget:</Text>
            <Text style={styles.budgetValue}>${budgetSummary.totalBudget.toLocaleString()}</Text>
          </View>
          <View style={styles.budgetRow}>
            <Text style={styles.budgetLabel}>Total Spent:</Text>
            <Text style={styles.budgetValue}>${budgetSummary.totalSpent.toLocaleString()}</Text>
          </View>
          <Divider style={styles.divider} />
          <View style={styles.budgetRow}>
            <Text style={styles.budgetLabelBold}>Remaining:</Text>
            <Text
              style={[
                styles.budgetValueBold,
                budgetSummary.remaining < 0 && styles.negativeValue,
              ]}
            >
              ${Math.abs(budgetSummary.remaining).toLocaleString()}
            </Text>
          </View>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Budget Utilization</Text>
            <Text
              style={[
                styles.progressPercentage,
                budgetSummary.percentageUsed > 100 && styles.negativeValue,
              ]}
            >
              {budgetSummary.percentageUsed.toFixed(1)}%
            </Text>
          </View>
          <ProgressBar
            progress={Math.min(budgetSummary.percentageUsed / 100, 1)}
            color={budgetSummary.percentageUsed > 100 ? '#ff6b6b' : '#007AFF'}
            style={styles.progressBar}
          />
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    margin: 16,
    marginBottom: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  budgetSummaryContainer: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  budgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  budgetLabel: {
    fontSize: 14,
    color: '#666',
  },
  budgetValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  budgetLabelBold: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  budgetValueBold: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  divider: {
    marginVertical: 8,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  progressPercentage: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  progressBar: {
    height: 10,
    borderRadius: 5,
  },
  negativeValue: {
    color: '#ff6b6b',
  },
});
