import { COLORS } from '../../../theme/colors';
/**
 * Invoice Management Constants
 * Centralized constants for payment statuses, colors, and labels
 */

export const PAYMENT_STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' },
  { value: 'overdue', label: 'Overdue' },
] as const;

export const STATUS_COLORS: Record<string, string> = {
  pending: '#FFA500',
  paid: COLORS.SUCCESS,
  overdue: '#ff6b6b',
};

export const getStatusColor = (status: string): string => {
  return STATUS_COLORS[status] || '#757575';
};

export const getStatusLabel = (status: string): string => {
  const stat = PAYMENT_STATUSES.find((s) => s.value === status);
  return stat ? stat.label : status;
};

// Due date calculation (30 days after invoice date)
export const OVERDUE_DAYS = 30;

export const calculateDueDate = (invoiceDate: number): number => {
  return invoiceDate + OVERDUE_DAYS * 24 * 60 * 60 * 1000;
};

export const isInvoiceOverdue = (invoiceDate: number, paymentStatus: string): boolean => {
  const today = Date.now();
  const dueDate = calculateDueDate(invoiceDate);
  return paymentStatus === 'pending' && today > dueDate;
};
