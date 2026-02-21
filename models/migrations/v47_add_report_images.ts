import { addColumns } from '@nozbe/watermelondb/Schema/migrations';

export const v47Migration = {
  toVersion: 47,
  steps: [
    addColumns({
      table: 'daily_reports',
      columns: [
        { name: 'images', type: 'string', isOptional: true }, // JSON array of local file paths for site overview photos
      ],
    }),
  ],
};
