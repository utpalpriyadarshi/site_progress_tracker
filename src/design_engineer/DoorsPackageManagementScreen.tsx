import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { FAB, Searchbar, Chip, Menu, Portal } from 'react-native-paper';
import { useDesignEngineerContext } from './context/DesignEngineerContext';
import ErrorBoundary from '../components/common/ErrorBoundary';
import DoorsPackageCard from './components/DoorsPackageCard';
import CreateDoorsPackageDialog from './components/CreateDoorsPackageDialog';
import { useDoorsPackages } from './hooks/useDoorsPackages';
import { useDoorsPackageFilters } from './hooks/useDoorsPackageFilters';

/**
 * DoorsPackageManagementScreen (v3.0 - Refactored)
 *
 * Design Engineer manages DOORS packages (100 requirements per equipment/material).
 *
 * Features:
 * - View all DOORS packages for engineer's project
 * - Filter by site, status, category
 * - Create new DOORS package
 * - Mark as received/reviewed
 * - View requirements count (100 per package)
 * - Link to Design RFQs
 *
 * Refactoring improvements:
 * - Extracted DOORS package card to separate component
 * - Extracted create dialog to separate component
 * - Extracted data operations to custom hook
 * - Extracted filter logic to custom hook
 * - Extracted types to separate file
 */

const DoorsPackageManagementScreen = () => {
  const { projectId, projectName, refreshTrigger } = useDesignEngineerContext();
  const { packages, sites, loading, createPackage, markAsReceived, markAsReviewed } = useDoorsPackages(
    projectId,
    refreshTrigger
  );
  const { filteredPackages, searchQuery, setSearchQuery, filterStatus, setFilterStatus } =
    useDoorsPackageFilters(packages);

  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newDoorsId, setNewDoorsId] = useState('');
  const [newSiteId, setNewSiteId] = useState('');
  const [newEquipmentType, setNewEquipmentType] = useState('');
  const [newMaterialType, setNewMaterialType] = useState('');

  const handleCreatePackage = async () => {
    const success = await createPackage(newDoorsId, newSiteId, newEquipmentType, newMaterialType);
    if (success) {
      setShowCreateDialog(false);
      resetCreateDialog();
    }
  };

  const resetCreateDialog = () => {
    setNewDoorsId('');
    setNewSiteId('');
    setNewEquipmentType('');
    setNewMaterialType('');
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
            placeholder="Search DOORS packages..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchbar}
          />
          <View style={styles.filterRow}>
            <Chip
              mode={filterStatus ? 'flat' : 'outlined'}
              selected={filterStatus !== null}
              onPress={() => setShowFilterMenu(true)}
              style={styles.filterChip}
            >
              {filterStatus ? `Status: ${filterStatus}` : 'Filter'}
            </Chip>
            {filterStatus && (
              <Chip
                mode="outlined"
                onPress={() => setFilterStatus(null)}
                closeIcon="close"
                onClose={() => setFilterStatus(null)}
                style={styles.filterChip}
              >
                Clear
              </Chip>
            )}
          </View>
        </View>

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
          </View>
        ) : (
          <FlatList
            data={filteredPackages}
            renderItem={({ item }) => (
              <DoorsPackageCard package={item} onMarkReceived={markAsReceived} onMarkReviewed={markAsReviewed} />
            )}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No DOORS packages found</Text>
              </View>
            }
          />
        )}

        <FAB icon="plus" style={styles.fab} onPress={() => setShowCreateDialog(true)} label="New Package" />

        <Portal>
          <Menu visible={showFilterMenu} onDismiss={() => setShowFilterMenu(false)} anchor={{ x: 0, y: 0 }}>
            <Menu.Item
              onPress={() => {
                setFilterStatus('pending');
                setShowFilterMenu(false);
              }}
              title="Pending"
            />
            <Menu.Item
              onPress={() => {
                setFilterStatus('received');
                setShowFilterMenu(false);
              }}
              title="Received"
            />
            <Menu.Item
              onPress={() => {
                setFilterStatus('reviewed');
                setShowFilterMenu(false);
              }}
              title="Reviewed"
            />
          </Menu>
        </Portal>

        <CreateDoorsPackageDialog
          visible={showCreateDialog}
          onDismiss={handleDismissDialog}
          onCreate={handleCreatePackage}
          sites={sites}
          newDoorsId={newDoorsId}
          setNewDoorsId={setNewDoorsId}
          newSiteId={newSiteId}
          setNewSiteId={setNewSiteId}
          newEquipmentType={newEquipmentType}
          setNewEquipmentType={setNewEquipmentType}
          newMaterialType={newMaterialType}
          setNewMaterialType={setNewMaterialType}
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

export default DoorsPackageManagementScreen;
