import React, { useReducer, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, Alert } from 'react-native';
import { FAB } from 'react-native-paper';
import { useRoute, RouteProp } from '@react-navigation/native';
import { useCommercial } from './context/CommercialContext';
import { useAuth } from '../auth/AuthContext';
import ErrorBoundary from '../components/common/ErrorBoundary';
import type { CommercialTabParamList } from '../nav/CommercialNavigator';
import { useDebounceSearch } from './shared/hooks/useDebounceSearch';
import { database } from '../../models/database';
import { Q } from '@nozbe/watermelondb';
import { logger } from '../services/LoggingService';
import { isInvoiceOverdue } from './invoice-management/utils';
import { invoiceManagementReducer, initialInvoiceManagementState } from './state/invoice/invoiceManagementReducer';
import { invoiceManagementActions } from './state/invoice/invoiceManagementActions';
import type { Invoice } from './state/invoice/invoiceManagementReducer';
import {
  InvoiceFormData,
} from './invoice-management/hooks';
import {
  InvoiceCard,
  InvoiceFormDialog,
  InvoiceSummaryCards,
  FiltersBar,
} from './invoice-management/components';
import { InvoiceListSkeleton } from './shared';

/**
 * InvoiceManagementScreen (v2.11 Phase 5 - Sprint 6) - REFACTORED
 * Phase 2 Task 2.1 - State Management Refactor
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
 *
 * Refactored: 2025-12-28
 * - Reduced from 868 → ~220 lines (74% reduction)
 * - Extracted 5 components, 2 hooks, 2 utils
 * - Improved maintainability and reusability
 *
 * Phase 2 Refactor: 2026-01-05
 * - Consolidated hook state into useReducer
 * - Centralized state management
 */

const InvoiceManagementScreen = () => {
  const { projectId, projectName, selectedInvoiceStatus, setSelectedInvoiceStatus, refreshTrigger } =
    useCommercial();
  const { user } = useAuth();
  const route = useRoute<RouteProp<CommercialTabParamList, 'InvoiceManagement'>>();
  const [state, dispatch] = useReducer(invoiceManagementReducer, initialInvoiceManagementState);

  const { searchQuery, setSearchQuery, filteredItems: textSearchedInvoices } = useDebounceSearch<Invoice>({
    items: state.data.invoices,
    searchFields: ['invoiceNumber', 'vendorName', 'poId'],
  });

  const displayedInvoices = useMemo(() => {
    if (!selectedInvoiceStatus) return textSearchedInvoices;
    return textSearchedInvoices.filter((inv) => inv.paymentStatus === selectedInvoiceStatus);
  }, [textSearchedInvoices, selectedInvoiceStatus]);

  // Apply drill-down filter from dashboard navigation
  useEffect(() => {
    const filterStatus = route.params?.filterStatus;
    if (filterStatus) {
      setSelectedInvoiceStatus(filterStatus);
    }
  }, [route.params?.filterStatus]);

  // Load invoices from database
  const loadInvoices = useCallback(async (silent = false) => {
    if (!projectId) {
      dispatch(invoiceManagementActions.setLoading(false));
      return;
    }

    try {
      if (!silent) dispatch(invoiceManagementActions.setLoading(true));
      logger.debug('[Invoice] Loading invoices for project:', { projectId });

      const invoicesCollection = database.collections.get('invoices');
      const invoicesData = await invoicesCollection
        .query(Q.where('project_id', projectId), Q.sortBy('invoice_date', Q.desc))
        .fetch();

      const invoicesWithVendors = invoicesData.map((invoice: any) => {
        const isOverdue = isInvoiceOverdue(invoice.invoiceDate, invoice.paymentStatus, invoice.dueDate);

        return {
          id: invoice.id,
          projectId: invoice.projectId,
          poId: invoice.poId,
          invoiceNumber: invoice.invoiceNumber,
          invoiceDate: invoice.invoiceDate,
          dueDate: invoice.dueDate,
          amount: invoice.amount,
          paymentStatus: isOverdue ? 'overdue' : invoice.paymentStatus,
          paymentDate: invoice.paymentDate,
          vendorId: invoice.vendorId,
          vendorName: invoice.vendorName || 'Unknown Vendor',
          createdBy: invoice.createdBy,
          createdAt: invoice.createdAt,
        };
      });

      logger.debug('[Invoice] Loaded invoices:', { value: invoicesWithVendors.length });
      dispatch(invoiceManagementActions.setInvoices(invoicesWithVendors));
    } catch (error) {
      logger.error('[Invoice] Error loading invoices:', error as Error);
      Alert.alert('Error', 'Failed to load invoices');
    } finally {
      dispatch(invoiceManagementActions.setLoading(false));
    }
  }, [projectId]);

  // Calculate summary against the full unfiltered list
  useEffect(() => {
    const totalInvoices = state.data.invoices.length;
    const totalAmount = state.data.invoices.reduce((sum, inv) => sum + inv.amount, 0);
    const paidAmount = state.data.invoices
      .filter((inv) => inv.paymentStatus === 'paid')
      .reduce((sum, inv) => sum + inv.amount, 0);
    const pendingAmount = totalAmount - paidAmount;
    const overdueCount = state.data.invoices.filter((inv) => inv.paymentStatus === 'overdue').length;

    dispatch(invoiceManagementActions.setSummary({
      totalInvoices,
      totalAmount,
      paidAmount,
      pendingAmount,
      overdueCount,
    }));
  }, [state.data.invoices]);

  // Load invoices on mount and refresh
  useEffect(() => {
    loadInvoices();
  }, [loadInvoices, refreshTrigger]);

  // Reactive subscription — silently refresh when invoices change (e.g. after sync)
  useEffect(() => {
    if (!projectId) return;
    const subscription = database
      .withChangesForTables(['invoices'])
      .subscribe(() => loadInvoices(true));
    return () => subscription.unsubscribe();
  }, [projectId, loadInvoices]);

  const createInvoice = async (formData: InvoiceFormData): Promise<boolean> => {
    try {
      const invoicesCollection = database.collections.get('invoices');
      const amount = parseFloat(formData.amount);

      await database.write(async () => {
        await invoicesCollection.create((record: any) => {
          record.projectId = projectId;
          record.poId = formData.poId.trim();
          record.invoiceNumber = formData.invoiceNumber.trim();
          record.invoiceDate = formData.invoiceDate.getTime();
          record.dueDate = formData.dueDate ? formData.dueDate.getTime() : null;
          record.amount = amount;
          record.paymentStatus = formData.paymentStatus;
          record.paymentDate = formData.paymentDate ? formData.paymentDate.getTime() : null;
          record.vendorId = '';
          record.vendorName = formData.vendorName.trim();
          record.createdBy = user?.userId || '';
          record.appSyncStatus = 'pending';
          record.version = 1;
        });
      });

      Alert.alert('Success', 'Invoice created successfully');
      loadInvoices();
      return true;
    } catch (error) {
      logger.error('[Invoice] Error creating invoice:', error as Error);
      Alert.alert('Error', 'Failed to create invoice');
      return false;
    }
  };

  const updateInvoice = async (invoiceId: string, formData: InvoiceFormData): Promise<boolean> => {
    try {
      const invoicesCollection = database.collections.get('invoices');
      const invoiceRecord = await invoicesCollection.find(invoiceId);
      const amount = parseFloat(formData.amount);

      await database.write(async () => {
        await invoiceRecord.update((record: any) => {
          record.poId = formData.poId.trim();
          record.invoiceNumber = formData.invoiceNumber.trim();
          record.invoiceDate = formData.invoiceDate.getTime();
          record.dueDate = formData.dueDate ? formData.dueDate.getTime() : null;
          record.amount = amount;
          record.paymentStatus = formData.paymentStatus;
          record.paymentDate = formData.paymentDate ? formData.paymentDate.getTime() : null;
          record.vendorName = formData.vendorName.trim();
          record.appSyncStatus = 'pending';
        });
      });

      Alert.alert('Success', 'Invoice updated successfully');
      loadInvoices();
      return true;
    } catch (error) {
      logger.error('[Invoice] Error updating invoice:', error as Error);
      Alert.alert('Error', 'Failed to update invoice');
      return false;
    }
  };

  const deleteInvoice = async (invoice: Invoice): Promise<void> => {
    try {
      const invoicesCollection = database.collections.get('invoices');
      const invoiceRecord = await invoicesCollection.find(invoice.id);

      await database.write(async () => {
        await invoiceRecord.markAsDeleted();
      });

      Alert.alert('Success', 'Invoice deleted successfully');
      loadInvoices();
    } catch (error) {
      logger.error('[Invoice] Error deleting invoice:', error as Error);
      Alert.alert('Error', 'Failed to delete invoice');
    }
  };

  const markInvoiceAsPaid = async (invoice: Invoice): Promise<void> => {
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
      logger.error('[Invoice] Error marking invoice as paid:', error as Error);
      Alert.alert('Error', 'Failed to mark invoice as paid');
    }
  };

  const handleCreate = async (formData: InvoiceFormData): Promise<boolean> => {
    return await createInvoice(formData);
  };

  const handleEdit = async (formData: InvoiceFormData): Promise<boolean> => {
    if (!state.data.editingInvoice) return false;
    return await updateInvoice(state.data.editingInvoice.id, formData);
  };

  const openEditDialog = (invoice: Invoice) => {
    dispatch(invoiceManagementActions.openEditDialog(invoice));
  };

  const closeEditDialog = () => {
    dispatch(invoiceManagementActions.closeDialogs());
  };

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
        <InvoiceSummaryCards
          totalInvoices={state.data.summary.totalInvoices}
          totalAmount={state.data.summary.totalAmount}
          pendingAmount={state.data.summary.pendingAmount}
          overdueCount={state.data.summary.overdueCount}
        />
      </View>

      {/* Search and filter */}
      <FiltersBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedStatus={selectedInvoiceStatus}
        onStatusChange={setSelectedInvoiceStatus}
      />

      {/* Invoice list */}
      {state.ui.loading ? (
        <InvoiceListSkeleton />
      ) : displayedInvoices.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {searchQuery || selectedInvoiceStatus
              ? 'No invoices match your filters'
              : 'No invoices yet. Tap + to create one.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={displayedInvoices}
          renderItem={({ item }) => (
            <InvoiceCard
              invoice={item}
              onMarkPaid={markInvoiceAsPaid}
              onEdit={openEditDialog}
              onDelete={deleteInvoice}
            />
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* Create FAB */}
      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => dispatch(invoiceManagementActions.openCreateDialog())}
        label="Add Invoice"
      />

      {/* Create Dialog */}
      <InvoiceFormDialog
        visible={state.ui.showCreateDialog}
        onDismiss={() => dispatch(invoiceManagementActions.closeDialogs())}
        onSubmit={handleCreate}
        title="Create Invoice"
      />

      {/* Edit Dialog */}
      <InvoiceFormDialog
        visible={state.ui.showEditDialog}
        onDismiss={closeEditDialog}
        onSubmit={handleEdit}
        editingInvoice={state.data.editingInvoice}
        title="Edit Invoice"
      />
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
  listContent: {
    padding: 16,
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
});

export default function InvoiceManagementScreenWithErrorBoundary(props: any) {
  return (
    <ErrorBoundary name="InvoiceManagementScreen">
      <InvoiceManagementScreen {...props} />
    </ErrorBoundary>
  );
}
