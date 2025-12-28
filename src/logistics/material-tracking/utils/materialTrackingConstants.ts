/**
 * Material Tracking Constants
 *
 * Centralized constants for Material Tracking screen
 */

// Metro Railway Material Categories (as per user requirements)
export const METRO_MATERIAL_CATEGORIES = [
  { id: 'all', name: 'All', icon: '📦', color: '#2196F3' },
  { id: 'Civil', name: 'Civil', icon: '🏗️', color: '#795548' },
  { id: 'OCS', name: 'OCS', icon: '⚡', color: '#FF9800' },
  { id: 'Electrical', name: 'Electrical', icon: '🔌', color: '#4CAF50' },
  { id: 'Signaling', name: 'Signaling', icon: '🚦', color: '#F44336' },
  { id: 'MEP', name: 'MEP', icon: '🔧', color: '#9C27B0' },
];

// View modes for material tracking
export type ViewMode = 'requirements' | 'shortages' | 'procurement' | 'analytics';

// Status colors for different states
export const STATUS_COLORS = {
  available: '#4CAF50',
  lowStock: '#FF9800',
  outOfStock: '#F44336',
  ordered: '#2196F3',
  inTransit: '#9C27B0',
};

// Priority colors
export const PRIORITY_COLORS = {
  critical: '#F44336',
  high: '#FF9800',
  medium: '#2196F3',
  low: '#4CAF50',
};
