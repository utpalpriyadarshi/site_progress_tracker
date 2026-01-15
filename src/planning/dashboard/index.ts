/**
 * Planning Dashboard Index
 *
 * Barrel export for the Planning Dashboard module
 *
 * @version 1.0.0
 * @since Planning Phase 3
 */

export { default as PlanningDashboard } from './PlanningDashboard';
export * from './widgets';
export * from './hooks';
export { dashboardReducer, initialState } from './dashboardReducer';
export type { DashboardState, DashboardAction } from './dashboardReducer';
