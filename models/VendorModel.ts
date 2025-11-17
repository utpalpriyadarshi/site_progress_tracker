import { Model } from '@nozbe/watermelondb';
import { field, readonly, date } from '@nozbe/watermelondb/decorators';

export default class VendorModel extends Model {
  static table = 'vendors';

  static associations = {
    rfq_vendor_quotes: { type: 'has_many' as const, foreignKey: 'vendor_id' },
  };

  @field('vendor_code') vendorCode!: string;
  @field('vendor_name') vendorName!: string;
  @field('category') category!: string;
  @field('contact_person') contactPerson?: string;
  @field('email') email?: string;
  @field('phone') phone?: string;
  @field('address') address?: string;
  @field('rating') rating?: number;
  @field('is_approved') isApproved!: boolean;
  @field('performance_score') performanceScore?: number;
  @field('last_delivery_date') lastDeliveryDate?: number;
  @field('total_orders') totalOrders!: number;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
  @field('sync_status') appSyncStatus!: string;
  @field('_version') version!: number;
}
