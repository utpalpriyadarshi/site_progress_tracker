/**
 * useKDProgressChartData Hook
 *
 * Calculates Key Date progress chart data for the dashboard widget.
 * Uses shared dashboard cache from PlanningContext (no individual DB queries).
 *
 * @version 2.0.0
 * @since Planning Dashboard Phase 4
 */

import { useMemo } from 'react';
import { usePlanningContext } from '../../context';
import { calculateSiteProgressFromDesignDocuments, calculateKDProgress } from '../../utils/designDocumentProgress';
import { calculateSiteProgressFromItems } from '../../utils/progressCalculations';

// ==================== Types ====================

export interface KDProgressDataPoint {
  id: string;
  code: string;
  targetDate: number | null;
  progress: number;
  sequenceOrder: number;
}

interface UseKDProgressChartResult {
  keyDates: KDProgressDataPoint[];
  projectStartDate: number | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

// ==================== Hook ====================

/**
 * Hook for fetching KD progress chart data
 *
 * Calculates actual progress for each Key Date from site items and design docs.
 * Uses cached data from PlanningContext instead of individual DB queries.
 */
export function useKDProgressChartData(): UseKDProgressChartResult {
  const { projectStartDate, dashboardCache, refreshDashboard } = usePlanningContext();

  const keyDates = useMemo(() => {
    if (!dashboardCache.dataReady) return [];

    const { keyDates: kds, sitesByKdId, itemsBySite, docsByKeyDate } = dashboardCache;

    const kdData: KDProgressDataPoint[] = [];

    for (const kd of kds) {
      const mode = kd.progressMode;

      // Short-circuit for manual/binary modes: use stored progress directly
      if (mode === 'manual' || mode === 'binary') {
        kdData.push({
          id: kd.id,
          code: kd.code,
          targetDate: kd.targetDate ?? null,
          progress: kd.progressPercentage,
          sequenceOrder: kd.sequenceOrder,
        });
        continue;
      }

      const kdSites = sitesByKdId[kd.id] || [];
      const kdDocs = docsByKeyDate[kd.id] || [];
      let kdProgress = kd.progressPercentage; // fallback

      const hasSites = kdSites.length > 0;
      const hasDocs = kdDocs.length > 0;

      if (hasSites || hasDocs) {
        let siteItemProgress = 0;
        if (hasSites) {
          for (const site of kdSites) {
            const siteItems = itemsBySite[site.siteId] || [];
            siteItemProgress += (site.contributionPercentage / 100) * calculateSiteProgressFromItems(siteItems);
          }
        }

        const designProgress = hasDocs ? calculateSiteProgressFromDesignDocuments(kdDocs) : 0;

        const { combined } = calculateKDProgress(
          siteItemProgress, designProgress, kd.designWeightage || 0, hasSites, hasDocs
        );
        kdProgress = combined;
      }

      kdData.push({
        id: kd.id,
        code: kd.code,
        targetDate: kd.targetDate ?? null,
        progress: kdProgress,
        sequenceOrder: kd.sequenceOrder,
      });
    }

    return kdData;
  }, [dashboardCache]);

  return {
    keyDates,
    projectStartDate,
    loading: !dashboardCache.dataReady,
    error: null,
    refresh: refreshDashboard,
  };
}
