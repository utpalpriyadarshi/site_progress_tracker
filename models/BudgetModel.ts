import { Model } from '@nozbe/watermelondb';
import { field, readonly } from '@nozbe/watermelondb/decorators';
import { Associations } from '@nozbe/watermelondb/Model';

export default class BudgetModel extends Model {
  static table = 'budgets';

  static associations: Associations = {
    projects: { type: 'belongs_to', key: 'project_id' },
  };

  @field('project_id') projectId!: string;
  @field('category') category!: string; // 'material' | 'labor' | 'equipment' | 'other'
  @field('allocated_amount') allocatedAmount!: number;
  @field('description') description!: string;
  @field('created_by') createdBy!: string;
  @readonly @field('created_at') createdAt!: number;
  @field('updated_at') updatedAt!: number;
  @field('sync_status') appSyncStatus!: string;
  @field('_version') version!: number;
}
