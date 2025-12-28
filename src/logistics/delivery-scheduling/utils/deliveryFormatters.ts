/**
 * Delivery Scheduling Formatters
 *
 * Formatting utilities for delivery data
 */

import { DeliveryStatus, DeliveryPriority } from '../../../services/DeliverySchedulingService';
import { STATUS_COLORS, PRIORITY_COLORS } from './deliveryConstants';

/**
 * Format date to readable string
 */
export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-IN', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

/**
 * Format time to readable string
 */
export const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Get color for delivery status
 */
export const getStatusColor = (status: DeliveryStatus): string => {
  return STATUS_COLORS[status] || '#9ca3af';
};

/**
 * Get color for delivery priority
 */
export const getPriorityColor = (priority: DeliveryPriority): string => {
  return PRIORITY_COLORS[priority] || '#9ca3af';
};
