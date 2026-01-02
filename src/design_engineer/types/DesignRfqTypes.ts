/**
 * Types for Design RFQ Management
 */

export interface DesignRfq {
  id: string;
  rfqNumber: string;
  doorsId: string;
  doorsPackageId: string;
  projectId: string;
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
  createdById: string;
  createdAt: Date;
}

export interface DoorsPackage {
  id: string;
  doorsId: string;
}
