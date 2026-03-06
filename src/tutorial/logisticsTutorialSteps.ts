/**
 * Logistics Tutorial Steps
 *
 * Defines the 12-step walkthrough for the Logistics role.
 * Each step has a title, description, icon, and optional
 * screen/action hints for navigation context.
 *
 * @version 1.0.0
 * @since v2.17 - Logistics Tutorial & Purple Header
 */

import { TutorialStep } from './plannerTutorialSteps';

const logisticsTutorialSteps: TutorialStep[] = [
  {
    id: 1,
    title: 'Welcome',
    description:
      "Welcome to the Logistics Module! This tutorial will guide you through material tracking, inventory management, delivery scheduling, and more.",
    icon: 'hand-wave',
    emoji: '👋',
  },
  {
    id: 2,
    title: 'Dashboard Overview',
    description:
      'This is your Logistics Dashboard. View key widgets including material status, inventory levels, upcoming deliveries, and equipment availability at a glance.',
    icon: 'view-dashboard',
    emoji: '📊',
    screenHint: 'Dashboard',
  },
  {
    id: 3,
    title: 'Material Tracking',
    description:
      'Navigate to the Materials tab. Track material requests, approvals, and deliveries across all sites. Monitor material categories: Electrical, Mechanical, Civil, and Piping.',
    icon: 'package-variant',
    emoji: '📦',
    screenHint: 'Materials',
    actionHint: 'Tap the Materials tab',
  },
  {
    id: 4,
    title: 'Inventory Management',
    description:
      'Open the Inventory tab. Manage stock levels across warehouses and sites. Track item quantities, locations, reorder points, and movement history.',
    icon: 'warehouse',
    emoji: '🏭',
    screenHint: 'Inventory',
    actionHint: 'Tap the Inventory tab',
  },
  {
    id: 5,
    title: 'Delivery Scheduling',
    description:
      'Go to the Deliveries tab. Schedule deliveries, assign vehicles, track delivery status, and coordinate with vendors. View upcoming, in-progress, and completed deliveries.',
    icon: 'truck-delivery',
    emoji: '🚚',
    screenHint: 'Deliveries',
    actionHint: 'Tap the Deliveries tab',
  },
  {
    id: 6,
    title: 'Analytics Reports',
    description:
      'Open the drawer menu (tap ☰) and select Analytics. View detailed reports including material consumption trends, inventory turnover, delivery performance, and cost analysis.',
    icon: 'chart-line',
    emoji: '📈',
    screenHint: 'Analytics',
    actionHint: 'Tap hamburger menu → Analytics',
  },
  {
    id: 7,
    title: 'Equipment Management',
    description:
      'From the drawer, access Equipment Management. Track heavy machinery, tools, vehicles, and their assignments. Monitor equipment status, location, maintenance schedules, and utilization.',
    icon: 'hammer-wrench',
    emoji: '🔧',
    screenHint: 'Equipment',
    actionHint: 'Tap hamburger menu → Equipment',
  },
  {
    id: 8,
    title: 'Purchase Orders',
    description:
      'Navigate to Purchase Orders from the drawer. Create, review, and track purchase orders. Monitor PO status: Draft, Issued, In Progress, Delivered, and Closed.',
    icon: 'clipboard-list',
    emoji: '📋',
    screenHint: 'PurchaseOrders',
    actionHint: 'Tap hamburger menu → Purchase Orders',
  },
  {
    id: 9,
    title: 'DOORS Register',
    description:
      'Access the DOORS Register from the drawer. View design requirements packages, compliance status, and link requirements to procurement. Track package approvals and requirement traceability.',
    icon: 'door',
    emoji: '🚪',
    screenHint: 'DoorsRegister',
    actionHint: 'Tap hamburger menu → DOORS Register',
  },
  {
    id: 10,
    title: 'RFQ Management',
    description:
      'Open RFQ Management from the drawer. Create Request for Quotations, invite vendors, evaluate quotes, and award contracts. Link RFQs to DOORS packages for requirements traceability.',
    icon: 'file-document-outline',
    emoji: '📄',
    screenHint: 'RfqList',
    actionHint: 'Tap hamburger menu → RFQ Management',
  },
  {
    id: 11,
    title: 'Offline Mode',
    description:
      'Logistics supports offline work. When disconnected, you can view data and make changes. All updates will automatically sync when you reconnect to the network.',
    icon: 'cloud-off-outline',
    emoji: '☁️',
    screenHint: 'Dashboard',
  },
  {
    id: 12,
    title: 'Monitor Progress',
    description:
      "Return to the Dashboard to see your updated metrics and widgets. Use the hamburger menu (☰) to access all Logistics features. You're all set!",
    icon: 'chart-line-variant',
    emoji: '📊',
    screenHint: 'Dashboard',
  },
];

export default logisticsTutorialSteps;
