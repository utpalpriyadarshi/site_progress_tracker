import { appSchema, tableSchema } from '@nozbe/watermelondb';

export default appSchema({
  version: 12, // Incremented for WBS management, critical path, and modular templates (v1.4)
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
        // Planning module fields (v11)
        { name: 'baseline_start_date', type: 'number', isOptional: true }, // locked baseline start
        { name: 'baseline_end_date', type: 'number', isOptional: true }, // locked baseline end
        { name: 'dependencies', type: 'string', isOptional: true }, // JSON array of item IDs
        { name: 'is_baseline_locked', type: 'boolean' }, // baseline lock status
        { name: 'actual_start_date', type: 'number', isOptional: true }, // when work actually began
        { name: 'actual_end_date', type: 'number', isOptional: true }, // when work actually completed
        { name: 'critical_path_flag', type: 'boolean', isOptional: true }, // on critical path
        // WBS & Phase Management (v12)
        { name: 'project_phase', type: 'string', isIndexed: true }, // design, approvals, mobilization, etc.
        { name: 'is_milestone', type: 'boolean' }, // milestone flag
        { name: 'created_by_role', type: 'string' }, // planner, supervisor
        { name: 'wbs_code', type: 'string', isIndexed: true }, // hierarchical code (e.g., "1.2.3.4")
        { name: 'wbs_level', type: 'number' }, // depth level (1-4)
        { name: 'parent_wbs_code', type: 'string', isOptional: true }, // parent WBS code
        // Critical Path & Risk Management (v12)
        { name: 'is_critical_path', type: 'boolean' }, // critical path indicator
        { name: 'float_days', type: 'number', isOptional: true }, // total float
        { name: 'dependency_risk', type: 'string', isOptional: true }, // low, medium, high
        { name: 'risk_notes', type: 'string', isOptional: true }, // risk description
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
    tableSchema({
      name: 'site_inspections',
      columns: [
        { name: 'site_id', type: 'string', isIndexed: true }, // belongs to site
        { name: 'inspector_id', type: 'string', isIndexed: true }, // supervisor/inspector user ID
        { name: 'inspection_date', type: 'number' }, // timestamp of inspection
        { name: 'inspection_type', type: 'string' }, // daily, weekly, safety, quality
        { name: 'overall_rating', type: 'string' }, // excellent, good, fair, poor
        { name: 'checklist_data', type: 'string' }, // JSON string of checklist items
        { name: 'photos', type: 'string' }, // JSON string array of photo URIs
        { name: 'safety_flagged', type: 'boolean' }, // true if safety issues found
        { name: 'follow_up_date', type: 'number' }, // timestamp for follow-up (0 if none)
        { name: 'follow_up_notes', type: 'string', isOptional: true }, // follow-up action notes
        { name: 'notes', type: 'string', isOptional: true }, // overall inspection notes
        { name: 'sync_status', type: 'string' }, // pending, synced, failed
      ],
    }),
    tableSchema({
      name: 'users',
      columns: [
        { name: 'username', type: 'string', isIndexed: true }, // unique username for login
        { name: 'password', type: 'string' }, // hashed password (for mock auth)
        { name: 'full_name', type: 'string' }, // display name
        { name: 'email', type: 'string', isOptional: true }, // optional email
        { name: 'phone', type: 'string', isOptional: true }, // optional phone
        { name: 'is_active', type: 'boolean' }, // account active status
        { name: 'role_id', type: 'string', isIndexed: true }, // assigned role (belongs to role)
      ],
    }),
    tableSchema({
      name: 'roles',
      columns: [
        { name: 'name', type: 'string', isIndexed: true }, // role name (Admin, Supervisor, Manager, etc.)
        { name: 'description', type: 'string', isOptional: true }, // role description
        { name: 'permissions', type: 'string' }, // JSON string of permissions array
      ],
    }),
    tableSchema({
      name: 'schedule_revisions',
      columns: [
        { name: 'item_id', type: 'string', isIndexed: true }, // belongs to item
        { name: 'old_start_date', type: 'number' }, // previous planned start
        { name: 'old_end_date', type: 'number' }, // previous planned end
        { name: 'new_start_date', type: 'number' }, // new planned start
        { name: 'new_end_date', type: 'number' }, // new planned end
        { name: 'reason', type: 'string' }, // reason for schedule change
        { name: 'revision_version', type: 'number' }, // v1, v2, v3...
        { name: 'revised_by', type: 'string', isIndexed: true }, // user ID who made change
        { name: 'approved_by', type: 'string', isOptional: true }, // approver user ID
        { name: 'approval_status', type: 'string' }, // pending, approved, rejected
        { name: 'impact_summary', type: 'string', isOptional: true }, // JSON: affected items
        { name: 'sync_status', type: 'string' }, // pending, synced, failed
      ],
    }),
    tableSchema({
      name: 'template_modules',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'category', type: 'string', isIndexed: true }, // substation, ohe, third_rail, building, interface
        { name: 'voltage_level', type: 'string', isOptional: true }, // 220kV, 132kV, 66kV, 33kV, 25kV, 650VDC
        { name: 'items_json', type: 'string' }, // JSON array of template items
        { name: 'compatible_modules', type: 'string' }, // JSON array of compatible module IDs
        { name: 'is_predefined', type: 'boolean' }, // system template flag
        { name: 'description', type: 'string' },
      ],
    }),
    tableSchema({
      name: 'interface_points',
      columns: [
        { name: 'item_id', type: 'string', isIndexed: true }, // belongs to item
        { name: 'from_contractor', type: 'string' },
        { name: 'to_contractor', type: 'string' },
        { name: 'interface_type', type: 'string' }, // handover, approval, information
        { name: 'status', type: 'string' }, // pending, in_progress, resolved, blocked
        { name: 'target_date', type: 'number', isOptional: true }, // target completion timestamp
        { name: 'actual_date', type: 'number', isOptional: true }, // actual completion timestamp
        { name: 'notes', type: 'string', isOptional: true },
      ],
    }),
  ],
});