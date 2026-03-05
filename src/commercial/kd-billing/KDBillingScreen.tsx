/**
 * KDBillingScreen
 *
 * Links contractual Key Dates to billing events (IPCs).
 * Shows all project Key Dates, which are billable, and which have been invoiced.
 * Allows generating a pre-filled IPC invoice from any completed, unbilled KD.
 *
 * @since v52 - Sprint 1: Commercial Advanced Billing
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Alert,
  ScrollView,
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import {
  Portal,
  Dialog,
  Button,
  TextInput,
  Chip,
  ProgressBar,
  Divider,
} from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useCommercial } from '../context/CommercialContext';
import { useAuth } from '../../auth/AuthContext';
import { database } from '../../../models/database';
import { Q } from '@nozbe/watermelondb';
import { logger } from '../../services/LoggingService';
import { formatCurrency } from '../cost-tracking/utils/costFormatters';
import { COLORS } from '../../theme/colors';

// ==================== Types ====================

interface KDRow {
  id: string;
  code: string;
  description: string;
  weightage: number;
  targetDate?: number;
  actualDate?: number;
  status: string; // 'not_started' | 'in_progress' | 'completed' | 'delayed'
  delayDamagesInitial: number;
  delayDamagesExtended: number;
  // billing
  billedInvoiceId?: string;
  ipcNumber?: number;
  netAmount?: number;
}

interface ContractSummary {
  contractValue: number;
  totalBilled: number;
  retentionPct: number;
  advanceRecoveryPct: number;
  advanceMobilization: number;
  nextIpcNumber: number;
  dlpMonths: number;
}

interface IPCFormState {
  grossAmount: string;
  retentionDeducted: string;
  advanceRecovered: string;
  ldDeducted: string;
  tdsDeducted: string;
  netAmount: number;
  ipcNumber: number;
  invoiceDate: Date;
  showDatePicker: boolean;
}

const STATUS_COLOR: Record<string, string> = {
  completed: COLORS.SUCCESS,
  in_progress: COLORS.INFO,
  delayed: COLORS.ERROR,
  not_started: COLORS.DISABLED,
};

const STATUS_LABEL: Record<string, string> = {
  completed: 'Completed',
  in_progress: 'In Progress',
  delayed: 'Delayed',
  not_started: 'Not Started',
};

// ==================== Helpers ====================

const computeNet = (state: IPCFormState): number => {
  const g = parseFloat(state.grossAmount) || 0;
  const r = parseFloat(state.retentionDeducted) || 0;
  const a = parseFloat(state.advanceRecovered) || 0;
  const l = parseFloat(state.ldDeducted) || 0;
  const t = parseFloat(state.tdsDeducted) || 0;
  return Math.max(0, g - r - a - l - t);
};

// ==================== Main Screen ====================

const KDBillingScreen: React.FC = () => {
  const { projectId, projectName } = useCommercial();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [kdRows, setKdRows] = useState<KDRow[]>([]);
  const [summary, setSummary] = useState<ContractSummary>({
    contractValue: 0,
    totalBilled: 0,
    retentionPct: 5,
    advanceRecoveryPct: 10,
    advanceMobilization: 0,
    nextIpcNumber: 1,
    dlpMonths: 24,
  });

  // IPC generation dialog
  const [dialogVisible, setDialogVisible] = useState(false);
  const [selectedKD, setSelectedKD] = useState<KDRow | null>(null);
  const [ipcForm, setIpcForm] = useState<IPCFormState>({
    grossAmount: '',
    retentionDeducted: '',
    advanceRecovered: '',
    ldDeducted: '0',
    tdsDeducted: '0',
    netAmount: 0,
    ipcNumber: 1,
    invoiceDate: new Date(),
    showDatePicker: false,
  });
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState('');

  // ── Load data ──────────────────────────────────────────
  const loadData = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const projectsCol = database.collections.get('projects');
      const keyDatesCol = database.collections.get('key_dates');
      const invoicesCol = database.collections.get('invoices');

      const [projectArr, keyDates, invoices] = await Promise.all([
        projectsCol.query(Q.where('id', projectId)).fetch(),
        keyDatesCol
          .query(Q.where('project_id', projectId), Q.sortBy('sequence_order', Q.asc))
          .fetch(),
        invoicesCol
          .query(
            Q.where('project_id', projectId),
            Q.where('key_date_id', Q.notEq(null))
          )
          .fetch(),
      ]);

      const project: any = projectArr[0];
      const contractValue = project?.contractValue ?? 0;
      const retentionPct = project?.retentionPct ?? 5;
      const advanceRecoveryPct = project?.advanceRecoveryPct ?? 10;
      const advanceMobilization = project?.advanceMobilization ?? 0;

      // Map invoices by keyDateId
      const invoiceByKd: Record<string, any> = {};
      for (const inv of invoices as any[]) {
        if (inv.keyDateId) invoiceByKd[inv.keyDateId] = inv;
      }

      const totalBilled = (invoices as any[]).reduce(
        (sum: number, inv: any) => sum + (inv.grossAmount ?? inv.amount ?? 0),
        0
      );

      const nextIpcNumber =
        Math.max(0, ...(invoices as any[]).map((i: any) => i.ipcNumber ?? 0)) + 1;

      const rows: KDRow[] = (keyDates as any[]).map((kd: any) => {
        const billedInv = invoiceByKd[kd.id];
        return {
          id: kd.id,
          code: kd.code,
          description: kd.description,
          weightage: kd.weightage ?? 0,
          targetDate: kd.targetDate,
          actualDate: kd.actualDate,
          status: kd.status,
          delayDamagesInitial: kd.delayDamagesInitial ?? 1,
          delayDamagesExtended: kd.delayDamagesExtended ?? 10,
          billedInvoiceId: billedInv?.id,
          ipcNumber: billedInv?.ipcNumber,
          netAmount: billedInv?.netAmount ?? billedInv?.amount,
        };
      });

      const dlpMonths = project?.dlpMonths ?? 24;
      setKdRows(rows);
      setSummary({ contractValue, totalBilled, retentionPct, advanceRecoveryPct, advanceMobilization, nextIpcNumber, dlpMonths });
    } catch (err) {
      logger.error('[KDBillingScreen] Load error:', err as Error);
      Alert.alert('Error', 'Failed to load Key Date billing data');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Open IPC dialog for a KD ───────────────────────────
  const openIPCDialog = useCallback(
    (kd: KDRow) => {
      if (!summary.contractValue) {
        Alert.alert(
          'Contract Value Not Set',
          'Please set the project contract value before generating an IPC.'
        );
        return;
      }
      const gross = (summary.contractValue * kd.weightage) / 100;
      const retention = (gross * summary.retentionPct) / 100;
      const advance = Math.min(
        (gross * summary.advanceRecoveryPct) / 100,
        summary.advanceMobilization
      );

      setSelectedKD(kd);
      const form: IPCFormState = {
        grossAmount: gross.toFixed(2),
        retentionDeducted: retention.toFixed(2),
        advanceRecovered: advance.toFixed(2),
        ldDeducted: '0',
        tdsDeducted: '0',
        netAmount: Math.max(0, gross - retention - advance),
        ipcNumber: summary.nextIpcNumber,
        invoiceDate: new Date(),
        showDatePicker: false,
      };
      setIpcForm(form);
      setDialogVisible(true);
    },
    [summary]
  );

  const updateFormField = useCallback(
    (field: keyof IPCFormState, value: string) => {
      setIpcForm(prev => {
        const updated = { ...prev, [field]: value };
        updated.netAmount = computeNet(updated);
        return updated;
      });
    },
    []
  );

  // ── Save IPC as Invoice ────────────────────────────────
  const handleSaveIPC = useCallback(async () => {
    if (!selectedKD || !projectId || !user) return;
    const gross = parseFloat(ipcForm.grossAmount);
    if (!gross || gross <= 0) {
      Alert.alert('Validation', 'Gross amount must be greater than zero.');
      return;
    }

    setSaving(true);
    try {
      await database.write(async () => {
        const invoicesCol = database.collections.get('invoices');
        const retentionsCol = database.collections.get('retentions');

        // 1. Create IPC invoice
        const retentionAmt = parseFloat(ipcForm.retentionDeducted) || 0;
        const invoice = await invoicesCol.create((rec: any) => {
          rec.projectId = projectId;
          rec.poId = '';
          rec.invoiceNumber = `IPC-${String(ipcForm.ipcNumber).padStart(3, '0')}`;
          rec.invoiceDate = ipcForm.invoiceDate.getTime();
          rec.amount = ipcForm.netAmount; // legacy field = net
          rec.grossAmount = gross;
          rec.retentionDeducted = retentionAmt;
          rec.advanceRecovered = parseFloat(ipcForm.advanceRecovered) || 0;
          rec.ldDeducted = parseFloat(ipcForm.ldDeducted) || 0;
          rec.tdsDeducted = parseFloat(ipcForm.tdsDeducted) || 0;
          rec.netAmount = ipcForm.netAmount;
          rec.keyDateId = selectedKD.id;
          rec.invoiceType = 'ipc';
          rec.ipcNumber = ipcForm.ipcNumber;
          rec.cumulativeBilled = summary.totalBilled + gross;
          rec.paymentStatus = 'pending';
          rec.vendorId = '';
          rec.vendorName = 'Client';
          rec.createdBy = user.userId;
          rec.updatedAt = Date.now();
          rec.appSyncStatus = 'pending';
          rec.version = 1;
        });

        // 2. Auto-create client retention record
        if (retentionAmt > 0) {
          const dlpEnd = ipcForm.invoiceDate.getTime() +
            (summary.dlpMonths ?? 24) * 30 * 24 * 60 * 60 * 1000;
          await retentionsCol.create((rec: any) => {
            rec.projectId = projectId;
            rec.invoiceId = invoice.id;
            rec.partyType = 'client';
            rec.grossInvoiceAmount = gross;
            rec.retentionPct = summary.retentionPct;
            rec.retentionAmount = retentionAmt;
            rec.dlpEndDate = dlpEnd;
            rec.bgInLieu = false;
            rec.createdBy = user.userId;
            rec.updatedAt = Date.now();
            rec.appSyncStatus = 'pending';
            rec._version = 1;
          });
        }
      });

      setDialogVisible(false);
      setSnackbar(`IPC-${String(ipcForm.ipcNumber).padStart(3, '0')} created successfully`);
      await loadData();
    } catch (err) {
      logger.error('[KDBillingScreen] Save IPC error:', err as Error);
      Alert.alert('Error', 'Failed to save IPC');
    } finally {
      setSaving(false);
    }
  }, [selectedKD, projectId, user, ipcForm, summary.totalBilled, loadData]);

  // ── Render KD Row ──────────────────────────────────────
  const renderKDRow = useCallback(
    ({ item }: { item: KDRow }) => {
      const isBilled = !!item.billedInvoiceId;
      const isCompleted = item.status === 'completed';
      const billableAmount = summary.contractValue
        ? (summary.contractValue * item.weightage) / 100
        : 0;

      return (
        <View style={styles.kdCard}>
          <View style={styles.kdCardTop}>
            <View style={styles.kdCodeRow}>
              <Text style={styles.kdCode}>{item.code}</Text>
              <Chip
                style={[styles.statusChip, { backgroundColor: STATUS_COLOR[item.status] + '22' }]}
                textStyle={[styles.statusChipText, { color: STATUS_COLOR[item.status] }]}
              >
                {STATUS_LABEL[item.status] ?? item.status}
              </Chip>
            </View>
            <Text style={styles.kdDesc} numberOfLines={2}>{item.description}</Text>
          </View>

          <View style={styles.kdMeta}>
            <View style={styles.kdMetaItem}>
              <Text style={styles.kdMetaLabel}>Weightage</Text>
              <Text style={styles.kdMetaValue}>{item.weightage ?? 0}%</Text>
            </View>
            {!!billableAmount && (
              <View style={styles.kdMetaItem}>
                <Text style={styles.kdMetaLabel}>Billable Amount</Text>
                <Text style={styles.kdMetaValue}>{formatCurrency(billableAmount)}</Text>
              </View>
            )}
            {item.targetDate ? (
              <View style={styles.kdMetaItem}>
                <Text style={styles.kdMetaLabel}>Target Date</Text>
                <Text style={styles.kdMetaValue}>
                  {new Date(item.targetDate).toLocaleDateString()}
                </Text>
              </View>
            ) : null}
          </View>

          {isBilled ? (
            <View style={styles.billedBadge}>
              <Icon name="check-circle" size={16} color={COLORS.SUCCESS} />
              <Text style={styles.billedText}>
                IPC-{String(item.ipcNumber).padStart(3, '0')} raised
                {item.netAmount ? ` · Net: ${formatCurrency(item.netAmount)}` : ''}
              </Text>
            </View>
          ) : isCompleted ? (
            <Button
              mode="contained"
              compact
              style={styles.generateBtn}
              onPress={() => openIPCDialog(item)}
              icon="file-document-plus"
            >
              Generate IPC
            </Button>
          ) : (
            <Text style={styles.notBillableText}>Not yet billable</Text>
          )}
        </View>
      );
    },
    [summary.contractValue, openIPCDialog]
  );

  // ── Contract Summary Header ────────────────────────────
  const billingProgress = summary.contractValue
    ? Math.min(1, summary.totalBilled / summary.contractValue)
    : 0;

  const ListHeader = (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryTitle}>Contract Billing Summary</Text>
      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Contract Value</Text>
          <Text style={styles.summaryValue}>{formatCurrency(summary.contractValue)}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Billed (Gross)</Text>
          <Text style={[styles.summaryValue, { color: COLORS.SUCCESS }]}>
            {formatCurrency(summary.totalBilled)}
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Balance</Text>
          <Text style={[styles.summaryValue, { color: COLORS.WARNING }]}>
            {formatCurrency(Math.max(0, summary.contractValue - summary.totalBilled))}
          </Text>
        </View>
      </View>
      <ProgressBar
        progress={billingProgress}
        color={COLORS.SUCCESS}
        style={styles.progressBar}
      />
      <Text style={styles.progressLabel}>
        {(billingProgress * 100).toFixed(1)}% billed of contract value
      </Text>
    </View>
  );

  // ── Render ─────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading KD Billing data…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={kdRows}
        keyExtractor={item => item.id}
        renderItem={renderKDRow}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Icon name="calendar-check" size={48} color={COLORS.DISABLED} />
            <Text style={styles.emptyText}>No Key Dates found for this project</Text>
          </View>
        }
      />

      {/* ── IPC Generation Dialog ─────────────────────── */}
      <Portal>
        <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)} style={styles.dialog}>
          <Dialog.Title>Generate IPC for {selectedKD?.code}</Dialog.Title>
          <Dialog.ScrollArea style={styles.dialogScroll}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
              <ScrollView>
                <Text style={styles.dialogSubtitle} numberOfLines={2}>
                  {selectedKD?.description}
                </Text>
                <Divider style={{ marginVertical: 8 }} />

                <TextInput
                  label="IPC Number"
                  value={String(ipcForm.ipcNumber)}
                  onChangeText={v => setIpcForm(p => ({ ...p, ipcNumber: parseInt(v) || 1 }))}
                  keyboardType="numeric"
                  mode="outlined"
                  dense
                  style={styles.input}
                  left={<TextInput.Affix text="IPC-" />}
                />

                <TouchableOpacity
                  onPress={() => setIpcForm(p => ({ ...p, showDatePicker: true }))}
                  style={styles.dateTouchable}
                >
                  <Text style={styles.dateLabel}>Invoice Date</Text>
                  <Text style={styles.dateValue}>{ipcForm.invoiceDate.toLocaleDateString()}</Text>
                </TouchableOpacity>
                {ipcForm.showDatePicker && (
                  <DateTimePicker
                    value={ipcForm.invoiceDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(_e, date) => {
                      setIpcForm(p => ({
                        ...p,
                        showDatePicker: false,
                        invoiceDate: date ?? p.invoiceDate,
                      }));
                    }}
                  />
                )}

                <TextInput
                  label="Gross Billing Amount (₹)"
                  value={ipcForm.grossAmount}
                  onChangeText={v => updateFormField('grossAmount', v)}
                  keyboardType="decimal-pad"
                  mode="outlined"
                  dense
                  style={styles.input}
                />
                <TextInput
                  label="Retention Deducted (₹)"
                  value={ipcForm.retentionDeducted}
                  onChangeText={v => updateFormField('retentionDeducted', v)}
                  keyboardType="decimal-pad"
                  mode="outlined"
                  dense
                  style={styles.input}
                  right={
                    <TextInput.Affix
                      text={`${summary.retentionPct}%`}
                    />
                  }
                />
                <TextInput
                  label="Advance Recovery (₹)"
                  value={ipcForm.advanceRecovered}
                  onChangeText={v => updateFormField('advanceRecovered', v)}
                  keyboardType="decimal-pad"
                  mode="outlined"
                  dense
                  style={styles.input}
                />
                <TextInput
                  label="LD Deducted (₹)"
                  value={ipcForm.ldDeducted}
                  onChangeText={v => updateFormField('ldDeducted', v)}
                  keyboardType="decimal-pad"
                  mode="outlined"
                  dense
                  style={styles.input}
                />
                <TextInput
                  label="TDS / Other Deductions (₹)"
                  value={ipcForm.tdsDeducted}
                  onChangeText={v => updateFormField('tdsDeducted', v)}
                  keyboardType="decimal-pad"
                  mode="outlined"
                  dense
                  style={styles.input}
                />

                <View style={styles.netAmountRow}>
                  <Text style={styles.netLabel}>Net Receivable</Text>
                  <Text style={styles.netValue}>{formatCurrency(ipcForm.netAmount)}</Text>
                </View>
              </ScrollView>
            </KeyboardAvoidingView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setDialogVisible(false)}>Cancel</Button>
            <Button mode="contained" onPress={handleSaveIPC} loading={saving} disabled={saving}>
              Save IPC
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Snackbar (manual, no library import needed) */}
      {!!snackbar && (
        <TouchableOpacity
          style={styles.snackbar}
          onPress={() => setSnackbar('')}
        >
          <Text style={styles.snackbarText}>{snackbar}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// ==================== Styles ====================

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: '#666' },
  listContent: { padding: 12, paddingBottom: 24 },

  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  summaryTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  summaryItem: { flex: 1 },
  summaryLabel: { fontSize: 11, color: '#888', marginBottom: 2 },
  summaryValue: { fontSize: 14, fontWeight: '700' },
  progressBar: { height: 8, borderRadius: 4, marginBottom: 4 },
  progressLabel: { fontSize: 12, color: '#666', textAlign: 'right' },

  kdCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    elevation: 1,
  },
  kdCardTop: { marginBottom: 10 },
  kdCodeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  kdCode: { fontSize: 15, fontWeight: '700', color: '#333' },
  kdDesc: { fontSize: 13, color: '#555', lineHeight: 18 },
  statusChip: {},
  statusChipText: { fontSize: 11, lineHeight: 14 },

  kdMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 10 },
  kdMetaItem: { minWidth: 80 },
  kdMetaLabel: { fontSize: 10, color: '#888', marginBottom: 1 },
  kdMetaValue: { fontSize: 13, fontWeight: '600', color: '#333' },

  billedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
  },
  billedText: { fontSize: 13, color: COLORS.SUCCESS, fontWeight: '600' },
  generateBtn: { alignSelf: 'flex-start', marginTop: 2 },
  notBillableText: { fontSize: 12, color: '#999', fontStyle: 'italic' },

  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 15, color: '#888' },

  // Dialog
  dialog: { maxHeight: '85%' },
  dialogScroll: { maxHeight: 440 },
  dialogSubtitle: { fontSize: 13, color: '#555', marginBottom: 4 },
  input: { marginBottom: 10, backgroundColor: '#fff' },
  dateTouchable: {
    borderWidth: 1,
    borderColor: '#999',
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 10,
  },
  dateLabel: { fontSize: 11, color: '#666' },
  dateValue: { fontSize: 14, color: '#333', fontWeight: '500', marginTop: 2 },
  netAmountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    padding: 12,
    marginTop: 4,
  },
  netLabel: { fontSize: 15, fontWeight: '700' },
  netValue: { fontSize: 18, fontWeight: '800', color: '#1565C0' },

  snackbar: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: '#323232',
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  snackbarText: { color: '#fff', fontSize: 14 },
});

export default KDBillingScreen;
