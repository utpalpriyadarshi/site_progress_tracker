import { addColumns } from '@nozbe/watermelondb/Schema/migrations';

/**
 * v37 Migration: Add weightage to key_dates
 *
 * Adds a weightage field so project progress can be computed as
 * a weighted average of key date progress values.
 */
export const v37Migration = {
  toVersion: 37,
  steps: [
    addColumns({
      table: 'key_dates',
      columns: [
        { name: 'weightage', type: 'number', isOptional: true },
      ],
    }),
  ],
};
