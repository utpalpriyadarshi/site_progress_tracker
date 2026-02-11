import React, { useReducer, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { FAB, Searchbar, Chip, Menu, Portal } from 'react-native-paper';
import { useDesignEngineerContext } from './context/DesignEngineerContext';
import ErrorBoundary from '../components/common/ErrorBoundary';
import DoorsPackageCard from './components/DoorsPackageCard';
import CreateDoorsPackageDialog from './components/CreateDoorsPackageDialog';
import SiteSelector from './components/SiteSelector';
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
import { useNavigation, CommonActions } from '@react-navigation/native';
import { useAuth } from '../auth/AuthContext';
import { EmptyState } from '../components/common/EmptyState';

/**
 * DoorsPackageManagementScreen (v5.0 - Phase 3 Complete)
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
 * Phase 3 Enhancements:
 * - Accessibility: Screen reader support, ARIA labels, keyboard navigation
 * - Performance: Debounced search (300ms delay)
 * - Enhanced UX: Improved empty states and loading indicators
 */

const DoorsPackageManagementScreen = () => {
  const { projectId, projectName, refreshTrigger, engineerId, selectedSiteId } = useDesignEngineerContext();
  const [state, dispatch] = useReducer(doorsPackageManagementReducer, createDoorsPackageInitialState());
  const { announce } = useAccessibility();
  const navigation = useNavigation();

  // Debounce search query for better performance
  const debouncedSearchQuery = useDebounce(state.filters.searchQuery, 300);

  // Load packages and sites
  useEffect(() => {
    loadSites();
    loadPackages();
  }, [projectId, refreshTrigger, selectedSiteId, engineerId]);

  const loadSites = async () => {
    if (!projectId) return;

    try {
      const sitesCollection = database.collections.get('sites');
      const sitesData = await sitesCollection.query(Q.where('project_id', projectId)).fetch();

      const sitesList = sitesData.map((site: any) => ({
        id: site.id,
        name: site.name,
      }));

      dispatch({ type: 'SET_SITES', payload: { sites: sitesList } });
    } catch (error) {
      logger.error('[DoorsPackage] Error loading sites:', error);
    }
  };

  const loadPackages = async () => {
    if (!projectId || !engineerId) {
      dispatch({ type: 'COMPLETE_LOADING' });
      return;
    }

    try {
      dispatch({ type: 'START_LOADING' });
      logger.info('[DoorsPackage] Loading packages for project:', projectId);

      // Get sites assigned to this designer
      const sitesCollection = database.collections.get('sites');
      const assignedSites = await sitesCollection
        .query(Q.where('design_engineer_id', engineerId))
        .fetch();

      const assignedSiteIds = assignedSites.map((site: any) => site.id);

      // Filter packages by assigned sites
      const doorsCollection = database.collections.get('doors_packages');
      let packagesQuery = doorsCollection.query(
        Q.where('project_id', projectId),
        Q.where('site_id', Q.oneOf(assignedSiteIds))
      );

      // Further filter by selected site if not 'all'
      if (selectedSiteId !== 'all') {
        packagesQuery = doorsCollection.query(
          Q.where('project_id', projectId),
          Q.where('site_id', selectedSiteId)
        );
      }

      const packagesData = await packagesQuery.fetch();

      const packagesWithSites = await Promise.all(
        packagesData.map(async (pkg: any) => {
          let siteName = '';
          if (pkg.siteId) {
            try {
              const site = await database.collections.get('sites').find(pkg.siteId);
              siteName = (site as any).name;
            } catch (error) {
              logger.warn('[DoorsPackage] Site not found:', pkg.siteId);
            }
          }

          return {
            id: pkg.id,
            doorsId: pkg.doorsId,
            projectId: pkg.projectId,
            siteId: pkg.siteId,
            siteName,
            equipmentType: pkg.equipmentType,
            materialType: pkg.materialType,
            category: pkg.category,
            totalRequirements: pkg.totalRequirements,
            receivedDate: pkg.receivedDate,
            reviewedDate: pkg.reviewedDate,
            status: pkg.status,
            engineerId: pkg.engineerId,
            createdAt: pkg.createdAt,
          };
        })
      );

      logger.debug('[DoorsPackage] Loaded packages:', packagesWithSites.length);
      dispatch({ type: 'SET_PACKAGES', payload: { packages: packagesWithSites } });

      // Accessibility announcement
      announce(`Loaded ${packagesWithSites.length} DOORS package${packagesWithSites.length !== 1 ? 's' : ''}`);
    } catch (error) {
      logger.error('[DoorsPackage] Error loading packages:', error);
      Alert.alert('Error', 'Failed to load DOORS packages');
    } finally {
      dispatch({ type: 'COMPLETE_LOADING' });
    }
  };

  const handleCreatePackage = async () => {
    const { doorsId, siteId, equipmentType, materialType } = state.form;

    if (!doorsId || !equipmentType || !siteId) {
      Alert.alert('Validation Error', 'Please fill in all required fields');
      return;
    }

    try {
      const doorsCollection = database.collections.get('doors_packages');

      let newPackage: DoorsPackage | null = null;

      await database.write(async () => {
        const record = await doorsCollection.create((rec: any) => {
          rec.doorsId = doorsId;
          rec.projectId = projectId;
          rec.siteId = siteId;
          rec.equipmentType = equipmentType;
          rec.materialType = materialType || null;
          rec.category = 'equipment';
          rec.totalRequirements = 100;
          rec.status = 'pending';
          rec.engineerId = '';
          rec.appSyncStatus = 'pending';
          rec.version = 1;
        });

        // Get site name
        let siteName = '';
        try {
          const site = await database.collections.get('sites').find(siteId);
          siteName = (site as any).name;
        } catch (error) {
          logger.warn('[DoorsPackage] Site not found:', siteId);
        }

        newPackage = {
          id: (record as any).id,
          doorsId: (record as any).doorsId,
          projectId: (record as any).projectId,
          siteId: (record as any).siteId,
          siteName,
          equipmentType: (record as any).equipmentType,
          materialType: (record as any).materialType,
          category: (record as any).category,
          totalRequirements: (record as any).totalRequirements,
          receivedDate: (record as any).receivedDate,
          reviewedDate: (record as any).reviewedDate,
          status: (record as any).status,
          engineerId: (record as any).engineerId,
          createdAt: (record as any).createdAt,
        };
      });

      if (newPackage) {
        dispatch({ type: 'ADD_PACKAGE', payload: { package: newPackage } });
      }

      Alert.alert('Success', 'DOORS package created successfully');
      announce('DOORS package created successfully');
      dispatch({ type: 'CLOSE_DIALOG' });
    } catch (error) {
      logger.error('[DoorsPackage] Error creating package:', error);
      Alert.alert('Error', 'Failed to create DOORS package');
    }
  };

  const markAsReceived = async (packageId: string) => {
    try {
      const doorsCollection = database.collections.get('doors_packages');
      const packageRecord = await doorsCollection.find(packageId);

      await database.write(async () => {
        await packageRecord.update((record: any) => {
          record.receivedDate = Date.now();
          record.status = 'received';
        });
      });

      const updatedPackage = state.data.packages.find((p) => p.id === packageId);
      if (updatedPackage) {
        dispatch({
          type: 'UPDATE_PACKAGE',
          payload: { package: { ...updatedPackage, status: 'received', receivedDate: Date.now() } },
        });
      }

      Alert.alert('Success', 'Package marked as received');
    } catch (error) {
      logger.error('[DoorsPackage] Error marking as received:', error);
      Alert.alert('Error', 'Failed to update package');
    }
  };

  const markAsReviewed = async (packageId: string) => {
    try {
      const doorsCollection = database.collections.get('doors_packages');
      const packageRecord = await doorsCollection.find(packageId);

      await database.write(async () => {
        await packageRecord.update((record: any) => {
          record.reviewedDate = Date.now();
          record.status = 'reviewed';
        });
      });

      const updatedPackage = state.data.packages.find((p) => p.id === packageId);
      if (updatedPackage) {
        dispatch({
          type: 'UPDATE_PACKAGE',
          payload: { package: { ...updatedPackage, status: 'reviewed', reviewedDate: Date.now() } },
        });
      }

      Alert.alert('Success', 'Package marked as reviewed');
    } catch (error) {
      logger.error('[DoorsPackage] Error marking as reviewed:', error);
      Alert.alert('Error', 'Failed to update package');
    }
  };

  const handleDismissDialog = () => {
    dispatch({ type: 'CLOSE_DIALOG' });
  };

  // Render appropriate empty state
  const renderEmptyState = () => {
    const hasSearchQuery = state.filters.searchQuery.length > 0;
    const hasFilter = state.filters.status !== null;
    const hasNoPackages = state.data.packages.length === 0;

    if (hasNoPackages) {
      // No DOORS packages at all
      return (
        <EmptyState
          icon="package-variant"
          title="No DOORS Packages Yet"
          message="Create your first DOORS package to start tracking engineering requirements"
          helpText="Each DOORS package contains 100 requirements for a specific equipment or material."
          actionText="Create DOORS Package"
          onAction={() => dispatch({ type: 'OPEN_DIALOG' })}
          variant="large"
        />
      );
    } else if (hasSearchQuery) {
      // No search results
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
      // No filter results
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
      <View style={styles.container}>
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
            data={state.data.filteredPackages}
            renderItem={({ item }) => (
              <DoorsPackageCard package={item} onMarkReceived={markAsReceived} onMarkReviewed={markAsReviewed} />
            )}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            accessible
            accessibilityRole="list"
            accessibilityLabel={`DOORS packages list, ${state.data.filteredPackages.length} ${
              state.data.filteredPackages.length === 1 ? 'item' : 'items'
            }`}
            ListEmptyComponent={renderEmptyState()}
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
          </Menu>
        </Portal>

        <CreateDoorsPackageDialog
          visible={state.ui.dialogVisible}
          onDismiss={handleDismissDialog}
          onCreate={handleCreatePackage}
          sites={state.data.sites}
          newDoorsId={state.form.doorsId}
          setNewDoorsId={(doorsId) =>
            dispatch({ type: 'UPDATE_FORM_FIELD', payload: { field: 'doorsId', value: doorsId } })
          }
          newSiteId={state.form.siteId}
          setNewSiteId={(siteId) => dispatch({ type: 'UPDATE_FORM_FIELD', payload: { field: 'siteId', value: siteId } })}
          newEquipmentType={state.form.equipmentType}
          setNewEquipmentType={(equipmentType) =>
            dispatch({ type: 'UPDATE_FORM_FIELD', payload: { field: 'equipmentType', value: equipmentType } })
          }
          newMaterialType={state.form.materialType}
          setNewMaterialType={(materialType) =>
            dispatch({ type: 'UPDATE_FORM_FIELD', payload: { field: 'materialType', value: materialType } })
          }
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
    backgroundColor: '#007AFF',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
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
  siteSelector: {
    marginTop: 8,
  },
});

export default DoorsPackageManagementScreen;
