import React, { useReducer, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { FAB, Searchbar, Chip } from 'react-native-paper';
import { useDesignEngineerContext } from './context/DesignEngineerContext';
import ErrorBoundary from '../components/common/ErrorBoundary';
import DesignRfqCard from './components/DesignRfqCard';
import CreateDesignRfqDialog from './components/CreateDesignRfqDialog';
import SiteSelector from './components/SiteSelector';
import { database } from '../../models/database';
import { Q } from '@nozbe/watermelondb';
import { logger } from '../services/LoggingService';
import { DesignRfq } from './types/DesignRfqTypes';
import {
  designRfqManagementReducer,
  createDesignRfqInitialState,
} from './state';
import { useAccessibility } from '../utils/accessibility';
import { useDebounce } from '../utils/performance';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { useAuth } from '../auth/AuthContext';
import { EmptyState } from '../components/common/EmptyState';

/**
 * DesignRfqManagementScreen (v5.0 - Phase 3 Complete)
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
 * Phase 3 Enhancements:
 * - Accessibility: Screen reader support, ARIA labels, keyboard navigation
 * - Performance: Debounced search (300ms delay)
 * - Enhanced UX: Improved empty states and loading indicators
 */

const DesignRfqManagementScreen = () => {
  const { projectId, projectName, refreshTrigger, engineerId, selectedSiteId } = useDesignEngineerContext();
  const [state, dispatch] = useReducer(designRfqManagementReducer, createDesignRfqInitialState());
  const { announce } = useAccessibility();
  const navigation = useNavigation();
  const { logout } = useAuth();

  // Debounce search query for better performance
  const debouncedSearchQuery = useDebounce(state.filters.searchQuery, 300);

  const handleLogout = async () => {
    await logout();
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Auth' as any }],
      })
    );
  };

  // Load RFQs and DOORS packages
  useEffect(() => {
    loadDoorsPackages();
    loadRfqs();
  }, [projectId, refreshTrigger, selectedSiteId, engineerId]);

  const loadDoorsPackages = async () => {
    if (!projectId) return;

    try {
      const doorsCollection = database.collections.get('doors_packages');
      const packagesData = await doorsCollection.query(Q.where('project_id', projectId)).fetch();

      const packagesList = packagesData.map((pkg: any) => ({
        id: pkg.id,
        doorsId: pkg.doorsId,
      }));

      dispatch({ type: 'SET_DOORS_PACKAGES', payload: { packages: packagesList } });
    } catch (error) {
      logger.error('[DesignRfq] Error loading DOORS packages:', error);
    }
  };

  const loadRfqs = async () => {
    if (!projectId || !engineerId) {
      dispatch({ type: 'COMPLETE_LOADING' });
      return;
    }

    try {
      dispatch({ type: 'START_LOADING' });
      logger.info('[DesignRfq] Loading Design RFQs for project:', projectId);

      // Get sites assigned to this designer
      const sitesCollection = database.collections.get('sites');
      const assignedSites = await sitesCollection
        .query(Q.where('design_engineer_id', engineerId))
        .fetch();

      const assignedSiteIds = assignedSites.map((site: any) => site.id);

      // Filter RFQs by assigned sites
      const rfqCollection = database.collections.get('rfqs');
      let rfqsQuery = rfqCollection.query(
        Q.where('project_id', projectId),
        Q.where('rfq_type', 'design'),
        Q.where('site_id', Q.oneOf(assignedSiteIds))
      );

      // Further filter by selected site if not 'all'
      if (selectedSiteId !== 'all') {
        rfqsQuery = rfqCollection.query(
          Q.where('project_id', projectId),
          Q.where('rfq_type', 'design'),
          Q.where('site_id', selectedSiteId)
        );
      }

      const rfqsData = await rfqsQuery.fetch();

      const rfqsList: DesignRfq[] = rfqsData.map((rfq: any) => ({
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
      dispatch({ type: 'SET_RFQS', payload: { rfqs: rfqsList } });

      // Accessibility announcement
      announce(`Loaded ${rfqsList.length} Design RFQ${rfqsList.length !== 1 ? 's' : ''}`);
    } catch (error) {
      logger.error('[DesignRfq] Error loading RFQs:', error);
      Alert.alert('Error', 'Failed to load Design RFQs');
    } finally {
      dispatch({ type: 'COMPLETE_LOADING' });
    }
  };

  const generateRfqNumber = () => {
    const timestamp = Date.now().toString().slice(-6);
    return `DRFQ-${timestamp}`;
  };

  const handleCreateRfq = async () => {
    const { title, description, doorsPackageId, expectedDeliveryDays } = state.form;

    if (!title || !doorsPackageId) {
      Alert.alert('Validation Error', 'Please fill in all required fields');
      return;
    }

    try {
      const rfqCollection = database.collections.get('rfqs');
      const selectedPackage = state.data.doorsPackages.find((p) => p.id === doorsPackageId);

      if (!selectedPackage) {
        Alert.alert('Error', 'Selected DOORS package not found');
        return;
      }

      let newRfq: DesignRfq | null = null;

      await database.write(async () => {
        const record = await rfqCollection.create((rec: any) => {
          rec.rfqNumber = generateRfqNumber();
          rec.doorsId = selectedPackage.doorsId;
          rec.doorsPackageId = doorsPackageId;
          rec.projectId = projectId;
          rec.title = title;
          rec.description = description || null;
          rec.status = 'draft';
          rec.rfqType = 'design';
          rec.expectedDeliveryDays = parseInt(expectedDeliveryDays) || 30;
          rec.totalVendorsInvited = 0;
          rec.totalQuotesReceived = 0;
          rec.createdById = '';
          rec.appSyncStatus = 'pending';
          rec.version = 1;
        });

        newRfq = {
          id: (record as any).id,
          rfqNumber: (record as any).rfqNumber,
          doorsId: (record as any).doorsId,
          doorsPackageId: (record as any).doorsPackageId,
          projectId: (record as any).projectId,
          title: (record as any).title,
          description: (record as any).description,
          status: (record as any).status,
          rfqType: (record as any).rfqType,
          issueDate: (record as any).issueDate,
          closingDate: (record as any).closingDate,
          evaluationDate: (record as any).evaluationDate,
          awardDate: (record as any).awardDate,
          expectedDeliveryDays: (record as any).expectedDeliveryDays,
          totalVendorsInvited: (record as any).totalVendorsInvited,
          totalQuotesReceived: (record as any).totalQuotesReceived,
          winningVendorId: (record as any).winningVendorId,
          awardedValue: (record as any).awardedValue,
          createdById: (record as any).createdById,
          createdAt: (record as any).createdAt,
        };
      });

      if (newRfq) {
        dispatch({ type: 'ADD_RFQ', payload: { rfq: newRfq } });
      }

      Alert.alert('Success', 'Design RFQ created successfully');
      announce('Design RFQ created successfully');
      dispatch({ type: 'CLOSE_DIALOG' });
    } catch (error) {
      logger.error('[DesignRfq] Error creating RFQ:', error);
      Alert.alert('Error', 'Failed to create Design RFQ');
    }
  };

  const issueRfq = async (rfqId: string) => {
    try {
      const rfqCollection = database.collections.get('rfqs');
      const rfqRecord = await rfqCollection.find(rfqId);

      await database.write(async () => {
        await rfqRecord.update((record: any) => {
          record.status = 'issued';
          record.issueDate = Date.now();
        });
      });

      const updatedRfq = state.data.rfqs.find((r) => r.id === rfqId);
      if (updatedRfq) {
        dispatch({
          type: 'UPDATE_RFQ',
          payload: { rfq: { ...updatedRfq, status: 'issued', issueDate: Date.now() } },
        });
      }

      Alert.alert('Success', 'RFQ issued successfully');
    } catch (error) {
      logger.error('[DesignRfq] Error issuing RFQ:', error);
      Alert.alert('Error', 'Failed to issue RFQ');
    }
  };

  const markQuotesReceived = async (rfqId: string) => {
    try {
      const rfqCollection = database.collections.get('rfqs');
      const rfqRecord = await rfqCollection.find(rfqId);

      await database.write(async () => {
        await rfqRecord.update((record: any) => {
          record.status = 'quotes_received';
        });
      });

      const updatedRfq = state.data.rfqs.find((r) => r.id === rfqId);
      if (updatedRfq) {
        dispatch({
          type: 'UPDATE_RFQ',
          payload: { rfq: { ...updatedRfq, status: 'quotes_received' } },
        });
      }

      Alert.alert('Success', 'Marked as quotes received');
    } catch (error) {
      logger.error('[DesignRfq] Error updating RFQ:', error);
      Alert.alert('Error', 'Failed to update RFQ');
    }
  };

  const handleDismissDialog = () => {
    dispatch({ type: 'CLOSE_DIALOG' });
  };

  // Render appropriate empty state
  const renderEmptyState = () => {
    const hasSearchQuery = state.filters.searchQuery.length > 0;
    const hasFilter = state.filters.status !== null;
    const hasNoRfqs = state.data.rfqs.length === 0;

    if (hasNoRfqs) {
      // No Design RFQs at all
      return (
        <EmptyState
          icon="file-document-edit"
          title="No Design RFQs Yet"
          message="Create your first Design RFQ to request vendor quotes during the engineering phase"
          helpText="Design RFQs are used before PM200 approval. Link each RFQ to a DOORS package."
          actionText="Create Design RFQ"
          onAction={() => dispatch({ type: 'OPEN_DIALOG' })}
          variant="large"
        />
      );
    } else if (hasSearchQuery) {
      // No search results
      return (
        <EmptyState
          icon="magnify"
          title="No RFQs Found"
          message={`No Design RFQs match "${state.filters.searchQuery}". Try adjusting your search.`}
          actionText="Clear Search"
          onAction={() => dispatch({ type: 'SET_SEARCH_QUERY', payload: { query: '' } })}
          secondaryActionText="Create New RFQ"
          onSecondaryAction={() => dispatch({ type: 'OPEN_DIALOG' })}
          variant="search"
        />
      );
    } else if (hasFilter) {
      // No filter results
      return (
        <EmptyState
          icon="filter-off"
          title={`No ${state.filters.status} RFQs`}
          message={`There are no Design RFQs with "${state.filters.status}" status.`}
          actionText="Clear Filter"
          onAction={() => dispatch({ type: 'SET_FILTER_STATUS', payload: { status: null } })}
          secondaryActionText="View All RFQs"
          onSecondaryAction={() => {
            dispatch({ type: 'SET_FILTER_STATUS', payload: { status: null } });
            announce('Showing all RFQs');
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
              <Text style={styles.screenLabel}>Design RFQ Management</Text>
            </View>
            <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
          <SiteSelector style={styles.siteSelector} />
          <Searchbar
            placeholder="Search Design RFQs..."
            onChangeText={(query) => dispatch({ type: 'SET_SEARCH_QUERY', payload: { query } })}
            value={state.filters.searchQuery}
            style={styles.searchbar}
            accessible
            accessibilityLabel="Search Design RFQs"
            accessibilityHint="Enter text to search for RFQs by number or title"
            accessibilityRole="search"
          />
          <View
            style={styles.filterRow}
            accessible
            accessibilityRole="radiogroup"
            accessibilityLabel="Filter RFQs by status"
          >
            <Chip
              mode={state.filters.status ? 'flat' : 'outlined'}
              selected={state.filters.status === 'draft'}
              onPress={() =>
                dispatch({
                  type: 'SET_FILTER_STATUS',
                  payload: { status: state.filters.status === 'draft' ? null : 'draft' },
                })
              }
              style={styles.filterChip}
              accessible
              accessibilityRole="radio"
              accessibilityLabel="Draft filter"
              accessibilityState={{ checked: state.filters.status === 'draft' }}
              accessibilityHint={
                state.filters.status === 'draft' ? 'Double tap to clear filter' : 'Double tap to filter by draft RFQs'
              }
            >
              {state.filters.status === 'draft' ? 'Clear Draft' : 'Draft'}
            </Chip>
            <Chip
              mode={state.filters.status ? 'flat' : 'outlined'}
              selected={state.filters.status === 'issued'}
              onPress={() =>
                dispatch({
                  type: 'SET_FILTER_STATUS',
                  payload: { status: state.filters.status === 'issued' ? null : 'issued' },
                })
              }
              style={styles.filterChip}
              accessible
              accessibilityRole="radio"
              accessibilityLabel="Issued filter"
              accessibilityState={{ checked: state.filters.status === 'issued' }}
              accessibilityHint={
                state.filters.status === 'issued'
                  ? 'Double tap to clear filter'
                  : 'Double tap to filter by issued RFQs'
              }
            >
              {state.filters.status === 'issued' ? 'Clear Issued' : 'Issued'}
            </Chip>
            <Chip
              mode={state.filters.status ? 'flat' : 'outlined'}
              selected={state.filters.status === 'awarded'}
              onPress={() =>
                dispatch({
                  type: 'SET_FILTER_STATUS',
                  payload: { status: state.filters.status === 'awarded' ? null : 'awarded' },
                })
              }
              style={styles.filterChip}
              accessible
              accessibilityRole="radio"
              accessibilityLabel="Awarded filter"
              accessibilityState={{ checked: state.filters.status === 'awarded' }}
              accessibilityHint={
                state.filters.status === 'awarded'
                  ? 'Double tap to clear filter'
                  : 'Double tap to filter by awarded RFQs'
              }
            >
              {state.filters.status === 'awarded' ? 'Clear Awarded' : 'Awarded'}
            </Chip>
          </View>
        </View>

        {state.ui.loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator
              size="large"
              color="#007AFF"
              accessible
              accessibilityLabel="Loading Design RFQs"
              accessibilityRole="progressbar"
            />
          </View>
        ) : (
          <FlatList
            data={state.data.filteredRfqs}
            renderItem={({ item }) => (
              <DesignRfqCard rfq={item} onIssue={issueRfq} onMarkQuotesReceived={markQuotesReceived} />
            )}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            accessible
            accessibilityRole="list"
            accessibilityLabel={`Design RFQs list, ${state.data.filteredRfqs.length} ${
              state.data.filteredRfqs.length === 1 ? 'item' : 'items'
            }`}
            ListEmptyComponent={renderEmptyState()}
          />
        )}

        <FAB
          icon="plus"
          style={styles.fab}
          onPress={() => dispatch({ type: 'OPEN_DIALOG' })}
          label="New Design RFQ"
          accessible
          accessibilityLabel="Create new Design RFQ"
          accessibilityRole="button"
          accessibilityHint="Double tap to open dialog for creating a new Design RFQ"
        />

        <CreateDesignRfqDialog
          visible={state.ui.dialogVisible}
          onDismiss={handleDismissDialog}
          onCreate={handleCreateRfq}
          doorsPackages={state.data.doorsPackages}
          newTitle={state.form.title}
          setNewTitle={(title) => dispatch({ type: 'UPDATE_FORM_FIELD', payload: { field: 'title', value: title } })}
          newDescription={state.form.description}
          setNewDescription={(description) =>
            dispatch({ type: 'UPDATE_FORM_FIELD', payload: { field: 'description', value: description } })
          }
          newDoorsPackageId={state.form.doorsPackageId}
          setNewDoorsPackageId={(doorsPackageId) =>
            dispatch({ type: 'UPDATE_FORM_FIELD', payload: { field: 'doorsPackageId', value: doorsPackageId } })
          }
          newExpectedDeliveryDays={state.form.expectedDeliveryDays}
          setNewExpectedDeliveryDays={(expectedDeliveryDays) =>
            dispatch({
              type: 'UPDATE_FORM_FIELD',
              payload: { field: 'expectedDeliveryDays', value: expectedDeliveryDays },
            })
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
  logoutButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
  },
  logoutText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
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
  siteSelector: {
    marginTop: 8,
  },
});

export default DesignRfqManagementScreen;
