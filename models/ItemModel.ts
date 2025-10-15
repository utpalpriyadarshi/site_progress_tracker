import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, relation } from '@nozbe/watermelondb/decorators';
import { Associations } from '@nozbe/watermelondb/Model';

export default class ItemModel extends Model {
  static table = 'items';

  static associations: Associations = {
    categories: { type: 'belongs_to', key: 'category_id' },
    sites: { type: 'belongs_to', key: 'site_id' },
    progress_logs: { type: 'has_many', foreignKey: 'item_id' },
    materials: { type: 'has_many', foreignKey: 'item_id' },
    hindrances: { type: 'has_many', foreignKey: 'item_id' },
    schedule_revisions: { type: 'has_many', foreignKey: 'item_id' },
  };

  @field('name') name!: string;
  @field('category_id') categoryId!: string; // belongs to category
  @field('site_id') siteId!: string; // belongs to site
  @field('planned_quantity') plannedQuantity!: number;
  @field('completed_quantity') completedQuantity!: number;
  @field('unit_of_measurement') unitOfMeasurement!: string;
  @field('planned_start_date') plannedStartDate!: number; // timestamp
  @field('planned_end_date') plannedEndDate!: number; // timestamp
  @field('status') status!: string; // not_started, in_progress, completed
  @field('weightage') weightage!: number; // percentage of total project

  // Planning module fields (v11)
  @field('baseline_start_date') baselineStartDate?: number;
  @field('baseline_end_date') baselineEndDate?: number;
  @field('dependencies') dependencies?: string; // JSON array of item IDs
  @field('is_baseline_locked') isBaselineLocked!: boolean;
  @field('actual_start_date') actualStartDate?: number;
  @field('actual_end_date') actualEndDate?: number;
  @field('critical_path_flag') criticalPathFlag?: boolean;

  // Helper methods for dependencies
  getDependencies(): string[] {
    if (!this.dependencies) return [];
    try {
      return JSON.parse(this.dependencies);
    } catch {
      return [];
    }
  }

  setDependencies(deps: string[]): string {
    return JSON.stringify(deps);
  }

  // Calculate schedule variance (in days)
  getScheduleVariance(): number {
    if (!this.actualEndDate || !this.plannedEndDate) return 0;
    return Math.floor((this.actualEndDate - this.plannedEndDate) / (1000 * 60 * 60 * 24));
  }

  // Calculate planned duration (in days)
  getPlannedDuration(): number {
    return Math.floor((this.plannedEndDate - this.plannedStartDate) / (1000 * 60 * 60 * 24));
  }

  // Calculate actual duration (in days)
  getActualDuration(): number {
    if (!this.actualEndDate || !this.actualStartDate) return 0;
    return Math.floor((this.actualEndDate - this.actualStartDate) / (1000 * 60 * 60 * 24));
  }

  // Calculate baseline variance (in days)
  getBaselineVariance(): number {
    if (!this.baselineEndDate || !this.plannedEndDate) return 0;
    return Math.floor((this.plannedEndDate - this.baselineEndDate) / (1000 * 60 * 60 * 24));
  }

  // Get progress percentage
  getProgressPercentage(): number {
    if (this.plannedQuantity === 0) return 0;
    return Math.min(100, (this.completedQuantity / this.plannedQuantity) * 100);
  }
}