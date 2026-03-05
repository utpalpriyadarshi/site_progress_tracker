/**
 * Commercial Manager Tutorial Steps
 *
 * 16-step walkthrough covering all commercial features:
 * - Sprint 1: Contract KPI, KD Billing, LD Risk
 * - Sprint 2: Advance Recovery, Retention Monitor
 * - Sprint 3: Variation Orders, Vendor Payments, Cash Flow Forecast
 * - Sprint 4: Commercial Risk Alerts, IPC Readiness, Final Bill & DLP
 * - Core: Budget, Costs, Invoices, Financial Reports
 *
 * @version 2.0.0
 * @since v2.25 - Commercial Advanced Billing (Sprints 1–4)
 */

import { TutorialStep } from './plannerTutorialSteps';

const commercialManagerTutorialSteps: TutorialStep[] = [
  // ── 1. Welcome ──────────────────────────────────────────────────────────
  {
    id: 1,
    title: 'Welcome to Commercial Manager',
    description:
      'This module covers the full commercial lifecycle of your project — from Key Date billing and advance tracking to retention management, variation orders, vendor payments, and final bill closure. Let\'s walk through each feature.',
    icon: 'currency-usd-circle',
  },

  // ── 2. Dashboard Overview ────────────────────────────────────────────────
  {
    id: 2,
    title: 'Dashboard Overview',
    description:
      'Your dashboard shows three layers of insight: (1) the Contract Billing KPI card — contract value, gross billed, and KD progress; (2) the Commercial Risk Alerts widget — up to 5 auto-detected risks; and (3) the standard budget, cash flow, and invoice widgets. Use the period selector (MTD / QTD / YTD) to filter the lower widgets.',
    icon: 'view-dashboard',
    screenHint: 'Dashboard',
  },

  // ── 3. Contract Billing KPI ──────────────────────────────────────────────
  {
    id: 3,
    title: 'Contract Billing KPI Card',
    description:
      'The Contract Billing card shows your Contract Value (₹ Crore), Gross Amount Billed so far, and weighted Key Date progress %. A red LD alert appears if any Key Date is delayed and LD exposure exists. Tap "KD Billing →" to raise an IPC, or "LD →" to review your delay exposure.',
    icon: 'cash-multiple',
    screenHint: 'Dashboard',
    actionHint: 'View Contract Billing card on Dashboard',
  },

  // ── 4. Commercial Risk Alerts ────────────────────────────────────────────
  {
    id: 4,
    title: 'Commercial Risk Alerts',
    description:
      'The Risk Alerts widget auto-detects up to 5 risks — Billing Lag (billed % well below work progress %), Advance Pressure (outstanding advance > 15% of contract value), Retention Excess (held > 8% CV), Pending VOs (unapproved variation value), and Slow-Paying Client (invoices >60 days). Tap any risk row to jump directly to the relevant screen.',
    icon: 'alert-decagram',
    screenHint: 'Dashboard',
    actionHint: 'View Risk Alerts widget on Dashboard',
  },

  // ── 5. KD Billing ────────────────────────────────────────────────────────
  {
    id: 5,
    title: 'Key Date Billing',
    description:
      'Open the drawer and tap "KD Billing". This screen lists every project Key Date with its billing weightage %. Completed but unbilled KDs are highlighted in orange — tap "Generate IPC" to open the IPC dialog. It pre-fills Gross = Contract Value × KD weightage, then deducts Retention (5%), Advance Recovery (10% of gross), LD (if any), and TDS to show the Net Payable. Saving the IPC automatically creates a Retention record.',
    icon: 'calendar-check',
    screenHint: 'KDBilling',
    actionHint: 'Open drawer → KD Billing',
  },

  // ── 6. LD Risk Calculator ────────────────────────────────────────────────
  {
    id: 6,
    title: 'LD Risk Calculator',
    description:
      'Open the drawer and tap "LD Risk Calculator". This screen shows all delayed Key Dates with their LD exposure in Lakhs — calculated using the tiered rate: Days 1–28 at the initial rate, Day 29+ at the extended rate. The top banner shows total LD exposure and its % of contract value. Use the EOT status toggle (None / Pending / Filed) per KD to track your Extension of Time claims.',
    icon: 'alert-octagon',
    screenHint: 'LDRisk',
    actionHint: 'Open drawer → LD Risk Calculator',
  },

  // ── 7. Advance Recovery ──────────────────────────────────────────────────
  {
    id: 7,
    title: 'Advance Recovery',
    description:
      'Open the drawer and tap "Advance Recovery". This screen tracks mobilization and performance advances issued to you. Each advance card shows: Amount Issued, Total Recovered, Balance Outstanding, and a % progress bar. The "Impact on Next 3 Pending KD Bills" section projects how much will be deducted from upcoming IPCs. Use the FAB (+) to add a new advance record.',
    icon: 'bank-transfer',
    screenHint: 'AdvanceRecovery',
    actionHint: 'Open drawer → Advance Recovery',
  },

  // ── 8. Retention Monitor ─────────────────────────────────────────────────
  {
    id: 8,
    title: 'Retention Monitor',
    description:
      'Open the drawer and tap "Retention Monitor". Switch between Client tab (retention held from your KD invoices) and Vendor tab (retention you hold from subcontractors). Each row shows the invoice reference, gross amount, retention %, and an aging badge — green (<6 months), orange (6–12 months), red (>12 months). When a DLP end date has passed, a "Release" button appears to record the release.',
    icon: 'shield-lock',
    screenHint: 'RetentionMonitor',
    actionHint: 'Open drawer → Retention Monitor',
  },

  // ── 9. Variation Orders ──────────────────────────────────────────────────
  {
    id: 9,
    title: 'Variation Orders',
    description:
      'Open the drawer and tap "Variation Orders". This screen tracks all VOs with status chips — Pending (amber), Under Review (blue), Approved (green), Rejected (red). The summary card shows Total VO Value, Approved Value, and Revenue at Risk. For approved VOs, toggle "Include in next IPC" to queue them for billing. Tap a status chip on a pending VO to advance it through the workflow. Use the FAB (+) to raise a new VO.',
    icon: 'file-edit',
    screenHint: 'VariationOrders',
    actionHint: 'Open drawer → Variation Orders',
  },

  // ── 10. Vendor Payments ──────────────────────────────────────────────────
  {
    id: 10,
    title: 'Vendor Payment Tracker',
    description:
      'Open the drawer and tap "Vendor Payments". This screen shows all active vendors with POs or invoices on your project. For each vendor you see: PO Value, Invoiced, Paid, Retention Held, TDS, and Net Payable. A payment recommendation chip — Full (green), Partial (amber), or Hold (red) — is computed automatically. Hold triggers include overdue invoices, excessive advance deductions, or zero prior payments. Use the filters: All / Due This Week / Overdue.',
    icon: 'account-cash',
    screenHint: 'VendorPayments',
    actionHint: 'Open drawer → Vendor Payments',
  },

  // ── 11. Cash Flow Forecast ───────────────────────────────────────────────
  {
    id: 11,
    title: 'Cash Flow Forecast',
    description:
      'Open the drawer and tap "Cash Flow Forecast". This screen projects the next 6 months of inflows (pending KD target dates × weightage × contract value) vs outflows (pending vendor invoices + projected advance recovery). A horizontal bar chart shows each month\'s inflow and outflow side-by-side. Months with a funding gap are highlighted in red. The working capital requirement (peak gap) is shown prominently.',
    icon: 'chart-waterfall',
    screenHint: 'CashFlowForecast',
    actionHint: 'Open drawer → Cash Flow Forecast',
  },

  // ── 12. IPC Readiness ────────────────────────────────────────────────────
  {
    id: 12,
    title: 'IPC Pre-Flight Checklist',
    description:
      'Open the drawer and tap "IPC Readiness". This screen shows a pre-submission checklist for each Key Date before you raise an IPC. Three items are auto-checked from your data — VO approvals, LD status, and whether the previous IPC was paid. Five items require manual confirmation — engineer certificate, Measurement Book, BOQ reconciliation, hindrance review, and GST compliance. The readiness badge shows Safe (all mandatory items pass), Conditional (optional items missing), or Hold (mandatory items incomplete).',
    icon: 'clipboard-check',
    screenHint: 'IPCReadiness',
    actionHint: 'Open drawer → IPC Readiness',
  },

  // ── 13. Budget, Costs, Invoices ──────────────────────────────────────────
  {
    id: 13,
    title: 'Budget, Cost & Invoice Tabs',
    description:
      'The four tabs give you the core financial workflow: Budgets — create category budgets and track allocation vs spend. Costs — record project expenditure, assign to budget categories. Invoices — create client and vendor invoices, track payment status and due dates. Dashboard — all KPIs consolidated with period filtering and pull-to-refresh.',
    icon: 'wallet',
    screenHint: 'BudgetManagement',
    actionHint: 'Explore the tab bar',
  },

  // ── 14. Financial Reports ────────────────────────────────────────────────
  {
    id: 14,
    title: 'Financial Reports',
    description:
      'Open the drawer and tap "Financial Reports". This screen gives a date-filtered deep-dive: Profitability Overview (budget remaining, profit margin), Budget Variance by category, Cost Distribution (pie breakdown), Cash Flow Analysis (revenue vs costs), and Invoice Summary (paid, pending, overdue). Use the date range picker to analyze any period.',
    icon: 'file-chart',
    screenHint: 'FinancialReports',
    actionHint: 'Open drawer → Financial Reports',
  },

  // ── 15. Final Bill & DLP ─────────────────────────────────────────────────
  {
    id: 15,
    title: 'DLP & Final Bill Closure',
    description:
      'Open the drawer and tap "Final Bill & DLP". This screen tracks project commercial closure: the DLP Status banner (Open → DLP Running → Closure Ready) shows when the Defect Liability Period ends. The Retention Register lists every client retention with a one-tap "Release" button that activates once the DLP end date passes. The Closure Checklist (7 items: VOs settled, advances recovered, BGs returned, etc.) must be fully checked to mark the project as Commercially Closed.',
    icon: 'flag-checkered',
    screenHint: 'FinalBill',
    actionHint: 'Open drawer → Final Bill & DLP',
  },

  // ── 16. All Done ─────────────────────────────────────────────────────────
  {
    id: 16,
    title: "You're All Set!",
    description:
      'You now have the full Commercial Manager toolkit: KD Billing → IPC generation, LD Risk tracking, Advance Recovery scheduling, Retention monitoring, Variation Order approvals, Vendor Payment recommendations, Cash Flow forecasting, IPC Readiness pre-checks, and Final Bill closure. Pull-to-refresh anywhere to update data. Restart this tutorial anytime from the drawer menu.',
    icon: 'check-decagram',
    screenHint: 'Dashboard',
  },
];

export default commercialManagerTutorialSteps;
