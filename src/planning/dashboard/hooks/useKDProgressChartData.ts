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
import ItemModel from '../../../../models/ItemModel';
import KeyDateModel from '../../../../models/KeyDateModel';
import KeyDateSiteModel from '../../../../models/KeyDateSiteModel';
import { usePlanningContext } from '../../context';
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
      const project = await projectsCollection.find(projectId);
      const startDate = project.startDate || null;

      // Fetch key dates for this project
      const keyDatesCollection = database.collections.get<KeyDateModel>('key_dates');
      const kds = await keyDatesCollection
        .query(Q.where('project_id', projectId))
        .fetch();

      const sitesCollection = database.collections.get<KeyDateSiteModel>('key_date_sites');
      const itemsCollection = database.collections.get<ItemModel>('items');

      const kdData: KDProgressDataPoint[] = [];

      // Calculate actual progress for each KD from its items
      for (const kd of kds) {
        // Fetch sites for this KD
        const kdSites = await sitesCollection
          .query(Q.where('key_date_id', kd.id))
          .fetch();

        let kdProgress = kd.progressPercentage; // fallback

        if (kdSites.length > 0) {
          // For each site, compute progress from its items
          let siteWeightedSum = 0;
          for (const site of kdSites) {
            const siteItems = await itemsCollection
              .query(Q.where('site_id', site.siteId))
              .fetch();
            const siteProgress = calculateSiteProgressFromItems(siteItems);
            siteWeightedSum += (site.contributionPercentage / 100) * siteProgress;
          }
          kdProgress = siteWeightedSum;
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
