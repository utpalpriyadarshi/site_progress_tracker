/**
 * Dashboard Action Creators
 *
 * Provides typed action creators for DashboardReducer
 * Following Manager and Logistics Phase 2 patterns
 *
 * Phase 3 Update: Added period and refreshing actions
 */

import { DashboardData, DashboardAction } from './dashboardReducer';
import { Period } from '../../dashboard/widgets';

export const dashboardActions = {
  setLoading: (loading: boolean): DashboardAction => ({
    type: 'SET_LOADING',
    payload: loading,
  }),

  setRefreshing: (refreshing: boolean): DashboardAction => ({
    type: 'SET_REFRESHING',
    payload: refreshing,
  }),

  setPeriod: (period: Period): DashboardAction => ({
    type: 'SET_PERIOD',
    payload: period,
  }),

  setDashboardData: (dashboardData: DashboardData | null): DashboardAction => ({
    type: 'SET_DASHBOARD_DATA',
    payload: dashboardData,
  }),

  setPreviousPeriodData: (
    data: { percentageUsed?: number; netCashFlow?: number } | null
  ): DashboardAction => ({
    type: 'SET_PREVIOUS_PERIOD_DATA',
    payload: data,
  }),
};
