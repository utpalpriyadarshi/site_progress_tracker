/**
 * Report Type Definitions
 * Shared types for financial report components
 */

import { BudgetSummary, CategoryBreakdown } from './budget';
import { CostDistribution } from './cost';

export interface ReportDateRange {
  startDate: Date | null;
  endDate: Date | null;
}

export interface InvoicesSummary {
  total: number;
  paid: number;
  pending: number;
  overdue: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  overdueAmount: number;
}

export interface CashFlow {
  totalRevenue: number;
  totalCosts: number;
  netCashFlow: number;
  cashFlowRatio: number;
}

export interface Profitability {
  totalBudget: number;
  totalSpent: number;
  remaining: number;
  profitMargin: number;
}

export interface BudgetVariance {
  category: string;
  allocated: number;
  actual: number;
  variance: number;
  variancePercentage: number;
}

export interface FinancialReportData {
  budgetByCategory: BudgetVariance[];
  costsByCategory: CostDistribution[];
  invoicesSummary: InvoicesSummary;
  cashFlow: CashFlow;
  profitability: Profitability;
  dateRange?: ReportDateRange;
}

export type ReportFormat = 'pdf' | 'excel' | 'csv' | 'json';

export interface ReportExportOptions {
  format: ReportFormat;
  includeSummary?: boolean;
  includeCharts?: boolean;
  includeDetails?: boolean;
  dateRange?: ReportDateRange;
  fileName?: string;
}

export interface FinancialReportExporterProps {
  reportData: FinancialReportData;
  projectName: string;
  projectId: string;
  onExport: (options: ReportExportOptions) => Promise<void>;
  availableFormats?: ReportFormat[];
  isExporting?: boolean;
}

export interface ReportCardProps {
  children: React.ReactNode;
  title?: string;
  style?: any;
}
