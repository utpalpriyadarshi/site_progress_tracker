/**
 * useProjectProgressData Hook
 *
 * Fetches and manages overall project progress data for the dashboard widget.
 * Calculates project progress as weighted rollup of Key Date progress.
 *
 * @version 1.0.0
 * @since Planning Dashboard Phase 4
 */

import { useState, useEffect, useCallback } from 'react';
import { Q } from '@nozbe/watermelondb';
import { database } from '../../../../models/database';
import ItemModel from '../../../../models/ItemModel';
import KeyDateModel from '../../../../models/KeyDateModel';
import KeyDateSiteModel from '../../../../models/KeyDateSiteModel';
import { usePlanningContext } from '../../context';
import { calculateSiteProgressFromItems } from '../../utils/progressCalculations';
import { batchLoadItemsBySites } from '../../utils/dataLoading';

// ==================== Types ====================

export interface KDBreakdownItem {
  id: string;
  code: string;
  description: string;
  weightage: number;
  progress: number;
  status: string;
  sequenceOrder: number;
}

interface UseProjectProgressResult {
  projectProgress: number;
  kdBreakdown: KDBreakdownItem[];
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
 * Project progress = Σ(kd.weightage × kdProgress) / Σ(kd.weightage)
 *
 * @returns {UseProjectProgressResult} Project progress percentage, KD breakdown, loading state, error, and refresh function
 */
export function useProjectProgressData(): UseProjectProgressResult {
  const { projectId } = usePlanningContext();
  const [projectProgress, setProjectProgress] = useState(0);
  const [kdBreakdown, setKdBreakdown] = useState<KDBreakdownItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!projectId) {
      setProjectProgress(0);
      setKdBreakdown([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // 1. Fetch all key dates for this project
      const keyDatesCollection = database.collections.get<KeyDateModel>('key_dates');
      const keyDates = await keyDatesCollection
        .query(Q.where('project_id', projectId))
        .fetch();

      if (keyDates.length === 0) {
        setProjectProgress(0);
        setKdBreakdown([]);
        setLoading(false);
        return;
      }

      const sitesCollection = database.collections.get<KeyDateSiteModel>('key_date_sites');

      // 2. Fetch all KD sites upfront (single query for all KDs)
      const allKdSites = await sitesCollection
        .query(Q.where('key_date_id', Q.oneOf(keyDates.map(kd => kd.id))))
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

      // 3. Batch load ALL items for ALL sites in ONE query (Performance optimization!)
      const itemsBySite = await batchLoadItemsBySites([...allUniqueSiteIds]);

      // 4. Calculate progress for each KD using pre-loaded data
      const breakdown: KDBreakdownItem[] = [];
      let totalWeightedProgress = 0;
      let totalWeightage = 0;

      for (const kd of keyDates) {
        const kdSites = sitesByKdId[kd.id] || [];
        let kdProgress = kd.progressPercentage; // fallback

        if (kdSites.length > 0) {
          // Calculate progress using pre-loaded items (no additional queries!)
          let siteWeightedSum = 0;
          for (const site of kdSites) {
            const siteItems = itemsBySite[site.siteId] || [];
            const siteProgress = calculateSiteProgressFromItems(siteItems);
            siteWeightedSum += (site.contributionPercentage / 100) * siteProgress;
          }
          kdProgress = siteWeightedSum;
        }

        const weightage = kd.weightage || 0;
        breakdown.push({
          id: kd.id,
          code: kd.code,
          description: kd.description,
          weightage,
          progress: Math.round(kdProgress * 100) / 100,
          status: kd.status,
          sequenceOrder: kd.sequenceOrder,
        });

        totalWeightedProgress += weightage * kdProgress;
        totalWeightage += weightage;
      }

      // 4. Roll up: projectProgress = Σ(kd.weightage × kdProgress) / Σ(kd.weightage)
      const progress = totalWeightage > 0
        ? Math.round((totalWeightedProgress / totalWeightage) * 100) / 100
        : 0;

      setProjectProgress(progress);
      setKdBreakdown(breakdown.sort((a, b) => a.sequenceOrder - b.sequenceOrder));
    } catch (err) {
      console.error('Error loading project progress:', err);
      setError('Failed to load project progress');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { projectProgress, kdBreakdown, loading, error, refresh: fetchData };
}
