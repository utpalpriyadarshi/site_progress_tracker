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
import DesignDocumentModel from '../../../../models/DesignDocumentModel';
import { calculateSiteProgressFromItems } from '../../utils/progressCalculations';
import { calculateSiteProgressFromDesignDocuments, calculateKDProgress } from '../../utils/designDocumentProgress';
import { KeyDateStatusBadge } from './KeyDateStatusBadge';
import { KeyDateProgressBar } from './KeyDateProgressBar';
import {
  KEY_DATE_CATEGORY_COLORS,
  KEY_DATE_CATEGORY_ICONS,
  formatDelayDamages,
  formatDaysRemaining,
} from '../utils/keyDateConstants';
import { COLORS } from '../../../theme/colors';

interface SiteItemProgress {
  siteId: string;
  contributionPercentage: number;
  calculatedProgress: number;
  itemProgress: number;
  docProgress: number;
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
 * Derive status from calculated progress
 * This ensures the displayed status matches the actual progress from sites
 */
const deriveStatusFromProgress = (
  progress: number,
  originalStatus: string,
  hasSites: boolean,
  progressMode?: string | null,
): string => {
  // For manual/binary modes, always derive status from stored progress
  if (progressMode === 'manual' || progressMode === 'binary') {
    if (progress >= 100) return 'completed';
    if (progress > 0) return 'in_progress';
    return 'not_started';
  }

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
  const { calculatedProgress, itemProgressTotal, docProgressTotal } = useMemo(() => {
    if (siteItemProgress.length > 0) {
      const combined = siteItemProgress.reduce(
        (total, sp) => total + (sp.contributionPercentage / 100) * sp.calculatedProgress,
        0
      );
      const items = siteItemProgress.reduce(
        (total, sp) => total + (sp.contributionPercentage / 100) * sp.itemProgress,
        0
      );
      const docs = siteItemProgress.reduce(
        (total, sp) => total + (sp.contributionPercentage / 100) * sp.docProgress,
        0
      );
      return { calculatedProgress: combined, itemProgressTotal: items, docProgressTotal: docs };
    }
    return { calculatedProgress: keyDate.progressPercentage, itemProgressTotal: 0, docProgressTotal: 0 };
  }, [siteItemProgress, keyDate.progressPercentage]);

  // Derive the display status from calculated progress to ensure consistency
  const derivedStatus = useMemo(() => {
    return deriveStatusFromProgress(
      calculatedProgress,
      keyDate.status,
      keyDateSites.length > 0,
      keyDate.progressMode,
    );
  }, [calculatedProgress, keyDate.status, keyDateSites.length, keyDate.progressMode]);

  return (
    <Card
      mode="elevated"
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
        {keyDate.progressMode === 'manual' || keyDate.progressMode === 'binary' ? (
          <Chip
            mode="outlined"
            compact
            style={styles.progressModeChip}
            textStyle={styles.progressModeChipText}
          >
            {keyDate.progressMode === 'binary' ? 'Done / Not Done' : 'Manual Progress'}
          </Chip>
        ) : keyDateSites.length > 0 ? (
          <View>
            {(itemProgressTotal > 0 || docProgressTotal > 0) && (
              <Text style={styles.progressBreakdownText}>
                Items: {Math.round(itemProgressTotal)}% | Design Docs: {Math.round(docProgressTotal)}%
              </Text>
            )}
            <Text style={styles.siteCountText}>
              {keyDateSites.length} site{keyDateSites.length !== 1 ? 's' : ''} contributing
            </Text>
          </View>
        ) : null}

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
                color={daysDelayed > 0 ? COLORS.ERROR : '#666'}
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
              <Icon name="check-circle" size={16} color={COLORS.SUCCESS} />
              <Text style={styles.scheduleText}>
                Completed: {new Date(keyDate.actualDate).toLocaleDateString()}
              </Text>
            </View>
          )}
        </View>

        {/* Delay Damages Warning */}
        {daysDelayed > 0 && (
          <View style={styles.damagesSection}>
            <Icon name="currency-inr" size={16} color={COLORS.ERROR} />
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
              textColor={COLORS.ERROR}
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
    borderLeftColor: COLORS.ERROR,
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
    color: COLORS.ERROR,
    fontWeight: '600',
  },
  damagesSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.ERROR_BG,
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
  progressModeChip: {
    alignSelf: 'flex-end',
    marginTop: 4,
    borderColor: '#7E57C2',
  },
  progressModeChipText: {
    fontSize: 11,
    color: '#7E57C2',
  },
  progressBreakdownText: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
    textAlign: 'right',
  },
  siteCountText: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
    textAlign: 'right',
  },
});

// WatermelonDB observable enhancement - dual-track progress (site items + design docs)
const enhance = withObservables(['keyDate'], ({ keyDate }: { keyDate: KeyDateModel }) => {
  const mode = keyDate.progressMode;

  // For manual/binary modes, short-circuit: use stored progressPercentage directly
  // Must observe the record so updates re-emit (of() would be static/stale)
  if (mode === 'manual' || mode === 'binary') {
    return {
      keyDate,
      keyDateSites: of([]),
      siteItemProgress: keyDate.observe().pipe(
        map((kd) => [{
          siteId: '__kd_level__',
          contributionPercentage: 100,
          calculatedProgress: kd.progressPercentage,
          itemProgress: 0,
          docProgress: 0,
        }]),
      ),
    };
  }

  // Auto mode: calculate from sites + design docs
  const keyDateSites$ = database.collections
    .get<KeyDateSiteModel>('key_date_sites')
    .query(Q.where('key_date_id', keyDate.id))
    .observe();

  // All design documents linked to this KD (regardless of site_id)
  const allDocsForKD$ = database.collections
    .get<DesignDocumentModel>('design_documents')
    .query(Q.where('key_date_id', keyDate.id))
    .observeWithColumns(['status', 'weightage']);

  // Returns a single-element array with aggregated KD-level progress
  const siteItemProgress$ = combineLatest([keyDateSites$, allDocsForKD$]).pipe(
    switchMap(([sites, allDocsForKD]) => {
      const hasDocs = allDocsForKD.length > 0;
      const designProgress = calculateSiteProgressFromDesignDocuments(allDocsForKD);

      if (sites.length === 0) {
        // No sites — progress comes only from design docs (if any)
        const { combined } = calculateKDProgress(0, designProgress, keyDate.designWeightage || 0, false, hasDocs);
        return of([{
          siteId: '__kd_level__',
          contributionPercentage: 100,
          calculatedProgress: combined,
          itemProgress: 0,
          docProgress: designProgress,
        }]);
      }

      // Has sites — calculate item progress per site, then combine with design track
      return combineLatest(
        sites.map((site) =>
          database.collections
            .get<ItemModel>('items')
            .query(Q.where('site_id', site.siteId))
            .observeWithColumns(['completed_quantity', 'planned_quantity', 'weightage'])
            .pipe(
              map((items) => ({
                contributionPercentage: site.contributionPercentage,
                itemProgress: calculateSiteProgressFromItems(items),
              }))
            )
        )
      ).pipe(
        map((siteResults) => {
          // Aggregate site-level item progress
          const siteProgress = siteResults.reduce(
            (total, sp) => total + (sp.contributionPercentage / 100) * sp.itemProgress,
            0
          );

          const { combined } = calculateKDProgress(
            siteProgress, designProgress, keyDate.designWeightage || 0, true, hasDocs
          );

          // Return single synthetic entry for UI consumption
          return [{
            siteId: '__kd_level__',
            contributionPercentage: 100,
            calculatedProgress: combined,
            itemProgress: siteProgress,
            docProgress: designProgress,
          }];
        })
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
