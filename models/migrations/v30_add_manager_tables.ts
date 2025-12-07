import { schemaMigrations, createTable, addColumns } from '@nozbe/watermelondb/Schema/migrations';

// v30: Add tables for Manager role - milestones, milestone_progress, purchase_orders (v2.10)
export const v30Migration = {
  toVersion: 30,
  steps: [
    // Create milestones table
    createTable({
      name: 'milestones',
      columns: [
        { name: 'project_id', type: 'string', isIndexed: true },
        { name: 'milestone_code', type: 'string', isIndexed: true }, // PM100, PM200, etc.
        { name: 'milestone_name', type: 'string' }, // "Requirements Management"
        { name: 'description', type: 'string', isOptional: true },
        { name: 'sequence_order', type: 'number' }, // 1, 2, 3...
        { name: 'weightage', type: 'number' }, // % weightage for progress calc
        { name: 'is_active', type: 'boolean' },
        { name: 'is_custom', type: 'boolean' }, // true if added by manager
        { name: 'created_by', type: 'string', isIndexed: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        { name: 'sync_status', type: 'string' },
        { name: '_version', type: 'number' },
      ],
    }),

    // Create milestone_progress table
    createTable({
      name: 'milestone_progress',
      columns: [
        { name: 'milestone_id', type: 'string', isIndexed: true },
        { name: 'site_id', type: 'string', isIndexed: true }, // site-level tracking
        { name: 'project_id', type: 'string', isIndexed: true },
        { name: 'progress_percentage', type: 'number' }, // 0-100
        { name: 'status', type: 'string' }, // not_started, in_progress, completed, on_hold
        { name: 'owner_id', type: 'string', isOptional: true }, // responsible person
        { name: 'planned_start_date', type: 'number', isOptional: true },
        { name: 'planned_end_date', type: 'number', isOptional: true },
        { name: 'actual_start_date', type: 'number', isOptional: true },
        { name: 'actual_end_date', type: 'number', isOptional: true },
        { name: 'notes', type: 'string', isOptional: true },
        { name: 'updated_by', type: 'string', isIndexed: true },
        { name: 'updated_at', type: 'number' },
        { name: 'sync_status', type: 'string' },
        { name: '_version', type: 'number' },
      ],
    }),

    // Create purchase_orders table
    createTable({
      name: 'purchase_orders',
      columns: [
        { name: 'po_number', type: 'string', isIndexed: true }, // PO-2025-001
        { name: 'rfq_id', type: 'string', isIndexed: true }, // linked RFQ
        { name: 'vendor_id', type: 'string', isIndexed: true },
        { name: 'doors_package_id', type: 'string', isOptional: true, isIndexed: true },
        { name: 'project_id', type: 'string', isIndexed: true },
        { name: 'po_date', type: 'number' },
        { name: 'po_value', type: 'number' },
        { name: 'currency', type: 'string' }, // INR, USD, EUR
        { name: 'payment_terms', type: 'string', isOptional: true },
        { name: 'delivery_terms', type: 'string', isOptional: true },
        { name: 'expected_delivery_date', type: 'number', isOptional: true },
        { name: 'actual_delivery_date', type: 'number', isOptional: true },
        { name: 'status', type: 'string', isIndexed: true }, // draft, issued, in_progress, delivered, closed, cancelled
        { name: 'items_details', type: 'string' }, // JSON array of PO line items
        { name: 'terms_conditions', type: 'string', isOptional: true },
        { name: 'notes', type: 'string', isOptional: true },
        { name: 'created_by_id', type: 'string', isIndexed: true },
        { name: 'approved_by_id', type: 'string', isOptional: true, isIndexed: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        { name: 'sync_status', type: 'string' },
        { name: '_version', type: 'number' },
      ],
    }),

    // Add milestone_id to items table for linking items to milestones
    addColumns({
      table: 'items',
      columns: [
        { name: 'milestone_id', type: 'string', isOptional: true, isIndexed: true },
      ],
    }),
  ],
};
