/**
 * Dashboard Hooks
 *
 * Exports all data hooks for logistics dashboard widgets.
 *
 * @version 1.0.0
 * @since Logistics Phase 3
 */

export { useInventoryStatusData } from './useInventoryStatusData';
export { useDeliveryStatusData } from './useDeliveryStatusData';
export { usePurchaseOrderData } from './usePurchaseOrderData';
export { useMaterialRequirementsData } from './useMaterialRequirementsData';
export { useDoorsPackageData } from './useDoorsPackageData';
export { useRfqStatusData } from './useRfqStatusData';
export { useRecentActivityData } from './useRecentActivityData';

// Type exports
export type { InventoryStatusData, UseInventoryStatusResult } from './useInventoryStatusData';
export type { DeliveryStatusData, DeliveryItem, UseDeliveryStatusResult } from './useDeliveryStatusData';
export type { PurchaseOrderData, PurchaseOrderSummary, UsePurchaseOrderResult } from './usePurchaseOrderData';
export type { MaterialRequirementsData, MaterialRequirement, UseMaterialRequirementsResult } from './useMaterialRequirementsData';
export type { DoorsPackageData, DoorsPackageSummary, UseDoorsPackageResult } from './useDoorsPackageData';
export type { RfqStatusData, RfqSummary, UseRfqStatusResult } from './useRfqStatusData';
export type { RecentActivityData, ActivityItem, ActivityType, UseRecentActivityResult } from './useRecentActivityData';
