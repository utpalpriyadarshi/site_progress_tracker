import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, relation } from '@nozbe/watermelondb/decorators';
import { Associations } from '@nozbe/watermelondb/Model';

export default class ProgressReportModel extends Model {
  static table = 'progress_reports';

  static associations: Associations = {
    project: { type: 'belongs_to', key: 'project_id' },
    task: { type: 'belongs_to', key: 'task_id' },
    supervisor: { type: 'belongs_to', key: 'supervisor_id' },
  };

  @field('project_id') projectId!: string;
  @field('task_id') taskId!: string;
  @field('supervisor_id') supervisorId!: string;
  @date('report_date') reportDate!: Date;
  @field('progress_percentage') progressPercentage!: number;
  @field('work_completed') workCompleted!: string;
  @field('issues_identified') issuesIdentified!: string;
  @field('weather_conditions') weatherConditions!: string;
  @field('next_day_plan') nextDayPlan!: string;
  @field('photos_count') photosCount!: number;
  @field('status') status!: string; // draft, submitted, approved

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}