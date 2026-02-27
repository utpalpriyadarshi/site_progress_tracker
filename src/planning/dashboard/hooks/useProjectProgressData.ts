/**
 * useProjectProgressData Hook
 *
 * Calculates overall project progress as weighted rollup of Key Date progress.
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

export interface KDBreakdownItem {
  id: string;
  code: string;
  description: string;
  weightage: number;
  progress: number;
  itemProgress: number;
  docProgress: number;
  status: string;
  sequenceOrder: number;
}

interface UseProjectProgressResult {
  projectProgress: number;
  kdBreakdown: KDBreakdownItem[];
  unlinkedDocCount: number;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

// ==================== Hook ====================

/**
 * Hook for fetching project progress
 *
 * Calculates overall project progress as a weighted rollup of Key Date progress.
 * For each KD, progress is calculated from site items using weighted site contributions.
 * Project progress = sum(kd.weightage * kdProgress) / sum(kd.weightage)
 *
 * Uses cached data from PlanningContext instead of individual DB queries.
 */
export function useProjectProgressData(): UseProjectProgressResult {
  const { dashboardCache, refreshDashboard } = usePlanningContext();

  const result = useMemo(() => {
    if (!dashboardCache.dataReady) {
      return { projectProgress: 0, kdBreakdown: [], unlinkedDocCount: 0 };
    }

    const { keyDates, sitesByKdId, itemsBySite, docsByKeyDate, docsBySite, allProjectDesignDocs } = dashboardCache;

    if (keyDates.length === 0) {
      return { projectProgress: 0, kdBreakdown: [], unlinkedDocCount: 0 };
    }

    // Calculate dual-track progress for each KD
    const breakdown: KDBreakdownItem[] = [];
    let totalWeightedProgress = 0;
    let totalWeightage = 0;

    for (const kd of keyDates) {
      const mode = kd.progressMode;
      const weightage = kd.weightage || 0;

      // Short-circuit for manual/binary modes: use stored progress directly
      if (mode === 'manual' || mode === 'binary') {
        const kdProgress = kd.progressPercentage;
        breakdown.push({
          id: kd.id,
          code: kd.code,
          description: kd.description,
          weightage,
          progress: Math.round(kdProgress * 100) / 100,
          itemProgress: 0,
          docProgress: 0,
          status: kd.status,
          sequenceOrder: kd.sequenceOrder,
        });
        totalWeightedProgress += weightage * kdProgress;
        totalWeightage += weightage;
        continue;
      }

      const kdSites = sitesByKdId[kd.id] || [];

      // Collect design docs via two paths and deduplicate:
      // 1. Docs with key_date_id set directly on the document
      // 2. Docs linked via site_id for any site associated with this KD
      const directDocs = docsByKeyDate[kd.id] || [];
      const seenIds = new Set(directDocs.map(d => d.id));
      const siteDocs = kdSites.flatMap(site => (docsBySite[site.siteId] || []).filter(d => !seenIds.has(d.id)));
      const kdDocs = [...directDocs, ...siteDocs];

      let kdProgress = kd.progressPercentage; // fallback
      let kdItemProgress = 0;
      let kdDocProgress = 0;

      const hasSites = kdSites.length > 0;
      const hasDocs = kdDocs.length > 0;

      if (hasSites) {
        let siteWeightedItemProgress = 0;
        for (const site of kdSites) {
          const siteItems = itemsBySite[site.siteId] || [];
          const contribution = site.contributionPercentage / 100;
          siteWeightedItemProgress += contribution * calculateSiteProgressFromItems(siteItems);
        }
        kdItemProgress = siteWeightedItemProgress;
      }

      if (hasDocs) {
        kdDocProgress = calculateSiteProgressFromDesignDocuments(kdDocs);
      }

      if (hasSites || hasDocs) {
        const { combined } = calculateKDProgress(
          kdItemProgress, kdDocProgress, kd.designWeightage || 0, hasSites, hasDocs
        );
        kdProgress = combined;
      }

      breakdown.push({
        id: kd.id,
        code: kd.code,
        description: kd.description,
        weightage,
        progress: Math.round(kdProgress * 100) / 100,
        itemProgress: Math.round(kdItemProgress * 100) / 100,
        docProgress: Math.round(kdDocProgress * 100) / 100,
        status: kd.status,
        sequenceOrder: kd.sequenceOrder,
      });

      totalWeightedProgress += weightage * kdProgress;
      totalWeightage += weightage;
    }

    // Roll up: projectProgress = sum(kd.weightage * kdProgress) / sum(kd.weightage)
    const progress = totalWeightage > 0
      ? Math.round((totalWeightedProgress / totalWeightage) * 100) / 100
      : 0;

    // Count docs that are truly unlinked: no direct key_date_id AND no indirect
    // site linkage (site_id present in key_date_sites). Docs linked only via
    // site_id have keyDateId = null but are still tracked by the dual-track system.
    const linkedSiteIds = new Set(
      Object.values(sitesByKdId).flatMap((sites: any[]) => sites.map((s: any) => s.siteId))
    );
    const unlinked = allProjectDesignDocs.filter(
      (d: any) => !d.keyDateId && (!d.siteId || !linkedSiteIds.has(d.siteId))
    ).length;

    return {
      projectProgress: progress,
      kdBreakdown: breakdown.sort((a, b) => a.sequenceOrder - b.sequenceOrder),
      unlinkedDocCount: unlinked,
    };
  }, [dashboardCache]);

  return {
    ...result,
    loading: !dashboardCache.dataReady,
    error: null,
    refresh: refreshDashboard,
  };
}
