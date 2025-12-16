import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
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
import { useNavigation } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { database } from '../../models/database';
import { Q } from '@nozbe/watermelondb';
import DailyReportModel from '../../models/DailyReportModel';
import SiteModel from '../../models/SiteModel';
import ItemModel from '../../models/ItemModel';
import ProgressLogModel from '../../models/ProgressLogModel';
import { useSiteContext } from './context/SiteContext';
import SiteSelector from './components/SiteSelector';
import { useSnackbar } from '../components/Snackbar';
import FileViewer from 'react-native-file-viewer';
import Share from 'react-native-share';
import RNFS from 'react-native-fs';
import { logger } from '../services/LoggingService';
import { SupervisorHeader, EmptyState } from '../components/common';
import { useDebounce } from '../hooks';
import type { SupervisorDrawerParamList } from '../nav/SupervisorDrawerNavigator';

interface ReportWithDetails {
  report: DailyReportModel;
  site: SiteModel;
  progressLogs: ProgressLogModel[];
  items: ItemModel[]; // Items for this site to display names
}

const ReportsHistoryScreen = () => {
  const { selectedSiteId, supervisorId, projectId } = useSiteContext();
  const { showSnackbar } = useSnackbar();
  const navigation = useNavigation<DrawerNavigationProp<SupervisorDrawerParamList>>();
  const [refreshing, setRefreshing] = useState(false);
  const [reports, setReports] = useState<ReportWithDetails[]>([]);
  const [filteredReports, setFilteredReports] = useState<ReportWithDetails[]>([]);
  const [selectedReport, setSelectedReport] = useState<ReportWithDetails | null>(null);
  const [detailDialogVisible, setDetailDialogVisible] = useState(false);
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'all'>('week');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300); // Debounce search (Phase 3.4)

  // Load reports
  const loadReports = async () => {
    try {
      const reportsCollection = database.collections.get<DailyReportModel>('daily_reports');
      const sitesCollection = database.collections.get<SiteModel>('sites');
      const progressLogsCollection = database.collections.get<ProgressLogModel>('progress_logs');

      // Build query based on supervisor, project, and selected site
      const queryConditions = [
        Q.where('supervisor_id', supervisorId),
        Q.on('sites', 'project_id', projectId), // Project isolation
      ];

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
          items: siteItems,
        });
      }

      setReports(reportsWithDetails);
      applyFilters(reportsWithDetails, dateFilter, debouncedSearchQuery);
    } catch (error) {
      logger.error('Failed to load reports', error as Error, {
        component: 'ReportsHistoryScreen',
        action: 'loadReports',
        supervisorId,
        selectedSiteId,
      });
      showSnackbar('Failed to load reports', 'error');
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

  // Apply filters when date filter or debounced search changes (optimized for performance)
  useEffect(() => {
    applyFilters(reports, dateFilter, debouncedSearchQuery);
  }, [dateFilter, debouncedSearchQuery]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReports();
    setRefreshing(false);
  };

  const handleViewDetails = (reportWithDetails: ReportWithDetails) => {
    setSelectedReport(reportWithDetails);
    setDetailDialogVisible(true);
  };

  const handleCloseDialog = () => {
    setDetailDialogVisible(false);
    setSelectedReport(null);
  };

  const handleViewPdf = async (pdfPath: string) => {
    try {
      const fileExists = await RNFS.exists(pdfPath);
      if (!fileExists) {
        showSnackbar('PDF file not found. Please regenerate the report.', 'error');
        return;
      }

      await FileViewer.open(pdfPath, {
        showOpenWithDialog: true,
        showAppsSuggestions: true
      });
    } catch (error: any) {
      logger.error('Failed to view PDF', error as Error, {
        component: 'ReportsHistoryScreen',
        action: 'handleViewPdf',
        pdfPath,
      });

      // If no PDF viewer app, suggest sharing instead
      if (error.message?.includes('No app associated') || error.message?.includes('mime type')) {
        showSnackbar('No PDF viewer installed. Use Share button to open in another app.', 'warning');
      } else {
        showSnackbar('Failed to open PDF. Try sharing instead.', 'error');
      }
    }
  };

  const handleSharePdf = async (pdfPath: string, report: DailyReportModel) => {
    try {
      const fileExists = await RNFS.exists(pdfPath);
      if (!fileExists) {
        showSnackbar('PDF file not found. Please regenerate the report.', 'error');
        return;
      }

      const siteName = selectedReport?.site.name || 'Site';
      const reportDate = formatDate(report.reportDate);

      // Copy to cache directory for sharing (workaround for FileProvider issues)
      const filename = pdfPath.split('/').pop() || 'DailyReport.pdf';
      const cachePath = `${RNFS.CachesDirectoryPath}/${filename}`;

      logger.debug('Copying PDF to cache for sharing', {
        component: 'ReportsHistoryScreen',
        action: 'handleSharePdf',
        pdfPath,
        cachePath,
      });
      await RNFS.copyFile(pdfPath, cachePath);

      const shareOptions = {
        title: 'Daily Progress Report',
        message: `Daily Progress Report for ${siteName} on ${reportDate}`,
        url: `file://${cachePath}`,
        type: 'application/pdf',
        failOnCancel: false,
      };

      logger.debug('Sharing PDF from cache', {
        component: 'ReportsHistoryScreen',
        action: 'handleSharePdf',
        cachePath,
      });

      const result = await Share.open(shareOptions);
      logger.info('PDF shared successfully', {
        component: 'ReportsHistoryScreen',
        action: 'handleSharePdf',
        result,
      });

      // Clean up cache file after sharing
      try {
        await RNFS.unlink(cachePath);
      } catch (cleanupError) {
        logger.debug('PDF cache cleanup skipped', {
          component: 'ReportsHistoryScreen',
          action: 'handleSharePdf',
          cleanupError,
        });
      }

      if (result.success !== false) {
        showSnackbar('Report shared successfully!', 'success');
      }
    } catch (error: any) {
      logger.error('Failed to share PDF', error as Error, {
        component: 'ReportsHistoryScreen',
        action: 'handleSharePdf',
        pdfPath,
      });

      // Don't show error if user just cancelled
      if (error.message && !error.message.includes('User did not share') && !error.message.includes('cancelled')) {
        showSnackbar('Failed to share PDF. The PDF file may not be accessible for sharing.', 'error');
      }
    }
  };

  const handleShare = (report: DailyReportModel) => {
    if (!report.pdfPath) {
      showSnackbar('PDF not available for this report', 'warning');
      return;
    }
    handleSharePdf(report.pdfPath, report);
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

  /**
   * Navigate to Daily Work tab to create reports
   */
  const handleCreateReport = () => {
    // Navigate to Daily Work tab via drawer navigator
    navigation.navigate('SupervisorTabs' as any, {
      screen: 'DailyWork',
    } as any);
  };

  return (
    <View style={styles.container}>
      <SupervisorHeader title="Reports History" />

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
          <EmptyState
            icon={
              searchQuery
                ? 'magnify'
                : selectedSiteId === 'all'
                ? 'clipboard-text-outline'
                : 'clipboard-text-off-outline'
            }
            title={
              searchQuery
                ? 'No Reports Found'
                : selectedSiteId === 'all'
                ? 'No Reports Yet'
                : 'No Reports for This Site'
            }
            message={
              searchQuery
                ? 'No reports match your search criteria. Try different keywords.'
                : selectedSiteId === 'all'
                ? 'No daily reports have been submitted yet. Reports will appear here once created.'
                : 'No daily reports found for this site. Reports will appear once submitted.'
            }
            helpText={
              searchQuery || selectedSiteId === 'all'
                ? undefined
                : 'Daily reports document work progress, materials used, and site conditions. Submit reports from the Daily Work tab.'
            }
            tips={
              searchQuery || selectedSiteId === 'all'
                ? undefined
                : [
                    'Reports are generated from daily progress updates',
                    'View, share, or download PDF reports',
                    'Filter by site to find specific reports',
                  ]
            }
            variant={searchQuery ? 'search' : 'default'}
            actionText={searchQuery || selectedSiteId === 'all' ? undefined : 'Create Report'}
            onAction={searchQuery || selectedSiteId === 'all' ? undefined : handleCreateReport}
            secondaryActionText={searchQuery ? 'Clear Search' : undefined}
            onSecondaryAction={searchQuery ? () => setSearchQuery('') : undefined}
          />
        ) : (
          filteredReports.map(({ report, site, progressLogs, items }) => (
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
                      icon={getSyncStatusIcon(report.appSyncStatus)}
                      style={{
                        backgroundColor: getSyncStatusColor(report.appSyncStatus),
                      }}
                      textStyle={{ color: 'white' }}
                    >
                      {report.appSyncStatus}
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

                {/* Show item details - display up to 3 items */}
                {progressLogs.length > 0 && (
                  <>
                    <Divider style={styles.divider} />
                    <Text style={styles.itemsLabel}>
                      Items Updated ({progressLogs.length}):
                    </Text>
                    {progressLogs.slice(0, 3).map((log) => {
                      const item = items.find(i => i.id === log.itemId);
                      return item ? (
                        <Text key={log.id} style={styles.itemEntry}>
                          • {item.name} - {log.completedQuantity} {item.unitOfMeasurement}
                        </Text>
                      ) : null;
                    })}
                    {progressLogs.length > 3 && (
                      <Text style={styles.moreItems}>
                        +{progressLogs.length - 3} more... (tap View Details)
                      </Text>
                    )}
                  </>
                )}

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
                  onPress={() => handleViewDetails({ report, site, progressLogs, items })}
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
          onDismiss={handleCloseDialog}
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
            {selectedReport?.report.pdfPath && (
              <>
                <Button
                  icon="file-pdf-box"
                  onPress={() => handleViewPdf(selectedReport.report.pdfPath)}
                  mode="outlined"
                >
                  View PDF
                </Button>
                <Button
                  icon="share-variant"
                  onPress={() => handleSharePdf(selectedReport.report.pdfPath, selectedReport.report)}
                  mode="contained"
                >
                  Share
                </Button>
              </>
            )}
            <Button onPress={handleCloseDialog}>Close</Button>
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
  itemsLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
    marginTop: 4,
  },
  itemEntry: {
    fontSize: 13,
    color: '#333',
    marginBottom: 4,
    paddingLeft: 8,
  },
  moreItems: {
    fontSize: 12,
    color: '#007AFF',
    fontStyle: 'italic',
    marginTop: 4,
    paddingLeft: 8,
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
