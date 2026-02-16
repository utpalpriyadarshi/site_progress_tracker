/**
 * Types for Design RFQ Management
 */

export interface DesignRfq {
  id: string;
  rfqNumber: string;
  doorsId: string;
  doorsPackageId: string;
  projectId: string;
  domainId?: string;
  domainName?: string;
  title: string;
  description?: string;
  status: string;
  rfqType: string;
  issueDate?: number;
  closingDate?: number;
  evaluationDate?: number;
  awardDate?: number;
  expectedDeliveryDays?: number;
  totalVendorsInvited: number;
  totalQuotesReceived: number;
  winningVendorId?: string;
  awardedValue?: number;
  evaluatedById?: string;
  createdById: string;
  createdAt: Date;
  // Auto-populated from DOORS package
  equipmentType?: string;
  category?: string;
  totalRequirements?: number;
}

export interface DoorsPackage {
  id: string;
  doorsId: string;
  equipmentType: string;
  category: string;
  domainId?: string;
  domainName?: string;
  materialType?: string;
  totalRequirements: number;
  siteName?: string;
  siteId?: string;
}

export interface Domain {
  id: string;
  name: string;
}
