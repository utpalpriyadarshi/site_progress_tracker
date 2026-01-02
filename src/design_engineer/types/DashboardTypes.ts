/**
 * Types for Design Engineer Dashboard
 */

export interface DashboardMetrics {
  totalDoorsPackages: number;
  pendingPackages: number;
  receivedPackages: number;
  reviewedPackages: number;
  totalDesignRfqs: number;
  draftRfqs: number;
  issuedRfqs: number;
  awardedRfqs: number;
  complianceRate: number;
  avgProcessingDays: number;
}
