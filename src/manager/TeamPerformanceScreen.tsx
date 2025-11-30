/**
 * Team Performance & Monitoring Screen - v2.10 Phase 7
 *
 * Monitor supervisor performance across the project
 * - Supervisor list with performance metrics
 * - Productivity tracking
 * - Activity timeline
 * - Performance comparison
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  ActivityIndicator,
  DataTable,
  Chip,
  ProgressBar,
  Divider,
} from 'react-native-paper';
import { useManagerContext } from './context/ManagerContext';
import { database } from '../../models/database';
import { Q } from '@nozbe/watermelondb';

interface SupervisorPerformance {
  userId: string;
  name: string;
  siteId: string;
  siteName: string;
  totalItems: number;
  completedItems: number;
  progressPercentage: number;
  reportsSubmitted: number;
  lastReportDate: string;
  hindrancesReported: number;
  hindrancesResolved: number;
  inspectionsPassed: number;
  inspectionsFailed: number;
  daysActive: number;
  productivity: number; // items completed per day
}

const TeamPerformanceScreen = () => {
  const { projectId } = useManagerContext();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [supervisors, setSupervisors] = useState<SupervisorPerformance[]>([]);
  const [projectStats, setProjectStats] = useState({
    totalSupervisors: 0,
    avgProgress: 0,
    totalReports: 0,
    avgProductivity: 0,
  });

  const loadPerformanceData = useCallback(async () => {
    if (!projectId) return;

    try {
      // Get all sites for this project
      const sites = await database.collections
        .get('sites')
        .query(Q.where('project_id', projectId))
        .fetch();

      // Get all users with supervisor role for this project
      const users = await database.collections
        .get('users')
        .query(
          Q.where('project_id', projectId),
          Q.where('role', 'supervisor')
        )
        .fetch();

      const performanceData: SupervisorPerformance[] = [];

      for (const user of users) {
        const userId = user.id;
        const userName = (user as any).fullName || (user as any).username || 'Unknown';

        // Find supervisor's assigned site
        const userSite = sites.find((s: any) => s.supervisorId === userId);
        if (!userSite) continue;

        const siteId = userSite.id;
        const siteName = (userSite as any).name || 'Unknown Site';

        // Get items for this site
        const items = await database.collections
          .get('items')
          .query(Q.where('site_id', siteId))
          .fetch();

        const totalItems = items.length;
        const completedItems = items.filter((item: any) => {
          const status = item.status?.toLowerCase() || '';
          return status.includes('complete') || status === '100%';
        }).length;

        const progressPercentage = totalItems > 0
          ? Math.round((completedItems / totalItems) * 100)
          : 0;

        // Get daily reports
        const reports = await database.collections
          .get('daily_reports')
          .query(
            Q.where('site_id', siteId),
            Q.where('created_by', userId)
          )
          .fetch();

        const reportsSubmitted = reports.length;
        const lastReport = reports.length > 0
          ? reports.sort((a: any, b: any) => b.createdAt - a.createdAt)[0]
          : null;
        const lastReportDate = lastReport
          ? new Date((lastReport as any).createdAt).toLocaleDateString()
          : 'Never';

        // Calculate days active (days since first report)
        const daysActive = reports.length > 0
          ? Math.max(1, Math.ceil(
              (Date.now() - Math.min(...reports.map((r: any) => r.createdAt))) /
              (1000 * 60 * 60 * 24)
            ))
          : 1;

        // Get hindrances
        const hindrances = await database.collections
          .get('hindrances')
          .query(Q.where('site_id', siteId))
          .fetch();

        const hindrancesReported = hindrances.length;
        const hindrancesResolved = hindrances.filter(
          (h: any) => h.status === 'resolved' || h.status === 'closed'
        ).length;

        // Get inspections
        const inspections = await database.collections
          .get('site_inspections')
          .query(Q.where('site_id', siteId))
          .fetch();

        const inspectionsPassed = inspections.filter(
          (i: any) => i.status === 'passed' || i.status === 'approved'
        ).length;
        const inspectionsFailed = inspections.filter(
          (i: any) => i.status === 'failed'
        ).length;

        // Calculate productivity (items completed per day)
        const productivity = daysActive > 0
          ? Number((completedItems / daysActive).toFixed(2))
          : 0;

        performanceData.push({
          userId,
          name: userName,
          siteId,
          siteName,
          totalItems,
          completedItems,
          progressPercentage,
          reportsSubmitted,
          lastReportDate,
          hindrancesReported,
          hindrancesResolved,
          inspectionsPassed,
          inspectionsFailed,
          daysActive,
          productivity,
        });
      }

      // Sort by progress percentage (descending)
      performanceData.sort((a, b) => b.progressPercentage - a.progressPercentage);

      // Calculate project stats
      const totalSupervisors = performanceData.length;
      const avgProgress = totalSupervisors > 0
        ? Math.round(
            performanceData.reduce((sum, s) => sum + s.progressPercentage, 0) /
            totalSupervisors
          )
        : 0;
      const totalReports = performanceData.reduce((sum, s) => sum + s.reportsSubmitted, 0);
      const avgProductivity = totalSupervisors > 0
        ? Number(
            (performanceData.reduce((sum, s) => sum + s.productivity, 0) /
            totalSupervisors).toFixed(2)
          )
        : 0;

      setSupervisors(performanceData);
      setProjectStats({
        totalSupervisors,
        avgProgress,
        totalReports,
        avgProductivity,
      });
    } catch (error) {
      console.error('[TeamPerformance] Error loading data:', error);
    }
  }, [projectId]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await loadPerformanceData();
      setLoading(false);
    };

    loadData();
  }, [loadPerformanceData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPerformanceData();
    setRefreshing(false);
  };

  const getPerformanceColor = (percentage: number) => {
    if (percentage >= 75) return '#4CAF50'; // Green
    if (percentage >= 50) return '#FFC107'; // Yellow
    return '#F44336'; // Red
  };

  const renderProjectSummary = () => {
    return (
      <Card style={styles.summaryCard}>
        <Card.Content>
          <Title style={styles.cardTitle}>Project Team Summary</Title>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Title style={styles.summaryValue}>{projectStats.totalSupervisors}</Title>
              <Paragraph style={styles.summaryLabel}>Supervisors</Paragraph>
            </View>
            <View style={styles.summaryItem}>
              <Title style={[styles.summaryValue, { color: getPerformanceColor(projectStats.avgProgress) }]}>
                {projectStats.avgProgress}%
              </Title>
              <Paragraph style={styles.summaryLabel}>Avg Progress</Paragraph>
            </View>
            <View style={styles.summaryItem}>
              <Title style={styles.summaryValue}>{projectStats.totalReports}</Title>
              <Paragraph style={styles.summaryLabel}>Total Reports</Paragraph>
            </View>
            <View style={styles.summaryItem}>
              <Title style={styles.summaryValue}>{projectStats.avgProductivity}</Title>
              <Paragraph style={styles.summaryLabel}>Avg Productivity</Paragraph>
              <Paragraph style={styles.summarySubLabel}>items/day</Paragraph>
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderSupervisorList = () => {
    if (supervisors.length === 0) {
      return (
        <Card style={styles.card}>
          <Card.Content>
            <Paragraph style={styles.emptyText}>No supervisors assigned to this project</Paragraph>
          </Card.Content>
        </Card>
      );
    }

    return (
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.cardTitle}>Supervisor Performance</Title>
          <Paragraph style={styles.cardSubtitle}>
            {supervisors.length} supervisors across all sites
          </Paragraph>

          <Divider style={styles.divider} />

          {supervisors.map((supervisor, index) => (
            <View key={supervisor.userId} style={styles.supervisorCard}>
              <View style={styles.supervisorHeader}>
                <View style={styles.supervisorInfo}>
                  <Paragraph style={styles.supervisorName}>{supervisor.name}</Paragraph>
                  <Paragraph style={styles.supervisorSite}>📍 {supervisor.siteName}</Paragraph>
                </View>
                <Chip
                  style={[styles.progressChip, {
                    backgroundColor: getPerformanceColor(supervisor.progressPercentage)
                  }]}
                  textStyle={{ color: '#fff', fontWeight: 'bold' }}
                >
                  {supervisor.progressPercentage}%
                </Chip>
              </View>

              <ProgressBar
                progress={supervisor.progressPercentage / 100}
                color={getPerformanceColor(supervisor.progressPercentage)}
                style={styles.progressBar}
              />

              <View style={styles.metricsGrid}>
                <View style={styles.metricItem}>
                  <Paragraph style={styles.metricLabel}>Items Progress</Paragraph>
                  <Paragraph style={styles.metricValue}>
                    {supervisor.completedItems}/{supervisor.totalItems}
                  </Paragraph>
                </View>
                <View style={styles.metricItem}>
                  <Paragraph style={styles.metricLabel}>Reports</Paragraph>
                  <Paragraph style={styles.metricValue}>{supervisor.reportsSubmitted}</Paragraph>
                </View>
                <View style={styles.metricItem}>
                  <Paragraph style={styles.metricLabel}>Productivity</Paragraph>
                  <Paragraph style={styles.metricValue}>
                    {supervisor.productivity}/day
                  </Paragraph>
                </View>
                <View style={styles.metricItem}>
                  <Paragraph style={styles.metricLabel}>Last Report</Paragraph>
                  <Paragraph style={styles.metricValue}>{supervisor.lastReportDate}</Paragraph>
                </View>
              </View>

              <View style={styles.detailsRow}>
                <View style={styles.detailItem}>
                  <Paragraph style={styles.detailLabel}>Hindrances:</Paragraph>
                  <Paragraph style={styles.detailValue}>
                    {supervisor.hindrancesResolved}/{supervisor.hindrancesReported} Resolved
                  </Paragraph>
                </View>
                <View style={styles.detailItem}>
                  <Paragraph style={styles.detailLabel}>Inspections:</Paragraph>
                  <Paragraph style={styles.detailValue}>
                    ✓ {supervisor.inspectionsPassed} | ✗ {supervisor.inspectionsFailed}
                  </Paragraph>
                </View>
              </View>

              {index < supervisors.length - 1 && <Divider style={styles.divider} />}
            </View>
          ))}
        </Card.Content>
      </Card>
    );
  };

  const renderPerformanceTable = () => {
    if (supervisors.length === 0) return null;

    return (
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.cardTitle}>Performance Comparison</Title>
          <ScrollView horizontal>
            <DataTable>
              <DataTable.Header>
                <DataTable.Title style={styles.tableCell}>Supervisor</DataTable.Title>
                <DataTable.Title style={styles.tableCell}>Site</DataTable.Title>
                <DataTable.Title style={styles.tableCell} numeric>Progress</DataTable.Title>
                <DataTable.Title style={styles.tableCell} numeric>Reports</DataTable.Title>
                <DataTable.Title style={styles.tableCell} numeric>Productivity</DataTable.Title>
                <DataTable.Title style={styles.tableCell} numeric>Days Active</DataTable.Title>
              </DataTable.Header>

              {supervisors.map((supervisor) => (
                <DataTable.Row key={supervisor.userId}>
                  <DataTable.Cell style={styles.tableCell}>{supervisor.name}</DataTable.Cell>
                  <DataTable.Cell style={styles.tableCell}>{supervisor.siteName}</DataTable.Cell>
                  <DataTable.Cell style={styles.tableCell} numeric>
                    {supervisor.progressPercentage}%
                  </DataTable.Cell>
                  <DataTable.Cell style={styles.tableCell} numeric>
                    {supervisor.reportsSubmitted}
                  </DataTable.Cell>
                  <DataTable.Cell style={styles.tableCell} numeric>
                    {supervisor.productivity}
                  </DataTable.Cell>
                  <DataTable.Cell style={styles.tableCell} numeric>
                    {supervisor.daysActive}
                  </DataTable.Cell>
                </DataTable.Row>
              ))}
            </DataTable>
          </ScrollView>
        </Card.Content>
      </Card>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Paragraph style={styles.loadingText}>Loading team performance...</Paragraph>
      </View>
    );
  }

  if (!projectId) {
    return (
      <View style={styles.emptyContainer}>
        <Paragraph style={styles.emptyText}>No project assigned</Paragraph>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      <View style={styles.header}>
        <Title style={styles.headerTitle}>Team Performance</Title>
        <Paragraph style={styles.headerSubtitle}>
          Monitor supervisor productivity across all sites
        </Paragraph>
      </View>

      {renderProjectSummary()}
      {renderSupervisorList()}
      {renderPerformanceTable()}
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
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  summaryCard: {
    margin: 15,
    marginBottom: 10,
  },
  card: {
    margin: 15,
    marginTop: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 15,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  summarySubLabel: {
    fontSize: 10,
    color: '#999',
  },
  divider: {
    marginVertical: 15,
  },
  supervisorCard: {
    marginBottom: 10,
  },
  supervisorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  supervisorInfo: {
    flex: 1,
  },
  supervisorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  supervisorSite: {
    fontSize: 13,
    color: '#666',
    marginTop: 3,
  },
  progressChip: {
    marginLeft: 10,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 15,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  metricItem: {
    width: '50%',
    marginBottom: 10,
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginTop: 2,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#666',
  },
  detailValue: {
    fontSize: 13,
    color: '#333',
    marginTop: 2,
  },
  tableCell: {
    minWidth: 120,
  },
});

export default TeamPerformanceScreen;
