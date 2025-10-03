import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, relation } from '@nozbe/watermelondb/decorators';
import { Associations } from '@nozbe/watermelondb/Model';

export default class ItemModel extends Model {
  static table = 'items';

  static associations: Associations = {
    category: { type: 'belongs_to', key: 'category_id' },
    site: { type: 'belongs_to', key: 'site_id' },
    progress_logs: { type: 'has_many', foreignKey: 'item_id' },
    materials: { type: 'has_many', foreignKey: 'item_id' },
    hindrances: { type: 'has_many', foreignKey: 'item_id' },
  };

  @field('name') name!: string;
  @field('category_id') categoryId!: string; // belongs to category
  @field('site_id') siteId!: string; // belongs to site
  @field('planned_quantity') plannedQuantity!: number;
  @field('completed_quantity') completedQuantity!: number;
  @field('unit_of_measurement') unitOfMeasurement!: string;
  @date('planned_start_date') plannedStartDate!: Date;
  @date('planned_end_date') plannedEndDate!: Date;
  @field('status') status!: string; // not_started, in_progress, completed
  @field('weightage') weightage!: number; // percentage of total project

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}