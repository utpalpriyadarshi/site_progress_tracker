import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, relation } from '@nozbe/watermelondb/decorators';
import { Associations } from '@nozbe/watermelondb/Model';

export default class TaskModel extends Model {
  static table = 'tasks';

  static associations: Associations = {
    project: { type: 'belongs_to', key: 'project_id' },
    progress_reports: { type: 'has_many', foreignKey: 'task_id' },
    progress_logs: { type: 'has_many', foreignKey: 'task_id' },
    hindrances: { type: 'has_many', foreignKey: 'task_id' },
  };

  @field('project_id') projectId!: string;
  @field('name') name!: string;
  @field('description') description!: string;
  @field('status') status!: string; // not_started, in_progress, completed
  @field('priority') priority!: string; // low, medium, high
  @date('start_date') startDate!: Date;
  @date('end_date') endDate!: Date;
  @field('assigned_to') assignedTo!: string; // supervisor id
  @field('estimated_hours') estimatedHours!: number;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}