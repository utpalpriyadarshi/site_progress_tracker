/**
 * Invoice Management Reducer
 *
 * Centralizes state management for InvoiceManagementScreen
 * Following Manager and Logistics Phase 2 patterns
 */

export interface Invoice {
  id: string;
  projectId: string;
  poId: string;
  invoiceNumber: string;
  invoiceDate: number;
  dueDate?: number;
  amount: number;
  paymentStatus: string;
  paymentDate?: number;
  vendorId: string;
  vendorName?: string;
  createdBy: string;
  createdAt: number;
}

export interface InvoiceSummary {
  totalInvoices: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  overdueCount: number;
}

export interface InvoiceManagementState {
  ui: {
    loading: boolean;
    showCreateDialog: boolean;
    showEditDialog: boolean;
  };
  data: {
    invoices: Invoice[];
    filteredInvoices: Invoice[];
    editingInvoice: Invoice | null;
    summary: InvoiceSummary;
  };
  filters: {
    searchQuery: string;
  };
}

export type InvoiceManagementAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_INVOICES'; payload: Invoice[] }
  | { type: 'SET_FILTERED_INVOICES'; payload: Invoice[] }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_SUMMARY'; payload: InvoiceSummary }
  | { type: 'OPEN_CREATE_DIALOG' }
  | { type: 'OPEN_EDIT_DIALOG'; payload: Invoice }
  | { type: 'CLOSE_DIALOGS' }
  | { type: 'SET_EDITING_INVOICE'; payload: Invoice | null };

export const initialInvoiceManagementState: InvoiceManagementState = {
  ui: {
    loading: true,
    showCreateDialog: false,
    showEditDialog: false,
  },
  data: {
    invoices: [],
    filteredInvoices: [],
    editingInvoice: null,
    summary: {
      totalInvoices: 0,
      totalAmount: 0,
      paidAmount: 0,
      pendingAmount: 0,
      overdueCount: 0,
    },
  },
  filters: {
    searchQuery: '',
  },
};

export function invoiceManagementReducer(
  state: InvoiceManagementState,
  action: InvoiceManagementAction
): InvoiceManagementState {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        ui: {
          ...state.ui,
          loading: action.payload,
        },
      };

    case 'SET_INVOICES':
      return {
        ...state,
        data: {
          ...state.data,
          invoices: action.payload,
        },
      };

    case 'SET_FILTERED_INVOICES':
      return {
        ...state,
        data: {
          ...state.data,
          filteredInvoices: action.payload,
        },
      };

    case 'SET_SEARCH_QUERY':
      return {
        ...state,
        filters: {
          ...state.filters,
          searchQuery: action.payload,
        },
      };

    case 'SET_SUMMARY':
      return {
        ...state,
        data: {
          ...state.data,
          summary: action.payload,
        },
      };

    case 'OPEN_CREATE_DIALOG':
      return {
        ...state,
        ui: {
          ...state.ui,
          showCreateDialog: true,
        },
      };

    case 'OPEN_EDIT_DIALOG':
      return {
        ...state,
        ui: {
          ...state.ui,
          showEditDialog: true,
        },
        data: {
          ...state.data,
          editingInvoice: action.payload,
        },
      };

    case 'CLOSE_DIALOGS':
      return {
        ...state,
        ui: {
          ...state.ui,
          showCreateDialog: false,
          showEditDialog: false,
        },
        data: {
          ...state.data,
          editingInvoice: null,
        },
      };

    case 'SET_EDITING_INVOICE':
      return {
        ...state,
        data: {
          ...state.data,
          editingInvoice: action.payload,
        },
      };

    default:
      return state;
  }
}
