/**
 * Commercial Manager Tutorial Steps
 *
 * Defines the 11-step walkthrough for the Commercial Manager role.
 * Each step has a title, description, icon, and optional
 * screen/action hints for navigation context.
 *
 * @version 1.0.0
 * @since v2.18 - Commercial Manager Tutorial & Demo Data
 */

import { TutorialStep } from './plannerTutorialSteps';

const commercialManagerTutorialSteps: TutorialStep[] = [
  {
    id: 1,
    title: 'Welcome',
    description:
      "Welcome to the Commercial Manager Module! This tutorial will guide you through financial management, budget tracking, cost control, and invoice processing.",
    icon: 'hand-wave',
  },
  {
    id: 2,
    title: 'Dashboard Overview',
    description:
      'This is your Commercial Dashboard. View key financial metrics including budget health, cash flow, invoice status, and category spending. Use the period selector (MTD, QTD, YTD) to analyze different timeframes.',
    icon: 'view-dashboard',
    screenHint: 'Dashboard',
  },
  {
    id: 3,
    title: 'Budget Health Widget',
    description:
      'The Budget Health widget shows total budget, spent amount, percentage used, and trend indicators. Tap the widget to drill down into Budget Management for detailed analysis.',
    icon: 'currency-usd',
    screenHint: 'Dashboard',
    actionHint: 'View Budget Health widget',
  },
  {
    id: 4,
    title: 'Cash Flow Tracking',
    description:
      'Monitor cash flow with inflow (revenue), outflow (costs), and net cash flow. The trend chart visualizes your financial position over time. Tap to access detailed Financial Reports.',
    icon: 'chart-line',
    screenHint: 'Dashboard',
    actionHint: 'View Cash Flow widget',
  },
  {
    id: 5,
    title: 'Invoice Status',
    description:
      'Track invoice summary by status: Pending, Paid, and Overdue. View total counts and amounts. Tap status badges to filter invoices by their current state.',
    icon: 'receipt',
    screenHint: 'Dashboard',
    actionHint: 'View Invoice Status widget',
  },
  {
    id: 6,
    title: 'Category Spending',
    description:
      'Analyze spending across categories (Labor, Material, Equipment, Subcontractor, Other). Compare budgeted vs actual spending. Tap categories to filter costs in Cost Tracking.',
    icon: 'chart-pie',
    screenHint: 'Dashboard',
    actionHint: 'View Category Spending widget',
  },
  {
    id: 7,
    title: 'Budget Management',
    description:
      'Navigate to the Budgets tab. Create and manage category budgets, set allocation amounts, track utilization, and monitor budget variance across your project.',
    icon: 'wallet',
    screenHint: 'BudgetManagement',
    actionHint: 'Tap the Budgets tab',
  },
  {
    id: 8,
    title: 'Cost Tracking',
    description:
      'Go to the Costs tab. Record and categorize project costs, upload receipts, assign to budget categories, and track actual spending against planned budgets.',
    icon: 'cash-register',
    screenHint: 'CostTracking',
    actionHint: 'Tap the Costs tab',
  },
  {
    id: 9,
    title: 'Invoice Management',
    description:
      'Open the Invoices tab. Create invoices for clients, track payment status, manage due dates, and send reminders for overdue payments. Filter by status and export reports.',
    icon: 'file-document',
    screenHint: 'InvoiceManagement',
    actionHint: 'Tap the Invoices tab',
  },
  {
    id: 10,
    title: 'Financial Reports',
    description:
      'Access Financial Reports from the drawer menu. Generate comprehensive reports including P&L statements, budget variance analysis, cash flow statements, and cost breakdown reports.',
    icon: 'file-chart',
    screenHint: 'FinancialReports',
    actionHint: 'Open drawer and tap Financial Reports',
  },
  {
    id: 11,
    title: 'Monitor Finances',
    description:
      "Return to the Dashboard to track your financial metrics. Use pull-to-refresh to update data. Access the tutorial anytime from the drawer menu. You're all set!",
    icon: 'check-circle',
    screenHint: 'Dashboard',
  },
];

export default commercialManagerTutorialSteps;
