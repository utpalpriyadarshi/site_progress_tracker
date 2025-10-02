import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, relation } from '@nozbe/watermelondb/decorators';
import { Associations } from '@nozbe/watermelondb/Model';

export default class MaterialModel extends Model {
  static table = 'materials';

  static associations: Associations = {
    project: { type: 'belongs_to', key: 'project_id' },
    material_logs: { type: 'has_many', foreignKey: 'material_id' },
  };

  @field('project_id') projectId!: string;
  @field('name') name!: string;
  @field('description') description!: string;
  @field('category') category!: string; // concrete, steel, wood, etc.
  @field('unit') unit!: string; // kg, m³, pieces, etc.
  @field('quantity_required') quantityRequired!: number;
  @field('quantity_available') quantityAvailable!: number;
  @field('quantity_used') quantityUsed!: number;
  @field('unit_cost') unitCost!: number;
  @field('status') status!: string; // ordered, delivered, in_use, shortage
  @date('delivery_date') deliveryDate!: Date;
  @field('supplier') supplier!: string;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}