import { COLORS } from '../../../theme/colors';
/**
 * Project status color mapping
 */
export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'active':
      return COLORS.SUCCESS;
    case 'completed':
      return COLORS.INFO;
    case 'on_hold':
      return COLORS.WARNING;
    case 'cancelled':
      return COLORS.ERROR;
    default:
      return COLORS.DISABLED;
  }
};

/**
 * Project status options
 */
export const PROJECT_STATUSES = ['active', 'completed', 'on_hold', 'cancelled'] as const;

export type ProjectStatus = typeof PROJECT_STATUSES[number];

/**
 * Default milestone definitions for new projects
 */
export const DEFAULT_MILESTONES = [
  { code: 'PM100', name: 'Requirements Management (DOORS)', weightage: 10, order: 1 },
  { code: 'PM200', name: 'Engineering & Design', weightage: 15, order: 2 },
  { code: 'PM300', name: 'Procurement', weightage: 15, order: 3 },
  { code: 'PM400', name: 'Manufacturing', weightage: 10, order: 4 },
  { code: 'PM500', name: 'Testing & Pre-commissioning', weightage: 15, order: 5 },
  { code: 'PM600', name: 'Commissioning', weightage: 20, order: 6 },
  { code: 'PM700', name: 'Handover', weightage: 15, order: 7 },
];
