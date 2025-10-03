import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, relation } from '@nozbe/watermelondb/decorators';
import { Associations } from '@nozbe/watermelondb/Model';

export default class HindranceModel extends Model {
  static table = 'hindrances';

  static associations: Associations = {
    project: { type: 'belongs_to', key: 'project_id' },
    task: { type: 'belongs_to', key: 'task_id' },
    site: { type: 'belongs_to', key: 'site_id' },
    reporter: { type: 'belongs_to', key: 'reporter_id' },
  };

  @field('project_id') projectId!: string;
  @field('task_id') taskId!: string;
  @field('site_id') siteId!: string;
  @field('reporter_id') reporterId!: string; // Who reported the hindrance (supervisor, worker, etc.)
  @field('title') title!: string;
  @field('description') description!: string;
  @field('type') type!: string; // weather, supply_shortage, equipment_failure, labor_shortage, permit_issue, etc.
  @field('severity') severity!: string; // low, medium, high, critical
  @field('status') status!: string; // reported, acknowledged, in_progress, resolved, escalated
  @date('reported_date') reportedDate!: Date;
  @date('resolved_date') resolvedDate!: Date;
  @field('estimated_resolution_date') estimatedResolutionDate!: Date;
  @field('impact_on_schedule') impactOnSchedule!: number; // Days of delay in number
  @field('cost_impact') costImpact!: number; // Additional cost in number
  @field('affected_resources') affectedResources!: string; // Comma-separated list of affected resources
  @field('resolution_notes') resolutionNotes!: string;
  @field('assigned_to') assignedTo!: string; // Who is responsible for resolving

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}