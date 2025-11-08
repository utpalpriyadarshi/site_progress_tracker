import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BomRequirement } from '../../shared/hooks/useBomData';
import BomLogisticsService from '../../services/BomLogisticsService';

/**
 * BomRequirementCard
 *
 * Display card showing BOM requirements for a material
 *
 * Features:
 * - BOM name and project info
 * - Required vs available quantities
 * - Color-coded status indicators
 * - Phase information
 * - Priority badges
 */

interface BomRequirementCardProps {
  requirement: BomRequirement;
  availableQuantity?: number;
  onPress?: () => void;
}

const BomRequirementCard: React.FC<BomRequirementCardProps> = ({
  requirement,
  availableQuantity = 0,
  onPress,
}) => {
  const shortage = Math.max(0, requirement.requiredQuantity - availableQuantity);
  const surplus = Math.max(0, availableQuantity - requirement.requiredQuantity);
  const percentage =
    requirement.requiredQuantity > 0
      ? Math.min(100, (availableQuantity / requirement.requiredQuantity) * 100)
      : 100;

  const status = getStatus(percentage, shortage);
  const statusColor = BomLogisticsService.getStatusColor(status);
  const priorityColor = BomLogisticsService.getPriorityColor(requirement.priority);

  const CardContent = (
    <View style={[styles.card, { borderLeftColor: statusColor, borderLeftWidth: 4 }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.bomName}>{requirement.bomName}</Text>
          <View style={styles.badges}>
            <View style={[styles.typeBadge, getTypeBadgeStyle(requirement.bomType)]}>
              <Text style={styles.typeBadgeText}>
                {requirement.bomType === 'estimating' ? 'Pre-Contract' : 'Post-Contract'}
              </Text>
            </View>
            <View style={[styles.priorityBadge, { backgroundColor: priorityColor }]}>
              <Text style={styles.priorityBadgeText}>{requirement.priority.toUpperCase()}</Text>
            </View>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
          <Text style={styles.statusBadgeText}>{status.toUpperCase()}</Text>
        </View>
      </View>

      {/* Item Details */}
      <View style={styles.detailsSection}>
        <Text style={styles.itemCode}>{requirement.itemCode}</Text>
        <Text style={styles.description}>{requirement.description}</Text>
      </View>

      {/* Quantities */}
      <View style={styles.quantitiesSection}>
        <View style={styles.quantityRow}>
          <Text style={styles.quantityLabel}>Required:</Text>
          <Text style={styles.quantityValue}>
            {requirement.requiredQuantity} {requirement.unit}
          </Text>
        </View>
        <View style={styles.quantityRow}>
          <Text style={styles.quantityLabel}>Available:</Text>
          <Text style={[styles.quantityValue, { color: statusColor }]}>
            {availableQuantity} {requirement.unit}
          </Text>
        </View>
        {shortage > 0 && (
          <View style={styles.quantityRow}>
            <Text style={[styles.quantityLabel, { color: '#F44336' }]}>Shortage:</Text>
            <Text style={[styles.quantityValue, { color: '#F44336', fontWeight: '600' }]}>
              {shortage} {requirement.unit}
            </Text>
          </View>
        )}
        {surplus > 0 && (
          <View style={styles.quantityRow}>
            <Text style={[styles.quantityLabel, { color: '#2196F3' }]}>Surplus:</Text>
            <Text style={[styles.quantityValue, { color: '#2196F3' }]}>
              {surplus} {requirement.unit}
            </Text>
          </View>
        )}
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBarBg}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${Math.min(100, percentage)}%`,
                backgroundColor: statusColor,
              },
            ]}
          />
        </View>
        <Text style={styles.progressText}>{percentage.toFixed(1)}% Available</Text>
      </View>

      {/* Phase & WBS */}
      {(requirement.phase || requirement.wbsCode) && (
        <View style={styles.metaSection}>
          {requirement.phase && (
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Phase:</Text>
              <Text style={styles.metaValue}>{requirement.phase}</Text>
            </View>
          )}
          {requirement.wbsCode && (
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>WBS:</Text>
              <Text style={styles.metaValue}>{requirement.wbsCode}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {CardContent}
      </TouchableOpacity>
    );
  }

  return CardContent;
};

// Helper functions

function getStatus(
  percentage: number,
  shortage: number
): 'sufficient' | 'shortage' | 'critical' | 'surplus' {
  if (shortage === 0 && percentage > 100) return 'surplus';
  if (percentage >= 100) return 'sufficient';
  if (percentage >= 50) return 'shortage';
  return 'critical';
}

function getTypeBadgeStyle(type: string) {
  if (type === 'estimating') {
    return { backgroundColor: '#E3F2FD', borderColor: '#2196F3' };
  }
  return { backgroundColor: '#FFF3E0', borderColor: '#FF9800' };
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerLeft: {
    flex: 1,
    marginRight: 8,
  },
  bomName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  badges: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#666',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  priorityBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  detailsSection: {
    marginBottom: 12,
  },
  itemCode: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginBottom: 2,
  },
  description: {
    fontSize: 14,
    color: '#333',
  },
  quantitiesSection: {
    marginBottom: 12,
  },
  quantityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  quantityLabel: {
    fontSize: 13,
    color: '#666',
  },
  quantityValue: {
    fontSize: 13,
    fontWeight: '500',
    color: '#333',
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
  },
  metaSection: {
    flexDirection: 'row',
    gap: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  metaItem: {
    flexDirection: 'row',
    gap: 4,
  },
  metaLabel: {
    fontSize: 12,
    color: '#999',
  },
  metaValue: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
});

export default BomRequirementCard;
