import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, ListRenderItemInfo } from 'react-native';
import { Dialog, Portal, Text, Button, ActivityIndicator, Divider } from 'react-native-paper';
import { database } from '../../../models/database';
import { Q } from '@nozbe/watermelondb';
import DoorsRevisionModel from '../../../models/DoorsRevisionModel';
import { logger } from '../../services/LoggingService';
import { COLORS } from '../../theme/colors';

interface RevisionEntry {
  id: string;
  versionNumber: number;
  changeSummary: string;
  changedAt: number;
  changedById: string;
  snapshotJson: string;
}

interface DoorsRevisionHistorySheetProps {
  visible: boolean;
  onDismiss: () => void;
  doorsPackageId: string;
  doorsId: string;
}

const formatDate = (ts: number) =>
  new Date(ts).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

interface RevisionItemProps {
  item: RevisionEntry;
  isFirst: boolean;
  showLine: boolean;
}

const RevisionSeparator = () => <Divider style={styles.separator} />;

const RevisionItemRenderer: React.FC<RevisionItemProps> = ({ item, isFirst, showLine }) => {
  let snapshot: Record<string, unknown> = {};
  try { snapshot = JSON.parse(item.snapshotJson); } catch (_) { /* ignore */ }

  return (
    <View style={styles.revisionRow}>
      <View style={styles.timelineLeft}>
        <View style={[styles.dot, isFirst && styles.dotActive]} />
        {showLine && <View style={styles.line} />}
      </View>
      <View style={styles.revisionContent}>
        <View style={styles.revisionHeader}>
          <Text style={styles.summary}>{item.changeSummary}</Text>
          <View style={styles.versionBadge}>
            <Text style={styles.versionText}>v{item.versionNumber}</Text>
          </View>
        </View>
        <Text style={styles.timestamp}>{formatDate(item.changedAt)}</Text>
        {snapshot.status ? (
          <Text style={styles.snapshotText}>Status before: {String(snapshot.status)}</Text>
        ) : null}
      </View>
    </View>
  );
};

const DoorsRevisionHistorySheet: React.FC<DoorsRevisionHistorySheetProps> = ({
  visible,
  onDismiss,
  doorsPackageId,
  doorsId,
}) => {
  const [revisions, setRevisions] = useState<RevisionEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible || !doorsPackageId) return;
    setLoading(true);
    database.collections
      .get<DoorsRevisionModel>('doors_revisions')
      .query(
        Q.where('doors_package_id', doorsPackageId),
        Q.sortBy('changed_at', Q.desc),
      )
      .fetch()
      .then((rows) => {
        setRevisions(
          rows.map((r) => ({
            id: r.id,
            versionNumber: r.versionNumber,
            changeSummary: r.changeSummary,
            changedAt: r.changedAt,
            changedById: r.changedById,
            snapshotJson: r.snapshotJson,
          })),
        );
      })
      .catch((err) => logger.error('[DoorsRevisions] Error loading revisions:', err))
      .finally(() => setLoading(false));
  }, [visible, doorsPackageId]);

  const renderRevisionItem = useCallback(
    ({ item, index }: ListRenderItemInfo<RevisionEntry>) => (
      <RevisionItemRenderer
        item={item}
        isFirst={index === 0}
        showLine={index < revisions.length - 1}
      />
    ),
    [revisions.length],
  );

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={styles.dialog}>
        <Dialog.Title style={styles.dialogTitle}>
          Revision History — {doorsId}
        </Dialog.Title>
        <Dialog.Content style={styles.dialogContent}>
          {loading ? (
            <ActivityIndicator style={styles.loader} />
          ) : revisions.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No revision history yet.</Text>
              <Text style={styles.emptySubText}>
                Changes will appear here after the package is edited or its status is updated.
              </Text>
            </View>
          ) : (
            <FlatList
              data={revisions}
              keyExtractor={(item) => item.id}
              renderItem={renderRevisionItem}
              ItemSeparatorComponent={RevisionSeparator}
              style={styles.list}
            />
          )}
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss}>Close</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

const styles = StyleSheet.create({
  dialog: {
    maxHeight: '80%',
  },
  dialogTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  dialogContent: {
    paddingHorizontal: 8,
  },
  loader: {
    marginVertical: 32,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 13,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
  },
  list: {
    maxHeight: 420,
  },
  separator: {
    marginVertical: 4,
  },
  revisionRow: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  timelineLeft: {
    width: 24,
    alignItems: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.BORDER,
    marginTop: 4,
  },
  dotActive: {
    backgroundColor: COLORS.PRIMARY,
  },
  line: {
    flex: 1,
    width: 2,
    backgroundColor: COLORS.BORDER,
    marginTop: 4,
  },
  revisionContent: {
    flex: 1,
    paddingLeft: 12,
    paddingBottom: 8,
  },
  revisionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  summary: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  versionBadge: {
    backgroundColor: COLORS.PRIMARY_LIGHT,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  versionText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.PRIMARY,
  },
  timestamp: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 4,
  },
  snapshotText: {
    fontSize: 12,
    color: COLORS.TEXT_TERTIARY,
    fontStyle: 'italic',
  },
});

export default DoorsRevisionHistorySheet;
