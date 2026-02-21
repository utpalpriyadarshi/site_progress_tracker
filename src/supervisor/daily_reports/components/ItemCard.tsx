import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, ProgressBar, Button, Chip, Divider } from 'react-native-paper';
import ItemModel from '../../../../models/ItemModel';
import {
  getStatusColor,
  formatStatus,
  calculateProgress,
  formatQuantity,
} from '../utils';
import { COLORS } from '../../../theme/colors';

interface ItemCardProps {
  item: ItemModel;
  photoCount: number;
  onUpdate: (item: ItemModel) => void;
}

/**
 * ItemCard Component
 *
 * Displays a single item with its progress information
 * Shows status, quantity, progress bar, and photo count
 * Provides an "Update Progress" button
 */
export const ItemCard: React.FC<ItemCardProps> = ({
  item,
  photoCount,
  onUpdate,
}) => {
  const progress = calculateProgress(item.completedQuantity, item.plannedQuantity);

  return (
    <View style={styles.container}>
      {/* Item Header */}
      <View style={styles.header}>
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemQuantity}>
            {formatQuantity(
              item.completedQuantity,
              item.plannedQuantity,
              item.unitOfMeasurement
            )}
          </Text>
        </View>

        {/* Status and Photo Count */}
        <View style={styles.chipContainer}>
          {photoCount > 0 && (
            <Chip
              icon="camera"
              style={styles.photoChip}
              textStyle={styles.photoChipText}
              accessibilityLabel={`${photoCount} photo${photoCount === 1 ? '' : 's'}`}
            >
              {photoCount}
            </Chip>
          )}
          <Chip
            mode="flat"
            style={{
              backgroundColor: getStatusColor(item.status),
            }}
            textStyle={styles.statusChipText}
            accessibilityLabel={`Status: ${formatStatus(item.status)}`}
          >
            {formatStatus(item.status)}
          </Chip>
        </View>
      </View>

      {/* Progress Bar */}
      <ProgressBar
        progress={progress / 100}
        color={COLORS.INFO}
        style={styles.progressBar}
      />
      <Text style={styles.progressText}>{progress.toFixed(1)}% Complete</Text>

      {/* Update Button */}
      <Button
        mode="outlined"
        icon="pencil"
        onPress={() => onUpdate(item)}
        style={styles.updateButton}>
        Update Progress
      </Button>

      <Divider style={styles.divider} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  itemInfo: {
    flex: 1,
    marginRight: 8,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  itemQuantity: {
    fontSize: 14,
    color: '#666',
  },
  chipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  photoChip: {
    backgroundColor: COLORS.INFO_BG,
    height: 32,
  },
  photoChipText: {
    color: '#1976D2',
    fontSize: 12,
    fontWeight: '600',
  },
  statusChipText: {
    color: 'white',
    fontSize: 12,
    textTransform: 'capitalize',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginVertical: 8,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  updateButton: {
    marginTop: 8,
  },
  divider: {
    marginTop: 16,
  },
});
