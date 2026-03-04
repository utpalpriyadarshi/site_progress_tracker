import { schemaMigrations, addColumns, createTable } from '@nozbe/watermelondb/Schema/migrations';
import { v30Migration } from './v30_add_manager_tables';
import { v31Migration } from './v31_add_multi_role_tables';
import { v32Migration } from './v32_add_vendor_name_to_invoices';
import { v33Migration } from './v33_add_pdf_error_tracking';
import { v34Migration } from './v34_add_pdf_generation_status';
import { v35Migration } from './v35_add_key_dates_tables';
import { v36Migration } from './v36_add_design_documents_tables';
import { v37Migration } from './v37_add_key_date_weightage';
import { v38Migration } from './v38_add_designer_to_sites';
import { v39Migration } from './v39_add_design_document_weightage';
import { v40Migration } from './v40_add_key_date_to_design_documents';
import { v41Migration } from './v41_add_design_weightage';
import { v42Migration } from './v42_add_progress_mode';
import { v43Migration } from './v43_add_doors_package_fields';
import { v44Migration } from './v44_add_domains';
import { v45Migration } from './v45_rfq_compliance_status';
import { v46Migration } from './v46_doors_revisions';
import { v47Migration } from './v47_add_report_images';
import { v48Migration } from './v48_add_doors_package_link';
import { v49Migration } from './v49_add_change_orders';
import { v50Migration } from './v50_link_item_design_document';
import { v51Migration } from './v51_add_due_date_to_invoices';
import { v52Migration } from './v52_commercial_billing_fields';

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
    // v21: Add team management tables (Activity 3: Manager Role - Week 1, Day 1)
    {
      toVersion: 21,
      steps: [
        createTable({
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
        createTable({
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
        createTable({
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
      ],
    },
    // v22: Add BOM management tables (Activity 4: BOM Management - Phase 1)
    {
      toVersion: 22,
      steps: [
        createTable({
          name: 'boms',
          columns: [
            { name: 'project_id', type: 'string', isIndexed: true },
            { name: 'name', type: 'string' },
            { name: 'type', type: 'string', isIndexed: true },
            { name: 'status', type: 'string', isIndexed: true },
            { name: 'version', type: 'string' },
            { name: 'tender_date', type: 'number', isOptional: true },
            { name: 'client', type: 'string', isOptional: true },
            { name: 'contract_value', type: 'number', isOptional: true },
            { name: 'contingency', type: 'number' },
            { name: 'profit_margin', type: 'number' },
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
        createTable({
          name: 'bom_items',
          columns: [
            { name: 'bom_id', type: 'string', isIndexed: true },
            { name: 'material_id', type: 'string', isOptional: true, isIndexed: true },
            { name: 'item_code', type: 'string' },
            { name: 'description', type: 'string' },
            { name: 'category', type: 'string', isIndexed: true },
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
      ],
    },
    // v23: Add quantity and unit to boms table
    {
      toVersion: 23,
      steps: [
        addColumns({
          table: 'boms',
          columns: [
            { name: 'quantity', type: 'number' },
            { name: 'unit', type: 'string' },
          ],
        }),
      ],
    },
    // v24: Add site_category to boms table (Activity 4: BOM Management enhancements)
    {
      toVersion: 24,
      steps: [
        addColumns({
          table: 'boms',
          columns: [
            { name: 'site_category', type: 'string', isIndexed: true },
          ],
        }),
      ],
    },
    // v25: Add baseline_bom_id to boms table for copy tracking (Activity 4: Phase 2)
    {
      toVersion: 25,
      steps: [
        addColumns({
          table: 'boms',
          columns: [
            { name: 'baseline_bom_id', type: 'string', isOptional: true, isIndexed: true },
          ],
        }),
      ],
    },
    // v26: Add DOORS system (Dynamic Object Oriented Requirements System) - Activity 4: Phase 2
    {
      toVersion: 26,
      steps: [
        // Add doors_id to bom_items for linking to DOORS packages
        addColumns({
          table: 'bom_items',
          columns: [
            { name: 'doors_id', type: 'string', isOptional: true, isIndexed: true },
          ],
        }),
        // Create doors_packages table (equipment-level tracking)
        createTable({
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
            // Sync
            { name: 'app_sync_status', type: 'string' },
            { name: 'version', type: 'number' },
          ],
        }),
        // Create doors_requirements table (individual requirement tracking)
        createTable({
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
            // Sync
            { name: 'app_sync_status', type: 'string' },
            { name: 'version', type: 'number' },
          ],
        }),
      ],
    },
    // v27: Add edit support for DOORS and manual linking metadata (Activity 4: Phase 3)
    {
      toVersion: 27,
      steps: [
        // Add edit audit columns to doors_packages
        addColumns({
          table: 'doors_packages',
          columns: [
            { name: 'last_modified_at', type: 'number', isOptional: true },
            { name: 'modified_by_id', type: 'string', isOptional: true, isIndexed: true },
          ],
        }),
        // Add edit audit columns to doors_requirements
        addColumns({
          table: 'doors_requirements',
          columns: [
            { name: 'last_modified_at', type: 'number', isOptional: true },
            { name: 'modified_by_id', type: 'string', isOptional: true, isIndexed: true },
          ],
        }),
        // Add linking metadata to bom_items for manual linking support
        addColumns({
          table: 'bom_items',
          columns: [
            { name: 'link_type', type: 'string', isOptional: true }, // 'auto', 'manual', 'override'
            { name: 'linked_by_id', type: 'string', isOptional: true, isIndexed: true },
            { name: 'linked_at', type: 'number', isOptional: true },
          ],
        }),
      ],
    },
    // v28: Add RFQ Management System (Activity 4: Phase 3 - Days 4-7)
    {
      toVersion: 28,
      steps: [
        // Create vendors table for vendor management
        createTable({
          name: 'vendors',
          columns: [
            { name: 'vendor_code', type: 'string', isIndexed: true }, // e.g., VEN-001
            { name: 'vendor_name', type: 'string' },
            { name: 'category', type: 'string', isIndexed: true }, // TSS, OHE, SCADA, Cables, etc.
            { name: 'contact_person', type: 'string', isOptional: true },
            { name: 'email', type: 'string', isOptional: true },
            { name: 'phone', type: 'string', isOptional: true },
            { name: 'address', type: 'string', isOptional: true },
            { name: 'rating', type: 'number', isOptional: true }, // 1-5 rating
            { name: 'is_approved', type: 'boolean' }, // approved vendor status
            { name: 'performance_score', type: 'number', isOptional: true }, // historical performance 0-100
            { name: 'last_delivery_date', type: 'number', isOptional: true },
            { name: 'total_orders', type: 'number' },
            { name: 'created_at', type: 'number' },
            { name: 'updated_at', type: 'number' },
            { name: 'sync_status', type: 'string' },
            { name: '_version', type: 'number' },
          ],
        }),
        // Create rfqs table for RFQ management
        createTable({
          name: 'rfqs',
          columns: [
            { name: 'rfq_number', type: 'string', isIndexed: true }, // e.g., RFQ-2025-001
            { name: 'doors_id', type: 'string', isIndexed: true }, // linked DOORS package
            { name: 'doors_package_id', type: 'string', isIndexed: true }, // FK to doors_packages
            { name: 'project_id', type: 'string', isIndexed: true },
            { name: 'title', type: 'string' }, // RFQ title
            { name: 'description', type: 'string', isOptional: true },
            { name: 'status', type: 'string', isIndexed: true }, // draft, issued, quotes_received, evaluated, awarded, cancelled
            { name: 'issue_date', type: 'number', isOptional: true },
            { name: 'closing_date', type: 'number', isOptional: true },
            { name: 'evaluation_date', type: 'number', isOptional: true },
            { name: 'award_date', type: 'number', isOptional: true },
            { name: 'expected_delivery_days', type: 'number', isOptional: true },
            { name: 'technical_specifications', type: 'string', isOptional: true }, // JSON string
            { name: 'commercial_terms', type: 'string', isOptional: true }, // JSON string
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
        // Create rfq_vendor_quotes table for vendor responses
        createTable({
          name: 'rfq_vendor_quotes',
          columns: [
            { name: 'rfq_id', type: 'string', isIndexed: true }, // FK to rfqs
            { name: 'vendor_id', type: 'string', isIndexed: true }, // FK to vendors
            { name: 'quote_reference', type: 'string', isOptional: true }, // vendor's quote ref
            { name: 'quoted_price', type: 'number' },
            { name: 'currency', type: 'string' }, // INR, USD, EUR
            { name: 'lead_time_days', type: 'number' },
            { name: 'validity_days', type: 'number' }, // quote validity period
            { name: 'payment_terms', type: 'string', isOptional: true }, // e.g., "30% advance, 70% on delivery"
            { name: 'warranty_months', type: 'number', isOptional: true },
            { name: 'technical_compliance_percentage', type: 'number' }, // 0-100
            { name: 'technical_deviations', type: 'string', isOptional: true }, // JSON array
            { name: 'commercial_deviations', type: 'string', isOptional: true }, // JSON array
            { name: 'notes', type: 'string', isOptional: true },
            { name: 'attachments', type: 'string', isOptional: true }, // JSON array of file paths
            { name: 'status', type: 'string', isIndexed: true }, // submitted, under_review, shortlisted, rejected, awarded
            { name: 'technical_score', type: 'number', isOptional: true }, // 0-100 evaluation score
            { name: 'commercial_score', type: 'number', isOptional: true }, // 0-100 evaluation score
            { name: 'overall_score', type: 'number', isOptional: true }, // weighted score
            { name: 'rank', type: 'number', isOptional: true }, // 1, 2, 3... (L1, L2, L3)
            { name: 'submitted_at', type: 'number', isOptional: true },
            { name: 'evaluated_at', type: 'number', isOptional: true },
            { name: 'evaluated_by_id', type: 'string', isOptional: true, isIndexed: true },
            { name: 'created_at', type: 'number' },
            { name: 'updated_at', type: 'number' },
            { name: 'sync_status', type: 'string' },
            { name: '_version', type: 'number' },
          ],
        }),
      ],
    },
    // v29: Add project_id to users table for supervisor project assignment (v2.9)
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
    // v30: Add Manager role tables - milestones, milestone_progress, purchase_orders (v2.10)
    v30Migration,
    // v31: Add multi-role tables - budgets, costs, invoices + enhancements (v2.11)
    v31Migration,
    // v32: Add vendor_name to invoices table (v2.11 fix)
    v32Migration,
    // v33: Add PDF error tracking to daily_reports (Phase A: Share Button Photo Issue fix)
    v33Migration,
    // v34: Add PDF generation status for async queue (Phase B: Share Button Photo Issue fix)
    v34Migration,
    // v35: Add Key Dates tables (Phase 5a - Planning Key Dates Architecture)
    v35Migration,
    // v36: Add Design Documents tables (Design Engineer - Document Management)
    v36Migration,
    // v37: Add weightage to key_dates for project progress rollup
    v37Migration,
    // v38: Add design_engineer_id to sites for designer assignment
    v38Migration,
    // v39: Add weightage to design_documents for design progress tracking per site
    v39Migration,
    // v40: Add key_date_id to design_documents for Key Date progress tracking
    v40Migration,
    // v41: Add design_weightage to key_dates for dual-track progress
    v41Migration,
    // v42: Add progress_mode to key_dates for project-level milestones
    v42Migration,
    // v43: Add site_id, material_type, engineer_id, received_date, reviewed_date to doors_packages
    v43Migration,
    // v44: Add domains table and domain_id to sites and doors_packages
    v44Migration,
    // v45: Add RFQ compliance breakup + DOORS status transition fields
    v45Migration,
    // v46: Add doors_revisions table for DOORS package revision history
    v46Migration,
    // v47: Add images field to daily_reports for site overview photos
    v47Migration,
    // v48: Add doors_package_id to design_documents for Doc-DOORS linking
    v48Migration,
    // v49: Add change_orders table for Manager change order tracking
    v49Migration,
    // v50: Add design_document_id to items for WBS-DesignDoc linkage
    v50Migration,
    // v51: Add due_date to invoices for explicit payment-terms-aware overdue tracking
    v51Migration,
    // v52: Add KD billing fields to invoices + commercial config fields to projects
    v52Migration,
  ],
});
