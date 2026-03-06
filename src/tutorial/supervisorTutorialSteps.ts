/**
 * Supervisor Tutorial Steps
 *
 * Defines the 11-step walkthrough for the Supervisor role.
 * Each step has a title, description, icon, and optional
 * screen/action hints for navigation context.
 *
 * @version 1.0.0
 * @since v2.15 - Supervisor Tutorial & Demo Data
 */

import { TutorialStep } from './plannerTutorialSteps';

const supervisorTutorialSteps: TutorialStep[] = [
  {
    id: 1,
    title: 'Welcome',
    description:
      "Welcome to the Supervisor Module! This tutorial will guide you through managing construction sites, tracking daily progress, and reporting issues.",
    icon: 'hand-wave',
    emoji: '👋',
  },
  {
    id: 2,
    title: 'Dashboard Overview',
    description:
      'This is your Supervisor Dashboard. It shows Active Sites, Today\'s Progress, Pending Items, and Reports Submitted. Quick action buttons let you navigate to key tasks.',
    icon: 'view-dashboard',
    emoji: '📊',
    screenHint: 'Dashboard',
  },
  {
    id: 3,
    title: 'Manage Sites',
    description:
      'Navigate to the Sites tab. Create construction sites for your project by tapping the + button. Each site has a name and location.',
    icon: 'office-building',
    emoji: '🏢',
    screenHint: 'Sites',
    actionHint: 'Tap the + button to add a site',
  },
  {
    id: 4,
    title: 'Manage Work Items',
    description:
      'Go to the Items tab. First select a site, then create work items to track. Set category, quantity, unit, weightage, and planned dates.',
    icon: 'clipboard-list',
    emoji: '📋',
    screenHint: 'Items',
    actionHint: 'Select a site, then tap + to add an item',
  },
  {
    id: 5,
    title: 'Update Daily Progress',
    description:
      'Open the Daily Work tab. Select a site and update item progress by tapping Update. Add completed quantity, notes, and photos.',
    icon: 'progress-check',
    emoji: '✅',
    screenHint: 'DailyWork',
    actionHint: 'Tap Update on any item',
  },
  {
    id: 6,
    title: 'Submit Progress Reports',
    description:
      'After updating items, tap "Submit Progress Reports" to create a daily report. PDF reports are generated automatically for sharing.',
    icon: 'file-document-check',
    emoji: '📄',
    screenHint: 'DailyWork',
    actionHint: 'Tap Submit Progress Reports',
  },
  {
    id: 7,
    title: 'Conduct Site Inspections',
    description:
      'Open the drawer menu and tap Site Inspection. Create inspections with checklists, ratings, and photos. Flag safety issues if needed.',
    icon: 'clipboard-check',
    emoji: '🔍',
    screenHint: 'Inspection',
    actionHint: 'Open drawer \u2192 Site Inspection',
  },
  {
    id: 8,
    title: 'Report Hindrances',
    description:
      'From the drawer, open Hindrance Reports. Report construction issues with title, description, priority, and photos. Link issues to specific items.',
    icon: 'alert-circle',
    emoji: '⚠️',
    screenHint: 'Issues',
    actionHint: 'Open drawer \u2192 Hindrance Reports',
  },
  {
    id: 9,
    title: 'Track Materials',
    description:
      'Open Material Tracking from the drawer. Track materials for your items including required quantities, availability, usage, and supplier details.',
    icon: 'package-variant',
    emoji: '📦',
    screenHint: 'Materials',
    actionHint: 'Open drawer \u2192 Material Tracking',
  },
  {
    id: 10,
    title: 'View Reports History',
    description:
      'Open Reports History from the drawer. View past daily reports, filter by date, and download or share PDF reports.',
    icon: 'history',
    emoji: '🕐',
    screenHint: 'History',
    actionHint: 'Open drawer \u2192 Reports History',
  },
  {
    id: 11,
    title: 'Monitor Progress',
    description:
      "Return to the Dashboard to see your updated metrics. The app works offline too - your data syncs when you're back online. You're all set!",
    icon: 'chart-line',
    emoji: '📈',
    screenHint: 'Dashboard',
  },
];

export default supervisorTutorialSteps;
