/**
 * Dashboard Action Creators
 *
 * Provides typed action creators for DashboardReducer
 * Following Manager and Logistics Phase 2 patterns
 */

import { DashboardData, DashboardAction } from './dashboardReducer';

export const dashboardActions = {
  setLoading: (loading: boolean): DashboardAction => ({
    type: 'SET_LOADING',
    payload: loading,
  }),

  setDashboardData: (dashboardData: DashboardData | null): DashboardAction => ({
    type: 'SET_DASHBOARD_DATA',
    payload: dashboardData,
  }),
};
