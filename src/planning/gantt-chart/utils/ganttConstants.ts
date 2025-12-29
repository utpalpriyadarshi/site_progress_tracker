/**
 * Constants and types for Gantt Chart
 */

import { Dimensions } from 'react-native';

// Types
export type ZoomLevel = 'day' | 'week' | 'month';

// Layout Constants
export const SCREEN_WIDTH = Dimensions.get('window').width;
export const TASK_HEIGHT = 60;
export const TIMELINE_HEIGHT = 50;
export const LEFT_COLUMN_WIDTH = 200;

// Zoom Level Settings
export const COLUMN_WIDTHS: Record<ZoomLevel, number> = {
  day: 60,
  week: 80,
  month: 120,
};

// Colors
export const GANTT_COLORS = {
  progress: '#4CAF50',
  critical: '#d32f2f',
  today: '#2196F3',
  weekendBg: '#f0f0f0',
  headerBg: '#e0e0e0',
  borderColor: '#999',
  lightBorder: '#ccc',
  emptyBorder: '#e0e0e0',
} as const;

// Padding
export const TIMELINE_PADDING = {
  start: 3, // days
  end: 3, // days
} as const;

// Minimum Dimensions
export const MIN_BAR_WIDTH = 20; // pixels
