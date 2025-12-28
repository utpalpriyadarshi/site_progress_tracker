import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { FAB } from 'react-native-paper';
import { useCommercial } from './context/CommercialContext';
import { useAuth } from '../auth/AuthContext';
import ErrorBoundary from '../components/common/ErrorBoundary';
import {
  useInvoiceData,
  useInvoiceFilters,
  Invoice,
  InvoiceFormData,
} from './invoice-management/hooks';
import {
  InvoiceCard,
  InvoiceFormDialog,
  InvoiceSummaryCards,
  FiltersBar,
} from './invoice-management/components';

/**
 * InvoiceManagementScreen (v2.11 Phase 5 - Sprint 6) - REFACTORED
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
 */

const InvoiceManagementScreen = () => {
  const { projectId, projectName, selectedInvoiceStatus, setSelectedInvoiceStatus, refreshTrigger } =
    useCommercial();
  const { user } = useAuth();

  // Dialog state
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);

  // Data hooks
  const {
    invoices,
    loading,
    loadInvoices,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    markInvoiceAsPaid,
  } = useInvoiceData(projectId, user?.userId || '');

  const { searchQuery, setSearchQuery, filteredInvoices, summary } = useInvoiceFilters(
    invoices,
    selectedInvoiceStatus
  );

  // Load invoices on mount and refresh
  useEffect(() => {
    loadInvoices();
  }, [loadInvoices, refreshTrigger]);

  const handleCreate = async (formData: InvoiceFormData): Promise<boolean> => {
    return await createInvoice(formData);
  };

  const handleEdit = async (formData: InvoiceFormData): Promise<boolean> => {
    if (!editingInvoice) return false;
    return await updateInvoice(editingInvoice.id, formData);
  };

  const openEditDialog = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setShowEditDialog(true);
  };

  const closeEditDialog = () => {
    setShowEditDialog(false);
    setEditingInvoice(null);
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
          totalInvoices={summary.totalInvoices}
          totalAmount={summary.totalAmount}
          pendingAmount={summary.pendingAmount}
          overdueCount={summary.overdueCount}
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
        onPress={() => setShowCreateDialog(true)}
        label="Add Invoice"
      />

      {/* Create Dialog */}
      <InvoiceFormDialog
        visible={showCreateDialog}
        onDismiss={() => setShowCreateDialog(false)}
        onSubmit={handleCreate}
        title="Create Invoice"
      />

      {/* Edit Dialog */}
      <InvoiceFormDialog
        visible={showEditDialog}
        onDismiss={closeEditDialog}
        onSubmit={handleEdit}
        editingInvoice={editingInvoice}
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
