/**
 * Manager Dashboard Screen - v2.10
 * Section 1: Project Overview & KPIs
 *
 * Displays:
 * - Project header with name, timeline, overall health
 * - 8 KPI cards in 4x2 grid:
 *   1. Overall Project Completion % (60% items + 40% milestones)
 *   2. Sites on Schedule vs Delayed
 *   3. Budget Utilization %
 *   4. Open Hindrances Count
 *   5. Pending Approvals Count
 *   6. Equipment Delivery Status
 *   7. Critical Path Items at Risk
 *   8. Upcoming Milestones (next 30 days)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Chip,
  ActivityIndicator,
  Divider,
  ProgressBar,
} from 'react-native-paper';
import { database } from '../../models/database';
import { useManagerContext } from './context/ManagerContext';
import { Q } from '@nozbe/watermelondb';

interface ProjectStats {
  overallCompletion: number;
  sitesOnSchedule: number;
  sitesDelayed: number;
  totalSites: number;
  budgetUtilization: number;
  openHindrances: number;
  pendingApprovals: number;
  deliveryOnTrack: number;
  deliveryDelayed: number;
  criticalPathItemsAtRisk: number;
  upcomingMilestones: number;
}

interface ProjectInfo {
  name: string;
  startDate: number;
  endDate: number;
  status: string;
  client: string;
  budget: number;
}

interface EngineeringData {
  pm200Progress: number;
  pm200Status: string;
  totalDoors: number;
  doorsApproved: number;
  doorsUnderReview: number;
  doorsOpenIssues: number;
  totalRequirements: number;
  compliantRequirements: number;
  totalRfqs: number;
  rfqsQuotesReceived: number;
  rfqsUnderEvaluation: number;
  rfqsAwarded: number;
}

interface SiteProgressData {
  siteId: string;
  siteName: string;
  supervisorName: string;
  overallProgress: number;
  status: 'on_track' | 'at_risk' | 'delayed';
  criticalIssues: number;
  itemsProgress: number;
  milestonesProgress: number;
}

interface EquipmentMaterialsData {
  pm300Progress: number;
  pm300Status: string;
  pm400Progress: number;
  pm400Status: string;
  totalPOs: number;
  posDraft: number;
  posIssued: number;
  posInProgress: number;
  posDelivered: number;
  posClosed: number;
  totalPOValue: number;
  upcomingDeliveries: number;
  delayedDeliveries: number;
}

interface FinancialData {
  projectBudget: number;
  budgetAllocated: number;
  budgetSpent: number;
  budgetRemaining: number;
  budgetUtilization: number;
  contractValue: number;
  estimatedCost: number;
  actualCost: number;
  projectedProfit: number;
  profitMargin: number;
  totalBOMs: number;
  bomsDraft: number;
  bomsApproved: number;
  bomsLocked: number;
  bomTotalCost: number;
  bomActualCost: number;
}

interface TestingCommissioningData {
  pm500Progress: number;
  pm500Status: string;
  pm600Progress: number;
  pm600Status: string;
  itemsInPreCommissioning: number;
  itemsInCommissioning: number;
  testsCompleted: number;
  testsPending: number;
  systemsEnergized: number;
  systemsOperational: number;
  totalInspections: number;
  inspectionsPassed: number;
  inspectionsFailed: number;
}

const ManagerDashboardScreen = () => {
  const { projectId } = useManagerContext();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<ProjectStats>({
    overallCompletion: 0,
    sitesOnSchedule: 0,
    sitesDelayed: 0,
    totalSites: 0,
    budgetUtilization: 0,
    openHindrances: 0,
    pendingApprovals: 0,
    deliveryOnTrack: 0,
    deliveryDelayed: 0,
    criticalPathItemsAtRisk: 0,
    upcomingMilestones: 0,
  });
  const [projectInfo, setProjectInfo] = useState<ProjectInfo | null>(null);
  const [engineeringData, setEngineeringData] = useState<EngineeringData>({
    pm200Progress: 0,
    pm200Status: 'not_started',
    totalDoors: 0,
    doorsApproved: 0,
    doorsUnderReview: 0,
    doorsOpenIssues: 0,
    totalRequirements: 0,
    compliantRequirements: 0,
    totalRfqs: 0,
    rfqsQuotesReceived: 0,
    rfqsUnderEvaluation: 0,
    rfqsAwarded: 0,
  });
  const [sitesProgress, setSitesProgress] = useState<SiteProgressData[]>([]);
  const [equipmentData, setEquipmentData] = useState<EquipmentMaterialsData>({
    pm300Progress: 0,
    pm300Status: 'not_started',
    pm400Progress: 0,
    pm400Status: 'not_started',
    totalPOs: 0,
    posDraft: 0,
    posIssued: 0,
    posInProgress: 0,
    posDelivered: 0,
    posClosed: 0,
    totalPOValue: 0,
    upcomingDeliveries: 0,
    delayedDeliveries: 0,
  });
  const [financialData, setFinancialData] = useState<FinancialData>({
    projectBudget: 0,
    budgetAllocated: 0,
    budgetSpent: 0,
    budgetRemaining: 0,
    budgetUtilization: 0,
    contractValue: 0,
    estimatedCost: 0,
    actualCost: 0,
    projectedProfit: 0,
    profitMargin: 0,
    totalBOMs: 0,
    bomsDraft: 0,
    bomsApproved: 0,
    bomsLocked: 0,
    bomTotalCost: 0,
    bomActualCost: 0,
  });
  const [testingCommissioningData, setTestingCommissioningData] = useState<TestingCommissioningData>({
    pm500Progress: 0,
    pm500Status: 'not_started',
    pm600Progress: 0,
    pm600Status: 'not_started',
    itemsInPreCommissioning: 0,
    itemsInCommissioning: 0,
    testsCompleted: 0,
    testsPending: 0,
    systemsEnergized: 0,
    systemsOperational: 0,
    totalInspections: 0,
    inspectionsPassed: 0,
    inspectionsFailed: 0,
  });

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadProjectInfo(),
        calculateStats(),
        loadEngineeringData(),
        loadSitesProgress(),
        loadEquipmentMaterialsData(),
        loadFinancialData(),
        loadTestingCommissioningData(),
      ]);
    } catch (error) {
      console.error('[ManagerDashboard] Error loading data:', error);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  useEffect(() => {
    if (projectId) {
      loadDashboardData();
    }
  }, [projectId, loadDashboardData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const loadProjectInfo = async () => {
    if (!projectId) return;

    try {
      const project = await database.collections.get('projects').find(projectId);
      setProjectInfo({
        name: (project as any).name,
        startDate: (project as any).startDate,
        endDate: (project as any).endDate,
        status: (project as any).status,
        client: (project as any).client,
        budget: (project as any).budget,
      });
    } catch (error) {
      console.error('[ManagerDashboard] Error loading project info:', error);
    }
  };

  const calculateStats = async () => {
    if (!projectId) return;

    try {
      // Get all sites for this project
      const sites = await database.collections
        .get('sites')
        .query(Q.where('project_id', projectId))
        .fetch();

      const totalSites = sites.length;

      // Calculate site schedule status
      const sitesOnSchedule = sites.filter((s: any) => {
        const progress = s.currentProgress || 0;
        const daysElapsed = Math.floor(
          (Date.now() - s.startDate) / (1000 * 60 * 60 * 24)
        );
        const totalDays = Math.floor(
          (s.targetDate - s.startDate) / (1000 * 60 * 60 * 24)
        );
        const expectedProgress = totalDays > 0 ? (daysElapsed / totalDays) * 100 : 0;
        return progress >= expectedProgress - 5; // 5% tolerance
      }).length;

      const sitesDelayed = totalSites - sitesOnSchedule;

      // Calculate overall completion (60% items + 40% milestones)
      const overallCompletion = await calculateHybridProgress();

      // Get site IDs for this project
      const siteIds = sites.map((s) => s.id);

      // Get open hindrances count
      const hindrances = await database.collections
        .get('hindrances')
        .query(Q.where('site_id', Q.oneOf(siteIds)), Q.where('status', 'open'))
        .fetch();

      const openHindrances = hindrances.length;

      // Get critical path items at risk
      const items = await database.collections
        .get('items')
        .query(Q.where('site_id', Q.oneOf(siteIds)))
        .fetch();

      const criticalPathItemsAtRisk = items.filter((item: any) => {
        return (
          item.isCriticalPath &&
          (item.dependencyRisk === 'high' || item.dependencyRisk === 'medium')
        );
      }).length;

      // Get purchase orders for delivery status
      const purchaseOrders = await database.collections
        .get('purchase_orders')
        .query(Q.where('project_id', projectId))
        .fetch();

      const deliveryOnTrack = purchaseOrders.filter((po: any) => {
        if (!po.expectedDeliveryDate) return true;
        if (po.actualDeliveryDate) return true; // Already delivered
        return po.expectedDeliveryDate >= Date.now(); // Not yet overdue
      }).length;

      const deliveryDelayed = purchaseOrders.length - deliveryOnTrack;

      // Get upcoming milestones (next 30 days)
      const thirtyDaysFromNow = Date.now() + 30 * 24 * 60 * 60 * 1000;
      const milestoneProgress = await database.collections
        .get('milestone_progress')
        .query(
          Q.where('project_id', projectId),
          Q.where('status', Q.oneOf(['not_started', 'in_progress']))
        )
        .fetch();

      const upcomingMilestones = milestoneProgress.filter((mp: any) => {
        return (
          mp.plannedEndDate &&
          mp.plannedEndDate <= thirtyDaysFromNow &&
          mp.plannedEndDate >= Date.now()
        );
      }).length;

      // Calculate budget utilization (simplified)
      const budgetUtilization = await calculateBudgetUtilization();

      setStats({
        overallCompletion,
        sitesOnSchedule,
        sitesDelayed,
        totalSites,
        budgetUtilization,
        openHindrances,
        pendingApprovals: 0, // Placeholder for future implementation
        deliveryOnTrack,
        deliveryDelayed,
        criticalPathItemsAtRisk,
        upcomingMilestones,
      });
    } catch (error) {
      console.error('[ManagerDashboard] Error calculating stats:', error);
    }
  };

  // Calculate hybrid progress: 60% weighted items + 40% milestones
  const calculateHybridProgress = async (): Promise<number> => {
    if (!projectId) return 0;

    try {
      // Get all sites for this project first
      const sites = await database.collections
        .get('sites')
        .query(Q.where('project_id', projectId))
        .fetch();

      if (sites.length === 0) return 0;

      const siteIds = sites.map((s) => s.id);

      // Get all items for these sites
      const items = await database.collections
        .get('items')
        .query(Q.where('site_id', Q.oneOf(siteIds)))
        .fetch();

      if (items.length === 0) return 0;

      // Calculate weighted items progress (60%)
      const totalWeightage = items.reduce((sum, item: any) => sum + (item.weightage || 1), 0);
      const weightedProgress = items.reduce((sum, item: any) => {
        const weightage = item.weightage || 1;
        const progress = item.currentProgress || 0;
        return sum + (weightage * progress);
      }, 0);

      const itemsProgress = totalWeightage > 0 ? (weightedProgress / totalWeightage) : 0;

      // Calculate milestones progress (40%)
      const milestones = await database.collections
        .get('milestones')
        .query(Q.where('project_id', projectId), Q.where('is_active', true))
        .fetch();

      if (milestones.length === 0) {
        // If no milestones, use 100% items progress
        return itemsProgress;
      }

      const totalMilestoneWeight = milestones.reduce(
        (sum, m: any) => sum + (m.weightage || 0),
        0
      );

      // Get milestone progress records
      const milestoneProgressRecords = await database.collections
        .get('milestone_progress')
        .query(Q.where('project_id', projectId))
        .fetch();

      // Calculate average milestone progress across all sites
      const milestoneProgressMap = new Map<string, number[]>();

      milestoneProgressRecords.forEach((mp: any) => {
        if (!milestoneProgressMap.has(mp.milestoneId)) {
          milestoneProgressMap.set(mp.milestoneId, []);
        }
        milestoneProgressMap.get(mp.milestoneId)!.push(mp.progressPercentage || 0);
      });

      const weightedMilestoneProgress = milestones.reduce((sum, milestone: any) => {
        const progressArray = milestoneProgressMap.get(milestone.id) || [0];
        const avgProgress =
          progressArray.reduce((a, b) => a + b, 0) / progressArray.length;
        return sum + (milestone.weightage * avgProgress);
      }, 0);

      const milestonesProgress =
        totalMilestoneWeight > 0 ? weightedMilestoneProgress / totalMilestoneWeight : 0;

      // Hybrid calculation: 60% items + 40% milestones
      const hybridProgress = itemsProgress * 0.6 + milestonesProgress * 0.4;

      return Math.round(hybridProgress * 10) / 10; // Round to 1 decimal
    } catch (error) {
      console.error('[ManagerDashboard] Error calculating hybrid progress:', error);
      return 0;
    }
  };

  const calculateBudgetUtilization = async (): Promise<number> => {
    if (!projectId || !projectInfo) return 0;

    try {
      // Get all purchase orders for this project
      const purchaseOrders = await database.collections
        .get('purchase_orders')
        .query(Q.where('project_id', projectId))
        .fetch();

      const totalSpent = purchaseOrders.reduce(
        (sum, po: any) => sum + (po.poValue || 0),
        0
      );

      const utilization = projectInfo.budget > 0 ? (totalSpent / projectInfo.budget) * 100 : 0;
      return Math.round(utilization * 10) / 10; // Round to 1 decimal
    } catch (error) {
      console.error('[ManagerDashboard] Error calculating budget utilization:', error);
      return 0;
    }
  };

  const getHealthStatus = () => {
    if (stats.overallCompletion >= 90) return { label: 'Excellent', color: '#4CAF50' };
    if (stats.overallCompletion >= 70) return { label: 'Good', color: '#8BC34A' };
    if (stats.overallCompletion >= 50) return { label: 'On Track', color: '#FFC107' };
    if (stats.overallCompletion >= 30) return { label: 'At Risk', color: '#FF9800' };
    return { label: 'Delayed', color: '#F44336' };
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const loadEngineeringData = async () => {
    if (!projectId) return;

    try {
      // Get PM200 milestone progress
      const pm200Milestone = await database.collections
        .get('milestones')
        .query(Q.where('project_id', projectId), Q.where('milestone_code', 'PM200'))
        .fetch();

      let pm200Progress = 0;
      let pm200Status = 'not_started';

      if (pm200Milestone.length > 0) {
        const milestoneId = pm200Milestone[0].id;
        const progressRecords = await database.collections
          .get('milestone_progress')
          .query(Q.where('milestone_id', milestoneId))
          .fetch();

        if (progressRecords.length > 0) {
          // Calculate average progress across all sites
          const totalProgress = progressRecords.reduce(
            (sum, record: any) => sum + (record.progressPercentage || 0),
            0
          );
          pm200Progress = totalProgress / progressRecords.length;

          // Determine status
          if (pm200Progress === 0) {
            pm200Status = 'not_started';
          } else if (pm200Progress < 100) {
            pm200Status = 'in_progress';
          } else {
            pm200Status = 'completed';
          }
        }
      }

      // Get DOORS packages data
      const doorsPackages = await database.collections.get('doors_packages').query().fetch();
      const totalDoors = doorsPackages.length;

      let doorsApproved = 0;
      let doorsUnderReview = 0;
      let doorsOpenIssues = 0;

      doorsPackages.forEach((pkg: any) => {
        if (pkg.status === 'approved') {
          doorsApproved++;
        } else if (pkg.status === 'under_review') {
          doorsUnderReview++;
        } else if (pkg.status === 'open_issues') {
          doorsOpenIssues++;
        }
      });

      // Get total requirements count
      const allRequirements = await database.collections
        .get('doors_requirements')
        .query()
        .fetch();
      const totalRequirements = allRequirements.length;
      const compliantRequirements = allRequirements.filter(
        (req: any) => req.complianceStatus === 'compliant'
      ).length;

      // Get RFQ data
      const allRfqs = await database.collections.get('rfqs').query().fetch();
      const totalRfqs = allRfqs.length;

      let rfqsQuotesReceived = 0;
      let rfqsUnderEvaluation = 0;
      let rfqsAwarded = 0;

      allRfqs.forEach((rfq: any) => {
        if (rfq.status === 'quotes_received') {
          rfqsQuotesReceived++;
        } else if (rfq.status === 'evaluated') {
          rfqsUnderEvaluation++;
        } else if (rfq.status === 'awarded') {
          rfqsAwarded++;
        }
      });

      setEngineeringData({
        pm200Progress: Math.round(pm200Progress),
        pm200Status,
        totalDoors,
        doorsApproved,
        doorsUnderReview,
        doorsOpenIssues,
        totalRequirements,
        compliantRequirements,
        totalRfqs,
        rfqsQuotesReceived,
        rfqsUnderEvaluation,
        rfqsAwarded,
      });
    } catch (error) {
      console.error('[ManagerDashboard] Error loading engineering data:', error);
    }
  };

  const loadSitesProgress = async () => {
    if (!projectId) return;

    try {
      // Get all sites for this project
      const sites = await database.collections
        .get('sites')
        .query(Q.where('project_id', projectId))
        .fetch();

      const sitesData: SiteProgressData[] = [];

      for (const site of sites) {
        const siteId = site.id;
        const siteName = (site as any).name;

        // Get supervisor name
        const supervisorId = (site as any).supervisorId;
        let supervisorName = 'Unassigned';
        if (supervisorId) {
          try {
            const supervisor = await database.collections.get('users').find(supervisorId);
            supervisorName = (supervisor as any).fullName || (supervisor as any).username;
          } catch (err) {
            supervisorName = 'Unknown';
          }
        }

        // Calculate items progress (weighted)
        const items = await database.collections
          .get('items')
          .query(Q.where('site_id', siteId))
          .fetch();

        let itemsProgress = 0;
        if (items.length > 0) {
          const totalWeightage = items.reduce((sum, item: any) => sum + (item.weightage || 1), 0);
          const weightedProgress = items.reduce((sum, item: any) => {
            const weightage = item.weightage || 1;
            const progress = item.currentProgress || 0;
            return sum + (weightage * progress);
          }, 0);
          itemsProgress = totalWeightage > 0 ? (weightedProgress / totalWeightage) : 0;
        }

        // Calculate milestones progress for this site
        const milestones = await database.collections
          .get('milestones')
          .query(Q.where('project_id', projectId), Q.where('is_active', true))
          .fetch();

        let milestonesProgress = 0;
        if (milestones.length > 0) {
          const totalMilestoneWeight = milestones.reduce(
            (sum, m: any) => sum + (m.weightage || 0),
            0
          );

          const milestoneProgressRecords = await database.collections
            .get('milestone_progress')
            .query(Q.where('site_id', siteId))
            .fetch();

          const milestoneProgressMap = new Map<string, number>();
          milestoneProgressRecords.forEach((mp: any) => {
            milestoneProgressMap.set(mp.milestoneId, mp.progressPercentage || 0);
          });

          const weightedMilestoneProgress = milestones.reduce((sum, milestone: any) => {
            const progress = milestoneProgressMap.get(milestone.id) || 0;
            return sum + (milestone.weightage * progress);
          }, 0);

          milestonesProgress =
            totalMilestoneWeight > 0 ? weightedMilestoneProgress / totalMilestoneWeight : 0;
        }

        // Hybrid calculation: 60% items + 40% milestones
        const overallProgress = itemsProgress * 0.6 + milestonesProgress * 0.4;

        // Determine status based on schedule
        const siteStartDate = (site as any).startDate;
        const siteTargetDate = (site as any).targetDate;
        const now = Date.now();

        let status: 'on_track' | 'at_risk' | 'delayed' = 'on_track';

        if (siteStartDate && siteTargetDate) {
          const daysElapsed = Math.floor((now - siteStartDate) / (1000 * 60 * 60 * 24));
          const totalDays = Math.floor((siteTargetDate - siteStartDate) / (1000 * 60 * 60 * 24));
          const expectedProgress = totalDays > 0 ? (daysElapsed / totalDays) * 100 : 0;

          if (overallProgress < expectedProgress - 10) {
            status = 'delayed';
          } else if (overallProgress < expectedProgress - 5) {
            status = 'at_risk';
          }
        }

        // Get critical issues count
        const hindrances = await database.collections
          .get('hindrances')
          .query(Q.where('site_id', siteId), Q.where('status', 'open'))
          .fetch();

        const criticalIssues = hindrances.filter(
          (h: any) => h.priority === 'high' || h.priority === 'critical'
        ).length;

        sitesData.push({
          siteId,
          siteName,
          supervisorName,
          overallProgress: Math.round(overallProgress * 10) / 10,
          status,
          criticalIssues,
          itemsProgress: Math.round(itemsProgress),
          milestonesProgress: Math.round(milestonesProgress),
        });
      }

      setSitesProgress(sitesData);
    } catch (error) {
      console.error('[ManagerDashboard] Error loading sites progress:', error);
    }
  };

  const loadEquipmentMaterialsData = async () => {
    if (!projectId) return;

    try {
      // Get PM300 (Procurement) milestone progress
      const pm300Milestone = await database.collections
        .get('milestones')
        .query(Q.where('project_id', projectId), Q.where('milestone_code', 'PM300'))
        .fetch();

      let pm300Progress = 0;
      let pm300Status = 'not_started';

      if (pm300Milestone.length > 0) {
        const milestoneId = pm300Milestone[0].id;
        const progressRecords = await database.collections
          .get('milestone_progress')
          .query(Q.where('milestone_id', milestoneId))
          .fetch();

        if (progressRecords.length > 0) {
          const totalProgress = progressRecords.reduce(
            (sum, record: any) => sum + (record.progressPercentage || 0),
            0
          );
          pm300Progress = totalProgress / progressRecords.length;

          if (pm300Progress === 0) {
            pm300Status = 'not_started';
          } else if (pm300Progress < 100) {
            pm300Status = 'in_progress';
          } else {
            pm300Status = 'completed';
          }
        }
      }

      // Get PM400 (Manufacturing) milestone progress
      const pm400Milestone = await database.collections
        .get('milestones')
        .query(Q.where('project_id', projectId), Q.where('milestone_code', 'PM400'))
        .fetch();

      let pm400Progress = 0;
      let pm400Status = 'not_started';

      if (pm400Milestone.length > 0) {
        const milestoneId = pm400Milestone[0].id;
        const progressRecords = await database.collections
          .get('milestone_progress')
          .query(Q.where('milestone_id', milestoneId))
          .fetch();

        if (progressRecords.length > 0) {
          const totalProgress = progressRecords.reduce(
            (sum, record: any) => sum + (record.progressPercentage || 0),
            0
          );
          pm400Progress = totalProgress / progressRecords.length;

          if (pm400Progress === 0) {
            pm400Status = 'not_started';
          } else if (pm400Progress < 100) {
            pm400Status = 'in_progress';
          } else {
            pm400Status = 'completed';
          }
        }
      }

      // Get Purchase Orders data
      const allPOs = await database.collections
        .get('purchase_orders')
        .query(Q.where('project_id', projectId))
        .fetch();

      const totalPOs = allPOs.length;
      let posDraft = 0;
      let posIssued = 0;
      let posInProgress = 0;
      let posDelivered = 0;
      let posClosed = 0;
      let totalPOValue = 0;

      allPOs.forEach((po: any) => {
        totalPOValue += po.poValue || 0;

        switch (po.status) {
          case 'draft':
            posDraft++;
            break;
          case 'issued':
            posIssued++;
            break;
          case 'in_progress':
            posInProgress++;
            break;
          case 'delivered':
            posDelivered++;
            break;
          case 'closed':
            posClosed++;
            break;
        }
      });

      // Calculate delivery metrics
      const now = Date.now();
      const thirtyDaysFromNow = now + 30 * 24 * 60 * 60 * 1000;

      let upcomingDeliveries = 0;
      let delayedDeliveries = 0;

      allPOs.forEach((po: any) => {
        const expectedDelivery = po.expectedDeliveryDate;
        const actualDelivery = po.actualDeliveryDate;

        // Upcoming deliveries (next 30 days)
        if (expectedDelivery && expectedDelivery >= now && expectedDelivery <= thirtyDaysFromNow) {
          if (!actualDelivery) {
            upcomingDeliveries++;
          }
        }

        // Delayed deliveries
        if (expectedDelivery && expectedDelivery < now && !actualDelivery) {
          delayedDeliveries++;
        }
      });

      setEquipmentData({
        pm300Progress: Math.round(pm300Progress),
        pm300Status,
        pm400Progress: Math.round(pm400Progress),
        pm400Status,
        totalPOs,
        posDraft,
        posIssued,
        posInProgress,
        posDelivered,
        posClosed,
        totalPOValue,
        upcomingDeliveries,
        delayedDeliveries,
      });
    } catch (error) {
      console.error('[ManagerDashboard] Error loading equipment/materials data:', error);
    }
  };

  const loadFinancialData = async () => {
    if (!projectId || !projectInfo) return;

    try {
      // Get project budget from projectInfo
      const projectBudget = projectInfo.budget || 0;
      const contractValue = projectBudget; // Assuming contract value = budget (can be modified)

      // Get all BOMs for the project
      const boms = await database.collections
        .get('boms')
        .query(Q.where('project_id', projectId))
        .fetch();

      const totalBOMs = boms.length;
      let bomsDraft = 0;
      let bomsApproved = 0;
      let bomsLocked = 0;
      let bomTotalCost = 0;

      boms.forEach((bom: any) => {
        if (bom.status === 'draft') {
          bomsDraft++;
        } else if (bom.status === 'approved') {
          bomsApproved++;
        } else if (bom.status === 'locked') {
          bomsLocked++;
        }
        bomTotalCost += bom.totalCost || 0;
      });

      // Get all purchase orders for actual cost
      const allPOs = await database.collections
        .get('purchase_orders')
        .query(Q.where('project_id', projectId))
        .fetch();

      let actualCost = 0;
      allPOs.forEach((po: any) => {
        if (po.status === 'delivered' || po.status === 'closed') {
          actualCost += po.poValue || 0;
        }
      });

      // Calculate budget metrics
      const budgetAllocated = bomTotalCost; // Budget allocated = total BOM cost
      const budgetSpent = actualCost; // Budget spent = delivered/closed POs
      const budgetRemaining = projectBudget - budgetSpent;
      const budgetUtilization = projectBudget > 0 ? (budgetSpent / projectBudget) * 100 : 0;

      // Calculate profitability
      const estimatedCost = bomTotalCost; // Estimated cost = total BOM cost
      const projectedProfit = contractValue - actualCost;
      const profitMargin = contractValue > 0 ? (projectedProfit / contractValue) * 100 : 0;

      // BOM cost variance
      const bomActualCost = actualCost;

      setFinancialData({
        projectBudget,
        budgetAllocated,
        budgetSpent,
        budgetRemaining,
        budgetUtilization: Math.round(budgetUtilization * 10) / 10,
        contractValue,
        estimatedCost,
        actualCost,
        projectedProfit,
        profitMargin: Math.round(profitMargin * 10) / 10,
        totalBOMs,
        bomsDraft,
        bomsApproved,
        bomsLocked,
        bomTotalCost,
        bomActualCost,
      });
    } catch (error) {
      console.error('[ManagerDashboard] Error loading financial data:', error);
    }
  };

  const loadTestingCommissioningData = async () => {
    if (!projectId) return;

    try {
      // Get PM500 (Pre-commissioning) milestone progress
      const pm500Milestone = await database.collections
        .get('milestones')
        .query(Q.where('project_id', projectId), Q.where('milestone_code', 'PM500'))
        .fetch();

      let pm500Progress = 0;
      let pm500Status = 'not_started';

      if (pm500Milestone.length > 0) {
        const milestoneId = pm500Milestone[0].id;
        const progressRecords = await database.collections
          .get('milestone_progress')
          .query(Q.where('milestone_id', milestoneId))
          .fetch();

        if (progressRecords.length > 0) {
          const totalProgress = progressRecords.reduce(
            (sum, record: any) => sum + (record.progressPercentage || 0),
            0
          );
          pm500Progress = totalProgress / progressRecords.length;

          if (pm500Progress === 0) {
            pm500Status = 'not_started';
          } else if (pm500Progress < 100) {
            pm500Status = 'in_progress';
          } else {
            pm500Status = 'completed';
          }
        }
      }

      // Get PM600 (Commissioning) milestone progress
      const pm600Milestone = await database.collections
        .get('milestones')
        .query(Q.where('project_id', projectId), Q.where('milestone_code', 'PM600'))
        .fetch();

      let pm600Progress = 0;
      let pm600Status = 'not_started';

      if (pm600Milestone.length > 0) {
        const milestoneId = pm600Milestone[0].id;
        const progressRecords = await database.collections
          .get('milestone_progress')
          .query(Q.where('milestone_id', milestoneId))
          .fetch();

        if (progressRecords.length > 0) {
          const totalProgress = progressRecords.reduce(
            (sum, record: any) => sum + (record.progressPercentage || 0),
            0
          );
          pm600Progress = totalProgress / progressRecords.length;

          if (pm600Progress === 0) {
            pm600Status = 'not_started';
          } else if (pm600Progress < 100) {
            pm600Status = 'in_progress';
          } else {
            pm600Status = 'completed';
          }
        }
      }

      // Get all sites for this project
      const sites = await database.collections
        .get('sites')
        .query(Q.where('project_id', projectId))
        .fetch();

      const siteIds = sites.map((s) => s.id);

      // Get items data for testing/commissioning phase
      const allItems = await database.collections
        .get('items')
        .query(Q.where('site_id', Q.oneOf(siteIds)))
        .fetch();

      // Count items in pre-commissioning and commissioning phases
      let itemsInPreCommissioning = 0;
      let itemsInCommissioning = 0;

      allItems.forEach((item: any) => {
        const phase = item.phase?.toLowerCase() || '';
        if (phase.includes('pre-commission') || phase.includes('testing')) {
          itemsInPreCommissioning++;
        } else if (phase.includes('commission')) {
          itemsInCommissioning++;
        }
      });

      // Get inspections data
      const allInspections = await database.collections
        .get('site_inspections')
        .query(Q.where('site_id', Q.oneOf(siteIds)))
        .fetch();

      const totalInspections = allInspections.length;
      let inspectionsPassed = 0;
      let inspectionsFailed = 0;

      allInspections.forEach((inspection: any) => {
        if (inspection.status === 'passed' || inspection.status === 'approved') {
          inspectionsPassed++;
        } else if (inspection.status === 'failed') {
          inspectionsFailed++;
        }
      });

      // Calculate tests based on inspections
      const testsCompleted = inspectionsPassed + inspectionsFailed;
      const testsPending = totalInspections - testsCompleted;

      // Calculate systems (simplified - based on items that are commissioned)
      const systemsEnergized = allItems.filter((item: any) => {
        const status = item.status?.toLowerCase() || '';
        return status.includes('energized') || status.includes('powered');
      }).length;

      const systemsOperational = allItems.filter((item: any) => {
        const status = item.status?.toLowerCase() || '';
        return status.includes('operational') || status.includes('commissioned');
      }).length;

      setTestingCommissioningData({
        pm500Progress: Math.round(pm500Progress),
        pm500Status,
        pm600Progress: Math.round(pm600Progress),
        pm600Status,
        itemsInPreCommissioning,
        itemsInCommissioning,
        testsCompleted,
        testsPending,
        systemsEnergized,
        systemsOperational,
        totalInspections,
        inspectionsPassed,
        inspectionsFailed,
      });
    } catch (error) {
      console.error('[ManagerDashboard] Error loading testing/commissioning data:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const renderEngineeringProgress = () => {
    const { pm200Progress, pm200Status, totalDoors, doorsApproved, doorsUnderReview, doorsOpenIssues, totalRequirements, compliantRequirements, totalRfqs, rfqsQuotesReceived, rfqsUnderEvaluation, rfqsAwarded } = engineeringData;

    const compliancePercentage = totalRequirements > 0
      ? Math.round((compliantRequirements / totalRequirements) * 100)
      : 0;

    return (
      <>
        {/* 2.1 Engineering Overview */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Title style={styles.cardTitle}>Engineering Overview (PM200)</Title>
            <View style={styles.engineeringRow}>
              <View style={styles.engineeringMetric}>
                <Title style={styles.metricValue}>{pm200Progress}%</Title>
                <Paragraph style={styles.metricLabel}>Design Completion</Paragraph>
              </View>
              <View style={styles.engineeringMetric}>
                <Chip
                  style={[
                    styles.statusChip,
                    {
                      backgroundColor:
                        pm200Status === 'completed'
                          ? '#4CAF50'
                          : pm200Status === 'in_progress'
                          ? '#2196F3'
                          : '#9E9E9E',
                    },
                  ]}
                  textStyle={{ color: '#fff', fontSize: 12 }}
                >
                  {pm200Status.replace('_', ' ').toUpperCase()}
                </Chip>
                <Paragraph style={styles.metricLabel}>Status</Paragraph>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* 2.2 DOORS Packages */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Title style={styles.cardTitle}>DOORS Packages</Title>
            <View style={styles.doorsRow}>
              <View style={styles.doorsMetric}>
                <Title style={styles.metricValue}>{totalDoors}</Title>
                <Paragraph style={styles.metricLabel}>Total Packages</Paragraph>
              </View>
              <Divider style={styles.verticalDivider} />
              <View style={styles.doorsMetric}>
                <Paragraph style={styles.doorsCount}>✅ {doorsApproved} Approved</Paragraph>
                <Paragraph style={styles.doorsCount}>🔄 {doorsUnderReview} Under Review</Paragraph>
                <Paragraph style={styles.doorsCount}>⚠️ {doorsOpenIssues} Open Issues</Paragraph>
              </View>
            </View>
            <Divider style={styles.divider} />
            <View style={styles.complianceRow}>
              <Paragraph style={styles.complianceLabel}>Requirements Compliance:</Paragraph>
              <Paragraph style={styles.complianceValue}>
                {compliantRequirements}/{totalRequirements} ({compliancePercentage}%)
              </Paragraph>
            </View>
            <ProgressBar
              progress={compliancePercentage / 100}
              color={compliancePercentage >= 80 ? '#4CAF50' : compliancePercentage >= 50 ? '#FFC107' : '#F44336'}
              style={styles.progressBar}
            />
          </Card.Content>
        </Card>

        {/* 2.3 RFQ Status */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Title style={styles.cardTitle}>RFQ Status (Procurement)</Title>
            <View style={styles.rfqRow}>
              <View style={styles.rfqMetric}>
                <Title style={styles.metricValue}>{totalRfqs}</Title>
                <Paragraph style={styles.metricLabel}>Total RFQs</Paragraph>
              </View>
              <Divider style={styles.verticalDivider} />
              <View style={styles.rfqMetric}>
                <Paragraph style={styles.rfqCount}>📨 {rfqsQuotesReceived} Quotes Received</Paragraph>
                <Paragraph style={styles.rfqCount}>⚖️ {rfqsUnderEvaluation} Under Evaluation</Paragraph>
                <Paragraph style={styles.rfqCount}>✅ {rfqsAwarded} Awarded</Paragraph>
              </View>
            </View>
          </Card.Content>
        </Card>
      </>
    );
  };

  const renderSiteProgress = () => {
    if (sitesProgress.length === 0) {
      return (
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Paragraph style={styles.emptyText}>No sites found for this project</Paragraph>
          </Card.Content>
        </Card>
      );
    }

    return (
      <>
        {sitesProgress.map((site) => (
          <Card key={site.siteId} style={styles.siteCard}>
            <Card.Content>
              <View style={styles.siteHeader}>
                <View style={styles.siteHeaderLeft}>
                  <Title style={styles.siteName}>{site.siteName}</Title>
                  <Paragraph style={styles.supervisorText}>
                    👷 {site.supervisorName}
                  </Paragraph>
                </View>
                <Chip
                  style={[
                    styles.siteStatusChip,
                    {
                      backgroundColor:
                        site.status === 'on_track'
                          ? '#4CAF50'
                          : site.status === 'at_risk'
                          ? '#FFC107'
                          : '#F44336',
                    },
                  ]}
                  textStyle={{ color: '#fff', fontSize: 11, fontWeight: 'bold' }}
                >
                  {site.status === 'on_track'
                    ? 'ON TRACK'
                    : site.status === 'at_risk'
                    ? 'AT RISK'
                    : 'DELAYED'}
                </Chip>
              </View>

              <Divider style={styles.divider} />

              {/* Progress Section */}
              <View style={styles.siteProgressSection}>
                <View style={styles.siteProgressLeft}>
                  <Title style={styles.siteProgressValue}>{site.overallProgress}%</Title>
                  <Paragraph style={styles.siteProgressLabel}>Overall Progress</Paragraph>
                  <Paragraph style={styles.siteProgressFormula}>
                    ({site.itemsProgress}% items × 0.6 + {site.milestonesProgress}% milestones × 0.4)
                  </Paragraph>
                </View>

                <View style={styles.siteProgressRight}>
                  <View style={styles.siteMetric}>
                    <Paragraph style={styles.siteMetricValue}>{site.criticalIssues}</Paragraph>
                    <Paragraph style={styles.siteMetricLabel}>Critical Issues</Paragraph>
                  </View>
                </View>
              </View>

              {/* Progress Bar */}
              <ProgressBar
                progress={site.overallProgress / 100}
                color={
                  site.status === 'on_track'
                    ? '#4CAF50'
                    : site.status === 'at_risk'
                    ? '#FFC107'
                    : '#F44336'
                }
                style={styles.progressBar}
              />
            </Card.Content>
          </Card>
        ))}
      </>
    );
  };

  const renderEquipmentMaterials = () => {
    const {
      pm300Progress,
      pm300Status,
      pm400Progress,
      pm400Status,
      totalPOs,
      posDraft,
      posIssued,
      posInProgress,
      posDelivered,
      posClosed,
      totalPOValue,
      upcomingDeliveries,
      delayedDeliveries,
    } = equipmentData;

    return (
      <>
        {/* 4.1 Procurement Pipeline (PM300 & PM400) */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Title style={styles.cardTitle}>Procurement & Manufacturing Pipeline</Title>
            <View style={styles.pipelineRow}>
              {/* PM300 */}
              <View style={styles.pipelineItem}>
                <Paragraph style={styles.pipelineLabel}>Procurement (PM300)</Paragraph>
                <Title style={styles.pipelineValue}>{pm300Progress}%</Title>
                <Chip
                  style={[
                    styles.statusChip,
                    {
                      backgroundColor:
                        pm300Status === 'completed'
                          ? '#4CAF50'
                          : pm300Status === 'in_progress'
                          ? '#2196F3'
                          : '#9E9E9E',
                    },
                  ]}
                  textStyle={{ color: '#fff', fontSize: 11 }}
                >
                  {pm300Status.replace('_', ' ').toUpperCase()}
                </Chip>
              </View>

              <Divider style={styles.verticalDivider} />

              {/* PM400 */}
              <View style={styles.pipelineItem}>
                <Paragraph style={styles.pipelineLabel}>Manufacturing (PM400)</Paragraph>
                <Title style={styles.pipelineValue}>{pm400Progress}%</Title>
                <Chip
                  style={[
                    styles.statusChip,
                    {
                      backgroundColor:
                        pm400Status === 'completed'
                          ? '#4CAF50'
                          : pm400Status === 'in_progress'
                          ? '#2196F3'
                          : '#9E9E9E',
                    },
                  ]}
                  textStyle={{ color: '#fff', fontSize: 11 }}
                >
                  {pm400Status.replace('_', ' ').toUpperCase()}
                </Chip>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* 4.2 Purchase Orders Summary */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Title style={styles.cardTitle}>Purchase Orders</Title>
            <View style={styles.poSummaryRow}>
              <View style={styles.poSummaryLeft}>
                <Title style={styles.poTotalValue}>{formatCurrency(totalPOValue)}</Title>
                <Paragraph style={styles.poTotalLabel}>Total PO Value</Paragraph>
                <Paragraph style={styles.poCount}>{totalPOs} Purchase Orders</Paragraph>
              </View>
              <Divider style={styles.verticalDivider} />
              <View style={styles.poSummaryRight}>
                <Paragraph style={styles.poStatusItem}>📝 {posDraft} Draft</Paragraph>
                <Paragraph style={styles.poStatusItem}>📤 {posIssued} Issued</Paragraph>
                <Paragraph style={styles.poStatusItem}>⏳ {posInProgress} In Progress</Paragraph>
                <Paragraph style={styles.poStatusItem}>📦 {posDelivered} Delivered</Paragraph>
                <Paragraph style={styles.poStatusItem}>✅ {posClosed} Closed</Paragraph>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* 4.3 Delivery Schedule */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Title style={styles.cardTitle}>Delivery Schedule</Title>
            <View style={styles.deliveryRow}>
              <View style={styles.deliveryMetric}>
                <Title style={styles.deliveryValue}>{upcomingDeliveries}</Title>
                <Paragraph style={styles.deliveryLabel}>Upcoming (30 days)</Paragraph>
              </View>
              <Divider style={styles.verticalDivider} />
              <View style={styles.deliveryMetric}>
                <Title style={[styles.deliveryValue, { color: delayedDeliveries > 0 ? '#F44336' : '#666' }]}>
                  {delayedDeliveries}
                </Title>
                <Paragraph style={styles.deliveryLabel}>Delayed Deliveries</Paragraph>
              </View>
            </View>
            {delayedDeliveries > 0 && (
              <Paragraph style={styles.warningText}>
                ⚠️ {delayedDeliveries} deliveries are past their expected date
              </Paragraph>
            )}
          </Card.Content>
        </Card>
      </>
    );
  };

  const renderFinancialSummary = () => {
    const {
      projectBudget,
      budgetAllocated,
      budgetSpent,
      budgetRemaining,
      budgetUtilization,
      contractValue,
      estimatedCost,
      actualCost,
      projectedProfit,
      profitMargin,
      totalBOMs,
      bomsDraft,
      bomsApproved,
      bomsLocked,
      bomTotalCost,
      bomActualCost,
    } = financialData;

    const bomCostVariance = bomTotalCost - bomActualCost;
    const bomVariancePercent =
      bomTotalCost > 0 ? ((bomCostVariance / bomTotalCost) * 100) : 0;

    return (
      <>
        {/* 5.1 Budget Overview */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Title style={styles.cardTitle}>Budget Overview</Title>
            <View style={styles.budgetRow}>
              <View style={styles.budgetMetric}>
                <Title style={styles.budgetValue}>{formatCurrency(projectBudget)}</Title>
                <Paragraph style={styles.budgetLabel}>Total Budget</Paragraph>
              </View>
              <Divider style={styles.verticalDivider} />
              <View style={styles.budgetMetric}>
                <Paragraph style={styles.budgetItem}>
                  Allocated: {formatCurrency(budgetAllocated)}
                </Paragraph>
                <Paragraph style={styles.budgetItem}>
                  Spent: {formatCurrency(budgetSpent)}
                </Paragraph>
                <Paragraph style={styles.budgetItem}>
                  Remaining: {formatCurrency(budgetRemaining)}
                </Paragraph>
              </View>
            </View>
            <Divider style={styles.divider} />
            <View style={styles.utilizationRow}>
              <Paragraph style={styles.utilizationLabel}>Budget Utilization:</Paragraph>
              <Paragraph
                style={[
                  styles.utilizationValue,
                  { color: budgetUtilization > 100 ? '#F44336' : '#4CAF50' },
                ]}
              >
                {budgetUtilization}%
              </Paragraph>
            </View>
            <ProgressBar
              progress={Math.min(budgetUtilization / 100, 1)}
              color={budgetUtilization > 100 ? '#F44336' : budgetUtilization > 90 ? '#FFC107' : '#4CAF50'}
              style={styles.progressBar}
            />
          </Card.Content>
        </Card>

        {/* 5.2 Profitability */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Title style={styles.cardTitle}>Profitability</Title>
            <View style={styles.profitRow}>
              <View style={styles.profitLeft}>
                <Paragraph style={styles.profitLabel}>Contract Value:</Paragraph>
                <Title style={styles.profitValue}>{formatCurrency(contractValue)}</Title>
              </View>
              <View style={styles.profitRight}>
                <Paragraph style={styles.profitItem}>
                  Estimated Cost: {formatCurrency(estimatedCost)}
                </Paragraph>
                <Paragraph style={styles.profitItem}>
                  Actual Cost: {formatCurrency(actualCost)}
                </Paragraph>
              </View>
            </View>
            <Divider style={styles.divider} />
            <View style={styles.marginRow}>
              <View style={styles.marginMetric}>
                <Title style={[styles.marginValue, { color: projectedProfit >= 0 ? '#4CAF50' : '#F44336' }]}>
                  {formatCurrency(projectedProfit)}
                </Title>
                <Paragraph style={styles.marginLabel}>Projected Profit/Loss</Paragraph>
              </View>
              <Divider style={styles.verticalDivider} />
              <View style={styles.marginMetric}>
                <Title style={[styles.marginValue, { color: profitMargin >= 0 ? '#4CAF50' : '#F44336' }]}>
                  {profitMargin}%
                </Title>
                <Paragraph style={styles.marginLabel}>Profit Margin</Paragraph>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* 5.3 BOM Summary */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Title style={styles.cardTitle}>BOM Summary</Title>
            <View style={styles.bomRow}>
              <View style={styles.bomLeft}>
                <Title style={styles.bomTotal}>{totalBOMs}</Title>
                <Paragraph style={styles.bomLabel}>Total BOMs</Paragraph>
                <Paragraph style={styles.bomStatus}>
                  📝 {bomsDraft} Draft | ✅ {bomsApproved} Approved | 🔒 {bomsLocked} Locked
                </Paragraph>
              </View>
              <Divider style={styles.verticalDivider} />
              <View style={styles.bomRight}>
                <Paragraph style={styles.bomCostLabel}>BOM Total Cost:</Paragraph>
                <Title style={styles.bomCostValue}>{formatCurrency(bomTotalCost)}</Title>
                <Paragraph style={styles.bomCostLabel}>Actual Cost:</Paragraph>
                <Paragraph style={styles.bomActual}>{formatCurrency(bomActualCost)}</Paragraph>
              </View>
            </View>
            <Divider style={styles.divider} />
            <View style={styles.varianceRow}>
              <Paragraph style={styles.varianceLabel}>Cost Variance:</Paragraph>
              <Paragraph
                style={[
                  styles.varianceValue,
                  { color: bomCostVariance >= 0 ? '#4CAF50' : '#F44336' },
                ]}
              >
                {formatCurrency(Math.abs(bomCostVariance))} ({bomCostVariance >= 0 ? '+' : '-'}
                {Math.abs(Math.round(bomVariancePercent * 10) / 10)}%)
              </Paragraph>
            </View>
          </Card.Content>
        </Card>
      </>
    );
  };

  const renderTestingCommissioning = () => {
    const {
      pm500Progress,
      pm500Status,
      pm600Progress,
      pm600Status,
      itemsInPreCommissioning,
      itemsInCommissioning,
      testsCompleted,
      testsPending,
      systemsEnergized,
      systemsOperational,
      totalInspections,
      inspectionsPassed,
      inspectionsFailed,
    } = testingCommissioningData;

    const passRate = totalInspections > 0 ? Math.round((inspectionsPassed / totalInspections) * 100) : 0;

    return (
      <>
        {/* 6.1 Pre-commissioning (PM500) & Commissioning (PM600) */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Title style={styles.cardTitle}>Pre-commissioning & Commissioning Overview</Title>
            <View style={styles.testingRow}>
              {/* PM500 */}
              <View style={styles.testingItem}>
                <Paragraph style={styles.testingLabel}>Pre-commissioning (PM500)</Paragraph>
                <Title style={styles.testingValue}>{pm500Progress}%</Title>
                <Chip
                  style={[
                    styles.statusChip,
                    {
                      backgroundColor:
                        pm500Status === 'completed'
                          ? '#4CAF50'
                          : pm500Status === 'in_progress'
                          ? '#2196F3'
                          : '#9E9E9E',
                    },
                  ]}
                  textStyle={{ color: '#fff', fontSize: 11 }}
                >
                  {pm500Status.replace('_', ' ').toUpperCase()}
                </Chip>
                <Paragraph style={styles.testingCount}>
                  {itemsInPreCommissioning} Items in Phase
                </Paragraph>
              </View>

              <Divider style={styles.verticalDivider} />

              {/* PM600 */}
              <View style={styles.testingItem}>
                <Paragraph style={styles.testingLabel}>Commissioning (PM600)</Paragraph>
                <Title style={styles.testingValue}>{pm600Progress}%</Title>
                <Chip
                  style={[
                    styles.statusChip,
                    {
                      backgroundColor:
                        pm600Status === 'completed'
                          ? '#4CAF50'
                          : pm600Status === 'in_progress'
                          ? '#2196F3'
                          : '#9E9E9E',
                    },
                  ]}
                  textStyle={{ color: '#fff', fontSize: 11 }}
                >
                  {pm600Status.replace('_', ' ').toUpperCase()}
                </Chip>
                <Paragraph style={styles.testingCount}>
                  {itemsInCommissioning} Items in Phase
                </Paragraph>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* 6.2 Testing & Systems Status */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Title style={styles.cardTitle}>Testing & Systems Status</Title>
            <View style={styles.systemsRow}>
              <View style={styles.systemsLeft}>
                <Paragraph style={styles.systemsLabel}>Tests Progress:</Paragraph>
                <Paragraph style={styles.systemsItem}>
                  ✅ {testsCompleted} Completed
                </Paragraph>
                <Paragraph style={styles.systemsItem}>
                  ⏳ {testsPending} Pending
                </Paragraph>
              </View>
              <Divider style={styles.verticalDivider} />
              <View style={styles.systemsRight}>
                <Paragraph style={styles.systemsLabel}>Systems Status:</Paragraph>
                <Paragraph style={styles.systemsItem}>
                  ⚡ {systemsEnergized} Energized
                </Paragraph>
                <Paragraph style={styles.systemsItem}>
                  ✅ {systemsOperational} Operational
                </Paragraph>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* 6.3 Quality Inspections */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Title style={styles.cardTitle}>Quality Inspections</Title>
            <View style={styles.inspectionRow}>
              <View style={styles.inspectionLeft}>
                <Title style={styles.inspectionTotal}>{totalInspections}</Title>
                <Paragraph style={styles.inspectionLabel}>Total Inspections</Paragraph>
              </View>
              <Divider style={styles.verticalDivider} />
              <View style={styles.inspectionRight}>
                <Paragraph style={styles.inspectionItem}>
                  ✅ {inspectionsPassed} Passed
                </Paragraph>
                <Paragraph style={styles.inspectionItem}>
                  ❌ {inspectionsFailed} Failed
                </Paragraph>
              </View>
            </View>
            <Divider style={styles.divider} />
            <View style={styles.passRateRow}>
              <Paragraph style={styles.passRateLabel}>Pass Rate:</Paragraph>
              <Paragraph
                style={[
                  styles.passRateValue,
                  { color: passRate >= 90 ? '#4CAF50' : passRate >= 70 ? '#FFC107' : '#F44336' },
                ]}
              >
                {passRate}%
              </Paragraph>
            </View>
            <ProgressBar
              progress={passRate / 100}
              color={passRate >= 90 ? '#4CAF50' : passRate >= 70 ? '#FFC107' : '#F44336'}
              style={styles.progressBar}
            />
            {inspectionsFailed > 0 && (
              <Paragraph style={styles.warningText}>
                ⚠️ {inspectionsFailed} inspections require rework
              </Paragraph>
            )}
          </Card.Content>
        </Card>
      </>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Paragraph style={styles.loadingText}>Loading dashboard...</Paragraph>
      </View>
    );
  }

  if (!projectId || !projectInfo) {
    return (
      <View style={styles.emptyContainer}>
        <Paragraph style={styles.emptyText}>No project assigned</Paragraph>
        <Paragraph style={styles.emptySubtext}>
          Please contact your administrator to assign a project.
        </Paragraph>
      </View>
    );
  }

  const health = getHealthStatus();

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Project Header */}
      <Card style={styles.headerCard}>
        <Card.Content>
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <Title style={styles.projectTitle}>{projectInfo.name}</Title>
              <Paragraph style={styles.projectClient}>Client: {projectInfo.client}</Paragraph>
              <Paragraph style={styles.projectDates}>
                {formatDate(projectInfo.startDate)} - {formatDate(projectInfo.endDate)}
              </Paragraph>
            </View>
            <Chip
              style={[styles.healthChip, { backgroundColor: health.color }]}
              textStyle={styles.healthChipText}
            >
              {health.label}
            </Chip>
          </View>
          <Divider style={styles.divider} />
          <View style={styles.progressSection}>
            <Paragraph style={styles.progressLabel}>Overall Progress</Paragraph>
            <Title style={styles.progressValue}>{stats.overallCompletion.toFixed(1)}%</Title>
            <ProgressBar
              progress={stats.overallCompletion / 100}
              color={health.color}
              style={styles.progressBar}
            />
            <Paragraph style={styles.progressSubtext}>
              Hybrid Calculation: 60% Items + 40% Milestones
            </Paragraph>
          </View>
        </Card.Content>
      </Card>

      {/* KPI Cards Grid */}
      <View style={styles.kpiGrid}>
        {/* Row 1 */}
        <View style={styles.kpiRow}>
          {/* KPI 1: Sites Status */}
          <Card style={styles.kpiCard}>
            <Card.Content>
              <Paragraph style={styles.kpiLabel}>Sites Status</Paragraph>
              <Title style={styles.kpiValue}>
                {stats.sitesOnSchedule}/{stats.totalSites}
              </Title>
              <Paragraph style={styles.kpiSubtext}>
                {stats.sitesDelayed > 0 ? `${stats.sitesDelayed} delayed` : 'All on schedule'}
              </Paragraph>
              <View style={styles.kpiIndicator}>
                <View
                  style={[
                    styles.kpiDot,
                    {
                      backgroundColor:
                        stats.sitesDelayed === 0
                          ? '#4CAF50'
                          : stats.sitesDelayed <= 2
                          ? '#FFC107'
                          : '#F44336',
                    },
                  ]}
                />
              </View>
            </Card.Content>
          </Card>

          {/* KPI 2: Budget Utilization */}
          <Card style={styles.kpiCard}>
            <Card.Content>
              <Paragraph style={styles.kpiLabel}>Budget Used</Paragraph>
              <Title style={styles.kpiValue}>{stats.budgetUtilization.toFixed(1)}%</Title>
              <Paragraph style={styles.kpiSubtext}>
                of {formatCurrency(projectInfo.budget)}
              </Paragraph>
              <View style={styles.kpiIndicator}>
                <View
                  style={[
                    styles.kpiDot,
                    {
                      backgroundColor:
                        stats.budgetUtilization <= 100
                          ? '#4CAF50'
                          : stats.budgetUtilization <= 110
                          ? '#FFC107'
                          : '#F44336',
                    },
                  ]}
                />
              </View>
            </Card.Content>
          </Card>
        </View>

        {/* Row 2 */}
        <View style={styles.kpiRow}>
          {/* KPI 3: Open Hindrances */}
          <Card style={styles.kpiCard}>
            <Card.Content>
              <Paragraph style={styles.kpiLabel}>Open Issues</Paragraph>
              <Title style={styles.kpiValue}>{stats.openHindrances}</Title>
              <Paragraph style={styles.kpiSubtext}>
                {stats.openHindrances === 0 ? 'No open issues' : 'Requires attention'}
              </Paragraph>
              <View style={styles.kpiIndicator}>
                <View
                  style={[
                    styles.kpiDot,
                    {
                      backgroundColor:
                        stats.openHindrances === 0
                          ? '#4CAF50'
                          : stats.openHindrances <= 5
                          ? '#FFC107'
                          : '#F44336',
                    },
                  ]}
                />
              </View>
            </Card.Content>
          </Card>

          {/* KPI 4: Critical Path Risk */}
          <Card style={styles.kpiCard}>
            <Card.Content>
              <Paragraph style={styles.kpiLabel}>Critical Path</Paragraph>
              <Title style={styles.kpiValue}>{stats.criticalPathItemsAtRisk}</Title>
              <Paragraph style={styles.kpiSubtext}>
                {stats.criticalPathItemsAtRisk === 0 ? 'No risks' : 'Items at risk'}
              </Paragraph>
              <View style={styles.kpiIndicator}>
                <View
                  style={[
                    styles.kpiDot,
                    {
                      backgroundColor:
                        stats.criticalPathItemsAtRisk === 0
                          ? '#4CAF50'
                          : stats.criticalPathItemsAtRisk <= 3
                          ? '#FFC107'
                          : '#F44336',
                    },
                  ]}
                />
              </View>
            </Card.Content>
          </Card>
        </View>

        {/* Row 3 */}
        <View style={styles.kpiRow}>
          {/* KPI 5: Delivery Status */}
          <Card style={styles.kpiCard}>
            <Card.Content>
              <Paragraph style={styles.kpiLabel}>Deliveries</Paragraph>
              <Title style={styles.kpiValue}>
                {stats.deliveryOnTrack}/{stats.deliveryOnTrack + stats.deliveryDelayed}
              </Title>
              <Paragraph style={styles.kpiSubtext}>
                {stats.deliveryDelayed > 0 ? `${stats.deliveryDelayed} delayed` : 'On track'}
              </Paragraph>
              <View style={styles.kpiIndicator}>
                <View
                  style={[
                    styles.kpiDot,
                    {
                      backgroundColor:
                        stats.deliveryDelayed === 0
                          ? '#4CAF50'
                          : stats.deliveryDelayed <= 2
                          ? '#FFC107'
                          : '#F44336',
                    },
                  ]}
                />
              </View>
            </Card.Content>
          </Card>

          {/* KPI 6: Upcoming Milestones */}
          <Card style={styles.kpiCard}>
            <Card.Content>
              <Paragraph style={styles.kpiLabel}>Next 30 Days</Paragraph>
              <Title style={styles.kpiValue}>{stats.upcomingMilestones}</Title>
              <Paragraph style={styles.kpiSubtext}>
                {stats.upcomingMilestones === 0 ? 'No milestones' : 'Milestones due'}
              </Paragraph>
              <View style={styles.kpiIndicator}>
                <View
                  style={[
                    styles.kpiDot,
                    { backgroundColor: stats.upcomingMilestones > 0 ? '#2196F3' : '#9E9E9E' },
                  ]}
                />
              </View>
            </Card.Content>
          </Card>
        </View>

        {/* Row 4 - Placeholder for future */}
        <View style={styles.kpiRow}>
          {/* KPI 7: Pending Approvals (Future) */}
          <Card style={styles.kpiCard}>
            <Card.Content>
              <Paragraph style={styles.kpiLabel}>Pending Approvals</Paragraph>
              <Title style={styles.kpiValue}>{stats.pendingApprovals}</Title>
              <Paragraph style={styles.kpiSubtext}>Coming soon</Paragraph>
              <View style={styles.kpiIndicator}>
                <View style={[styles.kpiDot, { backgroundColor: '#9E9E9E' }]} />
              </View>
            </Card.Content>
          </Card>

          {/* KPI 8: Placeholder */}
          <Card style={styles.kpiCard}>
            <Card.Content>
              <Paragraph style={styles.kpiLabel}>Team Efficiency</Paragraph>
              <Title style={styles.kpiValue}>-</Title>
              <Paragraph style={styles.kpiSubtext}>Coming soon</Paragraph>
              <View style={styles.kpiIndicator}>
                <View style={[styles.kpiDot, { backgroundColor: '#9E9E9E' }]} />
              </View>
            </Card.Content>
          </Card>
        </View>
      </View>

      {/* Section 2: Engineering Progress */}
      <View style={styles.section}>
        <Title style={styles.sectionTitle}>Engineering Progress</Title>
        <Paragraph style={styles.sectionSubtitle}>PM200 Milestone + DOORS + RFQ Status</Paragraph>

        {renderEngineeringProgress()}
      </View>

      {/* Section 3: Site Progress */}
      <View style={styles.section}>
        <Title style={styles.sectionTitle}>Site Progress Comparison</Title>
        <Paragraph style={styles.sectionSubtitle}>
          All Sites - Hybrid Tracking (60% Items + 40% Milestones)
        </Paragraph>

        {renderSiteProgress()}
      </View>

      {/* Section 4: Equipment/Materials Status */}
      <View style={styles.section}>
        <Title style={styles.sectionTitle}>Equipment & Materials Status</Title>
        <Paragraph style={styles.sectionSubtitle}>
          Procurement (PM300) + Manufacturing (PM400) + Purchase Orders
        </Paragraph>

        {renderEquipmentMaterials()}
      </View>

      {/* Section 5: Financial Summary */}
      <View style={styles.section}>
        <Title style={styles.sectionTitle}>Financial Summary</Title>
        <Paragraph style={styles.sectionSubtitle}>
          Budget Overview + Profitability + BOM Summary
        </Paragraph>

        {renderFinancialSummary()}
      </View>

      {/* Section 6: Testing & Commissioning */}
      <View style={styles.section}>
        <Title style={styles.sectionTitle}>Testing & Commissioning</Title>
        <Paragraph style={styles.sectionSubtitle}>
          Pre-commissioning (PM500) + Commissioning (PM600) + Quality Inspections
        </Paragraph>

        {renderTestingCommissioning()}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#f5f5f5',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#666',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  headerCard: {
    margin: 15,
    marginBottom: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flex: 1,
  },
  projectTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  projectClient: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  projectDates: {
    fontSize: 12,
    color: '#999',
  },
  healthChip: {
    marginLeft: 10,
  },
  healthChipText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  divider: {
    marginVertical: 15,
  },
  progressSection: {
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  progressValue: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  progressBar: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    marginBottom: 5,
  },
  progressSubtext: {
    fontSize: 11,
    color: '#999',
    fontStyle: 'italic',
  },
  kpiGrid: {
    padding: 10,
  },
  kpiRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  kpiCard: {
    flex: 1,
    marginHorizontal: 5,
    minHeight: 120,
  },
  kpiLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  kpiValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  kpiSubtext: {
    fontSize: 11,
    color: '#999',
  },
  kpiIndicator: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  kpiDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  // Section 2: Engineering Progress styles
  section: {
    padding: 15,
    paddingTop: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#999',
    marginBottom: 15,
  },
  sectionCard: {
    marginBottom: 15,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  engineeringRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  engineeringMetric: {
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  statusChip: {
    marginVertical: 5,
  },
  doorsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  doorsMetric: {
    flex: 1,
  },
  doorsCount: {
    fontSize: 14,
    marginVertical: 3,
  },
  verticalDivider: {
    width: 1,
    height: 60,
    marginHorizontal: 15,
  },
  complianceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 5,
  },
  complianceLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  complianceValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  rfqRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rfqMetric: {
    flex: 1,
  },
  rfqCount: {
    fontSize: 14,
    marginVertical: 3,
  },
  // Section 3: Site Progress styles
  siteCard: {
    marginBottom: 15,
  },
  siteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  siteHeaderLeft: {
    flex: 1,
  },
  siteName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  supervisorText: {
    fontSize: 13,
    color: '#666',
  },
  siteStatusChip: {
    marginLeft: 10,
  },
  siteProgressSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  siteProgressLeft: {
    flex: 1,
  },
  siteProgressValue: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  siteProgressLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 3,
  },
  siteProgressFormula: {
    fontSize: 10,
    color: '#999',
    fontStyle: 'italic',
  },
  siteProgressRight: {
    alignItems: 'center',
    marginLeft: 20,
  },
  siteMetric: {
    alignItems: 'center',
  },
  siteMetricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F44336',
  },
  siteMetricLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 3,
  },
  // Section 4: Equipment/Materials styles
  pipelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pipelineItem: {
    flex: 1,
    alignItems: 'center',
  },
  pipelineLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
    textAlign: 'center',
  },
  pipelineValue: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  poSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  poSummaryLeft: {
    flex: 1,
    alignItems: 'center',
  },
  poTotalValue: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 5,
  },
  poTotalLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  poCount: {
    fontSize: 13,
    color: '#999',
  },
  poSummaryRight: {
    flex: 1,
  },
  poStatusItem: {
    fontSize: 14,
    marginVertical: 3,
  },
  deliveryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  deliveryMetric: {
    alignItems: 'center',
  },
  deliveryValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 5,
  },
  deliveryLabel: {
    fontSize: 12,
    color: '#666',
  },
  warningText: {
    marginTop: 15,
    fontSize: 13,
    color: '#F44336',
    fontWeight: '500',
  },
  // Section 5: Financial Summary styles
  budgetRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  budgetMetric: {
    flex: 1,
    alignItems: 'center',
  },
  budgetValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 5,
  },
  budgetLabel: {
    fontSize: 12,
    color: '#666',
  },
  budgetItem: {
    fontSize: 14,
    marginVertical: 3,
  },
  utilizationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 5,
  },
  utilizationLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  utilizationValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  profitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  profitLeft: {
    flex: 1,
    alignItems: 'center',
  },
  profitLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  profitValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  profitRight: {
    flex: 1,
  },
  profitItem: {
    fontSize: 13,
    marginVertical: 3,
  },
  marginRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: 10,
  },
  marginMetric: {
    alignItems: 'center',
  },
  marginValue: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  marginLabel: {
    fontSize: 12,
    color: '#666',
  },
  bomRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bomLeft: {
    flex: 1,
    alignItems: 'center',
  },
  bomTotal: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  bomLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  bomStatus: {
    fontSize: 12,
    color: '#999',
  },
  bomRight: {
    flex: 1,
  },
  bomCostLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  bomCostValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 10,
  },
  bomActual: {
    fontSize: 14,
    fontWeight: '500',
  },
  varianceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  varianceLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  varianceValue: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  // Section 6: Testing & Commissioning styles
  testingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  testingItem: {
    flex: 1,
    alignItems: 'center',
  },
  testingLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
    textAlign: 'center',
  },
  testingValue: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  testingCount: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
  },
  systemsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  systemsLeft: {
    flex: 1,
  },
  systemsRight: {
    flex: 1,
  },
  systemsLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    marginBottom: 8,
  },
  systemsItem: {
    fontSize: 14,
    marginVertical: 3,
  },
  inspectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inspectionLeft: {
    flex: 1,
    alignItems: 'center',
  },
  inspectionRight: {
    flex: 1,
  },
  inspectionTotal: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  inspectionLabel: {
    fontSize: 12,
    color: '#666',
  },
  inspectionItem: {
    fontSize: 14,
    marginVertical: 3,
  },
  passRateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 5,
  },
  passRateLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  passRateValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ManagerDashboardScreen;
