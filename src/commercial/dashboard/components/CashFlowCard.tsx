import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from 'react-native-paper';
import { CashFlow } from '../utils';

interface CashFlowCardProps {
  cashFlow: CashFlow;
}

export const CashFlowCard: React.FC<CashFlowCardProps> = ({ cashFlow }) => {
  return (
    <Card style={styles.card}>
      <Card.Content>
        <Text style={styles.sectionTitle}>Cash Flow</Text>
        <View style={styles.cashFlowContainer}>
          <View style={styles.cashFlowItem}>
            <Text style={styles.cashFlowLabel}>Revenue</Text>
            <Text style={[styles.cashFlowValue, styles.positiveValue]}>
              ${cashFlow.revenue.toLocaleString()}
            </Text>
          </View>
          <View style={styles.cashFlowItem}>
            <Text style={styles.cashFlowLabel}>Costs</Text>
            <Text style={styles.cashFlowValue}>${cashFlow.costs.toLocaleString()}</Text>
          </View>
          <View style={styles.cashFlowItem}>
            <Text style={styles.cashFlowLabelBold}>Net</Text>
            <Text
              style={[
                styles.cashFlowValueBold,
                cashFlow.net >= 0 ? styles.positiveValue : styles.negativeValue,
              ]}
            >
              ${Math.abs(cashFlow.net).toLocaleString()}
            </Text>
          </View>
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
  cashFlowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  cashFlowItem: {
    alignItems: 'center',
  },
  cashFlowLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  cashFlowValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  cashFlowLabelBold: {
    fontSize: 12,
    color: '#333',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cashFlowValueBold: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  positiveValue: {
    color: '#4CAF50',
  },
  negativeValue: {
    color: '#ff6b6b',
  },
});
