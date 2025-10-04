import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
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
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ItemModel | null>(null);
  const [quantityInput, setQuantityInput] = useState('');
  const [notesInput, setNotesInput] = useState('');
  const [dialogVisible, setDialogVisible] = useState(false);
  const [itemsWithSites, setItemsWithSites] = useState<ItemWithSite[]>([]);

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

  // Map items to their site names
  useEffect(() => {
    const mapItemsToSites = async () => {
      const mapped: ItemWithSite[] = [];
      for (const item of items) {
        const site = sites.find(s => s.id === item.siteId);
        mapped.push({
          item,
          siteName: site?.name || 'Unknown Site',
        });
      }
      setItemsWithSites(mapped);
    };

    mapItemsToSites();
  }, [items, sites]);

  const onRefresh = async () => {
    setRefreshing(true);
    // In a real app, this would trigger a sync with the server
    setTimeout(() => setRefreshing(false), 1000);
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
      Alert.alert(
        'Warning',
        'Completed quantity exceeds planned quantity. Continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Continue', onPress: () => saveProgress(newQuantity) },
        ],
      );
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

        // Create a progress log entry
        try {
          await database.collections
            .get('progress_logs')
            .create((log: any) => {
              log.itemId = selectedItem.id;
              log.date = new Date().getTime(); // Convert to timestamp
              log.completedQuantity = newQuantity;
              log.reportedBy = 'supervisor-1'; // In real app, use actual user ID
              log.photos = '[]';
              log.notes = notesInput || '';
              log.syncStatusField = isOnline ? 'synced' : 'pending';
            });
          console.log('Progress log created successfully');
        } catch (logError) {
          console.error('Error creating progress log:', logError);
          throw logError;
        }
      });

      Alert.alert(
        'Success',
        `Progress updated ${isOnline ? 'and synced' : 'locally (will sync when online)'}`,
      );
      closeDialog();
    } catch (error) {
      console.error('Error updating progress (outer):', error);
      console.error('Error stack:', (error as any).stack);
      Alert.alert(
        'Error',
        'Failed to update progress: ' + (error as Error).message,
      );
    }
  };

  const handleSubmitAllReports = async () => {
    if (!isOnline) {
      Alert.alert(
        'Offline Mode',
        'Reports will be saved locally and synced when connection is restored.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Save Offline', onPress: () => submitReports() },
        ],
      );
    } else {
      await submitReports();
    }
  };

  const submitReports = async () => {
    setIsSyncing(true);
    try {
      // In a real app, this would sync all pending progress logs to the server
      const progressLogs = await database.collections
        .get('progress_logs')
        .query(Q.where('sync_status', 'pending'))
        .fetch();

      // Simulate sync process
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (isOnline) {
        // Mark all as synced
        await database.write(async () => {
          for (const log of progressLogs) {
            await log.update((l: any) => {
              l.syncStatusField = 'synced';
            });
          }
        });
      }

      Alert.alert(
        'Success',
        isOnline
          ? `${progressLogs.length} report(s) submitted successfully`
          : `${progressLogs.length} report(s) saved offline`,
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to submit reports: ' + (error as Error).message);
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

  return (
    <View style={styles.container}>
      {/* Header with sync status */}
      <View style={styles.header}>
        <Title>Daily Progress Report</Title>
        {getSyncStatusChip()}
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        {/* Sites and Items List */}
        {sites.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content>
              <Paragraph>No sites assigned to you yet.</Paragraph>
            </Card.Content>
          </Card>
        ) : (
          sites.map(site => {
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
    </View>
  );
};

// Enhance component with WatermelonDB observables
const enhance = withObservables([], () => ({
  sites: database.collections
    .get('sites')
    .query(Q.where('supervisor_id', 'supervisor-1')), // In real app, use actual user ID
  items: database.collections.get('items').query(),
}));

const DailyReportsScreen = enhance(DailyReportsScreenComponent);

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
