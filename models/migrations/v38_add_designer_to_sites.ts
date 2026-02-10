import { addColumns } from '@nozbe/watermelondb/Schema/migrations';

/**
 * v38 Migration: Add design_engineer_id to sites
 *
 * Adds design_engineer_id field to sites table to enable
 * site-level assignment of design engineers, following the
 * same pattern as supervisor_id.
 */
export const v38Migration = {
  toVersion: 38,
  steps: [
    addColumns({
      table: 'sites',
      columns: [
        { name: 'design_engineer_id', type: 'string', isOptional: true, isIndexed: true },
      ],
    }),
  ],
};
