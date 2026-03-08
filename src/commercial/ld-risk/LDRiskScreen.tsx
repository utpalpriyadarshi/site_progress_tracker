/**
 * LDRiskScreen — Liquidated Damages Risk Calculator
 *
 * Shows all delayed Key Dates with calculated LD exposure.
 * Displays total LD at risk and revenue impact as % of contract value.
 * Also shows KDs nearing their target date (within 30 days) as "at risk".
 *
 * @since v52 - Sprint 1: Commercial Advanced Billing
 */

import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { Chip, Divider, ProgressBar } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useCommercial } from '../context/CommercialContext';
import { database } from '../../../models/database';
import { Q } from '@nozbe/watermelondb';
import { logger } from '../../services/LoggingService';
import { formatCurrency } from '../cost-tracking/utils/costFormatters';
import { COLORS } from '../../theme/colors';

// ==================== Types ====================

interface LDRow {
  id: string;
  code: string;
  description: string;
  targetDate?: number;
  actualDate?: number;
  status: string;
  daysDelayed: number;
  ldInitial: number;    // per day (Lakhs) days 1–28
  ldExtended: number;   // per day (Lakhs) day 29+
  ldExposureLakhs: number; // calculated exposure
  eotStatus: 'none' | 'filed' | 'pending'; // manually set per session (not persisted)
}

// ── Helpers ──────────────────────────────────────────────

const calcDaysDelayed = (targetDate?: number, actualDate?: number): number => {
  if (!targetDate) return 0;
  const end = actualDate ?? Date.now();
  return Math.max(0, Math.ceil((end - targetDate) / 86_400_000));
};

const calcLDExposure = (daysDelayed: number, initial: number, extended: number): number => {
  if (daysDelayed <= 0) return 0;
  const initialDays = Math.min(daysDelayed, 28);
  const extendedDays = Math.max(0, daysDelayed - 28);
  return initialDays * initial + extendedDays * extended;
};

const daysUntilTarget = (targetDate?: number): number => {
  if (!targetDate) return Infinity;
  return Math.ceil((targetDate - Date.now()) / 86_400_000);
};

const EOT_LABELS: Record<string, string> = {
  none: 'None',
  filed: 'Filed',
  pending: 'Pending',
};

const EOT_COLORS: Record<string, string> = {
  none: COLORS.ERROR,
  filed: COLORS.SUCCESS,
  pending: COLORS.WARNING,
};

// ==================== Main Screen ====================

const LDRiskScreen: React.FC = () => {
  const { projectId } = useCommercial();

  const [loading, setLoading] = useState(true);
  const [ldRows, setLdRows] = useState<LDRow[]>([]);
  const [atRiskRows, setAtRiskRows] = useState<LDRow[]>([]);
  const [contractValue, setContractValue] = useState(0);
  const [totalLDLakhs, setTotalLDLakhs] = useState(0);
  // EOT status is session-only (not persisted in this sprint)
  const [eotStatus, setEotStatus] = useState<Record<string, 'none' | 'filed' | 'pending'>>({});

  const loadData = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const projectsCol = database.collections.get('projects');
      const keyDatesCol = database.collections.get('key_dates');

      const [projectArr, keyDates] = await Promise.all([
        projectsCol.query(Q.where('id', projectId)).fetch(),
        keyDatesCol
          .query(Q.where('project_id', projectId), Q.sortBy('sequence_order', Q.asc))
          .fetch(),
      ]);

      const project: any = projectArr[0];
      const cv = project?.contractValue ?? 0;
      setContractValue(cv);

      const now = Date.now();
      const delayed: LDRow[] = [];
      const atRisk: LDRow[] = [];

      for (const kd of keyDates as any[]) {
        const days = calcDaysDelayed(kd.targetDate, kd.actualDate);
        const ld = calcLDExposure(days, kd.delayDamagesInitial ?? 1, kd.delayDamagesExtended ?? 10);

        if (kd.status === 'delayed') {
          delayed.push({
            id: kd.id,
            code: kd.code,
            description: kd.description,
            targetDate: kd.targetDate,
            actualDate: kd.actualDate,
            status: kd.status,
            daysDelayed: days,
            ldInitial: kd.delayDamagesInitial ?? 1,
            ldExtended: kd.delayDamagesExtended ?? 10,
            ldExposureLakhs: ld,
            eotStatus: 'none',
          });
        } else if (
          kd.status !== 'completed' &&
          kd.targetDate &&
          daysUntilTarget(kd.targetDate) <= 30
        ) {
          atRisk.push({
            id: kd.id,
            code: kd.code,
            description: kd.description,
            targetDate: kd.targetDate,
            actualDate: kd.actualDate,
            status: kd.status,
            daysDelayed: 0,
            ldInitial: kd.delayDamagesInitial ?? 1,
            ldExtended: kd.delayDamagesExtended ?? 10,
            ldExposureLakhs: 0,
            eotStatus: 'none',
          });
        }
      }

      const total = delayed.reduce((s, r) => s + r.ldExposureLakhs, 0);
      setLdRows(delayed);
      setAtRiskRows(atRisk);
      setTotalLDLakhs(total);
    } catch (err) {
      logger.error('[LDRiskScreen] Load error:', err as Error);
      Alert.alert('Error', 'Failed to load LD Risk data');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { loadData(); }, [loadData]);

  const toggleEOT = useCallback((id: string) => {
    setEotStatus(prev => {
      const cur = prev[id] ?? 'none';
      const next: Record<string, 'none' | 'filed' | 'pending'> = {
        none: 'pending',
        pending: 'filed',
        filed: 'none',
      };
      return { ...prev, [id]: next[cur] };
    });
  }, []);

  // ── Revenue at risk ───────────────────────────────────
  // 1 Lakh = 100,000 INR; totalLDLakhs is in lakhs
  const totalLDInr = totalLDLakhs * 100_000;
  const revenueAtRiskPct = contractValue > 0 ? (totalLDInr / contractValue) * 100 : 0;

  // ── Render row ────────────────────────────────────────
  const renderDelayedRow = ({ item }: { item: LDRow }) => {
    const eot = eotStatus[item.id] ?? 'none';
    return (
      <View style={styles.ldCard}>
        <View style={styles.ldCardHeader}>
          <View>
            <Text style={styles.ldCode}>{item.code}</Text>
            <Text style={styles.ldDesc} numberOfLines={2}>{item.description}</Text>
          </View>
          <Chip
            style={[styles.eotChip, { backgroundColor: EOT_COLORS[eot] + '22' }]}
            textStyle={{ color: EOT_COLORS[eot], fontSize: 11 }}
            onPress={() => toggleEOT(item.id)}
          >
            EOT: {EOT_LABELS[eot]}
          </Chip>
        </View>

        <View style={styles.ldMeta}>
          <View style={styles.ldMetaItem}>
            <Text style={styles.ldMetaLabel}>Days Delayed</Text>
            <Text style={[styles.ldMetaValue, { color: COLORS.ERROR }]}>{item.daysDelayed}d</Text>
          </View>
          <View style={styles.ldMetaItem}>
            <Text style={styles.ldMetaLabel}>LD Rate (1–28d)</Text>
            <Text style={styles.ldMetaValue}>₹{item.ldInitial}L/day</Text>
          </View>
          <View style={styles.ldMetaItem}>
            <Text style={styles.ldMetaLabel}>LD Rate (29d+)</Text>
            <Text style={styles.ldMetaValue}>₹{item.ldExtended}L/day</Text>
          </View>
          <View style={styles.ldMetaItem}>
            <Text style={styles.ldMetaLabel}>LD Exposure</Text>
            <Text style={[styles.ldMetaValue, { color: COLORS.ERROR, fontWeight: '800' }]}>
              ₹{item.ldExposureLakhs.toFixed(2)}L
            </Text>
          </View>
        </View>

        {item.targetDate ? (
          <Text style={styles.dateText}>
            Target: {new Date(item.targetDate).toLocaleDateString()}
            {item.actualDate ? ` · Completed: ${new Date(item.actualDate).toLocaleDateString()}` : ' · Ongoing'}
          </Text>
        ) : null}
      </View>
    );
  };

  const renderAtRiskRow = ({ item }: { item: LDRow }) => {
    const remaining = daysUntilTarget(item.targetDate);
    return (
      <View style={[styles.ldCard, styles.atRiskCard]}>
        <View style={styles.ldCardHeader}>
          <View>
            <Text style={styles.ldCode}>{item.code}</Text>
            <Text style={styles.ldDesc} numberOfLines={1}>{item.description}</Text>
          </View>
          <Chip style={styles.warningChip} textStyle={{ color: COLORS.WARNING, fontSize: 11 }}>
            {remaining <= 0 ? 'Due today' : `${remaining}d left`}
          </Chip>
        </View>
        <Text style={styles.dateText}>
          Target: {item.targetDate ? new Date(item.targetDate).toLocaleDateString() : '—'}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading LD Risk data…</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={[]}
      keyExtractor={() => 'dummy'}
      renderItem={null}
      ListHeaderComponent={
        <View style={{ padding: 12 }}>
          {/* ── Summary Card ── */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>LD Exposure Summary</Text>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Delayed KDs</Text>
                <Text style={[styles.summaryBig, { color: COLORS.ERROR }]}>{ldRows.length}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Total LD Exposure</Text>
                <Text style={[styles.summaryBig, { color: COLORS.ERROR }]}>
                  ₹{totalLDLakhs.toFixed(2)} Lakhs
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Revenue at Risk</Text>
                <Text style={[styles.summaryBig, { color: COLORS.ERROR }]}>
                  {revenueAtRiskPct.toFixed(2)}%
                </Text>
              </View>
            </View>
            {contractValue > 0 && (
              <>
                <ProgressBar
                  progress={Math.min(1, revenueAtRiskPct / 100)}
                  color={COLORS.ERROR}
                  style={styles.progressBar}
                />
                <Text style={styles.progressLabel}>
                  LD cap typically at 10% of contract value · Contract: {formatCurrency(contractValue)}
                </Text>
              </>
            )}
          </View>

          {/* ── Delayed KDs ── */}
          {ldRows.length > 0 ? (
            <>
              <Text style={styles.sectionTitle}>
                <Icon name="alert-circle" size={16} color={COLORS.ERROR} /> Delayed Key Dates
              </Text>
              {ldRows.map(row => (
                <React.Fragment key={row.id}>{renderDelayedRow({ item: row })}</React.Fragment>
              ))}
              <View style={{ height: 8 }} />
            </>
          ) : (
            <View style={styles.noDelays}>
              <Icon name="check-circle" size={32} color={COLORS.SUCCESS} />
              <Text style={styles.noDelaysText}>No delayed Key Dates — LD exposure is zero</Text>
            </View>
          )}

          {/* ── At Risk KDs ── */}
          {atRiskRows.length > 0 && (
            <>
              <Divider style={{ marginVertical: 8 }} />
              <Text style={styles.sectionTitle}>
                <Icon name="clock-alert" size={16} color={COLORS.WARNING} /> At Risk (due within 30 days)
              </Text>
              {atRiskRows.map(row => (
                <React.Fragment key={row.id}>{renderAtRiskRow({ item: row })}</React.Fragment>
              ))}
            </>
          )}

          <Text style={styles.hint}>
            Tap EOT chip on a delayed KD to cycle through EOT status (None → Pending → Filed)
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
  summaryBig: { fontSize: 16, fontWeight: '800' },
  progressBar: { height: 8, borderRadius: 4, marginBottom: 4 },
  progressLabel: { fontSize: 11, color: '#666' },

  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
    marginTop: 4,
  },

  ldCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    elevation: 1,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.ERROR,
  },
  atRiskCard: {
    borderLeftColor: COLORS.WARNING,
  },
  ldCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 8,
  },
  ldCode: { fontSize: 15, fontWeight: '700', color: '#333' },
  ldDesc: { fontSize: 12, color: '#555', marginTop: 2, maxWidth: 220 },
  eotChip: {},
  warningChip: { backgroundColor: COLORS.WARNING + '22' },

  ldMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 6 },
  ldMetaItem: { minWidth: 80 },
  ldMetaLabel: { fontSize: 10, color: '#888', marginBottom: 1 },
  ldMetaValue: { fontSize: 13, fontWeight: '600', color: '#333' },

  dateText: { fontSize: 11, color: '#888', marginTop: 2 },

  noDelays: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 10,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 8,
    elevation: 1,
  },
  noDelaysText: { fontSize: 14, color: '#666' },

  hint: {
    fontSize: 11,
    color: '#aaa',
    textAlign: 'center',
    marginTop: 16,
    fontStyle: 'italic',
  },
});

export default LDRiskScreen;
