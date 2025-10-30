import { schemaMigrations, createTable } from '@nozbe/watermelondb/Schema/migrations';

/**
 * Migration v18 → v19
 *
 * Week 6, Day 1: Add sync_queue table
 *
 * Changes:
 * - Add sync_queue table for tracking local changes that need to be synced
 * - Tracks table_name, record_id, action (create/update/delete)
 * - Stores JSON data of the record
 * - Tracks sync status (synced_at timestamp)
 * - Retry logic (retry_count, last_error)
 */
export default schemaMigrations({
  migrations: [
    {
      toVersion: 19,
      steps: [
        createTable({
          name: 'sync_queue',
          columns: [
            { name: 'table_name', type: 'string', isIndexed: true },
            { name: 'record_id', type: 'string', isIndexed: true },
            { name: 'action', type: 'string' },
            { name: 'data', type: 'string' },
            { name: 'synced_at', type: 'number', isOptional: true },
            { name: 'retry_count', type: 'number' },
            { name: 'last_error', type: 'string', isOptional: true },
            // WatermelonDB auto-adds: id, created_at, updated_at
          ],
        }),
      ],
    },
  ],
});
