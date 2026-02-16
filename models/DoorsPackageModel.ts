import { Model } from '@nozbe/watermelondb';
import { field, relation, children } from '@nozbe/watermelondb/decorators';
import { Associations } from '@nozbe/watermelondb/Model';

/**
 * DoorsPackageModel - DOORS (Dynamic Object Oriented Requirements System) Package
 *
 * Represents an equipment/material specification package with measurable requirements.
 * Each package contains 50-100+ individual requirements tracked for manufacturer compliance.
 *
 * Example: Auxiliary Transformer 1000kVA
 *   - 30 Technical Requirements (voltage, power, efficiency)
 *   - 20 Data Sheet Requirements (dimensions, weight, connections)
 *   - 25 Type Test Requirements (temperature rise, impulse, short circuit)
 *   - 15 Routine Test Requirements (voltage ratio, insulation resistance)
 *   - 10 Site Requirements (foundation, clearances, installation)
 *   Total: 100 requirements = 100 compliance checkpoints
 *
 * Overall compliance calculated from child requirements.
 */
export default class DoorsPackageModel extends Model {
  static table = 'doors_packages';

  static associations: Associations = {
    project: { type: 'belongs_to', key: 'project_id' },
    domain: { type: 'belongs_to', key: 'domain_id' },
    requirements: { type: 'has_many', foreignKey: 'doors_package_id' },
    bom_items: { type: 'has_many', foreignKey: 'doors_id' },
  };

  // Basic Information
  @field('doors_id') doorsId!: string; // e.g., "DOORS-TSS-AUX-TRF-001"
  @field('equipment_name') equipmentName!: string; // e.g., "Auxiliary Transformer 1000kVA"
  @field('category') category!: string; // OHE, TSS, SCADA, Cables, Hardware, Consumables
  @field('equipment_type') equipmentType!: string; // Transformer, Switchgear, Cable, Mast, Panel, etc.
  @field('project_id') projectId!: string; // Foreign key to projects table
  @field('domain_id') domainId?: string; // Foreign key to domains table (v44)
  @field('site_id') siteId?: string; // Foreign key to sites table
  @field('material_type') materialType?: string; // Material classification
  @field('engineer_id') engineerId?: string; // Assigned design engineer
  @field('received_date') receivedDate?: number; // When package was received
  @field('reviewed_date') reviewedDate?: number; // When package was reviewed
  @field('specification_ref') specificationRef?: string; // Engineering spec document reference
  @field('drawing_ref') drawingRef?: string; // GA drawing reference
  @field('quantity') quantity!: number; // Required quantity
  @field('unit') unit!: string; // nos, sets, meters, kg, etc.

  // Compliance Summary (calculated from child requirements)
  @field('total_requirements') totalRequirements!: number; // Total count (e.g., 100)
  @field('compliant_requirements') compliantRequirements!: number; // Compliant count (e.g., 94)
  @field('compliance_percentage') compliancePercentage!: number; // % (e.g., 94.0)

  // Category-wise Compliance (calculated from child requirements)
  @field('technical_req_compliance') technicalReqCompliance!: number; // Technical requirements %
  @field('datasheet_compliance') datasheetCompliance!: number; // Data sheet %
  @field('type_test_compliance') typeTestCompliance!: number; // Type tests %
  @field('routine_test_compliance') routineTestCompliance!: number; // Routine tests %
  @field('site_req_compliance') siteReqCompliance!: number; // Site requirements %

  // Status tracking
  @field('status') status!: string; // draft, under_review, approved, closed
  @field('priority') priority!: string; // high, medium, low

  // RFQ stage (Phase 3)
  @field('rfq_no') rfqNo?: string; // RFQ reference number
  @field('rfq_issued_date') rfqIssuedDate?: number; // Timestamp
  @field('vendors_invited') vendorsInvited?: number; // Count of vendors invited
  @field('vendors_responded') vendorsResponded?: number; // Count of vendors who responded

  // Procurement stage
  @field('po_no') poNo?: string; // Purchase Order number
  @field('po_date') poDate?: number; // PO placement date timestamp
  @field('selected_vendor') selectedVendor?: string; // Selected vendor name
  @field('po_value') poValue?: number; // Order value in currency

  // Delivery tracking
  @field('delivery_status') deliveryStatus?: string; // pending, in_transit, delivered
  @field('expected_delivery') expectedDelivery?: number; // Expected delivery timestamp
  @field('actual_delivery') actualDelivery?: number; // Actual delivery timestamp

  // Closure
  @field('closure_date') closureDate?: number; // When DOORS package closed (timestamp)
  @field('closure_remarks') closureRemarks?: string; // Closure notes

  // Ownership
  @field('created_by') createdBy!: string; // Engineer user ID who created
  @field('assigned_to') assignedTo?: string; // Logistics Manager user ID
  @field('reviewed_by') reviewedBy?: string; // Senior Engineer user ID

  // Timestamps
  @field('created_at') createdAt!: number;
  @field('updated_at') updatedAt!: number;

  // Edit audit trail (Phase 3)
  @field('last_modified_at') lastModifiedAt?: number; // When package was last edited
  @field('modified_by_id') modifiedById?: string; // User who last modified

  // v45: Status transition audit fields
  @field('received_by') receivedBy?: string;
  @field('received_remarks') receivedRemarks?: string;
  @field('review_observations') reviewObservations?: string;
  @field('approved_by') approvedBy?: string;
  @field('approved_date') approvedDate?: number;
  @field('approval_remarks') approvalRemarks?: string;

  // AppSync fields
  @field('app_sync_status') appSyncStatus!: string; // pending, synced, failed
  @field('version') version!: number; // Version for conflict resolution

  // Relationships
  @relation('projects', 'project_id') project: any;
  @children('doors_requirements') requirements: any; // Has many requirements
}
