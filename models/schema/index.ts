import { appSchema, tableSchema } from '@nozbe/watermelondb';

export default appSchema({
  version: 8, // Incremented for hindrances reported_at field
  tables: [
    tableSchema({
      name: 'projects',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'client', type: 'string' },
        { name: 'start_date', type: 'number' }, // timestamp
        { name: 'end_date', type: 'number' }, // timestamp
        { name: 'status', type: 'string' }, // active, completed, on_hold, cancelled
        { name: 'budget', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'sites',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'location', type: 'string' },
        { name: 'project_id', type: 'string', isIndexed: true }, // belongs to project
        { name: 'supervisor_id', type: 'string', isIndexed: true }, // assigned supervisor
      ],
    }),
    tableSchema({
      name: 'categories',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'description', type: 'string', isOptional: true },
      ],
    }),
    tableSchema({
      name: 'items',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'category_id', type: 'string', isIndexed: true }, // belongs to category
        { name: 'site_id', type: 'string', isIndexed: true }, // belongs to site
        { name: 'planned_quantity', type: 'number' },
        { name: 'completed_quantity', type: 'number' },
        { name: 'unit_of_measurement', type: 'string' },
        { name: 'planned_start_date', type: 'number' }, // timestamp
        { name: 'planned_end_date', type: 'number' }, // timestamp
        { name: 'status', type: 'string' }, // not_started, in_progress, completed
        { name: 'weightage', type: 'number' }, // percentage of total project
      ],
    }),
    tableSchema({
      name: 'progress_logs',
      columns: [
        { name: 'item_id', type: 'string', isIndexed: true }, // belongs to item
        { name: 'date', type: 'number' }, // timestamp
        { name: 'completed_quantity', type: 'number' },
        { name: 'reported_by', type: 'string', isIndexed: true }, // user ID
        { name: 'photos', type: 'string' }, // JSON string of photo paths
        { name: 'notes', type: 'string', isOptional: true },
        { name: 'sync_status', type: 'string' }, // pending, synced, failed
      ],
    }),
    tableSchema({
      name: 'hindrances',
      columns: [
        { name: 'title', type: 'string' },
        { name: 'description', type: 'string', isOptional: true },
        { name: 'item_id', type: 'string', isIndexed: true }, // belongs to item (optional: could be for site)
        { name: 'site_id', type: 'string', isIndexed: true }, // belongs to site (optional: if not related to item)
        { name: 'priority', type: 'string' }, // low, medium, high
        { name: 'status', type: 'string' }, // open, in_progress, resolved, closed
        { name: 'assigned_to', type: 'string', isIndexed: true }, // user ID
        { name: 'reported_by', type: 'string', isIndexed: true }, // user ID
        { name: 'reported_at', type: 'number' }, // timestamp when reported
        { name: 'photos', type: 'string' }, // JSON string of photo paths
        { name: 'sync_status', type: 'string' }, // pending, synced, failed
      ],
    }),
    tableSchema({
      name: 'materials',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'item_id', type: 'string', isIndexed: true }, // belongs to item
        { name: 'quantity_required', type: 'number' },
        { name: 'quantity_available', type: 'number' },
        { name: 'quantity_used', type: 'number' },
        { name: 'unit', type: 'string' },
        { name: 'status', type: 'string' }, // ordered, delivered, in_use, shortage
        { name: 'supplier', type: 'string', isOptional: true },
        { name: 'procurement_manager_id', type: 'string', isIndexed: true }, // managed by
      ],
    }),
    tableSchema({
      name: 'daily_reports',
      columns: [
        { name: 'site_id', type: 'string', isIndexed: true }, // belongs to site
        { name: 'supervisor_id', type: 'string', isIndexed: true }, // submitted by supervisor
        { name: 'report_date', type: 'number' }, // timestamp for the report date
        { name: 'submitted_at', type: 'number' }, // timestamp when submitted
        { name: 'total_items', type: 'number' }, // count of items updated
        { name: 'total_progress', type: 'number' }, // overall progress percentage
        { name: 'pdf_path', type: 'string', isOptional: true }, // local path to PDF
        { name: 'notes', type: 'string', isOptional: true }, // overall report notes
        { name: 'sync_status', type: 'string' }, // pending, synced, failed
      ],
    }),
  ],
});