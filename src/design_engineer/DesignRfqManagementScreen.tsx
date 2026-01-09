import React, { useReducer, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert } from 'react-native';
import { FAB, Searchbar, Chip } from 'react-native-paper';
import { useDesignEngineerContext } from './context/DesignEngineerContext';
import ErrorBoundary from '../components/common/ErrorBoundary';
import DesignRfqCard from './components/DesignRfqCard';
import CreateDesignRfqDialog from './components/CreateDesignRfqDialog';
import { database } from '../../models/database';
import { Q } from '@nozbe/watermelondb';
import { logger } from '../services/LoggingService';
import { DesignRfq } from './types/DesignRfqTypes';
import {
  designRfqManagementReducer,
  createDesignRfqInitialState,
} from './state';

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
  const [state, dispatch] = useReducer(designRfqManagementReducer, createDesignRfqInitialState());

  // Load RFQs and DOORS packages
  useEffect(() => {
    loadDoorsPackages();
    loadRfqs();
  }, [projectId, refreshTrigger]);

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
    if (!projectId) {
      dispatch({ type: 'COMPLETE_LOADING' });
      return;
    }

    try {
      dispatch({ type: 'START_LOADING' });
      logger.info('[DesignRfq] Loading Design RFQs for project:', projectId);

      const rfqCollection = database.collections.get('rfqs');
      const rfqsData = await rfqCollection
        .query(Q.where('project_id', projectId), Q.where('rfq_type', 'design'))
        .fetch();

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
            onChangeText={(query) => dispatch({ type: 'SET_SEARCH_QUERY', payload: { query } })}
            value={state.filters.searchQuery}
            style={styles.searchbar}
          />
          <View style={styles.filterRow}>
            <Chip
              mode={state.filters.status ? 'flat' : 'outlined'}
              selected={state.filters.status !== null}
              onPress={() =>
                dispatch({
                  type: 'SET_FILTER_STATUS',
                  payload: { status: state.filters.status === 'draft' ? null : 'draft' },
                })
              }
              style={styles.filterChip}
            >
              {state.filters.status === 'draft' ? 'Clear Draft' : 'Draft'}
            </Chip>
            <Chip
              mode={state.filters.status ? 'flat' : 'outlined'}
              selected={state.filters.status !== null}
              onPress={() =>
                dispatch({
                  type: 'SET_FILTER_STATUS',
                  payload: { status: state.filters.status === 'issued' ? null : 'issued' },
                })
              }
              style={styles.filterChip}
            >
              {state.filters.status === 'issued' ? 'Clear Issued' : 'Issued'}
            </Chip>
            <Chip
              mode={state.filters.status ? 'flat' : 'outlined'}
              selected={state.filters.status !== null}
              onPress={() =>
                dispatch({
                  type: 'SET_FILTER_STATUS',
                  payload: { status: state.filters.status === 'awarded' ? null : 'awarded' },
                })
              }
              style={styles.filterChip}
            >
              {state.filters.status === 'awarded' ? 'Clear Awarded' : 'Awarded'}
            </Chip>
          </View>
        </View>

        {state.ui.loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
          </View>
        ) : (
          <FlatList
            data={state.data.filteredRfqs}
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

        <FAB
          icon="plus"
          style={styles.fab}
          onPress={() => dispatch({ type: 'OPEN_DIALOG' })}
          label="New Design RFQ"
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
