/**
 * DesignDocumentApprovalsScreen — Manager approval queue for submitted design docs
 *
 * Features:
 * - Lists all submitted design documents for the current project
 * - Approve / Approve with comment / Reject inline actions
 * - Reactive via withChangesForTables (auto-refreshes without flicker)
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  FlatList,
  Alert,
  StyleSheet,
} from 'react-native';
import {
  Text,
  Card,
  Chip,
  Button,
  Snackbar,
  ActivityIndicator,
} from 'react-native-paper';
import { database } from '../../models/database';
import { Q } from '@nozbe/watermelondb';
import { useManagerContext } from './context/ManagerContext';
import { logger } from '../services/LoggingService';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import { EmptyState } from '../components/common/EmptyState';
import { COLORS } from '../theme/colors';
import { commonStyles } from '../styles/common';

// ==================== Types ====================

interface PendingDoc {
  id: string;
  documentNumber: string;
  title: string;
  documentType: string;
  siteId?: string;
  siteName?: string;
  submittedDate?: number;
  projectId: string;
}

// ==================== Constants ====================

const DOC_TYPE_LABELS: Record<string, string> = {
  simulation_study: 'Simulation/Study',
  installation: 'Installation',
  product_equipment: 'Product/Equipment',
  as_built: 'As-Built Design',
};

const DOC_TYPE_COLORS: Record<string, string> = {
  simulation_study: '#7B1FA2',
  installation: '#1565C0',
  product_equipment: '#E65100',
  as_built: '#2E7D32',
};

// ==================== Screen ====================

const DesignDocumentApprovalsScreen = () => {
  const { projectId } = useManagerContext();

  const [docs, setDocs] = useState<PendingDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [snackbarMsg, setSnackbarMsg] = useState('');
  const [snackbarVisible, setSnackbarVisible] = useState(false);

  const showSnack = (msg: string) => {
    setSnackbarMsg(msg);
    setSnackbarVisible(true);
  };

  // Load submitted docs, optionally silently (no loading skeleton flash)
  const loadDocs = useCallback(async (silent = false) => {
    if (!projectId) {
      setLoading(false);
      return;
    }
    if (!silent) setLoading(true);
    try {
      const col = database.collections.get('design_documents');
      const records = await col
        .query(
          Q.where('project_id', projectId),
          Q.where('status', 'submitted')
        )
        .fetch();

      // Batch-load site names
      const siteIds = [...new Set((records as any[]).map((r) => r.siteId).filter(Boolean))];
      const siteNameMap: Record<string, string> = {};
      if (siteIds.length > 0) {
        try {
          const sitesCol = database.collections.get('sites');
          const siteRecords = await sitesCol
            .query(Q.where('id', Q.oneOf(siteIds)))
            .fetch();
          (siteRecords as any[]).forEach((s) => {
            siteNameMap[s.id] = s.name;
          });
        } catch {
          // Ignore site load errors
        }
      }

      const mapped: PendingDoc[] = (records as any[]).map((rec) => ({
        id: rec.id,
        documentNumber: rec.documentNumber,
        title: rec.title,
        documentType: rec.documentType,
        siteId: rec.siteId,
        siteName: rec.siteId ? siteNameMap[rec.siteId] : undefined,
        submittedDate: rec.submittedDate,
        projectId: rec.projectId,
      }));

      // Sort by submitted date, oldest first (review queue)
      mapped.sort((a, b) => (a.submittedDate || 0) - (b.submittedDate || 0));
      setDocs(mapped);
    } catch (err) {
      logger.error('[DocApprovals] Load failed:', err as Error);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [projectId]);

  // Initial load
  useEffect(() => {
    loadDocs();
  }, [loadDocs]);

  // Reactive: auto-reload when design_documents change
  useEffect(() => {
    if (!projectId) return;
    const subscription = database
      .withChangesForTables(['design_documents'])
      .subscribe(() => loadDocs(true));
    return () => subscription.unsubscribe();
  }, [projectId, loadDocs]);

  // ==================== Actions ====================

  const handleApprove = useCallback(async (docId: string) => {
    try {
      const col = database.collections.get('design_documents');
      const record = await col.find(docId);
      await database.write(async () => {
        await record.update((rec: any) => {
          rec.status = 'approved';
          rec.approvedDate = Date.now();
          rec.approvalComment = null;
          rec.appSyncStatus = 'pending';
          rec._version = (rec._version || 1) + 1;
        });
      });
      showSnack('Document approved');
    } catch (err) {
      logger.error('[DocApprovals] Approve failed:', err as Error);
      Alert.alert('Error', 'Failed to approve document');
    }
  }, []);

  const handleApproveWithComment = useCallback((docId: string) => {
    Alert.prompt(
      'Approve with Comment',
      'Enter an optional comment for the engineer:',
      async (comment) => {
        try {
          const col = database.collections.get('design_documents');
          const record = await col.find(docId);
          await database.write(async () => {
            await record.update((rec: any) => {
              rec.status = 'approved_with_comment';
              rec.approvedDate = Date.now();
              rec.approvalComment = comment || null;
              rec.appSyncStatus = 'pending';
              rec._version = (rec._version || 1) + 1;
            });
          });
          showSnack('Document approved with comment');
        } catch (err) {
          logger.error('[DocApprovals] Approve-with-comment failed:', err as Error);
          Alert.alert('Error', 'Failed to approve document');
        }
      },
      'plain-text',
      '',
    );
  }, []);

  const handleReject = useCallback((docId: string) => {
    Alert.prompt(
      'Reject Document',
      'Please provide a reason for rejection:',
      async (comment) => {
        try {
          const col = database.collections.get('design_documents');
          const record = await col.find(docId);
          await database.write(async () => {
            await record.update((rec: any) => {
              rec.status = 'rejected';
              rec.approvedDate = Date.now();
              rec.approvalComment = comment || null;
              rec.appSyncStatus = 'pending';
              rec._version = (rec._version || 1) + 1;
            });
          });
          showSnack('Document rejected');
        } catch (err) {
          logger.error('[DocApprovals] Reject failed:', err as Error);
          Alert.alert('Error', 'Failed to reject document');
        }
      },
      'plain-text',
      '',
    );
  }, []);

  // ==================== Render ====================

  const renderItem = ({ item }: { item: PendingDoc }) => {
    const typeLabel = DOC_TYPE_LABELS[item.documentType] || item.documentType;
    const typeColor = DOC_TYPE_COLORS[item.documentType] || '#555';

    return (
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.cardTopRow}>
            <View style={styles.docInfo}>
              <Text style={styles.docNumber}>{item.documentNumber}</Text>
              <Text style={styles.docTitle} numberOfLines={2}>{item.title}</Text>
            </View>
            <Chip
              compact
              mode="flat"
              style={{ backgroundColor: typeColor + '20' }}
              textStyle={{ color: typeColor, fontSize: 10, fontWeight: 'bold' }}
            >
              {typeLabel}
            </Chip>
          </View>

          {item.siteName ? (
            <Text style={styles.siteName}>Site: {item.siteName}</Text>
          ) : null}

          {item.submittedDate ? (
            <Text style={styles.submittedDate}>
              Submitted: {new Date(item.submittedDate).toLocaleDateString()}
            </Text>
          ) : null}

          <View style={styles.actionRow}>
            <Button
              compact
              mode="contained"
              onPress={() => handleApprove(item.id)}
              style={[styles.actionBtn, { backgroundColor: COLORS.SUCCESS }]}
              labelStyle={styles.actionBtnLabel}
            >
              Approve
            </Button>
            <Button
              compact
              mode="contained"
              onPress={() => handleApproveWithComment(item.id)}
              style={[styles.actionBtn, { backgroundColor: '#FF9800' }]}
              labelStyle={styles.actionBtnLabel}
            >
              Approve ✱
            </Button>
            <Button
              compact
              mode="outlined"
              onPress={() => handleReject(item.id)}
              textColor={COLORS.ERROR}
              style={styles.actionBtn}
              labelStyle={styles.actionBtnLabel}
            >
              Reject
            </Button>
          </View>
        </Card.Content>
      </Card>
    );
  };

  if (!projectId) {
    return (
      <View style={commonStyles.screen}>
        <Text style={styles.errorText}>No project assigned</Text>
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <View style={commonStyles.screen}>
        {/* Header count bar */}
        {!loading && docs.length > 0 && (
          <View style={styles.headerBar}>
            <Text style={styles.headerText}>
              {docs.length} document{docs.length !== 1 ? 's' : ''} pending review
            </Text>
          </View>
        )}

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={COLORS.PRIMARY} />
          </View>
        ) : (
          <FlatList
            data={docs}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <EmptyState
                icon="file-check-outline"
                title="No Pending Approvals"
                message="No design documents are awaiting approval. Documents submitted by the design engineer will appear here."
              />
            }
          />
        )}

        <Snackbar
          visible={snackbarVisible}
          onDismiss={() => setSnackbarVisible(false)}
          duration={3000}
          action={{ label: 'Dismiss', onPress: () => setSnackbarVisible(false) }}
        >
          {snackbarMsg}
        </Snackbar>
      </View>
    </ErrorBoundary>
  );
};

// ==================== Styles ====================

const styles = StyleSheet.create({
  headerBar: {
    backgroundColor: COLORS.PRIMARY + '15',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.PRIMARY + '30',
  },
  headerText: {
    fontSize: 13,
    color: COLORS.PRIMARY,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    marginBottom: 12,
    elevation: 2,
    borderRadius: 8,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 6,
  },
  docInfo: {
    flex: 1,
  },
  docNumber: {
    fontSize: 11,
    color: '#888',
    marginBottom: 2,
    fontFamily: 'monospace',
  },
  docTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    lineHeight: 20,
  },
  siteName: {
    fontSize: 12,
    color: '#555',
    marginBottom: 2,
  },
  submittedDate: {
    fontSize: 11,
    color: '#888',
    marginBottom: 8,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  actionBtn: {
    borderRadius: 6,
  },
  actionBtnLabel: {
    fontSize: 11,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: COLORS.ERROR,
    fontSize: 16,
    textAlign: 'center',
    padding: 32,
  },
});

export default DesignDocumentApprovalsScreen;
