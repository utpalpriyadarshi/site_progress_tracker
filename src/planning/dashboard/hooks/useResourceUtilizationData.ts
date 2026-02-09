/**
 * useResourceUtilizationData Hook
 *
 * Fetches and manages resource utilization data for the dashboard widget.
 * Aggregates items by phase and calculates utilization metrics.
 *
 * @version 1.0.0
 * @since Planning Dashboard Phase 4
 */

import { useState, useEffect, useCallback } from 'react';
import { Q } from '@nozbe/watermelondb';
import { database } from '../../../../models/database';
import ItemModel from '../../../../models/ItemModel';
import { usePlanningContext } from '../../context';
import { PHASE_RESOURCE_LABELS } from '../../utils/phaseConstants';
import type { Resource, ResourceSummary } from '../widgets/ResourceUtilizationWidget';

// ==================== Types ====================

interface UseResourceUtilizationResult {
  resources: Resource[];
  summary: ResourceSummary | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

// ==================== Hook ====================

/**
 * Hook for fetching resource utilization data
 *
 * Groups items by project phase and calculates utilization metrics
 * based on item status and progress. Treats phases as "resources".
 *
 * @returns {UseResourceUtilizationResult} Resource utilization data, summary, loading state, error, and refresh function
 */
export function useResourceUtilizationData(): UseResourceUtilizationResult {
  const { projectId, sites } = usePlanningContext();
  const [resources, setResources] = useState<Resource[]>([]);
  const [summary, setSummary] = useState<ResourceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!projectId) {
      setResources([]);
      setSummary(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const siteIds = sites.map((s) => s.id);

      if (siteIds.length === 0) {
        setResources([]);
        setSummary(null);
        setLoading(false);
        return;
      }

      // Query items for the project - aggregate by phase as "resources"
      const itemsCollection = database.collections.get<ItemModel>('items');
      const projectItems = await itemsCollection
        .query(Q.where('site_id', Q.oneOf(siteIds)))
        .fetch();

      // Group items by project phase and calculate utilization metrics
      const phaseGroups = new Map<string, ItemModel[]>();
      projectItems.forEach((item) => {
        const phase = item.projectPhase || 'other';
        if (!phaseGroups.has(phase)) {
          phaseGroups.set(phase, []);
        }
        phaseGroups.get(phase)!.push(item);
      });

      // Transform phases into resource utilization format
      const transformedResources: Resource[] = [];
      let overAllocated = 0;
      let optimallyAllocated = 0;
      let underAllocated = 0;

      phaseGroups.forEach((items, phase) => {
        const totalItems = items.length;
        const inProgress = items.filter((i) => i.status === 'in_progress').length;
        const completed = items.filter((i) => i.status === 'completed').length;

        // Calculate utilization as percentage of work being actively done
        const utilization = totalItems > 0 ? Math.round((inProgress / totalItems) * 100) : 0;
        const allocated = totalItems > 0 ? Math.round(((inProgress + completed) / totalItems) * 100) : 0;

        // Categorize allocation status
        if (allocated > 90) {
          overAllocated++;
        } else if (allocated > 50) {
          optimallyAllocated++;
        } else {
          underAllocated++;
        }

        transformedResources.push({
          id: phase,
          name: PHASE_RESOURCE_LABELS[phase] || phase,
          type: 'labor',
          allocated,
          available: 100,
          utilized: utilization,
        });
      });

      setResources(transformedResources);
      setSummary({
        totalResources: phaseGroups.size,
        overAllocated,
        optimallyAllocated,
        underAllocated,
      });
    } catch (err) {
      console.error('Error loading resource utilization:', err);
      setError('Failed to load resource data');
    } finally {
      setLoading(false);
    }
  }, [projectId, sites]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { resources, summary, loading, error, refresh: fetchData };
}
