/**
 * useDoorsPackageData Hook
 *
 * Fetches DOORS package status for the selected project.
 * Shows package counts by status and recent activity.
 *
 * @version 1.0.0
 * @since Logistics Phase 3
 */

import { useState, useEffect, useCallback } from 'react';
import { Q } from '@nozbe/watermelondb';
import { database } from '../../../../models/database';
import { useLogisticsContext } from '../../context/LogisticsContext';

// ==================== Types ====================

export interface DoorsPackageSummary {
  id: string;
  packageNumber: string;
  description: string;
  status: string;
  requirementsCount: number;
  updatedAt: number;
}

export interface DoorsPackageData {
  totalPackages: number;
  draftCount: number;
  inProgressCount: number;
  completedCount: number;
  recentPackages: DoorsPackageSummary[];
  requirementsTotal: number;
  requirementsFulfilled: number;
}

export interface UseDoorsPackageResult {
  data: DoorsPackageData | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

// ==================== Hook ====================

export function useDoorsPackageData(): UseDoorsPackageResult {
  const { selectedProjectId } = useLogisticsContext();
  const [data, setData] = useState<DoorsPackageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!selectedProjectId) {
      setData(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch DOORS packages
      const packages = await database.collections
        .get('doors_packages')
        .query(Q.where('project_id', selectedProjectId))
        .fetch();

      // Fetch all requirements for these packages
      const packageIds = packages.map((p: any) => p.id);
      let requirements: any[] = [];

      if (packageIds.length > 0) {
        requirements = await database.collections
          .get('doors_requirements')
          .query(Q.where('package_id', Q.oneOf(packageIds)))
          .fetch();
      }

      // Create requirements count map
      const requirementsCountMap = new Map<string, number>();
      requirements.forEach((req: any) => {
        const count = requirementsCountMap.get(req.packageId) || 0;
        requirementsCountMap.set(req.packageId, count + 1);
      });

      const totalPackages = packages.length;

      const draftCount = packages.filter((p: any) =>
        p.status === 'draft' || !p.status
      ).length;

      const inProgressCount = packages.filter((p: any) =>
        ['in_progress', 'pending', 'review'].includes(p.status)
      ).length;

      const completedCount = packages.filter((p: any) =>
        ['completed', 'approved'].includes(p.status)
      ).length;

      // Get recent packages
      const recentPackages: DoorsPackageSummary[] = packages
        .sort((a: any, b: any) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0))
        .slice(0, 5)
        .map((pkg: any) => ({
          id: pkg.id,
          packageNumber: pkg.packageNumber || 'N/A',
          description: pkg.description || pkg.name || 'Untitled Package',
          status: pkg.status || 'draft',
          requirementsCount: requirementsCountMap.get(pkg.id) || 0,
          updatedAt: pkg.updatedAt || pkg.createdAt,
        }));

      // Requirements metrics
      const requirementsTotal = requirements.length;
      const requirementsFulfilled = requirements.filter((r: any) =>
        r.status === 'fulfilled' || r.status === 'completed'
      ).length;

      setData({
        totalPackages,
        draftCount,
        inProgressCount,
        completedCount,
        recentPackages,
        requirementsTotal,
        requirementsFulfilled,
      });
    } catch (err) {
      setError('Failed to load DOORS package data');
    } finally {
      setLoading(false);
    }
  }, [selectedProjectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refresh: fetchData };
}

export default useDoorsPackageData;
