/**
 * Financial Reports Action Creators
 *
 * Provides typed action creators for FinancialReportsReducer
 * Following Manager and Logistics Phase 2 patterns
 */

import { ReportData, FinancialReportsAction } from './financialReportsReducer';

export const financialReportsActions = {
  setLoading: (loading: boolean): FinancialReportsAction => ({
    type: 'SET_LOADING',
    payload: loading,
  }),

  setReportData: (reportData: ReportData | null): FinancialReportsAction => ({
    type: 'SET_REPORT_DATA',
    payload: reportData,
  }),

  setShowStartDatePicker: (show: boolean): FinancialReportsAction => ({
    type: 'SET_SHOW_START_DATE_PICKER',
    payload: show,
  }),

  setShowEndDatePicker: (show: boolean): FinancialReportsAction => ({
    type: 'SET_SHOW_END_DATE_PICKER',
    payload: show,
  }),
};
