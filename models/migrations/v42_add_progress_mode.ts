import { addColumns } from '@nozbe/watermelondb/Schema/migrations';

/**
 * v42 Migration: Add progress_mode to key_dates
 *
 * Enables project-level Key Dates that don't calculate progress from sites/docs:
 * - 'auto' (default/null): calculated from sites + design docs (existing behavior)
 * - 'manual': planner sets a percentage (0-100%) directly
 * - 'binary': done/not done toggle (0% or 100%)
 */
export const v42Migration = {
  toVersion: 42,
  steps: [
    addColumns({
      table: 'key_dates',
      columns: [
        { name: 'progress_mode', type: 'string', isOptional: true },
      ],
    }),
  ],
};
