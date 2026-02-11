/**
 * CopyDesignDocumentsDialog.tsx
 *
 * Dialog for copying design documents between sites
 * Similar to CopyItemsDialog pattern
 *
 * Features:
 * - Site selector dropdown (excludes source site)
 * - Preview with document counts
 * - Warning if destination has existing documents
 * - Duplicate detection integration
 * - Loading states for async operations
 * - Info banner about reset behavior
 *
 * @version 1.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Dialog, Portal, Button, Text, Menu, ActivityIndicator, Divider } from 'react-native-paper';
import { database } from '../../../models/database';
import { Q } from '@nozbe/watermelondb';
import SiteModel from '../../../models/SiteModel';
import { useDesignEngineerContext } from '../context/DesignEngineerContext';
import { countSiteDocuments, detectDuplicates, copyDocuments } from '../../services/DesignDocumentCopyService';
import { logger } from '../../services/LoggingService';

// ==================== Types ====================

export interface CopyDesignDocumentsDialogProps {
  /** Dialog visibility */
  visible: boolean;

  /** Source site ID to copy from */
  sourceSiteId: string;

  /** Source site name for display */
  sourceSiteName: string;

  /** Number of documents in source site */
  sourceDocumentCount: number;

  /** Callback when dialog should close */
  onClose: () => void;

  /** Callback when copy succeeds */
  onSuccess: (copiedCount: number, destinationSiteName: string) => void;

  /** Callback when duplicates are found */
  onDuplicatesFound: (
    duplicates: string[],
    proceedWithCopy: (skipDuplicates: boolean, selectedDuplicates: string[]) => void
  ) => void;
}

// ==================== Component ====================

export const CopyDesignDocumentsDialog: React.FC<CopyDesignDocumentsDialogProps> = ({
  visible,
  sourceSiteId,
  sourceSiteName,
  sourceDocumentCount,
  onClose,
  onSuccess,
  onDuplicatesFound,
}) => {
  const { engineerId } = useDesignEngineerContext();

  // ==================== State ====================

  const [sites, setSites] = useState<SiteModel[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<string>('');
  const [selectedSiteName, setSelectedSiteName] = useState<string>('Select destination site');
  const [siteMenuVisible, setSiteMenuVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);
  const [destinationDocumentCount, setDestinationDocumentCount] = useState<number>(0);

  // ==================== Effects ====================

  /**
   * Fetch available destination sites (exclude source site)
   */
  useEffect(() => {
    if (!visible) return;

    const fetchSites = async () => {
      try {
        logger.debug('Fetching destination sites', {
          component: 'CopyDesignDocumentsDialog',
          action: 'fetchSites',
          engineerId,
          sourceSiteId,
        });

        const allSites = await database.collections
          .get<SiteModel>('sites')
          .query(Q.where('design_engineer_id', engineerId))
          .fetch();

        // Exclude source site from available destinations
        const availableSites = allSites.filter(site => site.id !== sourceSiteId);
        setSites(availableSites);

        logger.debug('Destination sites fetched', {
          component: 'CopyDesignDocumentsDialog',
          availableCount: availableSites.length,
          totalCount: allSites.length,
        });

      } catch (error) {
        logger.error('Failed to fetch sites', error as Error, {
          component: 'CopyDesignDocumentsDialog',
          action: 'fetchSites',
        });
      }
    };

    fetchSites();
  }, [visible, engineerId, sourceSiteId]);

  /**
   * Count documents in destination site when selected
   */
  useEffect(() => {
    if (!selectedSiteId) {
      setDestinationDocumentCount(0);
      return;
    }

    const countDocuments = async () => {
      const count = await countSiteDocuments(selectedSiteId);
      setDestinationDocumentCount(count);

      logger.debug('Destination document count fetched', {
        component: 'CopyDesignDocumentsDialog',
        destinationSiteId: selectedSiteId,
        documentCount: count,
      });
    };

    countDocuments();
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
      component: 'CopyDesignDocumentsDialog',
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
        component: 'CopyDesignDocumentsDialog',
        action: 'handleCopy',
        sourceSiteId,
        destinationSiteId: selectedSiteId,
        sourceDocumentCount,
      });

      // 1. Check for duplicates
      const duplicates = await detectDuplicates(sourceSiteId, selectedSiteId);
      setCheckingDuplicates(false);

      if (duplicates.length > 0) {
        // Show duplicate dialog via callback
        logger.info('Duplicates found, showing duplicate dialog', {
          component: 'CopyDesignDocumentsDialog',
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
          component: 'CopyDesignDocumentsDialog',
        });

        await executeCopy(false, []);
      }

    } catch (error) {
      logger.error('Copy operation failed', error as Error, {
        component: 'CopyDesignDocumentsDialog',
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
  const executeCopy = async (skipDuplicates: boolean, duplicateNumbers: string[]) => {
    setLoading(true);

    try {
      logger.info('Executing copy operation', {
        component: 'CopyDesignDocumentsDialog',
        action: 'executeCopy',
        skipDuplicates,
        duplicateCount: duplicateNumbers.length,
      });

      const result = await copyDocuments({
        sourceSiteId,
        destinationSiteId: selectedSiteId,
        skipDuplicates,
        duplicateNumbers,
      });

      if (result.success) {
        logger.info('Copy operation successful', {
          component: 'CopyDesignDocumentsDialog',
          ...result,
        });

        onSuccess(result.documentsCopied, selectedSiteName);
        onClose();

      } else {
        logger.error('Copy operation failed', new Error(result.errors?.join(', ')), {
          component: 'CopyDesignDocumentsDialog',
          ...result,
        });

        // Error will be shown via parent snackbar/alert
        throw new Error(result.errors?.join(', ') || 'Copy failed');
      }

    } catch (error) {
      logger.error('Execute copy failed', error as Error, {
        component: 'CopyDesignDocumentsDialog',
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
          Copy <Text style={styles.highlight}>{sourceDocumentCount} documents</Text> from{' '}
          <Text style={styles.highlight}>{sourceSiteName}</Text> to{' '}
          <Text style={styles.highlight}>{selectedSiteName}</Text>
        </Text>

        {/* Warning if destination has documents */}
        {destinationDocumentCount > 0 && (
          <View style={styles.warningBox}>
            <Text variant="bodySmall" style={styles.warningText}>
              ⚠️ {selectedSiteName} already has {destinationDocumentCount} documents. Copying will add {sourceDocumentCount} new documents.
            </Text>
          </View>
        )}

        {/* Info about reset behavior */}
        <View style={styles.resetNotice}>
          <Text variant="bodySmall" style={styles.resetText}>
            📝 Note: Copied documents will have:
          </Text>
          <Text variant="bodySmall" style={styles.resetText}>
            • Status reset to "Draft"
          </Text>
          <Text variant="bodySmall" style={styles.resetText}>
            • Approval fields cleared
          </Text>
          <Text variant="bodySmall" style={styles.resetText}>
            • Revision number preserved
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
          {checkingDuplicates ? 'Checking for duplicates...' : 'Copying documents...'}
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
        <Dialog.Title style={styles.title}>Copy Documents to Another Site</Dialog.Title>

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
    color: '#2196F3',
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
    backgroundColor: '#E3F2FD',
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

export default CopyDesignDocumentsDialog;
