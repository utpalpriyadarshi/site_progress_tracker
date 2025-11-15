import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';
import { Associations } from '@nozbe/watermelondb/Model';

export default class TeamModel extends Model {
  static table = 'teams';

  static associations: Associations = {
    site: { type: 'belongs_to', key: 'site_id' },
    members: { type: 'has_many', foreignKey: 'team_id' },
  };

  @field('name') name!: string;
  @field('site_id') siteId!: string;
  @field('team_lead_id') teamLeadId?: string;
  @field('created_date') createdDate!: number; // timestamp
  @field('status') status!: string; // active, inactive, disbanded
  @field('specialization') specialization?: string; // electrical, plumbing, carpentry, etc.
  @field('sync_status') appSyncStatus!: string; // pending, synced, failed
  @field('_version') version!: number; // conflict resolution version tracking
}
