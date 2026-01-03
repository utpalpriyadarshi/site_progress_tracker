/**
 * Dashboard Action Creators
 *
 * Type-safe action creators for dashboard reducer
 * Provides better DX with autocomplete and type checking
 */

import { DashboardAction, ProjectStats, ProjectInfo } from './dashboardReducer';

// ==================== Loading Actions ====================

/**
 * Start initial dashboard load
 * Sets loading state to true
 */
export const startLoad = (): DashboardAction => ({
  type: 'START_LOAD',
});

/**
 * Start pull-to-refresh
 * Sets refreshing state to true
 */
export const startRefresh = (): DashboardAction => ({
  type: 'START_REFRESH',
});

/**
 * Finish initial dashboard load
 * Sets loading state to false
 */
export const finishLoad = (): DashboardAction => ({
  type: 'FINISH_LOAD',
});

/**
 * Finish pull-to-refresh
 * Sets refreshing state to false
 */
export const finishRefresh = (): DashboardAction => ({
  type: 'FINISH_REFRESH',
});

/**
 * Set loading state directly
 * @param loading - Whether dashboard is loading
 */
export const setLoading = (loading: boolean): DashboardAction => ({
  type: 'SET_LOADING',
  payload: loading,
});

/**
 * Set refreshing state directly
 * @param refreshing - Whether dashboard is refreshing
 */
export const setRefreshing = (refreshing: boolean): DashboardAction => ({
  type: 'SET_REFRESHING',
  payload: refreshing,
});

// ==================== Data Actions ====================

/**
 * Update dashboard statistics
 * @param stats - Complete project statistics object
 */
export const setStats = (stats: ProjectStats): DashboardAction => ({
  type: 'SET_STATS',
  payload: stats,
});

/**
 * Update project information
 * @param projectInfo - Project details or null if no project selected
 */
export const setProjectInfo = (projectInfo: ProjectInfo | null): DashboardAction => ({
  type: 'SET_PROJECT_INFO',
  payload: projectInfo,
});

/**
 * Batch update dashboard data
 * Efficient way to update both stats and project info in single dispatch
 * @param stats - Complete project statistics
 * @param projectInfo - Project details
 */
export const setDashboardData = (
  stats: ProjectStats,
  projectInfo: ProjectInfo | null
): DashboardAction => ({
  type: 'SET_DASHBOARD_DATA',
  payload: { stats, projectInfo },
});

// ==================== Reset Action ====================

/**
 * Reset dashboard to initial state
 * Clears all data and sets loading to true
 */
export const resetDashboard = (): DashboardAction => ({
  type: 'RESET_DASHBOARD',
});
