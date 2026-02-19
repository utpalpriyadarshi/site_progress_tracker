import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Chip, Divider } from 'react-native-paper';
import { ReportCard } from './ReportCard';
import { getCategoryLabel, getCategoryColor } from '../utils';
import { COLORS } from '../../../theme/colors';

interface BudgetVarianceCardProps {
  budgetByCategory: Array<{
    category: string;
    allocated: number;
    spent: number;
    variance: number;
  }>;
}

export const BudgetVarianceCard: React.FC<BudgetVarianceCardProps> = ({
  budgetByCategory,
}) => {
  return (
    <ReportCard>
      <Text style={styles.sectionTitle}>Budget Variance by Category</Text>
      {budgetByCategory.map((item) => (
        <View key={item.category} style={styles.item}>
          <View style={styles.header}>
            <Chip
              style={[styles.categoryChip, { backgroundColor: getCategoryColor(item.category) }]}
              textStyle={styles.categoryChipText}
            >
              {getCategoryLabel(item.category)}
            </Chip>
            {item.variance < 0 && (
              <Chip mode="flat" style={styles.overBudgetChip} textStyle={styles.overBudgetText}>
                OVER BUDGET
              </Chip>
            )}
          </View>
          <View style={styles.details}>
            <View style={styles.row}>
              <Text style={styles.label}>Allocated:</Text>
              <Text style={styles.value}>${item.allocated.toLocaleString()}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Spent:</Text>
              <Text style={styles.value}>${item.spent.toLocaleString()}</Text>
            </View>
            <Divider style={styles.miniDivider} />
            <View style={styles.row}>
              <Text style={styles.labelBold}>Variance:</Text>
              <Text style={[styles.valueBold, item.variance < 0 && styles.negative]}>
                ${Math.abs(item.variance).toLocaleString()}
              </Text>
            </View>
          </View>
        </View>
      ))}
    </ReportCard>
  );
};

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  item: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
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
  details: {
    paddingLeft: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  label: {
    fontSize: 13,
    color: '#666',
  },
  value: {
    fontSize: 13,
    color: '#333',
  },
  labelBold: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  valueBold: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.SUCCESS,
  },
  negative: {
    color: '#ff6b6b',
  },
  miniDivider: {
    marginVertical: 8,
  },
});
