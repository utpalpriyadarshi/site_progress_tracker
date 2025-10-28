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
  ],
});
