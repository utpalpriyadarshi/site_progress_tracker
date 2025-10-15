import { schemaMigrations, createTable, addColumns } from '@nozbe/watermelondb/Schema/migrations';

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
  ],
});
