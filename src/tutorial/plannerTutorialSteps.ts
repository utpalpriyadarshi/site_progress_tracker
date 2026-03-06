/**
 * Planner Tutorial Steps
 *
 * Defines the 11-step walkthrough for the Planning role.
 * Each step has a title, description, icon, and optional
 * screen/action hints for navigation context.
 *
 * @version 1.1.0
 * @since v2.13 - App Tutorial & Demo Data
 */

export interface TutorialStep {
  id: number;
  title: string;
  description: string;
  icon: string;          // MaterialCommunityIcons name
  emoji: string;         // Unicode emoji fallback for Modal rendering
  screenHint?: string;   // Which screen/tab to navigate to
  actionHint?: string;   // What button/action to look for
}

const plannerTutorialSteps: TutorialStep[] = [
  {
    id: 1,
    title: 'Welcome',
    description:
      "Welcome to the Planning Module! Let's walk through how to set up your project. This tutorial will guide you through the key workflows step by step.",
    icon: 'hand-wave',
    emoji: '👋',
  },
  {
    id: 2,
    title: 'Dashboard Overview',
    description:
      'This is your Planning Dashboard. It shows project health, Key Date progress, schedule overview, and resource status at a glance.',
    icon: 'view-dashboard',
    emoji: '📊',
    screenHint: 'Dashboard',
  },
  {
    id: 3,
    title: 'Create Key Dates',
    description:
      'Navigate to the Key Dates tab. Key Dates are major milestones your project must hit. Tap the + button to create one.',
    icon: 'calendar-star',
    emoji: '⭐',
    screenHint: 'KeyDates',
    actionHint: 'Tap the + button',
  },
  {
    id: 4,
    title: 'Configure Key Date',
    description:
      'Set the KD code, category, description, target days from commencement, and weightage (%) for progress rollup.',
    icon: 'cog',
    emoji: '⚙️',
    screenHint: 'KeyDates',
    actionHint: 'Fill in the Key Date form',
  },
  {
    id: 5,
    title: 'Add Sites',
    description:
      'Go to the Sites screen (drawer menu). Create construction sites for your project with location and planned dates.',
    icon: 'map-marker-plus',
    emoji: '📍',
    screenHint: 'Sites',
    actionHint: 'Open drawer menu \u2192 Sites',
  },
  {
    id: 6,
    title: 'Link Sites to Key Dates',
    description:
      "Back on Key Dates, tap a KD card \u2192 'Manage Sites'. Link sites and set each site's contribution percentage (should total 100%).",
    icon: 'link-variant',
    emoji: '🔗',
    screenHint: 'KeyDates',
    actionHint: 'Tap a KD card \u2192 Manage Sites',
  },
  {
    id: 7,
    title: 'Create WBS Items',
    description:
      'Open the WBS screen (drawer menu). Select a site, then create Work Breakdown Structure items with phases, quantities, and dates.',
    icon: 'file-tree',
    emoji: '📂',
    screenHint: 'WBS',
    actionHint: 'Open drawer menu \u2192 WBS',
  },
  {
    id: 8,
    title: 'Baseline & Critical Path',
    description:
      'Go to Baseline screen. Set item dependencies, then tap "Calculate Critical Path" to identify the longest path. Items on the critical path are highlighted with red borders.',
    icon: 'chart-timeline-variant',
    emoji: '📈',
    screenHint: 'Baseline',
    actionHint: 'Open drawer menu \u2192 Baseline',
  },
  {
    id: 9,
    title: 'Track Milestones',
    description:
      'Open Milestones screen. View project milestones (PM100-PM700) covering Requirements, Design, Procurement, Manufacturing, Testing, Commissioning, and Handover. Select a site to track progress.',
    icon: 'flag-checkered',
    emoji: '🏁',
    screenHint: 'Milestones',
    actionHint: 'Open drawer menu \u2192 Milestones',
  },
  {
    id: 10,
    title: 'View Schedule & Gantt',
    description:
      'Check the Schedule and Gantt tabs to see your timeline. Items appear based on their planned dates.',
    icon: 'chart-gantt',
    emoji: '📅',
    screenHint: 'Schedule',
  },
  {
    id: 11,
    title: 'Monitor Progress',
    description:
      "Return to Dashboard. The Project Progress widget shows weighted rollup from your Key Dates. You're all set!",
    icon: 'chart-line',
    emoji: '📉',
    screenHint: 'Dashboard',
  },
];

export default plannerTutorialSteps;
