import { Model } from '@nozbe/watermelondb';
import { field, readonly, relation } from '@nozbe/watermelondb/decorators';
import { Associations } from '@nozbe/watermelondb/Model';

export type RetentionPartyType = 'client' | 'vendor';

export default class RetentionModel extends Model {
  static table = 'retentions';

  static associations: Associations = {
    projects: { type: 'belongs_to', key: 'project_id' },
    invoices: { type: 'belongs_to', key: 'invoice_id' },
  };

  @field('project_id') projectId!: string;
  @field('invoice_id') invoiceId!: string;
  @field('party_type') partyType!: RetentionPartyType;
  @field('party_id') partyId?: string;
  @field('gross_invoice_amount') grossInvoiceAmount!: number;
  @field('retention_pct') retentionPct!: number;
  @field('retention_amount') retentionAmount!: number;
  @field('dlp_end_date') dlpEndDate?: number;
  @field('released_date') releasedDate?: number;
  @field('released_amount') releasedAmount?: number;
  @field('bg_in_lieu') bgInLieu!: boolean;
  @field('bg_reference') bgReference?: string;
  @field('created_by') createdBy!: string;
  @readonly @field('created_at') createdAt!: number;
  @field('updated_at') updatedAt!: number;
  @field('sync_status') appSyncStatus!: string;
  @field('_version') version!: number;

  @relation('projects', 'project_id') project: any;
  @relation('invoices', 'invoice_id') invoice: any;

  // ==================== Helpers ====================

  isReleased(): boolean {
    return !!this.releasedDate;
  }

  isDLPExpired(): boolean {
    if (!this.dlpEndDate) return false;
    return Date.now() > this.dlpEndDate;
  }

  isEligibleForRelease(): boolean {
    return this.isDLPExpired() && !this.isReleased() && !this.bgInLieu;
  }

  getHoldingAgeMonths(): number {
    const from = this.createdAt ?? Date.now();
    return Math.floor((Date.now() - from) / (1000 * 60 * 60 * 24 * 30));
  }

  getUnreleasedAmount(): number {
    return this.retentionAmount - (this.releasedAmount ?? 0);
  }
}
