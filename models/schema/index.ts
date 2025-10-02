import { appSchema, tableSchema } from '@nozbe/watermelondb';

export default appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'projects',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'description', type: 'string', isOptional: true },
        { name: 'location', type: 'string' },
        { name: 'status', type: 'string' },
        { name: 'start_date', type: 'number' }, // timestamp
        { name: 'end_date', type: 'number' }, // timestamp
        { name: 'budget', type: 'number', isOptional: true },
        { name: 'manager_id', type: 'string', isOptional: true },
      ],
    }),
    tableSchema({
      name: 'tasks',
      columns: [
        { name: 'project_id', type: 'string', isIndexed: true },
        { name: 'name', type: 'string' },
        { name: 'description', type: 'string', isOptional: true },
        { name: 'status', type: 'string' },
        { name: 'priority', type: 'string' },
        { name: 'start_date', type: 'number' }, // timestamp
        { name: 'end_date', type: 'number' }, // timestamp
        { name: 'assigned_to', type: 'string', isOptional: true },
        { name: 'estimated_hours', type: 'number', isOptional: true },
      ],
    }),
    tableSchema({
      name: 'materials',
      columns: [
        { name: 'project_id', type: 'string', isIndexed: true },
        { name: 'name', type: 'string' },
        { name: 'description', type: 'string', isOptional: true },
        { name: 'category', type: 'string' },
        { name: 'unit', type: 'string' },
        { name: 'quantity_required', type: 'number' },
        { name: 'quantity_available', type: 'number' },
        { name: 'quantity_used', type: 'number' },
        { name: 'unit_cost', type: 'number' },
        { name: 'status', type: 'string' },
        { name: 'delivery_date', type: 'number' }, // timestamp
        { name: 'supplier', type: 'string', isOptional: true },
      ],
    }),
    tableSchema({
      name: 'progress_reports',
      columns: [
        { name: 'project_id', type: 'string', isIndexed: true },
        { name: 'task_id', type: 'string', isIndexed: true },
        { name: 'supervisor_id', type: 'string', isIndexed: true },
        { name: 'report_date', type: 'number' }, // timestamp
        { name: 'progress_percentage', type: 'number' },
        { name: 'work_completed', type: 'string', isOptional: true },
        { name: 'issues_identified', type: 'string', isOptional: true },
        { name: 'weather_conditions', type: 'string', isOptional: true },
        { name: 'next_day_plan', type: 'string', isOptional: true },
        { name: 'photos_count', type: 'number' },
        { name: 'status', type: 'string' },
      ],
    }),
  ],
});