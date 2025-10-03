import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, relation } from '@nozbe/watermelondb/decorators';
import { Associations } from '@nozbe/watermelondb/Model';

export default class MaterialModel extends Model {
  static table = 'materials';

  static associations: Associations = {
    item: { type: 'belongs_to', key: 'item_id' },
    procurement_manager: { type: 'belongs_to', key: 'procurement_manager_id' }, // managed by procurement
  };

  @field('name') name!: string;
  @field('item_id') itemId!: string; // belongs to item
  @field('quantity_required') quantityRequired!: number;
  @field('quantity_available') quantityAvailable!: number;
  @field('quantity_used') quantityUsed!: number;
  @field('unit') unit!: string;
  @field('status') status!: string; // ordered, delivered, in_use, shortage
  @field('supplier') supplier!: string;
  @field('procurement_manager_id') procurementManagerId!: string; // managed by

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}