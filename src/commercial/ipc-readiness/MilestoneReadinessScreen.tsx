/**
 * MilestoneReadinessScreen
 *
 * IPC pre-flight checklist for each Key Date:
 * - 3 auto-checked items (VO approval, LD assessment, prev IPC paid)
 * - 5 manual toggles (engineer cert, MB, BOQ, hindrance, GST)
 * - Readiness status: Safe (all green) | Conditional (amber) | Hold (red)
 * - Tap "Proceed to Billing" to navigate to KD Billing screen
 *
 * Session-only state — no DB write needed (pre-flight, not audit trail).
 * Sprint 4 — Commercial Advanced Billing
 */

import React, { useCallback, useEffect, useReducer } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Switch, Chip, Divider } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { database } from '../../../models/database';
import { Q } from '@nozbe/watermelondb';
import { logger } from '../../services/LoggingService';
import { useCommercial } from '../context/CommercialContext';
import ErrorBoundary from '../../components/common/ErrorBoundary';

// ==================== Types ====================

interface CheckItem {
  id: string;
  label: string;
  mandatory: boolean;
  autoChecked: boolean;   // true = computed from data, not user toggle
  checked: boolean;
  detail?: string;        // auto-check detail text
}

interface KDReadiness {
  kdId: string;
  kdCode: string;
  kdDescription: string;
  status: string;
  weightage: number;
  targetDate: number;
  checks: CheckItem[];
  readiness: 'safe' | 'conditional' | 'hold';
  isBilled: boolean;
  billedIpcNumber: number | null;
}

type Action =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_KDS'; kds: KDReadiness[] }
  | { type: 'TOGGLE_CHECK'; kdId: string; checkId: string }
  | { type: 'SET_EXPANDED'; kdId: string | null };

interface State {
  kds: KDReadiness[];
  loading: boolean;
  expandedKdId: string | null;
}

function computeReadiness(checks: CheckItem[]): 'safe' | 'conditional' | 'hold' {
  const mandatoryFailed = checks.filter(c => c.mandatory && !c.checked);
  const optionalFailed = checks.filter(c => !c.mandatory && !c.checked);
  if (mandatoryFailed.length > 0) return 'hold';
  if (optionalFailed.length > 0) return 'conditional';
  return 'safe';
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_LOADING': return { ...state, loading: action.payload };
    case 'SET_KDS': return { ...state, kds: action.kds, loading: false };
    case 'TOGGLE_CHECK': {
      const kds = state.kds.map(kd => {
        if (kd.kdId !== action.kdId) return kd;
        const checks = kd.checks.map(c => {
          if (c.id !== action.checkId || c.autoChecked) return c;
          return { ...c, checked: !c.checked };
        });
        return { ...kd, checks, readiness: computeReadiness(checks) };
      });
      return { ...state, kds };
    }
    case 'SET_EXPANDED': return { ...state, expandedKdId: action.kdId };
    default: return state;
  }
}

const initialState: State = { kds: [], loading: true, expandedKdId: null };

// ==================== Helpers ====================

const READINESS_CONFIG = {
  safe:        { color: '#34C759', label: 'Safe to Bill',  icon: 'check-circle' },
  conditional: { color: '#FF9500', label: 'Conditional',   icon: 'alert-circle' },
  hold:        { color: '#FF3B30', label: 'Hold — Incomplete', icon: 'close-circle' },
};

function buildChecks(params: {
  hasUnapprovedVOs: boolean;
  voCount: number;
  ldDaysDelayed: number;
  prevIpcPaid: boolean;
  prevIpcExists: boolean;
}): CheckItem[] {
  const { hasUnapprovedVOs, voCount, ldDaysDelayed, prevIpcPaid, prevIpcExists } = params;

  return [
    // ── Mandatory manual checks ──────────────────────
    {
      id: 'engineer_cert',
      label: 'Engineer Completion Certificate uploaded',
      mandatory: true,
      autoChecked: false,
      checked: false,
    },
    {
      id: 'mb_entry',
      label: 'Measurement Book (MB) entry reference noted',
      mandatory: true,
      autoChecked: false,
      checked: false,
    },
    {
      id: 'boq_reconciled',
      label: 'BOQ reconciliation done',
      mandatory: true,
      autoChecked: false,
      checked: false,
    },
    // ── Auto-checked: VOs ────────────────────────────
    {
      id: 'vo_approved',
      label: 'Variation orders impacting this KD are approved',
      mandatory: true,
      autoChecked: true,
      checked: !hasUnapprovedVOs,
      detail: hasUnapprovedVOs
        ? `${voCount} unapproved VO${voCount > 1 ? 's' : ''} linked to this KD`
        : voCount > 0 ? `${voCount} VO${voCount > 1 ? 's' : ''} — all approved` : 'No VOs linked',
    },
    // ── Auto-checked: LD ────────────────────────────
    {
      id: 'ld_accepted',
      label: 'LD exposure calculated and accepted',
      mandatory: false,
      autoChecked: true,
      checked: true,   // auto-pass — LD is informational; commercial manager decides
      detail: ldDaysDelayed > 0
        ? `KD delayed ${ldDaysDelayed} days — LD to be evaluated`
        : 'No delay — no LD exposure',
    },
    // ── Auto-checked: Prev IPC ───────────────────────
    {
      id: 'prev_ipc_paid',
      label: 'Previous IPC payment received',
      mandatory: false,
      autoChecked: true,
      checked: !prevIpcExists || prevIpcPaid,
      detail: prevIpcExists
        ? prevIpcPaid ? 'Previous IPC certified & paid' : 'Previous IPC still pending payment'
        : 'First IPC — no prior billing',
    },
    // ── Optional manual checks ───────────────────────
    {
      id: 'hindrance_reviewed',
      label: 'Hindrance register reviewed (no open critical hindrances)',
      mandatory: false,
      autoChecked: false,
      checked: false,
    },
    {
      id: 'gst_compliance',
      label: 'GST compliance confirmed',
      mandatory: false,
      autoChecked: false,
      checked: false,
    },
  ];
}

// ==================== Sub-components ====================

interface CheckItemRowProps {
  item: CheckItem;
  onToggle: () => void;
}

const CheckItemRow: React.FC<CheckItemRowProps> = ({ item, onToggle }) => {
  const iconColor = item.checked ? '#34C759' : item.mandatory ? '#FF3B30' : '#FF9500';
  const iconName = item.checked ? 'check-circle' : item.mandatory ? 'close-circle-outline' : 'alert-circle-outline';

  return (
    <View style={checkStyles.row}>
      <Icon name={iconName} size={20} color={iconColor} style={checkStyles.icon} />
      <View style={checkStyles.labelContainer}>
        <Text style={[checkStyles.label, !item.checked && checkStyles.labelFailed]}>
          {item.label}
          {item.mandatory ? '' : ' (optional)'}
        </Text>
        {item.detail ? (
          <Text style={[checkStyles.detail, { color: item.checked ? '#888' : '#FF9500' }]}>
            {item.detail}
          </Text>
        ) : null}
      </View>
      {!item.autoChecked && (
        <Switch
          value={item.checked}
          onValueChange={onToggle}
          color="#34C759"
        />
      )}
    </View>
  );
};

const checkStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 8 },
  icon: { flexShrink: 0 },
  labelContainer: { flex: 1 },
  label: { fontSize: 13, color: '#333', lineHeight: 18 },
  labelFailed: { color: '#555' },
  detail: { fontSize: 11, marginTop: 2 },
});

// ==================== Main Screen ====================

const MilestoneReadinessScreen: React.FC = () => {
  const { projectId } = useCommercial();
  const navigation = useNavigation<any>();
  const [state, dispatch] = useReducer(reducer, initialState);

  const loadKDs = useCallback(async () => {
    if (!projectId) { dispatch({ type: 'SET_LOADING', payload: false }); return; }
    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      const [keyDates, allVOs, allInvoices] = await Promise.all([
        database.collections.get('key_dates')
          .query(Q.where('project_id', projectId), Q.sortBy('sequence_order', Q.asc))
          .fetch() as Promise<any[]>,
        database.collections.get('variation_orders')
          .query(Q.where('project_id', projectId))
          .fetch() as Promise<any[]>,
        database.collections.get('invoices')
          .query(Q.where('project_id', projectId))
          .fetch() as Promise<any[]>,
      ]);

      // Build VO lookup by linked_kd_id; fall back to project-level VOs if none linked
      const vosByKd: Record<string, any[]> = {};
      for (const vo of allVOs) {
        if (vo.linkedKdId) {
          if (!vosByKd[vo.linkedKdId]) vosByKd[vo.linkedKdId] = [];
          vosByKd[vo.linkedKdId].push(vo);
        }
      }
      // Project-level unapproved VOs (used when no KD-specific VOs exist)
      const projectUnapprovedVOs = (allVOs as any[]).filter(
        v => v.approvalStatus === 'pending' || v.approvalStatus === 'under_review'
      );

      // Build invoice lookup by key_date_id, sorted by ipcNumber
      const invsByKd: Record<string, any[]> = {};
      for (const inv of allInvoices) {
        if (inv.keyDateId) {
          if (!invsByKd[inv.keyDateId]) invsByKd[inv.keyDateId] = [];
          invsByKd[inv.keyDateId].push(inv);
        }
      }

      // Sort invoices by ipcNumber to find "previous IPC"
      const ipcsSorted = allInvoices
        .filter(i => i.ipcNumber != null)
        .sort((a, b) => (a.ipcNumber ?? 0) - (b.ipcNumber ?? 0));

      // KDs that already have an IPC invoice raised
      const billedKdIds = new Set(
        (allInvoices as any[])
          .filter(i => i.invoiceType === 'ipc' && i.keyDateId)
          .map(i => i.keyDateId)
      );

      const now = Date.now();

      const kds: KDReadiness[] = (keyDates as any[]).map((kd, idx) => {
        // Use KD-specific linked VOs; fall back to project-level pending VOs
        const linkedVOs = vosByKd[kd.id] ?? [];
        const vosForCheck = linkedVOs.length > 0 ? linkedVOs : (allVOs as any[]);
        const hasUnapprovedVOs = vosForCheck.some(
          v => v.approvalStatus === 'pending' || v.approvalStatus === 'under_review'
        );
        const voCount = linkedVOs.length > 0 ? linkedVOs.length : projectUnapprovedVOs.length;

        // LD: days delayed
        const ldDaysDelayed = kd.status === 'delayed' && kd.targetDate
          ? Math.max(0, Math.ceil((now - kd.targetDate) / 86_400_000))
          : 0;

        // Prev IPC: the most recent IPC whose ipcNumber < any IPC for this KD (or the last one overall)
        const myIpcs = invsByKd[kd.id] ?? [];
        const myMinIpc = myIpcs.length > 0 ? Math.min(...myIpcs.map((i: any) => i.ipcNumber ?? 999)) : 999;
        const prevIpcs = ipcsSorted.filter(i => (i.ipcNumber ?? 0) < myMinIpc);
        const prevIpc = prevIpcs.length > 0 ? prevIpcs[prevIpcs.length - 1] : null;
        const prevIpcExists = prevIpc !== null;
        const prevIpcPaid = prevIpc?.paymentStatus === 'paid';

        const isBilled = billedKdIds.has(kd.id);
        const billedInvoice = isBilled
          ? (allInvoices as any[]).find(i => i.keyDateId === kd.id && i.invoiceType === 'ipc')
          : null;

        const checks = buildChecks({
          hasUnapprovedVOs,
          voCount,
          ldDaysDelayed,
          prevIpcPaid,
          prevIpcExists,
        });

        return {
          kdId: kd.id,
          kdCode: kd.code ?? `KD-${idx + 1}`,
          kdDescription: kd.description ?? kd.name ?? '',
          status: kd.status,
          weightage: kd.weightage ?? 0,
          targetDate: kd.targetDate,
          checks,
          readiness: computeReadiness(checks),
          isBilled,
          billedIpcNumber: billedInvoice?.ipcNumber ?? null,
        };
      });

      dispatch({ type: 'SET_KDS', kds });
      // Auto-expand first incomplete KD
      const firstIncomplete = kds.find(k => k.readiness !== 'safe');
      if (firstIncomplete) {
        dispatch({ type: 'SET_EXPANDED', kdId: firstIncomplete.kdId });
      }
    } catch (error) {
      logger.error('[MilestoneReadiness] Load error', error as Error);
      Alert.alert('Error', 'Failed to load KD readiness data');
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [projectId]);

  useEffect(() => { loadKDs(); }, [loadKDs]);

  const safeCount = state.kds.filter(k => k.readiness === 'safe').length;
  const holdCount = state.kds.filter(k => k.readiness === 'hold').length;
  const conditionalCount = state.kds.filter(k => k.readiness === 'conditional').length;

  if (!projectId) {
    return <View style={styles.emptyContainer}><Text style={styles.emptyText}>No project assigned</Text></View>;
  }

  if (state.loading) {
    return <View style={styles.emptyContainer}><ActivityIndicator size="large" color="#007AFF" /></View>;
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>

      {/* Summary banner */}
      <View style={styles.summaryBanner}>
        <View style={styles.summaryItem}>
          <Icon name="check-circle" size={20} color="#34C759" />
          <Text style={[styles.summaryCount, { color: '#34C759' }]}>{safeCount}</Text>
          <Text style={styles.summaryLabel}>Safe</Text>
        </View>
        <View style={styles.summaryItem}>
          <Icon name="alert-circle" size={20} color="#FF9500" />
          <Text style={[styles.summaryCount, { color: '#FF9500' }]}>{conditionalCount}</Text>
          <Text style={styles.summaryLabel}>Conditional</Text>
        </View>
        <View style={styles.summaryItem}>
          <Icon name="close-circle" size={20} color="#FF3B30" />
          <Text style={[styles.summaryCount, { color: '#FF3B30' }]}>{holdCount}</Text>
          <Text style={styles.summaryLabel}>Hold</Text>
        </View>
        <View style={styles.summaryItem}>
          <Icon name="format-list-checks" size={20} color="#007AFF" />
          <Text style={[styles.summaryCount, { color: '#007AFF' }]}>{state.kds.length}</Text>
          <Text style={styles.summaryLabel}>Total KDs</Text>
        </View>
      </View>

      <Text style={styles.helpText}>
        Tap a KD to expand its pre-IPC checklist. Toggle manual items and verify auto-checks before raising an IPC.
      </Text>

      {state.kds.length === 0 && (
        <View style={styles.emptyList}>
          <Icon name="calendar-check-outline" size={48} color="#ccc" />
          <Text style={styles.emptyListText}>No Key Dates found for this project</Text>
        </View>
      )}

      {state.kds.map(kd => {
        // Already-billed KD — show compact billed card, no checklist
        if (kd.isBilled) {
          return (
            <View key={kd.kdId} style={[styles.kdCard, styles.billedCard]}>
              <View style={styles.kdHeader}>
                <View style={styles.kdHeaderLeft}>
                  <Text style={styles.kdCode}>{kd.kdCode}</Text>
                  <Text style={styles.kdDesc} numberOfLines={1}>{kd.kdDescription}</Text>
                  <Text style={styles.kdMetaText}>{kd.weightage}%</Text>
                </View>
                <View style={styles.kdHeaderRight}>
                  <Chip
                    icon="check-circle"
                    style={styles.billedChip}
                    textStyle={{ color: '#34C759', fontSize: 11 }}
                  >
                    {kd.billedIpcNumber != null
                      ? `IPC-${String(kd.billedIpcNumber).padStart(3, '0')} Raised`
                      : 'IPC Raised'}
                  </Chip>
                </View>
              </View>
            </View>
          );
        }

        const cfg = READINESS_CONFIG[kd.readiness];
        const isExpanded = state.expandedKdId === kd.kdId;
        const checkedCount = kd.checks.filter(c => c.checked).length;
        const totalCount = kd.checks.length;

        return (
          <View key={kd.kdId} style={[styles.kdCard, { borderLeftColor: cfg.color }]}>
            {/* KD Header — always visible */}
            <TouchableOpacity
              style={styles.kdHeader}
              onPress={() => dispatch({ type: 'SET_EXPANDED', kdId: isExpanded ? null : kd.kdId })}
            >
              <View style={styles.kdHeaderLeft}>
                <Text style={styles.kdCode}>{kd.kdCode}</Text>
                <Text style={styles.kdDesc} numberOfLines={2}>{kd.kdDescription}</Text>
                <View style={styles.kdMeta}>
                  <Text style={styles.kdMetaText}>
                    {kd.weightage}% • {new Date(kd.targetDate).toLocaleDateString('en-IN')}
                  </Text>
                  <Text style={[styles.kdMetaText, { color: '#007AFF', marginLeft: 8 }]}>
                    {checkedCount}/{totalCount} checks
                  </Text>
                </View>
              </View>
              <View style={styles.kdHeaderRight}>
                <Chip
                  icon={cfg.icon}
                  style={[styles.readinessChip, { backgroundColor: cfg.color + '22' }]}
                  textStyle={{ color: cfg.color, fontSize: 11 }}
                >
                  {cfg.label}
                </Chip>
                <Icon
                  name={isExpanded ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color="#999"
                  style={{ marginTop: 8 }}
                />
              </View>
            </TouchableOpacity>

            {/* Checklist — expanded */}
            {isExpanded && (
              <View style={styles.checklist}>
                <Divider style={{ marginBottom: 8 }} />
                {kd.checks.map(check => (
                  <CheckItemRow
                    key={check.id}
                    item={check}
                    onToggle={() => dispatch({ type: 'TOGGLE_CHECK', kdId: kd.kdId, checkId: check.id })}
                  />
                ))}

                {kd.readiness === 'safe' && (
                  <TouchableOpacity
                    style={styles.proceedBtn}
                    onPress={() => navigation.navigate('KDBilling')}
                  >
                    <Icon name="calendar-check" size={18} color="#fff" />
                    <Text style={styles.proceedBtnText}>Proceed to KD Billing →</Text>
                  </TouchableOpacity>
                )}
                {kd.readiness === 'conditional' && (
                  <View style={styles.conditionalBanner}>
                    <Icon name="alert" size={14} color="#FF9500" />
                    <Text style={styles.conditionalText}>
                      Optional items incomplete — you may proceed but review these before submission.
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        );
      })}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
};

// ==================== Styles ====================

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 16 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 16, color: '#666' },

  summaryBanner: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    elevation: 2,
    justifyContent: 'space-around',
  },
  summaryItem: { alignItems: 'center', gap: 4 },
  summaryCount: { fontSize: 20, fontWeight: '800' },
  summaryLabel: { fontSize: 11, color: '#888' },

  helpText: { fontSize: 12, color: '#888', marginBottom: 14, fontStyle: 'italic' },

  kdCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 10,
    elevation: 2,
    borderLeftWidth: 4,
    overflow: 'hidden',
  },
  kdHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 14,
  },
  kdHeaderLeft: { flex: 1, marginRight: 8 },
  kdCode: { fontSize: 13, fontWeight: '700', color: '#007AFF', marginBottom: 2 },
  kdDesc: { fontSize: 13, color: '#333', marginBottom: 4 },
  kdMeta: { flexDirection: 'row' },
  kdMetaText: { fontSize: 11, color: '#888' },
  kdHeaderRight: { alignItems: 'flex-end' },
  readinessChip: {},

  checklist: { paddingHorizontal: 14, paddingBottom: 14 },

  proceedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#34C759',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 12,
    justifyContent: 'center',
  },
  proceedBtnText: { fontSize: 14, fontWeight: '600', color: '#fff' },

  conditionalBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: '#FF950011',
    borderRadius: 6,
    padding: 10,
    marginTop: 10,
  },
  conditionalText: { flex: 1, fontSize: 12, color: '#856404' },

  billedCard: { borderLeftColor: '#34C759', opacity: 0.75 },
  billedChip: { backgroundColor: '#34C75922' },

  emptyList: { alignItems: 'center', paddingVertical: 40 },
  emptyListText: { fontSize: 14, color: '#999', marginTop: 12 },
});

export default function MilestoneReadinessScreenWithBoundary() {
  return (
    <ErrorBoundary name="MilestoneReadinessScreen">
      <MilestoneReadinessScreen />
    </ErrorBoundary>
  );
}
