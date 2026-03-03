import { addColumns } from '@nozbe/watermelondb/Schema/migrations';

/**
 * v51: Add due_date to invoices table
 *
 * Replaces the hardcoded 30-day overdue calculation with an explicit due date
 * stored per invoice, allowing per-vendor payment terms to be modelled correctly.
 * Existing records without a due_date fall back to the legacy 30-day calculation.
 */
export const v51Migration = {
  toVersion: 51,
  steps: [
    addColumns({
      table: 'invoices',
      columns: [
        { name: 'due_date', type: 'number', isOptional: true },
      ],
    }),
  ],
};
