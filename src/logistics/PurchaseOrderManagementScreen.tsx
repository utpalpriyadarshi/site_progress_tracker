import React, { useReducer, useEffect, useCallback } from 'react';
import { logger } from '../services/LoggingService';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { FAB, Card, Searchbar, Chip, Portal, Dialog, Button, TextInput } from 'react-native-paper';
import { database } from '../../models/database';
import { useLogistics } from './context/LogisticsContext';
import { Q } from '@nozbe/watermelondb';
import { ErrorBoundary } from '../components/common/ErrorBoundary';

// Purchase Order state management
import {
  poManagementReducer,
  initialPOManagementState,
  type PurchaseOrder,
} from './purchase-order/state';


/**
 * PurchaseOrderManagementScreen (v2.11 Phase 3)
 *
 * Logistics coordinator manages Purchase Orders (POs) for procurement.
 * Links to RFQs and tracks vendor deliveries.
 *
 * Features:
 * - View all POs for selected project
 * - Filter by status, vendor
 * - Create new PO from RFQ
 * - Update PO status (pending, approved, received)
 * - Track delivery dates and amounts
 * - Link to vendors and RFQs
 */

const PurchaseOrderManagementScreen = () => {
  const { selectedProjectId, projects } = useLogistics();

  // Centralized state management with useReducer (replaces 13 useState hooks)
  const [state, dispatch] = useReducer(poManagementReducer, initialPOManagementState);

  const loadVendors = useCallback(async () => {
    try {
      const vendorsCollection = database.collections.get('vendors');
      const vendorsData = await vendorsCollection.query().fetch();

      const vendorsList = vendorsData.map((vendor: any) => ({
        id: vendor.id,
        name: vendor.name,
      }));

      dispatch({ type: 'SET_VENDORS', payload: vendorsList });
    } catch (error) {
      logger.error('[PO] Error loading vendors:', error);
    }
  }, []);

  const loadRfqs = useCallback(async () => {
    if (!selectedProjectId) return;

    try {
      const rfqCollection = database.collections.get('rfqs');
      const rfqsData = await rfqCollection
        .query(
          Q.where('project_id', selectedProjectId),
          Q.where('rfq_type', 'procurement') // Only procurement RFQs
        )
        .fetch();

      const rfqsList = rfqsData.map((rfq: any) => ({
        id: rfq.id,
        rfqNumber: rfq.rfqNumber,
      }));

      dispatch({ type: 'SET_RFQS', payload: rfqsList });
    } catch (error) {
      logger.error('[PO] Error loading RFQs:', error);
    }
  }, [selectedProjectId]);

  const loadPurchaseOrders = useCallback(async () => {
    if (!selectedProjectId) {
      dispatch({ type: 'STOP_LOADING' });
      return;
    }

    try {
      dispatch({ type: 'START_LOADING' });
      logger.info('[PO] Loading purchase orders for project:', selectedProjectId);

      const poCollection = database.collections.get('purchase_orders');
      const posData = await poCollection
        .query(Q.where('project_id', selectedProjectId))
        .fetch();

      // Fetch vendor names for each PO
      const posWithVendors = await Promise.all(
        posData.map(async (po: any) => {
          let vendorName = '';
          if (po.vendorId) {
            try {
              const vendor = await database.collections.get('vendors').find(po.vendorId);
              vendorName = (vendor as any).name;
            } catch (error) {
              logger.error('[PO] Vendor not found:', po.vendorId);
            }
          }

          return {
            id: po.id,
            poNumber: po.poNumber,
            projectId: po.projectId,
            rfqId: po.rfqId,
            vendorId: po.vendorId,
            vendorName,
            orderDate: po.orderDate,
            expectedDeliveryDate: po.expectedDeliveryDate,
            actualDeliveryDate: po.actualDeliveryDate,
            status: po.status,
            totalAmount: po.totalAmount,
            description: po.description,
            createdById: po.createdById,
            createdAt: po.createdAt,
          };
        })
      );

      logger.info('[PO] Loaded purchase orders:', posWithVendors.length);
      dispatch({ type: 'SET_PURCHASE_ORDERS', payload: posWithVendors });
    } catch (error) {
      logger.error('[PO] Error loading purchase orders:', error);
      Alert.alert('Error', 'Failed to load purchase orders');
    } finally {
      dispatch({ type: 'STOP_LOADING' });
    }
  }, [selectedProjectId]);

  const applyFilters = useCallback(() => {
    let filtered = [...state.data.purchaseOrders];

    // Search filter
    if (state.filters.searchQuery) {
      const query = state.filters.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (po) =>
          po.poNumber.toLowerCase().includes(query) ||
          (po.vendorName && po.vendorName.toLowerCase().includes(query)) ||
          (po.description && po.description.toLowerCase().includes(query))
      );
    }

    // Status filter
    if (state.filters.filterStatus) {
      filtered = filtered.filter((po) => po.status === state.filters.filterStatus);
    }

    dispatch({ type: 'SET_FILTERED_POS', payload: filtered });
  }, [state.data.purchaseOrders, state.filters.searchQuery, state.filters.filterStatus]);

  useEffect(() => {
    if (selectedProjectId) {
      loadPurchaseOrders();
      loadVendors();
      loadRfqs();
    }
  }, [selectedProjectId, loadPurchaseOrders, loadVendors, loadRfqs]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const generatePONumber = () => {
    const timestamp = Date.now().toString().slice(-6);
    return `PO-${timestamp}`;
  };

  const handleCreatePO = async () => {
    if (!state.form.newVendorId || !state.form.newTotalAmount) {
      Alert.alert('Validation Error', 'Please select vendor and enter amount');
      return;
    }

    try {
      const poCollection = database.collections.get('purchase_orders');
      const orderDate = Date.now();
      const expectedDeliveryDate = orderDate + (parseInt(state.form.newExpectedDeliveryDays, 10) || 30) * 24 * 60 * 60 * 1000;

      await database.write(async () => {
        await poCollection.create((record: any) => {
          record.poNumber = generatePONumber();
          record.projectId = selectedProjectId;
          record.rfqId = state.form.newRfqId || null;
          record.vendorId = state.form.newVendorId;
          record.orderDate = orderDate;
          record.expectedDeliveryDate = expectedDeliveryDate;
          record.status = 'draft';
          record.totalAmount = parseFloat(state.form.newTotalAmount);
          record.description = state.form.newDescription || null;
          record.createdById = ''; // Will be set from context
          record.appSyncStatus = 'pending';
          record.version = 1;
        });
      });

      Alert.alert('Success', 'Purchase Order created successfully');
      dispatch({ type: 'HIDE_CREATE_DIALOG' });
      dispatch({ type: 'RESET_FORM' });
      loadPurchaseOrders();
    } catch (error) {
      logger.error('[PO] Error creating PO:', error);
      Alert.alert('Error', 'Failed to create Purchase Order');
    }
  };

  const resetCreateDialog = () => {
    dispatch({ type: 'RESET_FORM' });
  };

  const handleUpdateStatus = async (poId: string, newStatus: string) => {
    try {
      const poCollection = database.collections.get('purchase_orders');
      const poRecord = await poCollection.find(poId);

      await database.write(async () => {
        await poRecord.update((record: any) => {
          record.status = newStatus;
          if (newStatus === 'delivered') {
            record.actualDeliveryDate = Date.now();
          }
        });
      });

      Alert.alert('Success', `PO marked as ${newStatus}`);
      loadPurchaseOrders();
    } catch (error) {
      logger.error('[PO] Error updating PO status:', error);
      Alert.alert('Error', 'Failed to update PO status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return '#9E9E9E';
      case 'sent':
        return '#2196F3';
      case 'acknowledged':
        return '#FF9800';
      case 'delivered':
        return '#4CAF50';
      case 'cancelled':
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };

  const renderPOCard = ({ item }: { item: PurchaseOrder }) => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.poNumber}>{item.poNumber}</Text>
            <Text style={styles.vendorName}>{item.vendorName || 'Unknown Vendor'}</Text>
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
          <Text style={styles.label}>Amount:</Text>
          <Text style={styles.value}>${(item.totalAmount || 0).toLocaleString()}</Text>
        </View>

        {item.description && (
          <View style={styles.detailRow}>
            <Text style={styles.label}>Description:</Text>
            <Text style={styles.value}>{item.description}</Text>
          </View>
        )}

        {item.orderDate && (
          <View style={styles.detailRow}>
            <Text style={styles.label}>Order Date:</Text>
            <Text style={styles.value}>{new Date(item.orderDate).toLocaleDateString()}</Text>
          </View>
        )}

        {item.expectedDeliveryDate && (
          <View style={styles.detailRow}>
            <Text style={styles.label}>Expected:</Text>
            <Text style={styles.value}>{new Date(item.expectedDeliveryDate).toLocaleDateString()}</Text>
          </View>
        )}

        {item.actualDeliveryDate && (
          <View style={styles.detailRow}>
            <Text style={styles.label}>Delivered:</Text>
            <Text style={styles.value}>{new Date(item.actualDeliveryDate).toLocaleDateString()}</Text>
          </View>
        )}

        <View style={styles.actionButtons}>
          {item.status === 'draft' && (
            <Button mode="contained" onPress={() => handleUpdateStatus(item.id, 'sent')} style={styles.actionButton}>
              Send PO
            </Button>
          )}
          {item.status === 'sent' && (
            <Button
              mode="contained"
              onPress={() => handleUpdateStatus(item.id, 'acknowledged')}
              style={styles.actionButton}
            >
              Acknowledge
            </Button>
          )}
          {item.status === 'acknowledged' && (
            <Button
              mode="contained"
              onPress={() => handleUpdateStatus(item.id, 'delivered')}
              style={styles.actionButton}
            >
              Mark Delivered
            </Button>
          )}
        </View>
      </Card.Content>
    </Card>
  );

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  if (!selectedProjectId) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Please select a project</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.projectName}>{selectedProject?.name || 'Project'}</Text>
        <Searchbar
          placeholder="Search purchase orders..."
          onChangeText={(text) => dispatch({ type: 'SET_SEARCH_QUERY', payload: text })}
          value={state.filters.searchQuery}
          style={styles.searchbar}
        />
        <View style={styles.filterRow}>
          {['draft', 'sent', 'acknowledged', 'delivered'].map((status) => (
            <Chip
              key={status}
              mode={state.filters.filterStatus === status ? 'flat' : 'outlined'}
              selected={state.filters.filterStatus === status}
              onPress={() => dispatch({ type: 'TOGGLE_FILTER_STATUS', payload: status })}
              style={styles.filterChip}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Chip>
          ))}
        </View>
      </View>

      {state.ui.loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <FlatList
          data={state.data.filteredPOs}
          renderItem={renderPOCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No Purchase Orders found</Text>
              <Text style={styles.emptySubtext}>Create your first PO to get started</Text>
            </View>
          }
        />
      )}

      <FAB icon="plus" style={styles.fab} onPress={() => dispatch({ type: 'SHOW_CREATE_DIALOG' })} label="New PO" />

      {/* Create Dialog */}
      <Portal>
        <Dialog visible={state.ui.showCreateDialog} onDismiss={() => dispatch({ type: 'HIDE_CREATE_DIALOG' })} style={styles.dialog}>
          <Dialog.Title>Create Purchase Order</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Description"
              value={state.form.newDescription}
              onChangeText={(text) => dispatch({ type: 'SET_NEW_DESCRIPTION', payload: text })}
              style={styles.input}
              mode="outlined"
              multiline
              numberOfLines={2}
            />
            <Text style={styles.pickerLabel}>Vendor *</Text>
            {state.data.vendors.map((vendor) => (
              <Chip
                key={vendor.id}
                mode={state.form.newVendorId === vendor.id ? 'flat' : 'outlined'}
                selected={state.form.newVendorId === vendor.id}
                onPress={() => dispatch({ type: 'SET_NEW_VENDOR_ID', payload: vendor.id })}
                style={styles.pickerChip}
              >
                {vendor.name}
              </Chip>
            ))}
            <Text style={styles.pickerLabel}>Link to RFQ (Optional)</Text>
            {state.data.rfqs.map((rfq) => (
              <Chip
                key={rfq.id}
                mode={state.form.newRfqId === rfq.id ? 'flat' : 'outlined'}
                selected={state.form.newRfqId === rfq.id}
                onPress={() => dispatch({ type: 'SET_NEW_RFQ_ID', payload: rfq.id })}
                style={styles.pickerChip}
              >
                {rfq.rfqNumber}
              </Chip>
            ))}
            <TextInput
              label="Total Amount *"
              value={state.form.newTotalAmount}
              onChangeText={(text) => dispatch({ type: 'SET_NEW_TOTAL_AMOUNT', payload: text })}
              style={styles.input}
              mode="outlined"
              keyboardType="numeric"
              placeholder="0.00"
            />
            <TextInput
              label="Expected Delivery (Days)"
              value={state.form.newExpectedDeliveryDays}
              onChangeText={(text) => dispatch({ type: 'SET_NEW_EXPECTED_DELIVERY_DAYS', payload: text })}
              style={styles.input}
              mode="outlined"
              keyboardType="numeric"
              placeholder="30"
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              onPress={() => {
                dispatch({ type: 'HIDE_CREATE_DIALOG' });
                resetCreateDialog();
              }}
            >
              Cancel
            </Button>
            <Button onPress={handleCreatePO}>Create</Button>
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
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    marginRight: 8,
    marginBottom: 8,
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
  poNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  vendorName: {
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
    width: 100,
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
  pickerLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
    marginTop: 8,
  },
  pickerChip: {
    marginRight: 8,
    marginBottom: 8,
  },
});

// Wrap with ErrorBoundary for graceful error handling
const PurchaseOrderManagementScreenWithBoundary = () => (
  <ErrorBoundary name="Logistics - PurchaseOrderManagementScreen">
    <PurchaseOrderManagementScreen />
  </ErrorBoundary>
);

export default PurchaseOrderManagementScreenWithBoundary;
