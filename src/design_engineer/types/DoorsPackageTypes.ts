/**
 * Types for DOORS Package Management
 */

export interface DoorsPackage {
  id: string;
  doorsId: string;
  projectId: string;
  siteId?: string;
  siteName?: string;
  equipmentType: string;
  materialType?: string;
  category: string;
  totalRequirements: number;
  receivedDate?: number;
  reviewedDate?: number;
  status: string;
  engineerId: string;
  createdAt: Date;
}

export interface Site {
  id: string;
  name: string;
}
