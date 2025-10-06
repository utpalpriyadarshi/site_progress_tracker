import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Chip,
  Portal,
  Dialog,
  Divider,
  Text,
  IconButton,
  Searchbar,
} from 'react-native-paper';
import { database } from '../../models/database';
import { Q } from '@nozbe/watermelondb';
import DailyReportModel from '../../models/DailyReportModel';
import SiteModel from '../../models/SiteModel';
import ItemModel from '../../models/ItemModel';
import ProgressLogModel from '../../models/ProgressLogModel';
import { useSiteContext } from './context/SiteContext';
import SiteSelector from './components/SiteSelector';

interface ReportWithDetails {
  report: DailyReportModel;
  site: SiteModel;
  progressLogs: ProgressLogModel[];
}

const ReportsHistoryScreen = () => {
  const { selectedSiteId, supervisorId } = useSiteContext();
  const [refreshing, setRefreshing] = useState(false);
  const [reports, setReports] = useState<ReportWithDetails[]>([]);
  const [filteredReports, setFilteredReports] = useState<ReportWithDetails[]>([]);
  const [selectedReport, setSelectedReport] = useState<ReportWithDetails | null>(null);
  const [detailDialogVisible, setDetailDialogVisible] = useState(false);
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'all'>('week');
  const [searchQuery, setSearchQuery] = useState('');

  // Load reports
  const loadReports = async () => {
    try {
      const reportsCollection = database.collections.get<DailyReportModel>('daily_reports');
      const sitesCollection = database.collections.get<SiteModel>('sites');
      const progressLogsCollection = database.collections.get<ProgressLogModel>('progress_logs');

      // Build query based on supervisor and selected site
      const queryConditions = [Q.where('supervisor_id', supervisorId)];

      if (selectedSiteId !== 'all') {
        queryConditions.push(Q.where('site_id', selectedSiteId));
      }

      const fetchedReports = await reportsCollection
        .query(...queryConditions, Q.sortBy('submitted_at', Q.desc))
        .fetch();

      // Fetch related data for each report
      const reportsWithDetails: ReportWithDetails[] = [];

      for (const report of fetchedReports) {
        const site = await sitesCollection.find(report.siteId);

        // Get all items for this site
        const itemsCollection = database.collections.get<ItemModel>('items');
        const siteItems = await itemsCollection
          .query(Q.where('site_id', report.siteId))
          .fetch();

        const itemIds = siteItems.map(item => item.id);

        // Get progress logs for this report (same date, for items in this site)
        const startOfDay = new Date(report.reportDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(report.reportDate);
        endOfDay.setHours(23, 59, 59, 999);

        // Query progress logs for all items in this site
        let progressLogs: ProgressLogModel[] = [];
        if (itemIds.length > 0) {
          progressLogs = await progressLogsCollection
            .query(
              Q.where('item_id', Q.oneOf(itemIds)),
              Q.where('date', Q.between(startOfDay.getTime(), endOfDay.getTime())),
              Q.where('sync_status', 'synced')
            )
            .fetch();
        }

        reportsWithDetails.push({
          report,
          site,
          progressLogs,
        });
      }

      setReports(reportsWithDetails);
      applyFilters(reportsWithDetails, dateFilter, searchQuery);
    } catch (error) {
      console.error('Error loading reports:', error);
      Alert.alert('Error', 'Failed to load reports');
    }
  };

  // Apply date and search filters
  const applyFilters = (
    reportsData: ReportWithDetails[],
    filter: typeof dateFilter,
    search: string
  ) => {
    let filtered = [...reportsData];

    // Date filter
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (filter) {
      case 'today':
        filtered = filtered.filter(r => r.report.reportDate >= todayStart.getTime());
        break;
      case 'week':
        const weekAgo = new Date(todayStart);
        weekAgo.setDate(weekAgo.getDate() - 7);
        filtered = filtered.filter(r => r.report.reportDate >= weekAgo.getTime());
        break;
      case 'month':
        const monthAgo = new Date(todayStart);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        filtered = filtered.filter(r => r.report.reportDate >= monthAgo.getTime());
        break;
      case 'all':
      default:
        // No date filtering
        break;
    }

    // Search filter
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(r => {
        // Search in site name
        if (r.site.name.toLowerCase().includes(searchLower)) {
          return true;
        }

        // Search in report-level notes
        if (r.report.notes && r.report.notes.toLowerCase().includes(searchLower)) {
          return true;
        }

        // Search in item-level notes (progress logs)
        const hasMatchingItemNote = r.progressLogs.some(log =>
          log.notes && log.notes.toLowerCase().includes(searchLower)
        );

        return hasMatchingItemNote;
      });
    }

    setFilteredReports(filtered);
  };

  useEffect(() => {
    loadReports();
  }, [supervisorId, selectedSiteId]);

  useEffect(() => {
    applyFilters(reports, dateFilter, searchQuery);
  }, [dateFilter, searchQuery]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReports();
    setRefreshing(false);
  };

  const handleViewDetails = (reportWithDetails: ReportWithDetails) => {
    setSelectedReport(reportWithDetails);
    setDetailDialogVisible(true);
  };

  const handleShare = (report: DailyReportModel) => {
    // Placeholder for future PDF sharing
    Alert.alert(
      'Share Report',
      'PDF sharing will be available soon!\n\nReport details:\n' +
      `Date: ${formatDate(report.reportDate)}\n` +
      `Items: ${report.totalItems}\n` +
      `Progress: ${report.totalProgress.toFixed(1)}%`,
      [{ text: 'OK' }]
    );
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getSyncStatusColor = (status: string) => {
    switch (status) {
      case 'synced':
        return '#4CAF50';
      case 'pending':
        return '#FF9800';
      case 'failed':
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };

  const getSyncStatusIcon = (status: string) => {
    switch (status) {
      case 'synced':
        return 'cloud-check';
      case 'pending':
        return 'cloud-upload';
      case 'failed':
        return 'cloud-alert';
      default:
        return 'cloud-question';
    }
  };

  return (
    <View style={styles.container}>
      {/* Site Selector */}
      <SiteSelector />

      {/* Search Bar */}
      <Searchbar
        placeholder="Search reports by site or notes..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
      />

      {/* Date Filter Chips */}
      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContent}
        >
          <Chip
            selected={dateFilter === 'today'}
            onPress={() => setDateFilter('today')}
            style={styles.filterChip}
          >
            Today
          </Chip>
          <Chip
            selected={dateFilter === 'week'}
            onPress={() => setDateFilter('week')}
            style={styles.filterChip}
          >
            Last 7 Days
          </Chip>
          <Chip
            selected={dateFilter === 'month'}
            onPress={() => setDateFilter('month')}
            style={styles.filterChip}
          >
            Last 30 Days
          </Chip>
          <Chip
            selected={dateFilter === 'all'}
            onPress={() => setDateFilter('all')}
            style={styles.filterChip}
          >
            All Time
          </Chip>
        </ScrollView>
      </View>

      {/* Reports List */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredReports.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content>
              <Title>📋 No Reports Found</Title>
              <Paragraph>
                {searchQuery
                  ? 'No reports match your search criteria.'
                  : selectedSiteId === 'all'
                  ? 'No reports have been submitted yet.'
                  : 'No reports found for this site.'}
              </Paragraph>
            </Card.Content>
          </Card>
        ) : (
          filteredReports.map(({ report, site, progressLogs }) => (
            <Card key={report.id} style={styles.reportCard}>
              <Card.Content>
                <View style={styles.cardHeader}>
                  <View style={styles.headerLeft}>
                    <Title style={styles.siteName}>{site.name}</Title>
                    <Text style={styles.dateText}>
                      {formatDate(report.reportDate)}
                    </Text>
                  </View>
                  <View style={styles.headerRight}>
                    <Chip
                      icon={getSyncStatusIcon(report.syncStatus)}
                      style={{
                        backgroundColor: getSyncStatusColor(report.syncStatus),
                      }}
                      textStyle={{ color: 'white' }}
                    >
                      {report.syncStatus}
                    </Chip>
                  </View>
                </View>

                <Divider style={styles.divider} />

                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Items Updated</Text>
                    <Text style={styles.statValue}>{report.totalItems}</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Overall Progress</Text>
                    <Text style={styles.statValue}>
                      {report.totalProgress.toFixed(1)}%
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Submitted</Text>
                    <Text style={styles.statValue}>
                      {formatTime(report.submittedAt)}
                    </Text>
                  </View>
                </View>

                {report.notes && (
                  <>
                    <Divider style={styles.divider} />
                    <Text style={styles.notesLabel}>Notes:</Text>
                    <Text style={styles.notesText}>{report.notes}</Text>
                  </>
                )}
              </Card.Content>

              <Card.Actions>
                <Button
                  icon="eye"
                  onPress={() => handleViewDetails({ report, site, progressLogs })}
                >
                  View Details
                </Button>
                <Button
                  icon="share-variant"
                  onPress={() => handleShare(report)}
                  disabled={!report.pdfPath}
                >
                  Share
                </Button>
              </Card.Actions>
            </Card>
          ))
        )}
      </ScrollView>

      {/* Report Detail Dialog */}
      <Portal>
        <Dialog
          visible={detailDialogVisible}
          onDismiss={() => setDetailDialogVisible(false)}
          style={styles.dialog}
        >
          <Dialog.Title>Report Details</Dialog.Title>
          <Dialog.ScrollArea>
            <ScrollView>
              {selectedReport && (
                <View style={styles.dialogContent}>
                  <Text style={styles.dialogLabel}>Site:</Text>
                  <Text style={styles.dialogValue}>
                    {selectedReport.site.name}
                  </Text>

                  <Text style={styles.dialogLabel}>Report Date:</Text>
                  <Text style={styles.dialogValue}>
                    {formatDate(selectedReport.report.reportDate)}
                  </Text>

                  <Text style={styles.dialogLabel}>Submitted At:</Text>
                  <Text style={styles.dialogValue}>
                    {formatDate(selectedReport.report.submittedAt)} at{' '}
                    {formatTime(selectedReport.report.submittedAt)}
                  </Text>

                  <Divider style={styles.dialogDivider} />

                  <Text style={styles.dialogSectionTitle}>
                    Progress Summary
                  </Text>
                  <Text style={styles.dialogLabel}>Total Items:</Text>
                  <Text style={styles.dialogValue}>
                    {selectedReport.report.totalItems}
                  </Text>

                  <Text style={styles.dialogLabel}>Overall Progress:</Text>
                  <Text style={styles.dialogValue}>
                    {selectedReport.report.totalProgress.toFixed(1)}%
                  </Text>

                  {selectedReport.report.notes && (
                    <>
                      <Text style={styles.dialogLabel}>Notes:</Text>
                      <Text style={styles.dialogValue}>
                        {selectedReport.report.notes}
                      </Text>
                    </>
                  )}

                  <Divider style={styles.dialogDivider} />

                  <Text style={styles.dialogSectionTitle}>
                    Updated Items ({selectedReport.progressLogs.length})
                  </Text>
                  {selectedReport.progressLogs.map((log, index) => (
                    <View key={log.id} style={styles.logItem}>
                      <Text style={styles.logIndex}>{index + 1}.</Text>
                      <View style={styles.logDetails}>
                        <Text style={styles.logQuantity}>
                          Quantity: {log.completedQuantity}
                        </Text>
                        {log.notes && (
                          <Text style={styles.logNotes}>"{log.notes}"</Text>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setDetailDialogVisible(false)}>Close</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchBar: {
    margin: 16,
    marginBottom: 8,
  },
  filterContainer: {
    marginBottom: 16,
    maxHeight: 50,
  },
  filterScrollContent: {
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  filterChip: {
    marginRight: 8,
    height: 36,
  },
  scrollView: {
    flex: 1,
  },
  emptyCard: {
    margin: 16,
    padding: 16,
    alignItems: 'center',
  },
  reportCard: {
    margin: 16,
    marginBottom: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    marginLeft: 12,
  },
  siteName: {
    fontSize: 18,
    marginBottom: 4,
  },
  dateText: {
    fontSize: 14,
    color: '#666',
  },
  divider: {
    marginVertical: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: '#333',
    fontStyle: 'italic',
  },
  dialog: {
    maxHeight: '80%',
  },
  dialogContent: {
    padding: 16,
  },
  dialogLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 12,
    marginBottom: 4,
  },
  dialogValue: {
    fontSize: 16,
    color: '#333',
  },
  dialogDivider: {
    marginVertical: 16,
  },
  dialogSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  logItem: {
    flexDirection: 'row',
    marginBottom: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  logIndex: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    marginRight: 8,
  },
  logDetails: {
    flex: 1,
  },
  logQuantity: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  logNotes: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
});

export default ReportsHistoryScreen;
