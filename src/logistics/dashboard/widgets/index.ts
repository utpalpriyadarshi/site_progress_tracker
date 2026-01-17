/**
 * Dashboard Widgets
 *
 * Exports all widget components for the logistics dashboard.
 *
 * @version 1.0.0
 * @since Logistics Phase 3
 */

export { BaseWidget } from './BaseWidget';
export { StatusBadge } from './StatusBadge';
export { InventoryStatusWidget } from './InventoryStatusWidget';
export { DeliveryStatusWidget } from './DeliveryStatusWidget';
export { PurchaseOrderWidget } from './PurchaseOrderWidget';
export { MaterialRequirementsWidget } from './MaterialRequirementsWidget';
export { DoorsPackageWidget } from './DoorsPackageWidget';
export { RfqStatusWidget } from './RfqStatusWidget';
export { RecentActivityWidget } from './RecentActivityWidget';

// Type exports
export type { BaseWidgetProps } from './BaseWidget';
export type { StatusBadgeProps, StatusType } from './StatusBadge';
