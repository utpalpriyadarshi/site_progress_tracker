import { addColumns } from '@nozbe/watermelondb/Schema/migrations';

/**
 * v41 Migration: Add design_weightage to key_dates
 *
 * Enables dual-track progress calculation for Key Dates:
 * - Site progress (from supervisor items)
 * - Design progress (from design documents)
 * - Combined using designWeightage as the % allocated to design docs
 */
export const v41Migration = {
  toVersion: 41,
  steps: [
    addColumns({
      table: 'key_dates',
      columns: [
        { name: 'design_weightage', type: 'number', isOptional: true },
      ],
    }),
  ],
};
