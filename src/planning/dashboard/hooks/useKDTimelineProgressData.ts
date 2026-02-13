/**
 * useKDTimelineProgressData Hook
 *
 * Calculates Key Date timeline progress data for the dashboard widget.
 * Generates monthly timeline showing expected vs actual progress over time.
 * Uses shared dashboard cache from PlanningContext (no individual DB queries).
 *
 * @version 2.0.0
 * @since Planning Dashboard Phase 4
 */

import { useMemo } from 'react';
import { usePlanningContext } from '../../context';
import { calculateSiteProgressFromItems } from '../../utils/progressCalculations';

// ==================== Types ====================

export interface TimelineDataPoint {
  date: number;
  expectedProgress: number;
  actualProgress: number;
  label: string;
}

interface UseKDTimelineProgressResult {
  timelineData: TimelineDataPoint[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

// ==================== Helpers ====================

/**
 * Generate monthly time points from start to end date
 */
const generateTimePoints = (startDate: number, endDate: number): { date: number; label: string }[] => {
  const points: { date: number; label: string }[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);

  let currentDate = new Date(start.getFullYear(), start.getMonth(), 1);

  while (currentDate <= end) {
    points.push({
      date: currentDate.getTime(),
      label: currentDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
    });
    currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
  }

  return points;
};

// ==================== Hook ====================

/**
 * Hook for fetching KD timeline progress
 *
 * Generates a monthly timeline showing expected vs actual cumulative progress.
 * Uses cached data from PlanningContext instead of individual DB queries.
 */
export function useKDTimelineProgressData(): UseKDTimelineProgressResult {
  const { projectStartDate, projectEndDate, dashboardCache, refreshDashboard } = usePlanningContext();

  const timelineData = useMemo(() => {
    if (!dashboardCache.dataReady || !projectStartDate || !projectEndDate) {
      return [];
    }

    const { keyDates: kds, sitesByKdId, itemsBySite } = dashboardCache;

    if (kds.length === 0) return [];

    // Sort KDs by sequence order for fallback estimation
    const sortedKDs = [...kds].sort((a, b) => a.sequenceOrder - b.sequenceOrder);

    // Create a map to store estimated dates for KDs without target dates
    const estimatedDates = new Map<string, number>();
    const kdWithoutDates = sortedKDs.filter(kd => !kd.targetDate || typeof kd.targetDate !== 'number' || kd.targetDate <= 0);

    if (kdWithoutDates.length > 0) {
      const totalKDs = sortedKDs.length;
      const projectDuration = projectEndDate - projectStartDate;

      sortedKDs.forEach((kd, index) => {
        const hasValidDate = kd.targetDate && typeof kd.targetDate === 'number' && kd.targetDate > 0;
        if (!hasValidDate) {
          const estimatedDate = projectStartDate + (projectDuration * (index + 1) / totalKDs);
          estimatedDates.set(kd.id, estimatedDate);
        }
      });
    }

    // Calculate actual progress for each KD using cached data
    const kdDataMap = new Map<string, { targetDate: number | null; weightage: number; actualProgress: number; sequenceOrder: number }>();

    for (const kd of sortedKDs) {
      const kdSites = sitesByKdId[kd.id] || [];
      let kdProgress = kd.progressPercentage; // fallback

      if (kdSites.length > 0) {
        let siteWeightedSum = 0;
        for (const site of kdSites) {
          const siteItems = itemsBySite[site.siteId] || [];
          const siteProgress = calculateSiteProgressFromItems(siteItems);
          siteWeightedSum += (site.contributionPercentage / 100) * siteProgress;
        }
        kdProgress = siteWeightedSum;
      }

      const hasValidDate = kd.targetDate && typeof kd.targetDate === 'number' && kd.targetDate > 0;
      const targetDate: number | null = hasValidDate ? kd.targetDate! : (estimatedDates.get(kd.id) || null);

      kdDataMap.set(kd.id, {
        targetDate,
        weightage: kd.weightage || 0,
        actualProgress: kdProgress,
        sequenceOrder: kd.sequenceOrder,
      });
    }

    // Generate time points (monthly intervals)
    let timePoints = generateTimePoints(projectStartDate, projectEndDate);

    // Find the latest KD target date to ensure our timeline covers all KDs
    const latestKDDate = Math.max(...Array.from(kdDataMap.values())
      .filter(kd => kd.targetDate)
      .map(kd => kd.targetDate!));

    if (latestKDDate > projectEndDate) {
      timePoints = generateTimePoints(projectStartDate, latestKDDate);
    }

    // Calculate total weightage for normalization
    let totalWeightage = Array.from(kdDataMap.values()).reduce((sum, kd) => sum + kd.weightage, 0);

    if (totalWeightage === 0) {
      const evenWeightage = 100 / kdDataMap.size;
      kdDataMap.forEach(kd => {
        kd.weightage = evenWeightage;
      });
      totalWeightage = 100;
    }

    // Get current date for actual progress cutoff
    const currentDate = Date.now();

    // Calculate current overall actual progress (weighted sum of all KDs)
    let totalActualProgress = 0;
    kdDataMap.forEach(kd => {
      totalActualProgress += kd.weightage * (kd.actualProgress / 100);
    });
    const currentOverallProgress = Math.round((totalActualProgress / totalWeightage) * 100);

    // Find the index of the current month in the timeline
    const currentMonthIndex = timePoints.findIndex(point => point.date > currentDate) - 1;
    const validCurrentIndex = Math.max(0, currentMonthIndex);

    // Calculate cumulative progress for all time points
    const timeline: TimelineDataPoint[] = timePoints.map((point, index) => {
      let expectedCumulative = 0;

      kdDataMap.forEach(kd => {
        if (kd.targetDate && kd.targetDate <= point.date) {
          expectedCumulative += kd.weightage;
        }
      });

      const expectedPct = Math.round((expectedCumulative / totalWeightage) * 100);

      let actualPct: number;
      if (index <= validCurrentIndex) {
        actualPct = Math.round((currentOverallProgress * index) / Math.max(1, validCurrentIndex));
      } else {
        actualPct = currentOverallProgress;
      }

      return {
        date: point.date,
        expectedProgress: expectedPct,
        actualProgress: actualPct,
        label: point.label,
      };
    });

    return timeline;
  }, [dashboardCache, projectStartDate, projectEndDate]);

  return {
    timelineData,
    loading: !dashboardCache.dataReady,
    error: null,
    refresh: refreshDashboard,
  };
}
