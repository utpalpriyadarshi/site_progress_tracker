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
        <Text style={styles.welcomeText}>
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
  welcomeText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  projectName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
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
});

export default function CommercialDashboardScreenWithErrorBoundary(props: any) {
  return (
    <ErrorBoundary name="CommercialDashboardScreen">
      <CommercialDashboardScreen {...props} />
    </ErrorBoundary>
  );
}
