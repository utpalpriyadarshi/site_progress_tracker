import { AdminRole } from '../../context/AdminContext';

type RootStackParamList = {
  Auth: undefined;
  Admin: undefined;
  Supervisor: undefined;
  Manager: undefined;
  Planning: undefined;
  Logistics: undefined;
  DesignEngineer: undefined;
  CommercialManager: undefined;
};

/**
 * Map admin roles to their navigator routes
 */
export const ROLE_NAVIGATION_MAP: Record<NonNullable<AdminRole>, keyof RootStackParamList> = {
  Supervisor: 'Supervisor',
  Manager: 'Manager',
  Planner: 'Planning',
  Logistics: 'Logistics',
  DesignEngineer: 'DesignEngineer',
  CommercialManager: 'CommercialManager',
};

/**
 * Available roles for role switcher
 */
export const AVAILABLE_ROLES: Array<{ key: AdminRole; label: string }> = [
  { key: 'Supervisor', label: 'Supervisor' },
  { key: 'Manager', label: 'Manager' },
  { key: 'Planner', label: 'Planner' },
  { key: 'Logistics', label: 'Logistics' },
  { key: 'DesignEngineer', label: 'Design Engineer' },
  { key: 'CommercialManager', label: 'Commercial Manager' },
];

/**
 * Database collections to reset
 */
export const DATABASE_COLLECTIONS = [
  'users', 'roles', 'projects', 'sites', 'categories', 'items',
  'reports', 'materials', 'material_requests', 'material_deliveries',
  'suppliers', 'sessions', 'milestones', 'milestone_progress',
  'doors_packages', 'doors_requirements', 'rfqs', 'rfq_vendors',
  'rfq_vendor_quotes', 'purchase_orders', 'vendors', 'boms',
  'bom_items', 'budgets', 'costs', 'invoices'
];
