import { useMemo } from 'react';
import { ProjectStats, ProjectInfo } from '../state';
import { getKPIIndicatorColor, formatCurrency } from '../utils/dashboardFormatters';
import { COLORS } from '../../../theme/colors';

export interface KPIMetric {
  label: string;
  value: string | number;
  subtext: string;
  indicatorColor: string;
}

export const useKPIMetrics = (
  stats: ProjectStats,
  projectInfo: ProjectInfo | null
): KPIMetric[] => {
  return useMemo(() => {
    if (!projectInfo) return [];

    return [
      // KPI 1: Sites Status
      {
        label: 'Sites Status',
        value: `${stats.sitesOnSchedule}/${stats.totalSites}`,
        subtext: stats.sitesDelayed > 0 ? `${stats.sitesDelayed} delayed` : 'All on schedule',
        indicatorColor: getKPIIndicatorColor(stats.sitesDelayed, 0, 2, true),
      },
      // KPI 2: Budget Utilization
      {
        label: 'Budget Used',
        value: `${stats.budgetUtilization.toFixed(1)}%`,
        subtext: `of ${formatCurrency(projectInfo.budget)}`,
        indicatorColor:
          stats.budgetUtilization <= 100
            ? COLORS.SUCCESS
            : stats.budgetUtilization <= 110
            ? '#FFC107'
            : COLORS.ERROR,
      },
      // KPI 3: Open Issues
      {
        label: 'Open Issues',
        value: stats.openHindrances,
        subtext: stats.openHindrances === 0 ? 'No open issues' : 'Requires attention',
        indicatorColor: getKPIIndicatorColor(stats.openHindrances, 0, 5, true),
      },
      // KPI 4: Critical Path Risk
      {
        label: 'Critical Path',
        value: stats.criticalPathItemsAtRisk,
        subtext: stats.criticalPathItemsAtRisk === 0 ? 'No risks' : 'Items at risk',
        indicatorColor: getKPIIndicatorColor(stats.criticalPathItemsAtRisk, 0, 3, true),
      },
      // KPI 5: Pending Approvals
      {
        label: 'Approvals',
        value: stats.pendingApprovals,
        subtext: stats.pendingApprovals === 0 ? 'All cleared' : 'Pending review',
        indicatorColor: getKPIIndicatorColor(stats.pendingApprovals, 0, 5, true),
      },
      // KPI 6: Equipment Delivery
      {
        label: 'Deliveries',
        value: `${stats.deliveryOnTrack}/${stats.deliveryOnTrack + stats.deliveryDelayed}`,
        subtext: stats.deliveryDelayed > 0 ? `${stats.deliveryDelayed} delayed` : 'On track',
        indicatorColor: getKPIIndicatorColor(stats.deliveryDelayed, 0, 2, true),
      },
      // KPI 7: Upcoming Milestones
      {
        label: 'Milestones',
        value: stats.upcomingMilestones,
        subtext: 'Next 30 days',
        indicatorColor: COLORS.INFO, // Info color
      },
      // KPI 8: Active Supervisors
      {
        label: 'Supervisors',
        value: stats.activeSupervisors,
        subtext: 'Active on sites',
        indicatorColor: COLORS.SUCCESS, // Success color
      },
    ];
  }, [stats, projectInfo]);
};
