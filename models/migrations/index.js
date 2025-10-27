import { schemaMigrations, createTable, addColumns, dropColumns } from '@nozbe/watermelondb/Schema/migrations';

export default schemaMigrations({
  migrations: [
    {
      toVersion: 6,
      steps: [
        createTable({
          name: 'daily_reports',
          columns: [
            { name: 'site_id', type: 'string', isIndexed: true },
            { name: 'supervisor_id', type: 'string', isIndexed: true },
            { name: 'report_date', type: 'number' },
            { name: 'submitted_at', type: 'number' },
            { name: 'total_items', type: 'number' },
            { name: 'total_progress', type: 'number' },
            { name: 'pdf_path', type: 'string', isOptional: true },
            { name: 'notes', type: 'string', isOptional: true },
            { name: 'sync_status', type: 'string' },
            { name: 'created_at', type: 'number' },
            { name: 'updated_at', type: 'number' },
          ],
        }),
      ],
    },
    {
      toVersion: 7,
      steps: [
        addColumns({
          table: 'hindrances',
          columns: [
            { name: 'photos', type: 'string' },
            { name: 'sync_status', type: 'string' },
          ],
        }),
      ],
    },
    {
      toVersion: 8,
      steps: [
        addColumns({
          table: 'hindrances',
          columns: [
            { name: 'reported_at', type: 'number' },
          ],
        }),
      ],
    },
    {
      toVersion: 9,
      steps: [
        createTable({
          name: 'site_inspections',
          columns: [
            { name: 'site_id', type: 'string', isIndexed: true },
            { name: 'inspector_id', type: 'string', isIndexed: true },
            { name: 'inspection_date', type: 'number' },
            { name: 'inspection_type', type: 'string' },
            { name: 'overall_rating', type: 'string' },
            { name: 'checklist_data', type: 'string' },
            { name: 'photos', type: 'string' },
            { name: 'safety_flagged', type: 'boolean' },
            { name: 'follow_up_date', type: 'number' },
            { name: 'follow_up_notes', type: 'string', isOptional: true },
            { name: 'notes', type: 'string', isOptional: true },
            { name: 'sync_status', type: 'string' },
            { name: 'created_at', type: 'number' },
            { name: 'updated_at', type: 'number' },
          ],
        }),
      ],
    },
    {
      toVersion: 10,
      steps: [
        createTable({
          name: 'roles',
          columns: [
            { name: 'name', type: 'string', isIndexed: true },
            { name: 'description', type: 'string', isOptional: true },
            { name: 'permissions', type: 'string' },
            { name: 'created_at', type: 'number' },
            { name: 'updated_at', type: 'number' },
          ],
        }),
        createTable({
          name: 'users',
          columns: [
            { name: 'username', type: 'string', isIndexed: true },
            { name: 'password', type: 'string' },
            { name: 'full_name', type: 'string' },
            { name: 'email', type: 'string', isOptional: true },
            { name: 'phone', type: 'string', isOptional: true },
            { name: 'is_active', type: 'boolean' },
            { name: 'role_id', type: 'string', isIndexed: true },
            { name: 'created_at', type: 'number' },
            { name: 'updated_at', type: 'number' },
          ],
        }),
      ],
    },
    {
      toVersion: 11,
      steps: [
        addColumns({
          table: 'items',
          columns: [
            { name: 'baseline_start_date', type: 'number', isOptional: true },
            { name: 'baseline_end_date', type: 'number', isOptional: true },
            { name: 'dependencies', type: 'string', isOptional: true },
            { name: 'is_baseline_locked', type: 'boolean' },
            { name: 'actual_start_date', type: 'number', isOptional: true },
            { name: 'actual_end_date', type: 'number', isOptional: true },
            { name: 'critical_path_flag', type: 'boolean', isOptional: true },
          ],
        }),
        createTable({
          name: 'schedule_revisions',
          columns: [
            { name: 'item_id', type: 'string', isIndexed: true },
            { name: 'old_start_date', type: 'number' },
            { name: 'old_end_date', type: 'number' },
            { name: 'new_start_date', type: 'number' },
            { name: 'new_end_date', type: 'number' },
            { name: 'reason', type: 'string' },
            { name: 'revision_version', type: 'number' },
            { name: 'revised_by', type: 'string', isIndexed: true },
            { name: 'approved_by', type: 'string', isOptional: true },
            { name: 'approval_status', type: 'string' },
            { name: 'impact_summary', type: 'string', isOptional: true },
            { name: 'sync_status', type: 'string' },
            { name: 'created_at', type: 'number' },
            { name: 'updated_at', type: 'number' },
          ],
        }),
      ],
    },
    {
      toVersion: 12,
      steps: [
        // Add WBS & Phase Management columns to items table
        addColumns({
          table: 'items',
          columns: [
            { name: 'project_phase', type: 'string', isIndexed: true },
            { name: 'is_milestone', type: 'boolean' },
            { name: 'created_by_role', type: 'string' },
            { name: 'wbs_code', type: 'string', isIndexed: true },
            { name: 'wbs_level', type: 'number' },
            { name: 'parent_wbs_code', type: 'string', isOptional: true },
            { name: 'is_critical_path', type: 'boolean' },
            { name: 'float_days', type: 'number', isOptional: true },
            { name: 'dependency_risk', type: 'string', isOptional: true },
            { name: 'risk_notes', type: 'string', isOptional: true },
          ],
        }),
        // Create template_modules table
        createTable({
          name: 'template_modules',
          columns: [
            { name: 'name', type: 'string' },
            { name: 'category', type: 'string', isIndexed: true },
            { name: 'voltage_level', type: 'string', isOptional: true },
            { name: 'items_json', type: 'string' },
            { name: 'compatible_modules', type: 'string' },
            { name: 'is_predefined', type: 'boolean' },
            { name: 'description', type: 'string' },
            { name: 'created_at', type: 'number' },
            { name: 'updated_at', type: 'number' },
          ],
        }),
        // Create interface_points table (for v1.4)
        createTable({
          name: 'interface_points',
          columns: [
            { name: 'item_id', type: 'string', isIndexed: true },
            { name: 'from_contractor', type: 'string' },
            { name: 'to_contractor', type: 'string' },
            { name: 'interface_type', type: 'string' },
            { name: 'status', type: 'string' },
            { name: 'target_date', type: 'number', isOptional: true },
            { name: 'actual_date', type: 'number', isOptional: true },
            { name: 'notes', type: 'string', isOptional: true },
            { name: 'created_at', type: 'number' },
            { name: 'updated_at', type: 'number' },
          ],
        }),
      ],
    },
    {
      toVersion: 13,
      steps: [
        // v2.2 - Activity 1, Day 1: Add password_hash field for bcrypt hashed passwords
        addColumns({
          table: 'users',
          columns: [
            { name: 'password_hash', type: 'string', isOptional: true },
          ],
        }),
      ],
    },
    {
      toVersion: 14,
      steps: [
        // v2.2 - Activity 1, Day 4: Remove plaintext password field (migration complete)
        dropColumns({
          table: 'users',
          columns: ['password'],
        }),
      ],
    },
  ],
});
