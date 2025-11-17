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
  TextInput,
  Chip,
  Portal,
  Dialog,
  IconButton,
  ProgressBar,
  Divider,
  Text,
} from 'react-native-paper';
import { database } from '../../models/database';
import { withObservables } from '@nozbe/watermelondb/react';
import { Q } from '@nozbe/watermelondb';
import NetInfo from '@react-native-community/netinfo';
import ItemModel from '../../models/ItemModel';
import SiteModel from '../../models/SiteModel';
import ProgressLogModel from '../../models/ProgressLogModel';
import { useSiteContext } from './context/SiteContext';
import SiteSelector from './components/SiteSelector';
import { ReportPdfService } from '../../services/pdf/ReportPdfService';
import { useSnackbar } from '../components/Snackbar';
import { ConfirmDialog } from '../components/Dialog';

interface ItemWithSite {
  item: ItemModel;
  siteName: string;
}

const DailyReportsScreenComponent = ({
  sites,
  items,
}: {
  sites: SiteModel[];
  items: ItemModel[];
}) => {
  const { selectedSiteId, supervisorId } = useSiteContext();
  const { showSnackbar } = useSnackbar();
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ItemModel | null>(null);
  const [quantityInput, setQuantityInput] = useState('');
  const [notesInput, setNotesInput] = useState('');
  const [dialogVisible, setDialogVisible] = useState(false);
  const [itemsWithSites, setItemsWithSites] = useState<ItemWithSite[]>([]);
  const [showExceedsWarning, setShowExceedsWarning] = useState(false);
  const [showOfflineConfirm, setShowOfflineConfirm] = useState(false);
  const [pendingQuantity, setPendingQuantity] = useState(0);

  // Debug logging
  useEffect(() => {
    console.log('DEBUG: Sites count:', sites.length);
    console.log('DEBUG: Items count:', items.length);
    sites.forEach(site => {
      console.log('DEBUG: Site:', site.id, site.name, 'supervisor_id:', (site as any).supervisorId);
    });
  }, [sites, items]);

  // Monitor network status
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected ?? false);
    });

    return () => unsubscribe();
  }, []);

  // Map items to their site names and filter by selected site
  useEffect(() => {
    const mapItemsToSites = async () => {
      const mapped: ItemWithSite[] = [];

      // Filter items based on selected site
      const filteredItems = selectedSiteId === 'all'
        ? items
        : items.filter(item => item.siteId === selectedSiteId);

      for (const item of filteredItems) {
        const site = sites.find(s => s.id === item.siteId);
        mapped.push({
          item,
          siteName: site?.name || 'Unknown Site',
        });
      }
      setItemsWithSites(mapped);
    };

    mapItemsToSites();
  }, [items, sites, selectedSiteId]);

  const onRefresh = async () => {
    setRefreshing(true);
    // In a real app, this would trigger a sync with the server
    // Removed artificial delay for better UX
    setRefreshing(false);
  };

  const getProgressPercentage = (item: ItemModel): number => {
    if (item.plannedQuantity === 0) return 0;
    return Math.min(
      (item.completedQuantity / item.plannedQuantity) * 100,
      100,
    );
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed':
        return '#4CAF50';
      case 'in_progress':
        return '#2196F3';
      case 'not_started':
        return '#9E9E9E';
      default:
        return '#9E9E9E';
    }
  };

  const openUpdateDialog = (item: ItemModel) => {
    setSelectedItem(item);
    setQuantityInput(item.completedQuantity.toString());
    setNotesInput('');
    setDialogVisible(true);
  };

  const closeDialog = () => {
    setDialogVisible(false);
    setSelectedItem(null);
    setQuantityInput('');
    setNotesInput('');
  };

  const incrementQuantity = (amount: number) => {
    const currentValue = parseFloat(quantityInput) || 0;
    const newValue = Math.max(0, currentValue + amount);
    setQuantityInput(newValue.toString());
  };

  const handleUpdateProgress = async () => {
    if (!selectedItem) return;

    const newQuantity = parseFloat(quantityInput) || 0;

    if (newQuantity > selectedItem.plannedQuantity) {
      setPendingQuantity(newQuantity);
      setShowExceedsWarning(true);
    } else {
      await saveProgress(newQuantity);
    }
  };

  const saveProgress = async (newQuantity: number) => {
    if (!selectedItem) return;

    try {
      // Get planned quantity before update
      const plannedQty = selectedItem.plannedQuantity;

      await database.write(async () => {
        // Update item's completed quantity
        try {
          await selectedItem.update((item: any) => {
            item.completedQuantity = newQuantity;

            // Update status based on progress
            if (newQuantity === 0) {
              item.status = 'not_started';
            } else if (newQuantity >= plannedQty) {
              item.status = 'completed';
            } else {
              item.status = 'in_progress';
            }
          });
          console.log('Item updated successfully');
        } catch (updateError) {
          console.error('Error in item.update:', updateError);
          throw updateError;
        }

        // Create a progress log entry (always pending until report is submitted)
        try {
          await database.collections
            .get('progress_logs')
            .create((log: any) => {
              log.itemId = selectedItem.id;
              log.date = new Date().getTime(); // Convert to timestamp
              log.completedQuantity = newQuantity;
              log.reportedBy = supervisorId; // Use actual supervisor ID from context
              log.photos = '[]';
              log.notes = notesInput || '';
              log.appSyncStatus = 'pending'; // Always pending until submitted as report
            });
          console.log('Progress log created successfully');
        } catch (logError) {
          console.error('Error creating progress log:', logError);
          throw logError;
        }
      });

      showSnackbar(
        'Progress updated successfully. Click "Submit Progress Reports" to finalize your daily report',
        'success'
      );
      closeDialog();
    } catch (error) {
      console.error('Error updating progress (outer):', error);
      console.error('Error stack:', (error as any).stack);
      showSnackbar(
        'Failed to update progress: ' + (error as Error).message,
        'error'
      );
    }
  };

  const handleSubmitAllReports = async () => {
    if (!isOnline) {
      setShowOfflineConfirm(true);
    } else {
      await submitReports();
    }
  };

  const submitReports = async () => {
    setIsSyncing(true);
    try {
      // Get today's date range (start of day to end of day)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const startOfDay = today.getTime();
      const endOfDay = startOfDay + (24 * 60 * 60 * 1000) - 1;

      // Get all pending progress logs for today for this supervisor's sites
      const progressLogs = await database.collections
        .get('progress_logs')
        .query(
          Q.where('sync_status', 'pending'),
          Q.where('date', Q.gte(startOfDay)),
          Q.where('date', Q.lte(endOfDay)),
          Q.where('reported_by', supervisorId)
        )
        .fetch();

      if (progressLogs.length === 0) {
        showSnackbar(
          'No pending progress updates to submit for today. Update some items first',
          'warning'
        );
        setIsSyncing(false);
        return;
      }

      // Group logs by site
      const logsBySite: { [siteId: string]: typeof progressLogs } = {};
      for (const log of progressLogs) {
        const item = items.find(i => i.id === (log as any).itemId);
        if (item) {
          const siteId = item.siteId;
          if (!logsBySite[siteId]) {
            logsBySite[siteId] = [];
          }
          logsBySite[siteId].push(log);
        }
      }

      // Generate reports for each site
      let totalReportsGenerated = 0;
      const reportPaths: string[] = [];

      await database.write(async () => {
        for (const siteId of Object.keys(logsBySite)) {
          const site = sites.find(s => s.id === siteId);
          if (!site) continue;

          const siteLogs = logsBySite[siteId];
          const siteItems = items.filter(i => i.siteId === siteId);

          // Calculate total progress for site
          const totalProgress = siteItems.length > 0
            ? siteItems.reduce((sum, item) => {
                const progress = item.plannedQuantity > 0
                  ? (item.completedQuantity / item.plannedQuantity) * 100
                  : 0;
                return sum + progress;
              }, 0) / siteItems.length
            : 0;

          // Generate PDF report
          let pdfPath = '';
          try {
            const itemsWithLogs = siteItems.map(item => ({
              item,
              progressLog: (siteLogs.find(log => (log as any).itemId === item.id) as ProgressLogModel) || null,
            }));

            pdfPath = await ReportPdfService.generateDailyReport({
              site,
              items: itemsWithLogs,
              supervisorName: `Supervisor ${supervisorId}`,
              reportDate: new Date(),
            });
            reportPaths.push(pdfPath);

            console.log('[PDF] Generated successfully:', pdfPath);
          } catch (pdfError) {
            console.error('[PDF] Generation failed:', pdfError);
            showSnackbar('Report saved but PDF generation failed', 'warning');
            // Continue even if PDF generation fails - report still saved
          }

          // Create daily report record
          await database.collections.get('daily_reports').create((report: any) => {
            report.siteId = siteId;
            report.supervisorId = supervisorId;
            report.reportDate = startOfDay;
            report.submittedAt = new Date().getTime();
            report.totalItems = siteLogs.length;
            report.totalProgress = totalProgress;
            report.pdfPath = pdfPath;
            report.notes = `${siteLogs.length} items updated`;
            report.appSyncStatus = isOnline ? 'synced' : 'pending';
          });

          totalReportsGenerated++;
        }

        // Mark all progress logs as synced
        if (isOnline) {
          for (const log of progressLogs) {
            await log.update((l: any) => {
              l.appSyncStatus = 'synced';
            });
          }
        }
      });

      const reportDate = new Date().toLocaleDateString();
      const pdfStatus = reportPaths.length > 0 ? ` - ${reportPaths.length} PDF(s) generated` : '';
      const message = isOnline
        ? `${totalReportsGenerated} daily report(s) submitted - ${progressLogs.length} updates for ${reportDate}${pdfStatus}`
        : `${totalReportsGenerated} report(s) saved locally - ${progressLogs.length} updates for ${reportDate}${pdfStatus}`;

      showSnackbar(message, 'success');

      if (reportPaths.length > 0) {
        console.log('[PDF] Reports generated at:', reportPaths);
      }
    } catch (error) {
      console.error('Error submitting reports:', error);
      showSnackbar('Failed to submit reports: ' + (error as Error).message, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const getSyncStatusChip = () => {
    if (isSyncing) {
      return <Chip icon="sync" mode="outlined">Syncing...</Chip>;
    }
    if (isOnline) {
      return <Chip icon="cloud-check" mode="outlined" style={styles.onlineChip}>Online</Chip>;
    }
    return <Chip icon="cloud-off-outline" mode="outlined" style={styles.offlineChip}>Offline</Chip>;
  };

  // Filter sites based on selection
  const displayedSites = selectedSiteId === 'all'
    ? sites
    : sites.filter(site => site.id === selectedSiteId);

  return (
    <View style={styles.container}>
      {/* Header with sync status */}
      <View style={styles.header}>
        <Title>Daily Progress Report</Title>
        {getSyncStatusChip()}
      </View>

      {/* Site Selector */}
      <View style={styles.selectorContainer}>
        <SiteSelector />
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        {/* Sites and Items List */}
        {displayedSites.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content>
              <Paragraph>No sites assigned to you yet.</Paragraph>
            </Card.Content>
          </Card>
        ) : (
          displayedSites.map(site => {
            const siteItems = itemsWithSites.filter(
              iws => iws.item.siteId === site.id,
            );

            return (
              <Card key={site.id} style={styles.siteCard}>
                <Card.Title
                  title={site.name}
                  subtitle={site.location}
                  left={props => <IconButton {...props} icon="map-marker" />}
                />
                <Card.Content>
                  {siteItems.length === 0 ? (
                    <Paragraph style={styles.noItems}>
                      No items for this site
                    </Paragraph>
                  ) : (
                    siteItems.map(({ item }) => {
                      const progress = getProgressPercentage(item);
                      return (
                        <View key={item.id} style={styles.itemContainer}>
                          <View style={styles.itemHeader}>
                            <View style={styles.itemInfo}>
                              <Text style={styles.itemName}>{item.name}</Text>
                              <Text style={styles.itemQuantity}>
                                {item.completedQuantity.toFixed(2)} /{' '}
                                {item.plannedQuantity.toFixed(2)}{' '}
                                {item.unitOfMeasurement}
                              </Text>
                            </View>
                            <Chip
                              mode="flat"
                              style={{
                                backgroundColor: getStatusColor(item.status),
                              }}
                              textStyle={styles.statusChipText}>
                              {item.status.replace('_', ' ')}
                            </Chip>
                          </View>

                          <ProgressBar
                            progress={progress / 100}
                            color="#2196F3"
                            style={styles.progressBar}
                          />
                          <Text style={styles.progressText}>
                            {progress.toFixed(1)}% Complete
                          </Text>

                          <Button
                            mode="outlined"
                            icon="pencil"
                            onPress={() => openUpdateDialog(item)}
                            style={styles.updateButton}>
                            Update Progress
                          </Button>
                          <Divider style={styles.divider} />
                        </View>
                      );
                    })
                  )}
                </Card.Content>
              </Card>
            );
          })
        )}
      </ScrollView>

      {/* Submit All Button */}
      {items.length > 0 && (
        <View style={styles.footer}>
          <Button
            mode="contained"
            icon="upload"
            onPress={handleSubmitAllReports}
            loading={isSyncing}
            disabled={isSyncing}
            style={styles.submitButton}>
            Submit Progress Reports
          </Button>
        </View>
      )}

      {/* Update Progress Dialog */}
      <Portal>
        <Dialog visible={dialogVisible} onDismiss={closeDialog}>
          <Dialog.Title>Update Progress</Dialog.Title>
          <Dialog.Content>
            {selectedItem && (
              <>
                <Paragraph style={styles.dialogItemName}>
                  {selectedItem.name}
                </Paragraph>
                <Paragraph style={styles.dialogPlanned}>
                  Planned: {selectedItem.plannedQuantity}{' '}
                  {selectedItem.unitOfMeasurement}
                </Paragraph>

                {/* Quantity Input with +/- buttons */}
                <View style={styles.quantityInputContainer}>
                  <IconButton
                    icon="minus"
                    mode="contained"
                    onPress={() => incrementQuantity(-1)}
                    style={styles.quantityButton}
                  />
                  <TextInput
                    label="Completed Quantity"
                    value={quantityInput}
                    onChangeText={setQuantityInput}
                    keyboardType="numeric"
                    mode="outlined"
                    style={styles.quantityInput}
                  />
                  <IconButton
                    icon="plus"
                    mode="contained"
                    onPress={() => incrementQuantity(1)}
                    style={styles.quantityButton}
                  />
                </View>

                {/* Notes Input */}
                <TextInput
                  label="Notes (Optional)"
                  value={notesInput}
                  onChangeText={setNotesInput}
                  mode="outlined"
                  multiline
                  numberOfLines={3}
                  style={styles.notesInput}
                />
              </>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={closeDialog}>Cancel</Button>
            <Button onPress={handleUpdateProgress}>Save</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <ConfirmDialog
        visible={showExceedsWarning}
        title="Warning"
        message="Completed quantity exceeds planned quantity. Continue?"
        confirmText="Continue"
        cancelText="Cancel"
        onConfirm={() => {
          setShowExceedsWarning(false);
          saveProgress(pendingQuantity);
        }}
        onCancel={() => {
          setShowExceedsWarning(false);
          setPendingQuantity(0);
        }}
        destructive={false}
      />

      <ConfirmDialog
        visible={showOfflineConfirm}
        title="Offline Mode"
        message="Reports will be saved locally and synced when connection is restored."
        confirmText="Save Offline"
        cancelText="Cancel"
        onConfirm={() => {
          setShowOfflineConfirm(false);
          submitReports();
        }}
        onCancel={() => {
          setShowOfflineConfirm(false);
        }}
        destructive={false}
      />
    </View>
  );
};

// Enhance component with WatermelonDB observables
// Note: We use props to pass supervisorId from the wrapper component
const enhance = withObservables(['supervisorId'], ({ supervisorId }: { supervisorId: string }) => ({
  sites: database.collections
    .get('sites')
    .query(Q.where('supervisor_id', supervisorId)),
  items: database.collections.get('items').query(),
}));

const EnhancedDailyReportsScreen = enhance(DailyReportsScreenComponent);

// Wrapper component that provides context
const DailyReportsScreen = () => {
  const { supervisorId } = useSiteContext();
  return <EnhancedDailyReportsScreen supervisorId={supervisorId} />;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    elevation: 2,
  },
  selectorContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingBottom: 8,
    elevation: 1,
  },
  scrollView: {
    flex: 1,
  },
  siteCard: {
    margin: 16,
    marginBottom: 8,
    elevation: 2,
  },
  emptyCard: {
    margin: 16,
    elevation: 2,
  },
  noItems: {
    fontStyle: 'italic',
    color: '#666',
  },
  itemContainer: {
    marginBottom: 16,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  itemInfo: {
    flex: 1,
    marginRight: 8,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  itemQuantity: {
    fontSize: 14,
    color: '#666',
  },
  statusChipText: {
    color: 'white',
    fontSize: 12,
    textTransform: 'capitalize',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginVertical: 8,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  updateButton: {
    marginTop: 8,
  },
  divider: {
    marginTop: 16,
  },
  footer: {
    padding: 16,
    backgroundColor: 'white',
    elevation: 4,
  },
  submitButton: {
    paddingVertical: 6,
  },
  onlineChip: {
    backgroundColor: '#E8F5E9',
  },
  offlineChip: {
    backgroundColor: '#FFEBEE',
  },
  dialogItemName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  dialogPlanned: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  quantityInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  quantityButton: {
    margin: 0,
  },
  quantityInput: {
    flex: 1,
    marginHorizontal: 8,
  },
  notesInput: {
    marginTop: 8,
  },
});

export default DailyReportsScreen;
