/**
 * CashFlowForecastScreen
 *
 * 6-month rolling cash flow projection:
 * - Inflows: pending KD billings (key_dates × weightage × contract_value)
 * - Outflows: pending vendor invoices + advance recoveries projected
 * - Net position bar per month (positive = surplus, negative = funding gap)
 * - Working capital requirement: peak negative month
 * - Funding gap alert if any month is negative
 *
 * Sprint 3 — Commercial Advanced Billing
 */

import React, { useCallback, useEffect, useReducer } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Snackbar } from 'react-native-paper';
import { useSnackbar } from '../../hooks/useSnackbar';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { database } from '../../../models/database';
import { Q } from '@nozbe/watermelondb';
import { logger } from '../../services/LoggingService';
import { useCommercial } from '../context/CommercialContext';
import ErrorBoundary from '../../components/common/ErrorBoundary';

// ==================== Types ====================

interface MonthData {
  label: string;       // "Apr 2026"
  monthKey: string;    // "2026-04"
  inflow: number;
  outflow: number;
  net: number;
}

interface Summary {
  totalInflow: number;
  totalOutflow: number;
  netPosition: number;
  peakFundingGap: number;   // most negative month (positive number = gap amount)
  gapMonths: string[];      // month labels with negative net
  workingCapitalReq: number; // peak gap = working capital needed
}

interface State {
  months: MonthData[];
  summary: Summary;
  loading: boolean;
}

type Action =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_DATA'; months: MonthData[]; summary: Summary };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_LOADING': return { ...state, loading: action.payload };
    case 'SET_DATA': return { ...state, months: action.months, summary: action.summary, loading: false };
    default: return state;
  }
}

const EMPTY_SUMMARY: Summary = {
  totalInflow: 0, totalOutflow: 0, netPosition: 0,
  peakFundingGap: 0, gapMonths: [], workingCapitalReq: 0,
};

const initialState: State = { months: [], summary: EMPTY_SUMMARY, loading: true };

// ==================== Helpers ====================

const formatCr = (val: number) => `₹${Math.abs(val / 1_00_00_000).toFixed(2)} Cr`;
const formatL = (val: number) => `₹${Math.abs(val / 1_00_000).toFixed(1)} L`;

function getMonthKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function getMonthLabel(ts: number): string {
  return new Date(ts).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
}

/** Returns timestamps for start of each of the next N months (including current) */
function next6MonthStarts(): number[] {
  const starts: number[] = [];
  const now = new Date();
  for (let i = 0; i < 6; i++) {
    starts.push(new Date(now.getFullYear(), now.getMonth() + i, 1).getTime());
  }
  return starts;
}

// ==================== Main Screen ====================

const CashFlowForecastScreen: React.FC = () => {
  const { projectId } = useCommercial();
  const { show: showSnackbar, snackbarProps } = useSnackbar();
  const [state, dispatch] = useReducer(reducer, initialState);

  const loadData = useCallback(async () => {
    if (!projectId) { dispatch({ type: 'SET_LOADING', payload: false }); return; }
    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      const monthStarts = next6MonthStarts();
      const windowStart = monthStarts[0];
      const windowEnd = new Date(
        new Date(windowStart).getFullYear(),
        new Date(windowStart).getMonth() + 6, 1
      ).getTime();

      // Fetch project (for contractValue)
      const projectsCol = database.collections.get('projects');
      const projectArr = await projectsCol.query().fetch() as any[];
      const project = projectArr.find((p: any) => p.id === projectId);
      const contractValue: number = project?.contractValue ?? 0;

      // Fetch pending key_dates within window for inflow
      const keyDatesCol = database.collections.get('key_dates');
      const keyDates = await keyDatesCol.query(
        Q.where('project_id', projectId),
        Q.where('status', Q.notEq('completed')),
        Q.where('target_date', Q.gte(windowStart)),
        Q.where('target_date', Q.lt(windowEnd))
      ).fetch() as any[];

      // Fetch pending vendor invoices within window for outflow
      const invoicesCol = database.collections.get('invoices');
      const vendorInvoices = await invoicesCol.query(
        Q.where('project_id', projectId),
        Q.where('payment_status', 'pending'),
      ).fetch() as any[];

      // Fetch active advances for projected recovery outflow
      const advancesCol = database.collections.get('advances');
      const advances = await advancesCol.query(
        Q.where('project_id', projectId)
      ).fetch() as any[];

      // Build month map
      const monthMap: Record<string, { inflow: number; outflow: number }> = {};
      for (const start of monthStarts) {
        const key = getMonthKey(start);
        monthMap[key] = { inflow: 0, outflow: 0 };
      }

      // Inflows: KD target dates → expected billing = contractValue × weightage/100
      for (const kd of keyDates as any[]) {
        const key = getMonthKey(kd.targetDate);
        if (monthMap[key] && contractValue > 0 && kd.weightage) {
          monthMap[key].inflow += (contractValue * kd.weightage) / 100;
        }
      }

      // Outflows: vendor invoices — use dueDate or invoiceDate + 30 days
      for (const inv of vendorInvoices as any[]) {
        const dueDate = inv.dueDate || (inv.invoiceDate + 30 * 24 * 60 * 60 * 1000);
        const key = getMonthKey(dueDate);
        if (monthMap[key]) {
          monthMap[key].outflow += inv.amount;
        }
      }

      // Outflows: advance recovery — projected as fixed monthly recovery from pending advances
      // Estimate: sum of (advanceBalance * recoveryPct/100) distributed over remaining months
      const totalActiveAdvanceRecovery = (advances as any[]).reduce((sum: number, adv: any) => {
        const balance = Math.max(0, adv.advanceAmount - adv.totalRecovered);
        if (balance <= 0) return sum;
        // Spread projected recovery evenly across 6 months
        const monthlyRecovery = (balance * adv.recoveryPct) / 100;
        return sum + monthlyRecovery;
      }, 0);

      if (totalActiveAdvanceRecovery > 0) {
        // Add to each month's outflow as projected advance recovery
        for (const key of Object.keys(monthMap)) {
          monthMap[key].outflow += totalActiveAdvanceRecovery;
        }
      }

      // Build sorted month data
      const months: MonthData[] = monthStarts.map(start => {
        const key = getMonthKey(start);
        const { inflow, outflow } = monthMap[key];
        return {
          label: getMonthLabel(start),
          monthKey: key,
          inflow,
          outflow,
          net: inflow - outflow,
        };
      });

      const gapMonths = months.filter(m => m.net < 0).map(m => m.label);
      const peakFundingGap = Math.max(0, ...months.map(m => -m.net));

      const summary: Summary = {
        totalInflow: months.reduce((s, m) => s + m.inflow, 0),
        totalOutflow: months.reduce((s, m) => s + m.outflow, 0),
        netPosition: months.reduce((s, m) => s + m.net, 0),
        peakFundingGap,
        gapMonths,
        workingCapitalReq: peakFundingGap,
      };

      dispatch({ type: 'SET_DATA', months, summary });
    } catch (error) {
      logger.error('[CashFlow] Load error', error as Error);
      showSnackbar('Failed to load cash flow forecast');
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [projectId, showSnackbar]);

  useEffect(() => { loadData(); }, [loadData]);

  if (!projectId) {
    return <View style={styles.emptyContainer}><Text style={styles.emptyText}>No project assigned</Text></View>;
  }

  if (state.loading) {
    return <View style={styles.emptyContainer}><ActivityIndicator size="large" color="#007AFF" /></View>;
  }

  const maxAbsValue = Math.max(
    ...state.months.map(m => Math.max(m.inflow, m.outflow, Math.abs(m.net))),
    1
  );

  return (
    <>
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>

      {/* Funding Gap Alert */}
      {state.summary.gapMonths.length > 0 && (
        <View style={styles.alertBanner}>
          <Icon name="alert-triangle" size={18} color="#FF3B30" />
          <Text style={styles.alertText}>
            Funding gap in {state.summary.gapMonths.join(', ')}.
            Working capital required: {formatCr(state.summary.workingCapitalReq)}
          </Text>
        </View>
      )}

      {/* Summary KPIs */}
      <View style={styles.summaryCard}>
        <Text style={styles.sectionTitle}>6-Month Cash Flow Forecast</Text>
        <View style={styles.kpiRow}>
          <View style={styles.kpi}>
            <Icon name="arrow-down-circle-outline" size={20} color="#34C759" />
            <Text style={styles.kpiLabel}>Total Inflow</Text>
            <Text style={[styles.kpiValue, { color: '#34C759' }]}>{formatCr(state.summary.totalInflow)}</Text>
          </View>
          <View style={styles.kpi}>
            <Icon name="arrow-up-circle-outline" size={20} color="#FF3B30" />
            <Text style={styles.kpiLabel}>Total Outflow</Text>
            <Text style={[styles.kpiValue, { color: '#FF3B30' }]}>{formatCr(state.summary.totalOutflow)}</Text>
          </View>
          <View style={styles.kpi}>
            <Icon name="cash-multiple" size={20} color={state.summary.netPosition >= 0 ? '#007AFF' : '#FF3B30'} />
            <Text style={styles.kpiLabel}>Net Position</Text>
            <Text style={[styles.kpiValue, { color: state.summary.netPosition >= 0 ? '#007AFF' : '#FF3B30' }]}>
              {state.summary.netPosition >= 0 ? '+' : '-'}{formatCr(state.summary.netPosition)}
            </Text>
          </View>
        </View>
        {state.summary.workingCapitalReq > 0 && (
          <View style={styles.workingCapitalRow}>
            <Icon name="bank-outline" size={16} color="#FF9500" />
            <Text style={styles.workingCapitalText}>
              Peak working capital requirement: {formatCr(state.summary.workingCapitalReq)}
            </Text>
          </View>
        )}
      </View>

      {/* Month-by-Month Chart */}
      <View style={styles.chartCard}>
        <Text style={styles.sectionTitle}>Monthly Breakdown</Text>
        <View style={styles.legendRow}>
          <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#34C75988' }]} /><Text style={styles.legendText}>Inflow</Text></View>
          <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#FF3B3088' }]} /><Text style={styles.legendText}>Outflow</Text></View>
          <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#007AFF' }]} /><Text style={styles.legendText}>Net</Text></View>
        </View>

        {state.months.map(month => {
          const inflowPct = Math.min(100, (month.inflow / maxAbsValue) * 100);
          const outflowPct = Math.min(100, (month.outflow / maxAbsValue) * 100);
          const isGap = month.net < 0;

          return (
            <View key={month.monthKey} style={[styles.monthRow, isGap && styles.monthRowGap]}>
              <Text style={styles.monthLabel}>{month.label}</Text>
              <View style={styles.barSection}>
                {/* Inflow bar */}
                <View style={styles.barContainer}>
                  <View style={[styles.bar, styles.barInflow, { width: `${inflowPct}%` }]} />
                  {month.inflow > 0 && (
                    <Text style={styles.barLabel}>{formatL(month.inflow)}</Text>
                  )}
                </View>
                {/* Outflow bar */}
                <View style={styles.barContainer}>
                  <View style={[styles.bar, styles.barOutflow, { width: `${outflowPct}%` }]} />
                  {month.outflow > 0 && (
                    <Text style={styles.barLabel}>{formatL(month.outflow)}</Text>
                  )}
                </View>
              </View>
              <View style={styles.netSection}>
                <Text style={[styles.netLabel, { color: month.net >= 0 ? '#34C759' : '#FF3B30' }]}>
                  {month.net >= 0 ? '+' : ''}{formatL(month.net)}
                </Text>
                {isGap && (
                  <Icon name="alert-circle" size={14} color="#FF3B30" style={{ marginTop: 2 }} />
                )}
              </View>
            </View>
          );
        })}
      </View>

      {/* Disclaimer */}
      <View style={styles.disclaimerCard}>
        <Icon name="information-outline" size={16} color="#888" />
        <Text style={styles.disclaimerText}>
          Inflows based on pending Key Date target dates × weightage × contract value.
          Outflows include pending vendor invoices + projected advance recoveries.
          Actual amounts will vary based on billing schedule.
        </Text>
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
    <Snackbar {...snackbarProps} duration={3000} />
    </>
  );
};

// ==================== Styles ====================

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 16 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 16, color: '#666' },

  alertBanner: {
    flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#FF3B3011',
    borderRadius: 8, padding: 12, marginBottom: 12, gap: 8, borderWidth: 1, borderColor: '#FF3B3033',
  },
  alertText: { flex: 1, fontSize: 13, color: '#FF3B30' },

  summaryCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2 },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: '#333', marginBottom: 12 },
  kpiRow: { flexDirection: 'row', justifyContent: 'space-around' },
  kpi: { alignItems: 'center', gap: 4 },
  kpiLabel: { fontSize: 11, color: '#888' },
  kpiValue: { fontSize: 14, fontWeight: '700' },
  workingCapitalRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  workingCapitalText: { fontSize: 13, color: '#FF9500' },

  chartCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2 },
  legendRow: { flexDirection: 'row', gap: 16, marginBottom: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 11, color: '#666' },

  monthRow: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 10,
    paddingVertical: 6, paddingHorizontal: 8, borderRadius: 8,
  },
  monthRowGap: { backgroundColor: '#FF3B3008' },
  monthLabel: { width: 64, fontSize: 11, color: '#555', fontWeight: '500' },
  barSection: { flex: 1, gap: 4 },
  barContainer: { height: 14, flexDirection: 'row', alignItems: 'center' },
  bar: { height: 12, borderRadius: 6, minWidth: 2 },
  barInflow: { backgroundColor: '#34C75988' },
  barOutflow: { backgroundColor: '#FF3B3088' },
  barLabel: { fontSize: 10, color: '#666', marginLeft: 6 },
  netSection: { width: 64, alignItems: 'flex-end' },
  netLabel: { fontSize: 11, fontWeight: '700' },

  disclaimerCard: {
    flexDirection: 'row', gap: 8, alignItems: 'flex-start',
    backgroundColor: '#fff', borderRadius: 8, padding: 12, elevation: 1,
  },
  disclaimerText: { flex: 1, fontSize: 11, color: '#888', lineHeight: 16 },
});

export default function CashFlowForecastScreenWithBoundary() {
  return (
    <ErrorBoundary name="CashFlowForecastScreen">
      <CashFlowForecastScreen />
    </ErrorBoundary>
  );
}
