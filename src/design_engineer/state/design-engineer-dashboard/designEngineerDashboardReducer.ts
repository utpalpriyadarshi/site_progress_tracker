/**
 * Design Engineer Dashboard State Management
 *
 * Consolidates state from custom hook:
 * - useDashboardMetrics (metrics, loading)
 *
 * Reduction: 2 useState → 1 useReducer (50% reduction)
 */

import { DashboardMetrics } from '../../types/DashboardTypes';

/**
 * Main state interface
 */
export interface DesignEngineerDashboardState {
  ui: {
    loading: boolean;
  };
  data: {
    metrics: DashboardMetrics;
  };
}

/**
 * Action types
 */
export type DesignEngineerDashboardAction =
  // Loading
  | { type: 'START_LOADING' }
  | { type: 'COMPLETE_LOADING' }

  // Metrics operations
  | { type: 'SET_METRICS'; payload: { metrics: DashboardMetrics } }
  | { type: 'UPDATE_METRIC'; payload: { key: keyof DashboardMetrics; value: number } };

/**
 * Create initial state with default metrics
 */
export const createInitialState = (): DesignEngineerDashboardState => ({
  ui: {
    loading: true,
  },
  data: {
    metrics: {
      totalDoorsPackages: 0,
      pendingPackages: 0,
      receivedPackages: 0,
      reviewedPackages: 0,
      totalDesignRfqs: 0,
      draftRfqs: 0,
      issuedRfqs: 0,
      awardedRfqs: 0,
      complianceRate: 0,
      avgProcessingDays: 0,
    },
  },
});

/**
 * Design Engineer Dashboard Reducer
 */
export const designEngineerDashboardReducer = (
  state: DesignEngineerDashboardState,
  action: DesignEngineerDashboardAction
): DesignEngineerDashboardState => {
  switch (action.type) {
    // Loading
    case 'START_LOADING':
      return {
        ...state,
        ui: {
          ...state.ui,
          loading: true,
        },
      };

    case 'COMPLETE_LOADING':
      return {
        ...state,
        ui: {
          ...state.ui,
          loading: false,
        },
      };

    // Metrics operations
    case 'SET_METRICS':
      return {
        ...state,
        data: {
          ...state.data,
          metrics: action.payload.metrics,
        },
      };

    case 'UPDATE_METRIC':
      return {
        ...state,
        data: {
          ...state.data,
          metrics: {
            ...state.data.metrics,
            [action.payload.key]: action.payload.value,
          },
        },
      };

    default:
      return state;
  }
};
