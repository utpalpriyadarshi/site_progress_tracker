/**
 * Logistics Dashboard
 *
 * Main export file for the logistics dashboard module.
 *
 * @version 1.0.0
 * @since Logistics Phase 3
 */

export { LogisticsDashboard } from './LogisticsDashboard';
export { dashboardReducer, initialDashboardState } from './dashboardReducer';

// Widget exports
export {
  BaseWidget,
  StatusBadge,
  InventoryStatusWidget,
  DeliveryStatusWidget,
  PurchaseOrderWidget,
  MaterialRequirementsWidget,
  DoorsPackageWidget,
  RfqStatusWidget,
  RecentActivityWidget,
} from './widgets';

// Hook exports
export {
  useInventoryStatusData,
  useDeliveryStatusData,
  usePurchaseOrderData,
  useMaterialRequirementsData,
  useDoorsPackageData,
  useRfqStatusData,
  useRecentActivityData,
} from './hooks';

// Type exports
export type { DashboardState, DashboardAction } from './dashboardReducer';
export type { BaseWidgetProps, StatusBadgeProps, StatusType } from './widgets';
export type {
  InventoryStatusData,
  DeliveryStatusData,
  DeliveryItem,
  PurchaseOrderData,
  PurchaseOrderSummary,
  MaterialRequirementsData,
  MaterialRequirement,
  DoorsPackageData,
  DoorsPackageSummary,
  RfqStatusData,
  RfqSummary,
  RecentActivityData,
  ActivityItem,
  ActivityType,
} from './hooks';
