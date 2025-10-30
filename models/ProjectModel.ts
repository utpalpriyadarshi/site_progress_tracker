import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';
import { Associations } from '@nozbe/watermelondb/Model';

export default class ProjectModel extends Model {
  static table = 'projects';

  static associations: Associations = {
    sites: { type: 'has_many', foreignKey: 'project_id' },
  };

  @field('name') name!: string;
  @field('client') client!: string;
  @field('start_date') startDate!: number; // timestamp
  @field('end_date') endDate!: number; // timestamp
  @field('status') status!: string; // active, completed, on_hold, cancelled
  @field('budget') budget!: number;
  @field('sync_status') syncStatus!: string; // pending, synced, failed
  @field('_version') version!: number; // conflict resolution version tracking
}