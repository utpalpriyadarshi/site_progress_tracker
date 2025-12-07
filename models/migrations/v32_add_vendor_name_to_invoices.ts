import { addColumns } from '@nozbe/watermelondb/Schema/migrations';

/**
 * v32: Add vendor_name column to invoices table (v2.11 fix)
 *
 * Change:
 * - ADD: invoices.vendor_name column (optional string)
 *   Allows manual entry of vendor names without requiring vendor records
 *   This simplifies invoice creation workflow and removes vendor table dependency
 */

export const v32Migration = {
  toVersion: 32,
  steps: [
    // Add vendor_name column to invoices table
    addColumns({
      table: 'invoices',
      columns: [
        { name: 'vendor_name', type: 'string', isOptional: true },
      ],
    }),
  ],
};
