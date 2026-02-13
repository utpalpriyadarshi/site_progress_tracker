/**
 * useSiteProgressData Hook
 *
 * Calculates per-site progress data for the dashboard widget.
 * Uses shared dashboard cache from PlanningContext (no individual DB queries).
 *
 * @version 2.0.0
 * @since Planning Dashboard Phase 6
 */

import { useMemo } from 'react';
import { usePlanningContext } from '../../context';
import { calculateSiteProgressFromDesignDocuments, calculateKDProgress } from '../../utils/designDocumentProgress';
import { calculateSiteProgressFromItems } from '../../utils/progressCalculations';

// ==================== Types ====================

export interface SiteProgressItem {
  id: string;
  name: string;
  location: string;
  progress: number;
  itemProgress: number;
  docProgress: number;
  hasSupervisor: boolean;
  hasDE: boolean;
  kdCount: number;
}

interface UseSiteProgressResult {
  sites: SiteProgressItem[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

// ==================== Hook ====================

export function useSiteProgressData(): UseSiteProgressResult {
  const { sites, dashboardCache, refreshDashboard } = usePlanningContext();

  const siteProgressItems = useMemo(() => {
    if (!dashboardCache.dataReady || sites.length === 0) return [];

    const { keyDates, kdSitesBySiteId, itemsBySite, docsByKeyDate } = dashboardCache;
    const kdMap = new Map(keyDates.map(kd => [kd.id, kd]));

    const result: SiteProgressItem[] = sites.map(site => {
      const hasSupervisor = !!site.supervisorId;
      const hasDE = !!site.designEngineerId;
      const siteItems = itemsBySite[site.id] || [];
      const siteKdSites = kdSitesBySiteId[site.id] || [];

      // Item progress for this site
      const itemProgress = calculateSiteProgressFromItems(siteItems);

      // Design doc progress: average across all KDs this site is linked to
      let docProgressSum = 0;
      let docKdCount = 0;
      for (const kds of siteKdSites) {
        const kdDocs = docsByKeyDate[kds.keyDateId] || [];
        if (kdDocs.length > 0) {
          docProgressSum += calculateSiteProgressFromDesignDocuments(kdDocs);
          docKdCount++;
        }
      }
      const docProgress = docKdCount > 0 ? docProgressSum / docKdCount : 0;

      // Combined progress using average design weightage across linked KDs
      const hasDocs = docKdCount > 0;
      let combinedProgress = 0;

      if (siteKdSites.length > 0) {
        let totalContribution = 0;
        let weightedProgressSum = 0;

        for (const kds of siteKdSites) {
          const kd = kdMap.get(kds.keyDateId);
          const designWeightage = kd?.designWeightage || 0;
          const kdDocs = docsByKeyDate[kds.keyDateId] || [];
          const kdDocProgress = kdDocs.length > 0 ? calculateSiteProgressFromDesignDocuments(kdDocs) : 0;
          const kdHasDocs = kdDocs.length > 0;

          const effectiveHasSites = hasSupervisor || !hasDE;
          const effectiveHasDocs = kdHasDocs && hasDE;

          const { combined } = calculateKDProgress(
            itemProgress, kdDocProgress, designWeightage, effectiveHasSites, effectiveHasDocs
          );

          const contribution = kds.contributionPercentage;
          weightedProgressSum += contribution * combined;
          totalContribution += contribution;
        }

        combinedProgress = totalContribution > 0
          ? weightedProgressSum / totalContribution
          : itemProgress;
      } else {
        combinedProgress = itemProgress;
      }

      return {
        id: site.id,
        name: site.name || 'Unnamed Site',
        location: site.location || '',
        progress: Math.round(combinedProgress * 100) / 100,
        itemProgress: Math.round(itemProgress * 100) / 100,
        docProgress: Math.round(docProgress * 100) / 100,
        hasSupervisor,
        hasDE,
        kdCount: siteKdSites.length,
      };
    });

    result.sort((a, b) => a.name.localeCompare(b.name));
    return result;
  }, [sites, dashboardCache]);

  return {
    sites: siteProgressItems,
    loading: !dashboardCache.dataReady,
    error: null,
    refresh: refreshDashboard,
  };
}
