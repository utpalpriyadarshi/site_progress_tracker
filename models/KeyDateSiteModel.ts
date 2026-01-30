import { Model } from '@nozbe/watermelondb';
import { field, readonly, relation } from '@nozbe/watermelondb/decorators';
import { Associations } from '@nozbe/watermelondb/Model';

/**
 * KeyDateSiteModel - Junction table for Key Date to Site mapping
 *
 * Tracks which sites contribute to completing a key date
 * and their percentage contribution.
 *
 * Example: KD-B-01 (RSS Building at Poonamallee Depot) might involve
 * multiple sites, each contributing a percentage to the overall completion.
 *
 * @version 1.0.0
 * @since Phase 5a - Key Dates Architecture
 */
export default class KeyDateSiteModel extends Model {
  static table = 'key_date_sites';

  static associations: Associations = {
    key_dates: { type: 'belongs_to', key: 'key_date_id' },
    sites: { type: 'belongs_to', key: 'site_id' },
  };

  // Foreign keys
  @field('key_date_id') keyDateId!: string;
  @field('site_id') siteId!: string;

  // Contribution tracking
  @field('contribution_percentage') contributionPercentage!: number; // 0-100, how much this site contributes to KD completion
  /** @deprecated Progress is now auto-calculated from supervisor item data at the site */
  @field('progress_percentage') progressPercentage!: number; // 0-100, current progress at this site for this KD

  // Status
  @field('status') status!: string; // not_started, in_progress, completed

  // Schedule (site-specific dates for this key date)
  @field('planned_start_date') plannedStartDate?: number;
  @field('planned_end_date') plannedEndDate?: number;
  @field('actual_start_date') actualStartDate?: number;
  @field('actual_end_date') actualEndDate?: number;

  // Notes
  @field('notes') notes?: string;

  // Audit
  @field('updated_by') updatedBy?: string;
  @readonly @field('created_at') createdAt!: number;
  @field('updated_at') updatedAt!: number;

  // Sync
  @field('sync_status') appSyncStatus!: string;
  @field('_version') version!: number;

  // Relations
  @relation('key_dates', 'key_date_id') keyDate: any;
  @relation('sites', 'site_id') site: any;

  // ==================== Helper Methods ====================

  /**
   * Get weighted progress contribution
   * Returns the actual progress contribution to the overall key date
   * @deprecated Progress is now auto-calculated from supervisor item data at the site
   */
  getWeightedProgress(): number {
    return (this.contributionPercentage / 100) * this.progressPercentage;
  }

  /**
   * Get schedule variance in days (positive = delayed)
   */
  getScheduleVariance(): number {
    if (!this.plannedEndDate) return 0;
    const endDate = this.actualEndDate || Date.now();
    return Math.ceil((endDate - this.plannedEndDate) / (1000 * 60 * 60 * 24));
  }

  /**
   * Check if this site's contribution is on track
   */
  isOnTrack(): boolean {
    if (this.status === 'completed') return true;
    return this.getScheduleVariance() <= 0;
  }

  /**
   * Get status color for UI
   */
  getStatusColor(): string {
    const colors: Record<string, string> = {
      not_started: '#9E9E9E', // Grey
      in_progress: '#2196F3', // Blue
      completed: '#4CAF50',   // Green
    };
    return colors[this.status] || '#9E9E9E';
  }
}
