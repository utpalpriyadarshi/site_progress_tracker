/**
 * DeliverySchedulingScreen
 *
 * Real-data delivery tracking screen.
 * Reads MaterialModel records from LogisticsContext and allows marking deliveries as received.
 * Status mapping: ordered → pending delivery, delivered/in_use → received, shortage → alert
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { Snackbar } from 'react-native-paper';
import { useLogistics } from './context/LogisticsContext';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import { COLORS } from '../theme/colors';
import MaterialModel from '../../models/MaterialModel';
import { database } from '../../models/database';
import { useSnackbar } from '../hooks/useSnackbar';

// ── Filter chips ──────────────────────────────────────────────────────────────

type StatusFilter = 'all' | 'ordered' | 'delivered' | 'shortage';

const FILTER_CHIPS: { id: StatusFilter; label: string; color: string }[] = [
  { id: 'all',      label: 'All',      color: COLORS.PRIMARY },
  { id: 'ordered',  label: 'Pending',  color: COLORS.WARNING },
  { id: 'delivered',label: 'Received', color: COLORS.SUCCESS },
  { id: 'shortage', label: 'Shortage', color: COLORS.ERROR },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const getStatusColor = (status: string) => {
  switch (status) {
    case 'ordered':   return COLORS.WARNING;
    case 'delivered': return COLORS.SUCCESS;
    case 'in_use':    return COLORS.INFO;
    case 'shortage':  return COLORS.ERROR;
    default:          return '#8E8E93';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'ordered':   return 'Pending Delivery';
    case 'delivered': return 'Delivered';
    case 'in_use':    return 'In Use';
    case 'shortage':  return 'Shortage';
    default:          return status;
  }
};

// ── Main Component ────────────────────────────────────────────────────────────

const DeliverySchedulingScreen: React.FC = () => {
  const { materials, refresh } = useLogistics();
  const { show: showSnackbar, snackbarProps } = useSnackbar();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [markingId, setMarkingId] = useState<string | null>(null);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const handleMarkAsReceived = useCallback(async (material: MaterialModel) => {
    Alert.alert(
      'Mark as Received',
      `Confirm receipt of "${material.name}" (${material.quantityRequired} ${material.unit})?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setMarkingId(material.id);
            try {
              await database.write(async () => {
                await material.update((rec: any) => {
                  rec.status = 'delivered';
                  rec.quantityAvailable = rec.quantityRequired;
                  rec._version = (rec._version || 1) + 1;
                  rec.appSyncStatus = 'pending';
                });
              });
              await refresh();
            } catch {
              showSnackbar('Could not update delivery status. Please try again.');
            } finally {
              setMarkingId(null);
            }
          },
        },
      ]
    );
  }, [refresh]);

  // Filter materials
  const filtered = materials.filter(m => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'ordered') return m.status === 'ordered';
    if (statusFilter === 'delivered') return m.status === 'delivered' || m.status === 'in_use';
    if (statusFilter === 'shortage') return m.status === 'shortage';
    return true;
  });

  // Stats
  const pending   = materials.filter(m => m.status === 'ordered').length;
  const received  = materials.filter(m => m.status === 'delivered' || m.status === 'in_use').length;
  const shortage  = materials.filter(m => m.status === 'shortage').length;

  return (
    <View style={styles.container}>

      {/* Stat Cards */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { borderTopColor: COLORS.WARNING }]}>
          <Text style={styles.statValue}>{pending}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={[styles.statCard, { borderTopColor: COLORS.SUCCESS }]}>
          <Text style={styles.statValue}>{received}</Text>
          <Text style={styles.statLabel}>Received</Text>
        </View>
        <View style={[styles.statCard, { borderTopColor: COLORS.ERROR }]}>
          <Text style={styles.statValue}>{shortage}</Text>
          <Text style={styles.statLabel}>Shortage</Text>
        </View>
        <View style={[styles.statCard, { borderTopColor: COLORS.PRIMARY }]}>
          <Text style={styles.statValue}>{materials.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
      </View>

      {/* Filter Chips */}
      <View style={styles.filterRow}>
        {FILTER_CHIPS.map(chip => {
          const active = statusFilter === chip.id;
          return (
            <TouchableOpacity
              key={chip.id}
              style={[styles.chip, active && { backgroundColor: chip.color }]}
              onPress={() => setStatusFilter(chip.id)}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {chip.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Material Cards */}
      <ScrollView
        style={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📦</Text>
            <Text style={styles.emptyTitle}>No deliveries found</Text>
            <Text style={styles.emptyMsg}>
              {statusFilter === 'all'
                ? 'Generate Logistics demo data to see materials.'
                : `No materials with "${statusFilter}" status.`}
            </Text>
          </View>
        ) : (
          filtered.map(material => {
            const statusColor = getStatusColor(material.status);
            const isPending = material.status === 'ordered';
            const isMarking = markingId === material.id;

            return (
              <View key={material.id} style={styles.card}>
                {/* Status bar */}
                <View style={[styles.cardAccent, { backgroundColor: statusColor }]} />

                <View style={styles.cardBody}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.materialName} numberOfLines={2}>{material.name}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: statusColor + '22' }]}>
                      <Text style={[styles.statusText, { color: statusColor }]}>
                        {getStatusLabel(material.status)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.cardDetails}>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Supplier</Text>
                      <Text style={styles.detailValue}>{material.supplier || '—'}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Required</Text>
                      <Text style={styles.detailValue}>{material.quantityRequired} {material.unit}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Available</Text>
                      <Text style={[styles.detailValue,
                        material.quantityAvailable < material.quantityRequired && { color: COLORS.ERROR }
                      ]}>
                        {material.quantityAvailable} {material.unit}
                      </Text>
                    </View>
                    {material.quantityUsed > 0 && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Used</Text>
                        <Text style={styles.detailValue}>{material.quantityUsed} {material.unit}</Text>
                      </View>
                    )}
                  </View>

                  {isPending && (
                    <TouchableOpacity
                      style={[styles.receiveBtn, isMarking && styles.receiveBtnDisabled]}
                      onPress={() => handleMarkAsReceived(material)}
                      disabled={isMarking}
                    >
                      <Text style={styles.receiveBtnText}>
                        {isMarking ? 'Updating...' : '✓  Mark as Received'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })
        )}
        <View style={styles.listFooter} />
      </ScrollView>
      <Snackbar {...snackbarProps} duration={3000} />
    </View>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container:          { flex: 1, backgroundColor: '#f5f5f5' },
  statsRow:           { flexDirection: 'row', padding: 12, gap: 8 },
  statCard:           { flex: 1, backgroundColor: '#fff', borderRadius: 8, padding: 10,
                        borderTopWidth: 3, alignItems: 'center',
                        elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2 },
  statValue:          { fontSize: 22, fontWeight: 'bold', color: '#1a1a1a' },
  statLabel:          { fontSize: 11, color: '#666', marginTop: 2 },
  filterRow:          { flexDirection: 'row', paddingHorizontal: 12, paddingBottom: 8, gap: 8 },
  chip:               { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16,
                        backgroundColor: '#f0f0f0', borderWidth: 1, borderColor: '#ddd' },
  chipText:           { fontSize: 13, color: '#555', fontWeight: '500' },
  chipTextActive:     { color: '#fff', fontWeight: '600' },
  list:               { flex: 1 },
  card:               { flexDirection: 'row', backgroundColor: '#fff', marginHorizontal: 12,
                        marginBottom: 10, borderRadius: 10,
                        elevation: 1, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 3,
                        overflow: 'hidden' },
  cardAccent:         { width: 4 },
  cardBody:           { flex: 1, padding: 14 },
  cardHeader:         { flexDirection: 'row', justifyContent: 'space-between',
                        alignItems: 'flex-start', marginBottom: 10, gap: 8 },
  materialName:       { flex: 1, fontSize: 15, fontWeight: '600', color: '#1a1a1a' },
  statusBadge:        { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  statusText:         { fontSize: 11, fontWeight: '600' },
  cardDetails:        { gap: 4, marginBottom: 10 },
  detailRow:          { flexDirection: 'row', justifyContent: 'space-between' },
  detailLabel:        { fontSize: 13, color: '#888' },
  detailValue:        { fontSize: 13, color: '#333', fontWeight: '500' },
  receiveBtn:         { backgroundColor: COLORS.SUCCESS, borderRadius: 8, paddingVertical: 10,
                        alignItems: 'center', marginTop: 4 },
  receiveBtnDisabled: { opacity: 0.5 },
  receiveBtnText:     { color: '#fff', fontWeight: '600', fontSize: 14 },
  emptyState:         { alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 },
  emptyIcon:          { fontSize: 48, marginBottom: 12 },
  emptyTitle:         { fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 8 },
  emptyMsg:           { fontSize: 14, color: '#666', textAlign: 'center' },
  listFooter:         { height: 24 },
});

// ── Export ────────────────────────────────────────────────────────────────────

const DeliverySchedulingScreenWithBoundary = () => (
  <ErrorBoundary name="Logistics - DeliverySchedulingScreen">
    <DeliverySchedulingScreen />
  </ErrorBoundary>
);

export default DeliverySchedulingScreenWithBoundary;
