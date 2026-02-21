import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { database } from '../../../models/database';
import { Q } from '@nozbe/watermelondb';
import { logger } from '../../services/LoggingService';
import {
  DesignDocument,
  DesignDocumentCategory,
  DocumentType,
  DocumentStatus,
  SITE_REQUIRED_TYPES,
} from '../types/DesignDocumentTypes';
import {
  DesignDocumentManagementState,
  DesignDocumentManagementAction,
} from '../state/design-document-management';

interface UseDocumentCrudParams {
  projectId: string;
  engineerId: string;
  selectedSiteId: string;
  state: DesignDocumentManagementState;
  dispatch: React.Dispatch<DesignDocumentManagementAction>;
  announce: (message: string) => void;
}

export const useDocumentCrud = ({
  projectId,
  engineerId,
  selectedSiteId,
  state,
  dispatch,
  announce,
}: UseDocumentCrudParams) => {
  const [keyDates, setKeyDates] = useState<
    Array<{ id: string; code: string; description: string; category: string }>
  >([]);
  const [doorsPackages, setDoorsPackages] = useState<
    Array<{ id: string; doorsId: string; equipmentType: string }>
  >([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  const loadSites = useCallback(async () => {
    if (!projectId) return;
    try {
      const sitesCollection = database.collections.get('sites');
      const sitesData = await sitesCollection.query(Q.where('project_id', projectId)).fetch();
      const sitesList = sitesData.map((site: any) => ({ id: site.id, name: site.name }));
      dispatch({ type: 'SET_SITES', payload: { sites: sitesList } });
    } catch (error: any) {
      logger.error('[DesignDocument] Error loading sites:', error);
    }
  }, [projectId, dispatch]);

  const loadKeyDates = useCallback(async () => {
    if (!projectId) return;
    try {
      const keyDatesCollection = database.collections.get('key_dates');
      const keyDatesData = await keyDatesCollection.query(Q.where('project_id', projectId)).fetch();
      const keyDatesList = keyDatesData.map((kd: any) => ({
        id: kd.id,
        code: kd.code,
        description: kd.description,
        category: kd.category,
      }));
      setKeyDates(keyDatesList);
    } catch (error: any) {
      logger.error('[DesignDocument] Error loading key dates:', error);
    }
  }, [projectId]);

  const loadDoorsPackages = useCallback(async () => {
    if (!projectId) return;
    try {
      const doorsCollection = database.collections.get('doors_packages');
      const doorsData = await doorsCollection.query(Q.where('project_id', projectId)).fetch();
      const doorsList = doorsData.map((pkg: any) => ({
        id: pkg.id,
        doorsId: pkg.doorsId,
        equipmentType: pkg.equipmentType,
      }));
      setDoorsPackages(doorsList);
    } catch (error: any) {
      logger.error('[DesignDocument] Error loading DOORS packages:', error);
    }
  }, [projectId]);

  const loadCategories = useCallback(async () => {
    if (!projectId) return;
    try {
      const categoriesCollection = database.collections.get('design_document_categories');
      const categoriesData = await categoriesCollection
        .query(Q.where('project_id', projectId))
        .fetch();

      const categoriesList: DesignDocumentCategory[] = categoriesData.map((cat: any) => ({
        id: cat.id,
        name: cat.name,
        documentType: cat.documentType,
        projectId: cat.projectId,
        isDefault: cat.isDefault,
        sequenceOrder: cat.sequenceOrder,
      }));

      dispatch({ type: 'SET_CATEGORIES', payload: { categories: categoriesList } });
    } catch (error: any) {
      logger.error('[DesignDocument] Error loading categories:', error);
    }
  }, [projectId, dispatch]);

  const loadDocuments = useCallback(async () => {
    if (!projectId || !engineerId) {
      dispatch({ type: 'COMPLETE_LOADING' });
      return;
    }

    try {
      dispatch({ type: 'START_LOADING' });

      const docsCollection = database.collections.get('design_documents');
      let docsData;

      if (selectedSiteId === 'all') {
        docsData = await docsCollection
          .query(Q.where('project_id', projectId), Q.where('created_by', engineerId))
          .fetch();
      } else {
        docsData = await docsCollection
          .query(
            Q.where('project_id', projectId),
            Q.where('created_by', engineerId),
            Q.where('site_id', selectedSiteId),
          )
          .fetch();
      }

      const documentsWithDetails = await Promise.all(
        docsData.map(async (doc: any) => {
          let siteName = '';
          let categoryName = '';
          let doorsPackageName = '';

          if (doc.siteId) {
            try {
              const site = await database.collections.get('sites').find(doc.siteId);
              siteName = (site as any).name;
            } catch (e) {
              logger.warn('[DesignDocument] Site not found:', doc.siteId);
            }
          }

          if (doc.categoryId) {
            try {
              const category = await database.collections
                .get('design_document_categories')
                .find(doc.categoryId);
              categoryName = (category as any).name;
            } catch (e) {
              logger.warn('[DesignDocument] Category not found:', doc.categoryId);
            }
          }

          if (doc.doorsPackageId) {
            try {
              const pkg = await database.collections.get('doors_packages').find(doc.doorsPackageId);
              doorsPackageName = (pkg as any).doorsId;
            } catch (e) {
              logger.warn('[DesignDocument] DOORS package not found:', doc.doorsPackageId);
            }
          }

          return {
            id: doc.id,
            documentNumber: doc.documentNumber,
            title: doc.title,
            description: doc.description,
            documentType: doc.documentType,
            categoryId: doc.categoryId,
            categoryName,
            projectId: doc.projectId,
            siteId: doc.siteId,
            siteName,
            keyDateId: doc.keyDateId,
            doorsPackageId: doc.doorsPackageId,
            doorsPackageName,
            revisionNumber: doc.revisionNumber,
            status: doc.status,
            approvalComment: doc.approvalComment,
            submittedDate: doc.submittedDate,
            approvedDate: doc.approvedDate,
            weightage: doc.weightage,
            createdBy: doc.createdBy,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt,
          } as DesignDocument;
        }),
      );

      dispatch({ type: 'SET_DOCUMENTS', payload: { documents: documentsWithDetails } });
      announce(
        `Loaded ${documentsWithDetails.length} design document${documentsWithDetails.length !== 1 ? 's' : ''}`,
      );
    } catch (error: any) {
      logger.error('[DesignDocument] Error loading documents:', error);
      Alert.alert('Error', 'Failed to load design documents');
    } finally {
      dispatch({ type: 'COMPLETE_LOADING' });
    }
  }, [projectId, engineerId, selectedSiteId, dispatch, announce]);

  const handleCreateOrUpdateDocument = useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    const { documentNumber, title, documentType, categoryId, siteId, keyDateId, doorsPackageId, revisionNumber, weightage } =
      state.form;

    if (!documentNumber || !title || !documentType) {
      Alert.alert('Validation Error', 'Please fill in all required fields');
      setIsSubmitting(false);
      return;
    }

    const requiresSite = SITE_REQUIRED_TYPES.includes(documentType as DocumentType);
    if (requiresSite && !siteId) {
      Alert.alert('Validation Error', 'Site is required for this document type');
      setIsSubmitting(false);
      return;
    }

    const weightageNum = weightage ? parseFloat(weightage) : undefined;
    if (weightage && (isNaN(weightageNum!) || weightageNum! < 0 || weightageNum! > 100)) {
      Alert.alert('Validation Error', 'Weightage must be a number between 0 and 100');
      setIsSubmitting(false);
      return;
    }

    if (requiresSite && siteId && weightageNum !== undefined) {
      try {
        const docsCollection = database.collections.get('design_documents');
        const siteDocuments = await docsCollection.query(Q.where('site_id', siteId)).fetch();

        const totalWeightage = siteDocuments
          .filter((doc: any) => doc.id !== state.ui.editingDocumentId)
          .reduce((sum: number, doc: any) => sum + (doc.weightage || 0), 0);

        const newTotal = totalWeightage + weightageNum;
        const siteName = state.data.sites.find((s) => s.id === siteId)?.name || 'this site';

        if (newTotal > 100) {
          Alert.alert(
            'Weightage Validation',
            `Total weightage for ${siteName} would be ${newTotal.toFixed(1)}%. ` +
              `Total weightage per site should equal 100%.\n\n` +
              `Current total: ${totalWeightage.toFixed(1)}%\n` +
              `Adding: ${weightageNum.toFixed(1)}%\n` +
              `New total: ${newTotal.toFixed(1)}%\n\n` +
              `Available: ${(100 - totalWeightage).toFixed(1)}%`,
          );
          setIsSubmitting(false);
          return;
        }
      } catch (error) {
        logger.error('[DesignDocument] Error validating weightage:', error as Error, {
          component: 'DesignDocumentManagementScreen',
          action: 'validateWeightage',
          siteId,
          weightageNum,
        });
      }
    }

    try {
      const docsCollection = database.collections.get('design_documents');
      const isEditing = !!state.ui.editingDocumentId;

      if (isEditing) {
        const record = await docsCollection.find(state.ui.editingDocumentId!);
        let siteName = '';
        let categoryName = '';

        if (siteId) {
          try {
            const site = await database.collections.get('sites').find(siteId);
            siteName = (site as any).name;
          } catch (e) { /* ignored */ }
        }
        if (categoryId) {
          try {
            const cat = await database.collections.get('design_document_categories').find(categoryId);
            categoryName = (cat as any).name;
          } catch (e) { /* ignored */ }
        }

        let doorsPackageName = '';
        if (doorsPackageId) {
          try {
            const pkg = await database.collections.get('doors_packages').find(doorsPackageId);
            doorsPackageName = (pkg as any).doorsId;
          } catch (e) { /* ignored */ }
        }

        await database.write(async () => {
          await record.update((rec: any) => {
            rec.documentNumber = documentNumber;
            rec.title = title;
            rec.description = state.form.description || null;
            rec.documentType = documentType;
            rec.categoryId = categoryId || null;
            rec.siteId = requiresSite ? siteId : null;
            rec.keyDateId = keyDateId || null;
            rec.doorsPackageId = doorsPackageId || null;
            rec.revisionNumber = revisionNumber || 'R0';
            rec.weightage = weightageNum || null;
            rec.updatedAt = Date.now();
          });
        });

        const updatedDoc: DesignDocument = {
          id: record.id,
          documentNumber,
          title,
          description: state.form.description || undefined,
          documentType: documentType as DocumentType,
          categoryId,
          categoryName,
          projectId,
          siteId: requiresSite ? siteId : undefined,
          siteName,
          revisionNumber: revisionNumber || 'R0',
          status: (record as any).status,
          approvalComment: (record as any).approvalComment,
          submittedDate: (record as any).submittedDate,
          approvedDate: (record as any).approvedDate,
          weightage: weightageNum,
          keyDateId: keyDateId || undefined,
          doorsPackageId: doorsPackageId || undefined,
          doorsPackageName: doorsPackageName || undefined,
          createdBy: (record as any).createdBy,
          createdAt: (record as any).createdAt,
          updatedAt: Date.now(),
        };

        dispatch({ type: 'UPDATE_DOCUMENT', payload: { document: updatedDoc } });
        Alert.alert('Success', 'Document updated successfully');
      } else {
        let newDoc: DesignDocument | null = null;

        await database.write(async () => {
          const record = await docsCollection.create((rec: any) => {
            rec.documentNumber = documentNumber;
            rec.title = title;
            rec.description = state.form.description || null;
            rec.documentType = documentType;
            rec.categoryId = categoryId || null;
            rec.projectId = projectId;
            rec.siteId = requiresSite ? siteId : null;
            rec.keyDateId = keyDateId || null;
            rec.doorsPackageId = doorsPackageId || null;
            rec.revisionNumber = revisionNumber || 'R0';
            rec.weightage = weightageNum || null;
            rec.status = 'draft';
            rec.createdBy = engineerId;
            rec.createdAt = Date.now();
            rec.updatedAt = Date.now();
            rec.appSyncStatus = 'pending';
            rec.version = 1;
          });

          let siteName = '';
          let categoryName = '';
          let doorsPackageNameForNew = '';

          if (siteId && requiresSite) {
            try {
              const site = await database.collections.get('sites').find(siteId);
              siteName = (site as any).name;
            } catch (e) { /* ignored */ }
          }
          if (categoryId) {
            try {
              const cat = await database.collections.get('design_document_categories').find(categoryId);
              categoryName = (cat as any).name;
            } catch (e) { /* ignored */ }
          }
          if (doorsPackageId) {
            try {
              const pkg = await database.collections.get('doors_packages').find(doorsPackageId);
              doorsPackageNameForNew = (pkg as any).doorsId;
            } catch (e) { /* ignored */ }
          }

          newDoc = {
            id: record.id,
            documentNumber,
            title,
            description: state.form.description || undefined,
            documentType: documentType as DocumentType,
            categoryId,
            categoryName,
            projectId,
            siteId: requiresSite ? siteId : undefined,
            siteName,
            revisionNumber: revisionNumber || 'R0',
            status: 'draft',
            weightage: weightageNum,
            keyDateId: keyDateId || undefined,
            doorsPackageId: doorsPackageId || undefined,
            doorsPackageName: doorsPackageNameForNew || undefined,
            createdBy: engineerId,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
        });

        if (newDoc) {
          dispatch({ type: 'ADD_DOCUMENT', payload: { document: newDoc } });
        }

        Alert.alert('Success', 'Design document created successfully');
        announce('Design document created successfully');
      }

      dispatch({ type: 'CLOSE_DIALOG' });
    } catch (error: any) {
      logger.error('[DesignDocument] Error saving document:', error);
      Alert.alert('Error', 'Failed to save design document');
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, state, projectId, engineerId, dispatch, announce]);

  const handleDeleteDocument = useCallback(
    async (documentId: string) => {
      Alert.alert('Confirm Delete', 'Are you sure you want to delete this document?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const docsCollection = database.collections.get('design_documents');
              const record = await docsCollection.find(documentId);
              await database.write(async () => {
                await record.markAsDeleted();
              });
              dispatch({ type: 'DELETE_DOCUMENT', payload: { documentId } });
              Alert.alert('Success', 'Document deleted');
            } catch (error: any) {
              logger.error('[DesignDocument] Error deleting document:', error);
              Alert.alert('Error', 'Failed to delete document');
            }
          },
        },
      ]);
    },
    [dispatch],
  );

  const handleEditDocument = useCallback(
    (doc: DesignDocument) => {
      dispatch({
        type: 'SET_FORM',
        payload: {
          documentNumber: doc.documentNumber,
          title: doc.title,
          description: doc.description || '',
          documentType: doc.documentType,
          categoryId: doc.categoryId,
          siteId: doc.siteId || '',
          keyDateId: doc.keyDateId || '',
          doorsPackageId: doc.doorsPackageId || '',
          revisionNumber: doc.revisionNumber,
          weightage:
            doc.weightage !== undefined && doc.weightage !== null ? String(doc.weightage) : '',
        },
      });
      dispatch({ type: 'OPEN_DIALOG', payload: { editingDocumentId: doc.id } });
    },
    [dispatch],
  );

  const handleReviseDocument = useCallback(
    (doc: DesignDocument) => {
      const incrementRevision = (rev: string): string => {
        const match = rev.match(/^R(\d+)$/);
        if (match) return `R${parseInt(match[1], 10) + 1}`;
        return 'R1';
      };

      const newRevision = incrementRevision(doc.revisionNumber);

      dispatch({ type: 'OPEN_DIALOG' });
      dispatch({
        type: 'SET_FORM',
        payload: {
          documentNumber: doc.documentNumber,
          title: doc.title,
          description: '',
          documentType: doc.documentType,
          categoryId: doc.categoryId,
          siteId: doc.siteId || '',
          keyDateId: doc.keyDateId || '',
          doorsPackageId: doc.doorsPackageId || '',
          revisionNumber: newRevision,
          weightage:
            doc.weightage !== undefined && doc.weightage !== null ? String(doc.weightage) : '',
        },
      });
    },
    [dispatch],
  );

  const handleApprovalAction = useCallback(async () => {
    if (isApproving) return;
    const { approvalDocumentId, approvalAction } = state.ui;
    if (!approvalDocumentId || !approvalAction) return;
    setIsApproving(true);

    try {
      const docsCollection = database.collections.get('design_documents');
      const record = await docsCollection.find(approvalDocumentId);

      let newStatus: DocumentStatus;
      switch (approvalAction) {
        case 'submit':
          newStatus = 'submitted';
          break;
        case 'approve':
          newStatus = 'approved';
          break;
        case 'approve_with_comment':
          newStatus = 'approved_with_comment';
          break;
        case 'reject':
          newStatus = 'rejected';
          break;
        default:
          setIsApproving(false);
          return;
      }

      await database.write(async () => {
        await record.update((rec: any) => {
          rec.status = newStatus;
          rec.updatedAt = Date.now();
          if (approvalAction === 'submit') {
            rec.submittedDate = Date.now();
          }
          if (approvalAction === 'approve' || approvalAction === 'approve_with_comment') {
            rec.approvedDate = Date.now();
          }
          if (state.approvalComment) {
            rec.approvalComment = state.approvalComment;
          }
        });
      });

      const existingDoc = state.data.documents.find((d) => d.id === approvalDocumentId);
      if (existingDoc) {
        const updatedDoc: DesignDocument = {
          ...existingDoc,
          status: newStatus,
          updatedAt: Date.now(),
          submittedDate:
            approvalAction === 'submit' ? Date.now() : existingDoc.submittedDate,
          approvedDate:
            approvalAction === 'approve' || approvalAction === 'approve_with_comment'
              ? Date.now()
              : existingDoc.approvedDate,
          approvalComment: state.approvalComment || existingDoc.approvalComment,
        };
        dispatch({ type: 'UPDATE_DOCUMENT', payload: { document: updatedDoc } });
      }

      dispatch({ type: 'CLOSE_APPROVAL_DIALOG' });
      Alert.alert('Success', `Document ${newStatus.replace(/_/g, ' ')}`);
    } catch (error: any) {
      logger.error('[DesignDocument] Error updating document status:', error);
      Alert.alert('Error', 'Failed to update document status');
    } finally {
      setIsApproving(false);
    }
  }, [isApproving, state, dispatch]);

  return {
    keyDates,
    doorsPackages,
    isSubmitting,
    isApproving,
    loadSites,
    loadKeyDates,
    loadDoorsPackages,
    loadCategories,
    loadDocuments,
    handleCreateOrUpdateDocument,
    handleDeleteDocument,
    handleEditDocument,
    handleReviseDocument,
    handleApprovalAction,
  };
};
