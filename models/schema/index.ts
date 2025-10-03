import { appSchema, tableSchema } from '@nozbe/watermelondb';

export default appSchema({
  version: 2, // Incremented version to reflect schema changes
  tables: [
    tableSchema({
      name: 'sites',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'address', type: 'string' },
        { name: 'city', type: 'string' },
        { name: 'state', type: 'string' },
        { name: 'country', type: 'string' },
        { name: 'postal_code', type: 'string' },
        { name: 'status', type: 'string' },
        { name: 'start_date', type: 'number' }, // timestamp
        { name: 'end_date', type: 'number' }, // timestamp
        { name: 'manager_id', type: 'string', isOptional: true },
        { name: 'supervisor_id', type: 'string', isOptional: true },
        { name: 'description', type: 'string', isOptional: true },
      ],
    }),
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
        { name: 'site_id', type: 'string', isIndexed: true }, // Link to site
      ],
    }),
    tableSchema({
      name: 'categories',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'description', type: 'string', isOptional: true },
        { name: 'type', type: 'string' }, // 'material', 'item', 'equipment', etc.
        { name: 'parent_category_id', type: 'string', isIndexed: true }, // For hierarchical categories
        { name: 'is_active', type: 'boolean' },
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
        { name: 'category_id', type: 'string', isIndexed: true }, // Link to category
        { name: 'name', type: 'string' },
        { name: 'description', type: 'string', isOptional: true },
        { name: 'category', type: 'string' }, // Keeping existing field for compatibility
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
      name: 'items',
      columns: [
        { name: 'category_id', type: 'string', isIndexed: true },
        { name: 'project_id', type: 'string', isIndexed: true },
        { name: 'site_id', type: 'string', isIndexed: true },
        { name: 'name', type: 'string' },
        { name: 'description', type: 'string', isOptional: true },
        { name: 'item_code', type: 'string' },
        { name: 'unit', type: 'string' },
        { name: 'quantity_available', type: 'number' },
        { name: 'quantity_reserved', type: 'number' },
        { name: 'quantity_used', type: 'number' },
        { name: 'unit_cost', type: 'number' },
        { name: 'status', type: 'string' },
        { name: 'supplier', type: 'string', isOptional: true },
        { name: 'delivery_date', type: 'number' }, // timestamp
        { name: 'location', type: 'string' },
      ],
    }),
    tableSchema({
      name: 'progress_reports',
      columns: [
        { name: 'project_id', type: 'string', isIndexed: true },
        { name: 'task_id', type: 'string', isIndexed: true },
        { name: 'supervisor_id', type: 'string', isIndexed: true },
        { name: 'report_id', type: 'string', isIndexed: true }, // Link to report if needed
        { name: 'report_date', type: 'number' }, // timestamp
        { name: 'progress_percentage', type: 'number' },
        { name: 'work_completed', type: 'string', isOptional: true },
        { name: 'issues_identified', type: 'string', isOptional: true },
        { name: 'weather_conditions', type: 'string', isOptional: true },
        { name: 'next_day_plan', type: 'string', isOptional: true },
        { name: 'photos_count', type: 'number' },
        { name: 'status', type: 'string' },
        { name: 'summary', type: 'string', isOptional: true },
      ],
    }),
    tableSchema({
      name: 'progress_logs',
      columns: [
        { name: 'project_id', type: 'string', isIndexed: true },
        { name: 'task_id', type: 'string', isIndexed: true },
        { name: 'site_id', type: 'string', isIndexed: true },
        { name: 'supervisor_id', type: 'string', isIndexed: true },
        { name: 'log_date', type: 'number' }, // timestamp
        { name: 'progress_percentage', type: 'number' },
        { name: 'work_completed', type: 'string', isOptional: true },
        { name: 'work_planned', type: 'string', isOptional: true },
        { name: 'actual_vs_planned', type: 'string', isOptional: true },
        { name: 'weather_conditions', type: 'string', isOptional: true },
        { name: 'personnel_count', type: 'number' },
        { name: 'equipment_used', type: 'string', isOptional: true },
        { name: 'safety_incidents', type: 'string', isOptional: true },
        { name: 'quality_issues', type: 'string', isOptional: true },
        { name: 'materials_used', type: 'string', isOptional: true },
        { name: 'next_day_plan', type: 'string', isOptional: true },
        { name: 'photos_count', type: 'number' },
        { name: 'notes', type: 'string', isOptional: true },
        { name: 'status', type: 'string' },
      ],
    }),
    tableSchema({
      name: 'hindrances',
      columns: [
        { name: 'project_id', type: 'string', isIndexed: true },
        { name: 'task_id', type: 'string', isIndexed: true },
        { name: 'site_id', type: 'string', isIndexed: true },
        { name: 'reporter_id', type: 'string', isIndexed: true },
        { name: 'title', type: 'string' },
        { name: 'description', type: 'string', isOptional: true },
        { name: 'type', type: 'string' },
        { name: 'severity', type: 'string' },
        { name: 'status', type: 'string' },
        { name: 'reported_date', type: 'number' }, // timestamp
        { name: 'resolved_date', type: 'number' }, // timestamp
        { name: 'estimated_resolution_date', type: 'number' }, // timestamp
        { name: 'impact_on_schedule', type: 'number' },
        { name: 'cost_impact', type: 'number' },
        { name: 'affected_resources', type: 'string', isOptional: true },
        { name: 'resolution_notes', type: 'string', isOptional: true },
        { name: 'assigned_to', type: 'string', isOptional: true },
      ],
    }),
  ],
});