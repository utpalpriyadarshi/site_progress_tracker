/**
 * DesignDocumentApprovalsScreen — Manager monitoring view for submitted design docs
 *
 * Shows documents submitted by the Design Engineer that are awaiting customer
 * approval. Manager role is read-only monitoring — status changes (approve /
 * reject / approve with comment) are made by the Design Engineer based on
 * customer response. Manager uses this view to track aging and escalate delays.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
} from 'react-native';
import {
  Text,
  Card,
  Chip,
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

  // ==================== Render ====================

  const renderItem = ({ item }: { item: PendingDoc }) => {
    const typeLabel = DOC_TYPE_LABELS[item.documentType] || item.documentType;
    const typeColor = DOC_TYPE_COLORS[item.documentType] || '#555';

    const daysPending = item.submittedDate
      ? Math.floor((Date.now() - item.submittedDate) / (1000 * 60 * 60 * 24))
      : null;
    const agingColor =
      daysPending === null ? '#888'
      : daysPending >= 14 ? COLORS.ERROR
      : daysPending >= 7  ? COLORS.WARNING
      : COLORS.SUCCESS;

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

          <View style={styles.agingRow}>
            {item.submittedDate ? (
              <Text style={styles.submittedDate}>
                Submitted: {new Date(item.submittedDate).toLocaleDateString()}
              </Text>
            ) : null}
            {daysPending !== null && (
              <Chip
                compact
                mode="flat"
                style={{ backgroundColor: agingColor + '20' }}
                textStyle={{ color: agingColor, fontSize: 10, fontWeight: 'bold' }}
              >
                {daysPending === 0 ? 'Today' : `${daysPending}d pending`}
              </Chip>
            )}
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
        {/* Info banner — explain read-only role */}
        <View style={styles.infoBanner}>
          <Text style={styles.infoText}>
            Submitted to customer for review. Status is updated by the Design Engineer when the customer responds.
          </Text>
        </View>

        {/* Header count bar */}
        {!loading && docs.length > 0 && (
          <View style={styles.headerBar}>
            <Text style={styles.headerText}>
              {docs.length} document{docs.length !== 1 ? 's' : ''} awaiting customer response
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
                title="No Documents Pending"
                message="No design documents are currently awaiting customer response. Documents submitted by the Design Engineer will appear here."
              />
            }
          />
        )}
      </View>
    </ErrorBoundary>
  );
};

// ==================== Styles ====================

const styles = StyleSheet.create({
  infoBanner: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#BBDEFB',
  },
  infoText: {
    fontSize: 12,
    color: '#1565C0',
    lineHeight: 17,
  },
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
    marginBottom: 4,
  },
  agingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  submittedDate: {
    fontSize: 11,
    color: '#888',
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
