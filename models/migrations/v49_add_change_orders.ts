import { createTable } from '@nozbe/watermelondb/Schema/migrations';

export const v49Migration = {
  toVersion: 49,
  steps: [
    createTable({
      name: 'change_orders',
      columns: [
        { name: 'project_id', type: 'string', isIndexed: true },
        { name: 'title', type: 'string' },
        { name: 'description', type: 'string', isOptional: true },
        { name: 'impact_cost', type: 'number' },
        { name: 'impact_days', type: 'number' },
        { name: 'status', type: 'string', isIndexed: true }, // draft | submitted | approved | rejected
        { name: 'submitted_by_id', type: 'string', isOptional: true },
        { name: 'approved_by_id', type: 'string', isOptional: true },
        { name: 'submitted_at', type: 'number', isOptional: true },
        { name: 'approved_at', type: 'number', isOptional: true },
        { name: 'created_by', type: 'string', isIndexed: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        { name: 'sync_status', type: 'string' },
        { name: '_version', type: 'number' },
      ],
    }),
  ],
};
