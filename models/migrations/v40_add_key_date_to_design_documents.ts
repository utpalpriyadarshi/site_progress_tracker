import { addColumns } from '@nozbe/watermelondb/Schema/migrations';

/**
 * v40 Migration: Add key_date_id to design_documents
 *
 * Enables linking design documents to Key Dates so that design progress
 * can contribute to Key Date progress tracking, alongside item progress.
 * This allows both Supervisors (via Items) and Design Engineers (via Documents)
 * to update the same Key Dates.
 */
export const v40Migration = {
  toVersion: 40,
  steps: [
    addColumns({
      table: 'design_documents',
      columns: [
        { name: 'key_date_id', type: 'string', isOptional: true, isIndexed: true },
      ],
    }),
  ],
};
