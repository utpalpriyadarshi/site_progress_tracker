/**
 * RetentionMonitorScreen
 *
 * Shows per-invoice retention records split into Client and Vendor tabs.
 * Tracks cumulative retention held, DLP expiry, release eligibility, and BG in lieu.
 * Aging analysis highlights retention held >6 months and >12 months.
 *
 * @since v53 — Sprint 2: Retention Tracking
 */

import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { Chip, SegmentedButtons, Divider, Button } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useCommercial } from '../context/CommercialContext';
import { useAuth } from '../../auth/AuthContext';
import { database } from '../../../models/database';
import { Q } from '@nozbe/watermelondb';
import { logger } from '../../services/LoggingService';
import { formatCurrency } from '../cost-tracking/utils/costFormatters';
import { COLORS } from '../../theme/colors';

// ==================== Types ====================

interface RetentionRow {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  partyType: 'client' | 'vendor';
  grossInvoiceAmount: number;
  retentionPct: number;
  retentionAmount: number;
  dlpEndDate?: number;
  releasedDate?: number;
  releasedAmount?: number;
  bgInLieu: boolean;
  bgReference?: string;
  createdAt: number;
}

const agingColor = (createdAt: number): string => {
  const months = (Date.now() - createdAt) / (1000 * 60 * 60 * 24 * 30);
  if (months > 12) return COLORS.ERROR;
  if (months > 6) return COLORS.WARNING;
  return COLORS.SUCCESS;
};

const agingLabel = (createdAt: number): string => {
  const months = Math.floor((Date.now() - createdAt) / (1000 * 60 * 60 * 24 * 30));
  if (months < 1) return '<1 mo';
  return `${months} mo`;
};

// ==================== Main Screen ====================

const RetentionMonitorScreen: React.FC = () => {
  const { projectId } = useCommercial();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'client' | 'vendor'>('client');
  const [allRows, setAllRows] = useState<RetentionRow[]>([]);
  const [dlpMonths, setDlpMonths] = useState(24);

  const loadData = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const [projectArr, retentionsArr] = await Promise.all([
        database.collections.get('projects').query(Q.where('id', projectId)).fetch(),
        database.collections.get('retentions').query(
          Q.where('project_id', projectId),
          Q.sortBy('created_at', Q.desc)
        ).fetch(),
      ]);

      const project: any = projectArr[0];
      setDlpMonths(project?.dlpMonths ?? 24);

      // Fetch invoice numbers for display
      const invoiceIds = [...new Set((retentionsArr as any[]).map((r: any) => r.invoiceId))];
      const invoiceMap: Record<string, string> = {};
      if (invoiceIds.length > 0) {
        const invoices = await database.collections.get('invoices').query(
          Q.where('id', Q.oneOf(invoiceIds))
        ).fetch();
        for (const inv of invoices as any[]) {
          invoiceMap[inv.id] = inv.invoiceNumber;
        }
      }

      const rows: RetentionRow[] = (retentionsArr as any[]).map((r: any) => ({
        id: r.id,
        invoiceId: r.invoiceId,
        invoiceNumber: invoiceMap[r.invoiceId] ?? '—',
        partyType: r.partyType,
        grossInvoiceAmount: r.grossInvoiceAmount,
        retentionPct: r.retentionPct,
        retentionAmount: r.retentionAmount,
        dlpEndDate: r.dlpEndDate,
        releasedDate: r.releasedDate,
        releasedAmount: r.releasedAmount,
        bgInLieu: r.bgInLieu,
        bgReference: r.bgReference,
        createdAt: r.createdAt ?? Date.now(),
      }));

      setAllRows(rows);
    } catch (err) {
      logger.error('[RetentionMonitor] Load error:', err as Error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Toggle BG in lieu ──────────────────────────────────
  const handleToggleBG = useCallback(async (row: RetentionRow) => {
    try {
      await database.write(async () => {
        const rec = await database.collections.get('retentions').find(row.id);
        await (rec as any).update((r: any) => {
          r.bgInLieu = !row.bgInLieu;
          r.bgReference = row.bgInLieu ? null : `BG-${row.invoiceNumber}`;
          r.updatedAt = Date.now();
        });
      });
      await loadData();
    } catch (err) {
      logger.error('[RetentionMonitor] Toggle BG error:', err as Error);
    }
  }, [loadData]);

  // ── Mark as released ───────────────────────────────────
  const handleRelease = useCallback(async (row: RetentionRow) => {
    Alert.alert(
      'Release Retention',
      `Release ₹${(row.retentionAmount / 1_00_000).toFixed(2)}L held against ${row.invoiceNumber}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Release',
          onPress: async () => {
            try {
              await database.write(async () => {
                const rec = await database.collections.get('retentions').find(row.id);
                await (rec as any).update((r: any) => {
                  r.releasedDate = Date.now();
                  r.releasedAmount = row.retentionAmount;
                  r.updatedAt = Date.now();
                });
              });
              await loadData();
            } catch (err) {
              logger.error('[RetentionMonitor] Release error:', err as Error);
            }
          },
        },
      ]
    );
  }, [loadData]);

  // ── Filtered rows ──────────────────────────────────────
  const rows = allRows.filter(r => r.partyType === tab);
  const held = rows.filter(r => !r.releasedDate);
  const released = rows.filter(r => !!r.releasedDate);

  const totalHeld = held.reduce((s, r) => s + r.retentionAmount, 0);
  const totalReleased = released.reduce((s, r) => s + (r.releasedAmount ?? 0), 0);
  const eligibleForRelease = held.filter(r =>
    r.dlpEndDate ? Date.now() > r.dlpEndDate : false
  );
  const eligibleAmount = eligibleForRelease.reduce((s, r) => s + r.retentionAmount, 0);

  // Aging buckets
  const over12m = held.filter(r => (Date.now() - r.createdAt) > 12 * 30 * 24 * 3600 * 1000).length;
  const over6m = held.filter(r => {
    const months = (Date.now() - r.createdAt) / (30 * 24 * 3600 * 1000);
    return months > 6 && months <= 12;
  }).length;

  // ── Render row ────────────────────────────────────────
  const renderRow = ({ item }: { item: RetentionRow }) => {
    const isReleased = !!item.releasedDate;
    const isDLPExpired = item.dlpEndDate ? Date.now() > item.dlpEndDate : false;
    const color = agingColor(item.createdAt);

    return (
      <View style={[styles.retCard, isReleased && styles.releasedCard]}>
        <View style={styles.retCardHeader}>
          <View>
            <Text style={styles.invoiceRef}>{item.invoiceNumber}</Text>
            <Text style={styles.grossText}>
              Gross: {formatCurrency(item.grossInvoiceAmount)} · {item.retentionPct}%
            </Text>
          </View>
          <View style={styles.retBadges}>
            <Chip
              style={[styles.agingChip, { backgroundColor: color + '20' }]}
              textStyle={[styles.agingChipText, { color }]}
            >
              {agingLabel(item.createdAt)}
            </Chip>
            {item.bgInLieu && (
              <Chip style={styles.bgChip} textStyle={styles.bgChipText}>BG</Chip>
            )}
          </View>
        </View>

        <View style={styles.retAmounts}>
          <View style={styles.retAmtItem}>
            <Text style={styles.retAmtLabel}>Retention Held</Text>
            <Text style={[styles.retAmtValue, { color: isReleased ? COLORS.SUCCESS : COLORS.ERROR }]}>
              {formatCurrency(item.retentionAmount)}
            </Text>
          </View>
          {item.dlpEndDate && (
            <View style={styles.retAmtItem}>
              <Text style={styles.retAmtLabel}>DLP Ends</Text>
              <Text style={[styles.retAmtValue, { color: isDLPExpired ? COLORS.SUCCESS : '#333' }]}>
                {new Date(item.dlpEndDate).toLocaleDateString()}
              </Text>
            </View>
          )}
          {isReleased && (
            <View style={styles.retAmtItem}>
              <Text style={styles.retAmtLabel}>Released</Text>
              <Text style={[styles.retAmtValue, { color: COLORS.SUCCESS }]}>
                {formatCurrency(item.releasedAmount ?? 0)}
              </Text>
            </View>
          )}
        </View>

        {!isReleased && (
          <View style={styles.retActions}>
            <Button
              compact
              mode="outlined"
              onPress={() => handleToggleBG(item)}
              style={styles.retActionBtn}
            >
              {item.bgInLieu ? 'Remove BG' : 'BG in Lieu'}
            </Button>
            {isDLPExpired && !item.bgInLieu && (
              <Button
                compact
                mode="contained"
                onPress={() => handleRelease(item)}
                style={styles.retActionBtn}
              >
                Release
              </Button>
            )}
          </View>
        )}
        {isReleased && (
          <Text style={styles.releasedText}>
            Released on {new Date(item.releasedDate!).toLocaleDateString()}
          </Text>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading retention data…</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={rows}
      keyExtractor={item => item.id}
      renderItem={renderRow}
      contentContainerStyle={styles.listContent}
      ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
      ListHeaderComponent={
        <>
          {/* Tab switcher */}
          <SegmentedButtons
            value={tab}
            onValueChange={v => setTab(v as 'client' | 'vendor')}
            buttons={[
              { value: 'client', label: 'Client Retention', icon: 'bank' },
              { value: 'vendor', label: 'Vendor Retention', icon: 'account-hard-hat' },
            ]}
            style={styles.tabs}
          />

          {/* Summary */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>
              {tab === 'client' ? 'Client Holds from Us' : 'We Hold from Vendors'}
            </Text>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Total Held</Text>
                <Text style={[styles.summaryValue, { color: COLORS.ERROR }]}>
                  {formatCurrency(totalHeld)}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Released</Text>
                <Text style={[styles.summaryValue, { color: COLORS.SUCCESS }]}>
                  {formatCurrency(totalReleased)}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Eligible Now</Text>
                <Text style={[styles.summaryValue, { color: eligibleAmount > 0 ? COLORS.WARNING : '#aaa' }]}>
                  {formatCurrency(eligibleAmount)}
                </Text>
              </View>
            </View>

            {/* Aging summary */}
            {(over6m > 0 || over12m > 0) && (
              <View style={styles.agingSummary}>
                {over12m > 0 && (
                  <View style={[styles.agingBadge, { backgroundColor: COLORS.ERROR + '20' }]}>
                    <Icon name="alert-circle" size={14} color={COLORS.ERROR} />
                    <Text style={[styles.agingBadgeText, { color: COLORS.ERROR }]}>
                      {over12m} record{over12m > 1 ? 's' : ''} {'>'} 12 months
                    </Text>
                  </View>
                )}
                {over6m > 0 && (
                  <View style={[styles.agingBadge, { backgroundColor: COLORS.WARNING + '20' }]}>
                    <Icon name="clock-alert" size={14} color={COLORS.WARNING} />
                    <Text style={[styles.agingBadgeText, { color: COLORS.WARNING }]}>
                      {over6m} record{over6m > 1 ? 's' : ''} 6–12 months
                    </Text>
                  </View>
                )}
              </View>
            )}

            <Text style={styles.dlpNote}>
              DLP period: {dlpMonths} months from invoice date · Tap row to release after DLP
            </Text>
          </View>

          {held.length > 0 && <Text style={styles.sectionLabel}>Outstanding Retention</Text>}
        </>
      }
      ListFooterComponent={
        released.length > 0 ? (
          <>
            <Divider style={{ marginVertical: 12 }} />
            <Text style={styles.sectionLabel}>Released</Text>
            {released.map(item => renderRow({ item }))}
            <View style={{ height: 24 }} />
          </>
        ) : null
      }
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <Icon name="shield-check" size={48} color={COLORS.DISABLED} />
          <Text style={styles.emptyText}>No {tab} retention records</Text>
          <Text style={styles.emptySubText}>
            Retention is auto-created when KD billing invoices are raised
          </Text>
        </View>
      }
    />
  );
};

// ==================== Styles ====================

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: '#666' },
  listContent: { padding: 12, paddingBottom: 24 },

  tabs: { marginBottom: 12 },

  summaryCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2,
  },
  summaryTitle: { fontSize: 14, fontWeight: '700', marginBottom: 10 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryItem: { flex: 1 },
  summaryLabel: { fontSize: 10, color: '#888', marginBottom: 2 },
  summaryValue: { fontSize: 14, fontWeight: '800' },

  agingSummary: { gap: 6, marginBottom: 8 },
  agingBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: 6, paddingHorizontal: 10, paddingVertical: 6,
  },
  agingBadgeText: { fontSize: 12, fontWeight: '600' },
  dlpNote: { fontSize: 11, color: '#888', marginTop: 4, fontStyle: 'italic' },

  sectionLabel: { fontSize: 13, fontWeight: '700', color: '#555', marginBottom: 8 },

  retCard: {
    backgroundColor: '#fff', borderRadius: 10, padding: 14, elevation: 1,
    borderLeftWidth: 4, borderLeftColor: COLORS.ERROR,
  },
  releasedCard: { borderLeftColor: COLORS.SUCCESS, opacity: 0.85 },
  retCardHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10,
  },
  invoiceRef: { fontSize: 14, fontWeight: '700', color: '#333' },
  grossText: { fontSize: 11, color: '#888', marginTop: 2 },
  retBadges: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  agingChip: {},
  agingChipText: { fontSize: 10 },
  bgChip: { backgroundColor: COLORS.INFO + '20' },
  bgChipText: { fontSize: 10, color: COLORS.INFO },

  retAmounts: { flexDirection: 'row', gap: 16, marginBottom: 10 },
  retAmtItem: {},
  retAmtLabel: { fontSize: 10, color: '#888', marginBottom: 2 },
  retAmtValue: { fontSize: 13, fontWeight: '700' },

  retActions: { flexDirection: 'row', gap: 8 },
  retActionBtn: { flex: 1 },
  releasedText: { fontSize: 12, color: COLORS.SUCCESS, fontStyle: 'italic' },

  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 10 },
  emptyText: { fontSize: 15, color: '#888' },
  emptySubText: { fontSize: 12, color: '#aaa', textAlign: 'center', paddingHorizontal: 24 },
});

export default RetentionMonitorScreen;
