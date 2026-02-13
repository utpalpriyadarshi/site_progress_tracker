/**
 * useKDTimelineProgressData Hook
 *
 * Fetches and manages Key Date timeline progress data for the dashboard widget.
 * Generates monthly timeline showing expected vs actual progress over time.
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

// ==================== Helpers ====================

/**
 * Generate monthly time points from start to end date
 *
 * Creates an array of time points at monthly intervals, starting at the
 * beginning of the start month and continuing to the end date.
 *
 * @param startDate - Project start date timestamp
 * @param endDate - Project end date timestamp
 * @returns Array of time points with date and label
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

// ==================== Hook ====================

/**
 * Hook for fetching KD timeline progress
 *
 * Generates a monthly timeline showing expected vs actual cumulative progress.
 * - Expected line: Cumulative progress based on KD target dates (complete trajectory)
 * - Actual line: Linear interpolation from 0% to current progress (current month), flat for future
 *
 * Progress is calculated from site items using weighted site contributions.
 * If KDs lack target dates, they are estimated evenly across project timeline.
 *
 * @returns {UseKDTimelineProgressResult} Timeline data points, loading state, error, and refresh function
 */
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
      let project;
      try {
        project = await projectsCollection.find(projectId);
      } catch (err) {
        // Project not found (likely after logout) - reset state and return
        setTimelineData([]);
        setLoading(false);
        return;
      }
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

      // Sort KDs by sequence order for fallback estimation
      const sortedKDs = [...kds].sort((a, b) => a.sequenceOrder - b.sequenceOrder);

      // Create a map to store estimated dates for KDs without target dates
      const estimatedDates = new Map<string, number>();

      // Check if KDs have valid target dates, if not, estimate based on sequence
      // A valid date is a truthy number (timestamp)
      const kdWithoutDates = sortedKDs.filter(kd => !kd.targetDate || typeof kd.targetDate !== 'number' || kd.targetDate <= 0);

      if (kdWithoutDates.length > 0) {

        // Distribute KDs evenly across the project timeline
        const totalKDs = sortedKDs.length;
        const projectDuration = projectEndDate - projectStartDate;

        sortedKDs.forEach((kd, index) => {
          const hasValidDate = kd.targetDate && typeof kd.targetDate === 'number' && kd.targetDate > 0;
          if (!hasValidDate) {
            // Estimate target date based on sequence order
            const estimatedDate = projectStartDate + (projectDuration * (index + 1) / totalKDs);
            estimatedDates.set(kd.id, estimatedDate);
          }
        });
      }

      // Fetch all KD sites upfront (single query for all KDs)
      const allKdSites = await sitesCollection
        .query(Q.where('key_date_id', Q.oneOf(sortedKDs.map(kd => kd.id))))
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

      // Batch load ALL items for ALL sites in ONE query (Performance optimization!)
      const itemsBySite = await batchLoadItemsBySites([...allUniqueSiteIds]);

      // Calculate actual progress for each KD using pre-loaded data
      const kdDataMap = new Map<string, { targetDate: number | null; weightage: number; actualProgress: number; sequenceOrder: number }>();

      for (const kd of sortedKDs) {
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
        const evenWeightage = 100 / kdDataMap.size;
        kdDataMap.forEach(kd => {
          kd.weightage = evenWeightage;
        });
        totalWeightage = 100;
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
    const subscription = database
      .withChangesForTables(['items', 'design_documents', 'key_date_sites', 'key_dates'])
      .subscribe(() => {
        fetchData();
      });
    return () => subscription.unsubscribe();
  }, [fetchData]);

  return { timelineData, loading, error, refresh: fetchData };
}
