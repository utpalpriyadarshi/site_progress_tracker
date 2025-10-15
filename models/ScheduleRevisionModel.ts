import { Model } from '@nozbe/watermelondb';
import { field, relation } from '@nozbe/watermelondb/decorators';
import { Associations } from '@nozbe/watermelondb/Model';

export default class ScheduleRevisionModel extends Model {
  static table = 'schedule_revisions';

  static associations: Associations = {
    items: { type: 'belongs_to', key: 'item_id' },
  };

  @field('item_id') itemId!: string;
  @field('old_start_date') oldStartDate!: number;
  @field('old_end_date') oldEndDate!: number;
  @field('new_start_date') newStartDate!: number;
  @field('new_end_date') newEndDate!: number;
  @field('reason') reason!: string;
  @field('revision_version') revisionVersion!: number;
  @field('revised_by') revisedBy!: string;
  @field('approved_by') approvedBy?: string;
  @field('approval_status') approvalStatus!: string; // pending, approved, rejected
  @field('impact_summary') impactSummary?: string; // JSON string
  @field('sync_status') syncStatusField!: string; // pending, synced, failed

  // Helper method to get impacted items from JSON
  getImpactedItems(): string[] {
    if (!this.impactSummary) return [];
    try {
      const summary = JSON.parse(this.impactSummary);
      return summary.impactedItems || [];
    } catch {
      return [];
    }
  }

  // Helper method to set impacted items
  setImpactedItems(itemIds: string[]): string {
    return JSON.stringify({ impactedItems: itemIds });
  }

  // Calculate duration change (in days)
  getDurationChange(): number {
    const oldDuration = Math.floor((this.oldEndDate - this.oldStartDate) / (1000 * 60 * 60 * 24));
    const newDuration = Math.floor((this.newEndDate - this.newStartDate) / (1000 * 60 * 60 * 24));
    return newDuration - oldDuration;
  }

  // Calculate start date shift (in days)
  getStartDateShift(): number {
    return Math.floor((this.newStartDate - this.oldStartDate) / (1000 * 60 * 60 * 24));
  }

  // Calculate end date shift (in days)
  getEndDateShift(): number {
    return Math.floor((this.newEndDate - this.oldEndDate) / (1000 * 60 * 60 * 24));
  }
}
