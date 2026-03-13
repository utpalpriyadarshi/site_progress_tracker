import React, { useReducer, useEffect, useCallback, useState } from 'react';
import { logger } from '../services/LoggingService';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
} from 'react-native';
import { FAB, Card, Searchbar, Chip, Portal, Dialog, Button, TextInput, Snackbar, IconButton } from 'react-native-paper';
import { useSnackbar } from '../hooks/useSnackbar';
import { database } from '../../models/database';
import { useLogistics } from './context/LogisticsContext';
import { Q } from '@nozbe/watermelondb';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import { EmptyState } from '../components/common/EmptyState';
import { SkeletonList } from '../components/common/LoadingState';
import { ErrorDisplay } from '../components/common/ErrorDisplay';
import { useDebounce } from '../utils/performance';
import { useAccessibility } from '../utils/accessibility';

// Purchase Order state management
import {
  poManagementReducer,
  initialPOManagementState,
  type PurchaseOrder,
} from './purchase-order/state';
import { COLORS } from '../theme/colors';
import { commonStyles } from '../styles/common';


/**
 * PurchaseOrderManagementScreen (v2.12 Phase 3)
 *
 * Logistics coordinator manages Purchase Orders (POs) for procurement.
 * Links to RFQs and tracks vendor deliveries.
 *
 * Features:
 * - View all POs for selected project
 * - Filter by status, vendor
 * - Create / Edit PO (full CRUD)
 * - Vendor selector in form
 * - Quantity field per PO
 * - Update PO status (draft → issued → in_progress → delivered)
 * - Track delivery dates and amounts
 * - Link to vendors and RFQs
 */

const PurchaseOrderManagementScreen = () => {
  const {
    selectedProjectId,
    projects,
  } = useLogistics();
  const { announce } = useAccessibility();
  const { show: showSnackbar, snackbarProps } = useSnackbar();

  // Centralized state management with useReducer
  const [state, dispatch] = useReducer(poManagementReducer, initialPOManagementState);

  const [loadError, setLoadError] = useState<string | null>(null);

  // Local search state for debouncing
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(localSearchQuery, 300);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync debounced search to reducer
  useEffect(() => {
    dispatch({ type: 'SET_SEARCH_QUERY', payload: debouncedSearchQuery });
  }, [debouncedSearchQuery]);

  // Announce search results for accessibility
  useEffect(() => {
    if (debouncedSearchQuery && !state.ui.loading) {
      announce(`Found ${state.data.filteredPOs.length} purchase orders matching "${debouncedSearchQuery}"`);
    }
  }, [state.data.filteredPOs.length, debouncedSearchQuery, state.ui.loading, announce]);

  const loadVendors = useCallback(async () => {
    try {
      const vendorsCollection = database.collections.get('vendors');
      const vendorsData = await vendorsCollection.query().fetch();

      const vendorsList = vendorsData.map((vendor: any) => ({
        id: vendor.id,
        name: vendor.vendorName,
      }));

      dispatch({ type: 'SET_VENDORS', payload: vendorsList });
    } catch (error) {
      logger.error('[PO] Error loading vendors:', error as Error);
    }
  }, []);

  const loadRfqs = useCallback(async () => {
    if (!selectedProjectId) return;

    try {
      const rfqCollection = database.collections.get('rfqs');
      const rfqsData = await rfqCollection
        .query(
          Q.where('project_id', selectedProjectId),
          Q.where('rfq_type', 'procurement')
        )
        .fetch();

      const rfqsList = rfqsData.map((rfq: any) => ({
        id: rfq.id,
        rfqNumber: rfq.rfqNumber,
      }));

      dispatch({ type: 'SET_RFQS', payload: rfqsList });
    } catch (error) {
      logger.error('[PO] Error loading RFQs:', error as Error);
    }
  }, [selectedProjectId]);

  const loadPurchaseOrders = useCallback(async () => {
    if (!selectedProjectId) {
      dispatch({ type: 'STOP_LOADING' });
      return;
    }

    try {
      dispatch({ type: 'START_LOADING' });
      setLoadError(null);
      logger.info('[PO] Loading purchase orders for project:', { selectedProjectId });

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
              vendorName = (vendor as any).vendorName;
            } catch {
              logger.warn('[PO] Vendor not found for PO', { value: po.poNumber });
            }
          }

          // Parse quantity from itemsDetails JSON
          let quantity = 1;
          try {
            const items = JSON.parse(po.itemsDetails || '[]');
            if (items.length > 0 && items[0].quantity) {
              quantity = items[0].quantity;
            }
          } catch {
            // ignore parse error
          }

          return {
            id: po.id,
            poNumber: po.poNumber,
            projectId: po.projectId,
            rfqId: po.rfqId,
            vendorId: po.vendorId,
            vendorName,
            poDate: po.poDate,
            expectedDeliveryDate: po.expectedDeliveryDate,
            actualDeliveryDate: po.actualDeliveryDate,
            status: po.status,
            poValue: po.poValue,
            notes: po.notes,
            quantity,
            createdById: po.createdById,
            createdAt: po.createdAt,
          };
        })
      );

      logger.info('[PO] Loaded purchase orders:', { value: posWithVendors.length });
      dispatch({ type: 'SET_PURCHASE_ORDERS', payload: posWithVendors });
    } catch (error) {
      logger.error('[PO] Error loading purchase orders:', error as Error);
      setLoadError('Failed to load purchase orders. Check your connection and try again.');
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
          (po.notes && po.notes.toLowerCase().includes(query))
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

  // Resolve vendorId: use selected chip, or create a new vendor from typed name
  const resolveVendorId = async (): Promise<string | null> => {
    if (state.form.newVendorId) return state.form.newVendorId;
    const name = state.form.newVendorName.trim();
    if (!name) return null;
    // Create a new vendor record with the typed name
    const vendorsCollection = database.collections.get('vendors');
    let newId = '';
    await database.write(async () => {
      const newVendor = await vendorsCollection.create((record: any) => {
        record.vendorCode = `VND-${Date.now().toString().slice(-6)}`;
        record.vendorName = name;
        record.category = 'general';
        record.isApproved = true;
        record.totalOrders = 0;
        record.appSyncStatus = 'pending';
        record.version = 1;
      });
      newId = newVendor.id;
    });
    // Reload vendors list so new vendor shows in chips
    loadVendors();
    return newId;
  };

  const handleCreatePO = async () => {
    if (!state.form.newVendorId && !state.form.newVendorName.trim()) {
      showSnackbar('Please select a vendor or enter a vendor name');
      return;
    }
    if (!state.form.newTotalAmount) {
      showSnackbar('Please enter a total amount');
      return;
    }
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const vendorId = await resolveVendorId();
      if (!vendorId) {
        showSnackbar('Failed to resolve vendor');
        return;
      }

      const poCollection = database.collections.get('purchase_orders');
      const poDate = Date.now();
      const expectedDeliveryDate = poDate + (parseInt(state.form.newExpectedDeliveryDays, 10) || 30) * 24 * 60 * 60 * 1000;
      const quantity = parseInt(state.form.newQuantity, 10) || 1;
      const itemsDetails = JSON.stringify([{ quantity, unit: 'pcs' }]);

      await database.write(async () => {
        await poCollection.create((record: any) => {
          record.poNumber = generatePONumber();
          record.projectId = selectedProjectId;
          record.rfqId = state.form.newRfqId || null;
          record.vendorId = vendorId;
          record.poDate = poDate;
          record.expectedDeliveryDate = expectedDeliveryDate;
          record.status = 'draft';
          record.poValue = parseFloat(state.form.newTotalAmount) || 0;
          record.currency = 'INR';
          record.notes = state.form.newDescription || null;
          record.itemsDetails = itemsDetails;
          record.createdById = '';
          record.appSyncStatus = 'pending';
          record.version = 1;
        });
      });

      showSnackbar('Purchase Order created successfully');
      dispatch({ type: 'HIDE_CREATE_DIALOG' });
      dispatch({ type: 'RESET_FORM' });
      loadPurchaseOrders();
    } catch (error) {
      logger.error('[PO] Error creating PO:', error as Error);
      showSnackbar('Failed to create Purchase Order');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdatePO = async () => {
    if (!state.ui.editingPoId) return;
    if (!state.form.newVendorId && !state.form.newVendorName.trim()) {
      showSnackbar('Please select a vendor or enter a vendor name');
      return;
    }
    if (!state.form.newTotalAmount) {
      showSnackbar('Please enter a total amount');
      return;
    }
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const vendorId = await resolveVendorId();
      if (!vendorId) {
        showSnackbar('Failed to resolve vendor');
        return;
      }

      const poCollection = database.collections.get('purchase_orders');
      const poRecord = await poCollection.find(state.ui.editingPoId);
      const quantity = parseInt(state.form.newQuantity, 10) || 1;
      const itemsDetails = JSON.stringify([{ quantity, unit: 'pcs' }]);

      await database.write(async () => {
        await poRecord.update((record: any) => {
          record.vendorId = vendorId;
          record.rfqId = state.form.newRfqId || null;
          record.poValue = parseFloat(state.form.newTotalAmount) || 0;
          record.notes = state.form.newDescription || null;
          record.itemsDetails = itemsDetails;
          record.version = (record.version || 1) + 1;
          record.appSyncStatus = 'pending';
        });
      });

      showSnackbar('Purchase Order updated successfully');
      dispatch({ type: 'HIDE_EDIT_DIALOG' });
      dispatch({ type: 'RESET_FORM' });
      loadPurchaseOrders();
    } catch (error) {
      logger.error('[PO] Error updating PO:', error as Error);
      showSnackbar('Failed to update Purchase Order');
    } finally {
      setIsSubmitting(false);
    }
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
          record.appSyncStatus = 'pending';
        });
      });

      showSnackbar(`PO marked as ${newStatus}`);
      loadPurchaseOrders();
    } catch (error) {
      logger.error('[PO] Error updating PO status:', error as Error);
      showSnackbar('Failed to update PO status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return COLORS.DISABLED;
      case 'issued':
        return COLORS.INFO;
      case 'in_progress':
        return COLORS.WARNING;
      case 'delivered':
        return COLORS.SUCCESS;
      case 'closed':
        return COLORS.SUCCESS;
      case 'cancelled':
        return COLORS.ERROR;
      default:
        return COLORS.DISABLED;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft': return 'DRAFT';
      case 'issued': return 'ISSUED';
      case 'in_progress': return 'IN PROGRESS';
      case 'delivered': return 'DELIVERED';
      case 'closed': return 'CLOSED';
      case 'cancelled': return 'CANCELLED';
      default: return status.toUpperCase();
    }
  };

  const renderPOForm = () => (
    <ScrollView keyboardShouldPersistTaps="handled" style={styles.dialogScroll}>
      <TextInput
        label="Description / Notes"
        value={state.form.newDescription}
        onChangeText={(text) => dispatch({ type: 'SET_NEW_DESCRIPTION', payload: text })}
        style={styles.input}
        mode="outlined"
        multiline
        numberOfLines={2}
      />
      <Text style={styles.pickerLabel}>Vendor *</Text>
      <TextInput
        label="Vendor Name"
        value={state.form.newVendorName}
        onChangeText={(text) => dispatch({ type: 'SET_NEW_VENDOR_NAME', payload: text })}
        style={styles.input}
        mode="outlined"
        placeholder="Type vendor name or select below"
        right={state.form.newVendorName ? <TextInput.Icon icon="close" onPress={() => dispatch({ type: 'SET_NEW_VENDOR_NAME', payload: '' })} /> : undefined}
      />
      {state.data.vendors.length > 0 && (
        <>
          <Text style={styles.pickerLabel}>Select existing vendor:</Text>
          <View style={styles.chipRow}>
            {state.data.vendors.map((vendor) => (
              <Chip
                key={vendor.id}
                mode={state.form.newVendorId === vendor.id ? 'flat' : 'outlined'}
                selected={state.form.newVendorId === vendor.id}
                onPress={() => dispatch({ type: 'SELECT_VENDOR', payload: { id: vendor.id, name: vendor.name } })}
                style={styles.pickerChip}
                selectedColor={COLORS.PRIMARY}
                accessibilityLabel={`Select vendor: ${vendor.name}`}
                accessibilityState={{ selected: state.form.newVendorId === vendor.id }}
              >
                {vendor.name}
              </Chip>
            ))}
          </View>
        </>
      )}
      <Text style={styles.pickerLabel}>Link to RFQ (Optional)</Text>
      {state.data.rfqs.map((rfq) => (
        <Chip
          key={rfq.id}
          mode={state.form.newRfqId === rfq.id ? 'flat' : 'outlined'}
          selected={state.form.newRfqId === rfq.id}
          onPress={() => dispatch({ type: 'SET_NEW_RFQ_ID', payload: rfq.id })}
          style={styles.pickerChip}
          selectedColor={COLORS.PRIMARY}
          accessibilityLabel={`Link to RFQ: ${rfq.rfqNumber}. ${state.form.newRfqId === rfq.id ? 'Selected' : 'Not selected'}`}
          accessibilityState={{ selected: state.form.newRfqId === rfq.id }}
        >
          {rfq.rfqNumber}
        </Chip>
      ))}
      <TextInput
        label="Quantity *"
        value={state.form.newQuantity}
        onChangeText={(text) => dispatch({ type: 'SET_NEW_QUANTITY', payload: text })}
        style={styles.input}
        mode="outlined"
        keyboardType="numeric"
        placeholder="1"
      />
      <TextInput
        label="Total Amount (₹) *"
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
    </ScrollView>
  );

  const renderPOCard = ({ item }: { item: PurchaseOrder }) => (
    <Card mode="elevated" style={styles.card}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Text style={styles.poNumber}>{item.poNumber}</Text>
            <Text style={styles.vendorName}>{item.vendorName || 'Unknown Vendor'}</Text>
          </View>
          <View style={styles.cardHeaderRight}>
            <Chip
              mode="flat"
              style={[styles.statusChip, { backgroundColor: getStatusColor(item.status) }]}
              textStyle={styles.statusChipText}
              accessibilityLabel={`Status: ${item.status}`}
            >
              {getStatusLabel(item.status)}
            </Chip>
            <IconButton
              icon="pencil"
              size={20}
              iconColor={COLORS.PRIMARY}
              onPress={() => dispatch({ type: 'SHOW_EDIT_DIALOG', payload: item })}
              accessibilityLabel={`Edit PO ${item.poNumber}`}
            />
          </View>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.label}>Amount:</Text>
          <Text style={styles.value}>₹{(item.poValue || 0).toLocaleString()}</Text>
        </View>

        {(item.quantity !== undefined && item.quantity > 0) && (
          <View style={styles.detailRow}>
            <Text style={styles.label}>Quantity:</Text>
            <Text style={styles.value}>{item.quantity} pcs</Text>
          </View>
        )}

        {item.notes && (
          <View style={styles.detailRow}>
            <Text style={styles.label}>Notes:</Text>
            <Text style={styles.value}>{item.notes}</Text>
          </View>
        )}

        {!!item.poDate && (
          <View style={styles.detailRow}>
            <Text style={styles.label}>Order Date:</Text>
            <Text style={styles.value}>{new Date(item.poDate).toLocaleDateString()}</Text>
          </View>
        )}

        {!!item.expectedDeliveryDate && (
          <View style={styles.detailRow}>
            <Text style={styles.label}>Expected:</Text>
            <Text style={styles.value}>{new Date(item.expectedDeliveryDate).toLocaleDateString()}</Text>
          </View>
        )}

        {!!item.actualDeliveryDate && (
          <View style={styles.detailRow}>
            <Text style={styles.label}>Delivered:</Text>
            <Text style={styles.value}>{new Date(item.actualDeliveryDate).toLocaleDateString()}</Text>
          </View>
        )}

        <View style={styles.actionButtons}>
          {item.status === 'draft' && (
            <Button mode="contained" onPress={() => handleUpdateStatus(item.id, 'issued')} style={styles.actionButton}>
              Issue PO
            </Button>
          )}
          {item.status === 'issued' && (
            <Button
              mode="contained"
              onPress={() => handleUpdateStatus(item.id, 'in_progress')}
              style={styles.actionButton}
            >
              In Progress
            </Button>
          )}
          {item.status === 'in_progress' && (
            <Button
              mode="contained"
              onPress={() => handleUpdateStatus(item.id, 'delivered')}
              style={styles.actionButton}
            >
              Mark Delivered
            </Button>
          )}
          {item.status === 'delivered' && (
            <Button
              mode="contained"
              onPress={() => handleUpdateStatus(item.id, 'closed')}
              style={styles.actionButton}
            >
              Close PO
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

  if (loadError) {
    return <ErrorDisplay message={loadError} onRetry={loadPurchaseOrders} />;
  }

  return (
    <View style={commonStyles.screen}>
      <View style={styles.header}>
        <Text style={styles.projectName}>{selectedProject?.name || 'Project'}</Text>
        <Searchbar
          placeholder="Search purchase orders..."
          onChangeText={setLocalSearchQuery}
          value={localSearchQuery}
          style={styles.searchbar}
        />
        <View style={styles.filterRow}>
          {['draft', 'issued', 'in_progress', 'delivered', 'closed'].map((status) => (
            <Chip
              key={status}
              mode={state.filters.filterStatus === status ? 'flat' : 'outlined'}
              selected={state.filters.filterStatus === status}
              onPress={() => dispatch({ type: 'TOGGLE_FILTER_STATUS', payload: status })}
              style={styles.filterChip}
              accessibilityLabel={`Filter by ${status}. ${state.filters.filterStatus === status ? 'Selected' : 'Not selected'}`}
              accessibilityState={{ selected: state.filters.filterStatus === status }}
            >
              {getStatusLabel(status)}
            </Chip>
          ))}
        </View>
      </View>

      {state.ui.loading ? (
        <SkeletonList count={4} style={styles.listContainer} />
      ) : (
        <FlatList
          data={state.data.filteredPOs}
          renderItem={renderPOCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          contentInsetAdjustmentBehavior="automatic"
          accessibilityLabel="Purchase orders list"
          ListEmptyComponent={
            debouncedSearchQuery || state.filters.filterStatus ? (
              <EmptyState
                icon="magnify"
                title="No Matching POs"
                message={debouncedSearchQuery
                  ? `No purchase orders match "${debouncedSearchQuery}"`
                  : `No ${getStatusLabel(state.filters.filterStatus || '')} purchase orders found`}
                variant="search"
                actionText="Clear Filters"
                onAction={() => {
                  setLocalSearchQuery('');
                  dispatch({ type: 'TOGGLE_FILTER_STATUS', payload: '' });
                }}
              />
            ) : (
              <EmptyState
                icon="clipboard-text-outline"
                title="No Purchase Orders"
                message="Create your first PO to start tracking purchases."
                helpText="Purchase orders help track vendor deliveries and payments."
                actionText="Create PO"
                onAction={() => dispatch({ type: 'SHOW_CREATE_DIALOG' })}
              />
            )
          }
        />
      )}

      <FAB icon="plus" style={styles.fab} color="#FFFFFF" onPress={() => dispatch({ type: 'SHOW_CREATE_DIALOG' })} label="New PO" />

      <Portal>
        <Snackbar {...snackbarProps} duration={3000} />

        {/* Create Dialog */}
        <Dialog visible={state.ui.showCreateDialog} onDismiss={() => { dispatch({ type: 'HIDE_CREATE_DIALOG' }); dispatch({ type: 'RESET_FORM' }); }} style={styles.dialog}>
          <Dialog.Title>Create Purchase Order</Dialog.Title>
          <Dialog.Content>
            {renderPOForm()}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => { dispatch({ type: 'HIDE_CREATE_DIALOG' }); dispatch({ type: 'RESET_FORM' }); }}>
              Cancel
            </Button>
            <Button onPress={handleCreatePO} loading={isSubmitting} disabled={isSubmitting}>Create</Button>
          </Dialog.Actions>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog visible={state.ui.showEditDialog} onDismiss={() => { dispatch({ type: 'HIDE_EDIT_DIALOG' }); dispatch({ type: 'RESET_FORM' }); }} style={styles.dialog}>
          <Dialog.Title>Edit Purchase Order</Dialog.Title>
          <Dialog.Content>
            {renderPOForm()}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => { dispatch({ type: 'HIDE_EDIT_DIALOG' }); dispatch({ type: 'RESET_FORM' }); }}>
              Cancel
            </Button>
            <Button onPress={handleUpdatePO} loading={isSubmitting} disabled={isSubmitting}>Update</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
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
    paddingBottom: 100,
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
    color: COLORS.PRIMARY,
  },
  cardHeaderLeft: {
    flex: 1,
    marginRight: 8,
  },
  cardHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  vendorName: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
    color: '#333',
  },
  statusChip: {
    alignSelf: 'center',
  },
  statusChipText: {
    color: '#FFF',
    fontSize: 11,
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
  errorText: {
    fontSize: 16,
    color: COLORS.ERROR,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.PRIMARY,
  },
  dialog: {
    maxHeight: '85%',
  },
  dialogScroll: {
    maxHeight: 440,
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
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  noVendorText: {
    fontSize: 13,
    color: COLORS.TEXT_SECONDARY,
    fontStyle: 'italic',
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
