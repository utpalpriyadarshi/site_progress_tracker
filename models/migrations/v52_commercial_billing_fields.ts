import { addColumns } from '@nozbe/watermelondb/Schema/migrations';

/**
 * v52: Add KD billing fields to invoices + commercial config fields to projects
 *
 * invoices — billing breakdown for IPC / KD-based billing:
 *   gross_amount       Raw billable amount (contract_value × KD weightage)
 *   retention_deducted Retention held this bill (gross × retention_pct)
 *   advance_recovered  Advance recovery deducted this bill
 *   ld_deducted        Liquidated Damages deducted this bill
 *   tds_deducted       TDS and other statutory deductions
 *   net_amount         Final payable (gross − all deductions)
 *   key_date_id        FK → key_dates (which KD triggered this IPC)
 *   invoice_type       'client_billing' | 'vendor_payment' | 'ipc' | 'other'
 *   ipc_number         IPC serial number within project
 *   cumulative_billed  Running total billed including this invoice
 *
 * projects — commercial configuration:
 *   contract_value     Total contract value (INR)
 *   commencement_date  Project commencement date (timestamp) for LD calculation
 *   advance_mobilization Mobilization advance received (INR)
 *   advance_recovery_pct % of each running bill to recover as advance
 *   retention_pct      Retention % per bill (default 5)
 *   dlp_months         Defect Liability Period in months
 */
export const v52Migration = {
  toVersion: 52,
  steps: [
    addColumns({
      table: 'invoices',
      columns: [
        { name: 'gross_amount', type: 'number', isOptional: true },
        { name: 'retention_deducted', type: 'number', isOptional: true },
        { name: 'advance_recovered', type: 'number', isOptional: true },
        { name: 'ld_deducted', type: 'number', isOptional: true },
        { name: 'tds_deducted', type: 'number', isOptional: true },
        { name: 'net_amount', type: 'number', isOptional: true },
        { name: 'key_date_id', type: 'string', isOptional: true, isIndexed: true },
        { name: 'invoice_type', type: 'string', isOptional: true },
        { name: 'ipc_number', type: 'number', isOptional: true },
        { name: 'cumulative_billed', type: 'number', isOptional: true },
      ],
    }),
    addColumns({
      table: 'projects',
      columns: [
        { name: 'contract_value', type: 'number', isOptional: true },
        { name: 'commencement_date', type: 'number', isOptional: true },
        { name: 'advance_mobilization', type: 'number', isOptional: true },
        { name: 'advance_recovery_pct', type: 'number', isOptional: true },
        { name: 'retention_pct', type: 'number', isOptional: true },
        { name: 'dlp_months', type: 'number', isOptional: true },
      ],
    }),
  ],
};
