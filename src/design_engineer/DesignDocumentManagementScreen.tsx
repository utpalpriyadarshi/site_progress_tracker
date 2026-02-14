import React, { useReducer, useEffect, useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { FAB, Searchbar, Menu, Snackbar, IconButton } from 'react-native-paper';
import { useDesignEngineerContext } from './context/DesignEngineerContext';
import ErrorBoundary from '../components/common/ErrorBoundary';
import DesignDocumentCard from './components/DesignDocumentCard';
import CreateDesignDocumentDialog from './components/CreateDesignDocumentDialog';
import ManageCategoriesDialog from './components/ManageCategoriesDialog';
import ApprovalDialog from './components/ApprovalDialog';
import CopyDesignDocumentsDialog from './components/CopyDesignDocumentsDialog';
import DuplicateDocumentsDialog from './components/DuplicateDocumentsDialog';
import MoveDesignDocumentDialog from './components/MoveDesignDocumentDialog';
import SiteSelector from './components/SiteSelector';
import { database } from '../../models/database';
import { Q } from '@nozbe/watermelondb';
import { logger } from '../services/LoggingService';
import {
  DesignDocument,
  DesignDocumentCategory,
  DocumentType,
  DocumentStatus,
  DOCUMENT_TYPES,
  STATUS_VALUES,
  DEFAULT_INSTALLATION_CATEGORIES,
  SITE_REQUIRED_TYPES,
  TOP_LEVEL_CATEGORY_TYPE,
} from './types/DesignDocumentTypes';
import {
  designDocumentManagementReducer,
  createInitialState as createDesignDocumentInitialState,
} from './state/design-document-management';
import { DocumentFormData } from './state/design-document-management';
import { useAccessibility } from '../utils/accessibility';
import { useDebounce } from '../utils/performance';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { useAuth } from '../auth/AuthContext';
import { EmptyState } from '../components/common/EmptyState';

/**
 * DesignDocumentManagementScreen
 *
 * Manages design documents across 4 types with user-defined sub-categories
 * and a document approval workflow.
 *
 * Document Types: Simulation/Study, Installation, Product/Equipment, As-Built
 * Status Workflow: Draft -> Submitted -> Approved / Approved with Comment / Rejected
 */

const DesignDocumentManagementScreen = () => {
  const { projectId, projectName, engineerId, refreshTrigger, selectedSiteId } = useDesignEngineerContext();
  const [state, dispatch] = useReducer(designDocumentManagementReducer, createDesignDocumentInitialState());
  const { announce } = useAccessibility();
  const navigation = useNavigation();

  // Copy dialogs state
  const [copyDialogVisible, setCopyDialogVisible] = useState(false);
  const [duplicateDialogVisible, setDuplicateDialogVisible] = useState(false);
  const [duplicateNumbers, setDuplicateNumbers] = useState<string[]>([]);
  const [pendingCopyCallback, setPendingCopyCallback] = useState<
    ((skipDuplicates: boolean, selectedDuplicates: string[]) => void) | null
  >(null);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [siteDocumentCount, setSiteDocumentCount] = useState(0);
  const [moveDialogVisible, setMoveDialogVisible] = useState(false);
  const [moveDocument, setMoveDocument] = useState<DesignDocument | null>(null);
  const [keyDates, setKeyDates] = useState<Array<{id: string; code: string; description: string; category: string}>>([]);

  const debouncedSearchQuery = useDebounce(state.filters.searchQuery, 300);

  // Load data on mount
  useEffect(() => {
    loadSites();
    loadCategories();
    loadDocuments();
    loadKeyDates();
  }, [projectId, refreshTrigger, selectedSiteId, engineerId]);

  // Seed default top-level categories on first load
  const seedDefaultCategories = useCallback(async () => {
    if (!projectId || !engineerId) return;

    try {
      const categoriesCollection = database.collections.get('design_document_categories');
      const existingDefaults = await categoriesCollection
        .query(
          Q.where('project_id', projectId),
          Q.where('document_type', TOP_LEVEL_CATEGORY_TYPE),
          Q.where('is_default', true),
        )
        .fetch();

      if (existingDefaults.length === 0) {
        const defaultCategoryLabels = DOCUMENT_TYPES.map((t) => t.label);
        await database.write(async () => {
          // Seed top-level categories
          for (let i = 0; i < defaultCategoryLabels.length; i++) {
            await categoriesCollection.create((rec: any) => {
              rec.name = defaultCategoryLabels[i];
              rec.documentType = TOP_LEVEL_CATEGORY_TYPE;
              rec.projectId = projectId;
              rec.isDefault = true;
              rec.sequenceOrder = i + 1;
              rec.createdBy = engineerId;
              rec.createdAt = Date.now();
              rec.updatedAt = Date.now();
              rec.appSyncStatus = 'pending';
              rec.version = 1;
            });
          }
          // Seed default Installation sub-categories
          for (let i = 0; i < DEFAULT_INSTALLATION_CATEGORIES.length; i++) {
            await categoriesCollection.create((rec: any) => {
              rec.name = DEFAULT_INSTALLATION_CATEGORIES[i];
              rec.documentType = 'installation';
              rec.projectId = projectId;
              rec.isDefault = true;
              rec.sequenceOrder = i + 1;
              rec.createdBy = engineerId;
              rec.createdAt = Date.now();
              rec.updatedAt = Date.now();
              rec.appSyncStatus = 'pending';
              rec.version = 1;
            });
          }
        });

        logger.info('[DesignDocument] Seeded default top-level and installation sub-categories');
        await loadCategories();
      }
    } catch (error: any) {
      logger.error('[DesignDocument] Error seeding default categories:', error);
    }
  }, [projectId, engineerId]);

  useEffect(() => {
    if (projectId && engineerId) {
      seedDefaultCategories();
    }
  }, [projectId, engineerId, seedDefaultCategories]);

  const loadSites = async () => {
    if (!projectId) return;
    try {
      const sitesCollection = database.collections.get('sites');
      const sitesData = await sitesCollection.query(Q.where('project_id', projectId)).fetch();
      const sitesList = sitesData.map((site: any) => ({ id: site.id, name: site.name }));
      dispatch({ type: 'SET_SITES', payload: { sites: sitesList } });
    } catch (error: any) {
      logger.error('[DesignDocument] Error loading sites:', error);
    }
  };

  const loadKeyDates = async () => {
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
  };

  const loadCategories = async () => {
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
  };

  const loadDocuments = async () => {
    if (!projectId || !engineerId) {
      dispatch({ type: 'COMPLETE_LOADING' });
      return;
    }

    try {
      dispatch({ type: 'START_LOADING' });

      // Query documents created by this engineer in this project
      const docsCollection = database.collections.get('design_documents');
      let docsData;

      if (selectedSiteId === 'all') {
        // Show all documents created by this engineer in the project
        docsData = await docsCollection
          .query(
            Q.where('project_id', projectId),
            Q.where('created_by', engineerId)
          )
          .fetch();
      } else {
        // Show documents from selected site only
        docsData = await docsCollection
          .query(
            Q.where('project_id', projectId),
            Q.where('created_by', engineerId),
            Q.where('site_id', selectedSiteId)
          )
          .fetch();
      }

      const documentsWithDetails = await Promise.all(
        docsData.map(async (doc: any) => {
          let siteName = '';
          let categoryName = '';

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
              const category = await database.collections.get('design_document_categories').find(doc.categoryId);
              categoryName = (category as any).name;
            } catch (e) {
              logger.warn('[DesignDocument] Category not found:', doc.categoryId);
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
      announce(`Loaded ${documentsWithDetails.length} design document${documentsWithDetails.length !== 1 ? 's' : ''}`);
    } catch (error: any) {
      logger.error('[DesignDocument] Error loading documents:', error);
      Alert.alert('Error', 'Failed to load design documents');
    } finally {
      dispatch({ type: 'COMPLETE_LOADING' });
    }
  };

  const handleCreateOrUpdateDocument = async () => {
    const { documentNumber, title, documentType, categoryId, siteId, keyDateId, revisionNumber, weightage } = state.form;

    if (!documentNumber || !title || !documentType) {
      Alert.alert('Validation Error', 'Please fill in all required fields');
      return;
    }

    const requiresSite = SITE_REQUIRED_TYPES.includes(documentType as DocumentType);
    if (requiresSite && !siteId) {
      Alert.alert('Validation Error', 'Site is required for this document type');
      return;
    }

    // Validate weightage
    const weightageNum = weightage ? parseFloat(weightage) : undefined;
    if (weightage && (isNaN(weightageNum!) || weightageNum! < 0 || weightageNum! > 100)) {
      Alert.alert('Validation Error', 'Weightage must be a number between 0 and 100');
      return;
    }

    // Validate total weightage per site if applicable
    if (requiresSite && siteId && weightageNum !== undefined) {
      try {
        const docsCollection = database.collections.get('design_documents');
        const siteDocuments = await docsCollection
          .query(Q.where('site_id', siteId))
          .fetch();

        // Calculate total weightage for the site (excluding current document if editing)
        const totalWeightage = siteDocuments
          .filter((doc: any) => doc.id !== state.ui.editingDocumentId)
          .reduce((sum: number, doc: any) => sum + (doc.weightage || 0), 0);

        const newTotal = totalWeightage + weightageNum;
        const siteName = state.data.sites.find(s => s.id === siteId)?.name || 'this site';

        if (newTotal > 100) {
          Alert.alert(
            'Weightage Validation',
            `Total weightage for ${siteName} would be ${newTotal.toFixed(1)}%. ` +
            `Total weightage per site should equal 100%.\n\n` +
            `Current total: ${totalWeightage.toFixed(1)}%\n` +
            `Adding: ${weightageNum.toFixed(1)}%\n` +
            `New total: ${newTotal.toFixed(1)}%\n\n` +
            `Available: ${(100 - totalWeightage).toFixed(1)}%`
          );
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
        // Update existing document
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

        await database.write(async () => {
          await record.update((rec: any) => {
            rec.documentNumber = documentNumber;
            rec.title = title;
            rec.description = state.form.description || null;
            rec.documentType = documentType;
            rec.categoryId = categoryId || null;
            rec.siteId = requiresSite ? siteId : null;
            rec.keyDateId = keyDateId || null;
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
          createdBy: (record as any).createdBy,
          createdAt: (record as any).createdAt,
          updatedAt: Date.now(),
        };

        dispatch({ type: 'UPDATE_DOCUMENT', payload: { document: updatedDoc } });
        Alert.alert('Success', 'Document updated successfully');
      } else {
        // Create new document
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
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
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
  };

  const handleEditDocument = (doc: DesignDocument) => {
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
        revisionNumber: doc.revisionNumber,
        weightage: doc.weightage !== undefined && doc.weightage !== null ? String(doc.weightage) : '',
      },
    });
    dispatch({ type: 'OPEN_DIALOG', payload: { editingDocumentId: doc.id } });
  };

  const handleReviseDocument = (doc: DesignDocument) => {
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
        revisionNumber: newRevision,
        weightage: doc.weightage !== undefined && doc.weightage !== null ? String(doc.weightage) : '',
      },
    });
  };

  const handleApprovalAction = async () => {
    const { approvalDocumentId, approvalAction } = state.ui;
    if (!approvalDocumentId || !approvalAction) return;

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
          submittedDate: approvalAction === 'submit' ? Date.now() : existingDoc.submittedDate,
          approvedDate: (approvalAction === 'approve' || approvalAction === 'approve_with_comment')
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
    }
  };

  const handleAddCategory = async (name: string) => {
    if (!projectId || !engineerId) return;

    try {
      const categoriesCollection = database.collections.get('design_document_categories');

      const existingCategories = await categoriesCollection
        .query(
          Q.where('project_id', projectId),
          Q.where('document_type', TOP_LEVEL_CATEGORY_TYPE),
        )
        .fetch();

      let newCategory: DesignDocumentCategory | null = null;

      await database.write(async () => {
        const record = await categoriesCollection.create((rec: any) => {
          rec.name = name;
          rec.documentType = TOP_LEVEL_CATEGORY_TYPE;
          rec.projectId = projectId;
          rec.isDefault = false;
          rec.sequenceOrder = existingCategories.length + 1;
          rec.createdBy = engineerId;
          rec.createdAt = Date.now();
          rec.updatedAt = Date.now();
          rec.appSyncStatus = 'pending';
          rec.version = 1;
        });

        newCategory = {
          id: record.id,
          name,
          documentType: TOP_LEVEL_CATEGORY_TYPE,
          projectId,
          isDefault: false,
          sequenceOrder: existingCategories.length + 1,
        };
      });

      if (newCategory) {
        dispatch({ type: 'ADD_CATEGORY', payload: { category: newCategory } });
      }
    } catch (error: any) {
      logger.error('[DesignDocument] Error adding category:', error);
      Alert.alert('Error', 'Failed to add category');
    }
  };

  const handleAddSubCategory = async (name: string, parentSlug: string) => {
    if (!projectId || !engineerId) return;

    try {
      const categoriesCollection = database.collections.get('design_document_categories');

      const existingSubs = await categoriesCollection
        .query(
          Q.where('project_id', projectId),
          Q.where('document_type', parentSlug),
        )
        .fetch();

      let newCategory: DesignDocumentCategory | null = null;

      await database.write(async () => {
        const record = await categoriesCollection.create((rec: any) => {
          rec.name = name;
          rec.documentType = parentSlug;
          rec.projectId = projectId;
          rec.isDefault = false;
          rec.sequenceOrder = existingSubs.length + 1;
          rec.createdBy = engineerId;
          rec.createdAt = Date.now();
          rec.updatedAt = Date.now();
          rec.appSyncStatus = 'pending';
          rec.version = 1;
        });

        newCategory = {
          id: record.id,
          name,
          documentType: parentSlug as any,
          projectId,
          isDefault: false,
          sequenceOrder: existingSubs.length + 1,
        };
      });

      if (newCategory) {
        dispatch({ type: 'ADD_CATEGORY', payload: { category: newCategory } });
      }
    } catch (error: any) {
      logger.error('[DesignDocument] Error adding sub-category:', error);
      Alert.alert('Error', 'Failed to add document type');
    }
  };

  const handleUpdateCategory = async (categoryId: string, newName: string) => {
    if (!projectId) return;

    try {
      const categoriesCollection = database.collections.get('design_document_categories');
      const record = await categoriesCollection.find(categoryId);

      await database.write(async () => {
        await record.update((rec: any) => {
          rec.name = newName;
          rec.updatedAt = Date.now();
        });
      });

      dispatch({ type: 'UPDATE_CATEGORY', payload: { categoryId, name: newName } });
    } catch (error: any) {
      logger.error('[DesignDocument] Error updating category:', error);
      Alert.alert('Error', 'Failed to update category');
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      const categoriesCollection = database.collections.get('design_document_categories');
      const record = await categoriesCollection.find(categoryId);
      const categoryName = (record as any).name;

      // Check if any documents use this category by category_id
      const docsCollection = database.collections.get('design_documents');
      const docsUsingCategory = await docsCollection
        .query(Q.where('category_id', categoryId))
        .fetchCount();

      if (docsUsingCategory > 0) {
        Alert.alert('Cannot Delete', 'This category is used by existing documents. Remove documents first.');
        return;
      }

      // For top-level categories, also check if documents reference the category
      // name as their document_type (slug form)
      const categoryRecord = record as any;
      if (categoryRecord.documentType === TOP_LEVEL_CATEGORY_TYPE) {
        const slug = categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/(^_|_$)/g, '');
        const docsWithType = await docsCollection
          .query(Q.where('document_type', slug))
          .fetchCount();

        if (docsWithType > 0) {
          Alert.alert('Cannot Delete', `This category has ${docsWithType} document(s) of type "${categoryName}". Remove them first.`);
          return;
        }
      }

      await database.write(async () => {
        await record.markAsDeleted();
      });

      dispatch({ type: 'DELETE_CATEGORY', payload: { categoryId } });
    } catch (error: any) {
      logger.error('[DesignDocument] Error deleting category:', error);
      Alert.alert('Error', 'Failed to delete category');
    }
  };

  // ==================== Copy Functionality ====================

  // Count documents when selected site changes
  useEffect(() => {
    const countDocuments = async () => {
      if (!selectedSiteId) {
        setSiteDocumentCount(0);
        return;
      }

      try {
        const count = await database.collections
          .get('design_documents')
          .query(Q.where('site_id', selectedSiteId))
          .fetchCount();

        setSiteDocumentCount(count);
      } catch (error) {
        logger.error('[DesignDocument] Error counting documents:', error as Error);
        setSiteDocumentCount(0);
      }
    };

    countDocuments();
  }, [selectedSiteId]);

  /**
   * Handle opening the copy dialog
   */
  const handleOpenCopyDialog = () => {
    if (!selectedSiteId) {
      Alert.alert('No Site Selected', 'Please select a site to copy documents from.');
      return;
    }

    if (siteDocumentCount === 0) {
      Alert.alert('No Documents', 'The selected site has no documents to copy.');
      return;
    }

    setCopyDialogVisible(true);
  };

  /**
   * Handle copy success
   */
  const handleCopySuccess = (copiedCount: number, destinationSiteName: string) => {
    setSnackbarMessage(`Successfully copied ${copiedCount} document${copiedCount !== 1 ? 's' : ''} to ${destinationSiteName}`);
    setSnackbarVisible(true);
    setCopyDialogVisible(false);

    // Reload documents to reflect changes
    loadDocuments();

    logger.info('[DesignDocument] Documents copied successfully', {
      copiedCount,
      destinationSiteName,
    });
  };

  /**
   * Handle duplicates found during copy
   */
  const handleDuplicatesFound = (
    duplicates: string[],
    proceedWithCopy: (skipDuplicates: boolean, selectedDuplicates: string[]) => void
  ) => {
    setDuplicateNumbers(duplicates);
    setPendingCopyCallback(() => proceedWithCopy);
    setDuplicateDialogVisible(true);
  };

  /**
   * Handle skip duplicates option
   */
  const handleSkipDuplicates = () => {
    if (pendingCopyCallback) {
      pendingCopyCallback(true, duplicateNumbers);
    }
    setDuplicateDialogVisible(false);
    setPendingCopyCallback(null);
    setDuplicateNumbers([]);
  };

  /**
   * Handle create all (including duplicates) option
   */
  const handleCreateAllDuplicates = () => {
    if (pendingCopyCallback) {
      pendingCopyCallback(false, []);
    }
    setDuplicateDialogVisible(false);
    setPendingCopyCallback(null);
    setDuplicateNumbers([]);
  };

  /**
   * Handle cancel duplicate dialog
   */
  const handleCancelDuplicates = () => {
    setDuplicateDialogVisible(false);
    setPendingCopyCallback(null);
    setDuplicateNumbers([]);
    setCopyDialogVisible(false);
  };

  // ==================== Move Functionality ====================

  const handleMoveDocument = (doc: DesignDocument) => {
    setMoveDocument(doc);
    setMoveDialogVisible(true);
  };

  const handleMoveSuccess = (destinationSiteName: string) => {
    setMoveDialogVisible(false);
    setMoveDocument(null);
    setSnackbarMessage(`Document moved to ${destinationSiteName}`);
    setSnackbarVisible(true);
    loadDocuments();
  };

  // ==================== UI State ====================

  const [fabOpen, setFabOpen] = React.useState(false);
  const [typeMenuVisible, setTypeMenuVisible] = React.useState(false);
  const [statusMenuVisible, setStatusMenuVisible] = React.useState(false);

  const renderEmptyState = () => {
    const hasSearchQuery = state.filters.searchQuery.length > 0;
    const hasTypeFilter = state.filters.documentType !== null;
    const hasStatusFilter = state.filters.status !== null;
    const hasNoDocuments = state.data.documents.length === 0;

    if (hasNoDocuments) {
      return (
        <EmptyState
          icon="file-document-outline"
          title="No Design Documents Yet"
          message="Create your first design document to start tracking"
          helpText="Design documents cover Simulation/Study, Installation, Product/Equipment, and As-Built types."
          actionText="Create Document"
          onAction={() => dispatch({ type: 'OPEN_DIALOG' })}
          variant="large"
        />
      );
    } else if (hasSearchQuery) {
      return (
        <EmptyState
          icon="magnify"
          title="No Documents Found"
          message={`No documents match "${state.filters.searchQuery}".`}
          actionText="Clear Search"
          onAction={() => dispatch({ type: 'SET_SEARCH_QUERY', payload: { query: '' } })}
          variant="search"
        />
      );
    } else if (hasTypeFilter || hasStatusFilter) {
      return (
        <EmptyState
          icon="filter-off"
          title="No Matching Documents"
          message="No documents match the current filters."
          actionText="Clear Filters"
          onAction={() => {
            dispatch({ type: 'SET_FILTER_DOCUMENT_TYPE', payload: { documentType: null } });
            dispatch({ type: 'SET_FILTER_STATUS', payload: { status: null } });
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
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <View>
                <Text style={styles.projectName}>Design Documents</Text>
                <Text style={styles.screenLabel}>No project assigned</Text>
              </View>
            </View>
          </View>
          <View style={styles.centerContainer}>
            <Text style={styles.errorText}>No project assigned to this user</Text>
          </View>
        </View>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerTitleContainer}>
              <Text
                style={styles.projectName}
                accessible
                accessibilityRole="header"
                accessibilityLabel={`Project: ${projectName}`}
              >
                {projectName}
              </Text>
              <Text style={styles.screenLabel}>Design Document Management</Text>
            </View>
            <IconButton
              icon="content-copy"
              iconColor="#FFF"
              size={24}
              onPress={handleOpenCopyDialog}
              accessibilityLabel="Copy documents to another site"
              accessibilityHint="Opens dialog to copy design documents from the selected site to another site"
              style={styles.copyButton}
            />
          </View>
          <SiteSelector style={styles.siteSelector} />
          <Searchbar
            placeholder="Search documents..."
            onChangeText={(query) => dispatch({ type: 'SET_SEARCH_QUERY', payload: { query } })}
            value={state.filters.searchQuery}
            style={styles.searchbar}
            accessible
            accessibilityLabel="Search design documents"
            accessibilityRole="search"
          />

          {/* Filter Dropdowns */}
          <View style={styles.filterRow}>
            <Menu
              visible={typeMenuVisible}
              onDismiss={() => setTypeMenuVisible(false)}
              anchor={
                <TouchableOpacity
                  style={styles.dropdownButton}
                  onPress={() => setTypeMenuVisible(true)}
                  accessibilityLabel="Filter by document type"
                  accessibilityRole="button"
                >
                  <Text style={styles.dropdownButtonText}>
                    {state.filters.documentType
                      ? DOCUMENT_TYPES.find((t) => t.value === state.filters.documentType)?.label
                      : 'All Types'}{' '}
                    ▼
                  </Text>
                </TouchableOpacity>
              }
            >
              <Menu.Item
                onPress={() => {
                  dispatch({ type: 'SET_FILTER_DOCUMENT_TYPE', payload: { documentType: null } });
                  setTypeMenuVisible(false);
                }}
                title="All Types"
              />
              {DOCUMENT_TYPES.map((type) => (
                <Menu.Item
                  key={type.value}
                  onPress={() => {
                    dispatch({
                      type: 'SET_FILTER_DOCUMENT_TYPE',
                      payload: { documentType: state.filters.documentType === type.value ? null : type.value },
                    });
                    setTypeMenuVisible(false);
                  }}
                  title={type.label}
                />
              ))}
            </Menu>

            <Menu
              visible={statusMenuVisible}
              onDismiss={() => setStatusMenuVisible(false)}
              anchor={
                <TouchableOpacity
                  style={styles.dropdownButton}
                  onPress={() => setStatusMenuVisible(true)}
                  accessibilityLabel="Filter by status"
                  accessibilityRole="button"
                >
                  <Text style={styles.dropdownButtonText}>
                    {state.filters.status
                      ? STATUS_VALUES.find((s) => s.value === state.filters.status)?.label
                      : 'All Status'}{' '}
                    ▼
                  </Text>
                </TouchableOpacity>
              }
            >
              <Menu.Item
                onPress={() => {
                  dispatch({ type: 'SET_FILTER_STATUS', payload: { status: null } });
                  setStatusMenuVisible(false);
                }}
                title="All Status"
              />
              {STATUS_VALUES.filter((s) => ['draft', 'submitted', 'approved', 'rejected'].includes(s.value)).map((status) => (
                <Menu.Item
                  key={status.value}
                  onPress={() => {
                    dispatch({
                      type: 'SET_FILTER_STATUS',
                      payload: { status: state.filters.status === status.value ? null : status.value as DocumentStatus },
                    });
                    setStatusMenuVisible(false);
                  }}
                  title={status.label}
                />
              ))}
            </Menu>
          </View>
        </View>

        {state.ui.loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator
              size="large"
              color="#007AFF"
              accessible
              accessibilityLabel="Loading design documents"
            />
          </View>
        ) : (
          <FlatList
            data={state.data.filteredDocuments}
            renderItem={({ item }) => (
              <DesignDocumentCard
                document={item}
                onEdit={handleEditDocument}
                onDelete={handleDeleteDocument}
                onSubmit={(id) =>
                  dispatch({ type: 'OPEN_APPROVAL_DIALOG', payload: { documentId: id, action: 'submit' } })
                }
                onApprove={(id) =>
                  dispatch({ type: 'OPEN_APPROVAL_DIALOG', payload: { documentId: id, action: 'approve' } })
                }
                onApproveWithComment={(id) =>
                  dispatch({ type: 'OPEN_APPROVAL_DIALOG', payload: { documentId: id, action: 'approve_with_comment' } })
                }
                onReject={(id) =>
                  dispatch({ type: 'OPEN_APPROVAL_DIALOG', payload: { documentId: id, action: 'reject' } })
                }
                onRevise={handleReviseDocument}
                onMove={handleMoveDocument}
              />
            )}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            accessible
            accessibilityRole="list"
            accessibilityLabel={`Design documents list, ${state.data.filteredDocuments.length} items`}
            ListEmptyComponent={renderEmptyState()}
          />
        )}

        <FAB.Group
          open={fabOpen}
          visible
          icon={fabOpen ? 'close' : 'plus'}
          actions={[
            {
              icon: 'file-document-plus',
              label: 'New Document',
              onPress: () => dispatch({ type: 'OPEN_DIALOG' }),
              accessibilityLabel: 'Create new design document',
            },
            {
              icon: 'folder-cog',
              label: 'Manage Categories',
              onPress: () => dispatch({ type: 'OPEN_CATEGORIES_DIALOG' }),
              accessibilityLabel: 'Manage document categories',
            },
          ]}
          onStateChange={({ open }) => setFabOpen(open)}
          style={styles.fabGroup}
        />

        <CreateDesignDocumentDialog
          visible={state.ui.dialogVisible}
          onDismiss={() => dispatch({ type: 'CLOSE_DIALOG' })}
          onSave={handleCreateOrUpdateDocument}
          isEditing={!!state.ui.editingDocumentId}
          form={state.form}
          onUpdateField={(field, value) =>
            dispatch({ type: 'UPDATE_FORM_FIELD', payload: { field, value } })
          }
          categories={state.data.categories}
          sites={state.data.sites}
          documents={state.data.documents}
          keyDates={keyDates}
        />

        <ManageCategoriesDialog
          visible={state.ui.categoriesDialogVisible}
          onDismiss={() => dispatch({ type: 'CLOSE_CATEGORIES_DIALOG' })}
          allCategories={state.data.categories}
          onAddCategory={handleAddCategory}
          onAddSubCategory={handleAddSubCategory}
          onUpdateCategory={handleUpdateCategory}
          onDeleteCategory={handleDeleteCategory}
        />

        <ApprovalDialog
          visible={state.ui.approvalDialogVisible}
          onDismiss={() => dispatch({ type: 'CLOSE_APPROVAL_DIALOG' })}
          onConfirm={handleApprovalAction}
          action={state.ui.approvalAction}
          comment={state.approvalComment}
          onCommentChange={(comment) =>
            dispatch({ type: 'SET_APPROVAL_COMMENT', payload: { comment } })
          }
        />

        {/* Copy Documents Dialog */}
        {selectedSiteId && (
          <CopyDesignDocumentsDialog
            visible={copyDialogVisible}
            sourceSiteId={selectedSiteId}
            sourceSiteName={state.data.sites.find((s) => s.id === selectedSiteId)?.name || 'Unknown Site'}
            sourceDocumentCount={siteDocumentCount}
            onClose={() => setCopyDialogVisible(false)}
            onSuccess={handleCopySuccess}
            onDuplicatesFound={handleDuplicatesFound}
          />
        )}

        {/* Duplicate Documents Dialog */}
        <DuplicateDocumentsDialog
          visible={duplicateDialogVisible}
          duplicateNumbers={duplicateNumbers}
          onSkip={handleSkipDuplicates}
          onCreateAll={handleCreateAllDuplicates}
          onCancel={handleCancelDuplicates}
        />

        {/* Move Document Dialog */}
        <MoveDesignDocumentDialog
          visible={moveDialogVisible}
          document={moveDocument}
          onDismiss={() => {
            setMoveDialogVisible(false);
            setMoveDocument(null);
          }}
          onSuccess={handleMoveSuccess}
        />

        {/* Success Snackbar */}
        <Snackbar
          visible={snackbarVisible}
          onDismiss={() => setSnackbarVisible(false)}
          duration={4000}
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
    paddingTop: 16,
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
  headerTitleContainer: {
    flex: 1,
  },
  copyButton: {
    margin: 0,
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
    justifyContent: 'space-between',
    gap: 12,
  },
  dropdownButton: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 6,
    paddingHorizontal: 12,
    height: 40,
    justifyContent: 'center',
  },
  dropdownButtonText: {
    color: '#333',
    fontSize: 12,
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#F44336',
  },
  fabGroup: {
    position: 'absolute',
    right: 0,
    bottom: 0,
  },
  siteSelector: {
    marginTop: 8,
  },
});

export default DesignDocumentManagementScreen;
