/**
 * Key Date Card Component
 *
 * Displays a single key date with its details, progress, and actions.
 *
 * @version 1.0.0
 * @since Phase 5b - Key Dates UI
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Button, IconButton, Chip } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import KeyDateModel from '../../../../models/KeyDateModel';
import { KeyDateStatusBadge } from './KeyDateStatusBadge';
import { KeyDateProgressBar } from './KeyDateProgressBar';
import {
  KEY_DATE_CATEGORY_COLORS,
  KEY_DATE_CATEGORY_ICONS,
  formatDelayDamages,
  formatDaysRemaining,
} from '../utils/keyDateConstants';

interface KeyDateCardProps {
  keyDate: KeyDateModel;
  onEdit: (keyDate: KeyDateModel) => void;
  onUpdateProgress: (keyDate: KeyDateModel) => void;
  onViewDetails?: (keyDate: KeyDateModel) => void;
}

export const KeyDateCard: React.FC<KeyDateCardProps> = ({
  keyDate,
  onEdit,
  onUpdateProgress,
  onViewDetails,
}) => {
  const categoryColor = KEY_DATE_CATEGORY_COLORS[keyDate.category] || '#666666';
  const categoryIcon = KEY_DATE_CATEGORY_ICONS[keyDate.category] || 'calendar-check';
  const daysRemaining = keyDate.getDaysRemaining();
  const daysDelayed = keyDate.getDaysDelayed();
  const estimatedDamages = keyDate.getEstimatedDelayDamages();
  const isCritical = keyDate.isCritical();

  return (
    <Card
      style={[styles.card, isCritical && styles.criticalCard]}
      accessibilityLabel={`Key Date ${keyDate.code}: ${keyDate.description}`}
    >
      {/* Category Color Bar */}
      <View style={[styles.categoryBar, { backgroundColor: categoryColor }]} />

      <Card.Content style={styles.content}>
        {/* Header Row */}
        <View style={styles.headerRow}>
          <View style={styles.codeSection}>
            <Icon name={categoryIcon} size={20} color={categoryColor} />
            <Text style={[styles.code, { color: categoryColor }]}>
              {keyDate.getFormattedCode()}
            </Text>
          </View>
          <KeyDateStatusBadge status={keyDate.status} />
        </View>

        {/* Category Chip */}
        <Chip
          mode="outlined"
          style={[styles.categoryChip, { borderColor: categoryColor }]}
          textStyle={{ color: categoryColor, fontSize: 11 }}
          compact
        >
          {keyDate.categoryName}
        </Chip>

        {/* Description */}
        <Text style={styles.description} numberOfLines={2}>
          {keyDate.description}
        </Text>

        {/* Progress Bar */}
        <KeyDateProgressBar
          progressPercentage={keyDate.progressPercentage}
          category={keyDate.category}
          status={keyDate.status}
        />

        {/* Schedule Info */}
        <View style={styles.scheduleSection}>
          <View style={styles.scheduleRow}>
            <Icon name="calendar-clock" size={16} color="#666" />
            <Text style={styles.scheduleText}>
              Target: {keyDate.targetDays} days from commencement
            </Text>
          </View>

          {keyDate.targetDate && (
            <View style={styles.scheduleRow}>
              <Icon name="calendar-check" size={16} color="#666" />
              <Text style={styles.scheduleText}>
                Due: {new Date(keyDate.targetDate).toLocaleDateString()}
              </Text>
            </View>
          )}

          {keyDate.status !== 'completed' && (
            <View style={styles.scheduleRow}>
              <Icon
                name={daysDelayed > 0 ? 'alert-circle' : 'clock-outline'}
                size={16}
                color={daysDelayed > 0 ? '#F44336' : '#666'}
              />
              <Text
                style={[
                  styles.scheduleText,
                  daysDelayed > 0 && styles.delayedText,
                ]}
              >
                {formatDaysRemaining(daysRemaining)}
              </Text>
            </View>
          )}

          {keyDate.actualDate && (
            <View style={styles.scheduleRow}>
              <Icon name="check-circle" size={16} color="#4CAF50" />
              <Text style={styles.scheduleText}>
                Completed: {new Date(keyDate.actualDate).toLocaleDateString()}
              </Text>
            </View>
          )}
        </View>

        {/* Delay Damages Warning */}
        {daysDelayed > 0 && (
          <View style={styles.damagesSection}>
            <Icon name="currency-inr" size={16} color="#F44336" />
            <Text style={styles.damagesText}>
              Est. Delay Damages: {formatDelayDamages(estimatedDamages)}
            </Text>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actionsRow}>
          <Button
            mode="outlined"
            onPress={() => onUpdateProgress(keyDate)}
            style={styles.actionButton}
            compact
            accessibilityLabel="Update progress"
          >
            Update Progress
          </Button>

          <Button
            mode="contained"
            onPress={() => onEdit(keyDate)}
            style={styles.actionButton}
            compact
            accessibilityLabel="Edit key date"
          >
            Edit
          </Button>

          {onViewDetails && (
            <IconButton
              icon="information-outline"
              size={20}
              onPress={() => onViewDetails(keyDate)}
              accessibilityLabel="View details"
            />
          )}
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  criticalCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  categoryBar: {
    height: 4,
  },
  content: {
    paddingTop: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  codeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  code: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  categoryChip: {
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    lineHeight: 20,
  },
  scheduleSection: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  scheduleText: {
    fontSize: 13,
    color: '#666',
  },
  delayedText: {
    color: '#F44336',
    fontWeight: '600',
  },
  damagesSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFEBEE',
    borderRadius: 6,
    padding: 8,
    marginTop: 8,
  },
  damagesText: {
    fontSize: 13,
    color: '#C62828',
    fontWeight: '500',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  actionButton: {
    minWidth: 100,
  },
});

export default KeyDateCard;
