/**
 * Barrel export for all Design Engineer state management
 */

// Design RFQ Management
export {
  designRfqManagementReducer,
  createInitialState as createDesignRfqInitialState,
  type DesignRfqManagementState,
  type DesignRfqManagementAction,
  type RfqFormData,
} from './design-rfq-management';

// DOORS Package Management
export {
  doorsPackageManagementReducer,
  createInitialState as createDoorsPackageInitialState,
  type DoorsPackageManagementState,
  type DoorsPackageManagementAction,
  type PackageFormData,
} from './doors-package-management';

// Design Engineer Dashboard
export {
  designEngineerDashboardReducer,
  createInitialState as createDashboardInitialState,
  type DesignEngineerDashboardState,
  type DesignEngineerDashboardAction,
} from './design-engineer-dashboard';
