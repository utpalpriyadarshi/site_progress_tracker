import { Model } from '@nozbe/watermelondb';
import { field, relation } from '@nozbe/watermelondb/decorators';
import { Associations } from '@nozbe/watermelondb/Model';

/**
 * ChangeOrderModel - Manager change order tracking
 *
 * Status workflow: draft → submitted → approved / rejected
 * Impact fields use signed numbers:
 *   - impact_cost: positive = cost increase, negative = saving
 *   - impact_days: positive = delay, negative = acceleration
 */
export default class ChangeOrderModel extends Model {
  static table = 'change_orders';

  static associations: Associations = {
    projects: { type: 'belongs_to', key: 'project_id' },
  };

  @field('project_id') projectId!: string;
  @field('title') title!: string;
  @field('description') description?: string;
  @field('impact_cost') impactCost!: number;
  @field('impact_days') impactDays!: number;
  @field('status') status!: string; // draft | submitted | approved | rejected
  @field('submitted_by_id') submittedById?: string;
  @field('approved_by_id') approvedById?: string;
  @field('submitted_at') submittedAt?: number;
  @field('approved_at') approvedAt?: number;
  @field('created_by') createdBy!: string;
  @field('created_at') createdAt!: number;
  @field('updated_at') updatedAt!: number;
  @field('sync_status') appSyncStatus!: string;
  @field('_version') version!: number;

  @relation('projects', 'project_id') project: any;

  getStatusColor(): string {
    const colors: Record<string, string> = {
      draft: '#9E9E9E',
      submitted: '#2196F3',
      approved: '#4CAF50',
      rejected: '#F44336',
    };
    return colors[this.status] || '#9E9E9E';
  }
}
