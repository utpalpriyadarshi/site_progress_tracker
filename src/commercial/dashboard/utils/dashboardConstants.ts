/**
 * Dashboard Constants
 * Categories, colors, and alert configurations
 */

export const BUDGET_CATEGORIES = ['labor', 'material', 'equipment', 'other'] as const;

export const CATEGORY_LABELS: Record<string, string> = {
  labor: 'Labor',
  material: 'Materials',
  equipment: 'Equipment',
  other: 'Other',
};

export const CATEGORY_COLORS: Record<string, string> = {
  labor: '#2196F3',
  material: '#4CAF50',
  equipment: '#FF9800',
  other: '#9C27B0',
};

export const ALERT_ICONS: Record<string, string> = {
  danger: '🚨',
  warning: '⚠️',
  info: '✅',
};

export const ALERT_COLORS: Record<string, string> = {
  danger: '#ff6b6b',
  warning: '#FFA500',
  info: '#4CAF50',
};

export const OVERDUE_DAYS = 30;
export const BUDGET_WARNING_THRESHOLD = 80; // 80% utilization
export const BUDGET_EXCEEDED_THRESHOLD = 100;

export const getCategoryLabel = (category: string): string => {
  return CATEGORY_LABELS[category] || category;
};

export const getCategoryColor = (category: string): string => {
  return CATEGORY_COLORS[category] || '#757575';
};

export const getAlertIcon = (type: 'warning' | 'danger' | 'info'): string => {
  return ALERT_ICONS[type] || 'ℹ️';
};

export const getAlertColor = (type: 'warning' | 'danger' | 'info'): string => {
  return ALERT_COLORS[type] || '#666';
};
