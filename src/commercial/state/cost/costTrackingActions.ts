/**
 * Cost Tracking Action Creators
 *
 * Provides typed action creators for CostTrackingReducer
 * Following Manager and Logistics Phase 2 patterns
 */

import { Cost, BudgetInfo, CostTrackingAction } from './costTrackingReducer';

export const costTrackingActions = {
  setLoading: (loading: boolean): CostTrackingAction => ({
    type: 'SET_LOADING',
    payload: loading,
  }),

  setCosts: (costs: Cost[]): CostTrackingAction => ({
    type: 'SET_COSTS',
    payload: costs,
  }),

  setBudgets: (budgets: BudgetInfo[]): CostTrackingAction => ({
    type: 'SET_BUDGETS',
    payload: budgets,
  }),

  setFilteredCosts: (costs: Cost[]): CostTrackingAction => ({
    type: 'SET_FILTERED_COSTS',
    payload: costs,
  }),

  setSearchQuery: (query: string): CostTrackingAction => ({
    type: 'SET_SEARCH_QUERY',
    payload: query,
  }),

  setTotals: (totalBudgets: number, totalCosts: number, totalVariance: number): CostTrackingAction => ({
    type: 'SET_TOTALS',
    payload: { totalBudgets, totalCosts, totalVariance },
  }),

  toggleFilterMenu: (): CostTrackingAction => ({
    type: 'TOGGLE_FILTER_MENU',
  }),

  openCreateDialog: (): CostTrackingAction => ({
    type: 'OPEN_CREATE_DIALOG',
  }),

  openEditDialog: (cost: Cost): CostTrackingAction => ({
    type: 'OPEN_EDIT_DIALOG',
    payload: cost,
  }),

  closeDialogs: (): CostTrackingAction => ({
    type: 'CLOSE_DIALOGS',
  }),

  setShowDatePicker: (show: boolean): CostTrackingAction => ({
    type: 'SET_SHOW_DATE_PICKER',
    payload: show,
  }),

  setFormField: (field: 'category' | 'amount' | 'description' | 'poId', value: string): CostTrackingAction => ({
    type: 'SET_FORM_FIELD',
    payload: { field, value },
  }),

  setFormDate: (date: Date): CostTrackingAction => ({
    type: 'SET_FORM_DATE',
    payload: date,
  }),

  resetForm: (): CostTrackingAction => ({
    type: 'RESET_FORM',
  }),

  setEditingCost: (cost: Cost | null): CostTrackingAction => ({
    type: 'SET_EDITING_COST',
    payload: cost,
  }),
};
