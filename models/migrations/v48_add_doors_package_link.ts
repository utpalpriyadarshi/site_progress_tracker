import { addColumns } from '@nozbe/watermelondb/Schema/migrations';

export const v48Migration = {
  toVersion: 48,
  steps: [
    addColumns({
      table: 'design_documents',
      columns: [{ name: 'doors_package_id', type: 'string', isOptional: true }],
    }),
  ],
};
