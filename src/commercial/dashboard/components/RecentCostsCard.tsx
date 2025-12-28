import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card, Chip } from 'react-native-paper';
import { RecentCost } from '../hooks';
import { getCategoryLabel, getCategoryColor } from '../utils';

interface RecentCostsCardProps {
  recentCosts: RecentCost[];
}

export const RecentCostsCard: React.FC<RecentCostsCardProps> = ({ recentCosts }) => {
  if (recentCosts.length === 0) return null;

  return (
    <Card style={styles.card}>
      <Card.Content>
        <Text style={styles.sectionTitle}>Recent Costs</Text>
        {recentCosts.map((cost, index) => (
          <View key={index} style={styles.recentCostItem}>
            <View style={styles.recentCostHeader}>
              <Text style={styles.recentCostDescription} numberOfLines={1}>
                {cost.description}
              </Text>
              <Text style={styles.recentCostAmount}>${cost.amount.toLocaleString()}</Text>
            </View>
            <View style={styles.recentCostFooter}>
              <Chip
                style={[
                  styles.miniCategoryChip,
                  { backgroundColor: getCategoryColor(cost.category) },
                ]}
                textStyle={styles.miniCategoryChipText}
              >
                {getCategoryLabel(cost.category)}
              </Chip>
              <Text style={styles.recentCostDate}>{new Date(cost.date).toLocaleDateString()}</Text>
            </View>
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
  recentCostItem: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  recentCostHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  recentCostDescription: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    marginRight: 8,
  },
  recentCostAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  recentCostFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  miniCategoryChip: {
    height: 24,
    maxWidth: '70%',
  },
  miniCategoryChipText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 10,
  },
  recentCostDate: {
    fontSize: 11,
    color: '#999',
  },
});
