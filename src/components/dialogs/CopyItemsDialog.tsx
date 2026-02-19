/**
 * CopyItemsDialog.tsx
 *
 * Dialog for selecting destination site and initiating copy operation
 * Part of Phase 4: Copy Items Between Sites Feature
 *
 * Features:
 * - Site selector dropdown (excludes source site)
 * - Preview with item counts
 * - Warning if destination has existing items
 * - Duplicate detection integration
 * - Loading states for async operations
 * - Info banner about reset behavior
 *
 * @version 1.0 - Phase 4
 */

import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Dialog, Portal, Button, Text, Menu, ActivityIndicator, Divider } from 'react-native-paper';
import { database } from '../../../models/database';
import { Q } from '@nozbe/watermelondb';
import SiteModel from '../../../models/SiteModel';
import { useSiteContext } from '../../supervisor/context/SiteContext';
import { countSiteItems, detectDuplicates, copyItems } from '../../services/ItemCopyService';
import { logger } from '../../services/LoggingService';
import { COLORS } from '../../theme/colors';

// ==================== Types ====================

export interface CopyItemsDialogProps {
  /** Dialog visibility */
  visible: boolean;

  /** Source site ID to copy from */
  sourceSiteId: string;

  /** Source site name for display */
  sourceSiteName: string;

  /** Number of items in source site */
  sourceItemCount: number;

  /** Callback when dialog should close */
  onClose: () => void;

  /** Callback when copy succeeds */
  onSuccess: (copiedCount: number, destinationSiteName: string) => void;

  /** Callback when duplicates are found (allows parent to show duplicate dialog) */
  onDuplicatesFound: (
    duplicates: string[],
    proceedWithCopy: (skipDuplicates: boolean, selectedDuplicates: string[]) => void
  ) => void;
}

// ==================== Component ====================

/**
 * CopyItemsDialog Component
 */
export const CopyItemsDialog: React.FC<CopyItemsDialogProps> = ({
  visible,
  sourceSiteId,
  sourceSiteName,
  sourceItemCount,
  onClose,
  onSuccess,
  onDuplicatesFound,
}) => {
  const { supervisorId } = useSiteContext();

  // ==================== State ====================

  const [sites, setSites] = useState<SiteModel[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<string>('');
  const [selectedSiteName, setSelectedSiteName] = useState<string>('Select destination site');
  const [siteMenuVisible, setSiteMenuVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);
  const [destinationItemCount, setDestinationItemCount] = useState<number>(0);

  // ==================== Effects ====================

  /**
   * Fetch available destination sites (exclude source site)
   */
  useEffect(() => {
    if (!visible) return;

    const fetchSites = async () => {
      try {
        logger.debug('Fetching destination sites', {
          component: 'CopyItemsDialog',
          action: 'fetchSites',
          supervisorId,
          sourceSiteId,
        });

        const allSites = await database.collections
          .get<SiteModel>('sites')
          .query(Q.where('supervisor_id', supervisorId))
          .fetch();

        // Exclude source site from available destinations
        const availableSites = allSites.filter(site => site.id !== sourceSiteId);
        setSites(availableSites);

        logger.debug('Destination sites fetched', {
          component: 'CopyItemsDialog',
          availableCount: availableSites.length,
          totalCount: allSites.length,
        });

      } catch (error) {
        logger.error('Failed to fetch sites', error as Error, {
          component: 'CopyItemsDialog',
          action: 'fetchSites',
        });
      }
    };

    fetchSites();
  }, [visible, supervisorId, sourceSiteId]);

  /**
   * Count items in destination site when selected
   */
  useEffect(() => {
    if (!selectedSiteId) {
      setDestinationItemCount(0);
      return;
    }

    const countItems = async () => {
      const count = await countSiteItems(selectedSiteId);
      setDestinationItemCount(count);

      logger.debug('Destination item count fetched', {
        component: 'CopyItemsDialog',
        destinationSiteId: selectedSiteId,
        itemCount: count,
      });
    };

    countItems();
  }, [selectedSiteId]);

  // ==================== Validation ====================

  const canCopy = useMemo(() => {
    return selectedSiteId !== '' && !loading;
  }, [selectedSiteId, loading]);

  // ==================== Handlers ====================

  /**
   * Handle site selection from dropdown
   */
  const handleSiteSelect = (site: SiteModel) => {
    setSelectedSiteId(site.id);
    setSelectedSiteName(site.name);
    setSiteMenuVisible(false);

    logger.debug('Destination site selected', {
      component: 'CopyItemsDialog',
      siteId: site.id,
      siteName: site.name,
    });
  };

  /**
   * Handle copy button click
   * Checks for duplicates first, then either shows duplicate dialog or proceeds with copy
   */
  const handleCopy = async () => {
    if (!canCopy) return;

    setLoading(true);
    setCheckingDuplicates(true);

    try {
      logger.info('Starting copy operation', {
        component: 'CopyItemsDialog',
        action: 'handleCopy',
        sourceSiteId,
        destinationSiteId: selectedSiteId,
        sourceItemCount,
      });

      // 1. Check for duplicates
      const duplicates = await detectDuplicates(sourceSiteId, selectedSiteId);
      setCheckingDuplicates(false);

      if (duplicates.length > 0) {
        // Show duplicate dialog via callback
        logger.info('Duplicates found, showing duplicate dialog', {
          component: 'CopyItemsDialog',
          duplicateCount: duplicates.length,
          duplicates,
        });

        setLoading(false);

        // Pass callback to parent to handle duplicate resolution
        onDuplicatesFound(duplicates, async (skipDuplicates, selectedDuplicates) => {
          // Resume copy after duplicate resolution
          await executeCopy(skipDuplicates, selectedDuplicates);
        });

      } else {
        // No duplicates, proceed with copy
        logger.info('No duplicates found, proceeding with copy', {
          component: 'CopyItemsDialog',
        });

        await executeCopy(false, []);
      }

    } catch (error) {
      logger.error('Copy operation failed', error as Error, {
        component: 'CopyItemsDialog',
        action: 'handleCopy',
      });

      setLoading(false);
      setCheckingDuplicates(false);
    }
  };

  /**
   * Execute copy operation
   * Called either directly (no duplicates) or after duplicate dialog resolves
   */
  const executeCopy = async (skipDuplicates: boolean, duplicateNames: string[]) => {
    setLoading(true);

    try {
      logger.info('Executing copy operation', {
        component: 'CopyItemsDialog',
        action: 'executeCopy',
        skipDuplicates,
        duplicateCount: duplicateNames.length,
      });

      const result = await copyItems({
        sourceSiteId,
        destinationSiteId: selectedSiteId,
        skipDuplicates,
        duplicateNames,
      });

      if (result.success) {
        logger.info('Copy operation successful', {
          component: 'CopyItemsDialog',
          ...result,
        });

        onSuccess(result.itemsCopied, selectedSiteName);
        onClose();

      } else {
        logger.error('Copy operation failed', new Error(result.errors?.join(', ')), {
          component: 'CopyItemsDialog',
          ...result,
        });

        // Error will be shown via parent snackbar
        throw new Error(result.errors?.join(', ') || 'Copy failed');
      }

    } catch (error) {
      logger.error('Execute copy failed', error as Error, {
        component: 'CopyItemsDialog',
        action: 'executeCopy',
      });

      throw error; // Re-throw to be handled by parent

    } finally {
      setLoading(false);
    }
  };

  // ==================== Render Helpers ====================

  /**
   * Render site selector dropdown
   */
  const renderSiteSelector = () => (
    <View style={styles.section}>
      <Text variant="labelLarge" style={styles.label}>
        Destination Site *
      </Text>
      <Menu
        visible={siteMenuVisible}
        onDismiss={() => setSiteMenuVisible(false)}
        anchor={
          <Button
            mode="outlined"
            onPress={() => setSiteMenuVisible(true)}
            icon="map-marker"
            contentStyle={styles.selectorButton}
            disabled={loading}
          >
            {selectedSiteName}
          </Button>
        }
      >
        {sites.map((site) => (
          <Menu.Item
            key={site.id}
            onPress={() => handleSiteSelect(site)}
            title={site.name}
            leadingIcon={selectedSiteId === site.id ? 'check' : 'map-marker-outline'}
          />
        ))}

        {sites.length === 0 && (
          <Menu.Item
            title="No other sites available"
            disabled
          />
        )}
      </Menu>
    </View>
  );

  /**
   * Render copy preview with counts and warnings
   */
  const renderPreview = () => {
    if (!selectedSiteId) return null;

    return (
      <View style={styles.section}>
        <Divider style={styles.divider} />

        {/* Copy preview text */}
        <Text variant="bodyMedium" style={styles.previewText}>
          Copy <Text style={styles.highlight}>{sourceItemCount} items</Text> from{' '}
          <Text style={styles.highlight}>{sourceSiteName}</Text> to{' '}
          <Text style={styles.highlight}>{selectedSiteName}</Text>
        </Text>

        {/* Warning if destination has items */}
        {destinationItemCount > 0 && (
          <View style={styles.warningBox}>
            <Text variant="bodySmall" style={styles.warningText}>
              ⚠️ {selectedSiteName} already has {destinationItemCount} items. Copying will add {sourceItemCount} new items.
            </Text>
          </View>
        )}

        {/* Info about reset behavior */}
        <View style={styles.resetNotice}>
          <Text variant="bodySmall" style={styles.resetText}>
            📝 Note: Copied items will have:
          </Text>
          <Text variant="bodySmall" style={styles.resetText}>
            • Completed quantity reset to 0
          </Text>
          <Text variant="bodySmall" style={styles.resetText}>
            • Status reset to "Not Started"
          </Text>
        </View>
      </View>
    );
  };

  /**
   * Render loading indicator
   */
  const renderLoading = () => {
    if (!loading) return null;

    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text variant="bodySmall" style={styles.loadingText}>
          {checkingDuplicates ? 'Checking for duplicates...' : 'Copying items...'}
        </Text>
      </View>
    );
  };

  // ==================== Main Render ====================

  return (
    <Portal>
      <Dialog
        visible={visible}
        onDismiss={onClose}
        style={styles.dialog}
        dismissable={!loading}
      >
        <Dialog.Title style={styles.title}>Copy Items to Another Site</Dialog.Title>

        <Dialog.ScrollArea style={styles.scrollArea}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={true}
          >
            {renderSiteSelector()}
            {renderPreview()}
            {renderLoading()}
          </ScrollView>
        </Dialog.ScrollArea>

        <Dialog.Actions style={styles.actions}>
          <Button onPress={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            mode="contained"
            onPress={handleCopy}
            disabled={!canCopy}
            loading={loading}
            style={styles.copyButton}
          >
            {checkingDuplicates ? 'Checking...' : 'Copy'}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

// ==================== Styles ====================

const styles = StyleSheet.create({
  dialog: {
    maxWidth: 500,
    alignSelf: 'center',
    width: '90%',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  scrollArea: {
    paddingHorizontal: 0,
    maxHeight: 500,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  section: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
    fontWeight: '600',
  },
  selectorButton: {
    justifyContent: 'flex-start',
  },
  divider: {
    marginVertical: 16,
  },
  previewText: {
    marginBottom: 12,
    lineHeight: 22,
  },
  highlight: {
    fontWeight: 'bold',
    color: COLORS.INFO,
  },
  warningBox: {
    backgroundColor: '#FFF3CD',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FFA726',
  },
  warningText: {
    color: '#856404',
    lineHeight: 18,
  },
  resetNotice: {
    backgroundColor: COLORS.INFO_BG,
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  resetText: {
    color: '#1976D2',
    lineHeight: 18,
  },
  loadingContainer: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  loadingText: {
    marginTop: 8,
    color: '#666',
  },
  actions: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  copyButton: {
    marginLeft: 8,
  },
});

// Export as default for backward compatibility
export default CopyItemsDialog;
