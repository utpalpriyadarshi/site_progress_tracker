import { Model } from '@nozbe/watermelondb';
import { field, readonly } from '@nozbe/watermelondb/decorators';
import { Associations } from '@nozbe/watermelondb/Model';

export default class PurchaseOrderModel extends Model {
  static table = 'purchase_orders';

  static associations: Associations = {
    rfqs: { type: 'belongs_to', key: 'rfq_id' },
    vendors: { type: 'belongs_to', key: 'vendor_id' },
    doors_packages: { type: 'belongs_to', key: 'doors_package_id' },
    projects: { type: 'belongs_to', key: 'project_id' },
  };

  @field('po_number') poNumber!: string; // PO-2025-001
  @field('rfq_id') rfqId!: string; // linked RFQ
  @field('vendor_id') vendorId!: string;
  @field('doors_package_id') doorsPackageId?: string;
  @field('project_id') projectId!: string;
  @field('po_date') poDate!: number;
  @field('po_value') poValue!: number;
  @field('currency') currency!: string; // INR, USD, EUR
  @field('payment_terms') paymentTerms?: string;
  @field('delivery_terms') deliveryTerms?: string;
  @field('expected_delivery_date') expectedDeliveryDate?: number;
  @field('actual_delivery_date') actualDeliveryDate?: number;
  @field('status') status!: string; // draft, issued, in_progress, delivered, closed, cancelled
  @field('items_details') itemsDetails!: string; // JSON array of PO line items
  @field('terms_conditions') termsConditions?: string;
  @field('notes') notes?: string;
  @field('created_by_id') createdById!: string;
  @field('approved_by_id') approvedById?: string;
  @readonly @field('created_at') createdAt!: number;
  @field('updated_at') updatedAt!: number;
  @field('sync_status') appSyncStatus!: string; // pending, synced, failed - maps to sync_status column
  @field('_version') version!: number; // conflict resolution version tracking

  // Helper method to parse items details
  getItemsDetails(): any[] {
    try {
      return JSON.parse(this.itemsDetails);
    } catch {
      return [];
    }
  }

  // Helper method to set items details
  setItemsDetails(items: any[]): string {
    return JSON.stringify(items);
  }
}
