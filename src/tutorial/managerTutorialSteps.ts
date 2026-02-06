/**
 * Manager Tutorial Steps
 *
 * Defines the 11-step walkthrough for the Manager role.
 * Each step has a title, description, icon, and optional
 * screen/action hints for navigation context.
 *
 * @version 1.0.0
 * @since v2.16 - Manager Tutorial & Demo Data
 */

import { TutorialStep } from './plannerTutorialSteps';

const managerTutorialSteps: TutorialStep[] = [
  {
    id: 1,
    title: 'Welcome',
    description:
      "Welcome to the Manager Module! This tutorial will guide you through monitoring project progress, managing finances, and coordinating across teams.",
    icon: 'hand-wave',
  },
  {
    id: 2,
    title: 'Dashboard Overview',
    description:
      'This is your Manager Dashboard. It shows 8 KPI cards covering project completion, site status, budget utilization, open issues, deliveries, and milestones. Progress uses a hybrid calculation: 60% Items + 40% Milestones.',
    icon: 'view-dashboard',
    screenHint: 'Dashboard',
  },
  {
    id: 3,
    title: 'Engineering Progress',
    description:
      'The Engineering Progress section tracks PM200 milestone status, DOORS package approvals, requirements compliance, and Design RFQ progress across your project.',
    icon: 'cog',
    screenHint: 'Dashboard',
    actionHint: 'Scroll to Engineering Progress section',
  },
  {
    id: 4,
    title: 'Site Progress Comparison',
    description:
      'Compare all sites side-by-side. Each site card shows hybrid progress (60% items + 40% milestones), supervisor assignment, schedule status, and critical issue count.',
    icon: 'office-building',
    screenHint: 'Dashboard',
    actionHint: 'Scroll to Site Progress Comparison section',
  },
  {
    id: 5,
    title: 'Equipment & Materials',
    description:
      'Track Procurement (PM300) and Manufacturing (PM400) milestones. View Purchase Order pipeline by status: Draft, Issued, In Progress, and Delivered. Monitor delivery schedules and delays.',
    icon: 'package-variant',
    screenHint: 'Dashboard',
    actionHint: 'Scroll to Equipment & Materials Status section',
  },
  {
    id: 6,
    title: 'Financial Summary',
    description:
      'Review budget overview, utilization percentage, profitability margins, and BOM cost tracking. Compares estimated vs actual costs across all purchase orders and BOMs.',
    icon: 'currency-usd',
    screenHint: 'Dashboard',
    actionHint: 'Scroll to Financial Summary section',
  },
  {
    id: 7,
    title: 'Team Performance',
    description:
      'Navigate to the Team tab. View supervisor performance metrics including site progress, report submissions, and issue resolution rates across your project team.',
    icon: 'account-group',
    screenHint: 'TeamPerformance',
    actionHint: 'Tap the Team tab',
  },
  {
    id: 8,
    title: 'Financial Reports',
    description:
      'Open the Finance tab. Access detailed financial analysis including cost breakdowns, variance reports, and budget forecasting for informed decision-making.',
    icon: 'chart-bar',
    screenHint: 'FinancialReports',
    actionHint: 'Tap the Finance tab',
  },
  {
    id: 9,
    title: 'Milestone Management',
    description:
      'Go to the Milestones tab. Track PM100 through PM700 milestones covering Requirements, Design, Procurement, Manufacturing, Testing, Commissioning, and Handover progress per site.',
    icon: 'flag-checkered',
    screenHint: 'Milestones',
    actionHint: 'Tap the Milestones tab',
  },
  {
    id: 10,
    title: 'BOM Management',
    description:
      'Open the BOM tab. Create and manage Bills of Materials for estimating and execution. Add line items with categories (material, labor, equipment, subcontractor), track quantities and costs.',
    icon: 'clipboard-list',
    screenHint: 'BomManagement',
    actionHint: 'Tap the BOM tab',
  },
  {
    id: 11,
    title: 'Monitor Progress',
    description:
      "Return to the Dashboard to see your updated metrics. Use the Role Switcher to view the app as other roles for cross-department coordination. You're all set!",
    icon: 'chart-line',
    screenHint: 'Dashboard',
  },
];

export default managerTutorialSteps;
