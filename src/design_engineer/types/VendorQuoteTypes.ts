/**
 * Types for Vendor Quote Management
 */

export interface VendorQuote {
  id: string;
  rfqId: string;
  vendorId: string;
  vendorName: string;
  quoteReference?: string;
  quotedPrice: number;
  currency: string;
  leadTimeDays: number;
  validityDays: number;
  paymentTerms?: string;
  warrantyMonths?: number;
  technicalCompliancePercentage: number;
  technicalDeviations?: string;
  commercialDeviations?: string;
  notes?: string;
  status: string; // submitted, under_review, shortlisted, rejected, awarded
  technicalScore?: number;
  commercialScore?: number;
  overallScore?: number;
  rank?: number;
  submittedAt?: number;
  evaluatedAt?: number;
}

export interface Vendor {
  id: string;
  vendorCode: string;
  vendorName: string;
  category: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  rating?: number;
  isApproved: boolean;
  performanceScore?: number;
}

export interface QuoteComparison {
  quote: VendorQuote;
  priceRank: number;
  leadTimeRank: number;
  complianceRank: number;
}
