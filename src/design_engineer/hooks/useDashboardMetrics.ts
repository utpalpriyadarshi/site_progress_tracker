import { useState, useEffect } from 'react';
import { database } from '../../../models/database';
import { Q } from '@nozbe/watermelondb';
import { logger } from '../../services/LoggingService';
import { DashboardMetrics } from '../types/DashboardTypes';

export const useDashboardMetrics = (projectId: string, engineerId: string, refreshTrigger: number) => {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalDoorsPackages: 0,
    pendingPackages: 0,
    receivedPackages: 0,
    reviewedPackages: 0,
    totalDesignRfqs: 0,
    draftRfqs: 0,
    issuedRfqs: 0,
    awardedRfqs: 0,
    complianceRate: 0,
    avgProcessingDays: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, [projectId, engineerId, refreshTrigger]);

  const loadMetrics = async () => {
    if (!projectId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      logger.info('[Dashboard] Loading metrics for project:', projectId);

      const doorsCollection = database.collections.get('doors_packages');
      const allPackages = await doorsCollection.query(Q.where('project_id', projectId)).fetch();

      const pendingPackages = allPackages.filter((pkg: any) => pkg.status === 'pending').length;
      const receivedPackages = allPackages.filter((pkg: any) => pkg.status === 'received').length;
      const reviewedPackages = allPackages.filter((pkg: any) => pkg.status === 'reviewed').length;

      const rfqCollection = database.collections.get('rfqs');
      const allRfqs = await rfqCollection
        .query(Q.where('project_id', projectId), Q.where('rfq_type', 'design'))
        .fetch();

      const draftRfqs = allRfqs.filter((rfq: any) => rfq.status === 'draft').length;
      const issuedRfqs = allRfqs.filter((rfq: any) => rfq.status === 'issued').length;
      const awardedRfqs = allRfqs.filter((rfq: any) => rfq.status === 'awarded').length;

      const complianceRate = allPackages.length > 0 ? (reviewedPackages / allPackages.length) * 100 : 0;

      let totalProcessingDays = 0;
      let processedCount = 0;

      allPackages.forEach((pkg: any) => {
        if (pkg.receivedDate && pkg.reviewedDate) {
          const processingTime = (pkg.reviewedDate - pkg.receivedDate) / (1000 * 60 * 60 * 24);
          totalProcessingDays += processingTime;
          processedCount++;
        }
      });

      const avgProcessingDays = processedCount > 0 ? Math.round(totalProcessingDays / processedCount) : 0;

      setMetrics({
        totalDoorsPackages: allPackages.length,
        pendingPackages,
        receivedPackages,
        reviewedPackages,
        totalDesignRfqs: allRfqs.length,
        draftRfqs,
        issuedRfqs,
        awardedRfqs,
        complianceRate: Math.round(complianceRate),
        avgProcessingDays,
      });

      logger.debug('[Dashboard] Metrics loaded:', {
        packages: allPackages.length,
        rfqs: allRfqs.length,
      });
    } catch (error) {
      logger.error('[Dashboard] Error loading metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  return { metrics, loading };
};
