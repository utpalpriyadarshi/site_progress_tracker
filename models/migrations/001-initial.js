import { Q } from '@nozbe/watermelondb';

export default {
  up: async (db) => {
    // Create projects table
    await db.collections.get('projects').createTable({
      columns: [
        { name: 'name', type: 'string' },
        { name: 'client', type: 'string' },
        { name: 'start_date', type: 'number' }, // timestamp
        { name: 'end_date', type: 'number' }, // timestamp
        { name: 'status', type: 'string' }, // active, completed, on_hold, cancelled
        { name: 'budget', type: 'number' },
        { name: 'created_at', type: 'number' }, // timestamp
        { name: 'updated_at', type: 'number' }, // timestamp
      ],
    });

    // Create sites table
    await db.collections.get('sites').createTable({
      columns: [
        { name: 'name', type: 'string' },
        { name: 'location', type: 'string' },
        { name: 'project_id', type: 'string', isIndexed: true }, // belongs to project
        { name: 'supervisor_id', type: 'string', isIndexed: true }, // assigned supervisor
        { name: 'created_at', type: 'number' }, // timestamp
        { name: 'updated_at', type: 'number' }, // timestamp
      ],
    });

    // Create categories table
    await db.collections.get('categories').createTable({
      columns: [
        { name: 'name', type: 'string' },
        { name: 'description', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' }, // timestamp
        { name: 'updated_at', type: 'number' }, // timestamp
      ],
    });

    // Create items table
    await db.collections.get('items').createTable({
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
        { name: 'created_at', type: 'number' }, // timestamp
        { name: 'updated_at', type: 'number' }, // timestamp
      ],
    });

    // Create progress_logs table
    await db.collections.get('progress_logs').createTable({
      columns: [
        { name: 'item_id', type: 'string', isIndexed: true }, // belongs to item
        { name: 'date', type: 'number' }, // timestamp
        { name: 'completed_quantity', type: 'number' },
        { name: 'reported_by', type: 'string', isIndexed: true }, // user ID
        { name: 'photos', type: 'string' }, // JSON string of photo paths
        { name: 'notes', type: 'string', isOptional: true },
        { name: 'sync_status', type: 'string' }, // pending, synced, failed
        { name: 'created_at', type: 'number' }, // timestamp
        { name: 'updated_at', type: 'number' }, // timestamp
      ],
    });

    // Create hindrances table
    await db.collections.get('hindrances').createTable({
      columns: [
        { name: 'title', type: 'string' },
        { name: 'description', type: 'string', isOptional: true },
        { name: 'item_id', type: 'string', isIndexed: true }, // belongs to item (optional: could be for site)
        { name: 'site_id', type: 'string', isIndexed: true }, // belongs to site (optional: if not related to item)
        { name: 'priority', type: 'string' }, // low, medium, high
        { name: 'status', type: 'string' }, // open, in_progress, resolved, closed
        { name: 'assigned_to', type: 'string', isIndexed: true }, // user ID
        { name: 'reported_by', type: 'string', isIndexed: true }, // user ID
        { name: 'created_at', type: 'number' }, // timestamp
        { name: 'updated_at', type: 'number' }, // timestamp
      ],
    });

    // Create materials table
    await db.collections.get('materials').createTable({
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
        { name: 'created_at', type: 'number' }, // timestamp
        { name: 'updated_at', type: 'number' }, // timestamp
      ],
    });
  },
};