/**
 * Budget Management Action Creators
 *
 * Provides typed action creators for BudgetManagementReducer
 * Following Manager and Logistics Phase 2 patterns
 */

import { Budget, BudgetManagementAction } from './budgetManagementReducer';

export const budgetManagementActions = {
  setLoading: (loading: boolean): BudgetManagementAction => ({
    type: 'SET_LOADING',
    payload: loading,
  }),

  setBudgets: (budgets: Budget[]): BudgetManagementAction => ({
    type: 'SET_BUDGETS',
    payload: budgets,
  }),

  setFilteredBudgets: (budgets: Budget[]): BudgetManagementAction => ({
    type: 'SET_FILTERED_BUDGETS',
    payload: budgets,
  }),

  setSearchQuery: (query: string): BudgetManagementAction => ({
    type: 'SET_SEARCH_QUERY',
    payload: query,
  }),

  toggleFilterMenu: (): BudgetManagementAction => ({
    type: 'TOGGLE_FILTER_MENU',
  }),

  openCreateDialog: (): BudgetManagementAction => ({
    type: 'OPEN_CREATE_DIALOG',
  }),

  openEditDialog: (budget: Budget): BudgetManagementAction => ({
    type: 'OPEN_EDIT_DIALOG',
    payload: budget,
  }),

  closeDialogs: (): BudgetManagementAction => ({
    type: 'CLOSE_DIALOGS',
  }),

  setFormField: (field: 'category' | 'amount' | 'description', value: string): BudgetManagementAction => ({
    type: 'SET_FORM_FIELD',
    payload: { field, value },
  }),

  resetForm: (): BudgetManagementAction => ({
    type: 'RESET_FORM',
  }),

  setEditingBudget: (budget: Budget | null): BudgetManagementAction => ({
    type: 'SET_EDITING_BUDGET',
    payload: budget,
  }),
};
