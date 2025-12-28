import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card, Button, Chip } from 'react-native-paper';
import { Cost } from '../hooks';
import { getCategoryLabel, formatCurrency, formatDate } from '../utils';
import { CategoryChip } from './CategoryChip';

interface CostCardProps {
  cost: Cost;
  budgetAmount: number;
  totalSpent: number;
  onEdit: (cost: Cost) => void;
  onDelete: (cost: Cost) => void;
}

export const CostCard: React.FC<CostCardProps> = ({
  cost,
  budgetAmount,
  totalSpent,
  onEdit,
  onDelete,
}) => {
  const isOverBudget = totalSpent > budgetAmount;

  return (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.header}>
          <CategoryChip category={cost.category} label={getCategoryLabel(cost.category)} />
          <View style={styles.actions}>
            <Button mode="text" onPress={() => onEdit(cost)} compact textColor="#007AFF">
              Edit
            </Button>
            <Button mode="text" onPress={() => onDelete(cost)} compact textColor="#ff6b6b">
              Delete
            </Button>
          </View>
        </View>

        <Text style={styles.description}>{cost.description}</Text>

        <View style={styles.detailsRow}>
          <Text style={styles.detailLabel}>Amount:</Text>
          <Text style={styles.detailValue}>{formatCurrency(cost.amount)}</Text>
        </View>

        <View style={styles.detailsRow}>
          <Text style={styles.detailLabel}>Cost Date:</Text>
          <Text style={styles.detailValue}>{formatDate(cost.costDate)}</Text>
        </View>

        {cost.poId && (
          <View style={styles.detailsRow}>
            <Text style={styles.detailLabel}>PO #:</Text>
            <Text style={styles.detailValue}>{cost.poId}</Text>
          </View>
        )}

        <View style={styles.budgetComparison}>
          <Text style={styles.comparisonLabel}>
            Category Total: {formatCurrency(totalSpent)} / {formatCurrency(budgetAmount)}
          </Text>
          {isOverBudget && (
            <Chip mode="flat" style={styles.warningChip} textStyle={styles.warningChipText}>
              ⚠️ OVER BUDGET
            </Chip>
          )}
        </View>

        <Text style={styles.timestamp}>Created: {formatDate(cost.createdAt)}</Text>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
  },
  description: {
    fontSize: 16,
    color: '#333',
    marginBottom: 12,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  budgetComparison: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 8,
  },
  comparisonLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  warningChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff3cd',
    marginTop: 4,
  },
  warningChipText: {
    color: '#856404',
    fontWeight: 'bold',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
});
