import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card, Chip, ProgressBar } from 'react-native-paper';
import { CategoryBreakdownItem, getCategoryLabel, getCategoryColor } from '../utils';

interface CategoryBreakdownCardProps {
  categoryBreakdown: CategoryBreakdownItem[];
}

export const CategoryBreakdownCard: React.FC<CategoryBreakdownCardProps> = ({
  categoryBreakdown,
}) => {
  return (
    <Card mode="elevated" style={styles.card}>
      <Card.Content>
        <Text style={styles.sectionTitle}>Spending by Category</Text>
        {categoryBreakdown.map((cat) => (
          <View key={cat.category} style={styles.categoryItem}>
            <View style={styles.categoryHeader}>
              <Chip
                style={[styles.categoryChip, { backgroundColor: getCategoryColor(cat.category) }]}
                textStyle={styles.categoryChipText}
              >
                {getCategoryLabel(cat.category)}
              </Chip>
              {cat.isOverBudget && (
                <Chip mode="flat" style={styles.overBudgetChip} textStyle={styles.overBudgetText}>
                  OVER
                </Chip>
              )}
            </View>
            <View style={styles.categoryDetails}>
              <Text style={styles.categoryAmount}>
                ${cat.spent.toLocaleString()} / ${cat.budget.toLocaleString()}
              </Text>
              <Text style={[styles.categoryPercentage, cat.isOverBudget && styles.negativeValue]}>
                {cat.percentage.toFixed(0)}%
              </Text>
            </View>
            <ProgressBar
              progress={Math.min(cat.percentage / 100, 1)}
              color={cat.isOverBudget ? '#ff6b6b' : getCategoryColor(cat.category)}
              style={styles.categoryProgressBar}
            />
          </View>
        ))}
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
  categoryItem: {
    marginBottom: 16,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryChip: {
    alignSelf: 'flex-start',
  },
  categoryChipText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  overBudgetChip: {
    backgroundColor: '#fff3cd',
  },
  overBudgetText: {
    color: '#856404',
    fontWeight: 'bold',
    fontSize: 11,
  },
  categoryDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  categoryAmount: {
    fontSize: 13,
    color: '#666',
  },
  categoryPercentage: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#333',
  },
  categoryProgressBar: {
    height: 6,
    borderRadius: 3,
  },
  negativeValue: {
    color: '#ff6b6b',
  },
});
