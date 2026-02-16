import { addColumns } from '@nozbe/watermelondb/Schema/migrations';

/**
 * v45 Migration: RFQ Compliance Breakup + DOORS Status Transition Fields
 *
 * 1. Add domain_id to rfqs for domain-based filtering
 * 2. Add 15 compliance breakup columns to rfq_vendor_quotes (5 categories x 3 counts)
 * 3. Add status transition audit fields to doors_packages
 */
export const v45Migration = {
  toVersion: 45,
  steps: [
    // Add domain_id to rfqs
    addColumns({
      table: 'rfqs',
      columns: [
        { name: 'domain_id', type: 'string' as const, isOptional: true, isIndexed: true },
      ],
    }),
    // Add 15 compliance breakup columns to rfq_vendor_quotes
    addColumns({
      table: 'rfq_vendor_quotes',
      columns: [
        // Technical Requirements
        { name: 'tech_complied', type: 'number' as const, isOptional: true },
        { name: 'tech_complied_with_comments', type: 'number' as const, isOptional: true },
        { name: 'tech_not_complied', type: 'number' as const, isOptional: true },
        // Datasheet
        { name: 'datasheet_complied', type: 'number' as const, isOptional: true },
        { name: 'datasheet_complied_with_comments', type: 'number' as const, isOptional: true },
        { name: 'datasheet_not_complied', type: 'number' as const, isOptional: true },
        // Type Test
        { name: 'type_test_complied', type: 'number' as const, isOptional: true },
        { name: 'type_test_complied_with_comments', type: 'number' as const, isOptional: true },
        { name: 'type_test_not_complied', type: 'number' as const, isOptional: true },
        // Routine Test
        { name: 'routine_test_complied', type: 'number' as const, isOptional: true },
        { name: 'routine_test_complied_with_comments', type: 'number' as const, isOptional: true },
        { name: 'routine_test_not_complied', type: 'number' as const, isOptional: true },
        // Site Requirements
        { name: 'site_req_complied', type: 'number' as const, isOptional: true },
        { name: 'site_req_complied_with_comments', type: 'number' as const, isOptional: true },
        { name: 'site_req_not_complied', type: 'number' as const, isOptional: true },
      ],
    }),
    // Add status transition audit fields to doors_packages
    addColumns({
      table: 'doors_packages',
      columns: [
        { name: 'received_by', type: 'string' as const, isOptional: true },
        { name: 'received_remarks', type: 'string' as const, isOptional: true },
        { name: 'review_observations', type: 'string' as const, isOptional: true },
        { name: 'approved_by', type: 'string' as const, isOptional: true },
        { name: 'approved_date', type: 'number' as const, isOptional: true },
        { name: 'approval_remarks', type: 'string' as const, isOptional: true },
      ],
    }),
  ],
};
