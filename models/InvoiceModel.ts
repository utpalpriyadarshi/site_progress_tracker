import { Model } from '@nozbe/watermelondb';
import { field, readonly } from '@nozbe/watermelondb/decorators';
import { Associations } from '@nozbe/watermelondb/Model';

export default class InvoiceModel extends Model {
  static table = 'invoices';

  static associations: Associations = {
    projects: { type: 'belongs_to', key: 'project_id' },
    purchase_orders: { type: 'belongs_to', key: 'po_id' },
    vendors: { type: 'belongs_to', key: 'vendor_id' },
  };

  @field('project_id') projectId!: string;
  @field('po_id') poId!: string;
  @field('invoice_number') invoiceNumber!: string;
  @field('invoice_date') invoiceDate!: number;
  @field('amount') amount!: number;
  @field('payment_status') paymentStatus!: string; // 'pending' | 'paid'
  @field('payment_date') paymentDate?: number;
  @field('vendor_id') vendorId!: string;
  @field('vendor_name') vendorName?: string; // Manual vendor name entry
  @field('created_by') createdBy!: string;
  @readonly @field('created_at') createdAt!: number;
  @field('updated_at') updatedAt!: number;
  @field('sync_status') appSyncStatus!: string;
  @field('_version') version!: number;
}
