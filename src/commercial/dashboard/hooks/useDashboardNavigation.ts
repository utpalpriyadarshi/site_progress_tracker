/**
 * useDashboardNavigation - Navigation handlers for dashboard widgets
 *
 * Provides drill-down navigation handlers for all dashboard widgets:
 * - BudgetHealthWidget → BudgetManagement
 * - CashFlowWidget → FinancialReports
 * - InvoiceStatusWidget → InvoiceManagement (with optional status filter)
 * - CategorySpendingWidget → CostTracking (with optional category filter)
 * - RecentTransactionsWidget → CostTracking or InvoiceManagement
 *
 * @example
 * ```tsx
 * const {
 *   navigateToBudget,
 *   navigateToCashFlow,
 *   navigateToInvoices,
 *   navigateToInvoicesByStatus,
 *   navigateToCosts,
 *   navigateToCostsByCategory,
 *   navigateToTransaction,
 * } = useDashboardNavigation();
 *
 * <BudgetHealthWidget onPress={navigateToBudget} />
 * <InvoiceStatusWidget onPress={navigateToInvoices} onStatusPress={navigateToInvoicesByStatus} />
 * ```
 */

import { useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';

export type InvoiceStatusFilter = 'pending' | 'paid' | 'overdue';
export type TransactionType = 'cost' | 'invoice';

export interface NavigationParams {
  /** Filter by invoice status */
  filterStatus?: InvoiceStatusFilter;
  /** Filter by cost category */
  filterCategory?: string;
  /** Filter by date range */
  dateRange?: {
    start: Date;
    end: Date;
  };
  /** Initial tab to show */
  initialTab?: string;
  /** ID of specific item to highlight */
  highlightId?: string;
}

export interface DashboardNavigationHandlers {
  /** Navigate to Budget Management screen */
  navigateToBudget: () => void;
  /** Navigate to Financial Reports screen */
  navigateToCashFlow: () => void;
  /** Navigate to Invoice Management screen */
  navigateToInvoices: () => void;
  /** Navigate to Invoices filtered by status */
  navigateToInvoicesByStatus: (status: InvoiceStatusFilter) => void;
  /** Navigate to Cost Tracking screen */
  navigateToCosts: () => void;
  /** Navigate to Costs filtered by category */
  navigateToCostsByCategory: (category: string) => void;
  /** Navigate to a specific transaction (cost or invoice) */
  navigateToTransaction: (type: TransactionType, id: string) => void;
  /** Navigate with custom params */
  navigateWithParams: (screen: string, params?: NavigationParams) => void;
}

/**
 * Screen names for navigation
 */
export const DASHBOARD_SCREENS = {
  BUDGET_MANAGEMENT: 'BudgetManagement',
  FINANCIAL_REPORTS: 'FinancialReports',
  INVOICE_MANAGEMENT: 'InvoiceManagement',
  COST_TRACKING: 'CostTracking',
} as const;

/**
 * Hook that provides navigation handlers for dashboard widgets
 */
export function useDashboardNavigation(): DashboardNavigationHandlers {
  const navigation = useNavigation<any>();

  /**
   * Navigate to Budget Management screen
   */
  const navigateToBudget = useCallback(() => {
    navigation.navigate(DASHBOARD_SCREENS.BUDGET_MANAGEMENT);
  }, [navigation]);

  /**
   * Navigate to Financial Reports (Cash Flow) screen
   */
  const navigateToCashFlow = useCallback(() => {
    navigation.navigate(DASHBOARD_SCREENS.FINANCIAL_REPORTS);
  }, [navigation]);

  /**
   * Navigate to Invoice Management screen
   */
  const navigateToInvoices = useCallback(() => {
    navigation.navigate(DASHBOARD_SCREENS.INVOICE_MANAGEMENT);
  }, [navigation]);

  /**
   * Navigate to Invoice Management with status filter
   */
  const navigateToInvoicesByStatus = useCallback(
    (status: InvoiceStatusFilter) => {
      navigation.navigate(DASHBOARD_SCREENS.INVOICE_MANAGEMENT, {
        filterStatus: status,
      });
    },
    [navigation]
  );

  /**
   * Navigate to Cost Tracking screen
   */
  const navigateToCosts = useCallback(() => {
    navigation.navigate(DASHBOARD_SCREENS.COST_TRACKING);
  }, [navigation]);

  /**
   * Navigate to Cost Tracking with category filter
   */
  const navigateToCostsByCategory = useCallback(
    (category: string) => {
      navigation.navigate(DASHBOARD_SCREENS.COST_TRACKING, {
        filterCategory: category,
      });
    },
    [navigation]
  );

  /**
   * Navigate to a specific transaction
   */
  const navigateToTransaction = useCallback(
    (type: TransactionType, id: string) => {
      if (type === 'cost') {
        navigation.navigate(DASHBOARD_SCREENS.COST_TRACKING, {
          highlightId: id,
        });
      } else {
        navigation.navigate(DASHBOARD_SCREENS.INVOICE_MANAGEMENT, {
          highlightId: id,
        });
      }
    },
    [navigation]
  );

  /**
   * Navigate with custom parameters
   */
  const navigateWithParams = useCallback(
    (screen: string, params?: NavigationParams) => {
      navigation.navigate(screen, params);
    },
    [navigation]
  );

  return {
    navigateToBudget,
    navigateToCashFlow,
    navigateToInvoices,
    navigateToInvoicesByStatus,
    navigateToCosts,
    navigateToCostsByCategory,
    navigateToTransaction,
    navigateWithParams,
  };
}

/**
 * Create widget press handlers from navigation handlers
 * Helper function to easily wire up all widgets
 */
export function createWidgetHandlers(nav: DashboardNavigationHandlers) {
  return {
    budgetWidget: {
      onPress: nav.navigateToBudget,
    },
    cashFlowWidget: {
      onPress: nav.navigateToCashFlow,
    },
    invoiceWidget: {
      onPress: nav.navigateToInvoices,
      onStatusPress: nav.navigateToInvoicesByStatus,
    },
    categoryWidget: {
      onPress: nav.navigateToCosts,
      onCategoryPress: nav.navigateToCostsByCategory,
    },
    transactionsWidget: {
      onPress: nav.navigateToCosts,
      onTransactionPress: (transaction: { id: string; type: TransactionType }) => {
        nav.navigateToTransaction(transaction.type, transaction.id);
      },
    },
  };
}

export default useDashboardNavigation;
