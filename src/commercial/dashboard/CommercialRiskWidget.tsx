/**
 * CommercialRiskWidget
 *
 * Self-contained risk early-warning widget for the Commercial Dashboard.
 * Auto-detects up to 5 commercial risks from existing DB tables:
 *
 * 1. Billing Lag      — revenue billed < KD progress – 10%
 * 2. Advance Pressure — outstanding advance > 15% of contract value
 * 3. Retention Excess — total retention held > 8% of contract value
 * 4. Pending VOs      — unapproved VO value
 * 5. Slow-Paying      — invoices outstanding > 60 days
 *
 * Displays top 3 risks with severity (high/medium) and one-line action.
 * Sprint 4 — Commercial Advanced Billing
 */

import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { database } from '../../../models/database';
import { Q } from '@nozbe/watermelondb';
import { logger } from '../../services/LoggingService';
import { useCommercial } from '../context/CommercialContext';

// ==================== Types ====================

type Severity = 'high' | 'medium';

interface RiskItem {
  id: string;
  icon: string;
  title: string;
  detail: string;
  severity: Severity;
  action: string;
  navTarget?: string;  // drawer screen name to navigate to
}

const SEVERITY_CONFIG: Record<Severity, { color: string; bg: string }> = {
  high:   { color: '#FF3B30', bg: '#FF3B3011' },
  medium: { color: '#FF9500', bg: '#FF950011' },
};

// ==================== Component ====================

interface Props {
  style?: object;
}

const CommercialRiskWidget: React.FC<Props> = ({ style }) => {
  const { projectId } = useCommercial();
  const navigation = useNavigation<any>();
  const [risks, setRisks] = useState<RiskItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRisks = useCallback(async () => {
    if (!projectId) { setLoading(false); return; }
    try {
      const now = Date.now();
      const sixtyDaysAgo = now - 60 * 24 * 60 * 60 * 1000;

      const [projectArr, keyDates, allInvoices, allAdvances, allRetentions, allVOs] = await Promise.all([
        database.collections.get('projects').query().fetch() as Promise<any[]>,
        database.collections.get('key_dates').query(Q.where('project_id', projectId)).fetch() as Promise<any[]>,
        database.collections.get('invoices').query(Q.where('project_id', projectId)).fetch() as Promise<any[]>,
        database.collections.get('advances').query(Q.where('project_id', projectId)).fetch() as Promise<any[]>,
        database.collections.get('retentions').query(
          Q.where('project_id', projectId), Q.where('party_type', 'client')
        ).fetch() as Promise<any[]>,
        database.collections.get('variation_orders').query(Q.where('project_id', projectId)).fetch() as Promise<any[]>,
      ]);

      const project: any = projectArr.find((p: any) => p.id === projectId);
      const contractValue: number = project?.contractValue ?? 0;

      const detectedRisks: RiskItem[] = [];

      // ─── Risk 1: Billing Lag ─────────────────────────────────────────────
      if (contractValue > 0) {
        const totalBilled = (allInvoices as any[]).reduce(
          (s, i) => s + (i.grossAmount ?? i.amount ?? 0), 0
        );
        const billedPct = totalBilled / contractValue;

        const kds = keyDates as any[];
        const totalWeight = kds.reduce((s, k) => s + (k.weightage ?? 0), 0);
        const weightedProgress = totalWeight > 0
          ? kds.reduce((s, k) => s + (k.progressPercentage ?? 0) * (k.weightage ?? 0) / totalWeight, 0) / 100
          : 0;

        const lag = weightedProgress - billedPct;
        if (lag > 0.1) {
          detectedRisks.push({
            id: 'billing_lag',
            icon: 'trending-down',
            title: 'Revenue Billing Lag',
            detail: `Billed ${(billedPct * 100).toFixed(1)}% vs ${(weightedProgress * 100).toFixed(1)}% work progress — lag of ${((lag) * 100).toFixed(1)}%`,
            severity: lag > 0.2 ? 'high' : 'medium',
            action: 'Raise pending KD IPCs',
            navTarget: 'KDBilling',
          });
        }
      }

      // ─── Risk 2: Advance Pressure ────────────────────────────────────────
      if (contractValue > 0) {
        const totalAdvanceBalance = (allAdvances as any[]).reduce(
          (s, a) => s + Math.max(0, a.advanceAmount - a.totalRecovered), 0
        );
        const advancePct = totalAdvanceBalance / contractValue;
        if (advancePct > 0.15) {
          detectedRisks.push({
            id: 'advance_pressure',
            icon: 'bank-outline',
            title: 'Advance Pressure',
            detail: `Outstanding advance ₹${(totalAdvanceBalance / 1_00_00_000).toFixed(2)} Cr = ${(advancePct * 100).toFixed(1)}% of contract value (threshold 15%)`,
            severity: advancePct > 0.25 ? 'high' : 'medium',
            action: 'Review advance recovery schedule',
            navTarget: 'AdvanceRecovery',
          });
        }
      }

      // ─── Risk 3: Retention Accumulation ─────────────────────────────────
      if (contractValue > 0) {
        const totalRetentionHeld = (allRetentions as any[])
          .filter(r => !r.releasedDate)
          .reduce((s, r) => s + r.retentionAmount, 0);
        const retPct = totalRetentionHeld / contractValue;
        if (retPct > 0.08) {
          detectedRisks.push({
            id: 'retention_excess',
            icon: 'shield-lock-outline',
            title: 'Retention Accumulation',
            detail: `₹${(totalRetentionHeld / 1_00_00_000).toFixed(2)} Cr held (${(retPct * 100).toFixed(1)}% of CV) — exceeds 8% threshold`,
            severity: 'medium',
            action: 'Check DLP dates and release eligibility',
            navTarget: 'RetentionMonitor',
          });
        }
      }

      // ─── Risk 4: Pending Variation Orders ───────────────────────────────
      const pendingVOs = (allVOs as any[]).filter(v =>
        v.approvalStatus === 'pending' || v.approvalStatus === 'under_review'
      );
      if (pendingVOs.length > 0) {
        const pendingVOValue = pendingVOs.reduce((s, v) => s + v.value, 0);
        detectedRisks.push({
          id: 'pending_vos',
          icon: 'file-edit-outline',
          title: 'Pending Variation Orders',
          detail: `${pendingVOs.length} VO${pendingVOs.length > 1 ? 's' : ''} pending approval — ₹${(pendingVOValue / 1_00_00_000).toFixed(2)} Cr at risk`,
          severity: pendingVOs.length > 2 ? 'high' : 'medium',
          action: 'Follow up on VO approvals',
          navTarget: 'VariationOrders',
        });
      }

      // ─── Risk 5: Slow-Paying Client ──────────────────────────────────────
      const overdueInvoices = (allInvoices as any[]).filter(inv =>
        inv.paymentStatus === 'pending' && inv.invoiceDate < sixtyDaysAgo
      );
      if (overdueInvoices.length > 0) {
        const overdueAmount = overdueInvoices.reduce((s, i) => s + (i.netAmount ?? i.amount ?? 0), 0);
        detectedRisks.push({
          id: 'slow_paying',
          icon: 'clock-alert-outline',
          title: 'Slow-Paying Client',
          detail: `${overdueInvoices.length} invoice${overdueInvoices.length > 1 ? 's' : ''} outstanding >60 days — ₹${(overdueAmount / 1_00_00_000).toFixed(2)} Cr`,
          severity: overdueInvoices.length > 3 ? 'high' : 'medium',
          action: 'Escalate overdue payments',
          navTarget: 'FinancialReports',
        });
      }

      // Sort by severity (high first), take top 3
      const sorted = detectedRisks.sort((a, b) =>
        (a.severity === 'high' ? 0 : 1) - (b.severity === 'high' ? 0 : 1)
      ).slice(0, 3);

      setRisks(sorted);
    } catch (error) {
      logger.error('[RiskWidget] Load error', error as Error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { loadRisks(); }, [loadRisks]);

  if (loading) {
    return (
      <View style={[styles.card, style]}>
        <Text style={styles.cardTitle}>Commercial Risk Alerts</Text>
        <ActivityIndicator size="small" color="#FF3B30" style={{ marginTop: 8 }} />
      </View>
    );
  }

  if (risks.length === 0) {
    return (
      <View style={[styles.card, style]}>
        <View style={styles.cardTitleRow}>
          <Text style={styles.cardTitle}>Commercial Risk Alerts</Text>
          <Icon name="check-circle" size={18} color="#34C759" />
        </View>
        <View style={styles.allClearRow}>
          <Icon name="shield-check" size={32} color="#34C75966" />
          <Text style={styles.allClearText}>No commercial risks detected</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.card, style]}>
      <View style={styles.cardTitleRow}>
        <Text style={styles.cardTitle}>Commercial Risk Alerts</Text>
        <View style={styles.badgeRed}>
          <Text style={styles.badgeText}>{risks.length}</Text>
        </View>
      </View>
      {risks.map((risk, idx) => {
        const sev = SEVERITY_CONFIG[risk.severity];
        return (
          <TouchableOpacity
            key={risk.id}
            style={[styles.riskRow, { backgroundColor: sev.bg }, idx < risks.length - 1 && styles.riskRowBorder]}
            onPress={() => risk.navTarget && navigation.navigate(risk.navTarget)}
          >
            <View style={[styles.riskIconBox, { borderColor: sev.color }]}>
              <Icon name={risk.icon} size={20} color={sev.color} />
            </View>
            <View style={styles.riskContent}>
              <View style={styles.riskTitleRow}>
                <Text style={[styles.riskTitle, { color: sev.color }]}>{risk.title}</Text>
                <View style={[styles.severityBadge, { backgroundColor: sev.color }]}>
                  <Text style={styles.severityText}>{risk.severity.toUpperCase()}</Text>
                </View>
              </View>
              <Text style={styles.riskDetail} numberOfLines={2}>{risk.detail}</Text>
              <Text style={styles.riskAction}>→ {risk.action}</Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

// ==================== Styles ====================

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 12,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#FF3B30',
  },
  cardTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#333' },
  badgeRed: { backgroundColor: '#FF3B30', borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2 },
  badgeText: { fontSize: 11, color: '#fff', fontWeight: '700' },

  allClearRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  allClearText: { fontSize: 13, color: '#888' },

  riskRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 6,
  },
  riskRowBorder: {},
  riskIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  riskContent: { flex: 1 },
  riskTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  riskTitle: { fontSize: 13, fontWeight: '700', flex: 1, marginRight: 6 },
  severityBadge: { borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 },
  severityText: { fontSize: 9, color: '#fff', fontWeight: '700', letterSpacing: 0.5 },
  riskDetail: { fontSize: 12, color: '#555', lineHeight: 16, marginBottom: 4 },
  riskAction: { fontSize: 11, color: '#007AFF', fontWeight: '500' },
});

export default CommercialRiskWidget;
