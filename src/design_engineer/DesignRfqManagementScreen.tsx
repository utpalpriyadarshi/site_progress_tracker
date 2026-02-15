import React, { useReducer, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { FAB, Searchbar, Chip, Snackbar, Menu, Portal, Dialog, Button, TextInput, Paragraph } from 'react-native-paper';
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
import RfqService from '../services/RfqService';

/**
 * DesignRfqManagementScreen (v6.0 - Sprint 1)
 *
 * Sprint 1 Enhancements:
 * - Proper createdById from context (was empty string)
 * - Delivery days validation (1-365)
 * - Edit and Delete for draft RFQs
 * - Header compaction
 * - Snackbar feedback
 */

const DesignRfqManagementScreen = () => {
  const { projectId, projectName, refreshTrigger, engineerId } = useDesignEngineerContext();
  const [state, dispatch] = useReducer(designRfqManagementReducer, createDesignRfqInitialState());
  const { announce } = useAccessibility();
  const navigation = useNavigation();
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [filterMenuVisible, setFilterMenuVisible] = useState(false);
  const [awardDialogVisible, setAwardDialogVisible] = useState(false);
  const [awardRfqId, setAwardRfqId] = useState<string | null>(null);
  const [awardedValue, setAwardedValue] = useState('');
  const [cancelDialogVisible, setCancelDialogVisible] = useState(false);
  const [cancelRfqId, setCancelRfqId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  // Debounce search query for better performance
  const debouncedSearchQuery = useDebounce(state.filters.searchQuery, 300);

  // Load RFQs and DOORS packages
  useEffect(() => {
    loadDoorsPackages();
    loadRfqs();
  }, [projectId, refreshTrigger, engineerId]);

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

      const rfqCollection = database.collections.get('rfqs');
      const rfqsData = await rfqCollection.query(
        Q.where('project_id', projectId),
        Q.where('rfq_type', 'design')
      ).fetch();

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
        evaluatedById: rfq.evaluatedById,
        createdById: rfq.createdById,
        createdAt: rfq.createdAt,
      }));

      logger.debug('[DesignRfq] Loaded RFQs:', rfqsList.length);
      dispatch({ type: 'SET_RFQS', payload: { rfqs: rfqsList } });

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

  const handleCreateOrUpdateRfq = async () => {
    const { title, description, doorsPackageId, expectedDeliveryDays } = state.form;

    if (!title || !doorsPackageId) {
      Alert.alert('Validation Error', 'Please fill in all required fields (Title, DOORS Package)');
      return;
    }

    // Validate delivery days
    const deliveryDays = parseInt(expectedDeliveryDays);
    if (expectedDeliveryDays && (isNaN(deliveryDays) || deliveryDays < 1 || deliveryDays > 365)) {
      Alert.alert('Validation Error', 'Expected delivery days must be between 1 and 365');
      return;
    }

    try {
      const rfqCollection = database.collections.get('rfqs');
      const selectedPackage = state.data.doorsPackages.find((p) => p.id === doorsPackageId);
      const isEditing = !!state.ui.editingRfqId;

      if (!selectedPackage) {
        Alert.alert('Error', 'Selected DOORS package not found');
        return;
      }

      if (isEditing) {
        // Update existing RFQ
        const record = await rfqCollection.find(state.ui.editingRfqId!);

        await database.write(async () => {
          await record.update((rec: any) => {
            rec.title = title;
            rec.description = description || null;
            rec.doorsId = selectedPackage.doorsId;
            rec.doorsPackageId = doorsPackageId;
            rec.expectedDeliveryDays = deliveryDays || 30;
          });
        });

        const existingRfq = state.data.rfqs.find(r => r.id === state.ui.editingRfqId);
        if (existingRfq) {
          const updatedRfq: DesignRfq = {
            ...existingRfq,
            title,
            description: description || undefined,
            doorsId: selectedPackage.doorsId,
            doorsPackageId,
            expectedDeliveryDays: deliveryDays || 30,
          };
          dispatch({ type: 'UPDATE_RFQ', payload: { rfq: updatedRfq } });
        }

        setSnackbarMessage('Design RFQ updated successfully');
        setSnackbarVisible(true);
      } else {
        // Create new RFQ
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
            rec.expectedDeliveryDays = deliveryDays || 30;
            rec.totalVendorsInvited = 0;
            rec.totalQuotesReceived = 0;
            rec.createdById = engineerId;
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

        setSnackbarMessage('Design RFQ created successfully');
        setSnackbarVisible(true);
        announce('Design RFQ created successfully');
      }

      dispatch({ type: 'CLOSE_DIALOG' });
    } catch (error) {
      logger.error('[DesignRfq] Error saving RFQ:', error);
      Alert.alert('Error', 'Failed to save Design RFQ');
    }
  };

  const handleEditRfq = (rfq: DesignRfq) => {
    dispatch({
      type: 'SET_FORM',
      payload: {
        title: rfq.title,
        description: rfq.description || '',
        doorsPackageId: rfq.doorsPackageId,
        expectedDeliveryDays: String(rfq.expectedDeliveryDays || 30),
      },
    });
    dispatch({ type: 'OPEN_DIALOG', payload: { editingRfqId: rfq.id } });
  };

  const handleDeleteRfq = async (rfqId: string) => {
    Alert.alert('Confirm Delete', 'Are you sure you want to delete this Design RFQ?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const rfqCollection = database.collections.get('rfqs');
            const record = await rfqCollection.find(rfqId);
            await database.write(async () => {
              await record.markAsDeleted();
            });
            dispatch({ type: 'DELETE_RFQ', payload: { rfqId } });
            setSnackbarMessage('Design RFQ deleted');
            setSnackbarVisible(true);
          } catch (error) {
            logger.error('[DesignRfq] Error deleting RFQ:', error);
            Alert.alert('Error', 'Failed to delete Design RFQ');
          }
        },
      },
    ]);
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

      setSnackbarMessage('RFQ issued successfully');
      setSnackbarVisible(true);
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

      setSnackbarMessage('Marked as quotes received');
      setSnackbarVisible(true);
    } catch (error) {
      logger.error('[DesignRfq] Error updating RFQ:', error);
      Alert.alert('Error', 'Failed to update RFQ');
    }
  };

  const evaluateRfq = async (rfqId: string) => {
    try {
      const rfqCollection = database.collections.get('rfqs');
      const rfqRecord = await rfqCollection.find(rfqId);
      const now = Date.now();

      await database.write(async () => {
        await rfqRecord.update((record: any) => {
          record.status = 'evaluated';
          record.evaluationDate = now;
          record.evaluatedById = engineerId;
        });
      });

      const updatedRfq = state.data.rfqs.find((r) => r.id === rfqId);
      if (updatedRfq) {
        dispatch({
          type: 'UPDATE_RFQ',
          payload: { rfq: { ...updatedRfq, status: 'evaluated', evaluationDate: now, evaluatedById: engineerId } },
        });
      }

      setSnackbarMessage('RFQ marked as evaluated');
      setSnackbarVisible(true);
    } catch (error) {
      logger.error('[DesignRfq] Error evaluating RFQ:', error);
      Alert.alert('Error', 'Failed to evaluate RFQ');
    }
  };

  const handleAwardRfq = (rfqId: string) => {
    setAwardRfqId(rfqId);
    setAwardedValue('');
    setAwardDialogVisible(true);
  };

  const confirmAwardRfq = async () => {
    if (!awardRfqId) return;

    const value = parseFloat(awardedValue);
    if (!awardedValue || isNaN(value) || value <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid awarded value');
      return;
    }

    try {
      const rfqCollection = database.collections.get('rfqs');
      const rfqRecord = await rfqCollection.find(awardRfqId);
      const now = Date.now();

      await database.write(async () => {
        await rfqRecord.update((record: any) => {
          record.status = 'awarded';
          record.awardDate = now;
          record.awardedValue = value;
        });
      });

      const updatedRfq = state.data.rfqs.find((r) => r.id === awardRfqId);
      if (updatedRfq) {
        dispatch({
          type: 'UPDATE_RFQ',
          payload: { rfq: { ...updatedRfq, status: 'awarded', awardDate: now, awardedValue: value } },
        });
      }

      setAwardDialogVisible(false);
      setSnackbarMessage('RFQ awarded successfully');
      setSnackbarVisible(true);
    } catch (error) {
      logger.error('[DesignRfq] Error awarding RFQ:', error);
      Alert.alert('Error', 'Failed to award RFQ');
    }
  };

  const handleCancelRfq = (rfqId: string) => {
    setCancelRfqId(rfqId);
    setCancelReason('');
    setCancelDialogVisible(true);
  };

  const confirmCancelRfq = async () => {
    if (!cancelRfqId) return;

    try {
      await RfqService.cancelRfq(cancelRfqId, cancelReason || undefined);

      const updatedRfq = state.data.rfqs.find((r) => r.id === cancelRfqId);
      if (updatedRfq) {
        dispatch({
          type: 'UPDATE_RFQ',
          payload: { rfq: { ...updatedRfq, status: 'cancelled' } },
        });
      }

      setCancelDialogVisible(false);
      setSnackbarMessage('RFQ cancelled');
      setSnackbarVisible(true);
    } catch (error: any) {
      logger.error('[DesignRfq] Error cancelling RFQ:', error);
      Alert.alert('Error', error.message || 'Failed to cancel RFQ');
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
          <View style={styles.filterRow}>
            <Chip
              mode={state.filters.status ? 'flat' : 'outlined'}
              selected={state.filters.status !== null}
              onPress={() => setFilterMenuVisible(true)}
              style={styles.filterChip}
              accessible
              accessibilityRole="button"
              accessibilityLabel={state.filters.status ? `Status filter: ${state.filters.status}` : 'Open filter menu'}
            >
              {state.filters.status ? `Status: ${state.filters.status.replace(/_/g, ' ')}` : 'Filter'}
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
              accessibilityLabel="Loading Design RFQs"
              accessibilityRole="progressbar"
            />
          </View>
        ) : (
          <FlatList
            data={state.data.filteredRfqs}
            renderItem={({ item }) => (
              <DesignRfqCard
                rfq={item}
                onIssue={issueRfq}
                onMarkQuotesReceived={markQuotesReceived}
                onEvaluate={evaluateRfq}
                onAward={handleAwardRfq}
                onCancel={handleCancelRfq}
                onEdit={handleEditRfq}
                onDelete={handleDeleteRfq}
              />
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
          onCreate={handleCreateOrUpdateRfq}
          isEditing={!!state.ui.editingRfqId}
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

        <Portal>
          <Menu
            visible={filterMenuVisible}
            onDismiss={() => setFilterMenuVisible(false)}
            anchor={{ x: 0, y: 0 }}
            accessibilityLabel="Status filter menu"
          >
            {[
              { key: 'draft', title: 'Draft' },
              { key: 'issued', title: 'Issued' },
              { key: 'quotes_received', title: 'Quotes Received' },
              { key: 'evaluated', title: 'Evaluated' },
              { key: 'awarded', title: 'Awarded' },
              { key: 'cancelled', title: 'Cancelled' },
            ].map((item) => (
              <Menu.Item
                key={item.key}
                onPress={() => {
                  dispatch({ type: 'SET_FILTER_STATUS', payload: { status: item.key } });
                  setFilterMenuVisible(false);
                }}
                title={item.title}
              />
            ))}
          </Menu>
        </Portal>

        <Portal>
          <Dialog visible={awardDialogVisible} onDismiss={() => setAwardDialogVisible(false)}>
            <Dialog.Title>Award RFQ</Dialog.Title>
            <Dialog.Content>
              <Paragraph>Enter the awarded value for this RFQ.</Paragraph>
              <TextInput
                label="Awarded Value"
                value={awardedValue}
                onChangeText={setAwardedValue}
                mode="outlined"
                keyboardType="numeric"
                style={{ marginTop: 8 }}
              />
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setAwardDialogVisible(false)}>Cancel</Button>
              <Button onPress={confirmAwardRfq}>Award</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>

        <Portal>
          <Dialog visible={cancelDialogVisible} onDismiss={() => setCancelDialogVisible(false)}>
            <Dialog.Title>Cancel RFQ</Dialog.Title>
            <Dialog.Content>
              <Paragraph>Are you sure you want to cancel this RFQ?</Paragraph>
              <TextInput
                label="Reason (optional)"
                value={cancelReason}
                onChangeText={setCancelReason}
                mode="outlined"
                multiline
                numberOfLines={3}
                style={{ marginTop: 8 }}
              />
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setCancelDialogVisible(false)}>Back</Button>
              <Button onPress={confirmCancelRfq} textColor="#F44336">Cancel RFQ</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>

        <Snackbar
          visible={snackbarVisible}
          onDismiss={() => setSnackbarVisible(false)}
          duration={3000}
          action={{
            label: 'Dismiss',
            onPress: () => setSnackbarVisible(false),
          }}
        >
          {snackbarMessage}
        </Snackbar>
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
    marginTop: 4,
  },
});

export default DesignRfqManagementScreen;
