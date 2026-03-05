import { Model } from '@nozbe/watermelondb';
import { field, readonly, relation } from '@nozbe/watermelondb/decorators';
import { Associations } from '@nozbe/watermelondb/Model';

export type VOApprovalStatus = 'pending' | 'approved' | 'rejected' | 'under_review';

export default class VariationOrderModel extends Model {
  static table = 'variation_orders';

  static associations: Associations = {
    projects: { type: 'belongs_to', key: 'project_id' },
    key_dates: { type: 'belongs_to', key: 'linked_kd_id' },
  };

  @field('project_id') projectId!: string;
  @field('vo_number') voNumber!: string;
  @field('description') description!: string;
  @field('value') value!: number;
  @field('approval_status') approvalStatus!: VOApprovalStatus;
  @field('execution_pct') executionPct!: number;
  @field('billable_amount') billableAmount!: number;
  @field('revenue_at_risk') revenueAtRisk!: number;
  @field('margin_impact') marginImpact!: number;
  @field('include_in_next_ipc') includeInNextIpc!: boolean;
  @field('linked_kd_id') linkedKdId?: string;
  @field('raised_date') raisedDate!: number;
  @field('approved_date') approvedDate?: number;
  @field('notes') notes?: string;
  @field('created_by') createdBy!: string;
  @readonly @field('created_at') createdAt!: number;
  @field('updated_at') updatedAt!: number;
  @field('sync_status') appSyncStatus!: string;
  @field('_version') version!: number;

  @relation('projects', 'project_id') project: any;
  @relation('key_dates', 'linked_kd_id') linkedKd: any;

  // ==================== Helpers ====================

  isApproved(): boolean {
    return this.approvalStatus === 'approved';
  }

  isAtRisk(): boolean {
    return this.approvalStatus === 'pending' || this.approvalStatus === 'under_review';
  }

  /** Recomputes billable amount from stored fields. */
  computedBillableAmount(): number {
    return (this.value * this.executionPct) / 100;
  }

  /** Revenue at risk: full value if unapproved, 0 if approved/rejected. */
  computedRevenueAtRisk(): number {
    return this.isAtRisk() ? this.value : 0;
  }
}
