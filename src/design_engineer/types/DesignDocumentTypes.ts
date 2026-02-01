/**
 * Types for Design Document Management
 */

export type DocumentType = 'simulation_study' | 'installation' | 'product_equipment' | 'as_built';

export type DocumentStatus = 'draft' | 'submitted' | 'approved' | 'approved_with_comment' | 'rejected';

export interface DesignDocument {
  id: string;
  documentNumber: string;
  title: string;
  description?: string;
  documentType: DocumentType;
  categoryId: string;
  categoryName?: string;
  projectId: string;
  siteId?: string;
  siteName?: string;
  revisionNumber: string;
  status: DocumentStatus;
  approvalComment?: string;
  submittedDate?: number;
  approvedDate?: number;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}

export interface DesignDocumentCategory {
  id: string;
  name: string;
  documentType: DocumentType;
  projectId: string;
  isDefault: boolean;
  sequenceOrder: number;
}

export interface Site {
  id: string;
  name: string;
}

export const DOCUMENT_TYPES: { value: DocumentType; label: string }[] = [
  { value: 'simulation_study', label: 'Simulation/Study' },
  { value: 'installation', label: 'Installation' },
  { value: 'product_equipment', label: 'Product/Equipment' },
  { value: 'as_built', label: 'As-Built Design' },
];

export const STATUS_VALUES: { value: DocumentStatus; label: string }[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'approved', label: 'Approved' },
  { value: 'approved_with_comment', label: 'Approved w/ Comment' },
  { value: 'rejected', label: 'Rejected' },
];

export const DEFAULT_INSTALLATION_CATEGORIES = [
  'Layout Plan & Section',
  'Cable Tray Layout',
  'Cable Schedule',
];

/**
 * Document types that require site selection
 */
export const SITE_REQUIRED_TYPES: DocumentType[] = ['installation', 'as_built'];

export const getDocumentTypeLabel = (type: DocumentType): string => {
  return DOCUMENT_TYPES.find((t) => t.value === type)?.label || type;
};

export const getStatusLabel = (status: DocumentStatus): string => {
  return STATUS_VALUES.find((s) => s.value === status)?.label || status;
};

export const getStatusColor = (status: DocumentStatus): string => {
  const colors: Record<DocumentStatus, string> = {
    draft: '#9E9E9E',
    submitted: '#2196F3',
    approved: '#4CAF50',
    approved_with_comment: '#FF9800',
    rejected: '#F44336',
  };
  return colors[status] || '#9E9E9E';
};

export const getDocumentTypeColor = (type: DocumentType): string => {
  const colors: Record<DocumentType, string> = {
    simulation_study: '#607D8B',
    installation: '#2196F3',
    product_equipment: '#9C27B0',
    as_built: '#FF5722',
  };
  return colors[type] || '#666666';
};
