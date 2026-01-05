/**
 * Invoice Type Definitions
 * Shared types for invoice-related components
 */

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  projectId: string;
  poId: string;
  vendorName: string;
  amount: number;
  paidAmount?: number;
  invoiceDate: number;
  paymentDate?: number;
  paymentStatus: 'pending' | 'paid' | 'overdue';
  items?: InvoiceItem[];
  notes?: string;
  createdBy: string;
  createdAt: number;
}

export type InvoiceStatus = 'pending' | 'paid' | 'overdue';

export interface InvoiceCardProps {
  invoice: Invoice;
  onPress?: (invoice: Invoice) => void;
  onEdit?: (invoice: Invoice) => void;
  onDelete?: (invoice: Invoice) => void;
  onMarkPaid?: (invoice: Invoice) => void;
  showActions?: boolean;
  variant?: 'default' | 'compact' | 'detailed';
}
