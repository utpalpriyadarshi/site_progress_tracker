/**
 * useSiteProgressData Hook
 *
 * Fetches and manages per-site progress data for the dashboard widget.
 * Calculates progress for each site from items and design documents,
 * respecting role assignments (supervisor/DE).
 *
 * @version 1.0.0
 * @since Planning Dashboard Phase 6
 */

import { useState, useEffect, useCallback } from 'react';
import { Q } from '@nozbe/watermelondb';
import { database } from '../../../../models/database';
import SiteModel from '../../../../models/SiteModel';
import KeyDateSiteModel from '../../../../models/KeyDateSiteModel';
import KeyDateModel from '../../../../models/KeyDateModel';
import { usePlanningContext } from '../../context';
import { calculateSiteProgressFromDesignDocuments, calculateKDProgress } from '../../utils/designDocumentProgress';
import { calculateSiteProgressFromItems } from '../../utils/progressCalculations';
import { batchLoadItemsBySites, batchLoadDocsByKeyDate } from '../../utils/dataLoading';

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
  const { projectId } = usePlanningContext();
  const [sites, setSites] = useState<SiteProgressItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!projectId) {
      setSites([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // 1. Fetch all sites for the project
      const allSites = await database.collections
        .get<SiteModel>('sites')
        .query(Q.where('project_id', projectId))
        .fetch();

      if (allSites.length === 0) {
        setSites([]);
        setLoading(false);
        return;
      }

      const siteIds = allSites.map(s => s.id);

      // 2. Fetch all KD-site associations and key dates
      const allKdSites = await database.collections
        .get<KeyDateSiteModel>('key_date_sites')
        .query(Q.where('site_id', Q.oneOf(siteIds)))
        .fetch();

      // Group KD-sites by siteId
      const kdSitesBySiteId: Record<string, KeyDateSiteModel[]> = {};
      const allKdIds = new Set<string>();
      for (const kds of allKdSites) {
        if (!kdSitesBySiteId[kds.siteId]) {
          kdSitesBySiteId[kds.siteId] = [];
        }
        kdSitesBySiteId[kds.siteId].push(kds);
        allKdIds.add(kds.keyDateId);
      }

      // 3. Batch load items and design docs
      const kdIds = [...allKdIds];
      const [itemsBySite, docsByKd] = await Promise.all([
        batchLoadItemsBySites(siteIds),
        kdIds.length > 0 ? batchLoadDocsByKeyDate(kdIds) : Promise.resolve({} as Record<string, any[]>),
      ]);

      // 4. Fetch key dates for designWeightage
      const keyDates = kdIds.length > 0
        ? await database.collections
            .get<KeyDateModel>('key_dates')
            .query(Q.where('id', Q.oneOf(kdIds)))
            .fetch()
        : [];
      const kdMap = new Map(keyDates.map(kd => [kd.id, kd]));

      // 5. Calculate progress per site
      const siteProgressItems: SiteProgressItem[] = allSites.map(site => {
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
          const kdDocs = docsByKd[kds.keyDateId] || [];
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
          // Weighted average across KDs this site belongs to
          let totalContribution = 0;
          let weightedProgressSum = 0;

          for (const kds of siteKdSites) {
            const kd = kdMap.get(kds.keyDateId);
            const designWeightage = kd?.designWeightage || 0;
            const kdDocs = docsByKd[kds.keyDateId] || [];
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

      // Sort by name
      siteProgressItems.sort((a, b) => a.name.localeCompare(b.name));
      setSites(siteProgressItems);
    } catch (err) {
      console.error('Error loading site progress data:', err);
      setError('Failed to load site progress');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchData();
    const subscription = database
      .withChangesForTables(['items', 'design_documents', 'key_date_sites', 'sites'])
      .subscribe(() => {
        fetchData();
      });
    return () => subscription.unsubscribe();
  }, [fetchData]);

  return { sites, loading, error, refresh: fetchData };
}
