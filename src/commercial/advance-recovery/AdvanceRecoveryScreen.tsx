/**
 * AdvanceRecoveryScreen
 *
 * Tracks mobilization/performance advances issued and their recovery progress.
 * Shows balance outstanding, recovery % per IPC, and projected full-recovery milestone.
 * Allows adding new advance records.
 *
 * @since v53 — Sprint 2: Advance Recovery
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { Portal, Dialog, Button, TextInput, Chip, ProgressBar, FAB, Snackbar } from 'react-native-paper';
import { useSnackbar } from '../../hooks/useSnackbar';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useCommercial } from '../context/CommercialContext';
import { useAuth } from '../../auth/AuthContext';
import { database } from '../../../models/database';
import { Q } from '@nozbe/watermelondb';
import { logger } from '../../services/LoggingService';
import { formatCurrency } from '../cost-tracking/utils/costFormatters';
import { COLORS } from '../../theme/colors';
import type { AdvanceType } from '../../../models/AdvanceModel';

// ==================== Types ====================

interface AdvanceRow {
  id: string;
  advanceType: AdvanceType;
  advanceAmount: number;
  recoveryPct: number;
  totalRecovered: number;
  issuedDate: number;
  fullyRecoveredDate?: number;
  notes?: string;
}

interface ImpactRow {
  kdCode: string;
  kdDescription: string;
  grossBilling: number;
  recoveryAmount: number;
}

const TYPE_LABELS: Record<AdvanceType, string> = {
  mobilization: 'Mobilization',
  performance: 'Performance',
  material: 'Material',
};

const TYPE_COLORS: Record<AdvanceType, string> = {
  mobilization: COLORS.PRIMARY,
  performance: COLORS.SUCCESS,
  material: COLORS.WARNING,
};

const ADVANCE_TYPES: AdvanceType[] = ['mobilization', 'performance', 'material'];

// ==================== Main Screen ====================

const AdvanceRecoveryScreen: React.FC = () => {
  const { projectId } = useCommercial();
  const { user } = useAuth();
  const { show: showSnackbar, snackbarProps } = useSnackbar();

  const [loading, setLoading] = useState(true);
  const [advances, setAdvances] = useState<AdvanceRow[]>([]);
  const [nextBillImpact, setNextBillImpact] = useState<ImpactRow[]>([]);
  const [contractValue, setContractValue] = useState(0);

  // Add advance dialog
  const [dialogVisible, setDialogVisible] = useState(false);
  const [formType, setFormType] = useState<AdvanceType>('mobilization');
  const [formAmount, setFormAmount] = useState('');
  const [formRecoveryPct, setFormRecoveryPct] = useState('10');
  const [formDate, setFormDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [formNotes, setFormNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // ── Load data ──────────────────────────────────────────
  const loadData = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const [projectArr, advancesArr, keyDates] = await Promise.all([
        database.collections.get('projects').query(Q.where('id', projectId)).fetch(),
        database.collections.get('advances').query(
          Q.where('project_id', projectId),
          Q.sortBy('issued_date', Q.desc)
        ).fetch(),
        database.collections.get('key_dates').query(
          Q.where('project_id', projectId),
          Q.where('status', Q.notEq('completed')),
          Q.sortBy('sequence_order', Q.asc)
        ).fetch(),
      ]);

      const project: any = projectArr[0];
      const cv = project?.contractValue ?? 0;
      setContractValue(cv);

      const rows: AdvanceRow[] = (advancesArr as any[]).map((a: any) => ({
        id: a.id,
        advanceType: a.advanceType,
        advanceAmount: a.advanceAmount,
        recoveryPct: a.recoveryPct,
        totalRecovered: a.totalRecovered,
        issuedDate: a.issuedDate,
        fullyRecoveredDate: a.fullyRecoveredDate,
        notes: a.notes,
      }));
      setAdvances(rows);

      // Compute impact on next 3 pending KDs
      const pendingKDs = (keyDates as any[]).slice(0, 3);
      const kdImpact: ImpactRow[] = pendingKDs.map((kd: any) => {
        const gross = cv ? (cv * (kd.weightage ?? 0)) / 100 : 0;
        const totalRecovery = rows
          .filter(a => !a.fullyRecoveredDate)
          .reduce((sum, a) => sum + Math.min(
            (gross * a.recoveryPct) / 100,
            a.advanceAmount - a.totalRecovered
          ), 0);
        return {
          kdCode: kd.code,
          kdDescription: kd.description,
          grossBilling: gross,
          recoveryAmount: totalRecovery,
        };
      });
      setNextBillImpact(kdImpact);
    } catch (err) {
      logger.error('[AdvanceRecovery] Load error:', err as Error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Save new advance ───────────────────────────────────
  const handleSave = useCallback(async () => {
    const amount = parseFloat(formAmount);
    const pct = parseFloat(formRecoveryPct);
    if (!amount || amount <= 0) { showSnackbar('Enter a valid advance amount'); return; }
    if (!pct || pct <= 0 || pct > 100) { showSnackbar('Recovery % must be between 1 and 100'); return; }

    setSaving(true);
    try {
      await database.write(async () => {
        await database.collections.get('advances').create((rec: any) => {
          rec.projectId = projectId;
          rec.advanceType = formType;
          rec.advanceAmount = amount;
          rec.recoveryPct = pct;
          rec.totalRecovered = 0;
          rec.issuedDate = formDate.getTime();
          rec.notes = formNotes || null;
          rec.createdBy = user?.userId ?? '';
          rec.updatedAt = Date.now();
          rec.appSyncStatus = 'pending';
          rec._version = 1;
        });
      });
      setDialogVisible(false);
      resetForm();
      await loadData();
    } catch (err) {
      logger.error('[AdvanceRecovery] Save error:', err as Error);
      showSnackbar('Failed to save advance');
    } finally {
      setSaving(false);
    }
  }, [projectId, user, formType, formAmount, formRecoveryPct, formDate, formNotes, loadData, showSnackbar]);

  const resetForm = () => {
    setFormType('mobilization');
    setFormAmount('');
    setFormRecoveryPct('10');
    setFormDate(new Date());
    setFormNotes('');
  };

  // ── Render advance card ────────────────────────────────
  const renderAdvance = ({ item }: { item: AdvanceRow }) => {
    const balance = Math.max(0, item.advanceAmount - item.totalRecovered);
    const progress = item.advanceAmount > 0
      ? Math.min(1, item.totalRecovered / item.advanceAmount)
      : 0;
    const isFullyRecovered = item.totalRecovered >= item.advanceAmount;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Chip
            style={[styles.typeChip, { backgroundColor: TYPE_COLORS[item.advanceType] + '20' }]}
            textStyle={[styles.typeChipText, { color: TYPE_COLORS[item.advanceType] }]}
          >
            {TYPE_LABELS[item.advanceType]}
          </Chip>
          {isFullyRecovered && (
            <Chip style={styles.recoveredChip} textStyle={styles.recoveredChipText}>
              Fully Recovered
            </Chip>
          )}
        </View>

        <View style={styles.amountRow}>
          <View style={styles.amountItem}>
            <Text style={styles.amountLabel}>Advance Issued</Text>
            <Text style={styles.amountValue}>{formatCurrency(item.advanceAmount)}</Text>
          </View>
          <View style={styles.amountItem}>
            <Text style={styles.amountLabel}>Recovered</Text>
            <Text style={[styles.amountValue, { color: COLORS.SUCCESS }]}>
              {formatCurrency(item.totalRecovered)}
            </Text>
          </View>
          <View style={styles.amountItem}>
            <Text style={styles.amountLabel}>Balance</Text>
            <Text style={[styles.amountValue, { color: balance > 0 ? COLORS.ERROR : COLORS.SUCCESS }]}>
              {formatCurrency(balance)}
            </Text>
          </View>
        </View>

        <ProgressBar
          progress={progress}
          color={isFullyRecovered ? COLORS.SUCCESS : TYPE_COLORS[item.advanceType]}
          style={styles.progressBar}
        />
        <Text style={styles.progressLabel}>
          {(progress * 100).toFixed(1)}% recovered · {item.recoveryPct}% per IPC
        </Text>

        <Text style={styles.dateText}>
          Issued: {new Date(item.issuedDate).toLocaleDateString()}
          {item.fullyRecoveredDate
            ? ` · Recovered: ${new Date(item.fullyRecoveredDate).toLocaleDateString()}`
            : ''}
        </Text>
        {item.notes ? <Text style={styles.notesText}>{item.notes}</Text> : null}
      </View>
    );
  };

  // ── Totals ─────────────────────────────────────────────
  const totalAdvance = advances.reduce((s, a) => s + a.advanceAmount, 0);
  const totalRecovered = advances.reduce((s, a) => s + a.totalRecovered, 0);
  const totalBalance = Math.max(0, totalAdvance - totalRecovered);
  const overallProgress = totalAdvance > 0 ? Math.min(1, totalRecovered / totalAdvance) : 0;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading advance data…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={advances}
        keyExtractor={item => item.id}
        renderItem={renderAdvance}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListHeaderComponent={
          <>
            {/* Summary */}
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Advance Recovery Summary</Text>
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Total Advances</Text>
                  <Text style={styles.summaryValue}>{formatCurrency(totalAdvance)}</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Recovered</Text>
                  <Text style={[styles.summaryValue, { color: COLORS.SUCCESS }]}>
                    {formatCurrency(totalRecovered)}
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Outstanding</Text>
                  <Text style={[styles.summaryValue, { color: COLORS.ERROR }]}>
                    {formatCurrency(totalBalance)}
                  </Text>
                </View>
              </View>
              {totalAdvance > 0 && (
                <>
                  <ProgressBar progress={overallProgress} color={COLORS.PRIMARY} style={styles.progressBar} />
                  <Text style={styles.progressLabel}>
                    {(overallProgress * 100).toFixed(1)}% recovered overall
                  </Text>
                </>
              )}
            </View>

            {/* Impact on next 3 IPCs */}
            {nextBillImpact.length > 0 && (
              <View style={styles.impactCard}>
                <Text style={styles.impactTitle}>Impact on Next {nextBillImpact.length} Pending KD Bills</Text>
                {nextBillImpact.map(row => (
                  <View key={row.kdCode} style={styles.impactRow}>
                    <Text style={styles.impactKD}>{row.kdCode}</Text>
                    <Text style={styles.impactDesc} numberOfLines={1}>{row.kdDescription}</Text>
                    <View style={styles.impactAmounts}>
                      <View style={styles.impactAmountItem}>
                        <Text style={styles.impactAmountLabel}>Gross Bill</Text>
                        <Text style={styles.impactGross}>{formatCurrency(row.grossBilling)}</Text>
                      </View>
                      <View style={styles.impactAmountItem}>
                        <Text style={styles.impactAmountLabel}>Advance Recovery</Text>
                        <Text style={[styles.impactRecovery, { color: COLORS.ERROR }]}>
                          −{formatCurrency(row.recoveryAmount)}
                        </Text>
                      </View>
                      <View style={styles.impactAmountItem}>
                        <Text style={styles.impactAmountLabel}>Net Payable</Text>
                        <Text style={[styles.impactGross, { color: COLORS.SUCCESS }]}>
                          {formatCurrency(row.grossBilling - row.recoveryAmount)}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}

            <Text style={styles.sectionLabel}>Active Advances</Text>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Icon name="bank-transfer" size={48} color={COLORS.DISABLED} />
            <Text style={styles.emptyText}>No advances recorded</Text>
            <Text style={styles.emptySubText}>Tap + to add a mobilization or performance advance</Text>
          </View>
        }
      />

      {/* FAB */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => { resetForm(); setDialogVisible(true); }}
        label="Add Advance"
      />

      {/* Add Advance Dialog */}
      <Portal>
        <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)}>
          <Dialog.Title>New Advance</Dialog.Title>
          <Dialog.ScrollArea style={{ maxHeight: 420 }}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
              <ScrollView>
                {/* Type selector */}
                <Text style={styles.fieldLabel}>Advance Type</Text>
                <View style={styles.typeRow}>
                  {ADVANCE_TYPES.map(t => (
                    <Chip
                      key={t}
                      selected={formType === t}
                      onPress={() => setFormType(t)}
                      style={styles.typeOption}
                    >
                      {TYPE_LABELS[t]}
                    </Chip>
                  ))}
                </View>

                <TextInput
                  label="Advance Amount (₹)"
                  value={formAmount}
                  onChangeText={setFormAmount}
                  keyboardType="decimal-pad"
                  mode="outlined"
                  dense
                  style={styles.input}
                />
                <TextInput
                  label="Recovery % per IPC"
                  value={formRecoveryPct}
                  onChangeText={setFormRecoveryPct}
                  keyboardType="decimal-pad"
                  mode="outlined"
                  dense
                  style={styles.input}
                  right={<TextInput.Affix text="%" />}
                />

                <TouchableOpacity
                  onPress={() => setShowDatePicker(true)}
                  style={styles.dateTouchable}
                >
                  <Text style={styles.dateLabel}>Issued On</Text>
                  <Text style={styles.dateValue}>{formDate.toLocaleDateString()}</Text>
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={formDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(_e, d) => {
                      setShowDatePicker(false);
                      if (d) setFormDate(d);
                    }}
                  />
                )}

                <TextInput
                  label="Notes (optional)"
                  value={formNotes}
                  onChangeText={setFormNotes}
                  mode="outlined"
                  dense
                  style={styles.input}
                  multiline
                  numberOfLines={2}
                />
              </ScrollView>
            </KeyboardAvoidingView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setDialogVisible(false)}>Cancel</Button>
            <Button mode="contained" onPress={handleSave} loading={saving} disabled={saving}>
              Save
            </Button>
          </Dialog.Actions>
        </Dialog>
        <Snackbar {...snackbarProps} duration={3000} />
      </Portal>
    </View>
  );
};

// ==================== Styles ====================

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: '#666' },
  listContent: { padding: 12, paddingBottom: 90 },

  summaryCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2,
  },
  summaryTitle: { fontSize: 15, fontWeight: '700', marginBottom: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  summaryItem: { flex: 1 },
  summaryLabel: { fontSize: 10, color: '#888', marginBottom: 2 },
  summaryValue: { fontSize: 14, fontWeight: '800' },
  progressBar: { height: 8, borderRadius: 4, marginBottom: 4 },
  progressLabel: { fontSize: 11, color: '#666', textAlign: 'right' },

  impactCard: {
    backgroundColor: '#FFF8E1', borderRadius: 12, padding: 14, marginBottom: 12,
    borderLeftWidth: 4, borderLeftColor: COLORS.WARNING, elevation: 1,
  },
  impactTitle: { fontSize: 13, fontWeight: '700', color: '#555', marginBottom: 10 },
  impactRow: { marginBottom: 10, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#f0e8c8' },
  impactKD: { fontSize: 13, fontWeight: '700', marginBottom: 1 },
  impactDesc: { fontSize: 11, color: '#666', marginBottom: 6 },
  impactAmounts: { flexDirection: 'row', justifyContent: 'space-between' },
  impactAmountItem: { flex: 1 },
  impactAmountLabel: { fontSize: 9, color: '#999', marginBottom: 2 },
  impactGross: { fontSize: 12, fontWeight: '700', color: '#333' },
  impactRecovery: { fontSize: 12, fontWeight: '700' },

  sectionLabel: { fontSize: 13, fontWeight: '700', color: '#555', marginBottom: 8, marginTop: 4 },

  card: {
    backgroundColor: '#fff', borderRadius: 10, padding: 14, elevation: 1,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  typeChip: {},
  typeChipText: { fontSize: 11 },
  recoveredChip: { backgroundColor: COLORS.SUCCESS + '20' },
  recoveredChipText: { fontSize: 11, color: COLORS.SUCCESS },

  amountRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  amountItem: { flex: 1 },
  amountLabel: { fontSize: 10, color: '#888', marginBottom: 2 },
  amountValue: { fontSize: 14, fontWeight: '700' },

  dateText: { fontSize: 11, color: '#888', marginTop: 6 },
  notesText: { fontSize: 12, color: '#666', marginTop: 4, fontStyle: 'italic' },

  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 10 },
  emptyText: { fontSize: 15, color: '#888' },
  emptySubText: { fontSize: 12, color: '#aaa' },

  fab: { position: 'absolute', right: 16, bottom: 16, backgroundColor: COLORS.PRIMARY },

  // Dialog
  fieldLabel: { fontSize: 12, color: '#666', marginBottom: 6, marginTop: 4 },
  typeRow: { flexDirection: 'row', gap: 8, marginBottom: 12, flexWrap: 'wrap' },
  typeOption: { marginBottom: 4 },
  input: { marginBottom: 10, backgroundColor: '#fff' },
  dateTouchable: {
    borderWidth: 1, borderColor: '#999', borderRadius: 4,
    paddingHorizontal: 12, paddingVertical: 12, marginBottom: 10,
  },
  dateLabel: { fontSize: 11, color: '#666' },
  dateValue: { fontSize: 14, color: '#333', fontWeight: '500', marginTop: 2 },
});

export default AdvanceRecoveryScreen;
