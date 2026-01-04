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
  Divider,
  ProgressBar,
  Menu,
  Button,
} from 'react-native-paper';
import { database } from '../../models/database';
import { useManagerContext } from './context/ManagerContext';
import { Q } from '@nozbe/watermelondb';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { logger } from '../services/LoggingService';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import {
  EngineeringSection,
  SiteProgressSection,
  EquipmentMaterialsSection,
  FinancialSection,
  TestingCommissioningSection,
  HandoverSection,
} from './dashboard/components';
import { formatCurrency } from './dashboard/utils/dashboardFormatters';
import { DashboardSkeleton } from './shared';

type RootStackParamList = {
  Auth: undefined;
  Admin: undefined;
  Supervisor: undefined;
  Manager: undefined;
  Planning: undefined;
  Logistics: undefined;
  DesignEngineer: undefined;
  CommercialManager: undefined;
};

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
  activeSupervisors: number;
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

interface HandoverData {
  pm700Progress: number;
  pm700Status: string;
  sitesReadyForHandover: number;
  sitesHandedOver: number;
  totalSites: number;
  documentationComplete: number;
  documentationPending: number;
  documentationPercentage: number;
  totalPunchItems: number;
  punchItemsClosed: number;
  punchItemsOpen: number;
  punchItemsCritical: number;
  punchListCompletion: number;
}

const ManagerDashboardScreen = () => {
  const { projectId } = useManagerContext();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
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
    activeSupervisors: 0,
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
  const [handoverData, setHandoverData] = useState<HandoverData>({
    pm700Progress: 0,
    pm700Status: 'not_started',
    sitesReadyForHandover: 0,
    sitesHandedOver: 0,
    totalSites: 0,
    documentationComplete: 0,
    documentationPending: 0,
    documentationPercentage: 0,
    totalPunchItems: 0,
    punchItemsClosed: 0,
    punchItemsOpen: 0,
    punchItemsCritical: 0,
    punchListCompletion: 0,
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
        loadHandoverData(),
      ]);
    } catch (error) {
      logger.error('[ManagerDashboard] Error loading data', error as Error);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  useEffect(() => {
    if (projectId) {
      loadDashboardData();
    } else {
      // No project assigned, stop loading
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

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
      logger.error('[ManagerDashboard] Error loading project info', error as Error);
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
      // Note: Simplified calculation - sites are on schedule if target date is in future
      // For more accurate calculation, we would need to calculate hybrid progress for each site
      const now = Date.now();
      const sitesOnSchedule = sites.filter((s: any) => {
        return s.targetDate && s.targetDate >= now;
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

      // Calculate active supervisors (supervisors assigned to sites in this project)
      const supervisorRoles = await database.collections
        .get('roles')
        .query(Q.where('name', 'Supervisor'))
        .fetch();

      let activeSupervisors = 0;
      if (supervisorRoles.length > 0) {
        const supervisors = await database.collections
          .get('users')
          .query(
            Q.where('project_id', projectId),
            Q.where('role_id', supervisorRoles[0].id)
          )
          .fetch();
        activeSupervisors = supervisors.length;
      }

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
        activeSupervisors,
      });
    } catch (error) {
      logger.error('[ManagerDashboard] Error calculating stats', error as Error);
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
        const progress = item.getProgressPercentage ? item.getProgressPercentage() : 0;
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
      logger.error('[ManagerDashboard] Error calculating hybrid progress', error as Error);
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
      logger.error('[ManagerDashboard] Error calculating budget utilization', error as Error);
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

  const handleRoleSwitch = (role: keyof RootStackParamList) => {
    setMenuVisible(false);
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: role }],
      })
    );
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
      logger.error('[ManagerDashboard] Error loading engineering data', error as Error);
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
            const progress = item.getProgressPercentage ? item.getProgressPercentage() : 0;
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
      logger.error('[ManagerDashboard] Error loading sites progress', error as Error);
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
      logger.error('[ManagerDashboard] Error loading equipment/materials data', error as Error);
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
      logger.error('[ManagerDashboard] Error loading financial data', error as Error);
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
      logger.error('[ManagerDashboard] Error loading testing/commissioning data', error as Error);
    }
  };

  const loadHandoverData = async () => {
    if (!projectId) return;

    try {
      // Get PM700 (Handover) milestone progress
      const pm700Milestone = await database.collections
        .get('milestones')
        .query(Q.where('project_id', projectId), Q.where('milestone_code', 'PM700'))
        .fetch();

      let pm700Progress = 0;
      let pm700Status = 'not_started';

      if (pm700Milestone.length > 0) {
        const milestoneId = pm700Milestone[0].id;
        const progressRecords = await database.collections
          .get('milestone_progress')
          .query(Q.where('milestone_id', milestoneId))
          .fetch();

        if (progressRecords.length > 0) {
          const totalProgress = progressRecords.reduce(
            (sum, record: any) => sum + (record.progressPercentage || 0),
            0
          );
          pm700Progress = totalProgress / progressRecords.length;

          if (pm700Progress === 0) {
            pm700Status = 'not_started';
            } else if (pm700Progress < 100) {
            pm700Status = 'in_progress';
          } else {
            pm700Status = 'completed';
          }
        }
      }

      // Get all sites for this project
      const sites = await database.collections
        .get('sites')
        .query(Q.where('project_id', projectId))
        .fetch();

      const totalSites = sites.length;
      const siteIds = sites.map((s) => s.id);

      // Calculate sites ready for handover and sites handed over
      // (Simplified: based on overall progress and PM700 progress per site)
      let sitesReadyForHandover = 0;
      let sitesHandedOver = 0;

      if (pm700Milestone.length > 0) {
        const milestoneId = pm700Milestone[0].id;
        const siteProgressRecords = await database.collections
          .get('milestone_progress')
          .query(Q.where('milestone_id', milestoneId))
          .fetch();

        siteProgressRecords.forEach((record: any) => {
          const progress = record.progressPercentage || 0;
          if (progress === 100) {
            sitesHandedOver++;
          } else if (progress >= 80) {
            sitesReadyForHandover++;
          }
        });
      }

      // Get items data for documentation tracking
      // (Simplified: items with status 'completed' or 'handed_over')
      const allItems = await database.collections
        .get('items')
        .query(Q.where('site_id', Q.oneOf(siteIds)))
        .fetch();

      const totalItems = allItems.length;
      let documentationComplete = 0;

      allItems.forEach((item: any) => {
        const status = item.status?.toLowerCase() || '';
        if (status.includes('complete') || status.includes('handed') || status.includes('closed')) {
          documentationComplete++;
        }
      });

      const documentationPending = totalItems - documentationComplete;
      const documentationPercentage = totalItems > 0
        ? Math.round((documentationComplete / totalItems) * 100)
        : 0;

      // Get hindrances as simplified punch list items
      // (Note: Ideally would have a separate punch_list table)
      const allHindrances = await database.collections
        .get('hindrances')
        .query(Q.where('site_id', Q.oneOf(siteIds)))
        .fetch();

      const totalPunchItems = allHindrances.length;
      let punchItemsClosed = 0;
      let punchItemsCritical = 0;

      allHindrances.forEach((hindrance: any) => {
        if (hindrance.status === 'resolved' || hindrance.status === 'closed') {
          punchItemsClosed++;
        }
        if (hindrance.priority === 'high' || hindrance.priority === 'critical') {
          if (hindrance.status !== 'resolved' && hindrance.status !== 'closed') {
            punchItemsCritical++;
          }
        }
      });

      const punchItemsOpen = totalPunchItems - punchItemsClosed;
      const punchListCompletion = totalPunchItems > 0
        ? Math.round((punchItemsClosed / totalPunchItems) * 100)
        : 0;

      setHandoverData({
        pm700Progress: Math.round(pm700Progress),
        pm700Status,
        sitesReadyForHandover,
        sitesHandedOver,
        totalSites,
        documentationComplete,
        documentationPending,
        documentationPercentage,
        totalPunchItems,
        punchItemsClosed,
        punchItemsOpen,
        punchItemsCritical,
        punchListCompletion,
      });
    } catch (error) {
      logger.error('[ManagerDashboard] Error loading handover data', error as Error);
    }
  };

  if (loading && !refreshing) {
    return <DashboardSkeleton />;
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

      {/* Role Switcher Card */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Switch Role View</Title>
          <Paragraph style={styles.cardDescription}>
            View the app as a different role to coordinate across departments
          </Paragraph>
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <Button
                mode="outlined"
                onPress={() => setMenuVisible(true)}
                style={styles.roleButton}
              >
                Select Role to Switch
              </Button>
            }
          >
            <Menu.Item
              onPress={() => handleRoleSwitch('Supervisor')}
              title="Supervisor"
            />
            <Menu.Item
              onPress={() => handleRoleSwitch('Planning')}
              title="Planning"
            />
            <Menu.Item
              onPress={() => handleRoleSwitch('Logistics')}
              title="Logistics"
            />
            <Menu.Item
              onPress={() => handleRoleSwitch('DesignEngineer')}
              title="Design Engineer"
            />
            <Menu.Item
              onPress={() => handleRoleSwitch('CommercialManager')}
              title="Commercial Manager"
            />
          </Menu>
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

          {/* KPI 8: Active Supervisors */}
          <Card style={styles.kpiCard}>
            <Card.Content>
              <Paragraph style={styles.kpiLabel}>Active Supervisors</Paragraph>
              <Title style={styles.kpiValue}>{stats.activeSupervisors}</Title>
              <Paragraph style={styles.kpiSubtext}>Total supervisors</Paragraph>
              <View style={styles.kpiIndicator}>
                <View style={[styles.kpiDot, {
                  backgroundColor: stats.activeSupervisors > 0 ? '#4CAF50' : '#9E9E9E'
                }]} />
              </View>
            </Card.Content>
          </Card>
        </View>
      </View>

      {/* Section 2: Engineering Progress */}
      <View style={styles.section}>
        <Title style={styles.sectionTitle}>Engineering Progress</Title>
        <Paragraph style={styles.sectionSubtitle}>PM200 Milestone + DOORS + RFQ Status</Paragraph>

        <EngineeringSection data={engineeringData} />
      </View>

      {/* Section 3: Site Progress */}
      <View style={styles.section}>
        <Title style={styles.sectionTitle}>Site Progress Comparison</Title>
        <Paragraph style={styles.sectionSubtitle}>
          All Sites - Hybrid Tracking (60% Items + 40% Milestones)
        </Paragraph>

        <SiteProgressSection sites={sitesProgress} />
      </View>

      {/* Section 4: Equipment/Materials Status */}
      <View style={styles.section}>
        <Title style={styles.sectionTitle}>Equipment & Materials Status</Title>
        <Paragraph style={styles.sectionSubtitle}>
          Procurement (PM300) + Manufacturing (PM400) + Purchase Orders
        </Paragraph>

        <EquipmentMaterialsSection data={equipmentData} />
      </View>

      {/* Section 5: Financial Summary */}
      <View style={styles.section}>
        <Title style={styles.sectionTitle}>Financial Summary</Title>
        <Paragraph style={styles.sectionSubtitle}>
          Budget Overview + Profitability + BOM Summary
        </Paragraph>

        <FinancialSection data={financialData} />
      </View>

      {/* Section 6: Testing & Commissioning */}
      <View style={styles.section}>
        <Title style={styles.sectionTitle}>Testing & Commissioning</Title>
        <Paragraph style={styles.sectionSubtitle}>
          Pre-commissioning (PM500) + Commissioning (PM600) + Quality Inspections
        </Paragraph>

        <TestingCommissioningSection data={testingCommissioningData} />
      </View>

      {/* Section 7: Handover Status */}
      <View style={styles.section}>
        <Title style={styles.sectionTitle}>Handover Status</Title>
        <Paragraph style={styles.sectionSubtitle}>
          PM700 Milestone + Documentation + Punch List
        </Paragraph>

        <HandoverSection data={handoverData} />
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
  card: {
    margin: 15,
    marginTop: 10,
    marginBottom: 10,
  },
  cardDescription: {
    fontSize: 13,
    color: '#666',
    marginBottom: 15,
  },
  roleButton: {
    marginTop: 5,
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
  // Section 7: Handover Status styles
  handoverOverviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  handoverOverviewLeft: {
    flex: 1,
    alignItems: 'center',
  },
  handoverOverviewRight: {
    flex: 1,
  },
  handoverProgress: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  handoverLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  handoverSiteLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    marginBottom: 8,
  },
  handoverSiteItem: {
    fontSize: 14,
    marginVertical: 3,
  },
  documentationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  documentationLeft: {
    flex: 1,
    alignItems: 'center',
  },
  documentationRight: {
    flex: 1,
    alignItems: 'center',
  },
  documentationTotal: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  documentationLabel: {
    fontSize: 12,
    color: '#666',
  },
  documentationPending: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
  },
  documentationPercentageLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  documentationPercentageValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  documentationNote: {
    fontSize: 11,
    color: '#999',
    marginTop: 8,
    fontStyle: 'italic',
  },
  punchListRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  punchListLeft: {
    flex: 1,
    alignItems: 'center',
  },
  punchListRight: {
    flex: 1,
  },
  punchListTotal: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  punchListLabel: {
    fontSize: 12,
    color: '#666',
  },
  punchListItem: {
    fontSize: 14,
    marginVertical: 3,
  },
  punchListCritical: {
    fontSize: 14,
    marginVertical: 3,
    color: '#F44336',
    fontWeight: '500',
  },
  punchCompletionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 5,
  },
  punchCompletionLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  punchCompletionValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

// Wrap with ErrorBoundary for graceful error handling
const ManagerDashboardScreenWithBoundary = () => (
  <ErrorBoundary name="ManagerDashboardScreen">
    <ManagerDashboardScreen />
  </ErrorBoundary>
);

export default ManagerDashboardScreenWithBoundary;
