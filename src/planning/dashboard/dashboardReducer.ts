/**
 * Dashboard State Management
 *
 * Reducer for the PlanningDashboard screen
 *
 * @version 1.0.0
 * @since Planning Phase 3
 */

// ==================== Types ====================

export interface DashboardState {
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  lastUpdated: Date | null;
  widgetLoadingStates: {
    milestones: boolean;
    criticalPath: boolean;
    schedule: boolean;
    activities: boolean;
    resources: boolean;
    wbsProgress: boolean;
  };
}

export type DashboardAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_REFRESHING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_LAST_UPDATED'; payload: Date }
  | { type: 'SET_WIDGET_LOADING'; payload: { widget: keyof DashboardState['widgetLoadingStates']; loading: boolean } }
  | { type: 'RESET_ERROR' };

// ==================== Initial State ====================

export const initialState: DashboardState = {
  loading: true,
  refreshing: false,
  error: null,
  lastUpdated: null,
  widgetLoadingStates: {
    milestones: true,
    criticalPath: true,
    schedule: true,
    activities: true,
    resources: true,
    wbsProgress: true,
  },
};

// ==================== Reducer ====================

export function dashboardReducer(
  state: DashboardState,
  action: DashboardAction
): DashboardState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };

    case 'SET_REFRESHING':
      return { ...state, refreshing: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };

    case 'SET_LAST_UPDATED':
      return { ...state, lastUpdated: action.payload };

    case 'SET_WIDGET_LOADING':
      return {
        ...state,
        widgetLoadingStates: {
          ...state.widgetLoadingStates,
          [action.payload.widget]: action.payload.loading,
        },
      };

    case 'RESET_ERROR':
      return { ...state, error: null };

    default:
      return state;
  }
}
