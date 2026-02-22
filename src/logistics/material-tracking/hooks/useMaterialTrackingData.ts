/**
 * useMaterialTrackingData Hook
 *
 * Manages material tracking data loading and state
 */

import { useState, useEffect } from 'react';
import { database } from '../../../../models/database';
import { Q } from '@nozbe/watermelondb';
import DoorsPackageModel from '../../../../models/DoorsPackageModel';
import { logger } from '../../../services/LoggingService';

export const useMaterialTrackingData = (projectId: string | null) => {
  const [doorsPackages, setDoorsPackages] = useState<DoorsPackageModel[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (projectId) {
      loadDoorsPackages();
    } else {
      setDoorsPackages([]);
    }
  }, [projectId]);

  const loadDoorsPackages = async () => {
    if (!projectId) return;

    try {
      setLoading(true);
      const doorsCollection = database.collections.get<DoorsPackageModel>('doors_packages');
      const packages = await doorsCollection
        .query(Q.where('project_id', projectId))
        .fetch();
      setDoorsPackages(packages);
      logger.debug('[useMaterialTrackingData] Loaded DOORS packages:', { value: packages.length });
    } catch (error) {
      logger.error('[useMaterialTrackingData] Error loading DOORS packages:', error as Error);
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => {
    loadDoorsPackages();
  };

  return {
    doorsPackages,
    loading,
    refresh,
  };
};
