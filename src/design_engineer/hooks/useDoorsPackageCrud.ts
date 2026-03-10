import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { database } from '../../../models/database';
import { Q } from '@nozbe/watermelondb';
import { logger } from '../../services/LoggingService';
import { DoorsPackage } from '../types/DoorsPackageTypes';
import DoorsRevisionModel from '../../../models/DoorsRevisionModel';
import { validateDoorsId, getErrorMessage } from '../utils/validation';
import DOORS_PACKAGE_TEMPLATES from '../data/doorsPackageTemplates';
import { TransitionStage } from '../components/StatusTransitionDialog';
import {
  DoorsPackageManagementState,
  DoorsPackageManagementAction,
} from '../state/doors-package-management';

interface DomainItem {
  id: string;
  name: string;
}

interface UseDoorsPackageCrudParams {
  projectId: string;
  engineerId: string;
  selectedSiteId: string;
  state: DoorsPackageManagementState;
  dispatch: React.Dispatch<DoorsPackageManagementAction>;
  showSnackbar: (message: string) => void;
  announce: (message: string) => void;
}

export const useDoorsPackageCrud = ({
  projectId,
  engineerId,
  selectedSiteId,
  state,
  dispatch,
  showSnackbar,
  announce,
}: UseDoorsPackageCrudParams) => {
  const [projectDomains, setProjectDomains] = useState<DomainItem[]>([]);
  const [transitionDialogVisible, setTransitionDialogVisible] = useState(false);
  const [transitionStage, setTransitionStage] = useState<TransitionStage>('received');
  const [transitionPackageId, setTransitionPackageId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadSites = useCallback(async () => {
    if (!projectId) return;
    try {
      const sitesCollection = database.collections.get('sites');
      const sitesData = await sitesCollection.query(Q.where('project_id', projectId)).fetch();
      const sitesList = sitesData.map((site: any) => ({ id: site.id, name: site.name }));
      dispatch({ type: 'SET_SITES', payload: { sites: sitesList } });
    } catch (error) {
      logger.error('[DoorsPackage] Error loading sites:', error as Error);
    }
  }, [projectId, dispatch]);

  const loadDomains = useCallback(async () => {
    if (!projectId) return;
    try {
      const domainsCollection = database.collections.get('domains');
      const domainsData = await domainsCollection.query(Q.where('project_id', projectId)).fetch();
      const domainsList = domainsData.map((d: any) => ({ id: d.id, name: d.name }));
      setProjectDomains(domainsList);
    } catch (error) {
      logger.error('[DoorsPackage] Error loading domains:', error as Error);
    }
  }, [projectId]);

  const loadPackages = useCallback(async () => {
    if (!projectId || !engineerId) {
      dispatch({ type: 'COMPLETE_LOADING' });
      return;
    }

    try {
      dispatch({ type: 'START_LOADING' });
      logger.info('[DoorsPackage] Loading packages for project:', { projectId });

      const doorsCollection = database.collections.get('doors_packages');
      let packagesData;

      if (selectedSiteId && selectedSiteId !== 'all') {
        packagesData = await doorsCollection
          .query(Q.where('project_id', projectId), Q.where('site_id', selectedSiteId))
          .fetch();
      } else {
        packagesData = await doorsCollection.query(Q.where('project_id', projectId)).fetch();
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

          let domainName = '';
          if (pkg.domainId) {
            try {
              const domain = await database.collections.get('domains').find(pkg.domainId);
              domainName = (domain as any).name;
            } catch (error) {
              logger.warn('[DoorsPackage] Domain not found:', pkg.domainId);
            }
          }

          let linkedDocumentsCount = 0;
          try {
            const docsCollection = database.collections.get('design_documents');
            const linkedDocs = await docsCollection
              .query(Q.where('doors_package_id', pkg.id))
              .fetch();
            linkedDocumentsCount = linkedDocs.length;
          } catch (e) {
            // ignore — count stays 0
          }

          return {
            id: pkg.id,
            doorsId: pkg.doorsId,
            projectId: pkg.projectId,
            siteId: pkg.siteId,
            siteName,
            domainId: pkg.domainId,
            domainName,
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
            receivedBy: pkg.receivedBy,
            receivedRemarks: pkg.receivedRemarks,
            reviewObservations: pkg.reviewObservations,
            approvedBy: pkg.approvedBy,
            approvedDate: pkg.approvedDate,
            approvalRemarks: pkg.approvalRemarks,
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
            linkedDocumentsCount,
          };
        }),
      );

      logger.debug('[DoorsPackage] Loaded packages:', { value: packagesWithSites.length });
      dispatch({ type: 'SET_PACKAGES', payload: { packages: packagesWithSites } });
      announce(
        `Loaded ${packagesWithSites.length} DOORS package${packagesWithSites.length !== 1 ? 's' : ''}`,
      );
    } catch (error) {
      logger.error('[DoorsPackage] Error loading packages:', error as Error);
      showSnackbar(getErrorMessage(error, 'DOORS packages'));
    } finally {
      dispatch({ type: 'COMPLETE_LOADING' });
    }
  }, [projectId, engineerId, selectedSiteId, dispatch, announce]);

  const handleCreateOrUpdatePackage = useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    const { doorsId, siteId, equipmentType, materialType, category, domainId, totalRequirements } =
      state.form;

    if (!equipmentType || !category) {
      showSnackbar('Please fill in all required fields (Domain, Equipment Type)');
      setIsSubmitting(false);
      return;
    }

    const doorsIdValidation = validateDoorsId(doorsId);
    if (!doorsIdValidation.valid) {
      showSnackbar(doorsIdValidation.message || 'Please enter a valid DOORS ID. Format: DOORS-CAT-TYPE-001');
      setIsSubmitting(false);
      return;
    }

    const reqCount = parseInt(totalRequirements) || 100;
    if (reqCount < 1 || reqCount > 500) {
      showSnackbar('Requirements count must be between 1 and 500');
      setIsSubmitting(false);
      return;
    }

    try {
      const doorsCollection = database.collections.get('doors_packages');
      const isEditing = !!state.ui.editingPackageId;

      if (isEditing) {
        const record = await doorsCollection.find(state.ui.editingPackageId!);
        let siteName = '';
        try {
          const site = await database.collections.get('sites').find(siteId);
          siteName = (site as any).name;
        } catch (e) { /* ignored */ }

        const nextVersion = ((record as any).version || 0) + 1;
        await database.write(async () => {
          // Snapshot current state before overwriting
          await database.collections.get<DoorsRevisionModel>('doors_revisions').create((rev: any) => {
            rev.doorsPackageId = record.id;
            rev.versionNumber = nextVersion;
            rev.snapshotJson = JSON.stringify({
              doorsId: (record as any).doorsId,
              siteId: (record as any).siteId,
              domainId: (record as any).domainId,
              equipmentType: (record as any).equipmentType,
              materialType: (record as any).materialType,
              category: (record as any).category,
              totalRequirements: (record as any).totalRequirements,
              status: (record as any).status,
            });
            rev.changedById = engineerId;
            rev.changedAt = Date.now();
            rev.changeSummary = 'Package fields updated';
          });
          await record.update((rec: any) => {
            rec.doorsId = doorsId;
            rec.siteId = siteId;
            rec.domainId = domainId || null;
            rec.equipmentType = equipmentType;
            rec.materialType = materialType || null;
            rec.category = category;
            rec.totalRequirements = reqCount;
            rec.updatedAt = Date.now();
          });
        });

        const domainRecord = domainId ? projectDomains.find((d) => d.id === domainId) : null;

        const updatedPkg: DoorsPackage = {
          id: record.id,
          doorsId,
          projectId,
          siteId,
          siteName,
          domainId: domainId || undefined,
          domainName: domainRecord?.name || '',
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
        showSnackbar('DOORS package updated successfully');
      } else {
        const existing = await doorsCollection
          .query(Q.where('project_id', projectId), Q.where('doors_id', doorsId))
          .fetchCount();

        if (existing > 0) {
          showSnackbar(`A package with DOORS ID "${doorsId}" already exists in this project.`);
          setIsSubmitting(false);
          return;
        }

        let newPackage: DoorsPackage | null = null;
        const domainRecord = domainId ? projectDomains.find((d) => d.id === domainId) : null;

        await database.write(async () => {
          const record = await doorsCollection.create((rec: any) => {
            rec.doorsId = doorsId;
            rec.projectId = projectId;
            rec.siteId = siteId;
            rec.domainId = domainId || null;
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
            logger.warn('[DoorsPackage] Site not found:', { siteId });
          }

          newPackage = {
            id: (record as any).id,
            doorsId,
            projectId,
            siteId,
            siteName,
            domainId: domainId || undefined,
            domainName: domainRecord?.name || '',
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

        showSnackbar('DOORS package created successfully');
        announce('DOORS package created successfully');
      }

      dispatch({ type: 'CLOSE_DIALOG' });
    } catch (error) {
      logger.error('[DoorsPackage] Error saving package:', error as Error);
      showSnackbar(getErrorMessage(error, 'DOORS package'));
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, state, projectId, engineerId, projectDomains, dispatch, showSnackbar, announce]);

  const handleEditPackage = useCallback(
    (pkg: DoorsPackage) => {
      dispatch({
        type: 'SET_FORM',
        payload: {
          doorsId: pkg.doorsId,
          siteId: pkg.siteId || '',
          equipmentType: pkg.equipmentType,
          materialType: pkg.materialType || '',
          category: pkg.category,
          domainId: pkg.domainId || '',
          totalRequirements: String(pkg.totalRequirements),
        },
      });
      dispatch({ type: 'OPEN_DIALOG', payload: { editingPackageId: pkg.id } });
    },
    [dispatch],
  );

  const handleDeletePackage = useCallback(
    async (packageId: string) => {
      try {
        const rfqCount = await database.collections
          .get('rfqs')
          .query(Q.where('doors_package_id', packageId))
          .fetchCount();

        if (rfqCount > 0) {
          showSnackbar(`This package has ${rfqCount} linked RFQ${rfqCount !== 1 ? 's' : ''}. Remove the RFQs first.`);
          return;
        }
      } catch (error) {
        logger.error('[DoorsPackage] Error checking RFQ references:', error as Error);
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
              showSnackbar('DOORS package deleted');
            } catch (error) {
              logger.error('[DoorsPackage] Error deleting package:', error as Error);
              showSnackbar(getErrorMessage(error, 'DOORS package'));
            }
          },
        },
      ]);
    },
    [dispatch, showSnackbar],
  );

  const handleDuplicatePackage = useCallback(
    (pkg: DoorsPackage) => {
      dispatch({
        type: 'SET_FORM',
        payload: {
          doorsId: '',
          siteId: pkg.siteId || '',
          equipmentType: pkg.equipmentType,
          materialType: pkg.materialType || '',
          category: pkg.category,
          domainId: pkg.domainId || '',
          totalRequirements: String(pkg.totalRequirements),
        },
      });
      dispatch({ type: 'OPEN_DIALOG' });
    },
    [dispatch],
  );

  const handleSelectTemplate = useCallback(
    (template: (typeof DOORS_PACKAGE_TEMPLATES)[number]) => {
      dispatch({
        type: 'SET_FORM',
        payload: {
          equipmentType: template.equipmentType,
          materialType: template.materialType || '',
          category: template.category,
          totalRequirements: String(template.totalRequirements),
        },
      });
    },
    [dispatch],
  );

  const handleCopyPackages = useCallback(
    async (selectedIds: string[], targetSiteId: string) => {
      try {
        const packagesToCopy = state.data.packages.filter((p) => selectedIds.includes(p.id));
        if (packagesToCopy.length === 0) return;

        let targetSiteName = '';
        try {
          const site = await database.collections.get('sites').find(targetSiteId);
          targetSiteName = (site as any).name;
        } catch (e) { /* ignored */ }

        const siteCode =
          targetSiteName.replace(/\s+/g, '').substring(0, 4).toUpperCase() || 'SITE';
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
              rec.domainId = src.domainId || null;
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
              domainId: src.domainId,
              domainName: src.domainName,
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
        showSnackbar(`Copied ${newPackages.length} package(s) to ${targetSiteName}`);
      } catch (error) {
        logger.error('[DoorsPackage] Error copying packages:', error as Error);
        showSnackbar(getErrorMessage(error, 'DOORS package copy'));
      }
    },
    [state.data.packages, projectId, engineerId, dispatch, showSnackbar],
  );

  const openTransitionDialog = useCallback((packageId: string, stage: TransitionStage) => {
    setTransitionPackageId(packageId);
    setTransitionStage(stage);
    setTransitionDialogVisible(true);
  }, []);

  const markAsReceived = useCallback(
    (packageId: string) => openTransitionDialog(packageId, 'received'),
    [openTransitionDialog],
  );

  const markAsReviewed = useCallback(
    (packageId: string) => openTransitionDialog(packageId, 'reviewed'),
    [openTransitionDialog],
  );

  const markAsApproved = useCallback(
    (packageId: string) => openTransitionDialog(packageId, 'approved'),
    [openTransitionDialog],
  );

  const handleClosePackage = useCallback(
    (packageId: string) => openTransitionDialog(packageId, 'closed'),
    [openTransitionDialog],
  );

  const handleTransitionConfirm = useCallback(
    async (data: { remarks: string }) => {
      if (!transitionPackageId) return;

      try {
        const doorsCollection = database.collections.get('doors_packages');
        const packageRecord = await doorsCollection.find(transitionPackageId);
        const now = Date.now();
        const nextVersion = ((packageRecord as any).version || 0) + 1;

        const stageLabels: Record<TransitionStage, string> = {
          received: 'Package marked as received',
          reviewed: 'Package marked as reviewed',
          approved: 'Package approved',
          closed: 'Package closed',
        };

        await database.write(async () => {
          // Snapshot current state before transition
          await database.collections.get<DoorsRevisionModel>('doors_revisions').create((rev: any) => {
            rev.doorsPackageId = packageRecord.id;
            rev.versionNumber = nextVersion;
            rev.snapshotJson = JSON.stringify({
              status: (packageRecord as any).status,
              receivedDate: (packageRecord as any).receivedDate,
              reviewedDate: (packageRecord as any).reviewedDate,
              approvedDate: (packageRecord as any).approvedDate,
              closureDate: (packageRecord as any).closureDate,
            });
            rev.changedById = engineerId;
            rev.changedAt = now;
            rev.changeSummary = stageLabels[transitionStage];
          });
          await packageRecord.update((record: any) => {
            record.updatedAt = now;

            switch (transitionStage) {
              case 'received':
                record.status = 'received';
                record.receivedDate = now;
                record.receivedBy = engineerId;
                record.receivedRemarks = data.remarks || null;
                break;
              case 'reviewed':
                record.status = 'reviewed';
                record.reviewedDate = now;
                record.reviewedBy = engineerId;
                record.reviewObservations = data.remarks || null;
                break;
              case 'approved':
                record.status = 'approved';
                record.approvedBy = engineerId;
                record.approvedDate = now;
                record.approvalRemarks = data.remarks || null;
                break;
              case 'closed':
                record.status = 'closed';
                record.closureDate = now;
                record.closureRemarks = data.remarks || null;
                break;
            }
          });
        });

        const updatedPackage = state.data.packages.find((p) => p.id === transitionPackageId);
        if (updatedPackage) {
          const updates: Partial<DoorsPackage> = { status: transitionStage };
          switch (transitionStage) {
            case 'received':
              updates.receivedDate = now;
              updates.receivedBy = engineerId;
              updates.receivedRemarks = data.remarks || undefined;
              break;
            case 'reviewed':
              updates.reviewedDate = now;
              updates.reviewedBy = engineerId;
              updates.reviewObservations = data.remarks || undefined;
              break;
            case 'approved':
              updates.approvedBy = engineerId;
              updates.approvedDate = now;
              updates.approvalRemarks = data.remarks || undefined;
              break;
            case 'closed':
              updates.closureDate = now;
              updates.closureRemarks = data.remarks || undefined;
              break;
          }

          dispatch({
            type: 'UPDATE_PACKAGE',
            payload: { package: { ...updatedPackage, ...updates } },
          });
        }

        setTransitionDialogVisible(false);
        showSnackbar(stageLabels[transitionStage]);
      } catch (error) {
        logger.error(`[DoorsPackage] Error transitioning to ${transitionStage}:`, error as Error);
        showSnackbar(getErrorMessage(error, 'DOORS package'));
      }
    },
    [transitionPackageId, transitionStage, engineerId, state.data.packages, dispatch, showSnackbar],
  );

  const handleSelectPackage = useCallback(
    (id: string) =>
      dispatch({ type: 'TOGGLE_PACKAGE_SELECTION', payload: { packageId: id } }),
    [dispatch],
  );

  const handleLongPress = useCallback(
    (packageId: string) => {
      if (!state.ui.bulkSelectMode) {
        dispatch({ type: 'TOGGLE_BULK_MODE' });
        dispatch({ type: 'TOGGLE_PACKAGE_SELECTION', payload: { packageId } });
      }
    },
    [state.ui.bulkSelectMode, dispatch],
  );

  const handleBulkMarkReceived = useCallback(async () => {
    const selectedIds = state.ui.selectedPackageIds;
    const pendingIds = state.data.packages
      .filter((p) => selectedIds.includes(p.id) && p.status === 'pending')
      .map((p) => p.id);

    if (pendingIds.length === 0) {
      showSnackbar('Only pending packages can be marked as received.');
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
      showSnackbar(`${pendingIds.length} package(s) marked as received`);
    } catch (error) {
      logger.error('[DoorsPackage] Error bulk marking received:', error as Error);
      showSnackbar('Failed to mark selected packages as received');
    }
  }, [state.ui.selectedPackageIds, state.data.packages, dispatch, showSnackbar]);

  const handleDismissDialog = useCallback(() => {
    dispatch({ type: 'CLOSE_DIALOG' });
  }, [dispatch]);

  return {
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
  };
};
