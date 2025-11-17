import { Model } from '@nozbe/watermelondb';
import { field, readonly, date } from '@nozbe/watermelondb/decorators';

export default class RfqModel extends Model {
  static table = 'rfqs';

  static associations = {
    rfq_vendor_quotes: { type: 'has_many' as const, foreignKey: 'rfq_id' },
  };

  @field('rfq_number') rfqNumber!: string;
  @field('doors_id') doorsId!: string;
  @field('doors_package_id') doorsPackageId!: string;
  @field('project_id') projectId!: string;
  @field('title') title!: string;
  @field('description') description?: string;
  @field('status') status!: string; // draft, issued, quotes_received, evaluated, awarded, cancelled
  @field('issue_date') issueDate?: number;
  @field('closing_date') closingDate?: number;
  @field('evaluation_date') evaluationDate?: number;
  @field('award_date') awardDate?: number;
  @field('expected_delivery_days') expectedDeliveryDays?: number;
  @field('technical_specifications') technicalSpecifications?: string; // JSON
  @field('commercial_terms') commercialTerms?: string; // JSON
  @field('total_vendors_invited') totalVendorsInvited!: number;
  @field('total_quotes_received') totalQuotesReceived!: number;
  @field('winning_vendor_id') winningVendorId?: string;
  @field('winning_quote_id') winningQuoteId?: string;
  @field('awarded_value') awardedValue?: number;
  @field('created_by_id') createdById!: string;
  @field('evaluated_by_id') evaluatedById?: string;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
  @field('sync_status') appSyncStatus!: string;
  @field('_version') version!: number;
}
