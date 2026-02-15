import React, { useReducer, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert } from 'react-native';
import { FAB, Searchbar, Chip, Menu, Portal, Snackbar, Dialog, Button, TextInput, Paragraph } from 'react-native-paper';
import { useDesignEngineerContext } from './context/DesignEngineerContext';
import ErrorBoundary from '../components/common/ErrorBoundary';
import DoorsPackageCard from './components/DoorsPackageCard';
import CreateDoorsPackageDialog from './components/CreateDoorsPackageDialog';
import CopyDoorsPackagesDialog from './components/CopyDoorsPackagesDialog';
import SiteSelector from './components/SiteSelector';
import DOORS_PACKAGE_TEMPLATES from './data/doorsPackageTemplates';
import { validateDoorsId, getErrorMessage } from './utils/validation';
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

const DoorsPackageManagementScreen = () => {
  const { projectId, projectName, refreshTrigger, engineerId, selectedSiteId } = useDesignEngineerContext();
  const [state, dispatch] = useReducer(doorsPackageManagementReducer, createDoorsPackageInitialState());
  const { announce } = useAccessibility();
  const navigation = useNavigation();
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [closureDialogVisible, setClosureDialogVisible] = useState(false);
  const [closureRemarks, setClosureRemarks] = useState('');
  const [closurePackageId, setClosurePackageId] = useState<string | null>(null);

  // Debounce search query for better performance
  const debouncedSearchQuery = useDebounce(state.filters.searchQuery, 300);

  // Load packages and sites
  useEffect(() => {
    loadSites();
    loadPackages();
  }, [projectId, refreshTrigger, engineerId, selectedSiteId]);

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

      const doorsCollection = database.collections.get('doors_packages');
      let packagesData;

      if (selectedSiteId && selectedSiteId !== 'all') {
        // Filter by selected site
        packagesData = await doorsCollection.query(
          Q.where('project_id', projectId),
          Q.where('site_id', selectedSiteId)
        ).fetch();
      } else {
        // Show all packages for project
        packagesData = await doorsCollection.query(
          Q.where('project_id', projectId)
        ).fetch();
      }

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
            reviewedBy: pkg.reviewedBy,
            closureDate: pkg.closureDate,
            closureRemarks: pkg.closureRemarks,
            createdAt: pkg.createdAt,
            equipmentName: pkg.equipmentName,
            priority: pkg.priority,
            quantity: pkg.quantity,
            unit: pkg.unit,
            specificationRef: pkg.specificationRef,
            drawingRef: pkg.drawingRef,
            compliantRequirements: pkg.compliantRequirements,
            compliancePercentage: pkg.compliancePercentage,
            technicalReqCompliance: pkg.technicalReqCompliance,
            datasheetCompliance: pkg.datasheetCompliance,
            typeTestCompliance: pkg.typeTestCompliance,
            routineTestCompliance: pkg.routineTestCompliance,
            siteReqCompliance: pkg.siteReqCompliance,
          };
        })
      );

      logger.debug('[DoorsPackage] Loaded packages:', packagesWithSites.length);
      dispatch({ type: 'SET_PACKAGES', payload: { packages: packagesWithSites } });

      announce(`Loaded ${packagesWithSites.length} DOORS package${packagesWithSites.length !== 1 ? 's' : ''}`);
    } catch (error) {
      logger.error('[DoorsPackage] Error loading packages:', error);
      Alert.alert('Error', getErrorMessage(error, 'DOORS packages'));
    } finally {
      dispatch({ type: 'COMPLETE_LOADING' });
    }
  };

  const handleCreateOrUpdatePackage = async () => {
    const { doorsId, siteId, equipmentType, materialType, category, totalRequirements } = state.form;

    if (!equipmentType || !siteId || !category) {
      Alert.alert('Validation Error', 'Please fill in all required fields (DOORS ID, Site, Category, Equipment Type)');
      return;
    }

    const doorsIdValidation = validateDoorsId(doorsId);
    if (!doorsIdValidation.valid) {
      Alert.alert('Invalid DOORS ID', doorsIdValidation.message || 'Please enter a valid DOORS ID.\n\nFormat: DOORS-CAT-TYPE-001');
      return;
    }

    const reqCount = parseInt(totalRequirements) || 100;
    if (reqCount < 1 || reqCount > 500) {
      Alert.alert('Validation Error', 'Requirements count must be between 1 and 500');
      return;
    }

    try {
      const doorsCollection = database.collections.get('doors_packages');
      const isEditing = !!state.ui.editingPackageId;

      if (isEditing) {
        // Update existing package
        const record = await doorsCollection.find(state.ui.editingPackageId!);
        let siteName = '';
        try {
          const site = await database.collections.get('sites').find(siteId);
          siteName = (site as any).name;
        } catch (e) { /* ignored */ }

        await database.write(async () => {
          await record.update((rec: any) => {
            rec.doorsId = doorsId;
            rec.siteId = siteId;
            rec.equipmentType = equipmentType;
            rec.materialType = materialType || null;
            rec.category = category;
            rec.totalRequirements = reqCount;
            rec.updatedAt = Date.now();
          });
        });

        const updatedPkg: DoorsPackage = {
          id: record.id,
          doorsId,
          projectId,
          siteId,
          siteName,
          equipmentType,
          materialType: materialType || undefined,
          category,
          totalRequirements: reqCount,
          status: (record as any).status,
          receivedDate: (record as any).receivedDate,
          reviewedDate: (record as any).reviewedDate,
          engineerId: (record as any).engineerId,
          createdAt: (record as any).createdAt,
        };

        dispatch({ type: 'UPDATE_PACKAGE', payload: { package: updatedPkg } });
        setSnackbarMessage('DOORS package updated successfully');
        setSnackbarVisible(true);
      } else {
        // Create new package
        // Check for duplicate DOORS ID in project
        const existing = await doorsCollection
          .query(Q.where('project_id', projectId), Q.where('doors_id', doorsId))
          .fetchCount();

        if (existing > 0) {
          Alert.alert('Duplicate DOORS ID', `A package with DOORS ID "${doorsId}" already exists in this project.`);
          return;
        }

        let newPackage: DoorsPackage | null = null;

        await database.write(async () => {
          const record = await doorsCollection.create((rec: any) => {
            rec.doorsId = doorsId;
            rec.projectId = projectId;
            rec.siteId = siteId;
            rec.equipmentType = equipmentType;
            rec.materialType = materialType || null;
            rec.category = category;
            rec.totalRequirements = reqCount;
            rec.status = 'pending';
            rec.engineerId = engineerId;
            rec.createdAt = Date.now();
            rec.updatedAt = Date.now();
            rec.appSyncStatus = 'pending';
            rec.version = 1;
          });

          let siteName = '';
          try {
            const site = await database.collections.get('sites').find(siteId);
            siteName = (site as any).name;
          } catch (error) {
            logger.warn('[DoorsPackage] Site not found:', siteId);
          }

          newPackage = {
            id: (record as any).id,
            doorsId,
            projectId,
            siteId,
            siteName,
            equipmentType,
            materialType: materialType || undefined,
            category,
            totalRequirements: reqCount,
            status: 'pending',
            engineerId,
            receivedDate: undefined,
            reviewedDate: undefined,
            createdAt: (record as any).createdAt,
          };
        });

        if (newPackage) {
          dispatch({ type: 'ADD_PACKAGE', payload: { package: newPackage } });
        }

        setSnackbarMessage('DOORS package created successfully');
        setSnackbarVisible(true);
        announce('DOORS package created successfully');
      }

      dispatch({ type: 'CLOSE_DIALOG' });
    } catch (error) {
      logger.error('[DoorsPackage] Error saving package:', error);
      Alert.alert('Error', getErrorMessage(error, 'DOORS package'));
    }
  };

  const handleEditPackage = (pkg: DoorsPackage) => {
    dispatch({
      type: 'SET_FORM',
      payload: {
        doorsId: pkg.doorsId,
        siteId: pkg.siteId || '',
        equipmentType: pkg.equipmentType,
        materialType: pkg.materialType || '',
        category: pkg.category,
        totalRequirements: String(pkg.totalRequirements),
      },
    });
    dispatch({ type: 'OPEN_DIALOG', payload: { editingPackageId: pkg.id } });
  };

  const handleDeletePackage = async (packageId: string) => {
    // Check if any RFQs reference this package
    try {
      const rfqCount = await database.collections
        .get('rfqs')
        .query(Q.where('doors_package_id', packageId))
        .fetchCount();

      if (rfqCount > 0) {
        Alert.alert(
          'Cannot Delete',
          `This package has ${rfqCount} linked RFQ${rfqCount !== 1 ? 's' : ''}. Remove the RFQs first.`
        );
        return;
      }
    } catch (error) {
      logger.error('[DoorsPackage] Error checking RFQ references:', error);
    }

    Alert.alert('Confirm Delete', 'Are you sure you want to delete this DOORS package?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const doorsCollection = database.collections.get('doors_packages');
            const record = await doorsCollection.find(packageId);
            await database.write(async () => {
              await record.markAsDeleted();
            });
            dispatch({ type: 'DELETE_PACKAGE', payload: { packageId } });
            setSnackbarMessage('DOORS package deleted');
            setSnackbarVisible(true);
          } catch (error) {
            logger.error('[DoorsPackage] Error deleting package:', error);
            Alert.alert('Error', getErrorMessage(error, 'DOORS package'));
          }
        },
      },
    ]);
  };

  const handleDuplicatePackage = (pkg: DoorsPackage) => {
    dispatch({
      type: 'SET_FORM',
      payload: {
        doorsId: '',
        siteId: pkg.siteId || '',
        equipmentType: pkg.equipmentType,
        materialType: pkg.materialType || '',
        category: pkg.category,
        totalRequirements: String(pkg.totalRequirements),
      },
    });
    dispatch({ type: 'OPEN_DIALOG' });
  };

  const handleSelectTemplate = (template: typeof DOORS_PACKAGE_TEMPLATES[number]) => {
    dispatch({
      type: 'SET_FORM',
      payload: {
        equipmentType: template.equipmentType,
        materialType: template.materialType || '',
        category: template.category,
        totalRequirements: String(template.totalRequirements),
      },
    });
  };

  const handleCopyPackages = async (selectedIds: string[], targetSiteId: string) => {
    try {
      const packagesToCopy = state.data.packages.filter((p) => selectedIds.includes(p.id));
      if (packagesToCopy.length === 0) return;

      let targetSiteName = '';
      try {
        const site = await database.collections.get('sites').find(targetSiteId);
        targetSiteName = (site as any).name;
      } catch (e) { /* ignored */ }

      const siteCode = targetSiteName.replace(/\s+/g, '').substring(0, 4).toUpperCase() || 'SITE';
      const newPackages: DoorsPackage[] = [];

      await database.write(async () => {
        const doorsCollection = database.collections.get('doors_packages');

        for (let i = 0; i < packagesToCopy.length; i++) {
          const src = packagesToCopy[i];
          const newDoorsId = `${src.doorsId}-${siteCode}-${String(i + 1).padStart(2, '0')}`;

          const record = await doorsCollection.create((rec: any) => {
            rec.doorsId = newDoorsId;
            rec.projectId = projectId;
            rec.siteId = targetSiteId;
            rec.equipmentType = src.equipmentType;
            rec.materialType = src.materialType || null;
            rec.category = src.category;
            rec.totalRequirements = src.totalRequirements;
            rec.status = 'pending';
            rec.engineerId = engineerId;
            rec.createdAt = Date.now();
            rec.updatedAt = Date.now();
            rec.appSyncStatus = 'pending';
            rec.version = 1;
          });

          newPackages.push({
            id: (record as any).id,
            doorsId: newDoorsId,
            projectId,
            siteId: targetSiteId,
            siteName: targetSiteName,
            equipmentType: src.equipmentType,
            materialType: src.materialType,
            category: src.category,
            totalRequirements: src.totalRequirements,
            status: 'pending',
            engineerId,
            createdAt: (record as any).createdAt,
          });
        }
      });

      dispatch({ type: 'ADD_PACKAGES', payload: { packages: newPackages } });
      dispatch({ type: 'CLOSE_COPY_DIALOG' });
      setSnackbarMessage(`Copied ${newPackages.length} package(s) to ${targetSiteName}`);
      setSnackbarVisible(true);
    } catch (error) {
      logger.error('[DoorsPackage] Error copying packages:', error);
      Alert.alert('Error', getErrorMessage(error, 'DOORS package copy'));
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
          record.updatedAt = Date.now();
        });
      });

      const updatedPackage = state.data.packages.find((p) => p.id === packageId);
      if (updatedPackage) {
        dispatch({
          type: 'UPDATE_PACKAGE',
          payload: { package: { ...updatedPackage, status: 'received', receivedDate: Date.now() } },
        });
      }

      setSnackbarMessage('Package marked as received');
      setSnackbarVisible(true);
    } catch (error) {
      logger.error('[DoorsPackage] Error marking as received:', error);
      Alert.alert('Error', getErrorMessage(error, 'DOORS package'));
    }
  };

  const markAsReviewed = async (packageId: string) => {
    try {
      const doorsCollection = database.collections.get('doors_packages');
      const packageRecord = await doorsCollection.find(packageId);

      await database.write(async () => {
        await packageRecord.update((record: any) => {
          record.reviewedDate = Date.now();
          record.reviewedBy = engineerId;
          record.status = 'reviewed';
          record.updatedAt = Date.now();
        });
      });

      const updatedPackage = state.data.packages.find((p) => p.id === packageId);
      if (updatedPackage) {
        dispatch({
          type: 'UPDATE_PACKAGE',
          payload: { package: { ...updatedPackage, status: 'reviewed', reviewedDate: Date.now(), reviewedBy: engineerId } },
        });
      }

      setSnackbarMessage('Package marked as reviewed');
      setSnackbarVisible(true);
    } catch (error) {
      logger.error('[DoorsPackage] Error marking as reviewed:', error);
      Alert.alert('Error', getErrorMessage(error, 'DOORS package'));
    }
  };

  const markAsApproved = async (packageId: string) => {
    try {
      const doorsCollection = database.collections.get('doors_packages');
      const packageRecord = await doorsCollection.find(packageId);

      await database.write(async () => {
        await packageRecord.update((record: any) => {
          record.status = 'approved';
          record.updatedAt = Date.now();
        });
      });

      const updatedPackage = state.data.packages.find((p) => p.id === packageId);
      if (updatedPackage) {
        dispatch({
          type: 'UPDATE_PACKAGE',
          payload: { package: { ...updatedPackage, status: 'approved' } },
        });
      }

      setSnackbarMessage('Package approved');
      setSnackbarVisible(true);
    } catch (error) {
      logger.error('[DoorsPackage] Error approving package:', error);
      Alert.alert('Error', getErrorMessage(error, 'DOORS package'));
    }
  };

  const handleClosePackage = (packageId: string) => {
    setClosurePackageId(packageId);
    setClosureRemarks('');
    setClosureDialogVisible(true);
  };

  const confirmClosePackage = async () => {
    if (!closurePackageId) return;

    try {
      const doorsCollection = database.collections.get('doors_packages');
      const packageRecord = await doorsCollection.find(closurePackageId);
      const now = Date.now();

      await database.write(async () => {
        await packageRecord.update((record: any) => {
          record.status = 'closed';
          record.closureDate = now;
          record.closureRemarks = closureRemarks || null;
          record.updatedAt = now;
        });
      });

      const updatedPackage = state.data.packages.find((p) => p.id === closurePackageId);
      if (updatedPackage) {
        dispatch({
          type: 'UPDATE_PACKAGE',
          payload: {
            package: {
              ...updatedPackage,
              status: 'closed',
              closureDate: now,
              closureRemarks: closureRemarks || undefined,
            },
          },
        });
      }

      setClosureDialogVisible(false);
      setSnackbarMessage('Package closed');
      setSnackbarVisible(true);
    } catch (error) {
      logger.error('[DoorsPackage] Error closing package:', error);
      Alert.alert('Error', getErrorMessage(error, 'DOORS package'));
    }
  };

  // Bulk operations
  const handleLongPress = (packageId: string) => {
    if (!state.ui.bulkSelectMode) {
      dispatch({ type: 'TOGGLE_BULK_MODE' });
      dispatch({ type: 'TOGGLE_PACKAGE_SELECTION', payload: { packageId } });
    }
  };

  const handleBulkMarkReceived = async () => {
    const selectedIds = state.ui.selectedPackageIds;
    const pendingIds = state.data.packages
      .filter((p) => selectedIds.includes(p.id) && p.status === 'pending')
      .map((p) => p.id);

    if (pendingIds.length === 0) {
      Alert.alert('No Pending Packages', 'Only pending packages can be marked as received.');
      return;
    }

    try {
      const doorsCollection = database.collections.get('doors_packages');
      const now = Date.now();

      await database.write(async () => {
        for (const id of pendingIds) {
          const record = await doorsCollection.find(id);
          await record.update((rec: any) => {
            rec.receivedDate = now;
            rec.status = 'received';
            rec.updatedAt = now;
          });
        }
      });

      for (const id of pendingIds) {
        const pkg = state.data.packages.find((p) => p.id === id);
        if (pkg) {
          dispatch({
            type: 'UPDATE_PACKAGE',
            payload: { package: { ...pkg, status: 'received', receivedDate: now } },
          });
        }
      }

      dispatch({ type: 'CLEAR_SELECTION' });
      setSnackbarMessage(`${pendingIds.length} package(s) marked as received`);
      setSnackbarVisible(true);
    } catch (error) {
      logger.error('[DoorsPackage] Error bulk marking received:', error);
      Alert.alert('Error', 'Failed to mark selected packages as received');
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

        {/* Summary Bar */}
        {!state.ui.loading && state.data.packages.length > 0 && (() => {
          const packages = state.data.packages;
          const compliancePackages = packages.filter(p => p.compliancePercentage !== undefined && p.compliancePercentage > 0);
          const avgCompliance = compliancePackages.length > 0
            ? compliancePackages.reduce((sum, p) => sum + (p.compliancePercentage || 0), 0) / compliancePackages.length
            : 0;
          const complianceColor = avgCompliance >= 80 ? '#4CAF50' : avgCompliance >= 50 ? '#FF9800' : '#F44336';

          const statusCounts = packages.reduce((acc, p) => {
            acc[p.status] = (acc[p.status] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);

          const statusDots: { key: string; label: string; color: string }[] = [
            { key: 'pending', label: 'Pending', color: '#FFA500' },
            { key: 'received', label: 'Received', color: '#2196F3' },
            { key: 'reviewed', label: 'Reviewed', color: '#4CAF50' },
            { key: 'approved', label: 'Approved', color: '#7B1FA2' },
            { key: 'closed', label: 'Closed', color: '#616161' },
          ];

          return (
            <View style={styles.summaryBar}>
              <View style={styles.summaryTopRow}>
                <Text style={styles.summaryCount}>{packages.length} package{packages.length !== 1 ? 's' : ''}</Text>
                {compliancePackages.length > 0 && (
                  <Text style={[styles.summaryCompliance, { color: complianceColor }]}>
                    Avg Compliance: {avgCompliance.toFixed(0)}%
                  </Text>
                )}
              </View>
              {compliancePackages.length > 0 && (
                <View style={styles.summaryBarBg}>
                  <View style={[styles.summaryBarFill, { width: `${Math.min(avgCompliance, 100)}%`, backgroundColor: complianceColor }]} />
                </View>
              )}
              <View style={styles.summaryStatusRow}>
                {statusDots.filter(s => statusCounts[s.key]).map(s => (
                  <View key={s.key} style={styles.summaryStatusItem}>
                    <View style={[styles.summaryDot, { backgroundColor: s.color }]} />
                    <Text style={styles.summaryStatusText}>{statusCounts[s.key]} {s.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          );
        })()}

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
              disabled={state.ui.selectedPackageIds.length === 0}>
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
            data={state.data.filteredPackages}
            renderItem={({ item }) => (
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
                onSelect={(id) => dispatch({ type: 'TOGGLE_PACKAGE_SELECTION', payload: { packageId: id } })}
                onLongPress={handleLongPress}
              />
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
          newCategory={state.form.category}
          setNewCategory={(category) =>
            dispatch({ type: 'UPDATE_FORM_FIELD', payload: { field: 'category', value: category } })
          }
          newTotalRequirements={state.form.totalRequirements}
          setNewTotalRequirements={(totalRequirements) =>
            dispatch({ type: 'UPDATE_FORM_FIELD', payload: { field: 'totalRequirements', value: totalRequirements } })
          }
          templates={DOORS_PACKAGE_TEMPLATES}
          onSelectTemplate={handleSelectTemplate}
        />

        <Portal>
          <Dialog visible={closureDialogVisible} onDismiss={() => setClosureDialogVisible(false)}>
            <Dialog.Title>Close DOORS Package</Dialog.Title>
            <Dialog.Content>
              <Paragraph>Add optional closure remarks before closing this package.</Paragraph>
              <TextInput
                label="Closure Remarks (optional)"
                value={closureRemarks}
                onChangeText={setClosureRemarks}
                mode="outlined"
                multiline
                numberOfLines={3}
                style={{ marginTop: 8 }}
              />
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setClosureDialogVisible(false)}>Cancel</Button>
              <Button onPress={confirmClosePackage}>Close Package</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>

        <CopyDoorsPackagesDialog
          visible={state.ui.copyDialogVisible}
          onDismiss={() => dispatch({ type: 'CLOSE_COPY_DIALOG' })}
          onCopy={handleCopyPackages}
          packages={state.data.packages}
          sites={state.data.sites}
          currentSiteId={selectedSiteId && selectedSiteId !== 'all' ? selectedSiteId : undefined}
        />

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
    backgroundColor: '#E3F2FD',
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
