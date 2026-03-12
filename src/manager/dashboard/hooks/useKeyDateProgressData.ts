/**
 * useKeyDateProgressData Hook
 *
 * Fetches Key Date progress data with dual-track breakdown:
 * - Design track: progress from design_documents linked to each key date
 * - Activities track: progress from supervisor items via key_date_sites
 *
 * Reuses Planning utilities verbatim — no new calculation logic.
 *
 * @version 1.0.0
 * @since Manager Phase 3 (Key Date Widget)
 */

import { useState, useEffect, useCallback } from 'react';
import { Q } from '@nozbe/watermelondb';
import { database } from '../../../../models/database';
import { useManagerContext } from '../../context/ManagerContext';
import { logger } from '../../../services/LoggingService';
import { calculateSiteProgressFromDesignDocuments, calculateKDProgress } from '../../../planning/utils/designDocumentProgress';
import { calculateSiteProgressFromItems } from '../../../planning/utils/progressCalculations';
import type KeyDateModel from '../../../../models/KeyDateModel';
import type KeyDateSiteModel from '../../../../models/KeyDateSiteModel';
import type ItemModel from '../../../../models/ItemModel';
import type DesignDocumentModel from '../../../../models/DesignDocumentModel';

// ==================== Types ====================

export interface KDProgressItem {
  id: string;
  code: string;
  description: string;
  category: string;
  status: string;
  targetDate?: number;
  combinedProgress: number;   // 0-100
  designProgress: number;     // 0-100 (from design_documents)
  activitiesProgress: number; // 0-100 (from items via key_date_sites)
  designWeightage: number;    // 0-100
  hasDesignDocs: boolean;
  hasSiteActivities: boolean;
  progressMode: string;
}

export interface UseKeyDateProgressDataResult {
  data: KDProgressItem[] | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

// ==================== Hook ====================

export function useKeyDateProgressData(): UseKeyDateProgressDataResult {
  const { projectId } = useManagerContext();
  const [data, setData] = useState<KDProgressItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!projectId) {
      setData([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Query 1: key_dates for this project, sorted by sequence_order (matches Planner order)
      const keyDates = await database.collections
        .get<KeyDateModel>('key_dates')
        .query(
          Q.where('project_id', projectId),
          Q.sortBy('sequence_order', Q.asc),
        )
        .fetch();

      if (keyDates.length === 0) {
        setData([]);
        return;
      }

      const kdIds = keyDates.map(kd => kd.id);

      // Query 2: key_date_sites for these key dates
      const kdSites = await database.collections
        .get<KeyDateSiteModel>('key_date_sites')
        .query(Q.where('key_date_id', Q.oneOf(kdIds)))
        .fetch();

      // Derive unique site IDs from the junction records
      const siteIds = [...new Set(kdSites.map(kds => kds.siteId))];

      // Query 3: items for those sites (activities track)
      const allItems = siteIds.length > 0
        ? await database.collections
            .get<ItemModel>('items')
            .query(Q.where('site_id', Q.oneOf(siteIds)))
            .fetch()
        : [];

      // Query 4a: design_documents linked directly to these key dates (key_date_id)
      const directDocs = await database.collections
        .get<DesignDocumentModel>('design_documents')
        .query(Q.where('key_date_id', Q.oneOf(kdIds)))
        .fetch();

      // Query 4b: design_documents linked via site_id for sites associated with these KDs
      const siteDocs = siteIds.length > 0
        ? await database.collections
            .get<DesignDocumentModel>('design_documents')
            .query(Q.where('site_id', Q.oneOf(siteIds)))
            .fetch()
        : [];

      // Merge both doc sets, deduplicated by doc ID
      const directDocIds = new Set(directDocs.map(d => d.id));
      const allDocs = [...directDocs, ...siteDocs.filter(d => !directDocIds.has(d.id))];

      // Build a lookup: siteId → KD IDs (for resolving site-linked docs to their KD)
      const kdIdsBySiteId: Record<string, string[]> = {};
      for (const kds of kdSites) {
        if (!kdIdsBySiteId[kds.siteId]) kdIdsBySiteId[kds.siteId] = [];
        kdIdsBySiteId[kds.siteId].push(kds.keyDateId);
      }

      // Build per-KD doc sets: direct link OR via site linkage
      const docsByKdId: Record<string, DesignDocumentModel[]> = {};
      for (const kd of keyDates) {
        const linkedSiteIds = new Set(
          kdSites.filter(kds => kds.keyDateId === kd.id).map(kds => kds.siteId)
        );
        docsByKdId[kd.id] = allDocs.filter(
          d => d.keyDateId === kd.id || (d.siteId != null && linkedSiteIds.has(d.siteId as string))
        );
      }

      // Build per-KD progress items
      const result: KDProgressItem[] = keyDates.map(kd => {
        const progressMode = kd.progressMode ?? 'auto';
        const designWeightage = kd.designWeightage ?? 0;

        // For manual/binary modes, use the stored progressPercentage directly
        if (progressMode === 'manual' || progressMode === 'binary') {
          return {
            id: kd.id,
            code: kd.code,
            description: kd.description,
            category: kd.category,
            status: kd.status,
            targetDate: kd.targetDate,
            combinedProgress: Math.round(kd.progressPercentage),
            designProgress: 0,
            activitiesProgress: Math.round(kd.progressPercentage),
            designWeightage,
            hasDesignDocs: false,
            hasSiteActivities: false,
            progressMode,
          };
        }

        // Auto mode: calculate dual-track progress
        const docsForKD = docsByKdId[kd.id] ?? [];
        const kdSitesForKD = kdSites.filter(kds => kds.keyDateId === kd.id);

        const hasDesignDocs = docsForKD.length > 0;
        const hasSiteActivities = kdSitesForKD.length > 0;

        // Design progress from design documents
        const designProgress = hasDesignDocs
          ? calculateSiteProgressFromDesignDocuments(docsForKD)
          : 0;

        // Activities progress: weighted sum across linked sites
        let activitiesProgress = 0;
        if (hasSiteActivities) {
          let totalContribution = 0;
          let weightedSum = 0;

          for (const kdSite of kdSitesForKD) {
            const siteItems = allItems.filter(item => (item as any).siteId === kdSite.siteId);
            const siteProgress = calculateSiteProgressFromItems(siteItems);
            const contribution = kdSite.contributionPercentage ?? 0;
            weightedSum += (contribution / 100) * siteProgress;
            totalContribution += contribution;
          }

          // Normalise if contributions don't sum to 100
          activitiesProgress = totalContribution > 0 ? weightedSum : 0;
        }

        const { combined } = calculateKDProgress(
          activitiesProgress,
          designProgress,
          designWeightage,
          hasSiteActivities,
          hasDesignDocs,
        );

        return {
          id: kd.id,
          code: kd.code,
          description: kd.description,
          category: kd.category,
          status: kd.status,
          targetDate: kd.targetDate,
          combinedProgress: Math.round(combined * 10) / 10,
          designProgress: Math.round(designProgress),
          activitiesProgress: Math.round(activitiesProgress),
          designWeightage,
          hasDesignDocs,
          hasSiteActivities,
          progressMode,
        };
      });

      setData(result);
    } catch (err) {
      logger.error('[useKeyDateProgressData] Error fetching data', err as Error);
      setError('Failed to load Key Date progress data');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refresh: fetchData };
}

export default useKeyDateProgressData;
