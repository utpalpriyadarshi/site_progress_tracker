import { COLORS } from '../../../theme/colors';
/**
 * Material Tracking Constants
 *
 * Centralized constants for Material Tracking screen
 */

// Metro Railway Material Categories (as per user requirements)
export const METRO_MATERIAL_CATEGORIES = [
  { id: 'all', name: 'All', icon: '📦', color: COLORS.INFO },
  { id: 'Civil', name: 'Civil', icon: '🏗️', color: '#795548' },
  { id: 'OCS', name: 'OCS', icon: '⚡', color: COLORS.WARNING },
  { id: 'Electrical', name: 'Electrical', icon: '🔌', color: COLORS.SUCCESS },
  { id: 'Signaling', name: 'Signaling', icon: '🚦', color: COLORS.ERROR },
  { id: 'MEP', name: 'MEP', icon: '🔧', color: COLORS.STATUS_EVALUATED },
];

// View modes for material tracking
export type ViewMode = 'requirements' | 'shortages' | 'procurement' | 'analytics';

// Status colors for different states
export const STATUS_COLORS = {
  available: COLORS.SUCCESS,
  lowStock: COLORS.WARNING,
  outOfStock: COLORS.ERROR,
  ordered: COLORS.INFO,
  inTransit: COLORS.STATUS_EVALUATED,
};

// Priority colors
export const PRIORITY_COLORS = {
  critical: COLORS.ERROR,
  high: COLORS.WARNING,
  medium: COLORS.INFO,
  low: COLORS.SUCCESS,
};
