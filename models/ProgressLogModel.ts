import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, relation } from '@nozbe/watermelondb/decorators';
import { Associations } from '@nozbe/watermelondb/Model';

export default class ProgressLogModel extends Model {
  static table = 'progress_logs';

  static associations: Associations = {
    project: { type: 'belongs_to', key: 'project_id' },
    task: { type: 'belongs_to', key: 'task_id' },
    site: { type: 'belongs_to', key: 'site_id' },
    supervisor: { type: 'belongs_to', key: 'supervisor_id' },
  };

  @field('project_id') projectId!: string;
  @field('task_id') taskId!: string;
  @field('site_id') siteId!: string;
  @field('supervisor_id') supervisorId!: string;
  @date('log_date') logDate!: Date;
  @field('progress_percentage') progressPercentage!: number;
  @field('work_completed') workCompleted!: string;
  @field('work_planned') workPlanned!: string;
  @field('actual_vs_planned') actualVsPlanned!: string; // Description of difference from plan
  @field('weather_conditions') weatherConditions!: string;
  @field('personnel_count') personnelCount!: number;
  @field('equipment_used') equipmentUsed!: string; // Comma-separated list
  @field('safety_incidents') safetyIncidents!: string;
  @field('quality_issues') qualityIssues!: string;
  @field('materials_used') materialsUsed!: string; // Comma-separated list of materials and quantities
  @field('next_day_plan') nextDayPlan!: string;
  @field('photos_count') photosCount!: number;
  @field('notes') notes!: string;
  @field('status') status!: string; // draft, submitted, reviewed, approved

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}