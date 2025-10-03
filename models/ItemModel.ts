import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, relation } from '@nozbe/watermelondb/decorators';
import { Associations } from '@nozbe/watermelondb/Model';

export default class ItemModel extends Model {
  static table = 'items';

  static associations: Associations = {
    category: { type: 'belongs_to', key: 'category_id' },
    project: { type: 'belongs_to', key: 'project_id' },
    site: { type: 'belongs_to', key: 'site_id' },
  };

  @field('category_id') categoryId!: string;
  @field('project_id') projectId!: string;
  @field('site_id') siteId!: string;
  @field('name') name!: string;
  @field('description') description!: string;
  @field('item_code') itemCode!: string; // Unique identifier for the item
  @field('unit') unit!: string; // kg, m³, pieces, etc.
  @field('quantity_available') quantityAvailable!: number;
  @field('quantity_reserved') quantityReserved!: number;
  @field('quantity_used') quantityUsed!: number;
  @field('unit_cost') unitCost!: number;
  @field('status') status!: string; // in_stock, reserved, in_use, out_of_stock
  @field('supplier') supplier!: string;
  @date('delivery_date') deliveryDate!: Date;
  @field('location') location!: string; // Where the item is stored on site

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}