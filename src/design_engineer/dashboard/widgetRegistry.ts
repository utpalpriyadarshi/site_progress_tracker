import type { DashboardLayout } from './types/dashboard';

/**
 * Widget Registry - Defines available widgets and default layout
 *
 * This registry maps widget IDs to their configurations and provides
 * a default dashboard layout for the Design Engineer role.
 */

export const WIDGET_IDS = {
  DOORS_STATUS: 'doors-status',
  RFQ_STATUS: 'rfq-status',
  COMPLIANCE: 'compliance',
  PROCESSING_TIME: 'processing-time',
  RECENT_ACTIVITY: 'recent-activity',
} as const;

/**
 * Default dashboard layout for Design Engineer
 *
 * Layout order:
 * 1. DOORS Packages Status (medium, chart)
 * 2. RFQ Status (medium, chart)
 * 3. Compliance Rate (small, metric)
 * 4. Processing Time (medium, metric)
 * 5. Recent Activity (large, list)
 */
export const defaultDesignEngineerLayout: DashboardLayout = {
  columns: 1,
  spacing: 16,
  widgets: [
    {
      id: WIDGET_IDS.DOORS_STATUS,
      type: 'chart',
      title: 'DOORS Packages',
      size: 'medium',
      position: { x: 0, y: 0 },
      refreshable: true,
      configurable: false,
      data: null,
    },
    {
      id: WIDGET_IDS.RFQ_STATUS,
      type: 'chart',
      title: 'Design RFQs',
      size: 'medium',
      position: { x: 0, y: 1 },
      refreshable: true,
      configurable: false,
      data: null,
    },
    {
      id: WIDGET_IDS.COMPLIANCE,
      type: 'metric',
      title: 'Compliance Rate',
      size: 'small',
      position: { x: 0, y: 2 },
      refreshable: true,
      configurable: false,
      data: null,
    },
    {
      id: WIDGET_IDS.PROCESSING_TIME,
      type: 'metric',
      title: 'Processing Time',
      size: 'medium',
      position: { x: 0, y: 3 },
      refreshable: true,
      configurable: false,
      data: null,
    },
    {
      id: WIDGET_IDS.RECENT_ACTIVITY,
      type: 'list',
      title: 'Recent Activity',
      size: 'large',
      position: { x: 0, y: 4 },
      refreshable: true,
      configurable: false,
      data: null,
    },
  ],
};
