import { createTable, addColumns } from '@nozbe/watermelondb/Schema/migrations';

/**
 * v31: Add tables and columns for Multi-Role Implementation (v2.11)
 *
 * New Roles:
 * - Design Engineer: DOORS packages management, Design RFQs
 * - Commercial Manager: Budget, Costs, Invoices
 *
 * Enhanced Roles:
 * - Logistics: Purchase Orders (already exists from v30)
 * - Planning: Site dates, Milestone planned dates (uses milestone_progress)
 *
 * Changes:
 * - NEW: budgets table (project-level financial planning)
 * - NEW: costs table (project-level cost tracking)
 * - NEW: invoices table (invoice management)
 * - ADD: rfqs.rfq_type column (distinguish 'design' vs 'procurement')
 * - ADD: sites date columns (planned_start_date, planned_end_date, actual_start_date, actual_end_date)
 */

export const v31Migration = {
  toVersion: 31,
  steps: [
    // ========================================
    // NEW TABLES FOR COMMERCIAL MANAGER ROLE
    // ========================================

    // Create budgets table (project-level only, no site breakdown)
    createTable({
      name: 'budgets',
      columns: [
        { name: 'project_id', type: 'string', isIndexed: true },
        { name: 'category', type: 'string', isIndexed: true }, // 'material' | 'labor' | 'equipment' | 'other'
        { name: 'allocated_amount', type: 'number' },
        { name: 'description', type: 'string' },
        { name: 'created_by', type: 'string', isIndexed: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        { name: 'sync_status', type: 'string' },
        { name: '_version', type: 'number' },
      ],
    }),

    // Create costs table (project-level only, no site breakdown)
    createTable({
      name: 'costs',
      columns: [
        { name: 'project_id', type: 'string', isIndexed: true },
        { name: 'po_id', type: 'string', isOptional: true, isIndexed: true }, // link to purchase_orders
        { name: 'category', type: 'string', isIndexed: true }, // 'material' | 'labor' | 'equipment' | 'other'
        { name: 'amount', type: 'number' },
        { name: 'description', type: 'string' },
        { name: 'cost_date', type: 'number' }, // when cost was incurred
        { name: 'created_by', type: 'string', isIndexed: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        { name: 'sync_status', type: 'string' },
        { name: '_version', type: 'number' },
      ],
    }),

    // Create invoices table
    createTable({
      name: 'invoices',
      columns: [
        { name: 'project_id', type: 'string', isIndexed: true },
        { name: 'po_id', type: 'string', isIndexed: true }, // required - linked to purchase_orders
        { name: 'invoice_number', type: 'string', isIndexed: true },
        { name: 'invoice_date', type: 'number' },
        { name: 'amount', type: 'number' },
        { name: 'payment_status', type: 'string', isIndexed: true }, // 'pending' | 'paid'
        { name: 'payment_date', type: 'number', isOptional: true },
        { name: 'vendor_id', type: 'string', isIndexed: true },
        { name: 'created_by', type: 'string', isIndexed: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        { name: 'sync_status', type: 'string' },
        { name: '_version', type: 'number' },
      ],
    }),

    // ========================================
    // ENHANCEMENTS FOR EXISTING TABLES
    // ========================================

    // Add rfq_type to rfqs table (Design Engineer vs Logistics distinction)
    addColumns({
      table: 'rfqs',
      columns: [
        { name: 'rfq_type', type: 'string', isIndexed: true }, // 'design' | 'procurement'
      ],
    }),

    // Add date fields to sites table (Planning Engineer role)
    addColumns({
      table: 'sites',
      columns: [
        { name: 'planned_start_date', type: 'number', isOptional: true },
        { name: 'planned_end_date', type: 'number', isOptional: true },
        { name: 'actual_start_date', type: 'number', isOptional: true },
        { name: 'actual_end_date', type: 'number', isOptional: true },
      ],
    }),

    // NOTE: milestone_progress table already has planned_start_date and planned_end_date (v30)
    // NOTE: items table already has is_critical_path field (line 68 of schema)
    // No additional columns needed for milestones or items tables
  ],
};
