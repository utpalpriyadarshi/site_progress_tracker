import { schemaMigrations, addColumns } from '@nozbe/watermelondb/Schema/migrations';

/**
 * Migration v28 → v29
 *
 * v2.9: Add project_id to users table for supervisor project assignment
 *
 * Changes:
 * - Add project_id column to users table
 * - Allows assigning supervisors to specific projects
 * - Enables project-based filtering and isolation
 * - Optional field (nullable) for non-supervisor roles
 */
export default schemaMigrations({
  migrations: [
    {
      toVersion: 29,
      steps: [
        addColumns({
          table: 'users',
          columns: [
            { name: 'project_id', type: 'string', isOptional: true, isIndexed: true },
          ],
        }),
      ],
    },
  ],
});
