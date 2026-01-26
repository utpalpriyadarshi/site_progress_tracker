import { createTable, addColumns } from '@nozbe/watermelondb/Schema/migrations';

/**
 * v35 Migration: Add Key Dates tables
 *
 * Phase 5a - Planning Key Dates Architecture
 * Based on CMRL Contract Key Dates structure
 *
 * Tables added:
 * - key_dates: Contract key dates / milestones with delay damages
 * - key_date_sites: Junction table for key date to site mapping
 *
 * Columns added:
 * - items.key_date_id: Link work items to key dates
 */
export const v35Migration = {
  toVersion: 35,
  steps: [
    // Create key_dates table
    createTable({
      name: 'key_dates',
      columns: [
        // Key Date identification
        { name: 'code', type: 'string', isIndexed: true },
        { name: 'category', type: 'string', isIndexed: true },
        { name: 'category_name', type: 'string' },
        { name: 'description', type: 'string' },
        // Schedule
        { name: 'target_days', type: 'number' },
        { name: 'target_date', type: 'number', isOptional: true },
        { name: 'actual_date', type: 'number', isOptional: true },
        // Status tracking
        { name: 'status', type: 'string', isIndexed: true },
        { name: 'progress_percentage', type: 'number' },
        // Delay damages
        { name: 'delay_damages_initial', type: 'number' },
        { name: 'delay_damages_extended', type: 'number' },
        { name: 'delay_damages_special', type: 'string', isOptional: true },
        // Relationships
        { name: 'project_id', type: 'string', isIndexed: true },
        // Sequence
        { name: 'sequence_order', type: 'number' },
        // Dependencies
        { name: 'dependencies', type: 'string', isOptional: true },
        // Audit
        { name: 'created_by', type: 'string', isIndexed: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        // Sync
        { name: 'sync_status', type: 'string' },
        { name: '_version', type: 'number' },
      ],
    }),
    // Create key_date_sites junction table
    createTable({
      name: 'key_date_sites',
      columns: [
        // Foreign keys
        { name: 'key_date_id', type: 'string', isIndexed: true },
        { name: 'site_id', type: 'string', isIndexed: true },
        // Contribution tracking
        { name: 'contribution_percentage', type: 'number' },
        { name: 'progress_percentage', type: 'number' },
        // Status
        { name: 'status', type: 'string' },
        // Schedule
        { name: 'planned_start_date', type: 'number', isOptional: true },
        { name: 'planned_end_date', type: 'number', isOptional: true },
        { name: 'actual_start_date', type: 'number', isOptional: true },
        { name: 'actual_end_date', type: 'number', isOptional: true },
        // Notes
        { name: 'notes', type: 'string', isOptional: true },
        // Audit
        { name: 'updated_by', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        // Sync
        { name: 'sync_status', type: 'string' },
        { name: '_version', type: 'number' },
      ],
    }),
    // Add key_date_id to items table
    addColumns({
      table: 'items',
      columns: [
        { name: 'key_date_id', type: 'string', isOptional: true, isIndexed: true },
      ],
    }),
  ],
};
