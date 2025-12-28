import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Alert,
  ActivityIndicator,
  ScrollView,
  Platform,
} from 'react-native';
import { FAB, Card, Searchbar, Chip, Menu, Portal, Dialog, Button, TextInput } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { database } from '../../models/database';
import { useCommercial } from './context/CommercialContext';
import { Q } from '@nozbe/watermelondb';
import { useAuth } from '../auth/AuthContext';
import { logger } from '../services/LoggingService';

/**
 * InvoiceManagementScreen (v2.11 Phase 5 - Sprint 6)
 *
 * Commercial Manager manages project invoices and payment tracking.
 *
 * Features:
 * - View all invoices for the project
 * - Filter by payment status (Pending, Paid, Overdue)
 * - Create new invoices
 * - Edit/Delete invoices
 * - Mark invoices as paid
 * - Track payment dates
 * - Invoice aging report (overdue highlighting)
 * - Link to Purchase Orders
 */

interface Invoice {
  id: string;
  projectId: string;
  poId: string;
  invoiceNumber: string;
  invoiceDate: number;
  amount: number;
  paymentStatus: string;
  paymentDate?: number;
  vendorId: string;
  vendorName?: string;
  createdBy: string;
  createdAt: number;
}

const PAYMENT_STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' },
  { value: 'overdue', label: 'Overdue' },
];

const InvoiceManagementScreen = () => {
  const { projectId, projectName, selectedInvoiceStatus, setSelectedInvoiceStatus, refreshTrigger } = useCommercial();
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);

  // Form state
  const [formInvoiceNumber, setFormInvoiceNumber] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formPoId, setFormPoId] = useState('');
  const [formVendorName, setFormVendorName] = useState('');
  const [formInvoiceDate, setFormInvoiceDate] = useState<Date>(new Date());
  const [formPaymentDate, setFormPaymentDate] = useState<Date | undefined>(undefined);
  const [formPaymentStatus, setFormPaymentStatus] = useState('pending');
  const [showInvoiceDatePicker, setShowInvoiceDatePicker] = useState(false);
  const [showPaymentDatePicker, setShowPaymentDatePicker] = useState(false);

  const loadInvoices = useCallback(async () => {
    if (!projectId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      logger.debug('[Invoice] Loading invoices for project:', projectId);

      const invoicesCollection = database.collections.get('invoices');
      const invoicesData = await invoicesCollection
        .query(Q.where('project_id', projectId), Q.sortBy('invoice_date', Q.desc))
        .fetch();

      // Map invoices with vendor names (now stored directly)
      const invoicesWithVendors = invoicesData.map((invoice: any) => {
        // Calculate if overdue (pending and past invoice date + 30 days)
        const today = Date.now();
        const dueDate = invoice.invoiceDate + (30 * 24 * 60 * 60 * 1000); // 30 days after invoice date
        const isOverdue = invoice.paymentStatus === 'pending' && today > dueDate;

        return {
          id: invoice.id,
          projectId: invoice.projectId,
          poId: invoice.poId,
          invoiceNumber: invoice.invoiceNumber,
          invoiceDate: invoice.invoiceDate,
          amount: invoice.amount,
          paymentStatus: isOverdue ? 'overdue' : invoice.paymentStatus,
          paymentDate: invoice.paymentDate,
          vendorId: invoice.vendorId,
          vendorName: invoice.vendorName || 'Unknown Vendor',
          createdBy: invoice.createdBy,
          createdAt: invoice.createdAt,
        };
      });

      logger.debug('[Invoice] Loaded invoices:', invoicesWithVendors.length);
      setInvoices(invoicesWithVendors);
    } catch (error) {
      logger.error('[Invoice] Error loading invoices:', error);
      Alert.alert('Error', 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const applyFilters = useCallback(() => {
    let filtered = [...invoices];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (invoice) =>
          invoice.invoiceNumber.toLowerCase().includes(query) ||
          invoice.poId.toLowerCase().includes(query) ||
          (invoice.vendorName && invoice.vendorName.toLowerCase().includes(query))
      );
    }

    // Status filter
    if (selectedInvoiceStatus) {
      filtered = filtered.filter((invoice) => invoice.paymentStatus === selectedInvoiceStatus);
    }

    setFilteredInvoices(filtered);
  }, [invoices, searchQuery, selectedInvoiceStatus]);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices, refreshTrigger]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const handleCreateInvoice = async () => {
    if (!formInvoiceNumber.trim()) {
      Alert.alert('Validation Error', 'Please enter an invoice number');
      return;
    }

    if (!formPoId.trim()) {
      Alert.alert('Validation Error', 'Please enter a PO number');
      return;
    }

    if (!formVendorName.trim()) {
      Alert.alert('Validation Error', 'Please enter a vendor name');
      return;
    }

    const amount = parseFloat(formAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid amount');
      return;
    }

    try {
      const invoicesCollection = database.collections.get('invoices');

      await database.write(async () => {
        await invoicesCollection.create((record: any) => {
          record.projectId = projectId;
          record.poId = formPoId.trim();
          record.invoiceNumber = formInvoiceNumber.trim();
          record.invoiceDate = formInvoiceDate.getTime();
          record.amount = amount;
          record.paymentStatus = formPaymentStatus;
          record.paymentDate = formPaymentDate ? formPaymentDate.getTime() : null;
          record.vendorId = ''; // No longer using vendorId
          record.vendorName = formVendorName.trim();
          record.createdBy = user?.userId || '';
          record.appSyncStatus = 'pending';
          record.version = 1;
        });
      });

      Alert.alert('Success', 'Invoice created successfully');
      setShowCreateDialog(false);
      resetForm();
      loadInvoices();
    } catch (error) {
      logger.error('[Invoice] Error creating invoice:', error);
      Alert.alert('Error', 'Failed to create invoice');
    }
  };

  const handleEditInvoice = async () => {
    if (!editingInvoice || !formInvoiceNumber.trim()) {
      Alert.alert('Validation Error', 'Please enter an invoice number');
      return;
    }

    if (!formPoId.trim()) {
      Alert.alert('Validation Error', 'Please enter a PO number');
      return;
    }

    if (!formVendorName.trim()) {
      Alert.alert('Validation Error', 'Please enter a vendor name');
      return;
    }

    const amount = parseFloat(formAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid amount');
      return;
    }

    try {
      const invoicesCollection = database.collections.get('invoices');
      const invoiceRecord = await invoicesCollection.find(editingInvoice.id);

      await database.write(async () => {
        await invoiceRecord.update((record: any) => {
          record.poId = formPoId.trim();
          record.invoiceNumber = formInvoiceNumber.trim();
          record.invoiceDate = formInvoiceDate.getTime();
          record.amount = amount;
          record.paymentStatus = formPaymentStatus;
          record.paymentDate = formPaymentDate ? formPaymentDate.getTime() : null;
          record.vendorId = ''; // No longer using vendorId
          record.vendorName = formVendorName.trim();
          record.appSyncStatus = 'pending';
        });
      });

      Alert.alert('Success', 'Invoice updated successfully');
      setShowEditDialog(false);
      setEditingInvoice(null);
      resetForm();
      loadInvoices();
    } catch (error) {
      logger.error('[Invoice] Error updating invoice:', error);
      Alert.alert('Error', 'Failed to update invoice');
    }
  };

  const handleDeleteInvoice = (invoice: Invoice) => {
    Alert.alert(
      'Delete Invoice',
      `Are you sure you want to delete invoice ${invoice.invoiceNumber}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const invoicesCollection = database.collections.get('invoices');
              const invoiceRecord = await invoicesCollection.find(invoice.id);

              await database.write(async () => {
                await invoiceRecord.markAsDeleted();
              });

              Alert.alert('Success', 'Invoice deleted successfully');
              loadInvoices();
            } catch (error) {
              logger.error('[Invoice] Error deleting invoice:', error);
              Alert.alert('Error', 'Failed to delete invoice');
            }
          },
        },
      ]
    );
  };

  const handleMarkAsPaid = (invoice: Invoice) => {
    Alert.alert(
      'Mark as Paid',
      `Mark invoice ${invoice.invoiceNumber} as paid?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark Paid',
          onPress: async () => {
            try {
              const invoicesCollection = database.collections.get('invoices');
              const invoiceRecord = await invoicesCollection.find(invoice.id);

              await database.write(async () => {
                await invoiceRecord.update((record: any) => {
                  record.paymentStatus = 'paid';
                  record.paymentDate = Date.now();
                  record.appSyncStatus = 'pending';
                });
              });

              Alert.alert('Success', 'Invoice marked as paid');
              loadInvoices();
            } catch (error) {
              logger.error('[Invoice] Error marking invoice as paid:', error);
              Alert.alert('Error', 'Failed to mark invoice as paid');
            }
          },
        },
      ]
    );
  };

  const openEditDialog = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setFormInvoiceNumber(invoice.invoiceNumber);
    setFormAmount(invoice.amount.toString());
    setFormPoId(invoice.poId);
    setFormVendorName(invoice.vendorName || '');
    setFormInvoiceDate(new Date(invoice.invoiceDate));
    setFormPaymentDate(invoice.paymentDate ? new Date(invoice.paymentDate) : undefined);
    setFormPaymentStatus(invoice.paymentStatus === 'overdue' ? 'pending' : invoice.paymentStatus);
    setShowEditDialog(true);
  };

  const resetForm = () => {
    setFormInvoiceNumber('');
    setFormAmount('');
    setFormPoId('');
    setFormVendorName('');
    setFormInvoiceDate(new Date());
    setFormPaymentDate(undefined);
    setFormPaymentStatus('pending');
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: '#FFA500',
      paid: '#4CAF50',
      overdue: '#ff6b6b',
    };
    return colors[status] || '#757575';
  };

  const getStatusLabel = (status: string) => {
    const stat = PAYMENT_STATUSES.find((s) => s.value === status);
    return stat ? stat.label : status;
  };

  const renderInvoiceCard = ({ item }: { item: Invoice }) => {
    const isOverdue = item.paymentStatus === 'overdue';
    const isPaid = item.paymentStatus === 'paid';

    return (
      <Card style={styles.invoiceCard}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.invoiceNumber}>Invoice #{item.invoiceNumber}</Text>
              <Text style={styles.vendorName}>{item.vendorName}</Text>
            </View>
            <Chip
              style={[styles.statusChip, { backgroundColor: getStatusColor(item.paymentStatus) }]}
              textStyle={styles.statusChipText}
            >
              {getStatusLabel(item.paymentStatus)}
            </Chip>
          </View>

          <View style={styles.detailsContainer}>
            <View style={styles.detailsRow}>
              <Text style={styles.detailLabel}>Amount:</Text>
              <Text style={styles.detailValue}>${item.amount.toLocaleString()}</Text>
            </View>

            <View style={styles.detailsRow}>
              <Text style={styles.detailLabel}>PO #:</Text>
              <Text style={styles.detailValue}>{item.poId}</Text>
            </View>

            <View style={styles.detailsRow}>
              <Text style={styles.detailLabel}>Invoice Date:</Text>
              <Text style={styles.detailValue}>{new Date(item.invoiceDate).toLocaleDateString()}</Text>
            </View>

            {item.paymentDate && (
              <View style={styles.detailsRow}>
                <Text style={styles.detailLabel}>Payment Date:</Text>
                <Text style={styles.detailValue}>{new Date(item.paymentDate).toLocaleDateString()}</Text>
              </View>
            )}

            {isOverdue && (
              <Chip mode="flat" style={styles.overdueChip} textStyle={styles.overdueChipText}>
                ⚠️ OVERDUE
              </Chip>
            )}
          </View>

          <View style={styles.cardActions}>
            {!isPaid && (
              <Button
                mode="text"
                onPress={() => handleMarkAsPaid(item)}
                compact
                textColor="#4CAF50"
              >
                Mark Paid
              </Button>
            )}
            <Button
              mode="text"
              onPress={() => openEditDialog(item)}
              compact
              textColor="#007AFF"
            >
              Edit
            </Button>
            <Button
              mode="text"
              onPress={() => handleDeleteInvoice(item)}
              compact
              textColor="#ff6b6b"
            >
              Delete
            </Button>
          </View>

          <Text style={styles.timestamp}>
            Created: {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </Card.Content>
      </Card>
    );
  };

  const renderInvoiceForm = () => (
    <ScrollView style={styles.dialogContent}>
      <TextInput
        label="Invoice Number *"
        value={formInvoiceNumber}
        onChangeText={setFormInvoiceNumber}
        mode="outlined"
        style={styles.input}
      />

      <TextInput
        label="Purchase Order # *"
        value={formPoId}
        onChangeText={setFormPoId}
        mode="outlined"
        style={styles.input}
      />

      <TextInput
        label="Vendor Name *"
        value={formVendorName}
        onChangeText={setFormVendorName}
        mode="outlined"
        style={styles.input}
        placeholder="Enter vendor name"
      />

      <TextInput
        label="Amount *"
        value={formAmount}
        onChangeText={setFormAmount}
        keyboardType="numeric"
        mode="outlined"
        style={styles.input}
        left={<TextInput.Affix text="$" />}
      />

      <Text style={styles.dialogLabel}>Invoice Date *</Text>
      <Button
        mode="outlined"
        onPress={() => setShowInvoiceDatePicker(true)}
        style={styles.dateButton}
      >
        {formInvoiceDate.toLocaleDateString()}
      </Button>

      {showInvoiceDatePicker && (
        <DateTimePicker
          value={formInvoiceDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            setShowInvoiceDatePicker(Platform.OS === 'ios');
            if (selectedDate) {
              setFormInvoiceDate(selectedDate);
            }
          }}
        />
      )}

      <Text style={styles.dialogLabel}>Payment Status *</Text>
      <View style={styles.statusButtons}>
        {PAYMENT_STATUSES.filter((s) => s.value !== 'overdue').map((status) => (
          <Chip
            key={status.value}
            selected={formPaymentStatus === status.value}
            onPress={() => setFormPaymentStatus(status.value)}
            style={styles.statusButton}
            selectedColor="#007AFF"
          >
            {status.label}
          </Chip>
        ))}
      </View>

      {formPaymentStatus === 'paid' && (
        <>
          <Text style={styles.dialogLabel}>Payment Date</Text>
          <Button
            mode="outlined"
            onPress={() => setShowPaymentDatePicker(true)}
            style={styles.dateButton}
          >
            {formPaymentDate ? formPaymentDate.toLocaleDateString() : 'Select Date'}
          </Button>

          {showPaymentDatePicker && (
            <DateTimePicker
              value={formPaymentDate || new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, selectedDate) => {
                setShowPaymentDatePicker(Platform.OS === 'ios');
                if (selectedDate) {
                  setFormPaymentDate(selectedDate);
                }
              }}
            />
          )}
        </>
      )}
    </ScrollView>
  );

  const totalInvoices = invoices.length;
  const totalAmount = invoices.reduce((sum, inv) => sum + inv.amount, 0);
  const paidAmount = invoices.filter((inv) => inv.paymentStatus === 'paid').reduce((sum, inv) => sum + inv.amount, 0);
  const pendingAmount = totalAmount - paidAmount;
  const overdueCount = invoices.filter((inv) => inv.paymentStatus === 'overdue').length;

  if (!projectId) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No project assigned</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with project info */}
      <View style={styles.header}>
        <Text style={styles.projectName}>{projectName}</Text>
        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Invoices</Text>
            <Text style={styles.summaryValue}>{totalInvoices}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Amount</Text>
            <Text style={styles.summaryValue}>${totalAmount.toLocaleString()}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Pending</Text>
            <Text style={[styles.summaryValue, { color: '#FFA500' }]}>
              ${pendingAmount.toLocaleString()}
            </Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Overdue</Text>
            <Text style={[styles.summaryValue, { color: '#ff6b6b' }]}>{overdueCount}</Text>
          </View>
        </View>
      </View>

      {/* Search and filter */}
      <View style={styles.controls}>
        <Searchbar
          placeholder="Search invoices..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />
        <Menu
          visible={showFilterMenu}
          onDismiss={() => setShowFilterMenu(false)}
          anchor={
            <Button
              mode="outlined"
              onPress={() => setShowFilterMenu(true)}
              style={styles.filterButton}
            >
              {selectedInvoiceStatus ? getStatusLabel(selectedInvoiceStatus) : 'All Status'}
            </Button>
          }
        >
          <Menu.Item
            onPress={() => {
              setSelectedInvoiceStatus(null);
              setShowFilterMenu(false);
            }}
            title="All Status"
          />
          {PAYMENT_STATUSES.map((status) => (
            <Menu.Item
              key={status.value}
              onPress={() => {
                setSelectedInvoiceStatus(status.value);
                setShowFilterMenu(false);
              }}
              title={status.label}
            />
          ))}
        </Menu>
      </View>

      {/* Invoice list */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading invoices...</Text>
        </View>
      ) : filteredInvoices.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {searchQuery || selectedInvoiceStatus
              ? 'No invoices match your filters'
              : 'No invoices yet. Tap + to create one.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredInvoices}
          renderItem={renderInvoiceCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* Create FAB */}
      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => {
          resetForm();
          setShowCreateDialog(true);
        }}
        label="Add Invoice"
      />

      {/* Create Dialog */}
      <Portal>
        <Dialog visible={showCreateDialog} onDismiss={() => setShowCreateDialog(false)}>
          <Dialog.Title>Create Invoice</Dialog.Title>
          <Dialog.ScrollArea>{renderInvoiceForm()}</Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button onPress={handleCreateInvoice}>Create</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Edit Dialog */}
      <Portal>
        <Dialog visible={showEditDialog} onDismiss={() => setShowEditDialog(false)}>
          <Dialog.Title>Edit Invoice</Dialog.Title>
          <Dialog.ScrollArea>{renderInvoiceForm()}</Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setShowEditDialog(false)}>Cancel</Button>
            <Button onPress={handleEditInvoice}>Save</Button>
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
  header: {
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  projectName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryCard: {
    flex: 1,
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginHorizontal: 2,
  },
  summaryLabel: {
    fontSize: 11,
    color: '#666',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  controls: {
    padding: 16,
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchbar: {
    flex: 1,
    elevation: 0,
  },
  filterButton: {
    borderColor: '#007AFF',
  },
  listContent: {
    padding: 16,
  },
  invoiceCard: {
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  invoiceNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  vendorName: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  statusChip: {
    alignSelf: 'flex-start',
  },
  statusChipText: {
    color: 'white',
    fontWeight: 'bold',
  },
  detailsContainer: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  overdueChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff3cd',
    marginTop: 4,
  },
  overdueChipText: {
    color: '#856404',
    fontWeight: 'bold',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: '#007AFF',
  },
  dialogContent: {
    paddingHorizontal: 24,
  },
  dialogLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    marginBottom: 16,
  },
  dateButton: {
    marginBottom: 16,
    borderColor: '#007AFF',
  },
  statusButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  statusButton: {
    marginRight: 8,
  },
});

export default InvoiceManagementScreen;
