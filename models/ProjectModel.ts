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
  @field('start_date') startDate!: number; // timestamp
  @field('end_date') endDate!: number; // timestamp
  @field('status') status!: string; // active, completed, on_hold, cancelled
  @field('budget') budget!: number;
  @field('sync_status') appSyncStatus!: string;
  @field('_version') version!: number;

  // v52: Commercial contract configuration
  @field('contract_value') contractValue?: number;       // Total contract value (INR)
  @field('commencement_date') commencementDate?: number; // Project start for LD calc
  @field('advance_mobilization') advanceMobilization?: number; // Mobilization advance
  @field('advance_recovery_pct') advanceRecoveryPct?: number;  // % recovery per bill
  @field('retention_pct') retentionPct?: number;         // Retention % (default 5)
  @field('dlp_months') dlpMonths?: number;               // Defect Liability Period months

  // ==================== Helpers ====================

  /** Retention % to apply to each KD invoice (defaults to 5%). */
  getRetentionPct(): number {
    return this.retentionPct ?? 5;
  }

  /** Advance recovery % per running bill (defaults to 10%). */
  getAdvanceRecoveryPct(): number {
    return this.advanceRecoveryPct ?? 10;
  }

  /** Remaining advance balance given amount already recovered. */
  getAdvanceBalance(totalRecovered: number): number {
    return Math.max(0, (this.advanceMobilization ?? 0) - totalRecovered);
  }
}