import React, { useReducer, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert } from 'react-native';
import { FAB, Searchbar, Chip, Menu, Portal, Snackbar, Button } from 'react-native-paper';
import { useDesignEngineerContext } from './context/DesignEngineerContext';
import ErrorBoundary from '../components/common/ErrorBoundary';
import DoorsPackageCard from './components/DoorsPackageCard';
import CreateDoorsPackageDialog from './components/CreateDoorsPackageDialog';
import CopyDoorsPackagesDialog from './components/CopyDoorsPackagesDialog';
import StatusTransitionDialog from './components/StatusTransitionDialog';
import SiteSelector from './components/SiteSelector';
import DOORS_PACKAGE_TEMPLATES from './data/doorsPackageTemplates';
import { database } from '../../models/database';
import { Q } from '@nozbe/watermelondb';
import { logger } from '../services/LoggingService';
import { DoorsPackage } from './types/DoorsPackageTypes';
import {
  doorsPackageManagementReducer,
  createDoorsPackageInitialState,
} from './state';
import { useAccessibility } from '../utils/accessibility';
import { useDebounce } from '../utils/performance';
import { EmptyState } from '../components/common/EmptyState';
import { COLORS } from '../theme/colors';
import { commonStyles } from '../styles/common';
import { useSnackbar } from '../hooks/useSnackbar';
import { useFlatListProps } from '../hooks/useFlatListProps';
import { useDoorsPackageCrud } from './hooks/useDoorsPackageCrud';

/**
 * DoorsPackageManagementScreen (v6.0 - Sprint 1)
 *
 * Design Engineer manages DOORS packages (requirements per equipment/material).
 *
 * Sprint 1 Enhancements:
 * - Configurable category (OHE, TSS, SCADA, etc.) instead of hardcoded 'equipment'
 * - Configurable requirements count instead of hardcoded 100
 * - Proper engineerId from context
 * - Site-aware filtering via selectedSiteId
 * - Edit and Delete functionality
 * - Header compaction
 */

const DOORS_STATUS_DOTS: { key: string; label: string; color: string }[] = [
  { key: 'pending', label: 'Pending', color: '#FFA500' },
  { key: 'received', label: 'Received', color: COLORS.INFO },
  { key: 'reviewed', label: 'Reviewed', color: COLORS.SUCCESS },
  { key: 'approved', label: 'Approved', color: '#7B1FA2' },
  { key: 'closed', label: 'Closed', color: '#616161' },
];

const DoorsPackageManagementScreen = () => {
  const { projectId, projectName, refreshTrigger, engineerId, selectedSiteId } = useDesignEngineerContext();
  const [state, dispatch] = useReducer(doorsPackageManagementReducer, createDoorsPackageInitialState());
  const { announce } = useAccessibility();
  const { show: showSnackbar, snackbarProps } = useSnackbar();

  const doorsStatusCounts = useMemo(
    () =>
      state.data.packages.reduce(
        (acc, p) => {
          acc[p.status] = (acc[p.status] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      ),
    [state.data.packages],
  );

  const { avgCompliance, complianceColor, hasCompliance } = useMemo(() => {
    const compliancePackages = state.data.packages.filter(
      (p) => p.compliancePercentage !== undefined && p.compliancePercentage > 0,
    );
    const avg =
      compliancePackages.length > 0
        ? compliancePackages.reduce((sum, p) => sum + (p.compliancePercentage || 0), 0) /
          compliancePackages.length
        : 0;
    return {
      avgCompliance: avg,
      complianceColor: avg >= 80 ? COLORS.SUCCESS : avg >= 50 ? COLORS.WARNING : COLORS.ERROR,
      hasCompliance: compliancePackages.length > 0,
    };
  }, [state.data.packages]);

  const flatListProps = useFlatListProps<DoorsPackage>();
  const debouncedSearchQuery = useDebounce(state.filters.searchQuery, 300);

  const {
    projectDomains,
    transitionDialogVisible,
    transitionStage,
    isSubmitting,
    setTransitionDialogVisible,
    loadSites,
    loadDomains,
    loadPackages,
    handleCreateOrUpdatePackage,
    handleEditPackage,
    handleDeletePackage,
    handleDuplicatePackage,
    handleSelectTemplate,
    handleCopyPackages,
    markAsReceived,
    markAsReviewed,
    markAsApproved,
    handleClosePackage,
    handleTransitionConfirm,
    handleSelectPackage,
    handleLongPress,
    handleBulkMarkReceived,
    handleDismissDialog,
  } = useDoorsPackageCrud({ projectId, engineerId, selectedSiteId, state, dispatch, showSnackbar, announce });

  // Load packages, sites, and domains
  useEffect(() => {
    loadSites();
    loadDomains();
    loadPackages();
  }, [projectId, refreshTrigger, engineerId, selectedSiteId]);

  const renderItem = useCallback(
    ({ item }: { item: DoorsPackage }) => (
      <DoorsPackageCard
        package={item}
        onMarkReceived={markAsReceived}
        onMarkReviewed={markAsReviewed}
        onApprove={markAsApproved}
        onClose={handleClosePackage}
        onEdit={handleEditPackage}
        onDelete={handleDeletePackage}
        onDuplicate={handleDuplicatePackage}
        bulkSelectMode={state.ui.bulkSelectMode}
        isSelected={state.ui.selectedPackageIds.includes(item.id)}
        onSelect={handleSelectPackage}
        onLongPress={handleLongPress}
      />
    ),
    [
      markAsReceived,
      markAsReviewed,
      markAsApproved,
      handleClosePackage,
      handleEditPackage,
      handleDeletePackage,
      handleDuplicatePackage,
      handleSelectPackage,
      handleLongPress,
      state.ui.bulkSelectMode,
      state.ui.selectedPackageIds,
    ],
  );

  // Render appropriate empty state
  const renderEmptyState = () => {
    const hasSearchQuery = state.filters.searchQuery.length > 0;
    const hasFilter = state.filters.status !== null;
    const hasNoPackages = state.data.packages.length === 0;

    if (hasNoPackages) {
      return (
        <EmptyState
          icon="package-variant"
          title="No DOORS Packages Yet"
          message="Create your first DOORS package to start tracking engineering requirements"
          helpText="Each DOORS package contains requirements for a specific equipment or material."
          actionText="Create DOORS Package"
          onAction={() => dispatch({ type: 'OPEN_DIALOG' })}
          variant="large"
        />
      );
    } else if (hasSearchQuery) {
      return (
        <EmptyState
          icon="magnify"
          title="No Packages Found"
          message={`No DOORS Packages match "${state.filters.searchQuery}". Try adjusting your search.`}
          actionText="Clear Search"
          onAction={() => dispatch({ type: 'SET_SEARCH_QUERY', payload: { query: '' } })}
          secondaryActionText="Create New Package"
          onSecondaryAction={() => dispatch({ type: 'OPEN_DIALOG' })}
          variant="search"
        />
      );
    } else if (hasFilter) {
      return (
        <EmptyState
          icon="filter-off"
          title={`No ${state.filters.status} Packages`}
          message={`There are no DOORS Packages with "${state.filters.status}" status.`}
          actionText="Clear Filter"
          onAction={() => dispatch({ type: 'SET_FILTER_STATUS', payload: { status: null } })}
          secondaryActionText="View All Packages"
          onSecondaryAction={() => {
            dispatch({ type: 'SET_FILTER_STATUS', payload: { status: null } });
            announce('Showing all packages');
          }}
          variant="default"
        />
      );
    }

    return null;
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
      <View style={commonStyles.screen}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text
                style={styles.projectName}
                accessible
                accessibilityRole="header"
                accessibilityLabel={`Project: ${projectName}`}
              >
                {projectName}
              </Text>
              <Text style={styles.screenLabel}>DOORS Package Management</Text>
            </View>
          </View>
          <SiteSelector style={styles.siteSelector} />
          <Searchbar
            placeholder="Search DOORS packages..."
            onChangeText={(query) => dispatch({ type: 'SET_SEARCH_QUERY', payload: { query } })}
            value={state.filters.searchQuery}
            style={styles.searchbar}
            accessible
            accessibilityLabel="Search DOORS packages"
            accessibilityHint="Enter text to search for packages by DOORS ID or equipment type"
            accessibilityRole="search"
          />
          <View style={styles.filterRow}>
            <Chip
              mode={state.filters.status ? 'flat' : 'outlined'}
              selected={state.filters.status !== null}
              onPress={() => dispatch({ type: 'OPEN_FILTER_MENU' })}
              style={styles.filterChip}
              accessible
              accessibilityRole="button"
              accessibilityLabel={state.filters.status ? `Status filter: ${state.filters.status}` : 'Open filter menu'}
              accessibilityHint="Double tap to open filter menu"
            >
              {state.filters.status ? `Status: ${state.filters.status}` : 'Filter'}
            </Chip>
            {state.filters.status && (
              <Chip
                mode="outlined"
                onPress={() => dispatch({ type: 'SET_FILTER_STATUS', payload: { status: null } })}
                closeIcon="close"
                onClose={() => dispatch({ type: 'SET_FILTER_STATUS', payload: { status: null } })}
                style={styles.filterChip}
                accessible
                accessibilityRole="button"
                accessibilityLabel="Clear status filter"
                accessibilityHint="Double tap to remove filter"
              >
                Clear
              </Chip>
            )}
          </View>
        </View>

        {/* Summary Bar */}
        {!state.ui.loading && state.data.packages.length > 0 && (
          <View style={styles.summaryBar}>
            <View style={styles.summaryTopRow}>
              <Text style={styles.summaryCount}>
                {state.data.packages.length} package{state.data.packages.length !== 1 ? 's' : ''}
              </Text>
              {hasCompliance && (
                <Text style={[styles.summaryCompliance, { color: complianceColor }]}>
                  Avg Compliance: {avgCompliance.toFixed(0)}%
                </Text>
              )}
            </View>
            {hasCompliance && (
              <View style={styles.summaryBarBg}>
                <View
                  style={[
                    styles.summaryBarFill,
                    { width: `${Math.min(avgCompliance, 100)}%`, backgroundColor: complianceColor },
                  ]}
                />
              </View>
            )}
            <View style={styles.summaryStatusRow}>
              {DOORS_STATUS_DOTS.filter((s) => doorsStatusCounts[s.key]).map((s) => (
                <View key={s.key} style={styles.summaryStatusItem}>
                  <View style={[styles.summaryDot, { backgroundColor: s.color }]} />
                  <Text style={styles.summaryStatusText}>
                    {doorsStatusCounts[s.key]} {s.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {state.ui.bulkSelectMode && (
          <View style={styles.bulkBar}>
            <Text style={styles.bulkCount}>{state.ui.selectedPackageIds.length} selected</Text>
            <Button compact mode="outlined" onPress={() => dispatch({ type: 'SELECT_ALL_PACKAGES' })}>
              Select All
            </Button>
            <Button
              compact
              mode="contained"
              onPress={handleBulkMarkReceived}
              disabled={state.ui.selectedPackageIds.length === 0}
            >
              Mark All Received
            </Button>
            <Button compact mode="text" onPress={() => dispatch({ type: 'CLEAR_SELECTION' })}>
              Cancel
            </Button>
          </View>
        )}

        {state.ui.loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator
              size="large"
              color="#007AFF"
              accessible
              accessibilityLabel="Loading DOORS packages"
              accessibilityRole="progressbar"
            />
          </View>
        ) : (
          <FlatList
            {...flatListProps}
            data={state.data.filteredPackages}
            renderItem={renderItem}
            contentContainerStyle={styles.listContainer}
            accessible
            accessibilityRole="list"
            accessibilityLabel={`DOORS packages list, ${state.data.filteredPackages.length} ${
              state.data.filteredPackages.length === 1 ? 'item' : 'items'
            }`}
            ListEmptyComponent={renderEmptyState()}
          />
        )}

        {state.data.packages.length > 0 && state.data.sites.length > 1 && (
          <FAB
            icon="content-copy"
            style={styles.fabSecondary}
            onPress={() => dispatch({ type: 'OPEN_COPY_DIALOG' })}
            small
            label="Copy to Site"
            accessible
            accessibilityLabel="Copy packages to another site"
            accessibilityRole="button"
          />
        )}

        <FAB
          icon="plus"
          style={styles.fab}
          onPress={() => dispatch({ type: 'OPEN_DIALOG' })}
          label="New Package"
          accessible
          accessibilityLabel="Create new DOORS package"
          accessibilityRole="button"
          accessibilityHint="Double tap to open dialog for creating a new DOORS package"
        />

        <Portal>
          <Menu
            visible={state.ui.filterMenuVisible}
            onDismiss={() => dispatch({ type: 'CLOSE_FILTER_MENU' })}
            anchor={{ x: 0, y: 0 }}
            accessible
            accessibilityLabel="Status filter menu"
          >
            <Menu.Item
              onPress={() => {
                dispatch({ type: 'SET_FILTER_STATUS', payload: { status: 'pending' } });
                dispatch({ type: 'CLOSE_FILTER_MENU' });
                announce('Filtered by pending status');
              }}
              title="Pending"
              accessibilityLabel="Filter by pending status"
              accessibilityRole="menuitem"
            />
            <Menu.Item
              onPress={() => {
                dispatch({ type: 'SET_FILTER_STATUS', payload: { status: 'received' } });
                dispatch({ type: 'CLOSE_FILTER_MENU' });
                announce('Filtered by received status');
              }}
              title="Received"
              accessibilityLabel="Filter by received status"
              accessibilityRole="menuitem"
            />
            <Menu.Item
              onPress={() => {
                dispatch({ type: 'SET_FILTER_STATUS', payload: { status: 'reviewed' } });
                dispatch({ type: 'CLOSE_FILTER_MENU' });
                announce('Filtered by reviewed status');
              }}
              title="Reviewed"
              accessibilityLabel="Filter by reviewed status"
              accessibilityRole="menuitem"
            />
            <Menu.Item
              onPress={() => {
                dispatch({ type: 'SET_FILTER_STATUS', payload: { status: 'approved' } });
                dispatch({ type: 'CLOSE_FILTER_MENU' });
                announce('Filtered by approved status');
              }}
              title="Approved"
              accessibilityLabel="Filter by approved status"
              accessibilityRole="menuitem"
            />
            <Menu.Item
              onPress={() => {
                dispatch({ type: 'SET_FILTER_STATUS', payload: { status: 'closed' } });
                dispatch({ type: 'CLOSE_FILTER_MENU' });
                announce('Filtered by closed status');
              }}
              title="Closed"
              accessibilityLabel="Filter by closed status"
              accessibilityRole="menuitem"
            />
          </Menu>
        </Portal>

        <CreateDoorsPackageDialog
          visible={state.ui.dialogVisible}
          onDismiss={handleDismissDialog}
          onCreate={handleCreateOrUpdatePackage}
          isEditing={!!state.ui.editingPackageId}
          isSubmitting={isSubmitting}
          sites={state.data.sites}
          domains={projectDomains}
          newDoorsId={state.form.doorsId}
          setNewDoorsId={(doorsId) =>
            dispatch({ type: 'UPDATE_FORM_FIELD', payload: { field: 'doorsId', value: doorsId } })
          }
          newSiteId={state.form.siteId}
          setNewSiteId={(siteId) =>
            dispatch({ type: 'UPDATE_FORM_FIELD', payload: { field: 'siteId', value: siteId } })
          }
          newEquipmentType={state.form.equipmentType}
          setNewEquipmentType={(equipmentType) =>
            dispatch({ type: 'UPDATE_FORM_FIELD', payload: { field: 'equipmentType', value: equipmentType } })
          }
          newMaterialType={state.form.materialType}
          setNewMaterialType={(materialType) =>
            dispatch({ type: 'UPDATE_FORM_FIELD', payload: { field: 'materialType', value: materialType } })
          }
          newCategory={state.form.category}
          setNewCategory={(category) =>
            dispatch({ type: 'UPDATE_FORM_FIELD', payload: { field: 'category', value: category } })
          }
          newDomainId={state.form.domainId}
          setNewDomainId={(domainId) =>
            dispatch({ type: 'UPDATE_FORM_FIELD', payload: { field: 'domainId', value: domainId } })
          }
          newTotalRequirements={state.form.totalRequirements}
          setNewTotalRequirements={(totalRequirements) =>
            dispatch({ type: 'UPDATE_FORM_FIELD', payload: { field: 'totalRequirements', value: totalRequirements } })
          }
          templates={DOORS_PACKAGE_TEMPLATES}
          onSelectTemplate={handleSelectTemplate}
          existingDoorsIds={state.data.packages.map((p) => p.doorsId)}
        />

        <StatusTransitionDialog
          visible={transitionDialogVisible}
          stage={transitionStage}
          onConfirm={handleTransitionConfirm}
          onDismiss={() => setTransitionDialogVisible(false)}
        />

        <CopyDoorsPackagesDialog
          visible={state.ui.copyDialogVisible}
          onDismiss={() => dispatch({ type: 'CLOSE_COPY_DIALOG' })}
          onCopy={handleCopyPackages}
          packages={state.data.packages}
          sites={state.data.sites}
          currentSiteId={selectedSiteId && selectedSiteId !== 'all' ? selectedSiteId : undefined}
        />

        <Snackbar
          {...snackbarProps}
          duration={3000}
          action={{ label: 'Dismiss', onPress: snackbarProps.onDismiss }}
        />
      </View>
    </ErrorBoundary>
  );
};

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#007AFF',
    paddingTop: 12,
    paddingBottom: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  projectName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  screenLabel: {
    fontSize: 14,
    color: '#FFF',
    opacity: 0.9,
  },
  searchbar: {
    marginBottom: 8,
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
    paddingBottom: 140,
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
    backgroundColor: '#007AFF',
  },
  fabSecondary: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 64,
    backgroundColor: '#616161',
  },
  siteSelector: {
    marginTop: 4,
  },
  summaryBar: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    elevation: 1,
  },
  summaryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  summaryCount: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  summaryCompliance: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  summaryBarBg: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  summaryBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  summaryStatusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  summaryStatusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  summaryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  summaryStatusText: {
    fontSize: 11,
    color: '#555',
  },
  bulkBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.INFO_BG,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  bulkCount: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1565C0',
    flex: 1,
  },
});

export default DoorsPackageManagementScreen;
