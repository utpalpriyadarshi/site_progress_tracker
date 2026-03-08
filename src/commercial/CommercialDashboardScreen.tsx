import React, { useReducer, useEffect, useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useCommercial } from './context/CommercialContext';
import { useAuth } from '../auth/AuthContext';
import ErrorBoundary from '../components/common/ErrorBoundary';
import { database } from '../../models/database';
import { Q } from '@nozbe/watermelondb';
import { logger } from '../services/LoggingService';
import { dashboardReducer, initialDashboardState } from './state/dashboard/dashboardReducer';
import { dashboardActions } from './state/dashboard/dashboardActions';
import {
  calculateBudgetSummary,
  calculateCategoryBreakdown,
  calculateInvoicesSummary,
  calculateCashFlow,
  generateAlerts,
} from './dashboard/utils';
import type { RecentCost } from './state/dashboard/dashboardReducer';
import { AlertsCard } from './dashboard/components';
import { DashboardSkeleton } from './shared';
import {
  PeriodSelector,
  BudgetHealthWidget,
  CashFlowWidget,
  InvoiceStatusWidget,
  CategorySpendingWidget,
  RecentTransactionsWidget,
  formatPeriodLabel,
  getPeriodDateRange,
  Period,
  Transaction,
  CategorySpendingData,
} from './dashboard/widgets';
import TutorialModal from '../tutorial/TutorialModal';
import TutorialService from '../services/TutorialService';
import commercialManagerTutorialSteps from '../tutorial/commercialManagerTutorialSteps';
import type { CommercialTabParamList } from '../nav/CommercialNavigator';
import { COLORS } from '../theme/colors';
import CommercialRiskWidget from './dashboard/CommercialRiskWidget';

// ── Contract KPI types (Sprint 1 additions) ──────────────────────────────────
interface ContractKPIs {
  contractValue: number;
  totalBilledGross: number;
  weightedKDProgress: number; // weighted avg of KD progress
  ldExposureLakhs: number;
}

/**
 * CommercialDashboardScreen (v3.0 Phase 3)
 *
 * Commercial Manager dashboard with interactive financial KPI widgets.
 *
 * Features:
 * - Interactive KPI widgets with drill-down navigation
 * - Period selector (MTD, QTD, YTD)
 * - Pull-to-refresh functionality
 * - Budget health with trend indicators
 * - Cash flow visualization
 * - Invoice status breakdown
 * - Category spending analysis
 * - Recent transactions list
 *
 * Phase 3 Update: 2026-01-21
 * - Replaced card components with interactive widgets
 * - Added period selector
 * - Added pull-to-refresh
 * - Added navigation callbacks for drill-down
 */

const CommercialDashboardScreen = () => {
  const { projectId, projectName, refreshTrigger } = useCommercial();
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<CommercialTabParamList, 'Dashboard'>>();
  const { user } = useAuth();
  const [state, dispatch] = useReducer(dashboardReducer, initialDashboardState);
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialInitialStep, setTutorialInitialStep] = useState(0);
  // Sprint 1: Contract KPIs (contract value, KD billing progress, LD exposure)
  const [contractKPIs, setContractKPIs] = useState<ContractKPIs>({
    contractValue: 0,
    totalBilledGross: 0,
    weightedKDProgress: 0,
    ldExposureLakhs: 0,
  });

  const loadDashboardData = useCallback(
    async (isRefresh = false, isSilent = false, periodOverride?: Period) => {
      if (!projectId) {
        dispatch(dashboardActions.setLoading(false));
        return;
      }

      try {
        if (!isSilent) {
          if (isRefresh) {
            dispatch(dashboardActions.setRefreshing(true));
          } else {
            dispatch(dashboardActions.setLoading(true));
          }
        }

        const activePeriod = periodOverride ?? state.ui.selectedPeriod;
        const { startDate, endDate } = getPeriodDateRange(activePeriod);
        const startTs = startDate.getTime();
        const endTs = endDate.getTime();
        logger.debug('[Dashboard] Loading dashboard data for project:', { projectId, period: activePeriod });

        // Load all data in parallel; budgets are project-level totals (no date filter)
        const budgetsCollection = database.collections.get('budgets');
        const costsCollection = database.collections.get('costs');
        const invoicesCollection = database.collections.get('invoices');

        const [budgets, costs, invoices] = await Promise.all([
          budgetsCollection.query(Q.where('project_id', projectId)).fetch(),
          costsCollection
            .query(
              Q.where('project_id', projectId),
              Q.where('cost_date', Q.gte(startTs)),
              Q.where('cost_date', Q.lte(endTs)),
              Q.sortBy('cost_date', Q.desc)
            )
            .fetch(),
          invoicesCollection
            .query(
              Q.where('project_id', projectId),
              Q.where('invoice_date', Q.gte(startTs)),
              Q.where('invoice_date', Q.lte(endTs))
            )
            .fetch(),
        ]);

        // Calculate all metrics
        const budgetSummary = calculateBudgetSummary(budgets, costs);
        const categoryBreakdown = calculateCategoryBreakdown(budgets, costs);
        const invoicesSummary = calculateInvoicesSummary(invoices);
        const cashFlow = calculateCashFlow(invoicesSummary.totalPaid, budgetSummary.totalSpent);

        // Get recent costs (last 5)
        const recentCosts: RecentCost[] = costs.slice(0, 5).map((cost: any) => ({
          description: cost.description,
          amount: cost.amount,
          date: cost.costDate,
          category: cost.category,
        }));

        // Generate alerts
        const alerts = generateAlerts(
          categoryBreakdown,
          invoicesSummary.overdue,
          budgetSummary.percentageUsed,
          budgetSummary.remaining,
          cashFlow.net
        );

        dispatch(
          dashboardActions.setDashboardData({
            budgetSummary,
            categoryBreakdown,
            recentCosts,
            invoicesSummary,
            cashFlow,
            alerts,
          })
        );

        // Set mock previous period data for trend indicators
        // In production, this would be calculated from historical data
        dispatch(
          dashboardActions.setPreviousPeriodData({
            percentageUsed: budgetSummary.percentageUsed * 0.9, // Mock: 10% less last period
            netCashFlow: cashFlow.net * 0.85, // Mock: 15% less last period
          })
        );

        logger.debug('[Dashboard] Dashboard data loaded successfully');
      } catch (error) {
        logger.error('[Dashboard] Error loading dashboard data:', error as Error);
        Alert.alert('Error', 'Failed to load dashboard data');
      } finally {
        dispatch(dashboardActions.setLoading(false));
        dispatch(dashboardActions.setRefreshing(false));
      }
    },
    [projectId, state.ui.selectedPeriod]
  );

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData, refreshTrigger]);

  // Reactive subscription — silently refresh when budgets/costs/invoices change (e.g. after sync)
  useEffect(() => {
    if (!projectId) return;
    const subscription = database
      .withChangesForTables(['budgets', 'costs', 'invoices'])
      .subscribe(() => loadDashboardData(false, true));
    return () => subscription.unsubscribe();
  }, [projectId, loadDashboardData]);

  // Sprint 1: Load contract KPIs from project + key_dates
  useEffect(() => {
    if (!projectId) return;
    const loadContractKPIs = async () => {
      try {
        const projectsCol = database.collections.get('projects');
        const keyDatesCol = database.collections.get('key_dates');
        const invoicesCol = database.collections.get('invoices');

        const [projectArr, keyDates, kdInvoices] = await Promise.all([
          projectsCol.query(Q.where('id', projectId)).fetch(),
          keyDatesCol.query(Q.where('project_id', projectId)).fetch(),
          invoicesCol.query(
            Q.where('project_id', projectId),
            Q.where('key_date_id', Q.notEq(null))
          ).fetch(),
        ]);

        const project: any = projectArr[0];
        const contractValue = project?.contractValue ?? 0;

        // Total billed (gross) from KD invoices
        const totalBilledGross = (kdInvoices as any[]).reduce(
          (s: number, inv: any) => s + (inv.grossAmount ?? inv.amount ?? 0),
          0
        );

        // Weighted average KD progress — mirrors Planner dual-track logic
        const kds = keyDates as any[];
        const totalWeight = kds.reduce((s: number, k: any) => s + (k.weightage ?? 0), 0);

        // Load key_date_sites + items + design docs — mirrors Planner dual-track logic
        // key_date_sites has no project_id; filter by kd_id IN project's KD IDs
        const [allKdSites, allSiteItems, allDesignDocs] = await (async () => {
          try {
            const kdIds = kds.map((k: any) => k.id);
            if (kdIds.length === 0) return [[], [], []];
            const kdSitesData = await database.collections.get('key_date_sites')
              .query(Q.where('key_date_id', Q.oneOf(kdIds)))
              .fetch() as any[];
            const siteIds = [...new Set(kdSitesData.map((s: any) => s.siteId))];
            const [itemsData, docsData] = await Promise.all([
              siteIds.length > 0
                ? database.collections.get('items')
                    .query(Q.where('site_id', Q.oneOf(siteIds)))
                    .fetch() as Promise<any[]>
                : Promise.resolve([]),
              database.collections.get('design_documents')
                .query(Q.where('project_id', projectId))
                .fetch() as Promise<any[]>,
            ]);
            return [kdSitesData, itemsData, docsData];
          } catch { return [[], [], []]; }
        })();

        // Build lookup maps
        const kdSitesByKdId: Record<string, any[]> = {};
        for (const s of allKdSites) {
          if (!kdSitesByKdId[s.keyDateId]) kdSitesByKdId[s.keyDateId] = [];
          kdSitesByKdId[s.keyDateId].push(s);
        }
        const itemsBySiteId: Record<string, any[]> = {};
        for (const item of allSiteItems) {
          if (!itemsBySiteId[item.siteId]) itemsBySiteId[item.siteId] = [];
          itemsBySiteId[item.siteId].push(item);
        }
        const docsByKdId: Record<string, any[]> = {};
        const docsBySiteId: Record<string, any[]> = {};
        for (const doc of allDesignDocs) {
          if (doc.keyDateId) {
            if (!docsByKdId[doc.keyDateId]) docsByKdId[doc.keyDateId] = [];
            docsByKdId[doc.keyDateId].push(doc);
          }
          if (doc.siteId) {
            if (!docsBySiteId[doc.siteId]) docsBySiteId[doc.siteId] = [];
            docsBySiteId[doc.siteId].push(doc);
          }
        }

        // Inline doc-progress helpers (mirrors designDocumentProgress.ts)
        const DOC_STATUS_PROGRESS: Record<string, number> = {
          draft: 0, submitted: 0.3, approved: 1.0, approved_with_comment: 1.0, rejected: 0,
        };
        const getRevNum = (rev: string) => { const m = rev?.match(/^R(\d+)$/); return m ? parseInt(m[1], 10) : 0; };
        const docProgress = (docs: any[]): number => {
          if (docs.length === 0) return 0;
          // Latest revision per documentNumber
          const latest: Record<string, any> = {};
          for (const d of docs) {
            if (!latest[d.documentNumber] || getRevNum(d.revisionNumber) > getRevNum(latest[d.documentNumber].revisionNumber)) {
              latest[d.documentNumber] = d;
            }
          }
          const ld = Object.values(latest);
          const totalW = ld.reduce((s: number, d: any) => s + (d.weightage ?? 0), 0);
          if (totalW === 0) {
            return ld.length > 0 ? (ld.reduce((s: number, d: any) => s + (DOC_STATUS_PROGRESS[d.status] ?? 0), 0) / ld.length) * 100 : 0;
          }
          return ld.reduce((s: number, d: any) => s + (d.weightage ?? 0) * (DOC_STATUS_PROGRESS[d.status] ?? 0), 0) / totalW * 100;
        };

        const effectiveKDProgress = (kd: any): number => {
          if (kd.status === 'completed') return 100;
          const mode = kd.progressMode;
          if (mode === 'manual' || mode === 'binary') return kd.progressPercentage ?? 0;

          const sites = kdSitesByKdId[kd.id] ?? [];

          // Item progress (site-contribution-weighted)
          let siteWeighted = 0;
          for (const site of sites) {
            const items = itemsBySiteId[site.siteId] ?? [];
            const totalW = items.reduce((s: number, i: any) => s + (i.weightage ?? 0), 0);
            const sp = totalW > 0
              ? items.reduce((s: number, i: any) => {
                  const pct = (i.plannedQuantity ?? 0) > 0
                    ? Math.min(100, ((i.completedQuantity ?? 0) / i.plannedQuantity) * 100) : 0;
                  return s + (i.weightage ?? 0) * pct;
                }, 0) / totalW
              : 0;
            siteWeighted += (site.contributionPercentage / 100) * sp;
          }

          // Doc progress (same dedup + status-map logic as Planner)
          const directDocs = docsByKdId[kd.id] ?? [];
          const seenIds = new Set(directDocs.map((d: any) => d.id));
          const siteDocs = sites.flatMap((site: any) =>
            (docsBySiteId[site.siteId] ?? []).filter((d: any) => !seenIds.has(d.id))
          );
          const kdDocs = [...directDocs, ...siteDocs];
          const kdDocProgress = docProgress(kdDocs);

          const hasSites = sites.length > 0;
          const hasDocs = kdDocs.length > 0;
          if (!hasSites && !hasDocs) return kd.progressPercentage ?? 0;
          const dw = kd.designWeightage ?? 0;
          if (!hasDocs || dw === 0) return Math.min(100, siteWeighted);
          if (!hasSites) return kdDocProgress;
          return Math.min(100, siteWeighted * (100 - dw) / 100 + kdDocProgress * dw / 100);
        };

        const weightedKDProgress = totalWeight > 0
          ? kds.reduce((s: number, k: any) =>
              s + effectiveKDProgress(k) * (k.weightage ?? 0) / totalWeight, 0)
          : 0;

        // LD exposure from delayed KDs
        const ldExposureLakhs = kds
          .filter((k: any) => k.status === 'delayed')
          .reduce((s: number, k: any) => {
            const end = k.actualDate ?? Date.now();
            if (!k.targetDate) return s;
            const daysDelayed = Math.max(0, Math.ceil((end - k.targetDate) / 86_400_000));
            const initialDays = Math.min(daysDelayed, 28);
            const extDays = Math.max(0, daysDelayed - 28);
            return s + initialDays * (k.delayDamagesInitial ?? 1) + extDays * (k.delayDamagesExtended ?? 10);
          }, 0);

        setContractKPIs({ contractValue, totalBilledGross, weightedKDProgress, ldExposureLakhs });
      } catch (err) {
        logger.error('[Dashboard] Contract KPIs load error:', err as Error);
      }
    };
    loadContractKPIs();
  }, [projectId, refreshTrigger]);

  // Tutorial auto-show logic
  useEffect(() => {
    const checkTutorial = async () => {
      if (!user) return;

      // If explicitly requested via params, show tutorial from beginning
      if (route.params?.showTutorial) {
        setTutorialInitialStep(0);
        setShowTutorial(true);
        return;
      }

      // Check if tutorial should auto-show (first time)
      const shouldShow = await TutorialService.shouldShowTutorial(user.userId, 'commercial_manager');
      if (shouldShow) {
        const progress = await TutorialService.getTutorialProgress(user.userId, 'commercial_manager');
        setTutorialInitialStep(progress.currentStep);
        setShowTutorial(true);
      }
    };

    checkTutorial();
  }, [user, route.params?.showTutorial]);

  // Reload dashboard when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (projectId) {
        loadDashboardData();
      }
    }, [projectId, loadDashboardData])
  );

  // Handle pull-to-refresh
  const handleRefresh = useCallback(() => {
    loadDashboardData(true);
  }, [loadDashboardData]);

  // Handle period change — dispatch new period and reload with explicit period
  // (state.ui.selectedPeriod hasn't updated yet at call time, so pass it directly)
  const handlePeriodChange = useCallback((period: Period) => {
    dispatch(dashboardActions.setPeriod(period));
    loadDashboardData(false, false, period);
  }, [loadDashboardData]);

  // Navigation handlers for drill-down
  const handleBudgetPress = useCallback(() => {
    navigation.navigate('BudgetManagement');
  }, [navigation]);

  const handleCashFlowPress = useCallback(() => {
    navigation.navigate('FinancialReports');
  }, [navigation]);

  const handleInvoicePress = useCallback(() => {
    navigation.navigate('InvoiceManagement');
  }, [navigation]);

  const handleInvoiceStatusPress = useCallback(
    (status: 'pending' | 'paid' | 'overdue') => {
      navigation.navigate('InvoiceManagement', { filterStatus: status });
    },
    [navigation]
  );

  const handleCostTrackingPress = useCallback(() => {
    navigation.navigate('CostTracking');
  }, [navigation]);

  const handleCategoryPress = useCallback(
    (category: string) => {
      navigation.navigate('CostTracking', { filterCategory: category });
    },
    [navigation]
  );

  const handleKDBillingPress = useCallback(() => {
    navigation.navigate('KDBilling');
  }, [navigation]);

  const handleLDRiskPress = useCallback(() => {
    navigation.navigate('LDRisk');
  }, [navigation]);

  // Tutorial handlers
  const handleTutorialDismiss = useCallback(async () => {
    if (user) {
      await TutorialService.dismissTutorial(user.userId, 'commercial_manager', tutorialInitialStep);
    }
    setShowTutorial(false);
  }, [user, tutorialInitialStep]);

  const handleTutorialComplete = useCallback(async () => {
    if (user) {
      await TutorialService.markTutorialCompleted(user.userId, 'commercial_manager');
    }
    setShowTutorial(false);
  }, [user]);

  const handleTutorialStepChange = useCallback(async (step: number) => {
    if (user) {
      await TutorialService.markStepCompleted(user.userId, 'commercial_manager', step);
    }
  }, [user]);

  // Transform data for widgets
  const categorySpendingData: CategorySpendingData[] = useMemo(() => {
    if (!state.data.dashboardData) return [];
    return state.data.dashboardData.categoryBreakdown.map((cat) => ({
      category: cat.category,
      budget: cat.budget,
      spent: cat.spent,
    }));
  }, [state.data.dashboardData]);

  const transactions: Transaction[] = useMemo(() => {
    if (!state.data.dashboardData) return [];
    return state.data.dashboardData.recentCosts.map((cost, index) => ({
      id: `cost-${index}`,
      type: 'cost' as const,
      description: cost.description,
      amount: cost.amount,
      date: cost.date,
      category: cost.category,
    }));
  }, [state.data.dashboardData]);

  // Cash flow trend data (mock for now)
  const cashFlowTrendData = useMemo(() => {
    if (!state.data.dashboardData) return [];
    const net = state.data.dashboardData.cashFlow.net;
    // Generate mock trend data based on current value
    return [
      net * 0.6,
      net * 0.75,
      net * 0.65,
      net * 0.8,
      net * 0.9,
      net,
    ];
  }, [state.data.dashboardData]);

  const periodLabel = formatPeriodLabel(state.ui.selectedPeriod);
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  if (!projectId) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No project assigned</Text>
      </View>
    );
  }

  if (state.ui.loading) {
    return <DashboardSkeleton />;
  }

  if (!state.data.dashboardData) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No dashboard data available</Text>
      </View>
    );
  }

  const { budgetSummary, invoicesSummary, cashFlow, alerts } = state.data.dashboardData;
  const previousPeriodData = state.data.previousPeriodData;

  return (
    <>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={state.ui.refreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.PRIMARY]}
            tintColor={COLORS.PRIMARY}
          />
        }
      >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.dateText}>{currentDate}</Text>
        <Text style={styles.greeting}>
          Welcome, {user?.fullName || user?.username || 'Commercial Manager'}!
        </Text>
        <Text style={styles.projectName}>{projectName}</Text>
        <PeriodSelector
          selectedPeriod={state.ui.selectedPeriod}
          onPeriodChange={handlePeriodChange}
          showCustom={false}
          size="compact"
          style={styles.periodSelector}
        />
      </View>

      {/* Alerts */}
      {alerts.length > 0 && <AlertsCard alerts={alerts} />}

      {/* Sprint 1: Contract KPIs */}
      {contractKPIs.contractValue > 0 && (
        <View style={styles.contractCard}>
          <Text style={styles.contractCardTitle}>Contract Billing</Text>
          <View style={styles.contractKPIRow}>
            <View style={styles.contractKPIItem}>
              <Text style={styles.contractKPILabel}>Contract Value</Text>
              <Text style={styles.contractKPIValue}>
                ₹{(contractKPIs.contractValue / 1_00_00_000).toFixed(2)} Cr
              </Text>
            </View>
            <View style={styles.contractKPIItem}>
              <Text style={styles.contractKPILabel}>Billed (Gross)</Text>
              <Text style={[styles.contractKPIValue, { color: COLORS.SUCCESS }]}>
                ₹{(contractKPIs.totalBilledGross / 1_00_00_000).toFixed(2)} Cr
              </Text>
            </View>
            <View style={styles.contractKPIItem}>
              <Text style={styles.contractKPILabel}>KD Progress</Text>
              <Text style={[styles.contractKPIValue, { color: COLORS.INFO }]}>
                {contractKPIs.weightedKDProgress.toFixed(1)}%
              </Text>
            </View>
          </View>
          <View style={styles.contractActions}>
            <View
              style={[
                styles.contractActionBtn,
                { backgroundColor: COLORS.PRIMARY + '15' },
              ]}
            >
              <Text
                style={[styles.contractActionText, { color: COLORS.PRIMARY }]}
                onPress={handleKDBillingPress}
              >
                KD Billing →
              </Text>
            </View>
            {contractKPIs.ldExposureLakhs > 0 && (
              <View style={[styles.contractActionBtn, { backgroundColor: COLORS.ERROR + '15' }]}>
                <Text
                  style={[styles.contractActionText, { color: COLORS.ERROR }]}
                  onPress={handleLDRiskPress}
                >
                  LD: ₹{contractKPIs.ldExposureLakhs.toFixed(1)}L →
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Sprint 4: Commercial Risk Early Warning */}
      {contractKPIs.contractValue > 0 && <CommercialRiskWidget />}

      {/* Budget Health Widget */}
      <BudgetHealthWidget
        totalBudget={budgetSummary.totalBudget}
        totalSpent={budgetSummary.totalSpent}
        percentageUsed={budgetSummary.percentageUsed}
        previousPeriodPercentage={previousPeriodData?.percentageUsed}
        onPress={handleBudgetPress}
        periodLabel={periodLabel}
      />

      {/* Cash Flow Widget */}
      <CashFlowWidget
        inflow={cashFlow.revenue}
        outflow={cashFlow.costs}
        netCashFlow={cashFlow.net}
        previousNetCashFlow={previousPeriodData?.netCashFlow}
        trendData={cashFlowTrendData}
        onPress={handleCashFlowPress}
        periodLabel={periodLabel}
      />

      {/* Invoice Status Widget */}
      <InvoiceStatusWidget
        total={invoicesSummary.total}
        pending={invoicesSummary.pending}
        paid={invoicesSummary.paid}
        overdue={invoicesSummary.overdue}
        totalPending={invoicesSummary.totalPending}
        totalPaid={invoicesSummary.totalPaid}
        onPress={handleInvoicePress}
        onStatusPress={handleInvoiceStatusPress}
        periodLabel={periodLabel}
      />

      {/* Category Spending Widget */}
      <CategorySpendingWidget
        categories={categorySpendingData}
        onPress={handleCostTrackingPress}
        onCategoryPress={handleCategoryPress}
        periodLabel={periodLabel}
      />

      {/* Recent Transactions Widget */}
      <RecentTransactionsWidget
        transactions={transactions}
        onPress={handleCostTrackingPress}
      />

      <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Tutorial Modal */}
      <TutorialModal
        visible={showTutorial}
        steps={commercialManagerTutorialSteps}
        initialStep={tutorialInitialStep}
        onComplete={handleTutorialComplete}
        onDismiss={handleTutorialDismiss}
        onStepChange={handleTutorialStepChange}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: 'white',
    padding: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  dateText: {
    fontSize: 14,
    color: '#666',
  },
  greeting: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 4,
    marginBottom: 4,
  },
  projectName: {
    fontSize: 15,
    color: '#555',
    marginBottom: 12,
  },
  periodSelector: {
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  bottomPadding: {
    height: 32,
  },
  // Sprint 1: Contract KPI card styles
  contractCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 14,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.PRIMARY,
  },
  contractCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    marginBottom: 10,
  },
  contractKPIRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  contractKPIItem: { flex: 1 },
  contractKPILabel: { fontSize: 10, color: '#888', marginBottom: 2 },
  contractKPIValue: { fontSize: 15, fontWeight: '800', color: '#333' },
  contractActions: {
    flexDirection: 'row',
    gap: 8,
  },
  contractActionBtn: {
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  contractActionText: {
    fontSize: 13,
    fontWeight: '600',
  },
});

export default function CommercialDashboardScreenWithErrorBoundary(props: any) {
  return (
    <ErrorBoundary name="CommercialDashboardScreen">
      <CommercialDashboardScreen {...props} />
    </ErrorBoundary>
  );
}
