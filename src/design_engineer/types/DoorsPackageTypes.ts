/**
 * Types for DOORS Package Management
 */

export const DOORS_CATEGORIES = [
  { value: 'OHE', label: 'OHE' },
  { value: 'TSS', label: 'TSS' },
  { value: 'SCADA', label: 'SCADA' },
  { value: 'Cables', label: 'Cables' },
  { value: 'Hardware', label: 'Hardware' },
  { value: 'Consumables', label: 'Consumables' },
] as const;

export type DoorsCategory = typeof DOORS_CATEGORIES[number]['value'];

export interface DoorsPackage {
  id: string;
  doorsId: string;
  projectId: string;
  siteId?: string;
  siteName?: string;
  domainId?: string;
  domainName?: string;
  equipmentType: string;
  materialType?: string;
  category: string;
  totalRequirements: number;
  receivedDate?: number;
  reviewedDate?: number;
  status: string;
  engineerId: string;
  reviewedBy?: string;
  closureDate?: number;
  closureRemarks?: string;
  // v45: Status transition audit fields
  receivedBy?: string;
  receivedRemarks?: string;
  reviewObservations?: string;
  approvedBy?: string;
  approvedDate?: number;
  approvalRemarks?: string;
  createdAt: Date;
  equipmentName?: string;
  priority?: string;
  quantity?: number;
  unit?: string;
  specificationRef?: string;
  drawingRef?: string;
  compliantRequirements?: number;
  compliancePercentage?: number;
  technicalReqCompliance?: number;
  datasheetCompliance?: number;
  typeTestCompliance?: number;
  routineTestCompliance?: number;
  siteReqCompliance?: number;
  linkedDocumentsCount?: number; // count of design docs linked to this package
}

export interface Site {
  id: string;
  name: string;
}
