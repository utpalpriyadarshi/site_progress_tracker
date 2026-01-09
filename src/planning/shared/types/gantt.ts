/**
 * Shared Gantt Chart-related types for Planning components
 */

import { ViewStyle } from 'react-native';
import ItemModel from '../../../../models/ItemModel';

/**
 * Gantt view mode
 */
export type GanttViewMode = 'day' | 'week' | 'month';

/**
 * Gantt date range
 */
export interface GanttDateRange {
  start: Date;
  end: Date;
}

/**
 * Props for GanttChartView component
 */
export interface GanttChartViewProps {
  items: ItemModel[];
  startDate: Date;
  endDate: Date;
  visibleRange: GanttDateRange;
  viewMode: GanttViewMode;
  zoomLevel: number;
  selectedItem: ItemModel | null;
  onSelectItem: (item: ItemModel | null) => void;
  onItemPress: (item: ItemModel) => void;
  showCriticalPath?: boolean;
  showMilestones?: boolean;
  showDependencies?: boolean;
  height?: number;
  style?: ViewStyle;
}

/**
 * Gantt timeline header date
 */
export interface GanttHeaderDate {
  date: Date;
  label: string;
  isToday: boolean;
}
