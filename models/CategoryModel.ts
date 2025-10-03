import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';
import { Associations } from '@nozbe/watermelondb/Model';

export default class CategoryModel extends Model {
  static table = 'categories';

  static associations: Associations = {
    materials: { type: 'has_many', foreignKey: 'category_id' },
    items: { type: 'has_many', foreignKey: 'category_id' },
  };

  @field('name') name!: string;
  @field('description') description!: string;
  @field('type') type!: string; // 'material', 'item', 'equipment', etc.
  @field('parent_category_id') parentCategoryId!: string; // For hierarchical categories
  @field('is_active') isActive!: boolean;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}