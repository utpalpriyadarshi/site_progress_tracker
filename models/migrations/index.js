import { schemaMigrations, addColumns, createTable } from '@nozbe/watermelondb/Schema/migrations';

export default schemaMigrations({
  migrations: [
    // v13: Add password_hash field to users table (v2.2 - Day 1)
    {
      toVersion: 13,
      steps: [
        addColumns({
          table: 'users',
          columns: [
            { name: 'password_hash', type: 'string', isOptional: true }, // Optional during migration
          ],
        }),
      ],
    },
    // v14: Remove plaintext password field from users table (v2.2 - Day 4)
    {
      toVersion: 14,
      steps: [
        // WatermelonDB doesn't support dropColumns directly in migrations
        // Instead, we mark the old column as unused and handle it at the adapter level
        // The password field will be ignored in the schema and eventually cleaned up
      ],
    },
    // v15: Add sessions table for JWT session management (v2.2 - Day 11)
    {
      toVersion: 15,
      steps: [
        createTable({
          name: 'sessions',
          columns: [
            { name: 'user_id', type: 'string', isIndexed: true },
            { name: 'access_token', type: 'string' },
            { name: 'refresh_token', type: 'string' },
            { name: 'device_info', type: 'string', isOptional: true },
            { name: 'ip_address', type: 'string', isOptional: true },
            { name: 'expires_at', type: 'number' },
            { name: 'revoked_at', type: 'number', isOptional: true },
            { name: 'is_active', type: 'boolean' },
          ],
        }),
      ],
    },
    // v16: Add password_history table for password reuse prevention (v2.2 - Day 14)
    {
      toVersion: 16,
      steps: [
        createTable({
          name: 'password_history',
          columns: [
            { name: 'user_id', type: 'string', isIndexed: true },
            { name: 'password_hash', type: 'string' },
          ],
        }),
      ],
    },
    // v17: Add created_at/updated_at to sessions and password_history tables (v2.2 - Week 3 Fix)
    {
      toVersion: 17,
      steps: [
        addColumns({
          table: 'sessions',
          columns: [
            { name: 'created_at', type: 'number' },
            { name: 'updated_at', type: 'number' },
          ],
        }),
        addColumns({
          table: 'password_history',
          columns: [
            { name: 'created_at', type: 'number' },
            { name: 'updated_at', type: 'number' },
          ],
        }),
      ],
    },
    // v18: Add sync_status to core syncable models (Activity 2 prep)
    {
      toVersion: 18,
      steps: [
        addColumns({
          table: 'projects',
          columns: [
            { name: 'sync_status', type: 'string' },
          ],
        }),
        addColumns({
          table: 'sites',
          columns: [
            { name: 'sync_status', type: 'string' },
          ],
        }),
        addColumns({
          table: 'items',
          columns: [
            { name: 'sync_status', type: 'string' },
          ],
        }),
        addColumns({
          table: 'categories',
          columns: [
            { name: 'sync_status', type: 'string' },
          ],
        }),
        addColumns({
          table: 'materials',
          columns: [
            { name: 'sync_status', type: 'string' },
          ],
        }),
      ],
    },
    // v19: Add sync_queue table for tracking local changes (Week 6, Day 1)
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
          ],
        }),
      ],
    },
    // v20: Add _version field to all syncable models for conflict resolution (Week 7, Day 2)
    {
      toVersion: 20,
      steps: [
        addColumns({
          table: 'projects',
          columns: [{ name: '_version', type: 'number' }],
        }),
        addColumns({
          table: 'sites',
          columns: [{ name: '_version', type: 'number' }],
        }),
        addColumns({
          table: 'categories',
          columns: [{ name: '_version', type: 'number' }],
        }),
        addColumns({
          table: 'items',
          columns: [{ name: '_version', type: 'number' }],
        }),
        addColumns({
          table: 'materials',
          columns: [{ name: '_version', type: 'number' }],
        }),
        addColumns({
          table: 'progress_logs',
          columns: [{ name: '_version', type: 'number' }],
        }),
        addColumns({
          table: 'hindrances',
          columns: [{ name: '_version', type: 'number' }],
        }),
        addColumns({
          table: 'daily_reports',
          columns: [{ name: '_version', type: 'number' }],
        }),
        addColumns({
          table: 'site_inspections',
          columns: [{ name: '_version', type: 'number' }],
        }),
        addColumns({
          table: 'schedule_revisions',
          columns: [{ name: '_version', type: 'number' }],
        }),
      ],
    },
  ],
});
