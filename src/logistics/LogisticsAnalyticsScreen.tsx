/**
 * LogisticsAnalyticsScreen
 *
 * Real-data analytics dashboard for MRE/electrical logistics:
 * - Material status summary (critical, shortage, sufficient)
 * - Discipline breakdown (TSS vs OHE vs General)
 * - Top shortages ranked by gap
 * - Supplier distribution
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useLogistics } from './context/LogisticsContext';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import { EmptyState } from '../components/common/EmptyState';
import { COLORS } from '../theme/colors';

// ============================================================================
// HELPERS
// ============================================================================

const getDiscipline = (name: string): 'TSS' | 'OHE' | 'General' => {
  const n = name.toLowerCase();
  if (n.includes('tss') || n.includes('transformer') || n.includes('substation') || n.includes('breaker')) return 'TSS';
  if (n.includes('ohe') || n.includes('catenary') || n.includes('mast') || n.includes('cantilever') || n.includes('dropper')) return 'OHE';
  return 'General';
};

const STATUS_COLORS: Record<string, string> = {
  critical: COLORS.ERROR,
  shortage: COLORS.WARNING,
  sufficient: COLORS.SUCCESS,
  ordered: COLORS.INFO,
  delivered: COLORS.SUCCESS,
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

const KpiCard: React.FC<{ label: string; value: string | number; color: string }> = ({ label, value, color }) => (
  <View style={[styles.kpiCard, { borderLeftColor: color }]}>
    <Text style={[styles.kpiValue, { color }]}>{value}</Text>
    <Text style={styles.kpiLabel}>{label}</Text>
  </View>
);

const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
  <Text style={styles.sectionHeader}>{title}</Text>
);

const BarRow: React.FC<{ label: string; count: number; total: number; color: string }> = ({ label, count, total, color }) => {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <View style={styles.barRow}>
      <Text style={styles.barLabel}>{label}</Text>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${pct}%` as any, backgroundColor: color }]} />
      </View>
      <Text style={styles.barCount}>{count}</Text>
    </View>
  );
};

// ============================================================================
// SCREEN
// ============================================================================

const LogisticsAnalyticsScreen: React.FC = () => {
  const { materials } = useLogistics();

  const stats = useMemo(() => {
    const total = materials.length;
    const critical = materials.filter(m => m.status === 'critical').length;
    const shortage = materials.filter(m => m.status === 'shortage').length;
    const sufficient = materials.filter(m => m.status === 'sufficient').length;
    const ordered = materials.filter(m => m.status === 'ordered').length;
    const delivered = materials.filter(m => m.status === 'delivered').length;

    // Discipline breakdown
    const byDiscipline = materials.reduce<Record<string, number>>((acc, m) => {
      const d = getDiscipline(m.name);
      acc[d] = (acc[d] || 0) + 1;
      return acc;
    }, {});

    // Top shortages (gap = required - available, descending)
    const topShortages = materials
      .filter(m => m.quantityRequired > m.quantityAvailable)
      .map(m => ({
        name: m.name,
        gap: m.quantityRequired - m.quantityAvailable,
        unit: m.unit,
        supplier: m.supplier,
        status: m.status,
      }))
      .sort((a, b) => b.gap - a.gap)
      .slice(0, 8);

    // Supplier distribution
    const bySupplier = materials.reduce<Record<string, number>>((acc, m) => {
      const s = m.supplier || 'Unknown';
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    }, {});
    const topSuppliers = Object.entries(bySupplier)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return { total, critical, shortage, sufficient, ordered, delivered, byDiscipline, topShortages, topSuppliers };
  }, [materials]);

  if (materials.length === 0) {
    return (
      <EmptyState
        icon="chart-bar"
        title="No Material Data"
        message="Load sample BOMs from the Materials tab to populate analytics."
        variant="large"
      />
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* KPI Row */}
      <SectionHeader title="MATERIAL STATUS" />
      <View style={styles.kpiRow}>
        <KpiCard label="Total" value={stats.total} color={COLORS.INFO} />
        <KpiCard label="Critical" value={stats.critical} color={COLORS.ERROR} />
        <KpiCard label="Shortage" value={stats.shortage} color={COLORS.WARNING} />
        <KpiCard label="Sufficient" value={stats.sufficient} color={COLORS.SUCCESS} />
      </View>

      {/* Status Breakdown */}
      <SectionHeader title="STATUS BREAKDOWN" />
      <View style={styles.card}>
        {[
          { label: 'Critical', count: stats.critical, color: COLORS.ERROR },
          { label: 'Shortage', count: stats.shortage, color: COLORS.WARNING },
          { label: 'Ordered', count: stats.ordered, color: COLORS.INFO },
          { label: 'Sufficient', count: stats.sufficient, color: COLORS.SUCCESS },
          { label: 'Delivered', count: stats.delivered, color: '#10B981' },
        ].map(row => (
          <BarRow key={row.label} label={row.label} count={row.count} total={stats.total} color={row.color} />
        ))}
      </View>

      {/* Discipline Breakdown */}
      <SectionHeader title="DISCIPLINE BREAKDOWN" />
      <View style={styles.card}>
        {Object.entries(stats.byDiscipline).map(([discipline, count]) => (
          <BarRow
            key={discipline}
            label={discipline}
            count={count}
            total={stats.total}
            color={discipline === 'TSS' ? '#7C3AED' : discipline === 'OHE' ? '#2563EB' : '#6B7280'}
          />
        ))}
      </View>

      {/* Top Shortages */}
      {stats.topShortages.length > 0 && (
        <>
          <SectionHeader title="TOP SHORTAGES" />
          <View style={styles.card}>
            {stats.topShortages.map((item, idx) => (
              <View key={idx} style={styles.shortageRow}>
                <View style={styles.shortageLeft}>
                  <Text style={styles.shortageName} numberOfLines={1}>{item.name}</Text>
                  {item.supplier ? (
                    <Text style={styles.shortageSupplier}>{item.supplier}</Text>
                  ) : null}
                </View>
                <View style={styles.shortageRight}>
                  <Text style={[styles.shortageGap, { color: item.status === 'critical' ? COLORS.ERROR : COLORS.WARNING }]}>
                    -{item.gap.toFixed(0)} {item.unit}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </>
      )}

      {/* Top Suppliers */}
      <SectionHeader title="SUPPLIER DISTRIBUTION" />
      <View style={styles.card}>
        {stats.topSuppliers.map(([supplier, count]) => (
          <BarRow key={supplier} label={supplier} count={count} total={stats.total} color={COLORS.PRIMARY} />
        ))}
      </View>

    </ScrollView>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.8,
    marginTop: 20,
    marginBottom: 8,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 8,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 2,
  },
  kpiLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  barLabel: {
    width: 80,
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
  },
  barTrack: {
    flex: 1,
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    overflow: 'hidden',
    marginHorizontal: 8,
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  barCount: {
    width: 28,
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'right',
  },
  shortageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  shortageLeft: {
    flex: 1,
    marginRight: 8,
  },
  shortageName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  shortageSupplier: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  shortageRight: {
    alignItems: 'flex-end',
  },
  shortageGap: {
    fontSize: 14,
    fontWeight: '700',
  },
});

// Wrap with ErrorBoundary for graceful error handling
const LogisticsAnalyticsScreenWithBoundary = () => (
  <ErrorBoundary name="Logistics - LogisticsAnalyticsScreen">
    <LogisticsAnalyticsScreen />
  </ErrorBoundary>
);

export default LogisticsAnalyticsScreenWithBoundary;
