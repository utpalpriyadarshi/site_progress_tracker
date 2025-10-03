import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';
import { Associations } from '@nozbe/watermelondb/Model';

export default class ProjectModel extends Model {
  static table = 'projects';

  static associations: Associations = {
    sites: { type: 'has_many', foreignKey: 'project_id' },
  };

  @field('name') name!: string;
  @field('client') client!: string;
  @date('start_date') startDate!: Date;
  @date('end_date') endDate!: Date;
  @field('status') status!: string; // active, completed, on_hold, cancelled
  @field('budget') budget!: number;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}