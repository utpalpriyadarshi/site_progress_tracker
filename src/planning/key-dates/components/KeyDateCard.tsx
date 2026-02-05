/**
 * Key Date Card Component
 *
 * Displays a single key date with its details, progress, and actions.
 * Progress is automatically calculated from associated KeyDateSites.
 *
 * @version 1.1.0
 * @since Phase 5b - Key Dates UI
 */

import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Button, IconButton, Chip } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { withObservables } from '@nozbe/watermelondb/react';
import { Q } from '@nozbe/watermelondb';
import { switchMap, combineLatest, of, map } from 'rxjs';
import { database } from '../../../../models/database';
import KeyDateModel from '../../../../models/KeyDateModel';
import KeyDateSiteModel from '../../../../models/KeyDateSiteModel';
import ItemModel from '../../../../models/ItemModel';
import { KeyDateStatusBadge } from './KeyDateStatusBadge';
import { KeyDateProgressBar } from './KeyDateProgressBar';
import {
  KEY_DATE_CATEGORY_COLORS,
  KEY_DATE_CATEGORY_ICONS,
  formatDelayDamages,
  formatDaysRemaining,
} from '../utils/keyDateConstants';

interface SiteItemProgress {
  siteId: string;
  contributionPercentage: number;
  calculatedProgress: number;
}

interface KeyDateCardProps {
  keyDate: KeyDateModel;
  keyDateSites?: KeyDateSiteModel[];
  siteItemProgress?: SiteItemProgress[];
  onEdit: (keyDate: KeyDateModel) => void;
  onManageSites?: (keyDate: KeyDateModel) => void;
  onDuplicate?: (keyDate: KeyDateModel) => void;
  onDelete?: (keyDate: KeyDateModel) => void;
  onViewDetails?: (keyDate: KeyDateModel) => void;
}

/**
 * Calculate weighted progress from item data for a set of items at a site
 * Formula: Σ(item.weightage × item.getProgressPercentage()) / Σ(item.weightage)
 */
const calculateSiteProgressFromItems = (items: ItemModel[]): number => {
  if (!items || items.length === 0) return 0;
  const totalWeightage = items.reduce((sum, item) => sum + (item.weightage || 0), 0);
  if (totalWeightage === 0) return 0;
  return items.reduce(
    (sum, item) => sum + (item.weightage || 0) * item.getProgressPercentage(),
    0
  ) / totalWeightage;
};

/**
 * Derive status from calculated progress
 * This ensures the displayed status matches the actual progress from sites
 */
const deriveStatusFromProgress = (
  progress: number,
  originalStatus: string,
  hasSites: boolean
): string => {
  // If no sites are associated, use the original status from the key date
  if (!hasSites) return originalStatus;

  // Derive status based on progress
  if (progress >= 100) return 'completed';
  if (progress > 0) return 'in_progress';
  return 'not_started';
};

const KeyDateCardInner: React.FC<KeyDateCardProps> = ({
  keyDate,
  keyDateSites = [],
  siteItemProgress = [],
  onEdit,
  onManageSites,
  onDuplicate,
  onDelete,
  onViewDetails,
}) => {
  const categoryColor = KEY_DATE_CATEGORY_COLORS[keyDate.category] || '#666666';
  const categoryIcon = KEY_DATE_CATEGORY_ICONS[keyDate.category] || 'calendar-check';
  const daysRemaining = keyDate.getDaysRemaining();
  const daysDelayed = keyDate.getDaysDelayed();
  const estimatedDamages = keyDate.getEstimatedDelayDamages();
  const isCritical = keyDate.isCritical();

  // Calculate overall progress from auto-calculated site item progress
  // Formula: Σ(site.contributionPercentage / 100 × siteProgress) for all associated sites
  const calculatedProgress = useMemo(() => {
    if (siteItemProgress.length > 0) {
      return siteItemProgress.reduce(
        (total, sp) => total + (sp.contributionPercentage / 100) * sp.calculatedProgress,
        0
      );
    }
    return keyDate.progressPercentage;
  }, [siteItemProgress, keyDate.progressPercentage]);

  // Derive the display status from calculated progress to ensure consistency
  const derivedStatus = useMemo(() => {
    return deriveStatusFromProgress(
      calculatedProgress,
      keyDate.status,
      keyDateSites.length > 0
    );
  }, [calculatedProgress, keyDate.status, keyDateSites.length]);

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
          <KeyDateStatusBadge status={derivedStatus as any} />
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

        {/* Progress Bar - uses calculated progress from associated sites */}
        <KeyDateProgressBar
          progressPercentage={calculatedProgress}
          category={keyDate.category}
          status={derivedStatus as any}
        />
        {keyDateSites.length > 0 && (
          <Text style={styles.siteCountText}>
            {keyDateSites.length} site{keyDateSites.length !== 1 ? 's' : ''} contributing
          </Text>
        )}

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

          {derivedStatus !== 'completed' && (
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

        {/* Actions - Row 1: Duplicate & Delete */}
        <View style={styles.actionsRow}>
          {onDuplicate && (
            <Button
              mode="text"
              onPress={() => onDuplicate(keyDate)}
              style={styles.actionButton}
              compact
              icon="content-copy"
              accessibilityLabel="Duplicate key date"
            >
              Duplicate
            </Button>
          )}

          {onDelete && (
            <Button
              mode="text"
              onPress={() => onDelete(keyDate)}
              style={styles.actionButton}
              compact
              icon="delete-outline"
              textColor="#F44336"
              accessibilityLabel="Delete key date"
            >
              Delete
            </Button>
          )}

          {onViewDetails && (
            <IconButton
              icon="information-outline"
              size={20}
              onPress={() => onViewDetails(keyDate)}
              accessibilityLabel="View details"
            />
          )}
        </View>

        {/* Actions - Row 2: Sites & Edit */}
        <View style={styles.actionsRow}>
          {onManageSites && (
            <Button
              mode="outlined"
              onPress={() => onManageSites(keyDate)}
              style={styles.actionButton}
              compact
              icon="map-marker-multiple"
              accessibilityLabel="Manage sites"
            >
              Sites
            </Button>
          )}

          <Button
            mode="contained"
            onPress={() => onEdit(keyDate)}
            style={styles.actionButton}
            compact
            accessibilityLabel="Edit key date"
          >
            Edit
          </Button>
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
    marginTop: 8,
    gap: 8,
  },
  actionButton: {
    flex: 1,
  },
  siteCountText: {
    fontSize: 11,
    color: '#888',
    marginTop: 4,
    textAlign: 'right',
  },
});

// WatermelonDB observable enhancement - fetches associated sites and computes progress from items
const enhance = withObservables(['keyDate'], ({ keyDate }: { keyDate: KeyDateModel }) => {
  const keyDateSites$ = database.collections
    .get<KeyDateSiteModel>('key_date_sites')
    .query(Q.where('key_date_id', keyDate.id))
    .observe();

  const siteItemProgress$ = keyDateSites$.pipe(
    switchMap((sites) => {
      if (sites.length === 0) return of([]);
      return combineLatest(
        sites.map((site) =>
          database.collections
            .get<ItemModel>('items')
            .query(Q.where('site_id', site.siteId))
            .observeWithColumns(['completed_quantity', 'planned_quantity', 'weightage'])
            .pipe(
              map((items) => ({
                siteId: site.siteId,
                contributionPercentage: site.contributionPercentage,
                calculatedProgress: calculateSiteProgressFromItems(items),
              }))
            )
        )
      );
    })
  );

  return {
    keyDate,
    keyDateSites: keyDateSites$,
    siteItemProgress: siteItemProgress$,
  };
});

// Enhanced component with reactive data
export const KeyDateCard = enhance(KeyDateCardInner);

export default KeyDateCard;
