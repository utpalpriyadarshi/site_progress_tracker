import { Model } from '@nozbe/watermelondb';
import { field, readonly } from '@nozbe/watermelondb/decorators';
import { Associations } from '@nozbe/watermelondb/Model';

export default class CostModel extends Model {
  static table = 'costs';

  static associations: Associations = {
    projects: { type: 'belongs_to', key: 'project_id' },
    purchase_orders: { type: 'belongs_to', key: 'po_id' },
  };

  @field('project_id') projectId!: string;
  @field('po_id') poId?: string;
  @field('category') category!: string; // 'material' | 'labor' | 'equipment' | 'other'
  @field('amount') amount!: number;
  @field('description') description!: string;
  @field('cost_date') costDate!: number; // when cost was incurred
  @field('created_by') createdBy!: string;
  @readonly @field('created_at') createdAt!: number;
  @field('updated_at') updatedAt!: number;
  @field('sync_status') appSyncStatus!: string;
  @field('_version') version!: number;
}
