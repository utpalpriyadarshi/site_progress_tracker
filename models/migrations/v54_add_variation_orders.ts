import { createTable } from '@nozbe/watermelondb/Schema/migrations';

/**
 * v54: Add variation_orders table for Variation Order (VO) tracking
 * Sprint 3 — Commercial Advanced Billing
 */
export const v54Migration = {
  toVersion: 54,
  steps: [
    createTable({
      name: 'variation_orders',
      columns: [
        { name: 'project_id', type: 'string', isIndexed: true },
        { name: 'vo_number', type: 'string', isIndexed: true },     // e.g., "VO-007"
        { name: 'description', type: 'string' },
        { name: 'value', type: 'number' },                           // VO value in INR
        { name: 'approval_status', type: 'string', isIndexed: true }, // pending | approved | rejected | under_review
        { name: 'execution_pct', type: 'number' },                   // 0–100
        { name: 'billable_amount', type: 'number' },                 // stored: value × execution_pct / 100
        { name: 'revenue_at_risk', type: 'number' },                 // stored: value if not approved, else 0
        { name: 'margin_impact', type: 'number' },                   // margin delta in INR
        { name: 'include_in_next_ipc', type: 'boolean' },
        { name: 'linked_kd_id', type: 'string', isOptional: true, isIndexed: true },
        { name: 'raised_date', type: 'number' },
        { name: 'approved_date', type: 'number', isOptional: true },
        { name: 'notes', type: 'string', isOptional: true },
        { name: 'created_by', type: 'string', isIndexed: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        { name: 'sync_status', type: 'string' },
        { name: '_version', type: 'number' },
      ],
    }),
  ],
};
