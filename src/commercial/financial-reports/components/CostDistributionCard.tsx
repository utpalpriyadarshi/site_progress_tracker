import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Chip } from 'react-native-paper';
import { ReportCard } from './ReportCard';
import { getCategoryLabel, getCategoryColor } from '../utils';

interface CostDistributionCardProps {
  costsByCategory: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
}

export const CostDistributionCard: React.FC<CostDistributionCardProps> = ({
  costsByCategory,
}) => {
  return (
    <ReportCard>
      <Text style={styles.sectionTitle}>Cost Distribution by Category</Text>
      {costsByCategory.map((item) => (
        <View key={item.category} style={styles.item}>
          <View style={styles.header}>
            <Chip
              style={[styles.categoryChip, { backgroundColor: getCategoryColor(item.category) }]}
              textStyle={styles.categoryChipText}
            >
              {getCategoryLabel(item.category)}
            </Chip>
            <Text style={styles.percentage}>{item.percentage.toFixed(1)}%</Text>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${item.percentage}%`,
                  backgroundColor: getCategoryColor(item.category),
                },
              ]}
            />
          </View>
          <Text style={styles.amount}>${item.amount.toLocaleString()}</Text>
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
    marginBottom: 16,
  },
  header: {
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
  percentage: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  amount: {
    fontSize: 14,
    color: '#666',
    textAlign: 'right',
  },
});
