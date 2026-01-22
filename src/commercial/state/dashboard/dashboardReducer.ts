/**
 * Dashboard Reducer
 *
 * Centralizes state management for CommercialDashboardScreen
 * Following Manager and Logistics Phase 2 patterns
 *
 * Phase 3 Update: Added period selection and refreshing state
 */

import { Period } from '../../dashboard/widgets';

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
    refreshing: boolean;
    selectedPeriod: Period;
  };
  data: {
    dashboardData: DashboardData | null;
    previousPeriodData: {
      percentageUsed?: number;
      netCashFlow?: number;
    } | null;
  };
}

export type DashboardAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_REFRESHING'; payload: boolean }
  | { type: 'SET_PERIOD'; payload: Period }
  | { type: 'SET_DASHBOARD_DATA'; payload: DashboardData | null }
  | { type: 'SET_PREVIOUS_PERIOD_DATA'; payload: { percentageUsed?: number; netCashFlow?: number } | null };

export const initialDashboardState: DashboardState = {
  ui: {
    loading: true,
    refreshing: false,
    selectedPeriod: 'mtd',
  },
  data: {
    dashboardData: null,
    previousPeriodData: null,
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

    case 'SET_REFRESHING':
      return {
        ...state,
        ui: {
          ...state.ui,
          refreshing: action.payload,
        },
      };

    case 'SET_PERIOD':
      return {
        ...state,
        ui: {
          ...state.ui,
          selectedPeriod: action.payload,
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

    case 'SET_PREVIOUS_PERIOD_DATA':
      return {
        ...state,
        data: {
          ...state.data,
          previousPeriodData: action.payload,
        },
      };

    default:
      return state;
  }
}
