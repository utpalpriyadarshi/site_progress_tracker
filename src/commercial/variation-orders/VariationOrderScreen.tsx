/**
 * VariationOrderScreen
 *
 * Tracks Variation Orders (VOs) for the project:
 * - List with status chips (pending/approved/rejected/under_review)
 * - Summary: total VO value, approved, revenue at risk, pending count
 * - "Include in next IPC" toggle for approved VOs
 * - Alert banner for at-risk VOs
 * - FAB to add new VO
 *
 * Sprint 3 — Commercial Advanced Billing
 */

import React, { useCallback, useReducer, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { FAB, Chip, Switch, Divider, TextInput, Button, Snackbar } from 'react-native-paper';
import { useSnackbar } from '../../hooks/useSnackbar';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { database } from '../../../models/database';
import { Q } from '@nozbe/watermelondb';
import { logger } from '../../services/LoggingService';
import { useCommercial } from '../context/CommercialContext';
import { useAuth } from '../../auth/AuthContext';
import ErrorBoundary from '../../components/common/ErrorBoundary';
import VariationOrderModel, { VOApprovalStatus } from '../../../models/VariationOrderModel';
import { SpinnerLoading } from '../../components/common/LoadingState';
import { COLORS } from '../../theme/colors';

// ==================== Types ====================

interface VOItem {
  id: string;
  voNumber: string;
  description: string;
  value: number;
  approvalStatus: VOApprovalStatus;
  executionPct: number;
  billableAmount: number;
  revenueAtRisk: number;
  marginImpact: number;
  includeInNextIpc: boolean;
  raisedDate: number;
  approvedDate?: number;
  notes?: string;
}

interface Summary {
  totalVOValue: number;
  approvedValue: number;
  revenueAtRisk: number;
  pendingCount: number;
  underReviewCount: number;
}

interface AddVOForm {
  voNumber: string;
  description: string;
  value: string;
  executionPct: string;
  marginImpact: string;
  notes: string;
}

type FilterTab = 'all' | 'pending' | 'approved' | 'rejected';

interface State {
  vos: VOItem[];
  summary: Summary;
  activeFilter: FilterTab;
  loading: boolean;
  showAddDialog: boolean;
  form: AddVOForm;
  saving: boolean;
}

type Action =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_DATA'; vos: VOItem[]; summary: Summary }
  | { type: 'SET_FILTER'; payload: FilterTab }
  | { type: 'SHOW_ADD'; payload: boolean }
  | { type: 'SET_FORM'; field: keyof AddVOForm; value: string }
  | { type: 'SET_SAVING'; payload: boolean }
  | { type: 'RESET_FORM' }
  | { type: 'TOGGLE_IPC'; voId: string; value: boolean };

const EMPTY_FORM: AddVOForm = {
  voNumber: '',
  description: '',
  value: '',
  executionPct: '0',
  marginImpact: '0',
  notes: '',
};

const EMPTY_SUMMARY: Summary = {
  totalVOValue: 0,
  approvedValue: 0,
  revenueAtRisk: 0,
  pendingCount: 0,
  underReviewCount: 0,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_DATA':
      return { ...state, vos: action.vos, summary: action.summary, loading: false };
    case 'SET_FILTER':
      return { ...state, activeFilter: action.payload };
    case 'SHOW_ADD':
      return { ...state, showAddDialog: action.payload };
    case 'SET_FORM':
      return { ...state, form: { ...state.form, [action.field]: action.value } };
    case 'SET_SAVING':
      return { ...state, saving: action.payload };
    case 'RESET_FORM':
      return { ...state, form: EMPTY_FORM, showAddDialog: false };
    case 'TOGGLE_IPC':
      return {
        ...state,
        vos: state.vos.map(v => v.id === action.voId ? { ...v, includeInNextIpc: action.value } : v),
      };
    default:
      return state;
  }
}

const initialState: State = {
  vos: [],
  summary: EMPTY_SUMMARY,
  activeFilter: 'all',
  loading: true,
  showAddDialog: false,
  form: EMPTY_FORM,
  saving: false,
};

// ==================== Formatters ====================

const formatCr = (val: number) => `₹${(val / 1_00_00_000).toFixed(2)} Cr`;
const formatL = (val: number) => `₹${(val / 1_00_000).toFixed(1)} L`;

const STATUS_CONFIG: Record<VOApprovalStatus, { color: string; label: string; icon: string }> = {
  pending:      { color: '#FF9500', label: 'Pending',      icon: 'clock-outline' },
  approved:     { color: '#34C759', label: 'Approved',     icon: 'check-circle-outline' },
  rejected:     { color: '#FF3B30', label: 'Rejected',     icon: 'close-circle-outline' },
  under_review: { color: '#007AFF', label: 'Under Review', icon: 'magnify' },
};

// ==================== Sub-components ====================

interface VOCardProps {
  item: VOItem;
  onToggleIPC: (id: string, value: boolean) => void;
  onUpdateStatus: (id: string, status: VOApprovalStatus) => void;
}

const VOCard: React.FC<VOCardProps> = ({ item, onToggleIPC, onUpdateStatus }) => {
  const cfg = STATUS_CONFIG[item.approvalStatus];
  const billableCr = item.billableAmount / 1_00_00_000;
  const valueCr = item.value / 1_00_00_000;

  const handleStatusChange = () => {
    const nextMap: Record<VOApprovalStatus, VOApprovalStatus> = {
      pending: 'under_review',
      under_review: 'approved',
      approved: 'approved',
      rejected: 'rejected',
    };
    if (item.approvalStatus === 'approved' || item.approvalStatus === 'rejected') return;
    Alert.alert(
      'Update Status',
      `Move "${item.voNumber}" to ${nextMap[item.approvalStatus].replace('_', ' ')}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: () => onUpdateStatus(item.id, nextMap[item.approvalStatus]) },
      ]
    );
  };

  return (
    <View style={styles.voCard}>
      <View style={styles.voCardHeader}>
        <Text style={styles.voNumber}>{item.voNumber}</Text>
        <TouchableOpacity onPress={handleStatusChange} disabled={item.approvalStatus === 'approved' || item.approvalStatus === 'rejected'}>
          <Chip
            icon={cfg.icon}
            style={[styles.statusChip, { backgroundColor: cfg.color + '22' }]}
            textStyle={{ color: cfg.color, fontSize: 11 }}
          >
            {cfg.label}
          </Chip>
        </TouchableOpacity>
      </View>

      <Text style={styles.voDesc} numberOfLines={2}>{item.description}</Text>

      <View style={styles.voMetrics}>
        <View style={styles.voMetricItem}>
          <Text style={styles.voMetricLabel}>VO Value</Text>
          <Text style={styles.voMetricValue}>{formatCr(item.value)}</Text>
        </View>
        <View style={styles.voMetricItem}>
          <Text style={styles.voMetricLabel}>Execution</Text>
          <Text style={styles.voMetricValue}>{item.executionPct}%</Text>
        </View>
        <View style={styles.voMetricItem}>
          <Text style={styles.voMetricLabel}>Billable</Text>
          <Text style={[styles.voMetricValue, { color: '#34C759' }]}>
            ₹{billableCr.toFixed(2)} Cr
          </Text>
        </View>
        {item.revenueAtRisk > 0 && (
          <View style={styles.voMetricItem}>
            <Text style={styles.voMetricLabel}>At Risk</Text>
            <Text style={[styles.voMetricValue, { color: '#FF3B30' }]}>
              {formatCr(item.revenueAtRisk)}
            </Text>
          </View>
        )}
      </View>

      {item.marginImpact !== 0 && (
        <Text style={[styles.marginText, { color: item.marginImpact >= 0 ? '#34C759' : '#FF3B30' }]}>
          Margin impact: {item.marginImpact >= 0 ? '+' : ''}{formatL(item.marginImpact)}
        </Text>
      )}

      {item.notes ? (
        <Text style={styles.voNotes} numberOfLines={1}>{item.notes}</Text>
      ) : null}

      {item.approvalStatus === 'approved' && (
        <View style={styles.ipcToggleRow}>
          <Text style={styles.ipcToggleLabel}>Include in next IPC</Text>
          <Switch
            value={item.includeInNextIpc}
            onValueChange={v => onToggleIPC(item.id, v)}
            color="#007AFF"
          />
        </View>
      )}
    </View>
  );
};

// ==================== Main Screen ====================

const VariationOrderScreen: React.FC = () => {
  const { projectId } = useCommercial();
  const { user } = useAuth();
  const { show: showSnackbar, snackbarProps } = useSnackbar();
  const [state, dispatch] = useReducer(reducer, initialState);

  const loadVOs = useCallback(async () => {
    if (!projectId) { dispatch({ type: 'SET_LOADING', payload: false }); return; }
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const vosCollection = database.collections.get<VariationOrderModel>('variation_orders');
      const rawVOs = await vosCollection.query(Q.where('project_id', projectId)).fetch() as any[];

      const vos: VOItem[] = rawVOs.map(v => ({
        id: v.id,
        voNumber: v.voNumber,
        description: v.description,
        value: v.value,
        approvalStatus: v.approvalStatus,
        executionPct: v.executionPct,
        billableAmount: v.billableAmount,
        revenueAtRisk: v.revenueAtRisk,
        marginImpact: v.marginImpact,
        includeInNextIpc: v.includeInNextIpc,
        raisedDate: v.raisedDate,
        approvedDate: v.approvedDate,
        notes: v.notes,
      }));

      const summary: Summary = vos.reduce((acc, v) => ({
        totalVOValue: acc.totalVOValue + v.value,
        approvedValue: acc.approvedValue + (v.approvalStatus === 'approved' ? v.value : 0),
        revenueAtRisk: acc.revenueAtRisk + v.revenueAtRisk,
        pendingCount: acc.pendingCount + (v.approvalStatus === 'pending' ? 1 : 0),
        underReviewCount: acc.underReviewCount + (v.approvalStatus === 'under_review' ? 1 : 0),
      }), EMPTY_SUMMARY);

      dispatch({ type: 'SET_DATA', vos, summary });
    } catch (error) {
      logger.error('[VariationOrders] Load error', error as Error);
      showSnackbar('Failed to load variation orders');
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [projectId, showSnackbar]);

  useEffect(() => { loadVOs(); }, [loadVOs]);

  const handleToggleIPC = useCallback(async (voId: string, value: boolean) => {
    try {
      await database.write(async () => {
        const col = database.collections.get<VariationOrderModel>('variation_orders');
        const rec = await col.find(voId);
        await rec.update((r: any) => { r.includeInNextIpc = value; r.updatedAt = Date.now(); });
      });
      dispatch({ type: 'TOGGLE_IPC', voId, value });
    } catch (error) {
      logger.error('[VariationOrders] Toggle IPC error', error as Error);
    }
  }, []);

  const handleUpdateStatus = useCallback(async (voId: string, status: VOApprovalStatus) => {
    try {
      await database.write(async () => {
        const col = database.collections.get<VariationOrderModel>('variation_orders');
        const rec = await col.find(voId);
        const billable = (rec.value * rec.executionPct) / 100;
        const atRisk = (status === 'pending' || status === 'under_review') ? rec.value : 0;
        await rec.update((r: any) => {
          r.approvalStatus = status;
          r.approvedDate = status === 'approved' ? Date.now() : null;
          r.billableAmount = billable;
          r.revenueAtRisk = atRisk;
          r.updatedAt = Date.now();
        });
      });
      loadVOs();
    } catch (error) {
      logger.error('[VariationOrders] Status update error', error as Error);
    }
  }, [loadVOs]);

  const handleSaveVO = useCallback(async () => {
    const { voNumber, description, value, executionPct, marginImpact, notes } = state.form;
    if (!voNumber.trim() || !description.trim() || !value.trim()) {
      showSnackbar('VO Number, Description and Value are required');
      return;
    }
    const valueNum = parseFloat(value) * 1_00_00_000; // user enters in Crore
    const execNum = Math.min(100, Math.max(0, parseFloat(executionPct) || 0));
    const marginNum = parseFloat(marginImpact) * 1_00_000 || 0; // user enters in Lakhs
    const billable = (valueNum * execNum) / 100;
    const atRisk = valueNum; // pending by default

    dispatch({ type: 'SET_SAVING', payload: true });
    try {
      await database.write(async () => {
        const col = database.collections.get<VariationOrderModel>('variation_orders');
        await col.create((rec: any) => {
          rec.projectId = projectId;
          rec.voNumber = voNumber.trim().toUpperCase();
          rec.description = description.trim();
          rec.value = valueNum;
          rec.approvalStatus = 'pending';
          rec.executionPct = execNum;
          rec.billableAmount = billable;
          rec.revenueAtRisk = atRisk;
          rec.marginImpact = marginNum;
          rec.includeInNextIpc = false;
          rec.raisedDate = Date.now();
          rec.notes = notes.trim() || null;
          rec.createdBy = user?.userId || 'commercial_manager';
          rec.updatedAt = Date.now();
          rec.appSyncStatus = 'pending';
          rec._version = 1;
        });
      });
      dispatch({ type: 'RESET_FORM' });
      loadVOs();
    } catch (error) {
      logger.error('[VariationOrders] Save error', error as Error);
      showSnackbar('Failed to save variation order');
    } finally {
      dispatch({ type: 'SET_SAVING', payload: false });
    }
  }, [state.form, projectId, user, loadVOs, showSnackbar]);

  const filteredVOs = state.vos.filter(v => {
    if (state.activeFilter === 'all') return true;
    if (state.activeFilter === 'pending') return v.approvalStatus === 'pending' || v.approvalStatus === 'under_review';
    return v.approvalStatus === state.activeFilter;
  });

  const atRiskCount = state.summary.pendingCount + state.summary.underReviewCount;

  if (!projectId) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No project assigned</Text>
      </View>
    );
  }

  if (state.loading) {
    return <SpinnerLoading message="Loading..." />;
  }

  return (
    <>
    <View style={styles.screen}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>

        {/* At-Risk Alert Banner */}
        {atRiskCount > 0 && (
          <View style={styles.alertBanner}>
            <Icon name="alert-triangle" size={18} color="#FF9500" />
            <Text style={styles.alertText}>
              {atRiskCount} VO{atRiskCount > 1 ? 's' : ''} pending approval —{' '}
              {formatCr(state.summary.revenueAtRisk)} at risk
            </Text>
          </View>
        )}

        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Variation Orders Summary</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total VO Value</Text>
              <Text style={styles.summaryValue}>{formatCr(state.summary.totalVOValue)}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Approved</Text>
              <Text style={[styles.summaryValue, { color: '#34C759' }]}>{formatCr(state.summary.approvedValue)}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Revenue at Risk</Text>
              <Text style={[styles.summaryValue, { color: '#FF3B30' }]}>{formatCr(state.summary.revenueAtRisk)}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Pending / Review</Text>
              <Text style={[styles.summaryValue, { color: '#FF9500' }]}>
                {state.summary.pendingCount} / {state.summary.underReviewCount}
              </Text>
            </View>
          </View>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterRow}>
          {(['all', 'pending', 'approved', 'rejected'] as FilterTab[]).map(f => (
            <TouchableOpacity
              key={f}
              style={[styles.filterTab, state.activeFilter === f && styles.filterTabActive]}
              onPress={() => dispatch({ type: 'SET_FILTER', payload: f })}
            >
              <Text style={[styles.filterTabText, state.activeFilter === f && styles.filterTabTextActive]}>
                {f === 'pending' ? 'Pending/Review' : f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Add VO Form (inline) */}
        {state.showAddDialog && (
          <View style={styles.addForm}>
            <Text style={styles.addFormTitle}>Add Variation Order</Text>
            <TextInput
              label="VO Number (e.g. VO-001)"
              value={state.form.voNumber}
              onChangeText={v => dispatch({ type: 'SET_FORM', field: 'voNumber', value: v })}
              mode="outlined"
              style={styles.input}
            />
            <TextInput
              label="Description"
              value={state.form.description}
              onChangeText={v => dispatch({ type: 'SET_FORM', field: 'description', value: v })}
              mode="outlined"
              multiline
              numberOfLines={2}
              style={styles.input}
            />
            <View style={styles.inputRow}>
              <TextInput
                label="Value (₹ Crore)"
                value={state.form.value}
                onChangeText={v => dispatch({ type: 'SET_FORM', field: 'value', value: v })}
                keyboardType="numeric"
                mode="outlined"
                style={[styles.input, styles.inputHalf]}
              />
              <TextInput
                label="Execution %"
                value={state.form.executionPct}
                onChangeText={v => dispatch({ type: 'SET_FORM', field: 'executionPct', value: v })}
                keyboardType="numeric"
                mode="outlined"
                style={[styles.input, styles.inputHalf]}
              />
            </View>
            <TextInput
              label="Margin Impact (₹ Lakhs, +/-)"
              value={state.form.marginImpact}
              onChangeText={v => dispatch({ type: 'SET_FORM', field: 'marginImpact', value: v })}
              keyboardType="numeric"
              mode="outlined"
              style={styles.input}
            />
            <TextInput
              label="Notes (optional)"
              value={state.form.notes}
              onChangeText={v => dispatch({ type: 'SET_FORM', field: 'notes', value: v })}
              mode="outlined"
              style={styles.input}
            />
            <View style={styles.addFormActions}>
              <Button mode="outlined" onPress={() => dispatch({ type: 'RESET_FORM' })}>Cancel</Button>
              <Button mode="contained" onPress={handleSaveVO} loading={state.saving}>Save</Button>
            </View>
          </View>
        )}

        {/* VO List */}
        {filteredVOs.length === 0 ? (
          <View style={styles.emptyList}>
            <Icon name="file-document-edit-outline" size={48} color="#ccc" />
            <Text style={styles.emptyListText}>
              {state.activeFilter === 'all' ? 'No variation orders yet' : `No ${state.activeFilter} variation orders`}
            </Text>
          </View>
        ) : (
          filteredVOs.map(item => (
            <VOCard
              key={item.id}
              item={item}
              onToggleIPC={handleToggleIPC}
              onUpdateStatus={handleUpdateStatus}
            />
          ))
        )}

        <View style={{ height: 80 }} />
      </ScrollView>

      {!state.showAddDialog && (
        <FAB
          icon="plus"
          style={styles.fab}
          color="#FFFFFF"
          onPress={() => dispatch({ type: 'SHOW_ADD', payload: true })}
          label="Add VO"
        />
      )}
    </View>
    <Snackbar {...snackbarProps} duration={3000} />
    </>
  );
};

// ==================== Styles ====================

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f5f5f5' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 16, color: '#666' },

  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3CD',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    gap: 8,
  },
  alertText: { flex: 1, fontSize: 13, color: '#856404' },

  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  summaryTitle: { fontSize: 15, fontWeight: '600', color: '#333', marginBottom: 12 },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  summaryItem: { flex: 1, minWidth: '45%', alignItems: 'center' },
  summaryLabel: { fontSize: 11, color: '#888', marginBottom: 4 },
  summaryValue: { fontSize: 15, fontWeight: '700', color: '#333' },

  filterRow: { flexDirection: 'row', marginBottom: 12, gap: 4 },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#fff',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  filterTabActive: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  filterTabText: { fontSize: 11, color: '#666', textAlign: 'center' },
  filterTabTextActive: { color: '#fff', fontWeight: '600' },

  addForm: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  addFormTitle: { fontSize: 15, fontWeight: '600', color: '#333', marginBottom: 12 },
  input: { marginBottom: 8 },
  inputRow: { flexDirection: 'row', gap: 8 },
  inputHalf: { flex: 1 },
  addFormActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 8 },

  voCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    elevation: 2,
  },
  voCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  voNumber: { fontSize: 14, fontWeight: '700', color: '#007AFF' },
  statusChip: {},
  voDesc: { fontSize: 13, color: '#555', marginBottom: 10 },
  voMetrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  voMetricItem: { alignItems: 'center', minWidth: '22%' },
  voMetricLabel: { fontSize: 10, color: '#888', marginBottom: 2 },
  voMetricValue: { fontSize: 13, fontWeight: '600', color: '#333' },
  marginText: { fontSize: 12, fontWeight: '500', marginBottom: 4 },
  voNotes: { fontSize: 12, color: '#888', fontStyle: 'italic' },

  ipcToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  ipcToggleLabel: { fontSize: 13, color: '#333' },

  emptyList: { alignItems: 'center', paddingVertical: 40 },
  emptyListText: { fontSize: 14, color: '#999', marginTop: 12 },

  fab: { position: 'absolute', right: 16, bottom: 16, backgroundColor: COLORS.PRIMARY },
});

export default function VariationOrderScreenWithBoundary() {
  return (
    <ErrorBoundary name="VariationOrderScreen">
      <VariationOrderScreen />
    </ErrorBoundary>
  );
}
