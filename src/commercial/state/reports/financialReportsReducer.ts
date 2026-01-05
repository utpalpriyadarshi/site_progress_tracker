/**
 * Financial Reports Reducer
 *
 * Centralizes state management for FinancialReportsScreen
 * Following Manager and Logistics Phase 2 patterns
 */

export interface ReportData {
  budgetByCategory: Array<{ category: string; allocated: number; spent: number; variance: number }>;
  costsByCategory: Array<{ category: string; amount: number; percentage: number }>;
  invoicesSummary: {
    total: number;
    paid: number;
    pending: number;
    overdue: number;
  };
  cashFlow: {
    totalRevenue: number;
    totalCosts: number;
    netCashFlow: number;
  };
  profitability: {
    totalBudget: number;
    totalSpent: number;
    remaining: number;
    profitMargin: number;
  };
}

export interface FinancialReportsState {
  ui: {
    loading: boolean;
    showStartDatePicker: boolean;
    showEndDatePicker: boolean;
  };
  data: {
    reportData: ReportData | null;
  };
}

export type FinancialReportsAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_REPORT_DATA'; payload: ReportData | null }
  | { type: 'SET_SHOW_START_DATE_PICKER'; payload: boolean }
  | { type: 'SET_SHOW_END_DATE_PICKER'; payload: boolean };

export const initialFinancialReportsState: FinancialReportsState = {
  ui: {
    loading: true,
    showStartDatePicker: false,
    showEndDatePicker: false,
  },
  data: {
    reportData: null,
  },
};

export function financialReportsReducer(
  state: FinancialReportsState,
  action: FinancialReportsAction
): FinancialReportsState {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        ui: {
          ...state.ui,
          loading: action.payload,
        },
      };

    case 'SET_REPORT_DATA':
      return {
        ...state,
        data: {
          ...state.data,
          reportData: action.payload,
        },
      };

    case 'SET_SHOW_START_DATE_PICKER':
      return {
        ...state,
        ui: {
          ...state.ui,
          showStartDatePicker: action.payload,
        },
      };

    case 'SET_SHOW_END_DATE_PICKER':
      return {
        ...state,
        ui: {
          ...state.ui,
          showEndDatePicker: action.payload,
        },
      };

    default:
      return state;
  }
}
