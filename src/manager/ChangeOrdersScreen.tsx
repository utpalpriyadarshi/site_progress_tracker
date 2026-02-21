/**
 * ChangeOrdersScreen — Manager change order tracking
 *
 * Features:
 * - List change orders with status filter chips
 * - Create new change orders via FAB + dialog
 * - Submit, Approve, Reject actions inline
 * - Cost/schedule impact summary bar
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  FlatList,
  Alert,
} from 'react-native';
import {
  Text,
  FAB,
  Chip,
  Card,
  Button,
  Portal,
  Dialog,
  TextInput,
  Snackbar,
  ActivityIndicator,
} from 'react-native-paper';
import { database } from '../../models/database';
import { Q } from '@nozbe/watermelondb';
import { useManager } from './context/ManagerContext';
import { useAuth } from '../auth/AuthContext';
import { logger } from '../services/LoggingService';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import { EmptyState } from '../components/common/EmptyState';
import { COLORS } from '../theme/colors';
import { commonStyles } from '../styles/common';

type ChangeOrderStatus = 'draft' | 'submitted' | 'approved' | 'rejected';

interface ChangeOrder {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  impactCost: number;
  impactDays: number;
  status: ChangeOrderStatus;
  submittedById?: string;
  approvedById?: string;
  submittedAt?: number;
  approvedAt?: number;
  createdBy: string;
  createdAt: number;
}

const STATUS_CONFIG: Record<ChangeOrderStatus, { label: string; color: string }> = {
  draft:     { label: 'Draft',     color: '#9E9E9E' },
  submitted: { label: 'Submitted', color: COLORS.INFO },
  approved:  { label: 'Approved',  color: COLORS.SUCCESS },
  rejected:  { label: 'Rejected',  color: COLORS.ERROR },
};

const ALL_STATUSES: ChangeOrderStatus[] = ['draft', 'submitted', 'approved', 'rejected'];

const formatCost = (value: number): string => {
  if (value === 0) return '—';
  const sign = value > 0 ? '+' : '';
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${sign}₹${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}₹${(abs / 1_000).toFixed(0)}K`;
  return `${sign}₹${abs.toFixed(0)}`;
};

const formatDays = (value: number): string => {
  if (value === 0) return '—';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value}d`;
};

const EMPTY_FORM = {
  title: '',
  description: '',
  impactCost: '',
  impactDays: '',
};

const ChangeOrdersScreen = () => {
  const { projectId } = useManager();
  const { user } = useAuth();

  const [orders, setOrders] = useState<ChangeOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState<ChangeOrderStatus | null>(null);

  const [dialogVisible, setDialogVisible] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [snackbarMsg, setSnackbarMsg] = useState('');
  const [snackbarVisible, setSnackbarVisible] = useState(false);

  const showSnack = (msg: string) => {
    setSnackbarMsg(msg);
    setSnackbarVisible(true);
  };

  const loadOrders = useCallback(async () => {
    if (!projectId) {
      setLoading(false);
      return;
    }
    try {
      const col = database.collections.get('change_orders');
      const data = await col.query(Q.where('project_id', projectId)).fetch();
      const mapped: ChangeOrder[] = (data as any[]).map((rec) => ({
        id: rec.id,
        projectId: rec.projectId,
        title: rec.title,
        description: rec.description,
        impactCost: rec.impactCost,
        impactDays: rec.impactDays,
        status: rec.status as ChangeOrderStatus,
        submittedById: rec.submittedById,
        approvedById: rec.approvedById,
        submittedAt: rec.submittedAt,
        approvedAt: rec.approvedAt,
        createdBy: rec.createdBy,
        createdAt: rec.createdAt,
      }));
      // Sort newest first
      mapped.sort((a, b) => b.createdAt - a.createdAt);
      setOrders(mapped);
    } catch (err) {
      logger.error('[ChangeOrders] Load failed:', err as Error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleCreate = useCallback(async () => {
    if (!form.title.trim()) {
      Alert.alert('Validation', 'Title is required');
      return;
    }
    const costNum = parseFloat(form.impactCost) || 0;
    const daysNum = parseInt(form.impactDays, 10) || 0;

    setSaving(true);
    try {
      const col = database.collections.get('change_orders');
      await database.write(async () => {
        await col.create((rec: any) => {
          rec.projectId = projectId;
          rec.title = form.title.trim();
          rec.description = form.description.trim() || null;
          rec.impactCost = costNum;
          rec.impactDays = daysNum;
          rec.status = 'draft';
          rec.createdBy = user?.userId || '';
          rec.createdAt = Date.now();
          rec.updatedAt = Date.now();
          rec.appSyncStatus = 'pending';
          rec._version = 1;
        });
      });
      setDialogVisible(false);
      setForm(EMPTY_FORM);
      showSnack('Change order created');
      loadOrders();
    } catch (err) {
      logger.error('[ChangeOrders] Create failed:', err as Error);
      Alert.alert('Error', 'Failed to create change order');
    } finally {
      setSaving(false);
    }
  }, [form, projectId, user, loadOrders]);

  const handleStatusChange = useCallback(
    async (orderId: string, newStatus: ChangeOrderStatus) => {
      try {
        const col = database.collections.get('change_orders');
        const record = await col.find(orderId);
        await database.write(async () => {
          await record.update((rec: any) => {
            rec.status = newStatus;
            rec.updatedAt = Date.now();
            if (newStatus === 'submitted') {
              rec.submittedById = user?.userId || '';
              rec.submittedAt = Date.now();
            }
            if (newStatus === 'approved' || newStatus === 'rejected') {
              rec.approvedById = user?.userId || '';
              rec.approvedAt = Date.now();
            }
          });
        });
        showSnack(`Change order ${newStatus}`);
        loadOrders();
      } catch (err) {
        logger.error('[ChangeOrders] Status change failed:', err as Error);
        Alert.alert('Error', 'Failed to update status');
      }
    },
    [user, loadOrders],
  );

  const handleDelete = useCallback(
    (orderId: string) => {
      Alert.alert('Delete Change Order', 'Are you sure?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const col = database.collections.get('change_orders');
              const record = await col.find(orderId);
              await database.write(async () => {
                await record.markAsDeleted();
              });
              showSnack('Change order deleted');
              loadOrders();
            } catch (err) {
              logger.error('[ChangeOrders] Delete failed:', err as Error);
              Alert.alert('Error', 'Failed to delete change order');
            }
          },
        },
      ]);
    },
    [loadOrders],
  );

  const displayed = filterStatus
    ? orders.filter((o) => o.status === filterStatus)
    : orders;

  // Summary totals (approved only = confirmed impact)
  const approvedOrders = orders.filter((o) => o.status === 'approved');
  const totalCostImpact = approvedOrders.reduce((s, o) => s + o.impactCost, 0);
  const totalDaysImpact = approvedOrders.reduce((s, o) => s + o.impactDays, 0);
  const pendingCount = orders.filter((o) => o.status === 'submitted').length;

  const renderItem = ({ item }: { item: ChangeOrder }) => {
    const cfg = STATUS_CONFIG[item.status];
    return (
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.cardTopRow}>
            <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
            <Chip
              compact
              mode="flat"
              style={{ backgroundColor: cfg.color + '20' }}
              textStyle={{ color: cfg.color, fontSize: 11, fontWeight: 'bold' }}
            >
              {cfg.label}
            </Chip>
          </View>

          {item.description ? (
            <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
          ) : null}

          <View style={styles.impactRow}>
            <View style={styles.impactItem}>
              <Text style={styles.impactLabel}>Cost Impact</Text>
              <Text style={[
                styles.impactValue,
                { color: item.impactCost > 0 ? COLORS.ERROR : item.impactCost < 0 ? COLORS.SUCCESS : '#666' },
              ]}>
                {formatCost(item.impactCost)}
              </Text>
            </View>
            <View style={styles.impactItem}>
              <Text style={styles.impactLabel}>Schedule Impact</Text>
              <Text style={[
                styles.impactValue,
                { color: item.impactDays > 0 ? COLORS.ERROR : item.impactDays < 0 ? COLORS.SUCCESS : '#666' },
              ]}>
                {formatDays(item.impactDays)}
              </Text>
            </View>
            {item.submittedAt ? (
              <View style={styles.impactItem}>
                <Text style={styles.impactLabel}>Submitted</Text>
                <Text style={styles.impactDate}>
                  {new Date(item.submittedAt).toLocaleDateString()}
                </Text>
              </View>
            ) : null}
          </View>

          <View style={styles.actionRow}>
            {item.status === 'draft' && (
              <>
                <Button
                  compact
                  mode="contained"
                  onPress={() => handleStatusChange(item.id, 'submitted')}
                  style={styles.actionBtn}
                  labelStyle={styles.actionBtnLabel}
                >
                  Submit
                </Button>
                <Button
                  compact
                  mode="outlined"
                  onPress={() => handleDelete(item.id)}
                  textColor={COLORS.ERROR}
                  style={styles.actionBtn}
                  labelStyle={styles.actionBtnLabel}
                >
                  Delete
                </Button>
              </>
            )}
            {item.status === 'submitted' && (
              <>
                <Button
                  compact
                  mode="contained"
                  onPress={() => handleStatusChange(item.id, 'approved')}
                  style={[styles.actionBtn, { backgroundColor: COLORS.SUCCESS }]}
                  labelStyle={styles.actionBtnLabel}
                >
                  Approve
                </Button>
                <Button
                  compact
                  mode="outlined"
                  onPress={() => handleStatusChange(item.id, 'rejected')}
                  textColor={COLORS.ERROR}
                  style={styles.actionBtn}
                  labelStyle={styles.actionBtnLabel}
                >
                  Reject
                </Button>
              </>
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
        {/* Header summary */}
        {orders.length > 0 && (
          <View style={styles.summaryBar}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Approved Cost</Text>
              <Text style={[styles.summaryValue, { color: totalCostImpact > 0 ? COLORS.ERROR : COLORS.SUCCESS }]}>
                {formatCost(totalCostImpact)}
              </Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Approved Delay</Text>
              <Text style={[styles.summaryValue, { color: totalDaysImpact > 0 ? COLORS.ERROR : COLORS.SUCCESS }]}>
                {formatDays(totalDaysImpact)}
              </Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Pending Review</Text>
              <Text style={[styles.summaryValue, { color: pendingCount > 0 ? COLORS.WARNING : '#333' }]}>
                {pendingCount}
              </Text>
            </View>
          </View>
        )}

        {/* Status filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterContent}
        >
          <Chip
            compact
            mode={filterStatus === null ? 'flat' : 'outlined'}
            selected={filterStatus === null}
            onPress={() => setFilterStatus(null)}
            style={styles.filterChip}
          >
            All ({orders.length})
          </Chip>
          {ALL_STATUSES.map((s) => {
            const count = orders.filter((o) => o.status === s).length;
            if (count === 0) return null;
            return (
              <Chip
                key={s}
                compact
                mode={filterStatus === s ? 'flat' : 'outlined'}
                selected={filterStatus === s}
                onPress={() => setFilterStatus(s)}
                style={[styles.filterChip, filterStatus === s && { backgroundColor: STATUS_CONFIG[s].color + '20' }]}
                textStyle={filterStatus === s ? { color: STATUS_CONFIG[s].color, fontWeight: 'bold' } : undefined}
              >
                {STATUS_CONFIG[s].label} ({count})
              </Chip>
            );
          })}
        </ScrollView>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={COLORS.PRIMARY} />
          </View>
        ) : (
          <FlatList
            data={displayed}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            onRefresh={() => { setRefreshing(true); loadOrders(); }}
            refreshing={refreshing}
            ListEmptyComponent={
              <EmptyState
                icon="file-document-edit-outline"
                title="No Change Orders"
                message={filterStatus ? `No ${STATUS_CONFIG[filterStatus].label} change orders` : 'Create your first change order to track scope changes and their impact on cost and schedule.'}
                actionText={filterStatus ? 'Clear Filter' : 'Create Change Order'}
                onAction={filterStatus ? () => setFilterStatus(null) : () => setDialogVisible(true)}
                variant={filterStatus ? 'default' : 'large'}
              />
            }
          />
        )}

        <FAB
          icon="plus"
          label="New Change Order"
          style={styles.fab}
          onPress={() => setDialogVisible(true)}
        />

        {/* Create Dialog */}
        <Portal>
          <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)} style={styles.dialog}>
            <Dialog.Title>New Change Order</Dialog.Title>
            <Dialog.ScrollArea style={styles.dialogScrollArea}>
              <ScrollView>
                <TextInput
                  label="Title *"
                  value={form.title}
                  onChangeText={(v) => setForm((f) => ({ ...f, title: v }))}
                  mode="outlined"
                  style={styles.input}
                />
                <TextInput
                  label="Description"
                  value={form.description}
                  onChangeText={(v) => setForm((f) => ({ ...f, description: v }))}
                  mode="outlined"
                  style={styles.input}
                  multiline
                  numberOfLines={3}
                />
                <TextInput
                  label="Cost Impact (₹ — positive = increase)"
                  value={form.impactCost}
                  onChangeText={(v) => setForm((f) => ({ ...f, impactCost: v }))}
                  mode="outlined"
                  style={styles.input}
                  keyboardType="numbers-and-punctuation"
                  placeholder="e.g. 50000 or -20000"
                />
                <TextInput
                  label="Schedule Impact (days — positive = delay)"
                  value={form.impactDays}
                  onChangeText={(v) => setForm((f) => ({ ...f, impactDays: v }))}
                  mode="outlined"
                  style={styles.input}
                  keyboardType="numbers-and-punctuation"
                  placeholder="e.g. 5 or -2"
                />
              </ScrollView>
            </Dialog.ScrollArea>
            <Dialog.Actions>
              <Button onPress={() => setDialogVisible(false)} disabled={saving}>Cancel</Button>
              <Button onPress={handleCreate} loading={saving} disabled={saving}>Create</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>

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

const styles = StyleSheet.create({
  summaryBar: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    borderRadius: 10,
    padding: 12,
    elevation: 2,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryLabel: {
    fontSize: 11,
    color: '#888',
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  summaryDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#E0E0E0',
  },
  filterScroll: {
    maxHeight: 48,
    marginTop: 8,
  },
  filterContent: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center',
  },
  filterChip: {
    marginRight: 4,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
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
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
    lineHeight: 20,
  },
  cardDesc: {
    fontSize: 13,
    color: '#555',
    marginBottom: 8,
  },
  impactRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  impactItem: {
    alignItems: 'center',
    minWidth: 80,
  },
  impactLabel: {
    fontSize: 10,
    color: '#888',
    marginBottom: 2,
  },
  impactValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  impactDate: {
    fontSize: 12,
    color: '#666',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  actionBtn: {
    borderRadius: 6,
  },
  actionBtnLabel: {
    fontSize: 12,
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
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.PRIMARY,
  },
  dialog: {
    maxHeight: '80%',
  },
  dialogScrollArea: {
    paddingHorizontal: 0,
  },
  input: {
    marginBottom: 12,
    marginHorizontal: 24,
  },
});

export default ChangeOrdersScreen;
