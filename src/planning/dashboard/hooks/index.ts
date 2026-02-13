/**
 * Dashboard Hooks - Barrel Export
 *
 * Central export point for all dashboard widget data hooks.
 * Each hook is defined in its own file for better organization and maintainability.
 *
 * @version 2.0.0
 * @since Planning Dashboard Phase 4
 */

// Upcoming Milestones Hook
export { useUpcomingMilestonesData } from './useUpcomingMilestonesData';

// Critical Path Hook
export { useCriticalPathData } from './useCriticalPathData';

// Schedule Overview Hook
export { useScheduleOverviewData } from './useScheduleOverviewData';

// Recent Activities Hook
export { useRecentActivitiesData } from './useRecentActivitiesData';

// Resource Utilization Hook
export { useResourceUtilizationData } from './useResourceUtilizationData';

// WBS Progress Hook
export { useWBSProgressData } from './useWBSProgressData';

// Project Progress Hook (KD-weighted rollup)
export { useProjectProgressData } from './useProjectProgressData';
export type { KDBreakdownItem } from './useProjectProgressData';

// Key Date Progress Chart Hook
export { useKDProgressChartData } from './useKDProgressChartData';
export type { KDProgressDataPoint } from './useKDProgressChartData';

// KD Timeline Progress Hook
export { useKDTimelineProgressData } from './useKDTimelineProgressData';
export type { TimelineDataPoint } from './useKDTimelineProgressData';

// Site Progress Hook
export { useSiteProgressData } from './useSiteProgressData';
export type { SiteProgressItem } from './useSiteProgressData';
