import React, { useState } from 'react';
import { View, StyleSheet, Text as RNText } from 'react-native';
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
              <View style={[styles.badgeBase, styles.criticalBadge]}>
                <RNText style={styles.criticalBadgeText} numberOfLines={1}>
                  CRITICAL
                </RNText>
              </View>
            )}
            {riskBadgeColor && (
              <View style={[styles.badgeBase, { backgroundColor: riskBadgeColor }]}>
                <RNText style={styles.riskBadgeText} numberOfLines={1}>
                  {item.dependencyRisk === 'high' ? 'HIGH RISK' : 'MED RISK'}
                </RNText>
              </View>
            )}
            {item.isBaselineLocked && (
              <View style={[styles.badgeBase, styles.lockedBadge]}>
                <RNText style={styles.lockedBadgeText} numberOfLines={1}>
                  LOCKED
                </RNText>
              </View>
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

        {/* Details Row — includes duration, float, dates, and status */}
        <View style={styles.detailsRow}>
          <Text variant="bodySmall" style={styles.detailText}>
            Duration: {item.getPlannedDuration()} days
          </Text>
          {item.floatDays !== undefined && (
            <Text variant="bodySmall" style={styles.detailText}>
              Float: {item.floatDays} days
            </Text>
          )}
          <Text variant="bodySmall" style={styles.dateText}>
            Start: {new Date(item.plannedStartDate).toLocaleDateString()}
          </Text>
          <Text variant="bodySmall" style={styles.dateText}>
            End: {new Date(item.plannedEndDate).toLocaleDateString()}
          </Text>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor:
                  item.status === 'completed' ? '#4CAF50' :
                  item.status === 'in_progress' ? '#FF9800' :
                  '#9E9E9E',
              },
            ]}
          >
            <RNText style={styles.statusBadgeText} numberOfLines={1}>
              {item.status === 'completed' ? 'COMPLETED' :
               item.status === 'in_progress' ? 'IN PROGRESS' :
               'NOT STARTED'}
            </RNText>
          </View>
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
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: 4,
    marginRight: 16,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    flex: 1,
    marginRight: 4,
    gap: 6,
  },
  wbsCode: {
    fontFamily: 'monospace',
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 4,
  },
  badgeBase: {
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    minWidth: 70,
    marginBottom: 4,
  },
  criticalBadge: {
    backgroundColor: '#d32f2f',
  },
  criticalBadgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 11,
    textAlign: 'center',
  },
  riskBadgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 11,
    textAlign: 'center',
  },
  lockedBadge: {
    backgroundColor: '#757575',
  },
  lockedBadgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 11,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
  },
  itemName: {
    marginBottom: 4,
  },
  criticalItemName: {
    fontWeight: 'bold',
    color: '#d32f2f',
  },
  phaseChip: {
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 4,
    gap: 8,
  },
  detailText: {
    color: '#666',
  },
  dateText: {
    color: '#999',
    fontSize: 11,
  },
  statusBadge: {
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    minWidth: 90,
  },
  statusBadgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 11,
    textAlign: 'center',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
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
    borderLeftWidth: 3,
    borderLeftColor: '#ff9800',
    borderRadius: 4,
    color: '#e65100',
  },
});

export default WBSItemCard;
