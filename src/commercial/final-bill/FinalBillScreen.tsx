/**
 * FinalBillScreen
 *
 * DLP & Final Bill Closure tracker:
 * - Project DLP status (Open / DLP Running / Closure Ready / Closed)
 * - DLP end date from last KD completion + dlpMonths
 * - Retention eligible for release (DLP expired + not yet released)
 * - Final bill summary: all invoices + eligible retention + unapproved VO value
 * - Commercial closure checklist (manual toggles)
 *
 * Sprint 4 — Commercial Advanced Billing
 */

import React, { useCallback, useEffect, useReducer } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Switch, Chip, Divider } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { database } from '../../../models/database';
import { Q } from '@nozbe/watermelondb';
import { logger } from '../../services/LoggingService';
import { useCommercial } from '../context/CommercialContext';
import ErrorBoundary from '../../components/common/ErrorBoundary';
import { COLORS } from '../../theme/colors';

// ==================== Types ====================

type DLPStatus = 'open' | 'dlp_running' | 'closure_ready' | 'closed';

interface RetentionRow {
  id: string;
  invoiceNumber: string;
  gross: number;
  retentionPct: number;
  retentionAmount: number;
  dlpEndDate?: number;
  releasedDate?: number;
  releasedAmount?: number;
  bgInLieu: boolean;
  isExpired: boolean;    // DLP end date has passed
  isReleased: boolean;
  holdingMonths: number;
}

interface ClosureCheck {
  id: string;
  label: string;
  autoChecked: boolean;
  checked: boolean;
  detail?: string;
}

interface FinalBillSummary {
  contractValue: number;
  totalInvoicedGross: number;
  totalRetentionHeld: number;
  totalRetentionReleased: number;
  retentionEligibleNow: number;
  pendingVOValue: number;
  dlpEndDate: number | null;
  dlpStatus: DLPStatus;
  allKDsCompleted: boolean;
  finalBillEstimate: number; // pending retention + eligible VO value
}

interface State {
  summary: FinalBillSummary | null;
  retentions: RetentionRow[];
  closureChecks: ClosureCheck[];
  loading: boolean;
}

type Action =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_DATA'; summary: FinalBillSummary; retentions: RetentionRow[]; closureChecks: ClosureCheck[] }
  | { type: 'TOGGLE_CHECK'; checkId: string }
  | { type: 'RELEASE_RETENTION'; retId: string };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_LOADING': return { ...state, loading: action.payload };
    case 'SET_DATA':
      return { ...state, summary: action.summary, retentions: action.retentions, closureChecks: action.closureChecks, loading: false };
    case 'TOGGLE_CHECK':
      return {
        ...state,
        closureChecks: state.closureChecks.map(c =>
          c.id === action.checkId && !c.autoChecked ? { ...c, checked: !c.checked } : c
        ),
      };
    case 'RELEASE_RETENTION':
      return {
        ...state,
        retentions: state.retentions.map(r =>
          r.id === action.retId ? { ...r, isReleased: true, releasedDate: Date.now(), releasedAmount: r.retentionAmount } : r
        ),
      };
    default: return state;
  }
}

const initialState: State = { summary: null, retentions: [], closureChecks: [], loading: true };

// ==================== Helpers ====================

const formatCr = (val: number) => `₹${(val / 1_00_00_000).toFixed(2)} Cr`;
const formatL = (val: number) => `₹${(val / 1_00_000).toFixed(2)} L`;

const DLP_STATUS_CONFIG: Record<DLPStatus, { color: string; label: string; icon: string; bg: string }> = {
  open:          { color: '#666',    label: 'Open — Works in progress',    icon: 'circle-outline',     bg: '#f0f0f0' },
  dlp_running:   { color: '#FF9500', label: 'DLP Running',                 icon: 'clock-fast',         bg: '#FFF3CD' },
  closure_ready: { color: '#34C759', label: 'Closure Ready',               icon: 'check-decagram',     bg: '#D4EDDA' },
  closed:        { color: '#007AFF', label: 'Commercially Closed',         icon: 'check-decagram-outline', bg: '#CCE5FF' },
};

// ==================== Main Screen ====================

const FinalBillScreen: React.FC = () => {
  const { projectId } = useCommercial();
  const [state, dispatch] = useReducer(reducer, initialState);

  const loadData = useCallback(async () => {
    if (!projectId) { dispatch({ type: 'SET_LOADING', payload: false }); return; }
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const now = Date.now();

      const [projectArr, keyDates, allInvoices, allRetentions, allVOs, allAdvances] = await Promise.all([
        database.collections.get('projects').query().fetch() as Promise<any[]>,
        database.collections.get('key_dates').query(Q.where('project_id', projectId)).fetch() as Promise<any[]>,
        database.collections.get('invoices').query(Q.where('project_id', projectId)).fetch() as Promise<any[]>,
        database.collections.get('retentions').query(
          Q.where('project_id', projectId), Q.where('party_type', 'client')
        ).fetch() as Promise<any[]>,
        database.collections.get('variation_orders').query(Q.where('project_id', projectId)).fetch() as Promise<any[]>,
        database.collections.get('advances').query(Q.where('project_id', projectId)).fetch() as Promise<any[]>,
      ]);

      const project: any = projectArr.find((p: any) => p.id === projectId);
      const contractValue: number = project?.contractValue ?? 0;
      const dlpMonths: number = project?.dlpMonths ?? 24;

      // DLP end date = last KD actualDate (or targetDate) + dlpMonths
      const completedKDs = (keyDates as any[]).filter(k => k.status === 'completed');
      const allKDsCompleted = completedKDs.length === keyDates.length && keyDates.length > 0;

      let dlpEndDate: number | null = null;
      if (completedKDs.length > 0) {
        const lastCompletionDate = Math.max(...completedKDs.map(k => k.actualDate ?? k.targetDate ?? 0));
        dlpEndDate = lastCompletionDate + dlpMonths * 30 * 24 * 60 * 60 * 1000;
      }

      // DLP Status
      let dlpStatus: DLPStatus = 'open';
      if (allKDsCompleted && dlpEndDate !== null) {
        if (now > dlpEndDate) {
          dlpStatus = 'closure_ready'; // needs manual "Closed" toggle from checklist
        } else {
          dlpStatus = 'dlp_running';
        }
      }

      // Retention rows
      const retentionRows: RetentionRow[] = await Promise.all(
        (allRetentions as any[]).map(async (ret) => {
          // Try to find invoice number
          let invoiceNumber = ret.invoiceId ?? 'INV-???';
          try {
            const inv = await database.collections.get('invoices').find(ret.invoiceId);
            invoiceNumber = (inv as any).invoiceNumber;
          } catch { /* ignore */ }

          const isExpired = ret.dlpEndDate ? ret.dlpEndDate < now : false;
          const isReleased = !!ret.releasedDate;
          const holdingMs = now - (ret.createdAt ?? now);
          const holdingMonths = Math.floor(holdingMs / (30 * 24 * 60 * 60 * 1000));

          return {
            id: ret.id,
            invoiceNumber,
            gross: ret.grossInvoiceAmount,
            retentionPct: ret.retentionPct,
            retentionAmount: ret.retentionAmount,
            dlpEndDate: ret.dlpEndDate,
            releasedDate: ret.releasedDate,
            releasedAmount: ret.releasedAmount,
            bgInLieu: ret.bgInLieu,
            isExpired,
            isReleased,
            holdingMonths,
          };
        })
      );

      const totalRetentionHeld = retentionRows.filter(r => !r.isReleased).reduce((s, r) => s + r.retentionAmount, 0);
      const totalRetentionReleased = retentionRows.filter(r => r.isReleased).reduce((s, r) => s + (r.releasedAmount ?? 0), 0);
      const retentionEligibleNow = retentionRows.filter(r => !r.isReleased && r.isExpired).reduce((s, r) => s + r.retentionAmount, 0);

      const totalInvoicedGross = (allInvoices as any[]).reduce((s, i) => s + (i.grossAmount ?? i.amount ?? 0), 0);
      const pendingVOValue = (allVOs as any[])
        .filter(v => v.approvalStatus === 'approved' && v.includeInNextIpc)
        .reduce((s, v) => s + v.billableAmount, 0);

      const allAdvancesRecovered = (allAdvances as any[]).every(a => a.totalRecovered >= a.advanceAmount);

      const finalBillEstimate = totalRetentionHeld + pendingVOValue;

      const summary: FinalBillSummary = {
        contractValue,
        totalInvoicedGross,
        totalRetentionHeld,
        totalRetentionReleased,
        retentionEligibleNow,
        pendingVOValue,
        dlpEndDate,
        dlpStatus,
        allKDsCompleted,
        finalBillEstimate,
      };

      // Closure checklist (auto + manual)
      const noOpenRetentions = retentionRows.filter(r => !r.isReleased && r.isExpired).length === 0;
      const noPendingVOs = (allVOs as any[]).filter(v => v.approvalStatus === 'pending' || v.approvalStatus === 'under_review').length === 0;

      const closureChecks: ClosureCheck[] = [
        {
          id: 'all_kds_completed',
          label: 'All Key Dates (milestones) completed',
          autoChecked: true,
          checked: allKDsCompleted,
          detail: allKDsCompleted ? 'All KDs marked complete' : `${keyDates.length - completedKDs.length} KDs still open`,
        },
        {
          id: 'vos_settled',
          label: 'All Variation Orders settled (no pending/under-review)',
          autoChecked: true,
          checked: noPendingVOs,
          detail: noPendingVOs ? 'All VOs resolved' : `${(allVOs as any[]).filter(v => v.approvalStatus === 'pending' || v.approvalStatus === 'under_review').length} VOs pending`,
        },
        {
          id: 'retention_released',
          label: 'All client retention released (DLP expired)',
          autoChecked: true,
          checked: noOpenRetentions,
          detail: noOpenRetentions ? 'All eligible retentions released' : `${retentionRows.filter(r => !r.isReleased && r.isExpired).length} retentions eligible but unreleased`,
        },
        {
          id: 'advances_recovered',
          label: 'All advances fully recovered',
          autoChecked: true,
          checked: allAdvancesRecovered,
          detail: allAdvancesRecovered ? 'Advance balances NIL' : 'Outstanding advance balance exists',
        },
        {
          id: 'bgs_returned',
          label: 'Bank Guarantees returned to client',
          autoChecked: false,
          checked: false,
        },
        {
          id: 'final_payment_received',
          label: 'Final payment received from client',
          autoChecked: false,
          checked: false,
        },
        {
          id: 'defects_cleared',
          label: 'All DLP defects rectified and accepted',
          autoChecked: false,
          checked: false,
        },
      ];

      dispatch({ type: 'SET_DATA', summary, retentions: retentionRows, closureChecks });
    } catch (error) {
      logger.error('[FinalBill] Load error', error as Error);
      Alert.alert('Error', 'Failed to load final bill data');
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [projectId]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleReleaseRetention = useCallback((ret: RetentionRow) => {
    Alert.alert(
      'Release Retention',
      `Release ₹${(ret.retentionAmount / 1_00_000).toFixed(2)} L from ${ret.invoiceNumber}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Release',
          onPress: async () => {
            try {
              await database.write(async () => {
                const col = database.collections.get('retentions');
                const rec = await col.find(ret.id);
                await rec.update((r: any) => {
                  r.releasedDate = Date.now();
                  r.releasedAmount = r.retentionAmount;
                  r.updatedAt = Date.now();
                });
              });
              dispatch({ type: 'RELEASE_RETENTION', retId: ret.id });
            } catch (error) {
              logger.error('[FinalBill] Release retention error', error as Error);
              Alert.alert('Error', 'Failed to release retention');
            }
          },
        },
      ]
    );
  }, []);

  if (!projectId) {
    return <View style={styles.emptyContainer}><Text style={styles.emptyText}>No project assigned</Text></View>;
  }

  if (state.loading) {
    return <View style={styles.emptyContainer}><ActivityIndicator size="large" color={COLORS.BLUE_SECONDARY} /></View>;
  }

  if (!state.summary) {
    return <View style={styles.emptyContainer}><Text style={styles.emptyText}>No data available</Text></View>;
  }

  const { summary } = state;
  const dlpCfg = DLP_STATUS_CONFIG[summary.dlpStatus];
  const closureScore = state.closureChecks.filter(c => c.checked).length;
  const closureTotal = state.closureChecks.length;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>

      {/* DLP Status Banner */}
      <View style={[styles.dlpBanner, { backgroundColor: dlpCfg.bg }]}>
        <Icon name={dlpCfg.icon} size={28} color={dlpCfg.color} />
        <View style={styles.dlpBannerText}>
          <Text style={[styles.dlpStatusLabel, { color: dlpCfg.color }]}>{dlpCfg.label}</Text>
          {summary.dlpEndDate && (
            <Text style={styles.dlpDate}>
              DLP ends: {new Date(summary.dlpEndDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              {summary.dlpEndDate < Date.now() ? ' (EXPIRED)' : ''}
            </Text>
          )}
          {!summary.dlpEndDate && (
            <Text style={styles.dlpDate}>DLP start date not set — complete all KDs first</Text>
          )}
        </View>
      </View>

      {/* Final Bill KPIs */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Final Bill Overview</Text>
        <View style={styles.kpiGrid}>
          <View style={styles.kpiItem}>
            <Text style={styles.kpiLabel}>Contract Value</Text>
            <Text style={styles.kpiValue}>{formatCr(summary.contractValue)}</Text>
          </View>
          <View style={styles.kpiItem}>
            <Text style={styles.kpiLabel}>Total Invoiced</Text>
            <Text style={[styles.kpiValue, { color: COLORS.GREEN_ACCENT }]}>{formatCr(summary.totalInvoicedGross)}</Text>
          </View>
          <View style={styles.kpiItem}>
            <Text style={styles.kpiLabel}>Retention Held</Text>
            <Text style={[styles.kpiValue, { color: COLORS.AMBER_CAUTION }]}>{formatCr(summary.totalRetentionHeld)}</Text>
          </View>
          <View style={styles.kpiItem}>
            <Text style={styles.kpiLabel}>Eligible Now</Text>
            <Text style={[styles.kpiValue, { color: summary.retentionEligibleNow > 0 ? COLORS.GREEN_ACCENT : COLORS.TEXT_TERTIARY }]}>
              {formatCr(summary.retentionEligibleNow)}
            </Text>
          </View>
          <View style={styles.kpiItem}>
            <Text style={styles.kpiLabel}>Approved VOs (IPC)</Text>
            <Text style={[styles.kpiValue, { color: COLORS.BLUE_SECONDARY }]}>{formatCr(summary.pendingVOValue)}</Text>
          </View>
          <View style={styles.kpiItem}>
            <Text style={styles.kpiLabel}>Final Bill Est.</Text>
            <Text style={[styles.kpiValue, { fontWeight: '900' }]}>{formatCr(summary.finalBillEstimate)}</Text>
          </View>
        </View>
      </View>

      {/* Retention Release Table */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Client Retention Register</Text>
        {state.retentions.length === 0 && (
          <Text style={styles.emptyText}>No retention records</Text>
        )}
        {state.retentions.map(ret => (
          <View key={ret.id} style={[styles.retRow, ret.isExpired && !ret.isReleased && styles.retRowEligible]}>
            <View style={styles.retLeft}>
              <Text style={styles.retInvoice}>{ret.invoiceNumber}</Text>
              <Text style={styles.retDetail}>
                {formatL(ret.gross)} × {ret.retentionPct}% = {formatL(ret.retentionAmount)}
              </Text>
              {ret.dlpEndDate && (
                <Text style={[styles.retDlp, { color: ret.isExpired ? COLORS.GREEN_ACCENT : COLORS.TEXT_TERTIARY }]}>
                  DLP: {new Date(ret.dlpEndDate).toLocaleDateString('en-IN')}
                  {ret.isExpired ? ' ✓ Expired' : ''}
                </Text>
              )}
              {ret.holdingMonths > 0 && !ret.isReleased && (
                <Text style={[styles.retAging, {
                  color: ret.holdingMonths > 12 ? COLORS.ERROR : ret.holdingMonths > 6 ? COLORS.AMBER_CAUTION : COLORS.TEXT_TERTIARY
                }]}>
                  Held {ret.holdingMonths} month{ret.holdingMonths !== 1 ? 's' : ''}
                </Text>
              )}
            </View>
            <View style={styles.retRight}>
              {ret.isReleased ? (
                <Chip style={styles.releasedChip} textStyle={{ color: COLORS.GREEN_ACCENT, fontSize: 11 }}>Released</Chip>
              ) : ret.isExpired ? (
                <TouchableOpacity style={styles.releaseBtn} onPress={() => handleReleaseRetention(ret)}>
                  <Text style={styles.releaseBtnText}>Release</Text>
                </TouchableOpacity>
              ) : (
                <Chip style={styles.holdingChip} textStyle={{ color: COLORS.TEXT_TERTIARY, fontSize: 11 }}>Holding</Chip>
              )}
            </View>
          </View>
        ))}
        {state.retentions.length > 0 && (
          <View style={styles.retSummaryRow}>
            <Text style={styles.retSummaryLabel}>Retention Released:</Text>
            <Text style={[styles.retSummaryValue, { color: COLORS.GREEN_ACCENT }]}>{formatCr(summary.totalRetentionReleased)}</Text>
          </View>
        )}
      </View>

      {/* Closure Checklist */}
      <View style={styles.card}>
        <View style={styles.closureHeader}>
          <Text style={styles.cardTitle}>Commercial Closure Checklist</Text>
          <Text style={styles.closureScore}>{closureScore}/{closureTotal}</Text>
        </View>
        {state.closureChecks.map(check => (
          <View key={check.id}>
            <View style={styles.checkRow}>
              <Icon
                name={check.checked ? 'check-circle' : 'circle-outline'}
                size={20}
                color={check.checked ? COLORS.GREEN_ACCENT : COLORS.TEXT_DISABLED}
              />
              <View style={styles.checkLabel}>
                <Text style={[styles.checkText, check.checked && styles.checkTextDone]}>
                  {check.label}
                </Text>
                {check.detail && (
                  <Text style={[styles.checkDetail, { color: check.checked ? COLORS.TEXT_TERTIARY : COLORS.AMBER_CAUTION }]}>
                    {check.detail}
                  </Text>
                )}
              </View>
              {!check.autoChecked && (
                <Switch
                  value={check.checked}
                  onValueChange={() => dispatch({ type: 'TOGGLE_CHECK', checkId: check.id })}
                  color={COLORS.GREEN_ACCENT}
                />
              )}
            </View>
            <Divider />
          </View>
        ))}

        {closureScore === closureTotal && (
          <View style={styles.closedBanner}>
            <Icon name="check-decagram" size={24} color={COLORS.GREEN_ACCENT} />
            <Text style={styles.closedBannerText}>
              All closure items complete — project is commercially closed.
            </Text>
          </View>
        )}
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
};

// ==================== Styles ====================

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: COLORS.BACKGROUND },
  content: { padding: 16 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 14, color: COLORS.TEXT_TERTIARY, textAlign: 'center' },

  dlpBanner: { borderRadius: 12, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  dlpBannerText: { flex: 1 },
  dlpStatusLabel: { fontSize: 16, fontWeight: '700' },
  dlpDate: { fontSize: 12, color: COLORS.TEXT_SECONDARY, marginTop: 4 },

  card: { backgroundColor: COLORS.SURFACE, borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: COLORS.TEXT_PRIMARY, marginBottom: 12 },

  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  kpiItem: { flex: 1, minWidth: '45%', alignItems: 'center', paddingVertical: 4 },
  kpiLabel: { fontSize: 11, color: COLORS.TEXT_TERTIARY, marginBottom: 2 },
  kpiValue: { fontSize: 14, fontWeight: '700', color: COLORS.TEXT_PRIMARY },

  retRow: { paddingVertical: 10, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: COLORS.BACKGROUND },
  retRowEligible: { backgroundColor: '#F0FFF4' },
  retLeft: { flex: 1 },
  retRight: { marginLeft: 8 },
  retInvoice: { fontSize: 13, fontWeight: '600', color: COLORS.TEXT_PRIMARY },
  retDetail: { fontSize: 12, color: COLORS.TEXT_SECONDARY, marginTop: 2 },
  retDlp: { fontSize: 11, marginTop: 2 },
  retAging: { fontSize: 11, fontWeight: '500', marginTop: 2 },
  releasedChip: { backgroundColor: COLORS.GREEN_ACCENT + '22' },
  holdingChip: { backgroundColor: COLORS.DIVIDER },
  releaseBtn: { backgroundColor: COLORS.GREEN_ACCENT, borderRadius: 6, paddingHorizontal: 12, paddingVertical: 6 },
  releaseBtnText: { fontSize: 12, fontWeight: '600', color: '#fff' },
  retSummaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: COLORS.DIVIDER },
  retSummaryLabel: { fontSize: 13, color: COLORS.TEXT_SECONDARY },
  retSummaryValue: { fontSize: 13, fontWeight: '700' },

  closureHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  closureScore: { fontSize: 18, fontWeight: '800', color: COLORS.BLUE_SECONDARY },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  checkLabel: { flex: 1 },
  checkText: { fontSize: 13, color: COLORS.TEXT_PRIMARY },
  checkTextDone: { color: COLORS.TEXT_TERTIARY, textDecorationLine: 'line-through' },
  checkDetail: { fontSize: 11, marginTop: 2 },

  closedBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#D4EDDA', borderRadius: 8, padding: 14, marginTop: 14 },
  closedBannerText: { flex: 1, fontSize: 14, fontWeight: '600', color: '#155724' },
});

export default function FinalBillScreenWithBoundary() {
  return (
    <ErrorBoundary name="FinalBillScreen">
      <FinalBillScreen />
    </ErrorBoundary>
  );
}
