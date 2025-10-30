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
  ],
});
