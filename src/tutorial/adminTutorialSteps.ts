/**
 * Admin Tutorial Steps
 *
 * Defines the 10-step walkthrough for the Admin role.
 * Each step has a title, description, icon, and optional
 * screen/action hints for navigation context.
 *
 * @version 1.0.0
 * @since v2.16 - Admin Tutorial
 */

import { TutorialStep } from './plannerTutorialSteps';

const adminTutorialSteps: TutorialStep[] = [
  {
    id: 1,
    title: 'Welcome, Admin',
    description:
      'Welcome to the Admin Module! This tutorial covers system management, user control, and monitoring tools that keep MRE Site Tracker running smoothly.',
    icon: 'hand-wave',
    emoji: '👋',
  },
  {
    id: 2,
    title: 'Dashboard Overview',
    description:
      'The Admin Dashboard shows system health, user activity, sync status, and quick stats at a glance. Pull down to refresh all widgets.',
    icon: 'view-dashboard',
    emoji: '📊',
    screenHint: 'AdminDashboard',
  },
  {
    id: 3,
    title: 'System Health',
    description:
      'The System Health widget monitors database status, network connectivity, and sync health. Tap it to open Sync Monitoring for detailed diagnostics.',
    icon: 'heart-pulse',
    emoji: '💚',
    screenHint: 'AdminDashboard',
    actionHint: 'Tap System Health widget',
  },
  {
    id: 4,
    title: 'Quick Stats & User Activity',
    description:
      'Quick Stats shows total projects and users. Tap either count to jump straight to that management screen. User Activity shows login and engagement metrics.',
    icon: 'chart-bar',
    emoji: '📈',
    screenHint: 'AdminDashboard',
    actionHint: 'Tap Projects or Users count',
  },
  {
    id: 5,
    title: 'Project Management',
    description:
      'Go to the Projects tab. Create new projects, set contract values, assign dates, and delete completed ones. All role-specific data is scoped under projects.',
    icon: 'folder-multiple',
    emoji: '📁',
    screenHint: 'ProjectManagement',
    actionHint: 'Tap the Projects tab',
  },
  {
    id: 6,
    title: 'User & Role Management',
    description:
      'Go to the Users tab. Create user accounts, set passwords, and assign roles (Supervisor, Planner, Manager, etc.). Each user can only access their own role module.',
    icon: 'account-group',
    emoji: '👥',
    screenHint: 'RoleManagement',
    actionHint: 'Tap the Users tab',
  },
  {
    id: 7,
    title: 'Role Switcher',
    description:
      'Back on the Dashboard, use the Role Switcher card to preview the app as any other role. This lets you verify the experience without separate accounts.',
    icon: 'swap-horizontal',
    emoji: '🔄',
    screenHint: 'AdminDashboard',
    actionHint: 'Tap Role Switcher card',
  },
  {
    id: 8,
    title: 'Demo Data',
    description:
      'Use the Demo Data card to seed sample projects, users, and records for any role. Useful for testing and demonstrations. Requires an empty database.',
    icon: 'database-plus',
    emoji: '🗃️',
    screenHint: 'AdminDashboard',
    actionHint: 'Tap Demo Data card',
  },
  {
    id: 9,
    title: 'Backup & Sync',
    description:
      'Use Database Backup to export all data to a file for safekeeping. The Sync Status widget shows pending sync items — tap Sync Now to push changes immediately.',
    icon: 'backup-restore',
    emoji: '💾',
    screenHint: 'AdminDashboard',
    actionHint: 'Tap Database Backup card',
  },
  {
    id: 10,
    title: 'Database Reset',
    description:
      "The Database Reset card wipes all local data and restores defaults. Use only in emergencies or for a clean demo setup. You're all set — manage with confidence!",
    icon: 'shield-check',
    emoji: '✅',
    screenHint: 'AdminDashboard',
  },
];

export default adminTutorialSteps;
