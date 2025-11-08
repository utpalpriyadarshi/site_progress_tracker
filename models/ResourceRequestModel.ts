import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

export default class ResourceRequestModel extends Model {
  static table = 'resource_requests';

  @field('requested_by') requestedBy!: string; // user_id
  @field('site_id') siteId!: string;
  @field('resource_type') resourceType!: string; // equipment, material, personnel
  @field('resource_name') resourceName!: string;
  @field('quantity') quantity!: number;
  @field('priority') priority!: string; // low, medium, high, urgent
  @field('requested_date') requestedDate!: number; // timestamp
  @field('needed_by_date') neededByDate!: number; // timestamp
  @field('approval_status') approvalStatus!: string; // pending, approved, rejected, fulfilled
  @field('approved_by') approvedBy?: string; // user_id
  @field('approval_date') approvalDate?: number; // timestamp
  @field('rejection_reason') rejectionReason?: string;
  @field('notes') notes?: string;
  @field('sync_status') appSyncStatus!: string; // pending, synced, failed
  @field('_version') version!: number; // conflict resolution version tracking
}
