/**
 * Designer (Design Engineer) Tutorial Steps
 *
 * Defines the 9-step walkthrough for the Design Engineer role.
 * Each step has a title, description, icon, and optional
 * screen/action hints for navigation context.
 *
 * @version 1.0.0
 * @since v2.14 - Design Engineer Tutorial & Demo Data
 */

import { TutorialStep } from './plannerTutorialSteps';

const designerTutorialSteps: TutorialStep[] = [
  {
    id: 1,
    title: 'Welcome',
    description:
      "Welcome to the Design Engineer Module! This tutorial will guide you through managing DOORS packages, Design RFQs, and Design Documents for your project.",
    icon: 'hand-wave',
  },
  {
    id: 2,
    title: 'Dashboard Overview',
    description:
      'This is your Design Engineer Dashboard. It shows DOORS package status, RFQ metrics, design document progress, compliance rates, and processing times at a glance.',
    icon: 'view-dashboard',
    screenHint: 'Dashboard',
  },
  {
    id: 3,
    title: 'DOORS Packages',
    description:
      'Navigate to the DOORS Packages tab. Each package contains 100 engineering requirements per equipment/material. Tap the + button to create a new package.',
    icon: 'package-variant',
    screenHint: 'DoorsPackages',
    actionHint: 'Tap the + button',
  },
  {
    id: 4,
    title: 'Manage Requirements',
    description:
      'Each DOORS package tracks 100 requirements through stages: Pending, Received, Under Review, and Approved. Update requirement status as you progress.',
    icon: 'clipboard-check-outline',
    screenHint: 'DoorsPackages',
    actionHint: 'Tap a package to view requirements',
  },
  {
    id: 5,
    title: 'Design RFQs',
    description:
      'Go to the Design RFQs tab. Create RFQs during the engineering phase (pre-PM200) to request quotes from vendors. Track RFQs from Draft to Issued to Awarded.',
    icon: 'file-document-edit',
    screenHint: 'DesignRfqs',
    actionHint: 'Tap the + button',
  },
  {
    id: 6,
    title: 'Design Documents',
    description:
      'Open the Design Docs tab. Manage technical documents including submissions, customer comments, and approvals. Organize by categories for easy tracking.',
    icon: 'file-cad-box',
    screenHint: 'DesignDocuments',
    actionHint: 'Tap the + button',
  },
  {
    id: 7,
    title: 'Document Categories',
    description:
      'Use document categories to organize your design documents. Categories help filter and manage documents efficiently across the project lifecycle.',
    icon: 'folder-multiple',
    screenHint: 'DesignDocuments',
    actionHint: 'Use the Manage Categories option',
  },
  {
    id: 8,
    title: 'Track Compliance',
    description:
      'The Compliance widget on your dashboard shows the percentage of requirements meeting standards. Monitor processing times to identify bottlenecks.',
    icon: 'shield-check',
    screenHint: 'Dashboard',
  },
  {
    id: 9,
    title: 'Monitor Progress',
    description:
      "Return to the Dashboard to see your overall progress. The Recent Activity widget shows latest updates. You're all set to manage engineering workflows!",
    icon: 'chart-line',
    screenHint: 'Dashboard',
  },
];

export default designerTutorialSteps;
