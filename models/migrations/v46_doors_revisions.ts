import { createTable } from '@nozbe/watermelondb/Schema/migrations';

/**
 * v46 Migration: Add doors_revisions table for DOORS package revision history
 */
export const v46Migration = {
  toVersion: 46,
  steps: [
    createTable({
      name: 'doors_revisions',
      columns: [
        { name: 'doors_package_id', type: 'string' as const, isIndexed: true },
        { name: 'version_number', type: 'number' as const },
        { name: 'snapshot_json', type: 'string' as const },
        { name: 'changed_by_id', type: 'string' as const, isIndexed: true },
        { name: 'changed_at', type: 'number' as const, isIndexed: true },
        { name: 'change_summary', type: 'string' as const },
      ],
    }),
  ],
};
