/**
 * Analytics State Reducer
 *
 * Manages complex state for Logistics Analytics Screen
 * Replaces 15 useState hooks with a single useReducer
 *
 * State managed:
 * - UI state (viewMode, loading, refreshing)
 * - Analytics data (forecasts, predictions, trends, patterns, benchmarks)
 * - Optimization data (cost optimization, bundles, negotiations)
 * - Modal state (visibility, content)
 */

import {
  AnalyticsSummary,
  DemandForecast,
  LeadTimePrediction,
  CostTrendAnalysis,
  ConsumptionPattern,
  PerformanceBenchmark,
} from '../../../services/PredictiveAnalyticsService';
import {
  CostOptimizationResult,
  ProcurementBundle,
  SupplierNegotiationAnalysis,
  TransportationOptimization,
  StorageOptimization,
} from '../../../services/CostOptimizationService';

// ==================== Interfaces ====================

export type ViewMode = 'overview' | 'demand' | 'costs' | 'performance' | 'optimization';

// ==================== State Interface ====================

export interface AnalyticsState {
  // UI state
  ui: {
    viewMode: ViewMode;
    loading: boolean;
    refreshing: boolean;
  };

  // Analytics data
  analytics: {
    summary: AnalyticsSummary | null;
    demandForecasts: DemandForecast[];
    leadTimePredictions: LeadTimePrediction[];
    costTrends: CostTrendAnalysis[];
    consumptionPatterns: ConsumptionPattern[];
    performanceBenchmarks: PerformanceBenchmark[];
  };

  // Optimization data
  optimization: {
    costOptimization: CostOptimizationResult | null;
    procurementBundles: ProcurementBundle[];
    supplierNegotiation: SupplierNegotiationAnalysis[];
    transportation: TransportationOptimization | null;
    storage: StorageOptimization | null;
  };

  // Modal state
  modal: {
    visible: boolean;
    selectedDetail: any | null;
    detailType: string;
  };
}

// ==================== Action Types ====================

export type AnalyticsAction =
  // UI actions
  | { type: 'SET_VIEW_MODE'; payload: ViewMode }
  | { type: 'START_LOADING' }
  | { type: 'STOP_LOADING' }
  | { type: 'START_REFRESH' }
  | { type: 'STOP_REFRESH' }

  // Analytics data actions
  | { type: 'SET_ANALYTICS_SUMMARY'; payload: AnalyticsSummary | null }
  | { type: 'SET_DEMAND_FORECASTS'; payload: DemandForecast[] }
  | { type: 'SET_LEAD_TIME_PREDICTIONS'; payload: LeadTimePrediction[] }
  | { type: 'SET_COST_TRENDS'; payload: CostTrendAnalysis[] }
  | { type: 'SET_CONSUMPTION_PATTERNS'; payload: ConsumptionPattern[] }
  | { type: 'SET_PERFORMANCE_BENCHMARKS'; payload: PerformanceBenchmark[] }
  | {
      type: 'SET_ALL_ANALYTICS_DATA';
      payload: {
        summary: AnalyticsSummary;
        demandForecasts: DemandForecast[];
        leadTimePredictions: LeadTimePrediction[];
        costTrends: CostTrendAnalysis[];
        consumptionPatterns: ConsumptionPattern[];
        performanceBenchmarks: PerformanceBenchmark[];
      };
    }

  // Optimization data actions
  | { type: 'SET_COST_OPTIMIZATION'; payload: CostOptimizationResult | null }
  | { type: 'SET_PROCUREMENT_BUNDLES'; payload: ProcurementBundle[] }
  | { type: 'SET_SUPPLIER_NEGOTIATION'; payload: SupplierNegotiationAnalysis[] }
  | { type: 'SET_TRANSPORTATION_OPT'; payload: TransportationOptimization | null }
  | { type: 'SET_STORAGE_OPT'; payload: StorageOptimization | null }
  | {
      type: 'SET_ALL_OPTIMIZATION_DATA';
      payload: {
        costOptimization: CostOptimizationResult;
        procurementBundles: ProcurementBundle[];
        supplierNegotiation: SupplierNegotiationAnalysis[];
        transportation: TransportationOptimization;
        storage: StorageOptimization;
      };
    }

  // Modal actions
  | { type: 'SHOW_DETAIL_MODAL'; payload: { detail: any; detailType: string } }
  | { type: 'HIDE_DETAIL_MODAL' }

  // Reset action
  | { type: 'RESET_ANALYTICS' };

// ==================== Initial State ====================

export const initialAnalyticsState: AnalyticsState = {
  ui: {
    viewMode: 'overview',
    loading: false,
    refreshing: false,
  },
  analytics: {
    summary: null,
    demandForecasts: [],
    leadTimePredictions: [],
    costTrends: [],
    consumptionPatterns: [],
    performanceBenchmarks: [],
  },
  optimization: {
    costOptimization: null,
    procurementBundles: [],
    supplierNegotiation: [],
    transportation: null,
    storage: null,
  },
  modal: {
    visible: false,
    selectedDetail: null,
    detailType: '',
  },
};

// ==================== Reducer Function ====================

export const analyticsReducer = (
  state: AnalyticsState,
  action: AnalyticsAction
): AnalyticsState => {
  switch (action.type) {
    // ==================== UI Actions ====================

    case 'SET_VIEW_MODE':
      return {
        ...state,
        ui: {
          ...state.ui,
          viewMode: action.payload,
        },
      };

    case 'START_LOADING':
      return {
        ...state,
        ui: {
          ...state.ui,
          loading: true,
        },
      };

    case 'STOP_LOADING':
      return {
        ...state,
        ui: {
          ...state.ui,
          loading: false,
        },
      };

    case 'START_REFRESH':
      return {
        ...state,
        ui: {
          ...state.ui,
          refreshing: true,
        },
      };

    case 'STOP_REFRESH':
      return {
        ...state,
        ui: {
          ...state.ui,
          refreshing: false,
        },
      };

    // ==================== Analytics Data Actions ====================

    case 'SET_ANALYTICS_SUMMARY':
      return {
        ...state,
        analytics: {
          ...state.analytics,
          summary: action.payload,
        },
      };

    case 'SET_DEMAND_FORECASTS':
      return {
        ...state,
        analytics: {
          ...state.analytics,
          demandForecasts: action.payload,
        },
      };

    case 'SET_LEAD_TIME_PREDICTIONS':
      return {
        ...state,
        analytics: {
          ...state.analytics,
          leadTimePredictions: action.payload,
        },
      };

    case 'SET_COST_TRENDS':
      return {
        ...state,
        analytics: {
          ...state.analytics,
          costTrends: action.payload,
        },
      };

    case 'SET_CONSUMPTION_PATTERNS':
      return {
        ...state,
        analytics: {
          ...state.analytics,
          consumptionPatterns: action.payload,
        },
      };

    case 'SET_PERFORMANCE_BENCHMARKS':
      return {
        ...state,
        analytics: {
          ...state.analytics,
          performanceBenchmarks: action.payload,
        },
      };

    case 'SET_ALL_ANALYTICS_DATA':
      return {
        ...state,
        analytics: {
          summary: action.payload.summary,
          demandForecasts: action.payload.demandForecasts,
          leadTimePredictions: action.payload.leadTimePredictions,
          costTrends: action.payload.costTrends,
          consumptionPatterns: action.payload.consumptionPatterns,
          performanceBenchmarks: action.payload.performanceBenchmarks,
        },
      };

    // ==================== Optimization Data Actions ====================

    case 'SET_COST_OPTIMIZATION':
      return {
        ...state,
        optimization: {
          ...state.optimization,
          costOptimization: action.payload,
        },
      };

    case 'SET_PROCUREMENT_BUNDLES':
      return {
        ...state,
        optimization: {
          ...state.optimization,
          procurementBundles: action.payload,
        },
      };

    case 'SET_SUPPLIER_NEGOTIATION':
      return {
        ...state,
        optimization: {
          ...state.optimization,
          supplierNegotiation: action.payload,
        },
      };

    case 'SET_TRANSPORTATION_OPT':
      return {
        ...state,
        optimization: {
          ...state.optimization,
          transportation: action.payload,
        },
      };

    case 'SET_STORAGE_OPT':
      return {
        ...state,
        optimization: {
          ...state.optimization,
          storage: action.payload,
        },
      };

    case 'SET_ALL_OPTIMIZATION_DATA':
      return {
        ...state,
        optimization: {
          costOptimization: action.payload.costOptimization,
          procurementBundles: action.payload.procurementBundles,
          supplierNegotiation: action.payload.supplierNegotiation,
          transportation: action.payload.transportation,
          storage: action.payload.storage,
        },
      };

    // ==================== Modal Actions ====================

    case 'SHOW_DETAIL_MODAL':
      return {
        ...state,
        modal: {
          visible: true,
          selectedDetail: action.payload.detail,
          detailType: action.payload.detailType,
        },
      };

    case 'HIDE_DETAIL_MODAL':
      return {
        ...state,
        modal: {
          visible: false,
          selectedDetail: null,
          detailType: '',
        },
      };

    // ==================== Reset Action ====================

    case 'RESET_ANALYTICS':
      return initialAnalyticsState;

    // ==================== Default ====================

    default:
      return state;
  }
};
