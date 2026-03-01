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
 * Must match schema/index.ts table names exactly
 */
export const DATABASE_COLLECTIONS = [
  // Core tables
  'users', 'roles', 'sessions', 'password_history',
  'projects', 'sites', 'categories', 'items',
  // Progress tracking
  'progress_logs', 'hindrances', 'materials',
  'daily_reports', 'site_inspections',
  // Planning
  'schedule_revisions', 'template_modules', 'interface_points',
  'sync_queue',
  // Teams & Resources
  'teams', 'team_members', 'resource_requests',
  // BOMs
  'boms', 'bom_items',
  // DOORS & RFQs
  'doors_packages', 'doors_requirements',
  'vendors', 'rfqs', 'rfq_vendor_quotes', 'purchase_orders',
  // Milestones
  'milestones', 'milestone_progress',
  // Commercial
  'budgets', 'costs', 'invoices',
  // Key Dates (Phase 5a)
  'key_dates', 'key_date_sites',
  // Design Documents (v36)
  'design_document_categories', 'design_documents',
  // Domains (v44)
  'domains',
  // DOORS Revisions (v46)
  'doors_revisions',
  // Change Orders (v49)
  'change_orders',
];
