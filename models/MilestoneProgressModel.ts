import { Model } from '@nozbe/watermelondb';
import { field, readonly } from '@nozbe/watermelondb/decorators';
import { Associations } from '@nozbe/watermelondb/Model';

export default class MilestoneProgressModel extends Model {
  static table = 'milestone_progress';

  static associations: Associations = {
    milestones: { type: 'belongs_to', key: 'milestone_id' },
    sites: { type: 'belongs_to', key: 'site_id' },
    projects: { type: 'belongs_to', key: 'project_id' },
  };

  @field('milestone_id') milestoneId!: string; // belongs to milestone
  @field('site_id') siteId!: string; // site-level tracking
  @field('project_id') projectId!: string; // belongs to project
  @field('progress_percentage') progressPercentage!: number; // 0-100
  @field('status') status!: string; // not_started, in_progress, completed, on_hold
  @field('owner_id') ownerId?: string; // responsible person
  @field('planned_start_date') plannedStartDate?: number;
  @field('planned_end_date') plannedEndDate?: number;
  @field('actual_start_date') actualStartDate?: number;
  @field('actual_end_date') actualEndDate?: number;
  @field('notes') notes?: string;
  @field('updated_by') updatedBy!: string;
  @field('updated_at') updatedAt!: number;
  @field('sync_status') appSyncStatus!: string; // pending, synced, failed - maps to sync_status column
  @field('_version') version!: number; // conflict resolution version tracking
}
