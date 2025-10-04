import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, relation } from '@nozbe/watermelondb/decorators';
import { Associations } from '@nozbe/watermelondb/Model';

export default class ProgressLogModel extends Model {
  static table = 'progress_logs';

  static associations: Associations = {
    item: { type: 'belongs_to', key: 'item_id' },
    user: { type: 'belongs_to', key: 'reported_by' }, // recorded by user
  };

  @field('item_id') itemId!: string; // belongs to item
  @field('date') date!: number; // timestamp
  @field('completed_quantity') completedQuantity!: number;
  @field('reported_by') reportedBy!: string; // user ID
  @field('photos') photos!: string; // JSON string of photo paths
  @field('notes') notes!: string;
  @field('sync_status') syncStatusField!: string; // pending, synced, failed
}