import { useState, useEffect, useCallback } from 'react';
import { database } from '../../../../models/database';
import { Q } from '@nozbe/watermelondb';
import { logger } from '../../../services/LoggingService';

/**
 * useDashboardData Hook - Design Engineer
 *
 * Consolidated hook that fetches all dashboard metrics and alerts
 * Replaces individual widget hooks for better performance and maintainability
 */

interface DashboardMetrics {
  // Design Documents
  totalDesignDocs: number;
  draftDocs: number;
  submittedDocs: number;
  approvedDocs: number;
  rejectedDocs: number;

  // DOORS Packages
  doorsPackages: number;
  pendingDoors: number;
  receivedDoors: number;
  reviewedDoors: number;

  // RFQs
  designRfqs: number;
  draftRfqs: number;
  issuedRfqs: number;
  awardedRfqs: number;

  // Compliance
  complianceRate: number;
  complianceTarget: number;

  // Processing Time
  avgProcessingTime: number;
  processingBenchmark: number;
}

interface Alert {
  id: string;
  type: 'warning' | 'error' | 'info';
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

interface UseDashboardDataReturn {
  metrics: DashboardMetrics | null;
  alerts: Alert[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Generate alerts based on business rules
 */
const generateAlerts = (
  designDocs: any[],
  doorsPackages: any[],
  complianceRate: number
): Alert[] => {
  const alerts: Alert[] = [];

  // Alert 1: Draft documents pending > 7 days
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const oldDrafts = designDocs.filter(
    (doc) => doc.status === 'draft' && doc.createdAt < sevenDaysAgo
  );

  if (oldDrafts.length > 0) {
    alerts.push({
      id: 'old-drafts',
      type: 'warning',
      title: 'Pending Draft Documents',
      message: `${oldDrafts.length} draft document(s) pending for more than 7 days`,
      actionLabel: 'Review Drafts',
    });
  }

  // Alert 2: Rejected documents need attention
  const rejectedDocs = designDocs.filter((doc) => doc.status === 'rejected');
  if (rejectedDocs.length > 0) {
    alerts.push({
      id: 'rejected-docs',
      type: 'error',
      title: 'Rejected Documents',
      message: `${rejectedDocs.length} document(s) rejected and need revision`,
      actionLabel: 'View Rejected',
    });
  }

  // Alert 3: Compliance rate below target (80%)
  if (complianceRate < 80) {
    alerts.push({
      id: 'low-compliance',
      type: 'error',
      title: 'Low Compliance Rate',
      message: `Compliance rate is ${complianceRate}%, below target of 80%`,
      actionLabel: 'View Packages',
    });
  }

  // Alert 4: Many pending DOORS packages (> 5)
  const pendingDoors = doorsPackages.filter((pkg) => pkg.status === 'pending');
  if (pendingDoors.length > 5) {
    alerts.push({
      id: 'many-pending-doors',
      type: 'info',
      title: 'Pending DOORS Packages',
      message: `${pendingDoors.length} DOORS packages pending review`,
      actionLabel: 'Review Packages',
    });
  }

  // Alert 5: Submitted documents awaiting approval
  const submittedDocs = designDocs.filter((doc) => doc.status === 'submitted');
  if (submittedDocs.length > 0) {
    alerts.push({
      id: 'submitted-docs',
      type: 'info',
      title: 'Documents Under Review',
      message: `${submittedDocs.length} document(s) submitted and awaiting approval`,
    });
  }

  return alerts;
};

/**
 * Main hook - fetches all dashboard data
 */
export const useDashboardData = (projectId: string | null): UseDashboardDataReturn => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!projectId) {
      setLoading(false);
      setMetrics(null);
      setAlerts([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch all data in parallel using Promise.all
      const [designDocs, doorsPackages, rfqs] = await Promise.all([
        // Design Documents
        database.collections
          .get('design_documents')
          .query(Q.where('project_id', projectId))
          .fetch(),

        // DOORS Packages
        database.collections
          .get('doors_packages')
          .query(Q.where('project_id', projectId))
          .fetch(),

        // RFQs (design type only)
        database.collections
          .get('rfqs')
          .query(Q.where('project_id', projectId), Q.where('rfq_type', 'design'))
          .fetch(),
      ]);

      // Calculate Design Document metrics
      const draftDocs = designDocs.filter((d: any) => d.status === 'draft').length;
      const submittedDocs = designDocs.filter((d: any) => d.status === 'submitted').length;
      const approvedDocs = designDocs.filter(
        (d: any) => d.status === 'approved' || d.status === 'approved_with_comment'
      ).length;
      const rejectedDocs = designDocs.filter((d: any) => d.status === 'rejected').length;

      // Calculate DOORS metrics
      const pendingDoors = doorsPackages.filter((pkg: any) => pkg.status === 'pending').length;
      const receivedDoors = doorsPackages.filter((pkg: any) => pkg.status === 'received').length;
      const reviewedDoors = doorsPackages.filter((pkg: any) => pkg.status === 'reviewed').length;

      // Calculate RFQ metrics
      const draftRfqs = rfqs.filter((rfq: any) => rfq.status === 'draft').length;
      const issuedRfqs = rfqs.filter((rfq: any) => rfq.status === 'issued').length;
      const awardedRfqs = rfqs.filter((rfq: any) => rfq.status === 'awarded').length;

      // Calculate compliance rate
      const complianceRate =
        doorsPackages.length > 0
          ? Math.round((reviewedDoors / doorsPackages.length) * 100)
          : 0;

      // Calculate average processing time
      let totalProcessingDays = 0;
      let processedCount = 0;

      doorsPackages.forEach((pkg: any) => {
        if (pkg.receivedDate && pkg.reviewedDate) {
          const processingTime =
            (pkg.reviewedDate - pkg.receivedDate) / (1000 * 60 * 60 * 24);
          totalProcessingDays += processingTime;
          processedCount++;
        }
      });

      const avgProcessingTime =
        processedCount > 0 ? Math.round(totalProcessingDays / processedCount) : 0;

      // Set metrics
      setMetrics({
        totalDesignDocs: designDocs.length,
        draftDocs,
        submittedDocs,
        approvedDocs,
        rejectedDocs,
        doorsPackages: doorsPackages.length,
        pendingDoors,
        receivedDoors,
        reviewedDoors,
        designRfqs: rfqs.length,
        draftRfqs,
        issuedRfqs,
        awardedRfqs,
        complianceRate,
        complianceTarget: 80,
        avgProcessingTime,
        processingBenchmark: 7,
      });

      // Generate alerts
      const generatedAlerts = generateAlerts(designDocs, doorsPackages, complianceRate);
      setAlerts(generatedAlerts);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load dashboard data';
      logger.error('[useDashboardData] Error:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refresh = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  return {
    metrics,
    alerts,
    loading,
    error,
    refresh,
  };
};
