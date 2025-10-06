import { schemaMigrations, createTable } from '@nozbe/watermelondb/Schema/migrations';

export default schemaMigrations({
  migrations: [
    {
      toVersion: 6,
      steps: [
        createTable({
          name: 'daily_reports',
          columns: [
            { name: 'site_id', type: 'string', isIndexed: true },
            { name: 'supervisor_id', type: 'string', isIndexed: true },
            { name: 'report_date', type: 'number' },
            { name: 'submitted_at', type: 'number' },
            { name: 'total_items', type: 'number' },
            { name: 'total_progress', type: 'number' },
            { name: 'pdf_path', type: 'string', isOptional: true },
            { name: 'notes', type: 'string', isOptional: true },
            { name: 'sync_status', type: 'string' },
            { name: 'created_at', type: 'number' },
            { name: 'updated_at', type: 'number' },
          ],
        }),
      ],
    },
  ],
});
