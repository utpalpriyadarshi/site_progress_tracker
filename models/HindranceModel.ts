import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, relation } from '@nozbe/watermelondb/decorators';
import { Associations } from '@nozbe/watermelondb/Model';

export default class HindranceModel extends Model {
  static table = 'hindrances';

  static associations: Associations = {
    item: { type: 'belongs_to', key: 'item_id' },
    site: { type: 'belongs_to', key: 'site_id' },
    assigned_user: { type: 'belongs_to', key: 'assigned_to' }, // assigned to user
  };

  @field('title') title!: string;
  @field('description') description!: string;
  @field('item_id') itemId!: string; // belongs to item (optional: could be for site)
  @field('site_id') siteId!: string; // belongs to site (optional: if not related to item)
  @field('priority') priority!: string; // low, medium, high
  @field('status') status!: string; // open, in_progress, resolved, closed
  @field('assigned_to') assignedTo!: string; // user ID
  @field('reported_by') reportedBy!: string; // user ID
}