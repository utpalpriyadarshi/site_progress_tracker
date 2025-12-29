/**
 * Calculation utilities for Gantt Chart
 */

import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import ItemModel from '../../../../models/ItemModel';
import { ZoomLevel, COLUMN_WIDTHS, TIMELINE_PADDING, MIN_BAR_WIDTH } from './ganttConstants';

dayjs.extend(isBetween);
dayjs.extend(weekOfYear);

/**
 * Timeline column definition
 */
export interface TimelineColumn {
  date: dayjs.Dayjs;
  label: string;
  isWeekend?: boolean;
}

/**
 * Timeline bounds
 */
export interface TimelineBounds {
  start: dayjs.Dayjs;
  end: dayjs.Dayjs;
}

/**
 * Task bar layout
 */
export interface TaskBarLayout {
  left: number;
  width: number;
}

/**
 * Calculate timeline boundaries based on items
 */
export const calculateTimelineBounds = (items: ItemModel[]): TimelineBounds => {
  if (items.length === 0) {
    const today = dayjs();
    return {
      start: today.subtract(7, 'day').startOf('day'),
      end: today.add(30, 'day').endOf('day'),
    };
  }

  const dates = items.flatMap(item => [
    item.plannedStartDate,
    item.plannedEndDate,
  ]);

  const minDate = Math.min(...dates);
  const maxDate = Math.max(...dates);

  // Add padding
  const start = dayjs(minDate).subtract(TIMELINE_PADDING.start, 'day').startOf('day');
  const end = dayjs(maxDate).add(TIMELINE_PADDING.end, 'day').endOf('day');

  return { start, end };
};

/**
 * Generate timeline columns based on zoom level
 */
export const generateTimelineColumns = (
  timelineStart: dayjs.Dayjs,
  timelineEnd: dayjs.Dayjs,
  zoomLevel: ZoomLevel
): TimelineColumn[] => {
  const columns: TimelineColumn[] = [];
  let current = timelineStart;

  while (current.isBefore(timelineEnd) || current.isSame(timelineEnd)) {
    if (zoomLevel === 'day') {
      columns.push({
        date: current,
        label: current.format('MMM DD'),
        isWeekend: current.day() === 0 || current.day() === 6,
      });
      current = current.add(1, 'day');
    } else if (zoomLevel === 'week') {
      columns.push({
        date: current,
        label: `W${current.week()}`,
      });
      current = current.add(1, 'week');
    } else {
      columns.push({
        date: current,
        label: current.format('MMM YYYY'),
      });
      current = current.add(1, 'month');
    }
  }

  return columns;
};

/**
 * Calculate task bar position and width
 */
export const calculateTaskBarLayout = (
  item: ItemModel,
  timelineStart: dayjs.Dayjs,
  zoomLevel: ZoomLevel
): TaskBarLayout => {
  const itemStart = dayjs(item.plannedStartDate);
  const itemEnd = dayjs(item.plannedEndDate);
  const columnWidth = COLUMN_WIDTHS[zoomLevel];

  // Calculate position from timeline start
  let left = 0;
  if (zoomLevel === 'day') {
    left = itemStart.diff(timelineStart, 'day') * columnWidth;
  } else if (zoomLevel === 'week') {
    left = itemStart.diff(timelineStart, 'week', true) * columnWidth;
  } else {
    left = itemStart.diff(timelineStart, 'month', true) * columnWidth;
  }

  // Calculate width based on duration
  let width = 0;
  if (zoomLevel === 'day') {
    width = itemEnd.diff(itemStart, 'day') * columnWidth;
  } else if (zoomLevel === 'week') {
    width = itemEnd.diff(itemStart, 'week', true) * columnWidth;
  } else {
    width = itemEnd.diff(itemStart, 'month', true) * columnWidth;
  }

  // Minimum width for visibility
  width = Math.max(width, MIN_BAR_WIDTH);

  return { left, width };
};

/**
 * Calculate today marker position
 */
export const calculateTodayPosition = (
  timelineStart: dayjs.Dayjs,
  timelineEnd: dayjs.Dayjs,
  zoomLevel: ZoomLevel
): number | null => {
  const today = dayjs();
  if (today.isBefore(timelineStart) || today.isAfter(timelineEnd)) {
    return null;
  }

  const columnWidth = COLUMN_WIDTHS[zoomLevel];

  if (zoomLevel === 'day') {
    return today.diff(timelineStart, 'day') * columnWidth;
  } else if (zoomLevel === 'week') {
    return today.diff(timelineStart, 'week', true) * columnWidth;
  } else {
    return today.diff(timelineStart, 'month', true) * columnWidth;
  }
};
