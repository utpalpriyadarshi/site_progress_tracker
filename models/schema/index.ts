import { appSchema, tableSchema } from '@nozbe/watermelondb';

export default appSchema({
  version: 31, // Added multi-role tables - budgets, costs, invoices + enhancements (v2.11)
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
        { name: 'sync_status', type: 'string' }, // pending, synced, failed
        { name: '_version', type: 'number' }, // conflict resolution version tracking
      ],
    }),
    tableSchema({
      name: 'sites',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'location', type: 'string' },
        { name: 'project_id', type: 'string', isIndexed: true }, // belongs to project
        { name: 'supervisor_id', type: 'string', isIndexed: true, isOptional: true }, // assigned supervisor (optional)
        // v2.11: Planning Engineer role - site schedule dates
        { name: 'planned_start_date', type: 'number', isOptional: true },
        { name: 'planned_end_date', type: 'number', isOptional: true },
        { name: 'actual_start_date', type: 'number', isOptional: true },
        { name: 'actual_end_date', type: 'number', isOptional: true },
        { name: 'sync_status', type: 'string' }, // pending, synced, failed
        { name: '_version', type: 'number' }, // conflict resolution version tracking
      ],
    }),
    tableSchema({
      name: 'categories',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'description', type: 'string', isOptional: true },
        { name: 'sync_status', type: 'string' }, // pending, synced, failed
        { name: '_version', type: 'number' }, // conflict resolution version tracking
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
        // Milestone linking (v2.10)
        { name: 'milestone_id', type: 'string', isOptional: true, isIndexed: true }, // linked milestone
        { name: 'sync_status', type: 'string' }, // pending, synced, failed
        { name: '_version', type: 'number' }, // conflict resolution version tracking
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
        { name: '_version', type: 'number' }, // conflict resolution version tracking
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
        { name: '_version', type: 'number' }, // conflict resolution version tracking
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
        { name: 'sync_status', type: 'string' }, // pending, synced, failed
        { name: '_version', type: 'number' }, // conflict resolution version tracking
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
        { name: '_version', type: 'number' }, // conflict resolution version tracking
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
        { name: '_version', type: 'number' }, // conflict resolution version tracking
      ],
    }),
    tableSchema({
      name: 'users',
      columns: [
        { name: 'username', type: 'string', isIndexed: true }, // unique username for login
        { name: 'password_hash', type: 'string' }, // bcrypt hashed password (v2.2 - required after migration)
        { name: 'full_name', type: 'string' }, // display name
        { name: 'email', type: 'string', isOptional: true }, // optional email
        { name: 'phone', type: 'string', isOptional: true }, // optional phone
        { name: 'is_active', type: 'boolean' }, // account active status
        { name: 'role_id', type: 'string', isIndexed: true }, // assigned role (belongs to role)
        { name: 'project_id', type: 'string', isOptional: true, isIndexed: true }, // assigned project (for supervisor role) - v2.9
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
      name: 'sessions',
      columns: [
        { name: 'user_id', type: 'string', isIndexed: true }, // belongs to user (foreign key)
        { name: 'access_token', type: 'string' }, // JWT access token
        { name: 'refresh_token', type: 'string' }, // JWT refresh token
        { name: 'device_info', type: 'string', isOptional: true }, // JSON string with device info (optional, keep simple)
        { name: 'ip_address', type: 'string', isOptional: true }, // IP address (optional, keep simple)
        { name: 'expires_at', type: 'number' }, // timestamp when session expires
        { name: 'revoked_at', type: 'number', isOptional: true }, // timestamp when revoked (nullable)
        { name: 'is_active', type: 'boolean' }, // session active status
        { name: 'created_at', type: 'number' }, // auto-managed by WatermelonDB
        { name: 'updated_at', type: 'number' }, // auto-managed by WatermelonDB
      ],
    }),
    tableSchema({
      name: 'password_history',
      columns: [
        { name: 'user_id', type: 'string', isIndexed: true }, // belongs to user (foreign key)
        { name: 'password_hash', type: 'string' }, // old password hash for reuse prevention
        { name: 'created_at', type: 'number' }, // auto-managed by WatermelonDB
        { name: 'updated_at', type: 'number' }, // auto-managed by WatermelonDB
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
        { name: '_version', type: 'number' }, // conflict resolution version tracking
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
    tableSchema({
      name: 'sync_queue',
      columns: [
        { name: 'table_name', type: 'string', isIndexed: true }, // which table (projects, sites, items, etc.)
        { name: 'record_id', type: 'string', isIndexed: true }, // ID of the record to sync
        { name: 'action', type: 'string' }, // create, update, delete
        { name: 'data', type: 'string' }, // JSON string of the record data
        { name: 'synced_at', type: 'number', isOptional: true }, // timestamp when synced (null if pending)
        { name: 'retry_count', type: 'number' }, // number of retry attempts
        { name: 'last_error', type: 'string', isOptional: true }, // last error message if sync failed
      ],
    }),
    tableSchema({
      name: 'teams',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'site_id', type: 'string', isIndexed: true },
        { name: 'team_lead_id', type: 'string', isOptional: true },
        { name: 'created_date', type: 'number' },
        { name: 'status', type: 'string' },
        { name: 'specialization', type: 'string', isOptional: true },
        { name: 'sync_status', type: 'string' },
        { name: '_version', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'team_members',
      columns: [
        { name: 'team_id', type: 'string', isIndexed: true },
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'role', type: 'string' },
        { name: 'assigned_date', type: 'number' },
        { name: 'end_date', type: 'number', isOptional: true },
        { name: 'status', type: 'string' },
        { name: 'sync_status', type: 'string' },
        { name: '_version', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'resource_requests',
      columns: [
        { name: 'requested_by', type: 'string', isIndexed: true },
        { name: 'site_id', type: 'string', isIndexed: true },
        { name: 'resource_type', type: 'string' },
        { name: 'resource_name', type: 'string' },
        { name: 'quantity', type: 'number' },
        { name: 'priority', type: 'string' },
        { name: 'requested_date', type: 'number' },
        { name: 'needed_by_date', type: 'number' },
        { name: 'approval_status', type: 'string', isIndexed: true },
        { name: 'approved_by', type: 'string', isOptional: true },
        { name: 'approval_date', type: 'number', isOptional: true },
        { name: 'rejection_reason', type: 'string', isOptional: true },
        { name: 'notes', type: 'string', isOptional: true },
        { name: 'sync_status', type: 'string' },
        { name: '_version', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'boms',
      columns: [
        { name: 'project_id', type: 'string', isIndexed: true },
        { name: 'name', type: 'string' },
        { name: 'type', type: 'string', isIndexed: true }, // estimating | execution
        { name: 'status', type: 'string', isIndexed: true }, // draft, submitted, won, lost, baseline, active, closed
        { name: 'version', type: 'string' }, // v1.0, v2.0, v3.0, v3.1
        { name: 'site_category', type: 'string', isIndexed: true }, // ROCS, FOCS, RSS, AMS, TSS, ASS, Viaduct
        { name: 'baseline_bom_id', type: 'string', isOptional: true, isIndexed: true }, // Link to original estimating BOM
        { name: 'quantity', type: 'number' }, // e.g., 2 apartments, 5 floors
        { name: 'unit', type: 'string' }, // e.g., nos, floors, apartments, units
        { name: 'tender_date', type: 'number', isOptional: true },
        { name: 'client', type: 'string', isOptional: true },
        { name: 'contract_value', type: 'number', isOptional: true },
        { name: 'contingency', type: 'number' }, // percentage
        { name: 'profit_margin', type: 'number' }, // percentage
        { name: 'total_estimated_cost', type: 'number' },
        { name: 'total_actual_cost', type: 'number' },
        { name: 'description', type: 'string', isOptional: true },
        { name: 'created_by', type: 'string', isIndexed: true },
        { name: 'created_date', type: 'number' },
        { name: 'updated_date', type: 'number' },
        { name: 'sync_status', type: 'string' },
        { name: '_version', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'bom_items',
      columns: [
        { name: 'bom_id', type: 'string', isIndexed: true },
        { name: 'material_id', type: 'string', isOptional: true, isIndexed: true },
        { name: 'doors_id', type: 'string', isOptional: true, isIndexed: true }, // Link to DOORS package
        { name: 'link_type', type: 'string', isOptional: true }, // 'auto', 'manual', 'override' (Phase 3)
        { name: 'linked_by_id', type: 'string', isOptional: true, isIndexed: true }, // User who created link (Phase 3)
        { name: 'linked_at', type: 'number', isOptional: true }, // When link was created (Phase 3)
        { name: 'item_code', type: 'string' },
        { name: 'description', type: 'string' },
        { name: 'category', type: 'string', isIndexed: true }, // material, labor, equipment, subcontractor
        { name: 'sub_category', type: 'string', isOptional: true },
        { name: 'quantity', type: 'number' },
        { name: 'unit', type: 'string' },
        { name: 'unit_cost', type: 'number' },
        { name: 'total_cost', type: 'number' },
        { name: 'wbs_code', type: 'string', isOptional: true },
        { name: 'phase', type: 'string', isOptional: true },
        { name: 'actual_quantity', type: 'number', isOptional: true },
        { name: 'actual_cost', type: 'number', isOptional: true },
        { name: 'notes', type: 'string', isOptional: true },
        { name: 'created_date', type: 'number' },
        { name: 'updated_date', type: 'number' },
        { name: 'sync_status', type: 'string' },
        { name: '_version', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'doors_packages',
      columns: [
        // Basic Information
        { name: 'doors_id', type: 'string', isIndexed: true },
        { name: 'equipment_name', type: 'string' },
        { name: 'category', type: 'string', isIndexed: true },
        { name: 'equipment_type', type: 'string', isIndexed: true },
        { name: 'project_id', type: 'string', isIndexed: true },
        { name: 'specification_ref', type: 'string', isOptional: true },
        { name: 'drawing_ref', type: 'string', isOptional: true },
        { name: 'quantity', type: 'number' },
        { name: 'unit', type: 'string' },
        // Compliance Summary
        { name: 'total_requirements', type: 'number' },
        { name: 'compliant_requirements', type: 'number' },
        { name: 'compliance_percentage', type: 'number' },
        { name: 'technical_req_compliance', type: 'number' },
        { name: 'datasheet_compliance', type: 'number' },
        { name: 'type_test_compliance', type: 'number' },
        { name: 'routine_test_compliance', type: 'number' },
        { name: 'site_req_compliance', type: 'number' },
        // Status
        { name: 'status', type: 'string', isIndexed: true },
        { name: 'priority', type: 'string', isIndexed: true },
        // RFQ stage
        { name: 'rfq_no', type: 'string', isOptional: true },
        { name: 'rfq_issued_date', type: 'number', isOptional: true },
        { name: 'vendors_invited', type: 'number', isOptional: true },
        { name: 'vendors_responded', type: 'number', isOptional: true },
        // Procurement
        { name: 'po_no', type: 'string', isOptional: true },
        { name: 'po_date', type: 'number', isOptional: true },
        { name: 'selected_vendor', type: 'string', isOptional: true },
        { name: 'po_value', type: 'number', isOptional: true },
        // Delivery
        { name: 'delivery_status', type: 'string', isOptional: true },
        { name: 'expected_delivery', type: 'number', isOptional: true },
        { name: 'actual_delivery', type: 'number', isOptional: true },
        // Closure
        { name: 'closure_date', type: 'number', isOptional: true },
        { name: 'closure_remarks', type: 'string', isOptional: true },
        // Ownership
        { name: 'created_by', type: 'string', isIndexed: true },
        { name: 'assigned_to', type: 'string', isOptional: true, isIndexed: true },
        { name: 'reviewed_by', type: 'string', isOptional: true, isIndexed: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        // Edit audit trail (Phase 3)
        { name: 'last_modified_at', type: 'number', isOptional: true },
        { name: 'modified_by_id', type: 'string', isOptional: true, isIndexed: true },
        // Sync
        { name: 'app_sync_status', type: 'string' },
        { name: 'version', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'doors_requirements',
      columns: [
        // Basic Information
        { name: 'requirement_id', type: 'string', isIndexed: true },
        { name: 'doors_package_id', type: 'string', isIndexed: true },
        // Requirement Details
        { name: 'category', type: 'string', isIndexed: true },
        { name: 'requirement_code', type: 'string', isIndexed: true },
        { name: 'requirement_text', type: 'string' },
        { name: 'specification_clause', type: 'string', isOptional: true },
        { name: 'acceptance_criteria', type: 'string' },
        { name: 'is_mandatory', type: 'boolean' },
        { name: 'sequence_no', type: 'number' },
        // Compliance Status
        { name: 'compliance_status', type: 'string', isIndexed: true },
        { name: 'compliance_percentage', type: 'number', isOptional: true },
        { name: 'vendor_response', type: 'string', isOptional: true },
        { name: 'verification_method', type: 'string', isOptional: true },
        { name: 'verification_status', type: 'string', isOptional: true },
        // Engineering Review
        { name: 'review_status', type: 'string', isIndexed: true },
        { name: 'review_comments', type: 'string', isOptional: true },
        { name: 'reviewed_by', type: 'string', isOptional: true, isIndexed: true },
        { name: 'reviewed_at', type: 'number', isOptional: true },
        // Attachments
        { name: 'attachment_count', type: 'number' },
        { name: 'test_report_ref', type: 'string', isOptional: true },
        { name: 'certificate_ref', type: 'string', isOptional: true },
        // Timestamps
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        // Edit audit trail (Phase 3)
        { name: 'last_modified_at', type: 'number', isOptional: true },
        { name: 'modified_by_id', type: 'string', isOptional: true, isIndexed: true },
        // Sync
        { name: 'app_sync_status', type: 'string' },
        { name: 'version', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'vendors',
      columns: [
        { name: 'vendor_code', type: 'string', isIndexed: true },
        { name: 'vendor_name', type: 'string' },
        { name: 'category', type: 'string', isIndexed: true },
        { name: 'contact_person', type: 'string', isOptional: true },
        { name: 'email', type: 'string', isOptional: true },
        { name: 'phone', type: 'string', isOptional: true },
        { name: 'address', type: 'string', isOptional: true },
        { name: 'rating', type: 'number', isOptional: true },
        { name: 'is_approved', type: 'boolean' },
        { name: 'performance_score', type: 'number', isOptional: true },
        { name: 'last_delivery_date', type: 'number', isOptional: true },
        { name: 'total_orders', type: 'number' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        { name: 'sync_status', type: 'string' },
        { name: '_version', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'rfqs',
      columns: [
        { name: 'rfq_number', type: 'string', isIndexed: true },
        { name: 'doors_id', type: 'string', isIndexed: true },
        { name: 'doors_package_id', type: 'string', isIndexed: true },
        { name: 'project_id', type: 'string', isIndexed: true },
        { name: 'title', type: 'string' },
        { name: 'description', type: 'string', isOptional: true },
        { name: 'status', type: 'string', isIndexed: true },
        // v2.11: Design Engineer vs Logistics distinction
        { name: 'rfq_type', type: 'string', isIndexed: true }, // 'design' | 'procurement'
        { name: 'issue_date', type: 'number', isOptional: true },
        { name: 'closing_date', type: 'number', isOptional: true },
        { name: 'evaluation_date', type: 'number', isOptional: true },
        { name: 'award_date', type: 'number', isOptional: true },
        { name: 'expected_delivery_days', type: 'number', isOptional: true },
        { name: 'technical_specifications', type: 'string', isOptional: true },
        { name: 'commercial_terms', type: 'string', isOptional: true },
        { name: 'total_vendors_invited', type: 'number' },
        { name: 'total_quotes_received', type: 'number' },
        { name: 'winning_vendor_id', type: 'string', isOptional: true, isIndexed: true },
        { name: 'winning_quote_id', type: 'string', isOptional: true, isIndexed: true },
        { name: 'awarded_value', type: 'number', isOptional: true },
        { name: 'created_by_id', type: 'string', isIndexed: true },
        { name: 'evaluated_by_id', type: 'string', isOptional: true, isIndexed: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        { name: 'sync_status', type: 'string' },
        { name: '_version', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'rfq_vendor_quotes',
      columns: [
        { name: 'rfq_id', type: 'string', isIndexed: true },
        { name: 'vendor_id', type: 'string', isIndexed: true },
        { name: 'quote_reference', type: 'string', isOptional: true },
        { name: 'quoted_price', type: 'number' },
        { name: 'currency', type: 'string' },
        { name: 'lead_time_days', type: 'number' },
        { name: 'validity_days', type: 'number' },
        { name: 'payment_terms', type: 'string', isOptional: true },
        { name: 'warranty_months', type: 'number', isOptional: true },
        { name: 'technical_compliance_percentage', type: 'number' },
        { name: 'technical_deviations', type: 'string', isOptional: true },
        { name: 'commercial_deviations', type: 'string', isOptional: true },
        { name: 'notes', type: 'string', isOptional: true },
        { name: 'attachments', type: 'string', isOptional: true },
        { name: 'status', type: 'string', isIndexed: true },
        { name: 'technical_score', type: 'number', isOptional: true },
        { name: 'commercial_score', type: 'number', isOptional: true },
        { name: 'overall_score', type: 'number', isOptional: true },
        { name: 'rank', type: 'number', isOptional: true },
        { name: 'submitted_at', type: 'number', isOptional: true },
        { name: 'evaluated_at', type: 'number', isOptional: true },
        { name: 'evaluated_by_id', type: 'string', isOptional: true, isIndexed: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        { name: 'sync_status', type: 'string' },
        { name: '_version', type: 'number' },
      ],
    }),
    // v2.10: Manager role tables
    tableSchema({
      name: 'milestones',
      columns: [
        { name: 'project_id', type: 'string', isIndexed: true },
        { name: 'milestone_code', type: 'string', isIndexed: true }, // PM100, PM200, etc.
        { name: 'milestone_name', type: 'string' }, // "Requirements Management"
        { name: 'description', type: 'string', isOptional: true },
        { name: 'sequence_order', type: 'number' }, // 1, 2, 3...
        { name: 'weightage', type: 'number' }, // % weightage for progress calc
        { name: 'is_active', type: 'boolean' },
        { name: 'is_custom', type: 'boolean' }, // true if added by manager
        { name: 'created_by', type: 'string', isIndexed: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        { name: 'sync_status', type: 'string' },
        { name: '_version', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'milestone_progress',
      columns: [
        { name: 'milestone_id', type: 'string', isIndexed: true },
        { name: 'site_id', type: 'string', isIndexed: true }, // site-level tracking
        { name: 'project_id', type: 'string', isIndexed: true },
        { name: 'progress_percentage', type: 'number' }, // 0-100
        { name: 'status', type: 'string' }, // not_started, in_progress, completed, on_hold
        { name: 'owner_id', type: 'string', isOptional: true }, // responsible person
        { name: 'planned_start_date', type: 'number', isOptional: true },
        { name: 'planned_end_date', type: 'number', isOptional: true },
        { name: 'actual_start_date', type: 'number', isOptional: true },
        { name: 'actual_end_date', type: 'number', isOptional: true },
        { name: 'notes', type: 'string', isOptional: true },
        { name: 'updated_by', type: 'string', isIndexed: true },
        { name: 'updated_at', type: 'number' },
        { name: 'sync_status', type: 'string' },
        { name: '_version', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'purchase_orders',
      columns: [
        { name: 'po_number', type: 'string', isIndexed: true }, // PO-2025-001
        { name: 'rfq_id', type: 'string', isIndexed: true }, // linked RFQ
        { name: 'vendor_id', type: 'string', isIndexed: true },
        { name: 'doors_package_id', type: 'string', isOptional: true, isIndexed: true },
        { name: 'project_id', type: 'string', isIndexed: true },
        { name: 'po_date', type: 'number' },
        { name: 'po_value', type: 'number' },
        { name: 'currency', type: 'string' }, // INR, USD, EUR
        { name: 'payment_terms', type: 'string', isOptional: true },
        { name: 'delivery_terms', type: 'string', isOptional: true },
        { name: 'expected_delivery_date', type: 'number', isOptional: true },
        { name: 'actual_delivery_date', type: 'number', isOptional: true },
        { name: 'status', type: 'string', isIndexed: true }, // draft, issued, in_progress, delivered, closed, cancelled
        { name: 'items_details', type: 'string' }, // JSON array of PO line items
        { name: 'terms_conditions', type: 'string', isOptional: true },
        { name: 'notes', type: 'string', isOptional: true },
        { name: 'created_by_id', type: 'string', isIndexed: true },
        { name: 'approved_by_id', type: 'string', isOptional: true, isIndexed: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        { name: 'sync_status', type: 'string' },
        { name: '_version', type: 'number' },
      ],
    }),
    // v2.11: Commercial Manager role tables
    tableSchema({
      name: 'budgets',
      columns: [
        { name: 'project_id', type: 'string', isIndexed: true },
        { name: 'category', type: 'string', isIndexed: true }, // material, labor, equipment, other
        { name: 'allocated_amount', type: 'number' },
        { name: 'description', type: 'string' },
        { name: 'created_by', type: 'string', isIndexed: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        { name: 'sync_status', type: 'string' },
        { name: '_version', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'costs',
      columns: [
        { name: 'project_id', type: 'string', isIndexed: true },
        { name: 'po_id', type: 'string', isOptional: true, isIndexed: true },
        { name: 'category', type: 'string', isIndexed: true }, // material, labor, equipment, other
        { name: 'amount', type: 'number' },
        { name: 'description', type: 'string' },
        { name: 'cost_date', type: 'number' },
        { name: 'created_by', type: 'string', isIndexed: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        { name: 'sync_status', type: 'string' },
        { name: '_version', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'invoices',
      columns: [
        { name: 'project_id', type: 'string', isIndexed: true },
        { name: 'po_id', type: 'string', isIndexed: true },
        { name: 'invoice_number', type: 'string', isIndexed: true },
        { name: 'invoice_date', type: 'number' },
        { name: 'amount', type: 'number' },
        { name: 'payment_status', type: 'string', isIndexed: true }, // pending, paid
        { name: 'payment_date', type: 'number', isOptional: true },
        { name: 'vendor_id', type: 'string', isIndexed: true },
        { name: 'created_by', type: 'string', isIndexed: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        { name: 'sync_status', type: 'string' },
        { name: '_version', type: 'number' },
      ],
    }),
  ],
});