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

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      await Promise.all([loadProjectInfo(), calculateStats(), loadEngineeringData(), loadSitesProgress()]);
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
});

export default ManagerDashboardScreen;
