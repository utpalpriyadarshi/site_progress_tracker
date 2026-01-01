import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { FAB, Card, Searchbar, Chip, Portal, Dialog, Button, TextInput } from 'react-native-paper';
import { database } from '../../models/database';
import { useDesignEngineerContext } from './context/DesignEngineerContext';
import { Q } from '@nozbe/watermelondb';
import { logger } from '../services/LoggingService';

/**
 * DesignRfqManagementScreen (v2.11)
 *
 * Design Engineer creates and manages Design RFQs (pre-PM200 engineering phase).
 * These are distinct from Procurement RFQs (handled by Logistics).
 *
 * Features:
 * - View all Design RFQs for engineer's project
 * - Filter by DOORS package, status
 * - Create new Design RFQ linked to DOORS package
 * - Issue RFQ to vendors
 * - Track vendor quotes
 * - Evaluate and award RFQs
 * - View RFQ details and timeline
 */

interface DesignRfq {
  id: string;
  rfqNumber: string;
  doorsId: string;
  doorsPackageId: string;
  projectId: string;
  title: string;
  description?: string;
  status: string;
  rfqType: string;
  issueDate?: number;
  closingDate?: number;
  evaluationDate?: number;
  awardDate?: number;
  expectedDeliveryDays?: number;
  totalVendorsInvited: number;
  totalQuotesReceived: number;
  winningVendorId?: string;
  awardedValue?: number;
  createdById: string;
  createdAt: Date;
}

const DesignRfqManagementScreen = () => {
  const { projectId, projectName, refreshTrigger } = useDesignEngineerContext();
  const [rfqs, setRfqs] = useState<DesignRfq[]>([]);
  const [filteredRfqs, setFilteredRfqs] = useState<DesignRfq[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [doorsPackages, setDoorsPackages] = useState<Array<{ id: string; doorsId: string }>>([]);

  // Create dialog state
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newDoorsPackageId, setNewDoorsPackageId] = useState('');
  const [newExpectedDeliveryDays, setNewExpectedDeliveryDays] = useState('30');

  useEffect(() => {
    loadRfqs();
    loadDoorsPackages();
  }, [projectId, refreshTrigger]);

  useEffect(() => {
    applyFilters();
  }, [rfqs, searchQuery, filterStatus]);

  const loadDoorsPackages = async () => {
    if (!projectId) return;

    try {
      const doorsCollection = database.collections.get('doors_packages');
      const packagesData = await doorsCollection
        .query(Q.where('project_id', projectId))
        .fetch();

      const packagesList = packagesData.map((pkg: any) => ({
        id: pkg.id,
        doorsId: pkg.doorsId,
      }));

      setDoorsPackages(packagesList);
    } catch (error) {
      logger.error('[DesignRfq] Error loading DOORS packages:', error);
    }
  };

  const loadRfqs = async () => {
    if (!projectId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      logger.info('[DesignRfq] Loading Design RFQs for project:', projectId);

      const rfqCollection = database.collections.get('rfqs');
      const rfqsData = await rfqCollection
        .query(
          Q.where('project_id', projectId),
          Q.where('rfq_type', 'design') // Only Design RFQs
        )
        .fetch();

      const rfqsList = rfqsData.map((rfq: any) => ({
        id: rfq.id,
        rfqNumber: rfq.rfqNumber,
        doorsId: rfq.doorsId,
        doorsPackageId: rfq.doorsPackageId,
        projectId: rfq.projectId,
        title: rfq.title,
        description: rfq.description,
        status: rfq.status,
        rfqType: rfq.rfqType,
        issueDate: rfq.issueDate,
        closingDate: rfq.closingDate,
        evaluationDate: rfq.evaluationDate,
        awardDate: rfq.awardDate,
        expectedDeliveryDays: rfq.expectedDeliveryDays,
        totalVendorsInvited: rfq.totalVendorsInvited,
        totalQuotesReceived: rfq.totalQuotesReceived,
        winningVendorId: rfq.winningVendorId,
        awardedValue: rfq.awardedValue,
        createdById: rfq.createdById,
        createdAt: rfq.createdAt,
      }));

      logger.debug('[DesignRfq] Loaded RFQs:', rfqsList.length);
      setRfqs(rfqsList);
    } catch (error) {
      logger.error('[DesignRfq] Error loading RFQs:', error);
      Alert.alert('Error', 'Failed to load Design RFQs');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...rfqs];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (rfq) =>
          rfq.rfqNumber.toLowerCase().includes(query) ||
          rfq.title.toLowerCase().includes(query) ||
          rfq.doorsId.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (filterStatus) {
      filtered = filtered.filter((rfq) => rfq.status === filterStatus);
    }

    setFilteredRfqs(filtered);
  };

  const generateRfqNumber = () => {
    const timestamp = Date.now().toString().slice(-6);
    return `DRFQ-${timestamp}`;
  };

  const handleCreateRfq = async () => {
    if (!newTitle || !newDoorsPackageId) {
      Alert.alert('Validation Error', 'Please fill in all required fields');
      return;
    }

    try {
      const rfqCollection = database.collections.get('rfqs');
      const selectedPackage = doorsPackages.find((p) => p.id === newDoorsPackageId);

      if (!selectedPackage) {
        Alert.alert('Error', 'Selected DOORS package not found');
        return;
      }

      await database.write(async () => {
        await rfqCollection.create((record: any) => {
          record.rfqNumber = generateRfqNumber();
          record.doorsId = selectedPackage.doorsId;
          record.doorsPackageId = newDoorsPackageId;
          record.projectId = projectId;
          record.title = newTitle;
          record.description = newDescription || null;
          record.status = 'draft';
          record.rfqType = 'design'; // Design RFQ type
          record.expectedDeliveryDays = parseInt(newExpectedDeliveryDays) || 30;
          record.totalVendorsInvited = 0;
          record.totalQuotesReceived = 0;
          record.createdById = ''; // Will be set from context
          record.appSyncStatus = 'pending';
          record.version = 1;
        });
      });

      Alert.alert('Success', 'Design RFQ created successfully');
      setShowCreateDialog(false);
      resetCreateDialog();
      loadRfqs();
    } catch (error) {
      logger.error('[DesignRfq] Error creating RFQ:', error);
      Alert.alert('Error', 'Failed to create Design RFQ');
    }
  };

  const resetCreateDialog = () => {
    setNewTitle('');
    setNewDescription('');
    setNewDoorsPackageId('');
    setNewExpectedDeliveryDays('30');
  };

  const handleIssueRfq = async (rfqId: string) => {
    try {
      const rfqCollection = database.collections.get('rfqs');
      const rfqRecord = await rfqCollection.find(rfqId);

      await database.write(async () => {
        await rfqRecord.update((record: any) => {
          record.status = 'issued';
          record.issueDate = Date.now();
        });
      });

      Alert.alert('Success', 'RFQ issued successfully');
      loadRfqs();
    } catch (error) {
      logger.error('[DesignRfq] Error issuing RFQ:', error);
      Alert.alert('Error', 'Failed to issue RFQ');
    }
  };

  const handleMarkQuotesReceived = async (rfqId: string) => {
    try {
      const rfqCollection = database.collections.get('rfqs');
      const rfqRecord = await rfqCollection.find(rfqId);

      await database.write(async () => {
        await rfqRecord.update((record: any) => {
          record.status = 'quotes_received';
        });
      });

      Alert.alert('Success', 'Marked as quotes received');
      loadRfqs();
    } catch (error) {
      logger.error('[DesignRfq] Error updating RFQ:', error);
      Alert.alert('Error', 'Failed to update RFQ');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return '#9E9E9E';
      case 'issued':
        return '#2196F3';
      case 'quotes_received':
        return '#FF9800';
      case 'evaluated':
        return '#9C27B0';
      case 'awarded':
        return '#4CAF50';
      case 'cancelled':
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };

  const renderRfqCard = ({ item }: { item: DesignRfq }) => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.rfqNumber}>{item.rfqNumber}</Text>
            <Text style={styles.rfqTitle}>{item.title}</Text>
          </View>
          <Chip
            mode="flat"
            style={[styles.statusChip, { backgroundColor: getStatusColor(item.status) }]}
            textStyle={styles.statusChipText}
          >
            {item.status.toUpperCase()}
          </Chip>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.label}>DOORS ID:</Text>
          <Text style={styles.value}>{item.doorsId}</Text>
        </View>

        {item.description && (
          <View style={styles.detailRow}>
            <Text style={styles.label}>Description:</Text>
            <Text style={styles.value}>{item.description}</Text>
          </View>
        )}

        <View style={styles.detailRow}>
          <Text style={styles.label}>Type:</Text>
          <Text style={styles.value}>Design RFQ</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.label}>Expected Delivery:</Text>
          <Text style={styles.value}>{item.expectedDeliveryDays} days</Text>
        </View>

        {item.issueDate && (
          <View style={styles.detailRow}>
            <Text style={styles.label}>Issue Date:</Text>
            <Text style={styles.value}>{new Date(item.issueDate).toLocaleDateString()}</Text>
          </View>
        )}

        {item.closingDate && (
          <View style={styles.detailRow}>
            <Text style={styles.label}>Closing Date:</Text>
            <Text style={styles.value}>{new Date(item.closingDate).toLocaleDateString()}</Text>
          </View>
        )}

        <View style={styles.detailRow}>
          <Text style={styles.label}>Vendors Invited:</Text>
          <Text style={styles.value}>{item.totalVendorsInvited}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.label}>Quotes Received:</Text>
          <Text style={styles.value}>{item.totalQuotesReceived}</Text>
        </View>

        {item.awardedValue && (
          <View style={styles.detailRow}>
            <Text style={styles.label}>Awarded Value:</Text>
            <Text style={styles.value}>${item.awardedValue.toLocaleString()}</Text>
          </View>
        )}

        <View style={styles.actionButtons}>
          {item.status === 'draft' && (
            <Button mode="contained" onPress={() => handleIssueRfq(item.id)} style={styles.actionButton}>
              Issue RFQ
            </Button>
          )}
          {item.status === 'issued' && (
            <Button mode="contained" onPress={() => handleMarkQuotesReceived(item.id)} style={styles.actionButton}>
              Quotes Received
            </Button>
          )}
        </View>
      </Card.Content>
    </Card>
  );

  if (!projectId) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>No project assigned</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.projectName}>{projectName}</Text>
        <Searchbar
          placeholder="Search Design RFQs..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />
        <View style={styles.filterRow}>
          <Chip
            mode={filterStatus ? 'flat' : 'outlined'}
            selected={filterStatus !== null}
            onPress={() => setFilterStatus(filterStatus === 'draft' ? null : 'draft')}
            style={styles.filterChip}
          >
            {filterStatus === 'draft' ? 'Clear Draft' : 'Draft'}
          </Chip>
          <Chip
            mode={filterStatus ? 'flat' : 'outlined'}
            selected={filterStatus !== null}
            onPress={() => setFilterStatus(filterStatus === 'issued' ? null : 'issued')}
            style={styles.filterChip}
          >
            {filterStatus === 'issued' ? 'Clear Issued' : 'Issued'}
          </Chip>
          <Chip
            mode={filterStatus ? 'flat' : 'outlined'}
            selected={filterStatus !== null}
            onPress={() => setFilterStatus(filterStatus === 'awarded' ? null : 'awarded')}
            style={styles.filterChip}
          >
            {filterStatus === 'awarded' ? 'Clear Awarded' : 'Awarded'}
          </Chip>
        </View>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <FlatList
          data={filteredRfqs}
          renderItem={renderRfqCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No Design RFQs found</Text>
              <Text style={styles.emptySubtext}>Create your first Design RFQ to get started</Text>
            </View>
          }
        />
      )}

      <FAB icon="plus" style={styles.fab} onPress={() => setShowCreateDialog(true)} label="New Design RFQ" />

      {/* Create Dialog */}
      <Portal>
        <Dialog visible={showCreateDialog} onDismiss={() => setShowCreateDialog(false)} style={styles.dialog}>
          <Dialog.Title>Create Design RFQ</Dialog.Title>
          <Dialog.ScrollArea>
            <ScrollView>
              <Dialog.Content>
                <TextInput
                  label="RFQ Title *"
                  value={newTitle}
                  onChangeText={setNewTitle}
                  style={styles.input}
                  mode="outlined"
                  placeholder="e.g., Design review for equipment X"
                />
                <TextInput
                  label="Description"
                  value={newDescription}
                  onChangeText={setNewDescription}
                  style={styles.input}
                  mode="outlined"
                  multiline
                  numberOfLines={3}
                  placeholder="Enter detailed description..."
                />
                <View style={styles.pickerContainer}>
                  <Text style={styles.pickerLabel}>DOORS Package *</Text>
                  <ScrollView style={styles.pickerScroll} horizontal showsHorizontalScrollIndicator={false}>
                    {doorsPackages.map((pkg) => (
                      <Chip
                        key={pkg.id}
                        mode={newDoorsPackageId === pkg.id ? 'flat' : 'outlined'}
                        selected={newDoorsPackageId === pkg.id}
                        onPress={() => setNewDoorsPackageId(pkg.id)}
                        style={styles.pickerChip}
                      >
                        {pkg.doorsId}
                      </Chip>
                    ))}
                  </ScrollView>
                </View>
                <TextInput
                  label="Expected Delivery Days"
                  value={newExpectedDeliveryDays}
                  onChangeText={setNewExpectedDeliveryDays}
                  style={styles.input}
                  mode="outlined"
                  keyboardType="numeric"
                  placeholder="30"
                />
                <Text style={styles.infoText}>
                  Design RFQs are used during the engineering phase (pre-PM200) to request design services or
                  technical specifications from vendors.
                </Text>
              </Dialog.Content>
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button
              onPress={() => {
                setShowCreateDialog(false);
                resetCreateDialog();
              }}
            >
              Cancel
            </Button>
            <Button onPress={handleCreateRfq}>Create</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#FFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  projectName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  searchbar: {
    marginBottom: 12,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    marginRight: 8,
  },
  listContainer: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  rfqNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  rfqTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 4,
  },
  statusChip: {
    height: 28,
  },
  statusChipText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: '#666',
    width: 140,
    fontWeight: '600',
  },
  value: {
    fontSize: 14,
    color: '#000',
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    gap: 8,
  },
  actionButton: {
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#BBB',
  },
  errorText: {
    fontSize: 16,
    color: '#F44336',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#007AFF',
  },
  dialog: {
    maxHeight: '80%',
  },
  input: {
    marginBottom: 12,
  },
  pickerContainer: {
    marginBottom: 12,
  },
  pickerLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  pickerScroll: {
    flexDirection: 'row',
  },
  pickerChip: {
    marginRight: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 8,
    lineHeight: 18,
  },
});

export default DesignRfqManagementScreen;
