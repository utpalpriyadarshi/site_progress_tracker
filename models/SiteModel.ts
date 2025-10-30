import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, relation } from '@nozbe/watermelondb/decorators';
import { Associations } from '@nozbe/watermelondb/Model';

export default class SiteModel extends Model {
  static table = 'sites';

  static associations: Associations = {
    project: { type: 'belongs_to', key: 'project_id' },
    items: { type: 'has_many', foreignKey: 'site_id' },
    hindrances: { type: 'has_many', foreignKey: 'site_id' },
  };

  @field('name') name!: string;
  @field('location') location!: string;
  @field('project_id') projectId!: string; // belongs to project
  @field('supervisor_id') supervisorId?: string; // assigned supervisor (optional, can be null)
  @field('sync_status') syncStatus!: string; // pending, synced, failed
}