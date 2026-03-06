import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../../theme/colors';

interface StatCardsProps {
  stats: {
    total: number;
    critical: number;
    shortageCount: number;
    sufficient: number;
    procurementPending: number;
  };
}

/**
 * StatCards — compact single-row summary bar for material requirements.
 * Replaces the previous large scrollable square cards.
 */
export const StatCards: React.FC<StatCardsProps> = ({ stats }) => {
  if (stats.total === 0) return null;

  const items = [
    { label: 'Total',    value: stats.total,            color: '#555' },
    { label: 'Critical', value: stats.critical,         color: COLORS.ERROR },
    { label: 'Shortage', value: stats.shortageCount,    color: COLORS.WARNING },
    { label: 'OK',       value: stats.sufficient,       color: COLORS.SUCCESS },
    { label: 'Procure',  value: stats.procurementPending, color: COLORS.INFO },
  ];

  return (
    <View style={styles.row}>
      {items.map((item, idx) => (
        <React.Fragment key={item.label}>
          {idx > 0 && <View style={styles.divider} />}
          <View style={styles.pill}>
            <Text style={[styles.value, { color: item.color }]}>{item.value}</Text>
            <Text style={styles.label}>{item.label}</Text>
          </View>
        </React.Fragment>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e8e8e8',
    alignItems: 'center',
  },
  pill: {
    flex: 1,
    alignItems: 'center',
  },
  value: {
    fontSize: 18,
    fontWeight: '700',
  },
  label: {
    fontSize: 10,
    color: '#888',
    marginTop: 1,
  },
  divider: {
    width: 1,
    height: 28,
    backgroundColor: '#e8e8e8',
  },
});
