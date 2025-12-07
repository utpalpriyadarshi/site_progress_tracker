import { Model } from '@nozbe/watermelondb';
import { field, readonly } from '@nozbe/watermelondb/decorators';
import { Associations } from '@nozbe/watermelondb/Model';

export default class MilestoneModel extends Model {
  static table = 'milestones';

  static associations: Associations = {
    projects: { type: 'belongs_to', key: 'project_id' },
    milestone_progress: { type: 'has_many', foreignKey: 'milestone_id' },
    items: { type: 'has_many', foreignKey: 'milestone_id' },
  };

  @field('project_id') projectId!: string; // belongs to project
  @field('milestone_code') milestoneCode!: string; // PM100, PM200, etc.
  @field('milestone_name') milestoneName!: string; // "Requirements Management"
  @field('description') description?: string;
  @field('sequence_order') sequenceOrder!: number; // 1, 2, 3...
  @field('weightage') weightage!: number; // % weightage for progress calc
  @field('is_active') isActive!: boolean;
  @field('is_custom') isCustom!: boolean; // true if added by manager
  @field('created_by') createdBy!: string;
  @readonly @field('created_at') createdAt!: number;
  @field('updated_at') updatedAt!: number;
  @field('sync_status') appSyncStatus!: string; // pending, synced, failed - maps to sync_status column
  @field('_version') version!: number; // conflict resolution version tracking
}
