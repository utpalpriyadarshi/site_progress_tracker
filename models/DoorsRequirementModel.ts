import { Model } from '@nozbe/watermelondb';
import { field, relation, immutableRelation } from '@nozbe/watermelondb/decorators';
import { Associations } from '@nozbe/watermelondb/Model';

/**
 * DoorsRequirementModel - Individual DOORS Requirement
 *
 * Represents a single measurable requirement within a DOORS package.
 * Each requirement tracks compliance status, vendor response, and engineering review.
 *
 * Example Requirements:
 * - TR-001: Rated Power 1000kVA (Technical)
 * - DS-005: Overall Dimensions L:2400mm W:1800mm H:2200mm (Datasheet)
 * - TT-012: Temperature Rise Test per IEC 60076-2 (Type Test)
 * - RT-003: Voltage Ratio Test ±0.5% (Routine Test)
 * - SR-008: Foundation Load Capacity 15 tons (Site)
 *
 * Categories: technical, datasheet, type_test, routine_test, site
 */
export default class DoorsRequirementModel extends Model {
  static table = 'doors_requirements';

  static associations: Associations = {
    doors_package: { type: 'belongs_to', key: 'doors_package_id' },
    created_by_user: { type: 'belongs_to', key: 'created_by' },
    reviewed_by_user: { type: 'belongs_to', key: 'reviewed_by' },
  };

  // Basic Information
  @field('requirement_id') requirementId!: string; // e.g., "DOORS-TSS-AUX-TRF-001-TR-001"
  @field('doors_package_id') doorsPackageId!: string; // FK to parent package

  // Requirement Details
  @field('category') category!: string; // technical, datasheet, type_test, routine_test, site
  @field('requirement_code') requirementCode!: string; // TR-001, DS-005, TT-012, RT-003, SR-008
  @field('requirement_text') requirementText!: string; // Full requirement description
  @field('specification_clause') specificationClause?: string; // Reference to spec clause (e.g., "IEC 60076-1 Clause 4.2")
  @field('acceptance_criteria') acceptanceCriteria!: string; // How to verify compliance
  @field('is_mandatory') isMandatory!: boolean; // true/false - is this requirement mandatory?
  @field('sequence_no') sequenceNo!: number; // Display order (1-100)

  // Compliance Status
  @field('compliance_status') complianceStatus!: string; // compliant, non_compliant, partial, not_verified
  @field('compliance_percentage') compliancePercentage?: number; // For partial compliance (0-100)
  @field('vendor_response') vendorResponse?: string; // Vendor's compliance statement
  @field('verification_method') verificationMethod?: string; // test, inspection, calculation, certificate
  @field('verification_status') verificationStatus?: string; // pending, verified, failed

  // Engineering Review
  @field('review_status') reviewStatus!: string; // pending, approved, rejected, clarification_needed
  @field('review_comments') reviewComments?: string; // Engineering review comments
  @field('reviewed_by') reviewedBy?: string; // Engineer user ID who reviewed
  @field('reviewed_at') reviewedAt?: number; // Review timestamp

  // Attachments/Evidence
  @field('attachment_count') attachmentCount!: number; // Count of supporting documents
  @field('test_report_ref') testReportRef?: string; // Test report reference/URL
  @field('certificate_ref') certificateRef?: string; // Certificate reference/URL

  // Timestamps
  @field('created_at') createdAt!: number;
  @field('updated_at') updatedAt!: number;

  // AppSync fields
  @field('app_sync_status') appSyncStatus!: string; // pending, synced, failed
  @field('version') version!: number; // Version for conflict resolution

  // Relationships
  @relation('doors_packages', 'doors_package_id') package: any; // Belongs to DOORS package
  @immutableRelation('users', 'reviewed_by') reviewer: any; // Engineer who reviewed
}
