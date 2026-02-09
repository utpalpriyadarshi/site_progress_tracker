/**
 * Dashboard Widgets Index
 *
 * Barrel export for all dashboard widget components
 *
 * @version 1.0.0
 * @since Planning Phase 3
 */

export { BaseWidget } from './BaseWidget';
export type { BaseWidgetProps } from './BaseWidget';

export { UpcomingMilestonesWidget } from './UpcomingMilestonesWidget';
export type { Milestone, UpcomingMilestonesWidgetProps } from './UpcomingMilestonesWidget';

export { CriticalPathWidget } from './CriticalPathWidget';
export type { CriticalPathItem, CriticalPathWidgetProps } from './CriticalPathWidget';

export { ScheduleOverviewWidget } from './ScheduleOverviewWidget';
export type { ScheduleOverview, ScheduleOverviewWidgetProps } from './ScheduleOverviewWidget';

export { RecentActivitiesWidget } from './RecentActivitiesWidget';
export type { Activity, ActivityType, RecentActivitiesWidgetProps } from './RecentActivitiesWidget';

export { ResourceUtilizationWidget } from './ResourceUtilizationWidget';
export type { Resource, ResourceSummary, ResourceUtilizationWidgetProps } from './ResourceUtilizationWidget';

export { WBSProgressWidget } from './WBSProgressWidget';
export type { WBSPhase, WBSSummary, WBSProgressWidgetProps } from './WBSProgressWidget';

export { ProjectProgressWidget } from './ProjectProgressWidget';
export type { ProjectProgressWidgetProps } from './ProjectProgressWidget';

export { KeyDateProgressChartWidget } from './KeyDateProgressChartWidget';
export type { KDProgressDataPoint, KeyDateProgressChartWidgetProps } from './KeyDateProgressChartWidget';

export { KDTimelineProgressWidget } from './KDTimelineProgressWidget';
export type { KDTimelineProgressWidgetProps } from './KDTimelineProgressWidget';
