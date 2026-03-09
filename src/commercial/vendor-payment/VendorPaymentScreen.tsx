/**
 * VendorPaymentScreen
 *
 * Back-to-back vendor payment tracker:
 * - Per vendor: PO value, invoices raised, TDS, retention held, advance deducted, net payable
 * - Payment recommendation: Full / Partial / Hold (with reason)
 * - Filter: All | Due This Week | Overdue
 * - Tap vendor row to see invoice breakdown
 *
 * Sprint 3 — Commercial Advanced Billing
 */

import React, { useCallback, useReducer, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Chip, Divider } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { database } from '../../../models/database';
import { Q } from '@nozbe/watermelondb';
import { logger } from '../../services/LoggingService';
import { useCommercial } from '../context/CommercialContext';
import ErrorBoundary from '../../components/common/ErrorBoundary';
import { COLORS } from '../../theme/colors';

// ==================== Types ====================

type PaymentRec = 'full' | 'partial' | 'hold';
type FilterMode = 'all' | 'due_week' | 'overdue';

interface VendorRow {
  vendorId: string;
  vendorCode: string;
  vendorName: string;
  category: string;
  totalPOValue: number;         // sum of all POs for this vendor on project
  totalInvoiced: number;        // sum of all invoice amounts raised
  totalPaid: number;            // sum of paid invoices
  pendingInvoicesCount: number;
  overdueInvoicesCount: number;
  nextDueDate: number | null;   // earliest pending due_date
  advanceDeducted: number;      // from retention records partyType='vendor' or from advances
  retentionHeld: number;        // from retentions partyType='vendor'
  tdsRate: number;              // assumed 2% TDS (configurable future)
  tdsAmount: number;
  netPayable: number;           // totalInvoiced - paid - retention - advance - tds (for pending)
  recommendation: PaymentRec;
  holdReason?: string;
  invoices: VendorInvoice[];
}

interface VendorInvoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: number;
  amount: number;
  paymentStatus: string;
  dueDate?: number;
  paymentDate?: number;
  isOverdue: boolean;
  daysOverdue: number;
}

interface Summary {
  totalVendors: number;
  totalPayable: number;
  overdueAmount: number;
  holdCount: number;
}

type Action =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_DATA'; rows: VendorRow[]; summary: Summary }
  | { type: 'SET_FILTER'; payload: FilterMode }
  | { type: 'TOGGLE_EXPAND'; vendorId: string };

interface State {
  rows: VendorRow[];
  summary: Summary;
  filter: FilterMode;
  expandedVendorId: string | null;
  loading: boolean;
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_LOADING': return { ...state, loading: action.payload };
    case 'SET_DATA': return { ...state, rows: action.rows, summary: action.summary, loading: false };
    case 'SET_FILTER': return { ...state, filter: action.payload };
    case 'TOGGLE_EXPAND':
      return { ...state, expandedVendorId: state.expandedVendorId === action.vendorId ? null : action.vendorId };
    default: return state;
  }
}

const initialState: State = {
  rows: [], summary: { totalVendors: 0, totalPayable: 0, overdueAmount: 0, holdCount: 0 },
  filter: 'all', expandedVendorId: null, loading: true,
};

// ==================== Formatters ====================

const formatCr = (val: number) => `₹${(val / 1_00_00_000).toFixed(2)} Cr`;
const formatL = (val: number) =>
  val >= 1_00_000 ? `₹${(val / 1_00_000).toFixed(1)} L` : `₹${val.toLocaleString('en-IN')}`;

const REC_CONFIG: Record<PaymentRec, { color: string; label: string; icon: string }> = {
  full:    { color: '#34C759', label: 'Full',    icon: 'check-circle' },
  partial: { color: '#FF9500', label: 'Partial', icon: 'alert-circle' },
  hold:    { color: '#FF3B30', label: 'Hold',    icon: 'pause-circle' },
};

function calcRecommendation(row: Omit<VendorRow, 'recommendation' | 'holdReason'>): { rec: PaymentRec; reason?: string } {
  if (row.overdueInvoicesCount > 0 && row.totalPaid === 0) {
    return { rec: 'hold', reason: 'No payment made yet on overdue invoices' };
  }
  if (row.advanceDeducted > 0 && row.totalInvoiced > 0 &&
      row.advanceDeducted / row.totalInvoiced > 0.5) {
    return { rec: 'partial', reason: 'Advance recovery > 50% of invoiced value' };
  }
  if (row.overdueInvoicesCount > 2) {
    return { rec: 'hold', reason: `${row.overdueInvoicesCount} overdue invoices` };
  }
  if (row.netPayable <= 0) return { rec: 'hold', reason: 'Net payable ≤ 0 after deductions' };
  if (row.overdueInvoicesCount > 0) return { rec: 'partial', reason: 'Some invoices overdue' };
  return { rec: 'full' };
}

// ==================== Sub-components ====================

interface VendorCardProps {
  row: VendorRow;
  expanded: boolean;
  onToggle: () => void;
}

const VendorCard: React.FC<VendorCardProps> = ({ row, expanded, onToggle }) => {
  const recCfg = REC_CONFIG[row.recommendation];
  const now = Date.now();

  return (
    <View style={styles.vendorCard}>
      <TouchableOpacity onPress={onToggle} style={styles.vendorHeader}>
        <View style={styles.vendorInfo}>
          <Text style={styles.vendorCode}>{row.vendorCode}</Text>
          <Text style={styles.vendorName}>{row.vendorName}</Text>
          <Text style={styles.vendorCategory}>{row.category}</Text>
        </View>
        <View style={styles.vendorRight}>
          <Chip
            icon={recCfg.icon}
            style={[styles.recChip, { backgroundColor: recCfg.color + '22' }]}
            textStyle={{ color: recCfg.color, fontSize: 11 }}
          >
            {recCfg.label}
          </Chip>
          <Text style={styles.netPayable}>{formatL(row.netPayable)}</Text>
          <Text style={styles.netPayableLabel}>Net Payable</Text>
          <Icon name={expanded ? 'chevron-up' : 'chevron-down'} size={20} color={COLORS.TEXT_TERTIARY} />
        </View>
      </TouchableOpacity>

      {row.holdReason && (
        <View style={styles.holdBanner}>
          <Icon name="alert" size={14} color={COLORS.ERROR} />
          <Text style={styles.holdText}>{row.holdReason}</Text>
        </View>
      )}

      <View style={styles.vendorMetrics}>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>PO Value</Text>
          <Text style={styles.metricValue}>{formatL(row.totalPOValue)}</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Invoiced</Text>
          <Text style={styles.metricValue}>{formatL(row.totalInvoiced)}</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Paid</Text>
          <Text style={[styles.metricValue, { color: COLORS.GREEN_ACCENT }]}>{formatL(row.totalPaid)}</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Retention</Text>
          <Text style={[styles.metricValue, { color: COLORS.AMBER_CAUTION }]}>{formatL(row.retentionHeld)}</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>TDS</Text>
          <Text style={styles.metricValue}>{formatL(row.tdsAmount)}</Text>
        </View>
        {row.overdueInvoicesCount > 0 && (
          <View style={styles.metric}>
            <Text style={[styles.metricLabel, { color: COLORS.ERROR }]}>Overdue</Text>
            <Text style={[styles.metricValue, { color: COLORS.ERROR }]}>{row.overdueInvoicesCount} inv</Text>
          </View>
        )}
      </View>

      {expanded && row.invoices.length > 0 && (
        <View style={styles.invoiceList}>
          <Divider style={{ marginBottom: 8 }} />
          <Text style={styles.invoiceListTitle}>Invoice Breakdown</Text>
          {row.invoices.map(inv => (
            <View key={inv.id} style={styles.invoiceRow}>
              <View style={styles.invoiceLeft}>
                <Text style={styles.invoiceNum}>{inv.invoiceNumber}</Text>
                <Text style={styles.invoiceDate}>
                  {new Date(inv.invoiceDate).toLocaleDateString('en-IN')}
                </Text>
              </View>
              <View style={styles.invoiceRight}>
                <Text style={styles.invoiceAmount}>{formatL(inv.amount)}</Text>
                <Chip
                  style={[
                    styles.statusChip,
                    { backgroundColor: inv.isOverdue ? COLORS.ERROR + '22' : inv.paymentStatus === 'paid' ? COLORS.GREEN_ACCENT + '22' : COLORS.AMBER_CAUTION + '22' }
                  ]}
                  textStyle={{
                    fontSize: 10,
                    color: inv.isOverdue ? COLORS.ERROR : inv.paymentStatus === 'paid' ? COLORS.GREEN_ACCENT : COLORS.AMBER_CAUTION
                  }}
                >
                  {inv.isOverdue ? `Overdue ${inv.daysOverdue}d` : inv.paymentStatus}
                </Chip>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

// ==================== Main Screen ====================

const VendorPaymentScreen: React.FC = () => {
  const { projectId } = useCommercial();
  const [state, dispatch] = useReducer(reducer, initialState);

  const loadData = useCallback(async () => {
    if (!projectId) { dispatch({ type: 'SET_LOADING', payload: false }); return; }
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const now = Date.now();

      // Fetch vendors, POs, invoices, retentions for this project
      const [allVendors, allPOs, allInvoices, allRetentions] = await Promise.all([
        database.collections.get('vendors').query().fetch() as Promise<any[]>,
        database.collections.get('purchase_orders').query(Q.where('project_id', projectId)).fetch() as Promise<any[]>,
        database.collections.get('invoices').query(Q.where('project_id', projectId)).fetch() as Promise<any[]>,
        database.collections.get('retentions').query(
          Q.where('project_id', projectId),
          Q.where('party_type', 'vendor')
        ).fetch() as Promise<any[]>,
      ]);

      // Group POs and invoices by vendor
      const vendorPOMap: Record<string, number> = {};
      for (const po of allPOs) {
        vendorPOMap[po.vendorId] = (vendorPOMap[po.vendorId] || 0) + po.poValue;
      }

      const vendorInvMap: Record<string, any[]> = {};
      for (const inv of allInvoices) {
        const vid = inv.vendorId;
        if (!vid) continue;
        if (!vendorInvMap[vid]) vendorInvMap[vid] = [];
        vendorInvMap[vid].push(inv);
      }

      const retentionByVendor: Record<string, number> = {};
      for (const ret of allRetentions) {
        if (ret.partyId) {
          retentionByVendor[ret.partyId] = (retentionByVendor[ret.partyId] || 0) + ret.retentionAmount;
        }
      }

      // Only show vendors that have POs or invoices on this project
      const activeVendorIds = new Set([
        ...Object.keys(vendorPOMap),
        ...Object.keys(vendorInvMap),
      ]);

      const rows: VendorRow[] = [];

      for (const vendor of allVendors as any[]) {
        if (!activeVendorIds.has(vendor.id)) continue;
        const invoices: VendorInvoice[] = (vendorInvMap[vendor.id] || []).map((inv: any) => {
          const dueDate = inv.dueDate || (inv.invoiceDate + 30 * 24 * 60 * 60 * 1000);
          const isPending = inv.paymentStatus !== 'paid';
          const isOverdue = isPending && dueDate < now;
          const daysOverdue = isOverdue ? Math.floor((now - dueDate) / (24 * 60 * 60 * 1000)) : 0;
          return {
            id: inv.id,
            invoiceNumber: inv.invoiceNumber,
            invoiceDate: inv.invoiceDate,
            amount: inv.amount,
            paymentStatus: inv.paymentStatus,
            dueDate,
            paymentDate: inv.paymentDate,
            isOverdue,
            daysOverdue,
          };
        });

        const totalInvoiced = invoices.reduce((s, i) => s + i.amount, 0);
        const totalPaid = invoices.filter(i => i.paymentStatus === 'paid').reduce((s, i) => s + i.amount, 0);
        const pendingInvoicesCount = invoices.filter(i => i.paymentStatus === 'pending').length;
        const overdueInvoicesCount = invoices.filter(i => i.isOverdue).length;
        const retentionHeld = retentionByVendor[vendor.id] || 0;
        const tdsAmount = Math.round((totalInvoiced - totalPaid) * 0.02); // 2% TDS on pending
        const advanceDeducted = 0; // vendor advance deduction — placeholder (vendor advances not tracked yet)
        const pendingGross = totalInvoiced - totalPaid;
        const netPayable = Math.max(0, pendingGross - retentionHeld - tdsAmount - advanceDeducted);
        const nextDueDates = invoices.filter(i => i.paymentStatus === 'pending' && i.dueDate).map(i => i.dueDate!);
        const nextDueDate = nextDueDates.length > 0 ? Math.min(...nextDueDates) : null;
        const totalPOValue = vendorPOMap[vendor.id] || 0;

        const baseRow = {
          vendorId: vendor.id,
          vendorCode: vendor.vendorCode,
          vendorName: vendor.vendorName,
          category: vendor.category,
          totalPOValue,
          totalInvoiced,
          totalPaid,
          pendingInvoicesCount,
          overdueInvoicesCount,
          nextDueDate,
          advanceDeducted,
          retentionHeld,
          tdsRate: 2,
          tdsAmount,
          netPayable,
          invoices,
        };

        const { rec, reason } = calcRecommendation(baseRow);
        rows.push({ ...baseRow, recommendation: rec, holdReason: reason });
      }

      // Sort: hold first, then partial, then full; within each group by netPayable desc
      const orderMap: Record<PaymentRec, number> = { hold: 0, partial: 1, full: 2 };
      rows.sort((a, b) => orderMap[a.recommendation] - orderMap[b.recommendation] || b.netPayable - a.netPayable);

      const summary: Summary = {
        totalVendors: rows.length,
        totalPayable: rows.reduce((s, r) => s + r.netPayable, 0),
        overdueAmount: rows.reduce((s, r) => s + r.invoices.filter(i => i.isOverdue).reduce((ss, i) => ss + i.amount, 0), 0),
        holdCount: rows.filter(r => r.recommendation === 'hold').length,
      };

      dispatch({ type: 'SET_DATA', rows, summary });
    } catch (error) {
      logger.error('[VendorPayment] Load error', error as Error);
      Alert.alert('Error', 'Failed to load vendor payment data');
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [projectId]);

  useEffect(() => { loadData(); }, [loadData]);

  const now = Date.now();
  const weekFromNow = now + 7 * 24 * 60 * 60 * 1000;

  const filteredRows = state.rows.filter(r => {
    if (state.filter === 'all') return true;
    if (state.filter === 'overdue') return r.overdueInvoicesCount > 0;
    if (state.filter === 'due_week') return r.nextDueDate !== null && r.nextDueDate <= weekFromNow && r.nextDueDate >= now;
    return true;
  });

  if (!projectId) {
    return <View style={styles.emptyContainer}><Text style={styles.emptyText}>No project assigned</Text></View>;
  }

  if (state.loading) {
    return <View style={styles.emptyContainer}><ActivityIndicator size="large" color={COLORS.BLUE_SECONDARY} /></View>;
  }

  return (
    <View style={styles.screen}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>

        {/* Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Vendor Payment Summary</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Active Vendors</Text>
              <Text style={styles.summaryValue}>{state.summary.totalVendors}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total Net Payable</Text>
              <Text style={[styles.summaryValue, { color: COLORS.BLUE_SECONDARY }]}>{formatCr(state.summary.totalPayable)}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Overdue Amount</Text>
              <Text style={[styles.summaryValue, { color: COLORS.ERROR }]}>{formatCr(state.summary.overdueAmount)}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Hold Vendors</Text>
              <Text style={[styles.summaryValue, { color: COLORS.ERROR }]}>{state.summary.holdCount}</Text>
            </View>
          </View>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterRow}>
          {([['all', 'All'], ['due_week', 'Due This Week'], ['overdue', 'Overdue']] as [FilterMode, string][]).map(([f, label]) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterTab, state.filter === f && styles.filterTabActive]}
              onPress={() => dispatch({ type: 'SET_FILTER', payload: f })}
            >
              <Text style={[styles.filterTabText, state.filter === f && styles.filterTabTextActive]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Note: TDS */}
        <Text style={styles.noteText}>* TDS computed at 2% on pending invoices. Retention from vendor retention records.</Text>

        {/* Vendor Cards */}
        {filteredRows.length === 0 ? (
          <View style={styles.emptyList}>
            <Icon name="account-cash-outline" size={48} color={COLORS.TEXT_DISABLED} />
            <Text style={styles.emptyListText}>
              {state.filter === 'all' ? 'No active vendor payments' : 'No vendors match this filter'}
            </Text>
          </View>
        ) : (
          filteredRows.map(row => (
            <VendorCard
              key={row.vendorId}
              row={row}
              expanded={state.expandedVendorId === row.vendorId}
              onToggle={() => dispatch({ type: 'TOGGLE_EXPAND', vendorId: row.vendorId })}
            />
          ))
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
};

// ==================== Styles ====================

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.BACKGROUND },
  scroll: { flex: 1 },
  scrollContent: { padding: 16 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 16, color: COLORS.TEXT_SECONDARY },

  summaryCard: { backgroundColor: COLORS.SURFACE, borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2 },
  summaryTitle: { fontSize: 15, fontWeight: '600', color: COLORS.TEXT_PRIMARY, marginBottom: 12 },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  summaryItem: { flex: 1, minWidth: '45%', alignItems: 'center' },
  summaryLabel: { fontSize: 11, color: COLORS.TEXT_TERTIARY, marginBottom: 4 },
  summaryValue: { fontSize: 15, fontWeight: '700', color: COLORS.TEXT_PRIMARY },

  filterRow: { flexDirection: 'row', marginBottom: 8, gap: 4 },
  filterTab: { flex: 1, paddingVertical: 8, paddingHorizontal: 4, borderRadius: 8, backgroundColor: COLORS.SURFACE, alignItems: 'center', borderWidth: 1, borderColor: COLORS.BORDER },
  filterTabActive: { backgroundColor: COLORS.BLUE_SECONDARY, borderColor: COLORS.BLUE_SECONDARY },
  filterTabText: { fontSize: 11, color: COLORS.TEXT_SECONDARY, textAlign: 'center' },
  filterTabTextActive: { color: '#fff', fontWeight: '600' },

  noteText: { fontSize: 11, color: COLORS.TEXT_TERTIARY, marginBottom: 12, fontStyle: 'italic' },

  vendorCard: { backgroundColor: COLORS.SURFACE, borderRadius: 12, padding: 14, marginBottom: 10, elevation: 2 },
  vendorHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  vendorInfo: { flex: 1 },
  vendorCode: { fontSize: 11, color: COLORS.TEXT_TERTIARY, marginBottom: 2 },
  vendorName: { fontSize: 14, fontWeight: '700', color: COLORS.TEXT_PRIMARY },
  vendorCategory: { fontSize: 11, color: COLORS.TEXT_SECONDARY, marginTop: 2 },
  vendorRight: { alignItems: 'flex-end', gap: 4 },
  recChip: {},
  netPayable: { fontSize: 15, fontWeight: '700', color: COLORS.BLUE_SECONDARY, marginTop: 4 },
  netPayableLabel: { fontSize: 10, color: COLORS.TEXT_TERTIARY },

  holdBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FF3B3011', borderRadius: 6, padding: 6, marginBottom: 8, gap: 6 },
  holdText: { fontSize: 12, color: COLORS.ERROR, flex: 1 },

  vendorMetrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  metric: { alignItems: 'center', minWidth: '30%' },
  metricLabel: { fontSize: 10, color: COLORS.TEXT_TERTIARY, marginBottom: 2 },
  metricValue: { fontSize: 12, fontWeight: '600', color: COLORS.TEXT_PRIMARY },

  invoiceList: { marginTop: 8 },
  invoiceListTitle: { fontSize: 13, fontWeight: '600', color: COLORS.TEXT_SECONDARY, marginBottom: 6 },
  invoiceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  invoiceLeft: {},
  invoiceRight: { alignItems: 'flex-end', gap: 4 },
  invoiceNum: { fontSize: 12, fontWeight: '600', color: COLORS.TEXT_PRIMARY },
  invoiceDate: { fontSize: 11, color: COLORS.TEXT_TERTIARY },
  invoiceAmount: { fontSize: 12, fontWeight: '600', color: COLORS.TEXT_PRIMARY },
  statusChip: {},

  emptyList: { alignItems: 'center', paddingVertical: 40 },
  emptyListText: { fontSize: 14, color: COLORS.TEXT_TERTIARY, marginTop: 12 },
});

export default function VendorPaymentScreenWithBoundary() {
  return (
    <ErrorBoundary name="VendorPaymentScreen">
      <VendorPaymentScreen />
    </ErrorBoundary>
  );
}
