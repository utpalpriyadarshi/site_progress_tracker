/**
 * Manager Dashboard Hooks
 *
 * Exports all data fetching hooks for Manager dashboard widgets.
 *
 * @version 1.0.0
 * @since Manager Phase 3
 */

export { useKPIData } from './useKPIData';
export type { KPIData, UseKPIDataResult } from './useKPIData';

export { useEngineeringData } from './useEngineeringData';
export type { EngineeringData, UseEngineeringDataResult } from './useEngineeringData';

export { useSiteProgressData } from './useSiteProgressData';
export type { SiteProgressItem, UseSiteProgressDataResult } from './useSiteProgressData';

export { useEquipmentMaterialsData } from './useEquipmentMaterialsData';
export type { EquipmentMaterialsData, UseEquipmentMaterialsDataResult } from './useEquipmentMaterialsData';

export { useFinancialData } from './useFinancialData';
export type { FinancialData, UseFinancialDataResult } from './useFinancialData';

export { useTestingData } from './useTestingData';
export type { TestingData, UseTestingDataResult } from './useTestingData';

export { useHandoverData } from './useHandoverData';
export type { HandoverData, UseHandoverDataResult } from './useHandoverData';
