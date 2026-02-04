/**
 * KeyDateSiteManager Component
 *
 * Manages site associations for a key date.
 * Allows adding/removing sites and updating contribution percentages.
 *
 * @version 1.0.0
 * @since Phase 6c - Key Dates Site Association UI
 */

import React, { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import {
  Portal,
  Dialog,
  Button,
  Text,
  TextInput,
  IconButton,
  Chip,
  Divider,
  ProgressBar,
  Menu,
  Surface,
  Snackbar,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { withObservables } from '@nozbe/watermelondb/react';
import { Q } from '@nozbe/watermelondb';
import { switchMap, combineLatest, of, map } from 'rxjs';
import { database } from '../../../../models/database';
import KeyDateModel from '../../../../models/KeyDateModel';
import KeyDateSiteModel from '../../../../models/KeyDateSiteModel';
import SiteModel from '../../../../models/SiteModel';
import ItemModel from '../../../../models/ItemModel';
import { logger } from '../../../services/LoggingService';

// ==================== Types ====================

interface KeyDateSiteManagerInputProps {
  visible: boolean;
  keyDate: KeyDateModel;
  projectId: string;
  onDismiss: () => void;
}

interface SiteProgressEntry {
  siteId: string;
  calculatedProgress: number;
}

interface KeyDateSiteManagerObservedProps {
  keyDateSites: KeyDateSiteModel[];
  allSites: SiteModel[];
  siteProgressData: SiteProgressEntry[];
}

type KeyDateSiteManagerProps = KeyDateSiteManagerInputProps & KeyDateSiteManagerObservedProps;

// ==================== Site Association Item ====================

interface SiteAssociationItemProps {
  association: KeyDateSiteModel;
  site: SiteModel | undefined;
  calculatedProgress: number;
  onUpdateContribution: (id: string, contribution: string) => void;
  onRemove: (id: string) => void;
}

const SiteAssociationItem: React.FC<SiteAssociationItemProps> = ({
  association,
  site,
  calculatedProgress,
  onUpdateContribution,
  onRemove,
}) => {
  const [isEditingContribution, setIsEditingContribution] = useState(false);
  const [contribution, setContribution] = useState(association.contributionPercentage.toString());

  const handleSaveContribution = () => {
    onUpdateContribution(association.id, contribution);
    setIsEditingContribution(false);
  };

  const handleCancelContribution = () => {
    setContribution(association.contributionPercentage.toString());
    setIsEditingContribution(false);
  };

  // Derive status from calculated progress
  const derivedStatus = calculatedProgress >= 100
    ? 'completed'
    : calculatedProgress > 0
      ? 'in_progress'
      : 'not_started';

  const statusColors: Record<string, string> = {
    not_started: '#9E9E9E',
    in_progress: '#2196F3',
    completed: '#4CAF50',
  };
  const statusColor = statusColors[derivedStatus] || '#9E9E9E';

  return (
    <Surface style={styles.siteItem} elevation={1}>
      <View style={styles.siteHeader}>
        <View style={styles.siteInfo}>
          <Text style={styles.siteName}>{site?.name || 'Unknown Site'}</Text>
          <Text style={styles.siteLocation}>{site?.location || ''}</Text>
        </View>
        <IconButton
          icon="delete-outline"
          size={20}
          iconColor="#F44336"
          onPress={() => onRemove(association.id)}
        />
      </View>

      <View style={styles.contributionRow}>
        <Text style={styles.contributionLabel}>Contribution:</Text>
        {isEditingContribution ? (
          <View style={styles.editRow}>
            <TextInput
              value={contribution}
              onChangeText={setContribution}
              keyboardType="numeric"
              style={styles.contributionInput}
              mode="outlined"
              dense
            />
            <Text style={styles.percentSymbol}>%</Text>
            <IconButton icon="check" size={18} iconColor="#4CAF50" onPress={handleSaveContribution} />
            <IconButton icon="close" size={18} iconColor="#F44336" onPress={handleCancelContribution} />
          </View>
        ) : (
          <View style={styles.editRow}>
            <Chip
              mode="outlined"
              onPress={() => setIsEditingContribution(true)}
              style={styles.contributionChip}
            >
              {association.contributionPercentage}%
            </Chip>
          </View>
        )}
      </View>

      <View style={styles.progressRow}>
        <Text style={styles.progressLabel}>Progress:</Text>
        <Chip
          mode="outlined"
          style={styles.progressChip}
        >
          {Math.round(calculatedProgress)}% (auto)
        </Chip>
      </View>

      <ProgressBar
        progress={calculatedProgress / 100}
        color={derivedStatus === 'completed' ? '#4CAF50' : '#2196F3'}
        style={styles.progressBar}
      />

      <Chip
        mode="outlined"
        style={[styles.statusChip, { borderColor: statusColor }]}
        textStyle={{ color: statusColor, fontSize: 11 }}
        compact
      >
        {derivedStatus.replace('_', ' ')}
      </Chip>
    </Surface>
  );
};

// ==================== Main Component ====================

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

const KeyDateSiteManagerComponent: React.FC<KeyDateSiteManagerProps> = ({
  visible,
  keyDate,
  projectId: _projectId,
  onDismiss,
  keyDateSites,
  allSites,
  siteProgressData,
}) => {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const [newContribution, setNewContribution] = useState('');
  const [siteMenuVisible, setSiteMenuVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Get sites that are already associated
  const associatedSiteIds = useMemo(
    () => new Set(keyDateSites.map(kds => kds.siteId)),
    [keyDateSites]
  );

  // Get available sites (not yet associated)
  const availableSites = useMemo(
    () => allSites.filter(site => !associatedSiteIds.has(site.id)),
    [allSites, associatedSiteIds]
  );

  // Calculate total contribution
  const totalContribution = useMemo(
    () => keyDateSites.reduce((sum, kds) => sum + kds.contributionPercentage, 0),
    [keyDateSites]
  );

  // Build a map of siteId -> calculated progress from observed item data
  const siteProgressMap = useMemo(() => {
    const progressMap = new Map<string, number>();
    for (const entry of siteProgressData) {
      progressMap.set(entry.siteId, entry.calculatedProgress);
    }
    return progressMap;
  }, [siteProgressData]);

  // Get site by id
  const getSiteById = useCallback(
    (siteId: string) => allSites.find(s => s.id === siteId),
    [allSites]
  );

  // Get selected site name for display
  const selectedSiteName = useMemo(() => {
    if (!selectedSiteId) return 'Select Site';
    const site = allSites.find(s => s.id === selectedSiteId);
    return site?.name || 'Select Site';
  }, [selectedSiteId, allSites]);

  // ==================== Handlers ====================

  const handleAddSite = useCallback(async () => {
    if (!selectedSiteId) {
      setSnackbarMessage('Please select a site');
      return;
    }

    const contribution = parseFloat(newContribution);
    if (isNaN(contribution) || contribution <= 0 || contribution > 100) {
      setSnackbarMessage('Contribution must be between 1 and 100');
      return;
    }

    try {
      await database.write(async () => {
        await database.collections.get<KeyDateSiteModel>('key_date_sites').create((record: any) => {
          record.keyDateId = keyDate.id;
          record.siteId = selectedSiteId;
          record.contributionPercentage = contribution;
          record.progressPercentage = 0;
          record.status = 'not_started';
          record.plannedEndDate = keyDate.targetDate || null;
          record.updatedAt = Date.now();
          record.appSyncStatus = 'pending';
          record.version = 1;
        });

        // Update the site's plannedEndDate to match KD target date (if later or unset)
        const siteRecord = await database.collections.get<SiteModel>('sites').find(selectedSiteId);
        await siteRecord.update((s: any) => {
          const kdTargetDate = keyDate.targetDate;
          if (kdTargetDate && (!s.plannedEndDate || kdTargetDate > s.plannedEndDate)) {
            s.plannedEndDate = kdTargetDate;
          }
        });
      });
      setShowAddDialog(false);
      setSelectedSiteId(null);
      setNewContribution('');
      setSnackbarMessage('Site added successfully');
    } catch (error) {
      logger.error('Error adding site to key date', error as Error, {
        component: 'KeyDateSiteManager',
        action: 'handleAddSite',
      });
      setSnackbarMessage('Failed to add site');
    }
  }, [selectedSiteId, newContribution, keyDate.id]);

  const handleUpdateContribution = useCallback(async (id: string, contribution: string) => {
    const contributionValue = parseFloat(contribution);
    if (isNaN(contributionValue) || contributionValue <= 0 || contributionValue > 100) {
      setSnackbarMessage('Contribution must be between 1 and 100');
      return;
    }

    try {
      const association = await database.collections
        .get<KeyDateSiteModel>('key_date_sites')
        .find(id);
      await database.write(async () => {
        await association.update((record: any) => {
          record.contributionPercentage = contributionValue;
          record.updatedAt = Date.now();
        });
      });
      setSnackbarMessage('Contribution updated');
    } catch (error) {
      logger.error('Error updating contribution', error as Error, {
        component: 'KeyDateSiteManager',
        action: 'handleUpdateContribution',
      });
      setSnackbarMessage('Failed to update contribution');
    }
  }, []);

  const handleRemoveSite = useCallback(async (id: string) => {
    try {
      const association = await database.collections
        .get<KeyDateSiteModel>('key_date_sites')
        .find(id);
      await database.write(async () => {
        await association.markAsDeleted();
      });
      setSnackbarMessage('Site removed');
    } catch (error) {
      logger.error('Error removing site', error as Error, {
        component: 'KeyDateSiteManager',
        action: 'handleRemoveSite',
      });
      setSnackbarMessage('Failed to remove site');
    }
  }, []);

  // ==================== Render ====================

  const renderSiteAssociation = useCallback(
    ({ item }: { item: KeyDateSiteModel }) => (
      <SiteAssociationItem
        association={item}
        site={getSiteById(item.siteId)}
        calculatedProgress={siteProgressMap.get(item.siteId) ?? 0}
        onUpdateContribution={handleUpdateContribution}
        onRemove={handleRemoveSite}
      />
    ),
    [getSiteById, siteProgressMap, handleUpdateContribution, handleRemoveSite]
  );

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={styles.dialog}>
        <Dialog.Title>Manage Sites</Dialog.Title>
        <Dialog.Content>
          <Text style={styles.keyDateInfo}>
            {keyDate.code}: {keyDate.description}
          </Text>

          {/* Total Contribution Indicator */}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Contribution:</Text>
            <Chip
              mode="flat"
              style={[
                styles.totalChip,
                totalContribution === 100
                  ? styles.totalValid
                  : totalContribution > 100
                    ? styles.totalExceeds
                    : styles.totalIncomplete,
              ]}
            >
              {totalContribution}%
            </Chip>
          </View>

          {totalContribution !== 100 && (
            <Text style={styles.warningText}>
              {totalContribution > 100
                ? 'Total exceeds 100%. Please adjust contributions.'
                : 'Total should equal 100% for accurate progress tracking.'}
            </Text>
          )}

          <Divider style={styles.divider} />

          {/* Sites List */}
          {keyDateSites.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon name="map-marker-off-outline" size={48} color="#BDBDBD" />
              <Text style={styles.emptyText}>No sites associated</Text>
              <Text style={styles.emptySubtext}>
                Add sites to track progress contributions
              </Text>
            </View>
          ) : (
            <FlatList
              data={keyDateSites}
              keyExtractor={(item) => item.id}
              renderItem={renderSiteAssociation}
              style={styles.sitesList}
              showsVerticalScrollIndicator={false}
            />
          )}
        </Dialog.Content>

        <Dialog.Actions style={styles.dialogActions}>
          <Button
            mode="outlined"
            onPress={() => setShowAddDialog(true)}
            icon="plus"
            disabled={availableSites.length === 0}
          >
            Add Site
          </Button>
          <Button onPress={onDismiss}>Close</Button>
        </Dialog.Actions>
      </Dialog>

      {/* Add Site Dialog */}
      <Dialog visible={showAddDialog} onDismiss={() => setShowAddDialog(false)}>
        <Dialog.Title>Add Site</Dialog.Title>
        <Dialog.Content>
          <Text style={styles.addDialogLabel}>Select Site:</Text>
          <Menu
            visible={siteMenuVisible}
            onDismiss={() => setSiteMenuVisible(false)}
            anchor={
              <Button
                mode="outlined"
                onPress={() => setSiteMenuVisible(true)}
                style={styles.siteSelectButton}
                icon="chevron-down"
                contentStyle={styles.siteSelectContent}
              >
                {selectedSiteName}
              </Button>
            }
          >
            {availableSites.map((site) => (
              <Menu.Item
                key={site.id}
                onPress={() => {
                  setSelectedSiteId(site.id);
                  setSiteMenuVisible(false);
                }}
                title={site.name}
                description={site.location}
              />
            ))}
            {availableSites.length === 0 && (
              <Menu.Item title="No sites available" disabled />
            )}
          </Menu>

          <TextInput
            label="Contribution %"
            value={newContribution}
            onChangeText={setNewContribution}
            mode="outlined"
            keyboardType="numeric"
            style={styles.contributionInputDialog}
            placeholder="e.g., 50"
          />
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={() => setShowAddDialog(false)}>Cancel</Button>
          <Button onPress={handleAddSite} mode="contained">
            Add
          </Button>
        </Dialog.Actions>
      </Dialog>

      {/* Snackbar for feedback messages */}
      <Snackbar
        visible={!!snackbarMessage}
        onDismiss={() => setSnackbarMessage('')}
        duration={3000}
        action={{
          label: 'OK',
          onPress: () => setSnackbarMessage(''),
        }}
      >
        {snackbarMessage}
      </Snackbar>
    </Portal>
  );
};

// ==================== WatermelonDB Enhancement ====================

const enhance = withObservables(
  ['keyDate', 'projectId'],
  ({ keyDate, projectId }: KeyDateSiteManagerInputProps) => {
    const keyDateSites$ = database.collections
      .get<KeyDateSiteModel>('key_date_sites')
      .query(Q.where('key_date_id', keyDate.id))
      .observe();

    const siteProgressData$ = keyDateSites$.pipe(
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
                  calculatedProgress: calculateSiteProgressFromItems(items),
                }))
              )
          )
        );
      })
    );

    return {
      keyDateSites: keyDateSites$,
      allSites: database.collections
        .get<SiteModel>('sites')
        .query(Q.where('project_id', projectId))
        .observe(),
      siteProgressData: siteProgressData$,
    };
  }
);

export const KeyDateSiteManager = enhance(
  KeyDateSiteManagerComponent as React.ComponentType<KeyDateSiteManagerInputProps>
);

// ==================== Styles ====================

const styles = StyleSheet.create({
  dialog: {
    maxHeight: '85%',
  },
  keyDateInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  totalChip: {
    minWidth: 60,
  },
  totalValid: {
    backgroundColor: '#E8F5E9',
  },
  totalExceeds: {
    backgroundColor: '#FFEBEE',
  },
  totalIncomplete: {
    backgroundColor: '#FFF3E0',
  },
  warningText: {
    fontSize: 12,
    color: '#FF9800',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  divider: {
    marginVertical: 12,
  },
  sitesList: {
    maxHeight: 300,
  },
  siteItem: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: 'white',
  },
  siteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  siteInfo: {
    flex: 1,
  },
  siteName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  siteLocation: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  contributionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  contributionLabel: {
    fontSize: 13,
    color: '#666',
    marginRight: 8,
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contributionInput: {
    width: 60,
    height: 36,
  },
  percentSymbol: {
    marginLeft: 4,
    marginRight: 4,
    color: '#666',
  },
  contributionChip: {
    minHeight: 28,
  },
  progressChip: {
    minHeight: 28,
    backgroundColor: '#E3F2FD',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  progressLabel: {
    fontSize: 13,
    color: '#666',
    marginRight: 8,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    marginTop: 8,
  },
  statusChip: {
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#999',
    marginTop: 4,
    textAlign: 'center',
  },
  dialogActions: {
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  addDialogLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  siteSelectButton: {
    marginBottom: 12,
  },
  siteSelectContent: {
    flexDirection: 'row-reverse',
  },
  contributionInputDialog: {
    marginTop: 8,
  },
});

export default KeyDateSiteManager;
