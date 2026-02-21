import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Card, Chip, Button, Checkbox } from 'react-native-paper';
import { COLORS } from '../../theme/colors';

export interface DetailRow {
  label: string;
  value: string;
  valueColor?: string;
}

export interface CardAction {
  label: string;
  icon?: string;
  onPress: () => void;
  mode?: 'text' | 'outlined' | 'contained';
  color?: string;
  disabled?: boolean;
  loading?: boolean;
}

interface BaseCardProps {
  title: string;
  subtitle?: string;
  /** Renders a standard status chip in the header right. Ignored when headerRight is provided. */
  status?: { label: string; color: string; icon?: string };
  /** Custom header right content — replaces the status chip when provided. */
  headerRight?: React.ReactNode;
  details?: DetailRow[];
  /** Generic action buttons rendered in Card.Actions below the content. */
  actions?: CardAction[];
  /** Custom content rendered after detail rows, before Card.Actions. */
  children?: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  isSelected?: boolean;
  bulkSelectMode?: boolean;
  onSelect?: () => void;
  style?: ViewStyle;
}

export const BaseCard: React.FC<BaseCardProps> = ({
  title,
  subtitle,
  status,
  headerRight,
  details,
  actions,
  children,
  onPress,
  onLongPress,
  isSelected = false,
  bulkSelectMode = false,
  onSelect,
  style,
}) => {
  const handlePress = () => {
    if (bulkSelectMode && onSelect) {
      onSelect();
    } else if (onPress) {
      onPress();
    }
  };

  const headerRightContent = headerRight ?? (
    status ? (
      <Chip
        mode="flat"
        icon={status.icon}
        style={{ backgroundColor: status.color + '20' }}
        textStyle={[styles.statusChipText, { color: status.color }]}
      >
        {status.label}
      </Chip>
    ) : null
  );

  return (
    <Card
      style={[styles.card, isSelected && styles.selectedCard, style]}
      onPress={bulkSelectMode ? handlePress : onPress}
      onLongPress={onLongPress}
    >
      <Card.Content>
        {bulkSelectMode && (
          <View style={styles.checkboxRow}>
            <Checkbox
              status={isSelected ? 'checked' : 'unchecked'}
              onPress={onSelect}
            />
          </View>
        )}

        <View style={styles.cardHeader}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{title}</Text>
            {subtitle ? (
              <Text style={styles.subtitle} numberOfLines={2} ellipsizeMode="tail">
                {subtitle}
              </Text>
            ) : null}
          </View>
          {headerRightContent ? (
            <View style={styles.headerRight}>{headerRightContent}</View>
          ) : null}
        </View>

        {details?.map((row, i) => (
          <View key={i} style={styles.detailRow}>
            <Text style={styles.detailLabel}>{row.label}:</Text>
            <Text style={[styles.detailValue, row.valueColor ? { color: row.valueColor } : undefined]}>
              {row.value}
            </Text>
          </View>
        ))}

        {children}
      </Card.Content>

      {actions?.length ? (
        <Card.Actions>
          {actions.map((action, i) => (
            <Button
              key={i}
              mode={action.mode ?? 'text'}
              icon={action.icon}
              onPress={action.onPress}
              disabled={action.disabled}
              loading={action.loading}
              textColor={action.color}
            >
              {action.label}
            </Button>
          ))}
        </Card.Actions>
      ) : null}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  selectedCard: {
    borderWidth: 2,
    borderColor: COLORS.INFO,
    backgroundColor: COLORS.INFO_BG,
  },
  checkboxRow: {
    position: 'absolute',
    top: -4,
    left: -4,
    zIndex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  titleContainer: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.TEXT_SECONDARY,
    marginTop: 2,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  statusChipText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    fontWeight: '600',
    width: 130,
  },
  detailValue: {
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
    flex: 1,
  },
});

export default BaseCard;
