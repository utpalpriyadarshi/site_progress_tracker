/**
 * Dashboard Reducer
 *
 * State management for the Logistics Dashboard.
 * Handles widget refresh states and view preferences.
 *
 * @version 1.0.0
 * @since Logistics Phase 3
 */

// ==================== Types ====================

export interface DashboardState {
  /** Global refresh key to force widget re-renders */
  refreshKey: number;

  /** Individual widget loading states */
  widgetLoading: {
    inventory: boolean;
    delivery: boolean;
    purchaseOrder: boolean;
    materialRequirements: boolean;
    doorsPackage: boolean;
    rfqStatus: boolean;
    recentActivity: boolean;
  };

  /** Last refresh timestamp */
  lastRefreshed: Date | null;

  /** View preferences */
  preferences: {
    showCompactView: boolean;
    enableAutoRefresh: boolean;
    autoRefreshInterval: number; // minutes
  };
}

export type DashboardAction =
  | { type: 'REFRESH_ALL' }
  | { type: 'SET_WIDGET_LOADING'; payload: { widget: keyof DashboardState['widgetLoading']; loading: boolean } }
  | { type: 'SET_LAST_REFRESHED'; payload: Date }
  | { type: 'TOGGLE_COMPACT_VIEW' }
  | { type: 'SET_AUTO_REFRESH'; payload: boolean }
  | { type: 'SET_AUTO_REFRESH_INTERVAL'; payload: number }
  | { type: 'RESET' };

// ==================== Initial State ====================

export const initialDashboardState: DashboardState = {
  refreshKey: 0,
  widgetLoading: {
    inventory: false,
    delivery: false,
    purchaseOrder: false,
    materialRequirements: false,
    doorsPackage: false,
    rfqStatus: false,
    recentActivity: false,
  },
  lastRefreshed: null,
  preferences: {
    showCompactView: false,
    enableAutoRefresh: false,
    autoRefreshInterval: 5,
  },
};

// ==================== Reducer ====================

export function dashboardReducer(
  state: DashboardState,
  action: DashboardAction
): DashboardState {
  switch (action.type) {
    case 'REFRESH_ALL':
      return {
        ...state,
        refreshKey: state.refreshKey + 1,
        lastRefreshed: new Date(),
      };

    case 'SET_WIDGET_LOADING':
      return {
        ...state,
        widgetLoading: {
          ...state.widgetLoading,
          [action.payload.widget]: action.payload.loading,
        },
      };

    case 'SET_LAST_REFRESHED':
      return {
        ...state,
        lastRefreshed: action.payload,
      };

    case 'TOGGLE_COMPACT_VIEW':
      return {
        ...state,
        preferences: {
          ...state.preferences,
          showCompactView: !state.preferences.showCompactView,
        },
      };

    case 'SET_AUTO_REFRESH':
      return {
        ...state,
        preferences: {
          ...state.preferences,
          enableAutoRefresh: action.payload,
        },
      };

    case 'SET_AUTO_REFRESH_INTERVAL':
      return {
        ...state,
        preferences: {
          ...state.preferences,
          autoRefreshInterval: action.payload,
        },
      };

    case 'RESET':
      return initialDashboardState;

    default:
      return state;
  }
}

export default dashboardReducer;
