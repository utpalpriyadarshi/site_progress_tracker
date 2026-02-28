/**
 * Hook for managing Gantt chart timeline calculations
 */

import { useMemo } from 'react';
import ItemModel from '../../../../models/ItemModel';
import {
  ZoomLevel,
  COLUMN_WIDTHS,
} from '../utils/ganttConstants';
import {
  calculateTimelineBounds,
  generateTimelineColumns,
  calculateTodayPosition,
  TimelineColumn,
  TimelineBounds,
} from '../utils/ganttCalculations';

export interface UseGanttTimelineReturn {
  timelineBounds: TimelineBounds;
  timelineColumns: TimelineColumn[];
  columnWidth: number;
  totalTimelineWidth: number;
  todayPosition: number | null;
}

/**
 * Custom hook for timeline calculations and rendering.
 * Pass `externalBounds` to skip the items-based bounds calculation
 * (used by the Key Dates tab which has its own date range).
 */
export const useGanttTimeline = (
  items: ItemModel[],
  zoomLevel: ZoomLevel,
  externalBounds?: TimelineBounds
): UseGanttTimelineReturn => {
  const timelineBounds = useMemo(
    () => externalBounds ?? calculateTimelineBounds(items),
    [items, externalBounds]
  );

  const timelineColumns = useMemo(
    () => generateTimelineColumns(
      timelineBounds.start,
      timelineBounds.end,
      zoomLevel
    ),
    [timelineBounds.start, timelineBounds.end, zoomLevel]
  );

  const columnWidth = useMemo(
    () => COLUMN_WIDTHS[zoomLevel],
    [zoomLevel]
  );

  const totalTimelineWidth = useMemo(
    () => timelineColumns.length * columnWidth,
    [timelineColumns.length, columnWidth]
  );

  const todayPosition = useMemo(
    () => calculateTodayPosition(
      timelineBounds.start,
      timelineBounds.end,
      zoomLevel
    ),
    [timelineBounds.start, timelineBounds.end, zoomLevel]
  );

  return {
    timelineBounds,
    timelineColumns,
    columnWidth,
    totalTimelineWidth,
    todayPosition,
  };
};
