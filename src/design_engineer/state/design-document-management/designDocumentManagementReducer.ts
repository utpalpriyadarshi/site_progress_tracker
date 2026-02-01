import {
  DesignDocument,
  DesignDocumentCategory,
  Site,
  DocumentType,
  DocumentStatus,
} from '../../types/DesignDocumentTypes';

export interface DocumentFormData {
  documentNumber: string;
  title: string;
  description: string;
  documentType: DocumentType | '';
  categoryId: string;
  siteId: string;
  revisionNumber: string;
}

export interface DesignDocumentManagementState {
  ui: {
    loading: boolean;
    dialogVisible: boolean;
    categoriesDialogVisible: boolean;
    approvalDialogVisible: boolean;
    editingDocumentId: string | null;
    approvalDocumentId: string | null;
    approvalAction: 'submit' | 'approve' | 'approve_with_comment' | 'reject' | null;
  };
  data: {
    documents: DesignDocument[];
    categories: DesignDocumentCategory[];
    sites: Site[];
    filteredDocuments: DesignDocument[];
  };
  filters: {
    searchQuery: string;
    documentType: DocumentType | null;
    status: DocumentStatus | null;
    categoryId: string | null;
  };
  form: DocumentFormData;
  approvalComment: string;
}

export type DesignDocumentManagementAction =
  // Loading
  | { type: 'START_LOADING' }
  | { type: 'COMPLETE_LOADING' }
  // Data operations
  | { type: 'SET_DOCUMENTS'; payload: { documents: DesignDocument[] } }
  | { type: 'SET_CATEGORIES'; payload: { categories: DesignDocumentCategory[] } }
  | { type: 'SET_SITES'; payload: { sites: Site[] } }
  | { type: 'ADD_DOCUMENT'; payload: { document: DesignDocument } }
  | { type: 'UPDATE_DOCUMENT'; payload: { document: DesignDocument } }
  | { type: 'DELETE_DOCUMENT'; payload: { documentId: string } }
  | { type: 'ADD_CATEGORY'; payload: { category: DesignDocumentCategory } }
  | { type: 'DELETE_CATEGORY'; payload: { categoryId: string } }
  // Dialog management
  | { type: 'OPEN_DIALOG'; payload?: { editingDocumentId?: string } }
  | { type: 'CLOSE_DIALOG' }
  | { type: 'OPEN_CATEGORIES_DIALOG' }
  | { type: 'CLOSE_CATEGORIES_DIALOG' }
  | { type: 'OPEN_APPROVAL_DIALOG'; payload: { documentId: string; action: 'submit' | 'approve' | 'approve_with_comment' | 'reject' } }
  | { type: 'CLOSE_APPROVAL_DIALOG' }
  // Form management
  | { type: 'UPDATE_FORM_FIELD'; payload: { field: keyof DocumentFormData; value: string } }
  | { type: 'SET_FORM'; payload: DocumentFormData }
  | { type: 'RESET_FORM' }
  | { type: 'SET_APPROVAL_COMMENT'; payload: { comment: string } }
  // Filter management
  | { type: 'SET_SEARCH_QUERY'; payload: { query: string } }
  | { type: 'SET_FILTER_DOCUMENT_TYPE'; payload: { documentType: DocumentType | null } }
  | { type: 'SET_FILTER_STATUS'; payload: { status: DocumentStatus | null } }
  | { type: 'SET_FILTER_CATEGORY'; payload: { categoryId: string | null } }
  | { type: 'APPLY_FILTERS' };

export const createInitialState = (): DesignDocumentManagementState => ({
  ui: {
    loading: true,
    dialogVisible: false,
    categoriesDialogVisible: false,
    approvalDialogVisible: false,
    editingDocumentId: null,
    approvalDocumentId: null,
    approvalAction: null,
  },
  data: {
    documents: [],
    categories: [],
    sites: [],
    filteredDocuments: [],
  },
  filters: {
    searchQuery: '',
    documentType: null,
    status: null,
    categoryId: null,
  },
  form: {
    documentNumber: '',
    title: '',
    description: '',
    documentType: '',
    categoryId: '',
    siteId: '',
    revisionNumber: 'R0',
  },
  approvalComment: '',
});

const applyFilters = (
  documents: DesignDocument[],
  searchQuery: string,
  documentType: DocumentType | null,
  status: DocumentStatus | null,
  categoryId: string | null,
): DesignDocument[] => {
  let filtered = [...documents];

  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(
      (doc) =>
        doc.documentNumber.toLowerCase().includes(query) ||
        doc.title.toLowerCase().includes(query) ||
        (doc.description && doc.description.toLowerCase().includes(query)) ||
        (doc.categoryName && doc.categoryName.toLowerCase().includes(query)) ||
        (doc.siteName && doc.siteName.toLowerCase().includes(query))
    );
  }

  if (documentType) {
    filtered = filtered.filter((doc) => doc.documentType === documentType);
  }

  if (status) {
    filtered = filtered.filter((doc) =>
      status === 'approved'
        ? doc.status === 'approved' || doc.status === 'approved_with_comment'
        : doc.status === status,
    );
  }

  if (categoryId) {
    filtered = filtered.filter((doc) => doc.categoryId === categoryId);
  }

  return filtered;
};

export const designDocumentManagementReducer = (
  state: DesignDocumentManagementState,
  action: DesignDocumentManagementAction,
): DesignDocumentManagementState => {
  switch (action.type) {
    case 'START_LOADING':
      return { ...state, ui: { ...state.ui, loading: true } };

    case 'COMPLETE_LOADING':
      return { ...state, ui: { ...state.ui, loading: false } };

    case 'SET_DOCUMENTS': {
      const filteredDocuments = applyFilters(
        action.payload.documents,
        state.filters.searchQuery,
        state.filters.documentType,
        state.filters.status,
        state.filters.categoryId,
      );
      return {
        ...state,
        data: { ...state.data, documents: action.payload.documents, filteredDocuments },
      };
    }

    case 'SET_CATEGORIES':
      return { ...state, data: { ...state.data, categories: action.payload.categories } };

    case 'SET_SITES':
      return { ...state, data: { ...state.data, sites: action.payload.sites } };

    case 'ADD_DOCUMENT': {
      const newDocuments = [...state.data.documents, action.payload.document];
      const filteredDocuments = applyFilters(
        newDocuments,
        state.filters.searchQuery,
        state.filters.documentType,
        state.filters.status,
        state.filters.categoryId,
      );
      return {
        ...state,
        data: { ...state.data, documents: newDocuments, filteredDocuments },
      };
    }

    case 'UPDATE_DOCUMENT': {
      const updatedDocuments = state.data.documents.map((doc) =>
        doc.id === action.payload.document.id ? action.payload.document : doc,
      );
      const filteredDocuments = applyFilters(
        updatedDocuments,
        state.filters.searchQuery,
        state.filters.documentType,
        state.filters.status,
        state.filters.categoryId,
      );
      return {
        ...state,
        data: { ...state.data, documents: updatedDocuments, filteredDocuments },
      };
    }

    case 'DELETE_DOCUMENT': {
      const remainingDocuments = state.data.documents.filter(
        (doc) => doc.id !== action.payload.documentId,
      );
      const filteredDocuments = applyFilters(
        remainingDocuments,
        state.filters.searchQuery,
        state.filters.documentType,
        state.filters.status,
        state.filters.categoryId,
      );
      return {
        ...state,
        data: { ...state.data, documents: remainingDocuments, filteredDocuments },
      };
    }

    case 'ADD_CATEGORY':
      return {
        ...state,
        data: { ...state.data, categories: [...state.data.categories, action.payload.category] },
      };

    case 'DELETE_CATEGORY':
      return {
        ...state,
        data: {
          ...state.data,
          categories: state.data.categories.filter((c) => c.id !== action.payload.categoryId),
        },
      };

    case 'OPEN_DIALOG':
      return {
        ...state,
        ui: {
          ...state.ui,
          dialogVisible: true,
          editingDocumentId: action.payload?.editingDocumentId || null,
        },
      };

    case 'CLOSE_DIALOG':
      return {
        ...state,
        ui: { ...state.ui, dialogVisible: false, editingDocumentId: null },
        form: createInitialState().form,
      };

    case 'OPEN_CATEGORIES_DIALOG':
      return { ...state, ui: { ...state.ui, categoriesDialogVisible: true } };

    case 'CLOSE_CATEGORIES_DIALOG':
      return { ...state, ui: { ...state.ui, categoriesDialogVisible: false } };

    case 'OPEN_APPROVAL_DIALOG':
      return {
        ...state,
        ui: {
          ...state.ui,
          approvalDialogVisible: true,
          approvalDocumentId: action.payload.documentId,
          approvalAction: action.payload.action,
        },
        approvalComment: '',
      };

    case 'CLOSE_APPROVAL_DIALOG':
      return {
        ...state,
        ui: {
          ...state.ui,
          approvalDialogVisible: false,
          approvalDocumentId: null,
          approvalAction: null,
        },
        approvalComment: '',
      };

    case 'UPDATE_FORM_FIELD':
      return {
        ...state,
        form: { ...state.form, [action.payload.field]: action.payload.value },
      };

    case 'SET_FORM':
      return { ...state, form: action.payload };

    case 'RESET_FORM':
      return { ...state, form: createInitialState().form };

    case 'SET_APPROVAL_COMMENT':
      return { ...state, approvalComment: action.payload.comment };

    case 'SET_SEARCH_QUERY': {
      const filteredDocuments = applyFilters(
        state.data.documents,
        action.payload.query,
        state.filters.documentType,
        state.filters.status,
        state.filters.categoryId,
      );
      return {
        ...state,
        filters: { ...state.filters, searchQuery: action.payload.query },
        data: { ...state.data, filteredDocuments },
      };
    }

    case 'SET_FILTER_DOCUMENT_TYPE': {
      const filteredDocuments = applyFilters(
        state.data.documents,
        state.filters.searchQuery,
        action.payload.documentType,
        state.filters.status,
        state.filters.categoryId,
      );
      return {
        ...state,
        filters: { ...state.filters, documentType: action.payload.documentType },
        data: { ...state.data, filteredDocuments },
      };
    }

    case 'SET_FILTER_STATUS': {
      const filteredDocuments = applyFilters(
        state.data.documents,
        state.filters.searchQuery,
        state.filters.documentType,
        action.payload.status,
        state.filters.categoryId,
      );
      return {
        ...state,
        filters: { ...state.filters, status: action.payload.status },
        data: { ...state.data, filteredDocuments },
      };
    }

    case 'SET_FILTER_CATEGORY': {
      const filteredDocuments = applyFilters(
        state.data.documents,
        state.filters.searchQuery,
        state.filters.documentType,
        state.filters.status,
        action.payload.categoryId,
      );
      return {
        ...state,
        filters: { ...state.filters, categoryId: action.payload.categoryId },
        data: { ...state.data, filteredDocuments },
      };
    }

    case 'APPLY_FILTERS': {
      const filteredDocuments = applyFilters(
        state.data.documents,
        state.filters.searchQuery,
        state.filters.documentType,
        state.filters.status,
        state.filters.categoryId,
      );
      return { ...state, data: { ...state.data, filteredDocuments } };
    }

    default:
      return state;
  }
};
