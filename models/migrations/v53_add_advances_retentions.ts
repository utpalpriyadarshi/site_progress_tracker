import { createTable } from '@nozbe/watermelondb/Schema/migrations';

/**
 * v53: Add advances and retentions tables for Sprint 2
 *
 * advances — mobilization/performance advances issued to/from the project:
 *   advance_type         'mobilization' | 'performance' | 'material'
 *   advance_amount       Total advance amount (INR)
 *   recovery_pct         % of each running bill to recover
 *   total_recovered      Running total already recovered (updated per IPC)
 *   issued_date          When advance was issued (timestamp)
 *   fully_recovered_date When fully recovered (timestamp, optional)
 *   notes                Free-form notes
 *
 * retentions — per-invoice retention records for audit trail:
 *   invoice_id           FK → invoices (the IPC that generated this retention)
 *   party_type           'client' (they hold from us) | 'vendor' (we hold from them)
 *   party_id             Vendor/client ID (optional)
 *   gross_invoice_amount Gross amount of the linked invoice
 *   retention_pct        % applied
 *   retention_amount     Amount held (gross × pct / 100)
 *   dlp_end_date         When DLP expires and retention becomes releasable
 *   released_date        When retention was released (optional)
 *   released_amount      Amount actually released (may be < retention if partial)
 *   bg_in_lieu           True if Bank Guarantee substituted for cash retention
 *   bg_reference         BG number/reference
 */
export const v53Migration = {
  toVersion: 53,
  steps: [
    createTable({
      name: 'advances',
      columns: [
        { name: 'project_id', type: 'string', isIndexed: true },
        { name: 'advance_type', type: 'string', isIndexed: true }, // mobilization | performance | material
        { name: 'advance_amount', type: 'number' },
        { name: 'recovery_pct', type: 'number' },
        { name: 'total_recovered', type: 'number' },
        { name: 'issued_date', type: 'number' },
        { name: 'fully_recovered_date', type: 'number', isOptional: true },
        { name: 'notes', type: 'string', isOptional: true },
        { name: 'created_by', type: 'string', isIndexed: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        { name: 'sync_status', type: 'string' },
        { name: '_version', type: 'number' },
      ],
    }),
    createTable({
      name: 'retentions',
      columns: [
        { name: 'project_id', type: 'string', isIndexed: true },
        { name: 'invoice_id', type: 'string', isIndexed: true },
        { name: 'party_type', type: 'string', isIndexed: true }, // client | vendor
        { name: 'party_id', type: 'string', isOptional: true, isIndexed: true },
        { name: 'gross_invoice_amount', type: 'number' },
        { name: 'retention_pct', type: 'number' },
        { name: 'retention_amount', type: 'number' },
        { name: 'dlp_end_date', type: 'number', isOptional: true },
        { name: 'released_date', type: 'number', isOptional: true },
        { name: 'released_amount', type: 'number', isOptional: true },
        { name: 'bg_in_lieu', type: 'boolean' },
        { name: 'bg_reference', type: 'string', isOptional: true },
        { name: 'created_by', type: 'string', isIndexed: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        { name: 'sync_status', type: 'string' },
        { name: '_version', type: 'number' },
      ],
    }),
  ],
};
