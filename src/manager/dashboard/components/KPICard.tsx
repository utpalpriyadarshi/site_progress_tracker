import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Title, Paragraph } from 'react-native-paper';

interface KPICardProps {
  label: string;
  value: string | number;
  subtext: string;
  indicatorColor: string;
}

export const KPICard: React.FC<KPICardProps> = ({
  label,
  value,
  subtext,
  indicatorColor,
}) => {
  return (
    <Card mode="elevated" style={styles.kpiCard}>
      <Card.Content>
        <Paragraph style={styles.kpiLabel}>{label}</Paragraph>
        <Title style={styles.kpiValue}>{value}</Title>
        <Paragraph style={styles.kpiSubtext}>{subtext}</Paragraph>
        <View style={styles.kpiIndicator}>
          <View
            style={[
              styles.kpiDot,
              { backgroundColor: indicatorColor },
            ]}
          />
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  kpiCard: {
    flex: 1,
    marginHorizontal: 4,
    marginVertical: 4,
    elevation: 2,
  },
  kpiLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  kpiValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  kpiSubtext: {
    fontSize: 11,
    color: '#999',
    marginBottom: 12,
  },
  kpiIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  kpiDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
});
