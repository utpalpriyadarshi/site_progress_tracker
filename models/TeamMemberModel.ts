import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';
import { Associations } from '@nozbe/watermelondb/Model';

export default class TeamMemberModel extends Model {
  static table = 'team_members';

  static associations: Associations = {
    team: { type: 'belongs_to', key: 'team_id' },
  };

  @field('team_id') teamId!: string;
  @field('user_id') userId!: string; // reference to user
  @field('role') role!: string; // lead, supervisor, worker
  @field('assigned_date') assignedDate!: number; // timestamp
  @field('end_date') endDate?: number; // timestamp (null if currently active)
  @field('status') status!: string; // active, inactive, transferred
  @field('sync_status') appSyncStatus!: string; // pending, synced, failed
  @field('_version') version!: number; // conflict resolution version tracking
}
