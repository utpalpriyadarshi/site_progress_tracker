/**
 * useKDProgressChartData Hook
 *
 * Fetches and manages Key Date progress chart data for the dashboard widget.
 * Calculates progress for each KD from site items for chart visualization.
 *
 * @version 1.0.0
 * @since Planning Dashboard Phase 4
 */

import { useState, useEffect, useCallback } from 'react';
import { Q } from '@nozbe/watermelondb';
import { database } from '../../../../models/database';
import KeyDateModel from '../../../../models/KeyDateModel';
import KeyDateSiteModel from '../../../../models/KeyDateSiteModel';
import { usePlanningContext } from '../../context';
import { calculateSiteProgressFromDesignDocuments, calculateKDProgress } from '../../utils/designDocumentProgress';
import { calculateSiteProgressFromItems } from '../../utils/progressCalculations';
import { batchLoadItemsBySites, batchLoadDocsByKeyDate } from '../../utils/dataLoading';

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
 * Fetches all Key Dates for the project and calculates actual progress
 * from site items. Each KD's progress is calculated as weighted sum of
 * site contributions.
 *
 * @returns {UseKDProgressChartResult} KD progress data points, project start date, loading state, error, and refresh function
 */
export function useKDProgressChartData(): UseKDProgressChartResult {
  const { projectId } = usePlanningContext();
  const [keyDates, setKeyDates] = useState<KDProgressDataPoint[]>([]);
  const [projectStartDate, setProjectStartDate] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!projectId) {
      setKeyDates([]);
      setProjectStartDate(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch project to get start date
      const projectsCollection = database.collections.get('projects');
      let project;
      try {
        project = await projectsCollection.find(projectId);
      } catch (err) {
        // Project not found (likely after logout) - reset state and return
        setKeyDates([]);
        setProjectStartDate(null);
        setLoading(false);
        return;
      }
      const startDate = project.startDate || null;

      // Fetch key dates for this project
      const keyDatesCollection = database.collections.get<KeyDateModel>('key_dates');
      const kds = await keyDatesCollection
        .query(Q.where('project_id', projectId))
        .fetch();

      const sitesCollection = database.collections.get<KeyDateSiteModel>('key_date_sites');

      // Fetch all KD sites upfront (single query for all KDs)
      const allKdSites = await sitesCollection
        .query(Q.where('key_date_id', Q.oneOf(kds.map(kd => kd.id))))
        .fetch();

      // Group sites by KD ID for quick lookup
      const sitesByKdId: Record<string, KeyDateSiteModel[]> = {};
      const allUniqueSiteIds = new Set<string>();

      for (const kdSite of allKdSites) {
        if (!sitesByKdId[kdSite.keyDateId]) {
          sitesByKdId[kdSite.keyDateId] = [];
        }
        sitesByKdId[kdSite.keyDateId].push(kdSite);
        allUniqueSiteIds.add(kdSite.siteId);
      }

      // Batch load items for all sites + design docs by KD
      const siteIds = [...allUniqueSiteIds];
      const kdIds = kds.map(kd => kd.id);
      const [itemsBySite, docsByKd] = await Promise.all([
        batchLoadItemsBySites(siteIds),
        batchLoadDocsByKeyDate(kdIds),
      ]);

      // Calculate dual-track progress for each KD
      const kdData: KDProgressDataPoint[] = [];

      for (const kd of kds) {
        const mode = kd.progressMode;

        // Short-circuit for manual/binary modes: use stored progress directly
        if (mode === 'manual' || mode === 'binary') {
          kdData.push({
            id: kd.id,
            code: kd.code,
            targetDate: kd.targetDate,
            progress: kd.progressPercentage,
            sequenceOrder: kd.sequenceOrder,
          });
          continue;
        }

        const kdSites = sitesByKdId[kd.id] || [];
        const kdDocs = docsByKd[kd.id] || [];
        let kdProgress = kd.progressPercentage; // fallback

        const hasSites = kdSites.length > 0;
        const hasDocs = kdDocs.length > 0;

        if (hasSites || hasDocs) {
          // Site progress = weighted sum of item progress per site
          let siteItemProgress = 0;
          if (hasSites) {
            for (const site of kdSites) {
              const siteItems = itemsBySite[site.siteId] || [];
              siteItemProgress += (site.contributionPercentage / 100) * calculateSiteProgressFromItems(siteItems);
            }
          }

          // Design progress = from all docs linked to this KD
          const designProgress = hasDocs ? calculateSiteProgressFromDesignDocuments(kdDocs) : 0;

          const { combined } = calculateKDProgress(
            siteItemProgress, designProgress, kd.designWeightage || 0, hasSites, hasDocs
          );
          kdProgress = combined;
        }

        kdData.push({
          id: kd.id,
          code: kd.code,
          targetDate: kd.targetDate,
          progress: kdProgress,
          sequenceOrder: kd.sequenceOrder,
        });
      }

      setKeyDates(kdData);
      setProjectStartDate(startDate);
    } catch (err) {
      console.error('Error loading KD progress chart data:', err);
      setError('Failed to load progress chart');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { keyDates, projectStartDate, loading, error, refresh: fetchData };
}
