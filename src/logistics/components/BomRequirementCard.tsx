import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BomRequirement } from '../../shared/hooks/useBomData';
import BomLogisticsService from '../../services/BomLogisticsService';
import { COLORS } from '../../theme/colors';

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
  doorsId?: string;
  doorsCompliance?: number;
  onDoorsPress?: () => void;
  onLinkPress?: () => void; // Callback when "Link to DOORS" button is pressed
}

const BomRequirementCard: React.FC<BomRequirementCardProps> = ({
  requirement,
  availableQuantity = 0,
  onPress,
  doorsId,
  doorsCompliance,
  onDoorsPress,
  onLinkPress,
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
            <Text style={[styles.quantityLabel, { color: COLORS.ERROR }]}>Shortage:</Text>
            <Text style={[styles.quantityValue, { color: COLORS.ERROR, fontWeight: '600' }]}>
              {shortage} {requirement.unit}
            </Text>
          </View>
        )}
        {surplus > 0 && (
          <View style={styles.quantityRow}>
            <Text style={[styles.quantityLabel, { color: COLORS.INFO }]}>Surplus:</Text>
            <Text style={[styles.quantityValue, { color: COLORS.INFO }]}>
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

      {/* DOORS Integration */}
      {doorsId ? (
        <TouchableOpacity
          style={styles.doorsSection}
          onPress={onDoorsPress}
          activeOpacity={0.7}
        >
          <View style={styles.doorsIcon}>
            <Text style={styles.doorsIconText}>📋</Text>
          </View>
          <View style={styles.doorsInfo}>
            <Text style={styles.doorsLabel}>DOORS Package</Text>
            <Text style={styles.doorsId}>{doorsId}</Text>
          </View>
          {doorsCompliance != null && (
            <View style={styles.doorsCompliance}>
              <Text style={[
                styles.doorsComplianceText,
                {
                  color: doorsCompliance >= 95 ? COLORS.SUCCESS :
                         doorsCompliance >= 80 ? COLORS.WARNING : COLORS.ERROR
                }
              ]}>
                {doorsCompliance.toFixed(1)}%
              </Text>
              <Text style={styles.doorsComplianceLabel}>Compliance</Text>
            </View>
          )}
          <Text style={styles.doorsChevron}>›</Text>
        </TouchableOpacity>
      ) : onLinkPress ? (
        <TouchableOpacity
          style={styles.linkButton}
          onPress={onLinkPress}
          activeOpacity={0.7}
        >
          <Text style={styles.linkIcon}>🔗</Text>
          <Text style={styles.linkButtonText}>Link to DOORS</Text>
          <Text style={styles.linkChevron}>›</Text>
        </TouchableOpacity>
      ) : null}
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
    return { backgroundColor: COLORS.INFO_BG, borderColor: COLORS.INFO };
  }
  return { backgroundColor: COLORS.WARNING_BG, borderColor: COLORS.WARNING };
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
  doorsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    backgroundColor: '#F8F9FA',
    marginHorizontal: -16,
    marginBottom: -16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  doorsIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.INFO_BG,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  doorsIconText: {
    fontSize: 20,
  },
  doorsInfo: {
    flex: 1,
  },
  doorsLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 2,
  },
  doorsId: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1976D2',
  },
  doorsCompliance: {
    alignItems: 'center',
    marginRight: 8,
  },
  doorsComplianceText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  doorsComplianceLabel: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  doorsChevron: {
    fontSize: 24,
    color: '#999',
    fontWeight: '300',
  },
  // Link to DOORS button styles
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    backgroundColor: COLORS.WARNING_BG,
    marginHorizontal: -16,
    marginBottom: -16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  linkIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  linkButtonText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6F00',
  },
  linkChevron: {
    fontSize: 24,
    color: '#FF6F00',
    fontWeight: '300',
  },
});

export default BomRequirementCard;
