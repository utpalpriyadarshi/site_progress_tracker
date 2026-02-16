import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';
import { Associations } from '@nozbe/watermelondb/Model';

export default class SiteModel extends Model {
  static table = 'sites';

  static associations: Associations = {
    project: { type: 'belongs_to', key: 'project_id' },
    domain: { type: 'belongs_to', key: 'domain_id' },
    items: { type: 'has_many', foreignKey: 'site_id' },
    hindrances: { type: 'has_many', foreignKey: 'site_id' },
  };

  @field('name') name!: string;
  @field('location') location!: string;
  @field('project_id') projectId!: string; // belongs to project
  @field('domain_id') domainId?: string; // belongs to domain (v44)
  @field('supervisor_id') supervisorId?: string; // assigned supervisor (optional, can be null)
  @field('design_engineer_id') designEngineerId?: string; // assigned design engineer (optional, can be null)
  // v2.11: Planning Engineer role - site schedule dates
  @field('planned_start_date') plannedStartDate?: number;
  @field('planned_end_date') plannedEndDate?: number;
  @field('actual_start_date') actualStartDate?: number;
  @field('actual_end_date') actualEndDate?: number;
  @field('sync_status') appSyncStatus!: string; // pending, synced, failed - maps to sync_status column
  @field('_version') version!: number; // conflict resolution version tracking
}