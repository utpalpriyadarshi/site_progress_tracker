import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Chip, IconButton, Menu } from 'react-native-paper';
import ItemModel from '../../../models/ItemModel';

interface WBSItemCardProps {
  item: ItemModel;
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onAddChild?: () => void;
}

const WBSItemCard: React.FC<WBSItemCardProps> = ({
  item,
  onPress,
  onEdit,
  onDelete,
  onAddChild,
}) => {
  const [menuVisible, setMenuVisible] = useState(false);

  const indentLevel = item.getIndentLevel();
  const phaseColor = item.getPhaseColor();
  const riskBadgeColor = item.getRiskBadgeColor();
  const isOnCriticalPath = item.isOnCriticalPath();

  return (
    <Card
      style={[
        styles.card,
        { marginLeft: 16 + indentLevel * 20 }, // Indent based on WBS level
      ]}
      onPress={onPress}
      onLongPress={() => setMenuVisible(true)}
    >
      <Card.Content>
        {/* Header Row */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text variant="labelSmall" style={styles.wbsCode}>
              {item.getFormattedWbsCode()}
            </Text>
            {isOnCriticalPath && (
              <Chip
                compact
                style={[styles.badge, styles.criticalBadge]}
                textStyle={styles.criticalBadgeText}
              >
                🔴 Critical
              </Chip>
            )}
            {riskBadgeColor && (
              <Chip
                compact
                style={[
                  styles.badge,
                  { backgroundColor: riskBadgeColor + '20' },
                ]}
                textStyle={{ color: riskBadgeColor }}
              >
                {item.dependencyRisk === 'high' ? '⚠️ High Risk' : '⚡ Med Risk'}
              </Chip>
            )}
            {item.isBaselineLocked && (
              <Chip
                compact
                style={[styles.badge, styles.lockedBadge]}
                textStyle={styles.lockedBadgeText}
              >
                🔒 Locked
              </Chip>
            )}
          </View>
          {(onEdit || onDelete || onAddChild) && (
            <Menu
              visible={menuVisible}
              onDismiss={() => setMenuVisible(false)}
              anchor={
                <IconButton
                  icon="dots-vertical"
                  size={20}
                  onPress={() => setMenuVisible(true)}
                  iconColor="#666"
                />
              }
            >
              {onAddChild && item.wbsLevel < 4 && (
                <Menu.Item
                  leadingIcon="plus-box"
                  onPress={() => {
                    setMenuVisible(false);
                    onAddChild();
                  }}
                  title="Add Child Item"
                  disabled={item.isBaselineLocked}
                />
              )}
              {onEdit && (
                <Menu.Item
                  leadingIcon="pencil"
                  onPress={() => {
                    setMenuVisible(false);
                    onEdit();
                  }}
                  title="Edit"
                  disabled={item.isBaselineLocked}
                />
              )}
              {onDelete && (
                <Menu.Item
                  leadingIcon="delete"
                  onPress={() => {
                    setMenuVisible(false);
                    onDelete();
                  }}
                  title="Delete"
                  disabled={item.isBaselineLocked}
                  titleStyle={{ color: item.isBaselineLocked ? '#ccc' : '#d32f2f' }}
                />
              )}
            </Menu>
          )}
        </View>

        {/* Item Name */}
        <Text
          variant="titleMedium"
          style={[styles.itemName, isOnCriticalPath && styles.criticalItemName]}
        >
          {item.name}
          {item.isMilestone && ' ⭐'}
        </Text>

        {/* Phase Chip */}
        <Chip
          compact
          style={[
            styles.phaseChip,
            { backgroundColor: phaseColor + '20' },
          ]}
          textStyle={{ color: phaseColor }}
        >
          {item.getPhaseLabel()}
        </Chip>

        {/* Details Row */}
        <View style={styles.detailsRow}>
          <Text variant="bodySmall" style={styles.detailText}>
            Duration: {item.getPlannedDuration()} days
          </Text>
          {item.floatDays !== undefined && (
            <Text variant="bodySmall" style={styles.detailText}>
              Float: {item.floatDays} days
            </Text>
          )}
          <Text variant="bodySmall" style={styles.detailText}>
            Status: {item.status.replace('_', ' ')}
          </Text>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${item.getProgressPercentage()}%`,
                  backgroundColor: phaseColor,
                },
              ]}
            />
          </View>
          <Text variant="bodySmall" style={styles.progressText}>
            {item.getProgressPercentage().toFixed(0)}%
          </Text>
        </View>

        {/* Risk Notes */}
        {item.riskNotes && (
          <Text variant="bodySmall" style={styles.riskNotes}>
            ⚠️ {item.riskNotes}
          </Text>
        )}

        {/* Dates */}
        <View style={styles.datesRow}>
          <Text variant="bodySmall" style={styles.dateText}>
            Start: {new Date(item.plannedStartDate).toLocaleDateString()}
          </Text>
          <Text variant="bodySmall" style={styles.dateText}>
            End: {new Date(item.plannedEndDate).toLocaleDateString()}
          </Text>
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: 6,
    marginRight: 16,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start', // Changed from 'center' to prevent clipping
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    flex: 1,
    marginRight: 4, // Reduced margin to give more space for badges
    gap: 6, // Modern gap property for consistent spacing
  },
  wbsCode: {
    fontFamily: 'monospace',
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 4, // Allow wrapping without overlap
  },
  badge: {
    height: 28, // Increased height to prevent emoji/text clipping
    marginBottom: 4, // Vertical margin for wrapped badges
  },
  criticalBadge: {
    backgroundColor: '#ffebee',
  },
  criticalBadgeText: {
    color: '#d32f2f',
    fontWeight: 'bold',
    fontSize: 11,
  },
  lockedBadge: {
    backgroundColor: '#e0e0e0',
  },
  lockedBadgeText: {
    color: '#666',
    fontSize: 11,
  },
  actions: {
    flexDirection: 'row',
  },
  itemName: {
    marginBottom: 8,
  },
  criticalItemName: {
    fontWeight: 'bold',
    color: '#d32f2f',
  },
  phaseChip: {
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  detailText: {
    color: '#666',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    color: '#666',
    minWidth: 40,
    textAlign: 'right',
  },
  riskNotes: {
    marginBottom: 12,
    padding: 8,
    backgroundColor: '#fff3e0',
    borderWidth: 1,
    borderColor: '#ff9800',
    borderLeftWidth: 3, // Thicker left border for emphasis
    borderLeftColor: '#ff9800',
    borderRadius: 4,
    color: '#e65100',
  },
  datesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateText: {
    color: '#999',
    fontSize: 11,
  },
});

export default WBSItemCard;
