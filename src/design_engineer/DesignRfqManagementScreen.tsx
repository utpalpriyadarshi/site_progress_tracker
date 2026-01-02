import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { FAB, Searchbar, Chip } from 'react-native-paper';
import { useDesignEngineerContext } from './context/DesignEngineerContext';
import ErrorBoundary from '../components/common/ErrorBoundary';
import DesignRfqCard from './components/DesignRfqCard';
import CreateDesignRfqDialog from './components/CreateDesignRfqDialog';
import { useDesignRfqs } from './hooks/useDesignRfqs';
import { useRfqFilters } from './hooks/useRfqFilters';

/**
 * DesignRfqManagementScreen (v3.0 - Refactored)
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
 *
 * Refactoring improvements:
 * - Extracted RFQ card to separate component
 * - Extracted create dialog to separate component
 * - Extracted data operations to custom hook
 * - Extracted filter logic to custom hook
 * - Extracted types to separate file
 */

const DesignRfqManagementScreen = () => {
  const { projectId, projectName, refreshTrigger } = useDesignEngineerContext();
  const { rfqs, doorsPackages, loading, createRfq, issueRfq, markQuotesReceived } = useDesignRfqs(
    projectId,
    refreshTrigger
  );
  const { filteredRfqs, searchQuery, setSearchQuery, filterStatus, setFilterStatus } = useRfqFilters(rfqs);

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newDoorsPackageId, setNewDoorsPackageId] = useState('');
  const [newExpectedDeliveryDays, setNewExpectedDeliveryDays] = useState('30');

  const handleCreateRfq = async () => {
    const success = await createRfq(newTitle, newDescription, newDoorsPackageId, newExpectedDeliveryDays);
    if (success) {
      setShowCreateDialog(false);
      resetCreateDialog();
    }
  };

  const resetCreateDialog = () => {
    setNewTitle('');
    setNewDescription('');
    setNewDoorsPackageId('');
    setNewExpectedDeliveryDays('30');
  };

  const handleDismissDialog = () => {
    setShowCreateDialog(false);
    resetCreateDialog();
  };

  if (!projectId) {
    return (
      <ErrorBoundary>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>No project assigned</Text>
        </View>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
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
            renderItem={({ item }) => (
              <DesignRfqCard rfq={item} onIssue={issueRfq} onMarkQuotesReceived={markQuotesReceived} />
            )}
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

        <CreateDesignRfqDialog
          visible={showCreateDialog}
          onDismiss={handleDismissDialog}
          onCreate={handleCreateRfq}
          doorsPackages={doorsPackages}
          newTitle={newTitle}
          setNewTitle={setNewTitle}
          newDescription={newDescription}
          setNewDescription={setNewDescription}
          newDoorsPackageId={newDoorsPackageId}
          setNewDoorsPackageId={setNewDoorsPackageId}
          newExpectedDeliveryDays={newExpectedDeliveryDays}
          setNewExpectedDeliveryDays={setNewExpectedDeliveryDays}
        />
      </View>
    </ErrorBoundary>
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
});

export default DesignRfqManagementScreen;
