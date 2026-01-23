/**
 * Admin Dashboard Widgets
 *
 * Barrel export for all admin dashboard widget components.
 */

export { BaseWidget } from './BaseWidget';
export type { BaseWidgetProps } from './BaseWidget';

export { SystemHealthWidget } from './SystemHealthWidget';
export type { SystemHealthWidgetProps, HealthStatus } from './SystemHealthWidget';

export { UserActivityWidget } from './UserActivityWidget';
export type { UserActivityWidgetProps, UserActivityData, RoleDistribution } from './UserActivityWidget';

export { SyncStatusWidget } from './SyncStatusWidget';
export type { SyncStatusWidgetProps, SyncStatusData } from './SyncStatusWidget';

export { QuickStatsWidget } from './QuickStatsWidget';
export type { QuickStatsWidgetProps, QuickStatsData } from './QuickStatsWidget';
