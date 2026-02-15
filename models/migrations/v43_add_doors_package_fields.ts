import { addColumns } from '@nozbe/watermelondb/Schema/migrations';

/**
 * v43 Migration: Add missing fields to doors_packages
 *
 * The Design Engineer screens reference site_id, material_type, engineer_id,
 * received_date, and reviewed_date columns that were never added to the schema.
 * This migration adds them so site-based filtering and status tracking work correctly.
 */
export const v43Migration = {
  toVersion: 43,
  steps: [
    addColumns({
      table: 'doors_packages',
      columns: [
        { name: 'site_id', type: 'string', isOptional: true, isIndexed: true },
        { name: 'material_type', type: 'string', isOptional: true },
        { name: 'engineer_id', type: 'string', isOptional: true, isIndexed: true },
        { name: 'received_date', type: 'number', isOptional: true },
        { name: 'reviewed_date', type: 'number', isOptional: true },
      ],
    }),
  ],
};
