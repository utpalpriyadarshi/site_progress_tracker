import { Model } from '@nozbe/watermelondb';
import { field, readonly, relation } from '@nozbe/watermelondb/decorators';
import { Associations } from '@nozbe/watermelondb/Model';

export type InvoiceType = 'client_billing' | 'vendor_payment' | 'ipc' | 'other';

export default class InvoiceModel extends Model {
  static table = 'invoices';

  static associations: Associations = {
    projects: { type: 'belongs_to', key: 'project_id' },
    purchase_orders: { type: 'belongs_to', key: 'po_id' },
    vendors: { type: 'belongs_to', key: 'vendor_id' },
    key_dates: { type: 'belongs_to', key: 'key_date_id' },
  };

  // Core fields
  @field('project_id') projectId!: string;
  @field('po_id') poId!: string;
  @field('invoice_number') invoiceNumber!: string;
  @field('invoice_date') invoiceDate!: number;
  @field('amount') amount!: number;
  @field('payment_status') paymentStatus!: string; // 'pending' | 'paid'
  @field('due_date') dueDate?: number; // explicit payment due date (v51)
  @field('payment_date') paymentDate?: number;
  @field('vendor_id') vendorId!: string;
  @field('vendor_name') vendorName?: string;
  @field('created_by') createdBy!: string;
  @readonly @field('created_at') createdAt!: number;
  @field('updated_at') updatedAt!: number;
  @field('sync_status') appSyncStatus!: string;
  @field('_version') version!: number;

  // v52: KD billing breakdown
  @field('gross_amount') grossAmount?: number;
  @field('retention_deducted') retentionDeducted?: number;
  @field('advance_recovered') advanceRecovered?: number;
  @field('ld_deducted') ldDeducted?: number;
  @field('tds_deducted') tdsDeducted?: number;
  @field('net_amount') netAmount?: number;
  @field('key_date_id') keyDateId?: string;
  @field('invoice_type') invoiceType?: InvoiceType;
  @field('ipc_number') ipcNumber?: number;
  @field('cumulative_billed') cumulativeBilled?: number;

  // Relations
  @relation('key_dates', 'key_date_id') keyDate: any;

  // ==================== Helpers ====================

  /** Net amount after all deductions. Falls back to `amount` for legacy records. */
  getNetAmount(): number {
    if (this.netAmount != null) return this.netAmount;
    return this.amount;
  }

  /** True if this invoice was created from a Key Date billing event. */
  isKDBilling(): boolean {
    return !!this.keyDateId || this.invoiceType === 'client_billing' || this.invoiceType === 'ipc';
  }

  /** Total deductions on this invoice. */
  getTotalDeductions(): number {
    return (
      (this.retentionDeducted ?? 0) +
      (this.advanceRecovered ?? 0) +
      (this.ldDeducted ?? 0) +
      (this.tdsDeducted ?? 0)
    );
  }
}
