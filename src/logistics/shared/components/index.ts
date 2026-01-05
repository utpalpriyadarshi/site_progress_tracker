/**
 * Logistics Shared Components
 *
 * Barrel export for all logistics shared components
 * Makes it easy to import components from a single source
 *
 * @example
 * import { MaterialCard, InventoryItemCard } from '@/logistics/shared/components';
 */

export { default as MaterialCard } from './MaterialCard';
export type { Material } from './MaterialCard';

export { default as InventoryItemCard } from './InventoryItemCard';
export type { InventoryItem } from './InventoryItemCard';

export { default as DeliveryScheduleCalendar } from './DeliveryScheduleCalendar';
export type { DeliverySchedule } from './DeliveryScheduleCalendar';

export { default as RfqForm } from './RfqForm';
export type { RfqFormData, Supplier, MaterialOption } from './RfqForm';

export { default as DoorsPackageSelector } from './DoorsPackageSelector';
export type {
  DoorsPackage,
  DoorsPackageType,
  DoorsPackageStatus,
} from './DoorsPackageSelector';

export { default as EquipmentCard } from './EquipmentCard';
export type { Equipment } from './EquipmentCard';
