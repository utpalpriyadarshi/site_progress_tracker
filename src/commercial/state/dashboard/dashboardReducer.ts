/**
 * Dashboard Reducer
 *
 * Centralizes state management for CommercialDashboardScreen
 * Following Manager and Logistics Phase 2 patterns
 */

export interface RecentCost {
  description: string;
  amount: number;
  date: number;
  category: string;
}

export interface BudgetSummary {
  totalBudget: number;
  totalSpent: number;
  remaining: number;
  percentageUsed: number;
}

export interface CategoryBreakdownItem {
  category: string;
  budget: number;
  spent: number;
  percentage: number;
  isOverBudget: boolean;
}

export interface InvoicesSummary {
  total: number;
  paid: number;
  pending: number;
  overdue: number;
  totalPaid: number;
  totalPending: number;
}

export interface CashFlow {
  revenue: number;
  costs: number;
  net: number;
}

export interface DashboardAlert {
  type: 'warning' | 'danger' | 'info';
  message: string;
}

export interface DashboardData {
  budgetSummary: BudgetSummary;
  categoryBreakdown: CategoryBreakdownItem[];
  recentCosts: RecentCost[];
  invoicesSummary: InvoicesSummary;
  cashFlow: CashFlow;
  alerts: DashboardAlert[];
}

export interface DashboardState {
  ui: {
    loading: boolean;
  };
  data: {
    dashboardData: DashboardData | null;
  };
}

export type DashboardAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_DASHBOARD_DATA'; payload: DashboardData | null };

export const initialDashboardState: DashboardState = {
  ui: {
    loading: true,
  },
  data: {
    dashboardData: null,
  },
};

export function dashboardReducer(
  state: DashboardState,
  action: DashboardAction
): DashboardState {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        ui: {
          ...state.ui,
          loading: action.payload,
        },
      };

    case 'SET_DASHBOARD_DATA':
      return {
        ...state,
        data: {
          ...state.data,
          dashboardData: action.payload,
        },
      };

    default:
      return state;
  }
}
