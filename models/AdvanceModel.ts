import { Model } from '@nozbe/watermelondb';
import { field, readonly, relation } from '@nozbe/watermelondb/decorators';
import { Associations } from '@nozbe/watermelondb/Model';

export type AdvanceType = 'mobilization' | 'performance' | 'material';

export default class AdvanceModel extends Model {
  static table = 'advances';

  static associations: Associations = {
    projects: { type: 'belongs_to', key: 'project_id' },
  };

  @field('project_id') projectId!: string;
  @field('advance_type') advanceType!: AdvanceType;
  @field('advance_amount') advanceAmount!: number;
  @field('recovery_pct') recoveryPct!: number;
  @field('total_recovered') totalRecovered!: number;
  @field('issued_date') issuedDate!: number;
  @field('fully_recovered_date') fullyRecoveredDate?: number;
  @field('notes') notes?: string;
  @field('created_by') createdBy!: string;
  @readonly @field('created_at') createdAt!: number;
  @field('updated_at') updatedAt!: number;
  @field('sync_status') appSyncStatus!: string;
  @field('_version') version!: number;

  @relation('projects', 'project_id') project: any;

  // ==================== Helpers ====================

  getBalanceOutstanding(): number {
    return Math.max(0, this.advanceAmount - this.totalRecovered);
  }

  getRecoveryProgress(): number {
    if (!this.advanceAmount) return 0;
    return Math.min(100, (this.totalRecovered / this.advanceAmount) * 100);
  }

  isFullyRecovered(): boolean {
    return this.totalRecovered >= this.advanceAmount;
  }

  /** Amount to deduct on the next IPC given a gross billing amount. */
  getRecoveryForBill(grossBillingAmount: number): number {
    const remaining = this.getBalanceOutstanding();
    const scheduled = (grossBillingAmount * this.recoveryPct) / 100;
    return Math.min(scheduled, remaining);
  }
}
