/**
 * DOORS (Dynamic Object Oriented Requirements System) Type Definitions
 *
 * Used for tracking equipment/material specifications broken down into
 * measurable requirements for manufacturer compliance tracking.
 */

// Package Status
export type DoorsPackageStatus =
  | 'draft'          // Being created, requirements being added
  | 'under_review'   // Engineering reviewing requirements
  | 'approved'       // All requirements verified, ready for procurement
  | 'closed';        // Equipment delivered and accepted

// Priority Levels
export type DoorsPriority = 'high' | 'medium' | 'low';

// Requirement Categories
export type RequirementCategory =
  | 'technical'       // Technical specifications (voltage, power, efficiency)
  | 'datasheet'       // Physical dimensions, weight, connections
  | 'type_test'       // Factory type tests (temperature rise, impulse, short circuit)
  | 'routine_test'    // Routine production tests (voltage ratio, insulation resistance)
  | 'site';           // Site installation requirements (foundation, clearances)

// Compliance Status for Individual Requirements
export type ComplianceStatus =
  | 'compliant'       // 100% meets requirement
  | 'non_compliant'   // Does not meet requirement
  | 'partial'         // Partially meets (use compliance_percentage field)
  | 'not_verified';   // Not yet checked

// Engineering Review Status
export type ReviewStatus =
  | 'pending'                 // Awaiting engineering review
  | 'approved'                // Engineering approved
  | 'rejected'                // Engineering rejected
  | 'clarification_needed';   // Needs vendor clarification

// Verification Methods
export type VerificationMethod =
  | 'test'            // Physical testing required
  | 'inspection'      // Visual inspection
  | 'calculation'     // Mathematical verification
  | 'certificate';    // Third-party certificate

// Equipment Categories (Metro Electrification)
export type EquipmentCategory =
  | 'OHE'             // Overhead Equipment
  | 'TSS'             // Traction Substation
  | 'SCADA'           // Supervisory Control and Data Acquisition
  | 'Cables'          // Power and Control Cables
  | 'Hardware'        // Bolts, Nuts, Clamps, Fasteners
  | 'Consumables';    // Earthing rods, Welding rods, Lugs

// Delivery Status
export type DeliveryStatus =
  | 'pending'        // Not yet dispatched
  | 'in_transit'     // On the way
  | 'delivered'      // Reached site
  | 'partial';       // Partial delivery

/**
 * DOORS Package Interface
 * Represents equipment-level tracking (e.g., Auxiliary Transformer 1000kVA)
 */
export interface DoorsPackage {
  id: string;
  doorsId: string;                     // e.g., "DOORS-TSS-AUX-TRF-001"
  equipmentName: string;                // e.g., "Auxiliary Transformer 1000kVA"
  category: EquipmentCategory;
  equipmentType: string;                // Transformer, Switchgear, Cable, Mast, etc.
  projectId: string;
  specificationRef?: string;
  drawingRef?: string;
  quantity: number;
  unit: string;

  // Compliance Summary (calculated from child requirements)
  totalRequirements: number;            // Total count (e.g., 100)
  compliantRequirements: number;        // Compliant count (e.g., 94)
  compliancePercentage: number;         // % (e.g., 94.0)
  technicalReqCompliance: number;       // Technical requirements %
  datasheetCompliance: number;          // Data sheet %
  typeTestCompliance: number;           // Type tests %
  routineTestCompliance: number;        // Routine tests %
  siteReqCompliance: number;            // Site requirements %

  // Status
  status: DoorsPackageStatus;
  priority: DoorsPriority;

  // RFQ stage (Phase 3)
  rfqNo?: string;
  rfqIssuedDate?: number;
  vendorsInvited?: number;
  vendorsResponded?: number;

  // Procurement
  poNo?: string;
  poDate?: number;
  selectedVendor?: string;
  poValue?: number;

  // Delivery
  deliveryStatus?: DeliveryStatus;
  expectedDelivery?: number;
  actualDelivery?: number;

  // Closure
  closureDate?: number;
  closureRemarks?: string;

  // Ownership
  createdBy: string;
  assignedTo?: string;
  reviewedBy?: string;
  createdAt: number;
  updatedAt: number;

  // Sync
  appSyncStatus: string;
  version: number;
}

/**
 * DOORS Requirement Interface
 * Represents individual measurable requirement (e.g., TR-001: Rated Power 1000kVA)
 */
export interface DoorsRequirement {
  id: string;
  requirementId: string;                 // e.g., "DOORS-TSS-AUX-TRF-001-TR-001"
  doorsPackageId: string;                // FK to parent package

  // Requirement Details
  category: RequirementCategory;
  requirementCode: string;               // TR-001, DS-005, TT-012, RT-003, SR-008
  requirementText: string;               // Full requirement description
  specificationClause?: string;          // e.g., "IEC 60076-1 Clause 4.2"
  acceptanceCriteria: string;            // How to verify compliance
  isMandatory: boolean;
  sequenceNo: number;                    // Display order (1-100)

  // Compliance Status
  complianceStatus: ComplianceStatus;
  compliancePercentage?: number;         // For partial compliance (0-100)
  vendorResponse?: string;               // Vendor's compliance statement
  verificationMethod?: VerificationMethod;
  verificationStatus?: string;           // pending, verified, failed

  // Engineering Review
  reviewStatus: ReviewStatus;
  reviewComments?: string;
  reviewedBy?: string;
  reviewedAt?: number;

  // Attachments
  attachmentCount: number;
  testReportRef?: string;
  certificateRef?: string;

  // Timestamps
  createdAt: number;
  updatedAt: number;

  // Sync
  appSyncStatus: string;
  version: number;
}

/**
 * Helper type for grouped requirements display
 */
export interface GroupedRequirements {
  category: RequirementCategory;
  categoryName: string;
  requirements: DoorsRequirement[];
  totalCount: number;
  compliantCount: number;
  compliancePercentage: number;
}

/**
 * Statistics for DOORS tracking
 */
export interface DoorsStatistics {
  totalPackages: number;
  draftPackages: number;
  underReviewPackages: number;
  approvedPackages: number;
  closedPackages: number;
  averageCompliance: number;
  criticalPackages: number;              // < 80% compliance
  totalRequirements: number;
  compliantRequirements: number;
}
