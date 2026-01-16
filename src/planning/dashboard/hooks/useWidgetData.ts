/**
 * Widget Data Hooks
 *
 * Custom hooks for fetching and managing dashboard widget data.
 *
 * @version 1.0.0
 * @since Planning Phase 3
 */

import { useState, useEffect, useCallback } from 'react';
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
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // TODO: Replace with actual API call
      // Simulated data for now
      await new Promise<void>((resolve) => setTimeout(resolve, 500));

      const mockMilestones: Milestone[] = [
        { id: '1', name: 'Foundation Complete', dueDate: new Date(Date.now() + 7 * 86400000), status: 'in_progress', daysRemaining: 7 },
        { id: '2', name: 'Steel Frame Erection', dueDate: new Date(Date.now() + 14 * 86400000), status: 'planned', daysRemaining: 14 },
        { id: '3', name: 'Roof Installation', dueDate: new Date(Date.now() + 30 * 86400000), status: 'planned', daysRemaining: 30 },
        { id: '4', name: 'Electrical Rough-in', dueDate: new Date(Date.now() + 45 * 86400000), status: 'planned', daysRemaining: 45 },
        { id: '5', name: 'Final Inspection', dueDate: new Date(Date.now() + 90 * 86400000), status: 'planned', daysRemaining: 90 },
      ];

      setMilestones(mockMilestones);
    } catch (err) {
      setError('Failed to load milestones');
    } finally {
      setLoading(false);
    }
  }, []);

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
  const [items, setItems] = useState<CriticalPathItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      await new Promise<void>((resolve) => setTimeout(resolve, 400));

      const mockItems: CriticalPathItem[] = [
        { id: '1', name: 'Concrete Pour - Section A', riskLevel: 'high', delayImpact: 5, progress: 60, dueDate: new Date() },
        { id: '2', name: 'Structural Steel Delivery', riskLevel: 'high', delayImpact: 8, progress: 40, dueDate: new Date() },
        { id: '3', name: 'MEP Coordination', riskLevel: 'medium', delayImpact: 3, progress: 75, dueDate: new Date() },
        { id: '4', name: 'Waterproofing', riskLevel: 'medium', delayImpact: 2, progress: 85, dueDate: new Date() },
      ];

      setItems(mockItems);
    } catch (err) {
      setError('Failed to load critical path data');
    } finally {
      setLoading(false);
    }
  }, []);

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
  const [overview, setOverview] = useState<ScheduleOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      await new Promise<void>((resolve) => setTimeout(resolve, 300));

      const mockOverview: ScheduleOverview = {
        totalItems: 48,
        completedItems: 18,
        onTrackItems: 22,
        delayedItems: 8,
        overallProgress: 65,
        projectStartDate: new Date(Date.now() - 60 * 86400000),
        projectEndDate: new Date(Date.now() + 120 * 86400000),
        daysRemaining: 120,
      };

      setOverview(mockOverview);
    } catch (err) {
      setError('Failed to load schedule overview');
    } finally {
      setLoading(false);
    }
  }, []);

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
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      await new Promise<void>((resolve) => setTimeout(resolve, 350));

      const mockActivities: Activity[] = [
        { id: '1', type: 'created', itemName: 'Electrical Panel Installation', itemType: 'schedule', timestamp: new Date(Date.now() - 30 * 60000) },
        { id: '2', type: 'completed', itemName: 'Site Survey', itemType: 'milestone', timestamp: new Date(Date.now() - 2 * 3600000) },
        { id: '3', type: 'updated', itemName: 'Foundation Works', itemType: 'wbs', timestamp: new Date(Date.now() - 4 * 3600000) },
        { id: '4', type: 'status_changed', itemName: 'Concrete Curing', itemType: 'schedule', timestamp: new Date(Date.now() - 24 * 3600000) },
        { id: '5', type: 'created', itemName: 'Crane Operator', itemType: 'resource', timestamp: new Date(Date.now() - 48 * 3600000) },
      ];

      setActivities(mockActivities);
    } catch (err) {
      setError('Failed to load recent activities');
    } finally {
      setLoading(false);
    }
  }, []);

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
  const [resources, setResources] = useState<Resource[]>([]);
  const [summary, setSummary] = useState<ResourceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      await new Promise<void>((resolve) => setTimeout(resolve, 450));

      const mockResources: Resource[] = [
        { id: '1', name: 'Concrete Crew', type: 'labor', allocated: 110, available: 40, utilized: 44 },
        { id: '2', name: 'Tower Crane', type: 'equipment', allocated: 95, available: 100, utilized: 95 },
        { id: '3', name: 'Steel Workers', type: 'labor', allocated: 85, available: 60, utilized: 51 },
        { id: '4', name: 'Ready-mix Concrete', type: 'material', allocated: 60, available: 500, utilized: 300 },
      ];

      const mockSummary: ResourceSummary = {
        totalResources: 12,
        overAllocated: 2,
        optimallyAllocated: 7,
        underAllocated: 3,
      };

      setResources(mockResources);
      setSummary(mockSummary);
    } catch (err) {
      setError('Failed to load resource data');
    } finally {
      setLoading(false);
    }
  }, []);

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
  const [phases, setPhases] = useState<WBSPhase[]>([]);
  const [summary, setSummary] = useState<WBSSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      await new Promise<void>((resolve) => setTimeout(resolve, 400));

      const mockPhases: WBSPhase[] = [
        { id: '1', name: 'Site Preparation', totalItems: 8, completedItems: 8, inProgressItems: 0, notStartedItems: 0 },
        { id: '2', name: 'Foundation', totalItems: 12, completedItems: 10, inProgressItems: 2, notStartedItems: 0 },
        { id: '3', name: 'Structural', totalItems: 15, completedItems: 5, inProgressItems: 6, notStartedItems: 4 },
        { id: '4', name: 'MEP', totalItems: 20, completedItems: 0, inProgressItems: 4, notStartedItems: 16 },
        { id: '5', name: 'Finishing', totalItems: 10, completedItems: 0, inProgressItems: 0, notStartedItems: 10 },
      ];

      const mockSummary: WBSSummary = {
        totalPhases: 5,
        totalItems: 65,
        completedItems: 23,
        overallProgress: 35,
      };

      setPhases(mockPhases);
      setSummary(mockSummary);
    } catch (err) {
      setError('Failed to load WBS data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { phases, summary, loading, error, refresh: fetchData };
}
