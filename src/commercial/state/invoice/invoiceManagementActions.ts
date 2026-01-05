/**
 * Invoice Management Action Creators
 *
 * Provides typed action creators for InvoiceManagementReducer
 * Following Manager and Logistics Phase 2 patterns
 */

import { Invoice, InvoiceSummary, InvoiceManagementAction } from './invoiceManagementReducer';

export const invoiceManagementActions = {
  setLoading: (loading: boolean): InvoiceManagementAction => ({
    type: 'SET_LOADING',
    payload: loading,
  }),

  setInvoices: (invoices: Invoice[]): InvoiceManagementAction => ({
    type: 'SET_INVOICES',
    payload: invoices,
  }),

  setFilteredInvoices: (invoices: Invoice[]): InvoiceManagementAction => ({
    type: 'SET_FILTERED_INVOICES',
    payload: invoices,
  }),

  setSearchQuery: (query: string): InvoiceManagementAction => ({
    type: 'SET_SEARCH_QUERY',
    payload: query,
  }),

  setSummary: (summary: InvoiceSummary): InvoiceManagementAction => ({
    type: 'SET_SUMMARY',
    payload: summary,
  }),

  openCreateDialog: (): InvoiceManagementAction => ({
    type: 'OPEN_CREATE_DIALOG',
  }),

  openEditDialog: (invoice: Invoice): InvoiceManagementAction => ({
    type: 'OPEN_EDIT_DIALOG',
    payload: invoice,
  }),

  closeDialogs: (): InvoiceManagementAction => ({
    type: 'CLOSE_DIALOGS',
  }),

  setEditingInvoice: (invoice: Invoice | null): InvoiceManagementAction => ({
    type: 'SET_EDITING_INVOICE',
    payload: invoice,
  }),
};
