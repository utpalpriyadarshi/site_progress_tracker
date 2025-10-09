import { schemaMigrations, createTable } from '@nozbe/watermelondb/Schema/migrations';

export default schemaMigrations({
  migrations: [
    {
      toVersion: 9,
      steps: [
        createTable({
          name: 'site_inspections',
          columns: [
            { name: 'site_id', type: 'string', isIndexed: true },
            { name: 'inspector_id', type: 'string', isIndexed: true },
            { name: 'inspection_date', type: 'number' },
            { name: 'inspection_type', type: 'string' },
            { name: 'overall_rating', type: 'string' },
            { name: 'checklist_data', type: 'string' },
            { name: 'photos', type: 'string' },
            { name: 'safety_flagged', type: 'boolean' },
            { name: 'follow_up_date', type: 'number' },
            { name: 'follow_up_notes', type: 'string', isOptional: true },
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
