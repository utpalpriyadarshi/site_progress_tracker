import { Model } from '@nozbe/watermelondb';
import { field, readonly, date, relation } from '@nozbe/watermelondb/decorators';
import RfqModel from './RfqModel';
import VendorModel from './VendorModel';

export default class RfqVendorQuoteModel extends Model {
  static table = 'rfq_vendor_quotes';

  static associations = {
    rfq: { type: 'belongs_to' as const, key: 'rfq_id' },
    vendor: { type: 'belongs_to' as const, key: 'vendor_id' },
  };

  @field('rfq_id') rfqId!: string;
  @field('vendor_id') vendorId!: string;
  @field('quote_reference') quoteReference?: string;
  @field('quoted_price') quotedPrice!: number;
  @field('currency') currency!: string;
  @field('lead_time_days') leadTimeDays!: number;
  @field('validity_days') validityDays!: number;
  @field('payment_terms') paymentTerms?: string;
  @field('warranty_months') warrantyMonths?: number;
  @field('technical_compliance_percentage') technicalCompliancePercentage!: number;
  // v45: 5-category compliance breakup
  @field('tech_complied') techComplied?: number;
  @field('tech_complied_with_comments') techCompliedWithComments?: number;
  @field('tech_not_complied') techNotComplied?: number;
  @field('datasheet_complied') datasheetComplied?: number;
  @field('datasheet_complied_with_comments') datasheetCompliedWithComments?: number;
  @field('datasheet_not_complied') datasheetNotComplied?: number;
  @field('type_test_complied') typeTestComplied?: number;
  @field('type_test_complied_with_comments') typeTestCompliedWithComments?: number;
  @field('type_test_not_complied') typeTestNotComplied?: number;
  @field('routine_test_complied') routineTestComplied?: number;
  @field('routine_test_complied_with_comments') routineTestCompliedWithComments?: number;
  @field('routine_test_not_complied') routineTestNotComplied?: number;
  @field('site_req_complied') siteReqComplied?: number;
  @field('site_req_complied_with_comments') siteReqCompliedWithComments?: number;
  @field('site_req_not_complied') siteReqNotComplied?: number;
  @field('technical_deviations') technicalDeviations?: string; // JSON array
  @field('commercial_deviations') commercialDeviations?: string; // JSON array
  @field('notes') notes?: string;
  @field('attachments') attachments?: string; // JSON array
  @field('status') status!: string; // submitted, under_review, shortlisted, rejected, awarded
  @field('technical_score') technicalScore?: number;
  @field('commercial_score') commercialScore?: number;
  @field('overall_score') overallScore?: number;
  @field('rank') rank?: number;
  @field('submitted_at') submittedAt?: number;
  @field('evaluated_at') evaluatedAt?: number;
  @field('evaluated_by_id') evaluatedById?: string;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
  @field('sync_status') appSyncStatus!: string;
  @field('_version') version!: number;

  // Relationships
  @relation('rfq', 'rfq_id') rfq!: RfqModel;
  @relation('vendor', 'vendor_id') vendor!: VendorModel;
}
