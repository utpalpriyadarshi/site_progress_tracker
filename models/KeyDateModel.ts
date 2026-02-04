import { Model } from '@nozbe/watermelondb';
import { field, readonly, relation } from '@nozbe/watermelondb/decorators';
import { Associations } from '@nozbe/watermelondb/Model';

/**
 * Key Date Categories based on CMRL contract structure
 */
export type KeyDateCategory =
  | 'G'   // General
  | 'A'   // Design
  | 'B'   // Works at Poonamallee Depot
  | 'C'   // Works at Corridor 4: ECV01, ECV02
  | 'D'   // RSS at Thirumayilai
  | 'E'   // Works at Corridor 4: UG02
  | 'F';  // Works at Corridor 4: UG01

/**
 * Key Date Status
 */
export type KeyDateStatus =
  | 'not_started'
  | 'in_progress'
  | 'completed'
  | 'delayed';

/**
 * KeyDateModel - Contract Key Dates / Milestones
 *
 * Based on CMRL contract key dates structure.
 * Each key date has a target completion time (days from commencement)
 * and associated delay damages.
 *
 * @version 1.0.0
 * @since Phase 5a - Key Dates Architecture
 */
export default class KeyDateModel extends Model {
  static table = 'key_dates';

  static associations: Associations = {
    projects: { type: 'belongs_to', key: 'project_id' },
    key_date_sites: { type: 'has_many', foreignKey: 'key_date_id' },
    items: { type: 'has_many', foreignKey: 'key_date_id' },
  };

  // Key Date identification
  @field('code') code!: string; // KD-G-01, KD-A-01, etc.
  @field('category') category!: KeyDateCategory; // G, A, B, C, D, E, F
  @field('category_name') categoryName!: string; // Full category name (e.g., "General", "Design")
  @field('description') description!: string; // Key date description

  // Schedule
  @field('target_days') targetDays!: number; // Calendar days from commencement
  @field('target_date') targetDate?: number; // Calculated target date (timestamp)
  @field('actual_date') actualDate?: number; // Actual completion date (timestamp)

  // Status tracking
  @field('status') status!: KeyDateStatus;
  @field('progress_percentage') progressPercentage!: number; // 0-100

  // Delay damages (INR Lakhs per day)
  @field('delay_damages_initial') delayDamagesInitial!: number; // Days 1-28 (typically 1)
  @field('delay_damages_extended') delayDamagesExtended!: number; // From day 29 onwards (typically 10)
  @field('delay_damages_special') delayDamagesSpecial?: string; // Special cases like "0.1% of Contract Price per day"

  // Relationships
  @field('project_id') projectId!: string;

  // Sequence for ordering
  @field('sequence_order') sequenceOrder!: number;

  // Weightage for project progress rollup (percentage)
  @field('weightage') weightage?: number;

  // Dependencies (JSON array of key_date IDs)
  @field('dependencies') dependencies?: string;

  // Audit
  @field('created_by') createdBy!: string;
  @readonly @field('created_at') createdAt!: number;
  @field('updated_at') updatedAt!: number;

  // Sync
  @field('sync_status') appSyncStatus!: string;
  @field('_version') version!: number;

  // Relations
  @relation('projects', 'project_id') project: any;

  // ==================== Helper Methods ====================

  /**
   * Get formatted key date code (e.g., "KD-G-01")
   */
  getFormattedCode(): string {
    return this.code || 'N/A';
  }

  /**
   * Get days remaining until target date
   */
  getDaysRemaining(): number {
    if (!this.targetDate) return this.targetDays;
    const now = Date.now();
    const remaining = Math.ceil((this.targetDate - now) / (1000 * 60 * 60 * 24));
    return Math.max(0, remaining);
  }

  /**
   * Get days delayed (negative if on time)
   */
  getDaysDelayed(): number {
    if (!this.targetDate) return 0;
    const endDate = this.actualDate || Date.now();
    return Math.ceil((endDate - this.targetDate) / (1000 * 60 * 60 * 24));
  }

  /**
   * Calculate estimated delay damages
   */
  getEstimatedDelayDamages(): number {
    const daysDelayed = this.getDaysDelayed();
    if (daysDelayed <= 0) return 0;

    // Special case (percentage of contract price)
    if (this.delayDamagesSpecial) {
      return -1; // Indicate special calculation needed
    }

    // Calculate based on tiered rates
    const initialDays = Math.min(daysDelayed, 28);
    const extendedDays = Math.max(0, daysDelayed - 28);

    return (initialDays * this.delayDamagesInitial) + (extendedDays * this.delayDamagesExtended);
  }

  /**
   * Get status color for UI
   */
  getStatusColor(): string {
    const colors: Record<KeyDateStatus, string> = {
      not_started: '#9E9E9E', // Grey
      in_progress: '#2196F3', // Blue
      completed: '#4CAF50',   // Green
      delayed: '#F44336',     // Red
    };
    return colors[this.status] || '#9E9E9E';
  }

  /**
   * Get category color for UI
   */
  getCategoryColor(): string {
    const colors: Record<KeyDateCategory, string> = {
      G: '#607D8B', // Blue Grey - General
      A: '#2196F3', // Blue - Design
      B: '#4CAF50', // Green - Poonamallee Depot
      C: '#FF9800', // Orange - Corridor 4 ECV
      D: '#9C27B0', // Purple - Thirumayilai
      E: '#00BCD4', // Cyan - Corridor 4 UG02
      F: '#E91E63', // Pink - Corridor 4 UG01
    };
    return colors[this.category] || '#666666';
  }

  /**
   * Parse dependencies JSON
   */
  getDependencies(): string[] {
    if (!this.dependencies) return [];
    try {
      return JSON.parse(this.dependencies);
    } catch {
      return [];
    }
  }

  /**
   * Check if key date is critical (delayed or at risk)
   */
  isCritical(): boolean {
    if (this.status === 'delayed') return true;
    const daysRemaining = this.getDaysRemaining();
    // Consider critical if less than 30 days remaining and not completed
    return daysRemaining < 30 && this.status !== 'completed';
  }
}
