/**
 * ItemInfoCard Component
 *
 * Displays read-only item metadata and progress information
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import ItemModel from '../../../../models/ItemModel';
import { COLORS } from '../../../theme/colors';

interface ItemInfoCardProps {
  item: ItemModel;
  newProgressPercentage: number;
}

export const ItemInfoCard: React.FC<ItemInfoCardProps> = ({
  item,
  newProgressPercentage,
}) => {
  return (
    <View style={styles.section}>
      <Text variant="labelLarge" style={styles.sectionTitle}>
        Item Information
      </Text>
      <Surface style={styles.infoBox}>
        <Text variant="bodySmall" style={styles.infoText}>
          WBS Code: {item.wbsCode}
        </Text>
        <Text variant="bodySmall" style={styles.infoText}>
          WBS Level: {item.wbsLevel}
        </Text>
        <Text variant="bodySmall" style={styles.infoText}>
          Current Status: {item.status.replace('_', ' ').toUpperCase()}
        </Text>
        <Text variant="bodySmall" style={styles.infoText}>
          Current Progress: {Math.round(item.getProgressPercentage())}%
        </Text>
        <Text variant="bodySmall" style={styles.infoText}>
          New Progress: {newProgressPercentage}%
        </Text>
      </Surface>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 8,
    fontWeight: 'bold',
  },
  infoBox: {
    padding: 12,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.INFO,
  },
  infoText: {
    marginVertical: 2,
    color: '#1565C0',
  },
});
