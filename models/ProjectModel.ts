import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';
import { Associations } from '@nozbe/watermelondb/Model';

export default class ProjectModel extends Model {
  static table = 'projects';

  static associations: Associations = {
    tasks: { type: 'has_many', foreignKey: 'project_id' },
    materials: { type: 'has_many', foreignKey: 'project_id' },
    progress_reports: { type: 'has_many', foreignKey: 'project_id' },
  };

  @field('name') name!: string;
  @field('description') description!: string;
  @field('location') location!: string;
  @field('status') status!: string; // active, completed, on_hold
  @date('start_date') startDate!: Date;
  @date('end_date') endDate!: Date;
  @field('budget') budget!: number;
  @field('manager_id') managerId!: string;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}