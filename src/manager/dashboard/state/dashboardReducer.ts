/**
 * Dashboard State Reducer
 *
 * Manages complex state for Manager dashboard
 * Replaces 4 useState hooks with a single useReducer
 *
 * State managed:
 * - Loading states (initial load, pull-to-refresh)
 * - Dashboard data (stats, project info)
 */

// ==================== Interfaces ====================

export interface ProjectStats {
  overallCompletion: number;
  sitesOnSchedule: number;
  sitesDelayed: number;
  totalSites: number;
  budgetUtilization: number;
  openHindrances: number;
  pendingApprovals: number;
  deliveryOnTrack: number;
  deliveryDelayed: number;
  criticalPathItemsAtRisk: number;
  upcomingMilestones: number;
  activeSupervisors: number;
}

export interface ProjectInfo {
  name: string;
  startDate: number;
  endDate: number;
  status: string;
  client: string;
  budget: number;
}

// ==================== State Interface ====================

export interface DashboardState {
  // Loading states
  loading: {
    initial: boolean;
    refreshing: boolean;
  };

  // Dashboard data
  data: {
    stats: ProjectStats;
    projectInfo: ProjectInfo | null;
  };
}

// ==================== Action Types ====================

export type DashboardAction =
  // Loading actions
  | { type: 'START_LOAD' }
  | { type: 'START_REFRESH' }
  | { type: 'FINISH_LOAD' }
  | { type: 'FINISH_REFRESH' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_REFRESHING'; payload: boolean }

  // Data actions
  | { type: 'SET_STATS'; payload: ProjectStats }
  | { type: 'SET_PROJECT_INFO'; payload: ProjectInfo | null }
  | { type: 'SET_DASHBOARD_DATA'; payload: { stats: ProjectStats; projectInfo: ProjectInfo | null } }

  // Reset action
  | { type: 'RESET_DASHBOARD' };

// ==================== Initial State ====================

const initialStats: ProjectStats = {
  overallCompletion: 0,
  sitesOnSchedule: 0,
  sitesDelayed: 0,
  totalSites: 0,
  budgetUtilization: 0,
  openHindrances: 0,
  pendingApprovals: 0,
  deliveryOnTrack: 0,
  deliveryDelayed: 0,
  criticalPathItemsAtRisk: 0,
  upcomingMilestones: 0,
  activeSupervisors: 0,
};

export const initialDashboardState: DashboardState = {
  loading: {
    initial: true,
    refreshing: false,
  },
  data: {
    stats: initialStats,
    projectInfo: null,
  },
};

// ==================== Reducer Function ====================

export const dashboardReducer = (
  state: DashboardState,
  action: DashboardAction
): DashboardState => {
  switch (action.type) {
    // ==================== Loading Actions ====================

    case 'START_LOAD':
      return {
        ...state,
        loading: {
          ...state.loading,
          initial: true,
        },
      };

    case 'START_REFRESH':
      return {
        ...state,
        loading: {
          ...state.loading,
          refreshing: true,
        },
      };

    case 'FINISH_LOAD':
      return {
        ...state,
        loading: {
          ...state.loading,
          initial: false,
        },
      };

    case 'FINISH_REFRESH':
      return {
        ...state,
        loading: {
          ...state.loading,
          refreshing: false,
        },
      };

    case 'SET_LOADING':
      return {
        ...state,
        loading: {
          ...state.loading,
          initial: action.payload,
        },
      };

    case 'SET_REFRESHING':
      return {
        ...state,
        loading: {
          ...state.loading,
          refreshing: action.payload,
        },
      };

    // ==================== Data Actions ====================

    case 'SET_STATS':
      return {
        ...state,
        data: {
          ...state.data,
          stats: action.payload,
        },
      };

    case 'SET_PROJECT_INFO':
      return {
        ...state,
        data: {
          ...state.data,
          projectInfo: action.payload,
        },
      };

    case 'SET_DASHBOARD_DATA':
      return {
        ...state,
        data: {
          stats: action.payload.stats,
          projectInfo: action.payload.projectInfo,
        },
      };

    // ==================== Reset Action ====================

    case 'RESET_DASHBOARD':
      return initialDashboardState;

    // ==================== Default ====================

    default:
      return state;
  }
};
