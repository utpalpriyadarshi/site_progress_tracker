import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';
import { Associations } from '@nozbe/watermelondb/Model';

export default class CategoryModel extends Model {
  static table = 'categories';

  static associations: Associations = {
    items: { type: 'has_many', foreignKey: 'category_id' },
  };

  @field('name') name!: string;
  @field('description') description!: string;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}