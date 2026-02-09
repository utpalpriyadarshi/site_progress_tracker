/**
 * Widget Data Hooks
 *
 * Custom hooks for fetching and managing dashboard widget data.
 * Uses real WatermelonDB queries filtered by assigned project.
 *
 * @version 2.0.0
 * @since Planning Phase 4
 */

import { useState, useEffect, useCallback } from 'react';
import { Q } from '@nozbe/watermelondb';
import { database } from '../../../../models/database';
import ItemModel from '../../../../models/ItemModel';
import ProgressLogModel from '../../../../models/ProgressLogModel';
import CategoryModel from '../../../../models/CategoryModel';
import KeyDateModel from '../../../../models/KeyDateModel';
import KeyDateSiteModel from '../../../../models/KeyDateSiteModel';
import { usePlanningContext } from '../../context';
import type { Milestone } from '../widgets/UpcomingMilestonesWidget';
import type { CriticalPathItem } from '../widgets/CriticalPathWidget';
import type { ScheduleOverview } from '../widgets/ScheduleOverviewWidget';
import type { Activity } from '../widgets/RecentActivitiesWidget';
import type { Resource, ResourceSummary } from '../widgets/ResourceUtilizationWidget';
import type { WBSPhase, WBSSummary } from '../widgets/WBSProgressWidget';

// ==================== Upcoming Milestones Hook ====================

interface UseMilestonesResult {
  milestones: Milestone[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useUpcomingMilestonesData(): UseMilestonesResult {
  const { projectId, sites } = usePlanningContext();
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!projectId) {
      setMilestones([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const siteIds = sites.map((s) => s.id);

      if (siteIds.length === 0) {
        setMilestones([]);
        setLoading(false);
        return;
      }

      // Query items marked as milestones for project's sites
      const itemsCollection = database.collections.get<ItemModel>('items');
      const milestoneItems = await itemsCollection
        .query(
          Q.where('site_id', Q.oneOf(siteIds)),
          Q.where('is_milestone', true),
          Q.sortBy('planned_end_date', Q.asc)
        )
        .fetch();

      // Transform to Milestone type - only upcoming (not completed)
      const now = Date.now();
      const transformedMilestones: Milestone[] = milestoneItems
        .filter((item) => item.status !== 'completed')
        .slice(0, 5) // Limit to 5
        .map((item) => {
          const daysRemaining = Math.ceil((item.plannedEndDate - now) / 86400000);
          return {
            id: item.id,
            name: item.name,
            dueDate: new Date(item.plannedEndDate),
            status: item.status as 'planned' | 'in_progress' | 'completed' | 'delayed',
            daysRemaining: Math.max(0, daysRemaining),
          };
        });

      setMilestones(transformedMilestones);
    } catch (err) {
      console.error('Error loading milestones:', err);
      setError('Failed to load milestones');
    } finally {
      setLoading(false);
    }
  }, [projectId, sites]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { milestones, loading, error, refresh: fetchData };
}

// ==================== Critical Path Hook ====================

interface UseCriticalPathResult {
  items: CriticalPathItem[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useCriticalPathData(): UseCriticalPathResult {
  const { projectId, sites } = usePlanningContext();
  const [items, setItems] = useState<CriticalPathItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!projectId) {
      setItems([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const siteIds = sites.map((s) => s.id);

      if (siteIds.length === 0) {
        setItems([]);
        setLoading(false);
        return;
      }

      // Query critical path items
      const itemsCollection = database.collections.get<ItemModel>('items');
      const criticalItems = await itemsCollection
        .query(
          Q.where('site_id', Q.oneOf(siteIds)),
          Q.where('is_critical_path', true),
          Q.where('status', Q.notEq('completed')),
          Q.sortBy('planned_end_date', Q.asc)
        )
        .fetch();

      // Transform to CriticalPathItem type
      const now = Date.now();
      const transformedItems: CriticalPathItem[] = criticalItems.map((item) => {
        const daysUntilDue = Math.ceil((item.plannedEndDate - now) / 86400000);
        const isDelayed = item.status === 'delayed' || daysUntilDue < 0;

        // Determine risk level based on delay and float
        let riskLevel: 'low' | 'medium' | 'high' = 'low';
        if (isDelayed || daysUntilDue < 0) {
          riskLevel = 'high';
        } else if (daysUntilDue < 7 || (item.floatDays !== undefined && item.floatDays < 3)) {
          riskLevel = 'medium';
        }

        return {
          id: item.id,
          name: item.name,
          riskLevel,
          delayImpact: isDelayed ? Math.abs(daysUntilDue) : 0,
          progress: item.getProgressPercentage(),
          dueDate: new Date(item.plannedEndDate),
        };
      });

      setItems(transformedItems);
    } catch (err) {
      console.error('Error loading critical path:', err);
      setError('Failed to load critical path data');
    } finally {
      setLoading(false);
    }
  }, [projectId, sites]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { items, loading, error, refresh: fetchData };
}

// ==================== Schedule Overview Hook ====================

interface UseScheduleOverviewResult {
  overview: ScheduleOverview | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useScheduleOverviewData(): UseScheduleOverviewResult {
  const { projectId, sites } = usePlanningContext();
  const [overview, setOverview] = useState<ScheduleOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!projectId) {
      setOverview(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const siteIds = sites.map((s) => s.id);

      if (siteIds.length === 0) {
        setOverview(null);
        setLoading(false);
        return;
      }

      // Query all items for the project's sites
      const itemsCollection = database.collections.get<ItemModel>('items');
      const allItems = await itemsCollection
        .query(Q.where('site_id', Q.oneOf(siteIds)))
        .fetch();

      if (allItems.length === 0) {
        setOverview(null);
        setLoading(false);
        return;
      }

      // Calculate metrics
      const totalItems = allItems.length;
      const completedItems = allItems.filter((i) => i.status === 'completed').length;
      const delayedItems = allItems.filter((i) => i.status === 'delayed').length;
      const onTrackItems = allItems.filter(
        (i) => i.status === 'in_progress' || i.status === 'not_started'
      ).length;

      // Calculate overall progress (weighted by item progress)
      const totalProgress = allItems.reduce((sum, item) => sum + item.getProgressPercentage(), 0);
      const overallProgress = Math.round(totalProgress / totalItems);

      // Get project date range from items
      const startDates = allItems.map((i) => i.plannedStartDate).filter(Boolean);
      const endDates = allItems.map((i) => i.plannedEndDate).filter(Boolean);

      const projectStartDate = startDates.length > 0
        ? new Date(Math.min(...startDates))
        : new Date();
      const projectEndDate = endDates.length > 0
        ? new Date(Math.max(...endDates))
        : new Date(Date.now() + 180 * 86400000);

      const daysRemaining = Math.max(0, Math.ceil((projectEndDate.getTime() - Date.now()) / 86400000));

      setOverview({
        totalItems,
        completedItems,
        onTrackItems,
        delayedItems,
        overallProgress,
        projectStartDate,
        projectEndDate,
        daysRemaining,
      });
    } catch (err) {
      console.error('Error loading schedule overview:', err);
      setError('Failed to load schedule overview');
    } finally {
      setLoading(false);
    }
  }, [projectId, sites]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { overview, loading, error, refresh: fetchData };
}

// ==================== Recent Activities Hook ====================

interface UseRecentActivitiesResult {
  activities: Activity[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useRecentActivitiesData(): UseRecentActivitiesResult {
  const { projectId, sites } = usePlanningContext();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!projectId) {
      setActivities([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const siteIds = sites.map((s) => s.id);

      if (siteIds.length === 0) {
        setActivities([]);
        setLoading(false);
        return;
      }

      // Get items for the project's sites
      const itemsCollection = database.collections.get<ItemModel>('items');
      const projectItems = await itemsCollection
        .query(Q.where('site_id', Q.oneOf(siteIds)))
        .fetch();

      const itemIds = projectItems.map((i) => i.id);

      if (itemIds.length === 0) {
        setActivities([]);
        setLoading(false);
        return;
      }

      // Query recent progress logs
      const logsCollection = database.collections.get<ProgressLogModel>('progress_logs');
      const recentLogs = await logsCollection
        .query(
          Q.where('item_id', Q.oneOf(itemIds)),
          Q.sortBy('date', Q.desc),
          Q.take(10)
        )
        .fetch();

      // Create a map of item IDs to names
      const itemNameMap = new Map(projectItems.map((i) => [i.id, i.name]));

      // Transform to Activity type
      const transformedActivities: Activity[] = recentLogs.slice(0, 5).map((log) => ({
        id: log.id,
        type: 'updated' as const,
        itemName: itemNameMap.get(log.itemId) || 'Unknown Item',
        itemType: 'schedule' as const,
        timestamp: new Date(log.date),
      }));

      setActivities(transformedActivities);
    } catch (err) {
      console.error('Error loading recent activities:', err);
      setError('Failed to load recent activities');
    } finally {
      setLoading(false);
    }
  }, [projectId, sites]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { activities, loading, error, refresh: fetchData };
}

// ==================== Resource Utilization Hook ====================

interface UseResourceUtilizationResult {
  resources: Resource[];
  summary: ResourceSummary | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

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
      const phaseLabels: Record<string, string> = {
        design: 'Design Team',
        approvals: 'Approvals',
        mobilization: 'Mobilization',
        procurement: 'Procurement',
        interface: 'Interface',
        site_prep: 'Site Prep Crew',
        construction: 'Construction Crew',
        testing: 'Testing Team',
        commissioning: 'Commissioning',
        sat: 'SAT Team',
        handover: 'Handover',
        other: 'Other',
      };

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
          name: phaseLabels[phase] || phase,
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

// ==================== WBS Progress Hook ====================

interface UseWBSProgressResult {
  phases: WBSPhase[];
  summary: WBSSummary | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useWBSProgressData(): UseWBSProgressResult {
  const { projectId, sites } = usePlanningContext();
  const [phases, setPhases] = useState<WBSPhase[]>([]);
  const [summary, setSummary] = useState<WBSSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!projectId) {
      setPhases([]);
      setSummary(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const siteIds = sites.map((s) => s.id);

      if (siteIds.length === 0) {
        setPhases([]);
        setSummary(null);
        setLoading(false);
        return;
      }

      // Query all items for the project's sites
      const itemsCollection = database.collections.get<ItemModel>('items');
      const allItems = await itemsCollection
        .query(Q.where('site_id', Q.oneOf(siteIds)))
        .fetch();

      // Group items by project phase
      const phaseGroups = new Map<string, ItemModel[]>();
      allItems.forEach((item) => {
        const phase = item.projectPhase || 'other';
        if (!phaseGroups.has(phase)) {
          phaseGroups.set(phase, []);
        }
        phaseGroups.get(phase)!.push(item);
      });

      // Phase display order and labels
      const phaseOrder = [
        'design', 'approvals', 'mobilization', 'procurement', 'interface',
        'site_prep', 'construction', 'testing', 'commissioning', 'sat', 'handover'
      ];

      const phaseLabels: Record<string, string> = {
        design: 'Design & Engineering',
        approvals: 'Statutory Approvals',
        mobilization: 'Mobilization',
        procurement: 'Procurement',
        interface: 'Interface Coordination',
        site_prep: 'Site Preparation',
        construction: 'Construction',
        testing: 'Testing',
        commissioning: 'Commissioning',
        sat: 'Site Acceptance Test',
        handover: 'Handover',
        other: 'Other',
      };

      // Transform to WBSPhase type
      const transformedPhases: WBSPhase[] = phaseOrder
        .filter((phase) => phaseGroups.has(phase))
        .map((phase) => {
          const items = phaseGroups.get(phase)!;
          return {
            id: phase,
            name: phaseLabels[phase] || phase,
            totalItems: items.length,
            completedItems: items.filter((i) => i.status === 'completed').length,
            inProgressItems: items.filter((i) => i.status === 'in_progress').length,
            notStartedItems: items.filter((i) => i.status === 'not_started').length,
          };
        });

      // Add 'other' phase if it exists
      if (phaseGroups.has('other')) {
        const items = phaseGroups.get('other')!;
        transformedPhases.push({
          id: 'other',
          name: phaseLabels['other'],
          totalItems: items.length,
          completedItems: items.filter((i) => i.status === 'completed').length,
          inProgressItems: items.filter((i) => i.status === 'in_progress').length,
          notStartedItems: items.filter((i) => i.status === 'not_started').length,
        });
      }

      // Calculate summary
      const totalItems = allItems.length;
      const completedItems = allItems.filter((i) => i.status === 'completed').length;
      const overallProgress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

      setPhases(transformedPhases);
      setSummary({
        totalPhases: transformedPhases.length,
        totalItems,
        completedItems,
        overallProgress,
      });
    } catch (err) {
      console.error('Error loading WBS progress:', err);
      setError('Failed to load WBS data');
    } finally {
      setLoading(false);
    }
  }, [projectId, sites]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { phases, summary, loading, error, refresh: fetchData };
}

// ==================== Project Progress Hook (KD-weighted rollup) ====================

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

/**
 * Calculate weighted progress from item data for a set of items at a site.
 * Formula: Σ(item.weightage × item.getProgressPercentage()) / Σ(item.weightage)
 */
const calculateSiteProgressFromItems = (items: ItemModel[]): number => {
  if (!items || items.length === 0) return 0;
  const totalWeightage = items.reduce((sum, item) => sum + (item.weightage || 0), 0);
  if (totalWeightage === 0) return 0;
  return items.reduce(
    (sum, item) => sum + (item.weightage || 0) * item.getProgressPercentage(),
    0
  ) / totalWeightage;
};

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
      const itemsCollection = database.collections.get<ItemModel>('items');

      const breakdown: KDBreakdownItem[] = [];
      let totalWeightedProgress = 0;
      let totalWeightage = 0;

      for (const kd of keyDates) {
        // 2. Fetch sites for this KD
        const kdSites = await sitesCollection
          .query(Q.where('key_date_id', kd.id))
          .fetch();

        let kdProgress = kd.progressPercentage; // fallback

        if (kdSites.length > 0) {
          // 3. For each site, compute progress from its items
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

// ==================== Key Date Progress Chart Hook ====================

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

// ==================== KD Timeline Progress Hook ====================

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

/**
 * Generate monthly time points from start to end date
 */
const generateTimePoints = (startDate: number, endDate: number): { date: number; label: string }[] => {
  const points: { date: number; label: string }[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);

  let currentDate = new Date(start.getFullYear(), start.getMonth(), 1); // Start of month

  while (currentDate <= end) {
    points.push({
      date: currentDate.getTime(),
      label: currentDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }), // Month + Year
    });

    // Move to next month
    currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
  }

  return points;
};

export function useKDTimelineProgressData(): UseKDTimelineProgressResult {
  const { projectId } = usePlanningContext();
  const [timelineData, setTimelineData] = useState<TimelineDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!projectId) {
      setTimelineData([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch project to get start and end dates
      const projectsCollection = database.collections.get('projects');
      const project = await projectsCollection.find(projectId);
      const projectStartDate = project.startDate;
      const projectEndDate = project.endDate;

      if (!projectStartDate || !projectEndDate) {
        setTimelineData([]);
        setLoading(false);
        return;
      }

      // Fetch key dates for this project
      const keyDatesCollection = database.collections.get<KeyDateModel>('key_dates');
      const kds = await keyDatesCollection
        .query(Q.where('project_id', projectId))
        .fetch();

      if (kds.length === 0) {
        setTimelineData([]);
        setLoading(false);
        return;
      }

      const sitesCollection = database.collections.get<KeyDateSiteModel>('key_date_sites');
      const itemsCollection = database.collections.get<ItemModel>('items');

      // Sort KDs by sequence order for fallback estimation
      const sortedKDs = [...kds].sort((a, b) => a.sequenceOrder - b.sequenceOrder);

      // Create a map to store estimated dates for KDs without target dates
      const estimatedDates = new Map<string, number>();

      // Check if KDs have valid target dates, if not, estimate based on sequence
      // A valid date is a truthy number (timestamp)
      const kdWithoutDates = sortedKDs.filter(kd => !kd.targetDate || typeof kd.targetDate !== 'number' || kd.targetDate <= 0);

      console.log(`[KD Timeline] Total KDs: ${sortedKDs.length}, KDs without dates: ${kdWithoutDates.length}`);

      if (kdWithoutDates.length > 0) {
        console.warn(`[KD Timeline] ${kdWithoutDates.length} KDs missing target dates, estimating based on sequence`);

        // Distribute KDs evenly across the project timeline
        const totalKDs = sortedKDs.length;
        const projectDuration = projectEndDate - projectStartDate;

        sortedKDs.forEach((kd, index) => {
          const hasValidDate = kd.targetDate && typeof kd.targetDate === 'number' && kd.targetDate > 0;
          if (!hasValidDate) {
            // Estimate target date based on sequence order
            const estimatedDate = projectStartDate + (projectDuration * (index + 1) / totalKDs);
            estimatedDates.set(kd.id, estimatedDate);
            console.log(`[KD Timeline] Estimated date for ${kd.code} (seq ${kd.sequenceOrder}):`, new Date(estimatedDate).toLocaleDateString());
          } else {
            console.log(`[KD Timeline] ${kd.code} has target date:`, new Date(kd.targetDate).toLocaleDateString());
          }
        });
      }

      // Calculate actual progress for each KD
      const kdDataMap = new Map<string, { targetDate: number | null; weightage: number; actualProgress: number; sequenceOrder: number }>();

      for (const kd of sortedKDs) {
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

        // Use estimated date if target date is not valid
        const hasValidDate = kd.targetDate && typeof kd.targetDate === 'number' && kd.targetDate > 0;
        const targetDate = hasValidDate ? kd.targetDate : (estimatedDates.get(kd.id) || null);

        kdDataMap.set(kd.id, {
          targetDate: targetDate,
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

      // If latest KD is beyond project end, extend timeline to cover it
      if (latestKDDate > projectEndDate) {
        const extendedPoints = generateTimePoints(projectStartDate, latestKDDate);
        timePoints = extendedPoints;
      }

      // Calculate total weightage for normalization
      let totalWeightage = Array.from(kdDataMap.values()).reduce((sum, kd) => sum + kd.weightage, 0);

      // If no weightages are assigned, distribute evenly (100 / number of KDs)
      if (totalWeightage === 0) {
        console.warn('[KD Timeline] No weightages assigned, distributing evenly among KDs');
        const evenWeightage = 100 / kdDataMap.size;
        kdDataMap.forEach(kd => {
          kd.weightage = evenWeightage;
        });
        totalWeightage = 100;
      }

      // Debug: Log KD data
      console.log('[KD Timeline] Total KDs:', kds.length, 'Total Weightage:', totalWeightage);
      console.log('[KD Timeline] Time points:', timePoints.length, 'from', new Date(timePoints[0]?.date).toLocaleDateString(), 'to', new Date(timePoints[timePoints.length - 1]?.date).toLocaleDateString());

      const kdDebugData = Array.from(kdDataMap.values()).map(kd => ({
        seq: kd.sequenceOrder,
        date: kd.targetDate ? new Date(kd.targetDate).toLocaleDateString() : 'NULL',
        weight: kd.weightage,
        actualProg: Math.round(kd.actualProgress)
      }));
      console.log('[KD Timeline] KD Details:', kdDebugData);

      if (totalWeightage === 0) {
        console.error('[KD Timeline] ERROR: Total weightage is 0! All KDs have 0 weightage.');
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

        // EXPECTED: Sum up weightages for KDs that should be complete by this date
        // This creates a complete line from start to end showing the planned trajectory
        kdDataMap.forEach(kd => {
          if (kd.targetDate && kd.targetDate <= point.date) {
            expectedCumulative += kd.weightage;
          }
        });

        const expectedPct = Math.round((expectedCumulative / totalWeightage) * 100);

        // ACTUAL: Linear interpolation from 0% (start) to currentOverallProgress (current month)
        // For past/current months: show interpolated progress
        // For future months: maintain current progress (flat line)
        let actualPct: number;
        if (index <= validCurrentIndex) {
          // Linear progress from 0 to current progress over elapsed time
          actualPct = Math.round((currentOverallProgress * index) / Math.max(1, validCurrentIndex));
        } else {
          // Future months: maintain current progress
          actualPct = currentOverallProgress;
        }

        return {
          date: point.date,
          expectedProgress: expectedPct,
          actualProgress: actualPct,
          label: point.label,
        };
      });

      // Debug: Log sample data points
      console.log('[KD Timeline] First point:', timeline[0]);
      console.log('[KD Timeline] Last point:', timeline[timeline.length - 1]);
      console.log('[KD Timeline] Current month data:', timeline.find(t => t.date <= currentDate && t.date > currentDate - 30 * 24 * 60 * 60 * 1000));

      setTimelineData(timeline);
    } catch (err) {
      console.error('Error loading KD timeline progress data:', err);
      setError('Failed to load timeline progress');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { timelineData, loading, error, refresh: fetchData };
}
