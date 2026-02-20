import React, { useReducer, useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert } from 'react-native';
import { FAB, Searchbar, Chip, Snackbar, Menu, Portal, Dialog, Button, TextInput, Paragraph } from 'react-native-paper';
import { useDesignEngineerContext } from './context/DesignEngineerContext';
import ErrorBoundary from '../components/common/ErrorBoundary';
import DesignRfqCard from './components/DesignRfqCard';
import CreateDesignRfqDialog from './components/CreateDesignRfqDialog';
import VendorQuotesSheet from './components/VendorQuotesSheet';
import SiteSelector from './components/SiteSelector';
import { Vendor } from './types/VendorQuoteTypes';
import { database } from '../../models/database';
import { Q } from '@nozbe/watermelondb';
import { logger } from '../services/LoggingService';
import { DesignRfq, DoorsPackage, Domain } from './types/DesignRfqTypes';
import DomainModel from '../../models/DomainModel';
import DoorsPackageModel from '../../models/DoorsPackageModel';
import SiteModel from '../../models/SiteModel';
import VendorModel from '../../models/VendorModel';
import RfqModel from '../../models/RfqModel';
import {
  designRfqManagementReducer,
  createDesignRfqInitialState,
} from './state';
import { useAccessibility } from '../utils/accessibility';
import { useDebounce } from '../utils/performance';
import { useNavigation, CommonActions, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../auth/AuthContext';
import { EmptyState } from '../components/common/EmptyState';
import RfqService from '../services/RfqService';
import { validateRfqTitle, getErrorMessage } from './utils/validation';
import { COLORS } from '../theme/colors';
import { useSnackbar } from '../hooks/useSnackbar';
import { useFlatListProps } from '../hooks/useFlatListProps';

const RFQ_STATUS_DOTS: { key: string; label: string; color: string }[] = [
  { key: 'draft', label: 'Draft', color: COLORS.DISABLED },
  { key: 'issued', label: 'Issued', color: COLORS.INFO },
  { key: 'quotes_received', label: 'Quotes Recd', color: COLORS.WARNING },
  { key: 'evaluated', label: 'Evaluated', color: COLORS.STATUS_EVALUATED },
  { key: 'awarded', label: 'Awarded', color: COLORS.SUCCESS },
  { key: 'cancelled', label: 'Cancelled', color: COLORS.ERROR },
];

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
  const { show: showSnackbar, snackbarProps } = useSnackbar();

  const rfqStatusCounts = useMemo(
    () => state.data.rfqs.reduce((acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    [state.data.rfqs]
  );

  const totalAwardedValue = useMemo(
    () => state.data.rfqs
      .filter(r => r.status === 'awarded' && r.awardedValue)
      .reduce((sum, r) => sum + (r.awardedValue || 0), 0),
    [state.data.rfqs]
  );

  const flatListProps = useFlatListProps<DesignRfq>();
  const [filterMenuVisible, setFilterMenuVisible] = useState(false);
  const [awardDialogVisible, setAwardDialogVisible] = useState(false);
  const [awardRfqId, setAwardRfqId] = useState<string | null>(null);
  const [awardedValue, setAwardedValue] = useState('');
  const [cancelDialogVisible, setCancelDialogVisible] = useState(false);
  const [cancelRfqId, setCancelRfqId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Debounce search query for better performance
  const debouncedSearchQuery = useDebounce(state.filters.searchQuery, 300);

  // Load RFQs, DOORS packages, vendors, and domains
  useEffect(() => {
    loadDomains();
    loadDoorsPackages();
    loadRfqs();
    loadVendors();
  }, [projectId, refreshTrigger, engineerId]);

  // Reload DOORS packages and RFQs when tab gains focus (e.g., after creating packages on DOORS tab)
  useFocusEffect(
    useCallback(() => {
      if (projectId) {
        loadDomains();
        loadDoorsPackages();
        loadRfqs();
      }
    }, [projectId, engineerId])
  );

  const loadDomains = async () => {
    if (!projectId) return;
    try {
      const domainsCollection = database.collections.get<DomainModel>('domains');
      const domainsData = await domainsCollection.query(Q.where('project_id', projectId)).fetch();
      const domainsList: Domain[] = domainsData.map((d: DomainModel) => ({ id: d.id, name: d.name }));
      dispatch({ type: 'SET_DOMAINS', payload: { domains: domainsList } });
    } catch (error) {
      logger.error('[DesignRfq] Error loading domains:', error);
    }
  };

  const loadDoorsPackages = async () => {
    if (!projectId) return;

    try {
      const doorsCollection = database.collections.get<DoorsPackageModel>('doors_packages');
      const packagesData = await doorsCollection.query(Q.where('project_id', projectId)).fetch();

      const packagesList: DoorsPackage[] = await Promise.all(
        packagesData.map(async (pkg: DoorsPackageModel) => {
          let siteName = '';
          if (pkg.siteId) {
            try {
              const site = await database.collections.get<SiteModel>('sites').find(pkg.siteId);
              siteName = site.name;
            } catch (e) { /* site not found */ }
          }
          let domainName = '';
          if (pkg.domainId) {
            try {
              const domain = await database.collections.get<DomainModel>('domains').find(pkg.domainId);
              domainName = domain.name;
            } catch (e) { /* domain not found */ }
          }
          return {
            id: pkg.id,
            doorsId: pkg.doorsId,
            equipmentType: pkg.equipmentType,
            category: pkg.category,
            domainId: pkg.domainId,
            domainName,
            materialType: pkg.materialType,
            totalRequirements: pkg.totalRequirements,
            siteName,
            siteId: pkg.siteId,
          };
        })
      );

      dispatch({ type: 'SET_DOORS_PACKAGES', payload: { packages: packagesList } });
    } catch (error) {
      logger.error('[DesignRfq] Error loading DOORS packages:', error);
    }
  };

  const loadVendors = async () => {
    try {
      const vendorsCollection = database.collections.get<VendorModel>('vendors');
      const vendorsData = await vendorsCollection.query().fetch();
      const vendorsList: Vendor[] = vendorsData.map((v: VendorModel) => ({
        id: v.id,
        vendorCode: v.vendorCode,
        vendorName: v.vendorName,
        category: v.category,
        contactPerson: v.contactPerson,
        email: v.email,
        phone: v.phone,
        rating: v.rating,
        isApproved: v.isApproved,
        performanceScore: v.performanceScore,
      }));
      setVendors(vendorsList);
    } catch (error) {
      logger.error('[DesignRfq] Error loading vendors:', error);
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

      const rfqCollection = database.collections.get<RfqModel>('rfqs');
      const rfqsData = await rfqCollection.query(
        Q.where('project_id', projectId),
        Q.where('rfq_type', 'design')
      ).fetch();

      const rfqsList: DesignRfq[] = rfqsData.map((rfq: RfqModel) => ({
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
      Alert.alert('Error', getErrorMessage(error, 'Design RFQs'));
    } finally {
      dispatch({ type: 'COMPLETE_LOADING' });
    }
  };

  const generateRfqNumber = () => {
    const timestamp = Date.now().toString().slice(-6);
    return `DRFQ-${timestamp}`;
  };

  const handlePackageSelected = (pkg: DoorsPackage) => {
    const domainName = pkg.domainName || '';
    const autoTitle = `Design RFQ - ${pkg.equipmentType}${domainName ? ` - ${domainName}` : ''}`;
    const autoDesc = `${pkg.equipmentType}${pkg.materialType ? ` (${pkg.materialType})` : ''} - ${pkg.totalRequirements} requirements`;
    dispatch({
      type: 'SET_FORM',
      payload: {
        title: autoTitle,
        description: autoDesc,
        doorsPackageId: pkg.id,
        domainId: pkg.domainId || '',
      },
    });
  };

  const handleCreateOrUpdateRfq = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    const { title, description, doorsPackageId, expectedDeliveryDays } = state.form;

    if (!doorsPackageId) {
      Alert.alert('Validation Error', 'Please select a DOORS Package');
      return;
    }

    const titleValidation = validateRfqTitle(title);
    if (!titleValidation.valid) {
      Alert.alert('Validation Error', titleValidation.message || 'Please enter a valid RFQ title');
      return;
    }

    // Validate delivery days
    const deliveryDays = parseInt(expectedDeliveryDays);
    if (expectedDeliveryDays && (isNaN(deliveryDays) || deliveryDays < 1 || deliveryDays > 365)) {
      Alert.alert('Validation Error', 'Expected delivery days must be between 1 and 365');
      return;
    }

    try {
      const rfqCollection = database.collections.get<RfqModel>('rfqs');
      const selectedPackage = state.data.doorsPackages.find((p) => p.id === doorsPackageId);
      const isEditing = !!state.ui.editingRfqId;

      if (!selectedPackage) {
        Alert.alert('Error', 'Selected DOORS package not found');
        return;
      }

      // Check for existing active RFQ on same DOORS package (create only)
      if (!isEditing) {
        const existingActiveCount = await rfqCollection
          .query(
            Q.where('doors_package_id', doorsPackageId),
            Q.where('rfq_type', 'design'),
            Q.where('status', Q.notEq('cancelled'))
          )
          .fetchCount();

        if (existingActiveCount > 0) {
          Alert.alert(
            'Active RFQ Exists',
            `There is already an active Design RFQ for DOORS package "${selectedPackage.doorsId}". Cancel or complete it before creating a new one.`
          );
          return;
        }
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

        showSnackbar('Design RFQ updated successfully');
      } else {
        // Create new RFQ
        let newRfq: DesignRfq | null = null;

        await database.write(async () => {
          const record = await rfqCollection.create((rec: any) => {
            rec.rfqNumber = generateRfqNumber();
            rec.doorsId = selectedPackage.doorsId;
            rec.doorsPackageId = doorsPackageId;
            rec.projectId = projectId;
            rec.domainId = state.form.domainId || null;
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
            id: record.id,
            rfqNumber: record.rfqNumber,
            doorsId: record.doorsId,
            doorsPackageId: record.doorsPackageId,
            projectId: record.projectId,
            title: record.title,
            description: record.description,
            status: record.status,
            rfqType: record.rfqType,
            issueDate: record.issueDate,
            closingDate: record.closingDate,
            evaluationDate: record.evaluationDate,
            awardDate: record.awardDate,
            expectedDeliveryDays: record.expectedDeliveryDays,
            totalVendorsInvited: record.totalVendorsInvited,
            totalQuotesReceived: record.totalQuotesReceived,
            winningVendorId: record.winningVendorId,
            awardedValue: record.awardedValue,
            createdById: record.createdById,
            createdAt: record.createdAt,
          };
        });

        if (newRfq) {
          dispatch({ type: 'ADD_RFQ', payload: { rfq: newRfq } });
        }

        showSnackbar('Design RFQ created successfully');
        announce('Design RFQ created successfully');
      }

      dispatch({ type: 'CLOSE_DIALOG' });
    } catch (error) {
      logger.error('[DesignRfq] Error saving RFQ:', error);
      Alert.alert('Error', getErrorMessage(error, 'Design RFQ'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditRfq = useCallback((rfq: DesignRfq) => {
    dispatch({
      type: 'SET_FORM',
      payload: {
        title: rfq.title,
        description: rfq.description || '',
        domainId: rfq.domainId || '',
        doorsPackageId: rfq.doorsPackageId,
        expectedDeliveryDays: String(rfq.expectedDeliveryDays || 30),
      },
    });
    dispatch({ type: 'OPEN_DIALOG', payload: { editingRfqId: rfq.id } });
  }, [dispatch]);

  const handleDuplicateRfq = useCallback((rfq: DesignRfq) => {
    dispatch({
      type: 'SET_FORM',
      payload: {
        title: rfq.title + ' (Copy)',
        description: rfq.description || '',
        domainId: rfq.domainId || '',
        doorsPackageId: rfq.doorsPackageId,
        expectedDeliveryDays: String(rfq.expectedDeliveryDays || 30),
      },
    });
    dispatch({ type: 'OPEN_DIALOG' });
  }, [dispatch]);

  const handleDeleteRfq = useCallback(async (rfqId: string) => {
    Alert.alert('Confirm Delete', 'Are you sure you want to delete this Design RFQ?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const rfqCollection = database.collections.get<RfqModel>('rfqs');
            const record = await rfqCollection.find(rfqId);
            await database.write(async () => {
              await record.markAsDeleted();
            });
            dispatch({ type: 'DELETE_RFQ', payload: { rfqId } });
            showSnackbar('Design RFQ deleted');
          } catch (error) {
            logger.error('[DesignRfq] Error deleting RFQ:', error);
            Alert.alert('Error', getErrorMessage(error, 'Design RFQ'));
          }
        },
      },
    ]);
  }, [dispatch, showSnackbar]);

  const issueRfq = useCallback(async (rfqId: string) => {
    try {
      const rfqCollection = database.collections.get<RfqModel>('rfqs');
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

      showSnackbar('RFQ issued successfully');
    } catch (error) {
      logger.error('[DesignRfq] Error issuing RFQ:', error);
      Alert.alert('Error', getErrorMessage(error, 'Design RFQ'));
    }
  }, [state.data.rfqs, dispatch, showSnackbar]);

  const markQuotesReceived = useCallback(async (rfqId: string) => {
    try {
      const rfqCollection = database.collections.get<RfqModel>('rfqs');
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

      showSnackbar('Marked as quotes received');
    } catch (error) {
      logger.error('[DesignRfq] Error updating RFQ:', error);
      Alert.alert('Error', getErrorMessage(error, 'Design RFQ'));
    }
  }, [state.data.rfqs, dispatch, showSnackbar]);

  const evaluateRfq = useCallback(async (rfqId: string) => {
    try {
      const rfqCollection = database.collections.get<RfqModel>('rfqs');
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

      showSnackbar('RFQ marked as evaluated');
    } catch (error) {
      logger.error('[DesignRfq] Error evaluating RFQ:', error);
      Alert.alert('Error', getErrorMessage(error, 'Design RFQ'));
    }
  }, [state.data.rfqs, engineerId, dispatch, showSnackbar]);

  const handleAwardRfq = useCallback((rfqId: string) => {
    setAwardRfqId(rfqId);
    setAwardedValue('');
    setAwardDialogVisible(true);
  }, []);

  const confirmAwardRfq = async () => {
    if (!awardRfqId) return;

    const value = parseFloat(awardedValue);
    if (!awardedValue || isNaN(value) || value <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid awarded value');
      return;
    }

    try {
      const rfqCollection = database.collections.get<RfqModel>('rfqs');
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
      showSnackbar('RFQ awarded successfully');
    } catch (error) {
      logger.error('[DesignRfq] Error awarding RFQ:', error);
      Alert.alert('Error', getErrorMessage(error, 'Design RFQ'));
    }
  };

  const handleCancelRfq = useCallback((rfqId: string) => {
    setCancelRfqId(rfqId);
    setCancelReason('');
    setCancelDialogVisible(true);
  }, []);

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
      showSnackbar('RFQ cancelled');
    } catch (error: any) {
      logger.error('[DesignRfq] Error cancelling RFQ:', error);
      Alert.alert('Error', error.message || 'Failed to cancel RFQ');
    }
  };

  const handleViewQuotes = useCallback((rfqId: string) => {
    dispatch({ type: 'OPEN_QUOTES_SHEET', payload: { rfqId } });
  }, [dispatch]);

  const handleQuotesRfqUpdated = (updatedRfq: DesignRfq) => {
    dispatch({ type: 'UPDATE_RFQ', payload: { rfq: updatedRfq } });
  };

  const handleSelectRfq = useCallback(
    (id: string) => dispatch({ type: 'TOGGLE_RFQ_SELECTION', payload: { rfqId: id } }),
    [dispatch]
  );

  // Bulk operations
  const handleLongPress = useCallback((rfqId: string) => {
    if (!state.ui.bulkSelectMode) {
      dispatch({ type: 'TOGGLE_BULK_MODE' });
      dispatch({ type: 'TOGGLE_RFQ_SELECTION', payload: { rfqId } });
    }
  }, [state.ui.bulkSelectMode, dispatch]);

  const handleBulkIssue = async () => {
    const selectedIds = state.ui.selectedRfqIds;
    const draftIds = state.data.rfqs
      .filter((r) => selectedIds.includes(r.id) && r.status === 'draft')
      .map((r) => r.id);

    if (draftIds.length === 0) {
      Alert.alert('No Draft RFQs', 'Only draft RFQs can be issued. Select at least one draft RFQ.');
      return;
    }

    try {
      const rfqCollection = database.collections.get<RfqModel>('rfqs');
      const now = Date.now();

      await database.write(async () => {
        for (const id of draftIds) {
          const record = await rfqCollection.find(id);
          await record.update((rec: any) => {
            rec.status = 'issued';
            rec.issueDate = now;
          });
        }
      });

      // Update state for each issued RFQ
      for (const id of draftIds) {
        const rfq = state.data.rfqs.find((r) => r.id === id);
        if (rfq) {
          dispatch({
            type: 'UPDATE_RFQ',
            payload: { rfq: { ...rfq, status: 'issued', issueDate: now } },
          });
        }
      }

      dispatch({ type: 'CLEAR_SELECTION' });
      showSnackbar(`${draftIds.length} RFQ(s) issued successfully`);
    } catch (error) {
      logger.error('[DesignRfq] Error bulk issuing RFQs:', error);
      Alert.alert('Error', 'Failed to issue selected RFQs');
    }
  };

  const handleDismissDialog = () => {
    dispatch({ type: 'CLOSE_DIALOG' });
  };

  const renderItem = useCallback(({ item }: { item: DesignRfq }) => (
    <DesignRfqCard
      rfq={item}
      onIssue={issueRfq}
      onMarkQuotesReceived={markQuotesReceived}
      onEvaluate={evaluateRfq}
      onAward={handleAwardRfq}
      onCancel={handleCancelRfq}
      onEdit={handleEditRfq}
      onDelete={handleDeleteRfq}
      onDuplicate={handleDuplicateRfq}
      onViewQuotes={handleViewQuotes}
      bulkSelectMode={state.ui.bulkSelectMode}
      isSelected={state.ui.selectedRfqIds.includes(item.id)}
      onSelect={handleSelectRfq}
      onLongPress={handleLongPress}
    />
  ), [issueRfq, markQuotesReceived, evaluateRfq, handleAwardRfq, handleCancelRfq, handleEditRfq, handleDeleteRfq, handleDuplicateRfq, handleViewQuotes, handleSelectRfq, handleLongPress, state.ui.bulkSelectMode, state.ui.selectedRfqIds]);

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

        {/* Summary Bar */}
        {!state.ui.loading && state.data.rfqs.length > 0 && (
          <View style={styles.summaryBar}>
            <View style={styles.summaryTopRow}>
              <Text style={styles.summaryCount}>{state.data.rfqs.length} RFQ{state.data.rfqs.length !== 1 ? 's' : ''}</Text>
              {totalAwardedValue > 0 && (
                <Text style={styles.summaryAwarded}>
                  Awarded: {'\u20B9'}{totalAwardedValue.toLocaleString('en-IN')}
                </Text>
              )}
            </View>
            <View style={styles.summaryStatusRow}>
              {RFQ_STATUS_DOTS.filter(s => rfqStatusCounts[s.key]).map(s => (
                <View key={s.key} style={styles.summaryStatusItem}>
                  <View style={[styles.summaryDot, { backgroundColor: s.color }]} />
                  <Text style={styles.summaryStatusText}>{rfqStatusCounts[s.key]} {s.label}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {state.ui.bulkSelectMode && (
          <View style={styles.bulkBar}>
            <Text style={styles.bulkCount}>{state.ui.selectedRfqIds.length} selected</Text>
            <Button compact mode="outlined" onPress={() => dispatch({ type: 'SELECT_ALL_RFQS' })}>
              Select All
            </Button>
            <Button
              compact
              mode="contained"
              onPress={handleBulkIssue}
              disabled={state.ui.selectedRfqIds.length === 0}>
              Issue All
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
              accessibilityLabel="Loading Design RFQs"
              accessibilityRole="progressbar"
            />
          </View>
        ) : (
          <FlatList
            {...flatListProps}
            data={state.data.filteredRfqs}
            renderItem={renderItem}
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
          isSubmitting={isSubmitting}
          domains={state.data.domains}
          doorsPackages={state.data.doorsPackages}
          newTitle={state.form.title}
          setNewTitle={(title) => dispatch({ type: 'UPDATE_FORM_FIELD', payload: { field: 'title', value: title } })}
          newDescription={state.form.description}
          setNewDescription={(description) =>
            dispatch({ type: 'UPDATE_FORM_FIELD', payload: { field: 'description', value: description } })
          }
          newDomainId={state.form.domainId}
          setNewDomainId={(domainId) =>
            dispatch({ type: 'UPDATE_FORM_FIELD', payload: { field: 'domainId', value: domainId } })
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
          onPackageSelected={handlePackageSelected}
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
              <Button onPress={confirmCancelRfq} textColor={COLORS.ERROR}>Cancel RFQ</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>

        <VendorQuotesSheet
          visible={state.ui.quotesSheetVisible}
          onDismiss={() => dispatch({ type: 'CLOSE_QUOTES_SHEET' })}
          rfq={state.data.rfqs.find((r) => r.id === state.ui.selectedRfqIdForQuotes) || null}
          vendors={vendors}
          engineerId={engineerId}
          onRfqUpdated={handleQuotesRfqUpdated}
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
    paddingBottom: 80,
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
  summaryAwarded: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.SUCCESS,
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

export default DesignRfqManagementScreen;
