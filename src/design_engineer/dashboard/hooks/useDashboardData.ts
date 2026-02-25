import { useState, useEffect, useCallback } from 'react';
import { database } from '../../../../models/database';
import { Q } from '@nozbe/watermelondb';
import { logger } from '../../../services/LoggingService';
import { filterToLatestRevisions } from '../../../planning/utils/designDocumentProgress';

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
  revisedDocs: number;

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

export interface KDDocProgress {
  keyDateId: string;
  keyDateCode: string;
  keyDateDescription: string;
  docProgress: number; // 0-100
  totalDocs: number;
  approvedDocs: number;
}

interface UseDashboardDataReturn {
  myMetrics: DashboardMetrics | null;
  projectMetrics: DashboardMetrics | null;
  alerts: Alert[];
  kdDocProgress: KDDocProgress[];
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
  // Count only the latest revision of each document number
  const latestDocs = filterToLatestRevisions(designDocs);
  const draftDocs = latestDocs.filter((d: any) => d.status === 'draft').length;
  const submittedDocs = latestDocs.filter((d: any) => d.status === 'submitted').length;
  const approvedDocs = latestDocs.filter(
    (d: any) => d.status === 'approved' || d.status === 'approved_with_comment'
  ).length;
  const rejectedDocs = latestDocs.filter((d: any) => d.status === 'rejected').length;
  // "Revised" = documents where the latest revision is R1 or higher
  const revisedDocs = latestDocs.filter((d: any) => d.revisionNumber && d.revisionNumber !== 'R0').length;

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
    totalDesignDocs: latestDocs.length,
    draftDocs,
    submittedDocs,
    approvedDocs,
    rejectedDocs,
    revisedDocs,
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

  // Work only with latest revisions to avoid false alerts from superseded revisions
  const latestDocs = filterToLatestRevisions(designDocs);

  // Alert 1: Draft documents pending > 7 days
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const oldDrafts = latestDocs.filter(
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
  const rejectedDocs = latestDocs.filter((doc) => doc.status === 'rejected');
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
  const submittedDocs = latestDocs.filter((doc) => doc.status === 'submitted');
  if (submittedDocs.length > 0) {
    alerts.push({
      id: 'submitted-docs',
      type: 'info',
      title: 'Documents Under Review',
      message: `${submittedDocs.length} document(s) submitted and awaiting approval`,
    });
  }

  // Alert 6: Documents not linked to any Key Date (progress not tracked)
  const unlinkedDocs = latestDocs.filter((doc: any) => !doc.keyDateId);
  if (unlinkedDocs.length > 0) {
    alerts.push({
      id: 'unlinked-docs',
      type: 'warning',
      title: 'Unlinked Documents',
      message: `${unlinkedDocs.length} document(s) not linked to any Key Date — progress not tracked`,
      actionLabel: 'View Documents',
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
  const [kdDocProgress, setKdDocProgress] = useState<KDDocProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (silentUpdate = false) => {
    if (!projectId) {
      setLoading(false);
      setMyMetrics(null);
      setProjectMetrics(null);
      setAlerts([]);
      return;
    }

    try {
      if (!silentUpdate) setLoading(true);
      setError(null);

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
      // Design docs: filter by created_by matching engineer
      const myDesignDocs = engineerId
        ? allDesignDocs.filter((d: any) => d.createdBy === engineerId)
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

      // Calculate per-Key Date document progress
      const linkedDocs = allDesignDocs.filter((d: any) => d.keyDateId);
      if (linkedDocs.length > 0) {
        // Group docs by keyDateId
        const docsByKd: Record<string, any[]> = {};
        for (const doc of linkedDocs) {
          const kdId = (doc as any).keyDateId;
          if (!docsByKd[kdId]) docsByKd[kdId] = [];
          docsByKd[kdId].push(doc);
        }

        // Fetch key date metadata
        const kdIds = Object.keys(docsByKd);
        const keyDatesCollection = database.collections.get('key_dates');
        const keyDates = await keyDatesCollection
          .query(Q.where('id', Q.oneOf(kdIds)))
          .fetch();

        const statusProgressMap: Record<string, number> = {
          draft: 0,
          submitted: 30,
          approved: 100,
          approved_with_comment: 100,
          rejected: 0,
        };

        const kdProgress: KDDocProgress[] = keyDates.map((kd: any) => {
          const docs = docsByKd[kd.id] || [];
          const totalWeightage = docs.reduce((sum: number, d: any) => sum + (d.weightage || 0), 0);
          const weightedProgress = totalWeightage > 0
            ? docs.reduce((sum: number, d: any) => {
                const progress = statusProgressMap[(d as any).status] || 0;
                return sum + (d.weightage || 0) * progress;
              }, 0) / totalWeightage
            : 0;
          const approved = docs.filter(
            (d: any) => d.status === 'approved' || d.status === 'approved_with_comment'
          ).length;

          return {
            keyDateId: kd.id,
            keyDateCode: kd.code,
            keyDateDescription: kd.description,
            docProgress: Math.round(weightedProgress * 100) / 100,
            totalDocs: docs.length,
            approvedDocs: approved,
          };
        });

        setKdDocProgress(kdProgress);
      } else {
        setKdDocProgress([]);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load dashboard data';
      logger.error('[useDashboardData] Error:', err as Error);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [projectId, engineerId]);

  useEffect(() => {
    fetchData();
    const subscription = database
      .withChangesForTables(['design_documents', 'doors_packages', 'rfqs', 'key_dates'])
      .subscribe(() => {
        fetchData(true);
      });
    return () => subscription.unsubscribe();
  }, [fetchData]);

  const refresh = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  return {
    myMetrics,
    projectMetrics,
    alerts,
    kdDocProgress,
    loading,
    error,
    refresh,
  };
};
