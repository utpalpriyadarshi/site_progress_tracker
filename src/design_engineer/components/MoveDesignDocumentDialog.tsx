import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Dialog, Portal, Button, Text, Menu, Divider } from 'react-native-paper';
import { database } from '../../../models/database';
import { Q } from '@nozbe/watermelondb';
import { useDesignEngineerContext } from '../context/DesignEngineerContext';
import { DesignDocument } from '../types/DesignDocumentTypes';
import { logger } from '../../services/LoggingService';

interface MoveDesignDocumentDialogProps {
  visible: boolean;
  document: DesignDocument | null;
  onDismiss: () => void;
  onSuccess: (destinationSiteName: string) => void;
}

interface SiteOption {
  id: string;
  name: string;
}

const MoveDesignDocumentDialog: React.FC<MoveDesignDocumentDialogProps> = ({
  visible,
  document,
  onDismiss,
  onSuccess,
}) => {
  const { projectId } = useDesignEngineerContext();
  const [sites, setSites] = useState<SiteOption[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<string>('');
  const [selectedSiteName, setSelectedSiteName] = useState<string>('');
  const [siteMenuVisible, setSiteMenuVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && projectId) {
      loadSites();
    }
    if (!visible) {
      setSelectedSiteId('');
      setSelectedSiteName('');
    }
  }, [visible, projectId]);

  const loadSites = async () => {
    try {
      const sitesCollection = database.collections.get('sites');
      const sitesData = await sitesCollection
        .query(Q.where('project_id', projectId))
        .fetch();

      const sitesList = sitesData
        .map((site: any) => ({ id: site.id, name: site.name }))
        .filter((site) => site.id !== document?.siteId);

      setSites(sitesList);
    } catch (error) {
      logger.error('[MoveDocument] Error loading sites:', error as Error);
    }
  };

  const handleMove = async () => {
    if (!document || !selectedSiteId) return;

    setLoading(true);
    try {
      const docsCollection = database.collections.get('design_documents');
      const record = await docsCollection.find(document.id);

      await database.write(async () => {
        await record.update((rec: any) => {
          rec.siteId = selectedSiteId;
          rec.updatedAt = Date.now();
        });
      });

      logger.info('[MoveDocument] Document moved successfully', {
        documentId: document.id,
        fromSiteId: document.siteId,
        toSiteId: selectedSiteId,
      });

      onSuccess(selectedSiteName);
    } catch (error) {
      logger.error('[MoveDocument] Error moving document:', error as Error);
    } finally {
      setLoading(false);
    }
  };

  if (!document) return null;

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={styles.dialog}>
        <Dialog.Title>Move Document</Dialog.Title>
        <Dialog.Content>
          <View style={styles.previewSection}>
            <Text style={styles.label}>Document</Text>
            <Text style={styles.value}>{document.documentNumber} - {document.title}</Text>
          </View>

          <Divider style={styles.divider} />

          <View style={styles.previewSection}>
            <Text style={styles.label}>Current Site</Text>
            <Text style={styles.value}>{document.siteName || 'No site assigned'}</Text>
          </View>

          <Divider style={styles.divider} />

          <Text style={styles.label}>Destination Site</Text>
          <Menu
            visible={siteMenuVisible}
            onDismiss={() => setSiteMenuVisible(false)}
            anchor={
              <Button
                mode="outlined"
                onPress={() => setSiteMenuVisible(true)}
                style={styles.siteButton}
                icon="chevron-down"
                contentStyle={styles.siteButtonContent}
              >
                {selectedSiteName || 'Select destination site'}
              </Button>
            }
          >
            {sites.map((site) => (
              <Menu.Item
                key={site.id}
                onPress={() => {
                  setSelectedSiteId(site.id);
                  setSelectedSiteName(site.name);
                  setSiteMenuVisible(false);
                }}
                title={site.name}
              />
            ))}
            {sites.length === 0 && (
              <Menu.Item title="No other sites available" disabled />
            )}
          </Menu>

          {selectedSiteId && (
            <View style={styles.summaryBox}>
              <Text style={styles.summaryText}>
                Move "{document.documentNumber}" from{' '}
                <Text style={styles.bold}>{document.siteName || 'unassigned'}</Text>
                {' '}to <Text style={styles.bold}>{selectedSiteName}</Text>
              </Text>
            </View>
          )}
        </Dialog.Content>

        <Dialog.Actions>
          <Button onPress={onDismiss} disabled={loading}>Cancel</Button>
          <Button
            mode="contained"
            onPress={handleMove}
            disabled={!selectedSiteId || loading}
            loading={loading}
            style={styles.confirmButton}
          >
            Move
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

const styles = StyleSheet.create({
  dialog: {
    maxHeight: '80%',
  },
  previewSection: {
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    fontWeight: '600',
  },
  value: {
    fontSize: 14,
    color: '#1a1a1a',
  },
  divider: {
    marginVertical: 8,
  },
  siteButton: {
    marginTop: 4,
  },
  siteButtonContent: {
    flexDirection: 'row-reverse',
  },
  summaryBox: {
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  summaryText: {
    fontSize: 13,
    color: '#1565C0',
    lineHeight: 20,
  },
  bold: {
    fontWeight: 'bold',
  },
  confirmButton: {
    marginLeft: 8,
  },
});

export default MoveDesignDocumentDialog;
