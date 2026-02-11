import { useState, useEffect, useCallback } from 'react';
import { database } from '../../../../models/database';
import { Q } from '@nozbe/watermelondb';
import { logger } from '../../../services/LoggingService';

/**
 * useDashboardData Hook - Design Engineer
 *
 * Dual-scope hook that fetches both "My Work" (assigned sites) and "Project" metrics.
 * - myMetrics: Scoped to engineer's assigned sites
 * - projectMetrics: Full project-wide totals
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
  myMetrics: DashboardMetrics | null;
  projectMetrics: DashboardMetrics | null;
  alerts: Alert[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Calculate metrics from raw data arrays
 */
const calculateMetrics = (
  designDocs: any[],
  doorsPackages: any[],
  rfqs: any[]
): DashboardMetrics => {
  const draftDocs = designDocs.filter((d: any) => d.status === 'draft').length;
  const submittedDocs = designDocs.filter((d: any) => d.status === 'submitted').length;
  const approvedDocs = designDocs.filter(
    (d: any) => d.status === 'approved' || d.status === 'approved_with_comment'
  ).length;
  const rejectedDocs = designDocs.filter((d: any) => d.status === 'rejected').length;

  const pendingDoors = doorsPackages.filter((pkg: any) => pkg.status === 'pending').length;
  const receivedDoors = doorsPackages.filter((pkg: any) => pkg.status === 'received').length;
  const reviewedDoors = doorsPackages.filter((pkg: any) => pkg.status === 'reviewed').length;

  const draftRfqs = rfqs.filter((rfq: any) => rfq.status === 'draft').length;
  const issuedRfqs = rfqs.filter((rfq: any) => rfq.status === 'issued').length;
  const awardedRfqs = rfqs.filter((rfq: any) => rfq.status === 'awarded').length;

  const complianceRate =
    doorsPackages.length > 0
      ? Math.round((reviewedDoors / doorsPackages.length) * 100)
      : 0;

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

  return {
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
  };
};

/**
 * Generate alerts based on business rules (from "My Work" data only)
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
 * Main hook - fetches dual-scope dashboard data
 */
export const useDashboardData = (
  projectId: string | null,
  engineerId: string | null
): UseDashboardDataReturn => {
  const [myMetrics, setMyMetrics] = useState<DashboardMetrics | null>(null);
  const [projectMetrics, setProjectMetrics] = useState<DashboardMetrics | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!projectId) {
      setLoading(false);
      setMyMetrics(null);
      setProjectMetrics(null);
      setAlerts([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch engineer's assigned site IDs
      let mySiteIds: string[] = [];
      if (engineerId) {
        const mySites = await database.collections
          .get('sites')
          .query(Q.where('design_engineer_id', engineerId))
          .fetch();
        mySiteIds = mySites.map((s: any) => s.id);
      }

      // Fetch all project-level data
      const [allDesignDocs, allDoorsPackages, allRfqs] = await Promise.all([
        database.collections
          .get('design_documents')
          .query(Q.where('project_id', projectId))
          .fetch(),
        database.collections
          .get('doors_packages')
          .query(Q.where('project_id', projectId))
          .fetch(),
        database.collections
          .get('rfqs')
          .query(Q.where('project_id', projectId), Q.where('rfq_type', 'design'))
          .fetch(),
      ]);

      // Calculate project-wide metrics
      const projMetrics = calculateMetrics(allDesignDocs, allDoorsPackages, allRfqs);
      setProjectMetrics(projMetrics);

      // Filter "My Work" data
      // Design docs: filter by site_id matching engineer's assigned sites
      const myDesignDocs = mySiteIds.length > 0
        ? allDesignDocs.filter((d: any) => d.siteId && mySiteIds.includes(d.siteId))
        : [];

      // DOORS packages: filter by created_by or assigned_to matching engineerId
      const myDoorsPackages = engineerId
        ? allDoorsPackages.filter(
            (pkg: any) => pkg.createdBy === engineerId || pkg.assignedTo === engineerId
          )
        : [];

      // RFQs: filter by created_by_id matching engineerId
      const myRfqs = engineerId
        ? allRfqs.filter((rfq: any) => rfq.createdById === engineerId)
        : [];

      const myCalcMetrics = calculateMetrics(myDesignDocs, myDoorsPackages, myRfqs);
      setMyMetrics(myCalcMetrics);

      // Generate alerts from "My Work" data only
      const generatedAlerts = generateAlerts(myDesignDocs, myDoorsPackages, myCalcMetrics.complianceRate);
      setAlerts(generatedAlerts);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load dashboard data';
      logger.error('[useDashboardData] Error:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [projectId, engineerId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refresh = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  return {
    myMetrics,
    projectMetrics,
    alerts,
    loading,
    error,
    refresh,
  };
};
