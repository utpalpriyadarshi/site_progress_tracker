import React, { useReducer, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { FAB, Searchbar, Chip } from 'react-native-paper';
import { useDesignEngineerContext } from './context/DesignEngineerContext';
import ErrorBoundary from '../components/common/ErrorBoundary';
import DesignDocumentCard from './components/DesignDocumentCard';
import CreateDesignDocumentDialog from './components/CreateDesignDocumentDialog';
import ManageCategoriesDialog from './components/ManageCategoriesDialog';
import ApprovalDialog from './components/ApprovalDialog';
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
  const { projectId, projectName, engineerId, refreshTrigger } = useDesignEngineerContext();
  const [state, dispatch] = useReducer(designDocumentManagementReducer, createDesignDocumentInitialState());
  const { announce } = useAccessibility();
  const navigation = useNavigation();
  const { logout } = useAuth();

  const debouncedSearchQuery = useDebounce(state.filters.searchQuery, 300);

  const handleLogout = async () => {
    await logout();
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Auth' as any }],
      }),
    );
  };

  // Load data on mount
  useEffect(() => {
    loadSites();
    loadCategories();
    loadDocuments();
  }, [projectId, refreshTrigger]);

  // Seed default installation categories on first load
  const seedDefaultCategories = useCallback(async () => {
    if (!projectId || !engineerId) return;

    try {
      const categoriesCollection = database.collections.get('design_document_categories');
      const existingDefaults = await categoriesCollection
        .query(
          Q.where('project_id', projectId),
          Q.where('document_type', 'installation'),
          Q.where('is_default', true),
        )
        .fetch();

      if (existingDefaults.length === 0) {
        await database.write(async () => {
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

        logger.info('[DesignDocument] Seeded default installation categories');
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
    if (!projectId) {
      dispatch({ type: 'COMPLETE_LOADING' });
      return;
    }

    try {
      dispatch({ type: 'START_LOADING' });

      const docsCollection = database.collections.get('design_documents');
      const docsData = await docsCollection
        .query(Q.where('project_id', projectId))
        .fetch();

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
            revisionNumber: doc.revisionNumber,
            status: doc.status,
            approvalComment: doc.approvalComment,
            submittedDate: doc.submittedDate,
            approvedDate: doc.approvedDate,
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
    const { documentNumber, title, documentType, categoryId, siteId, revisionNumber } = state.form;

    if (!documentNumber || !title || !documentType || !categoryId) {
      Alert.alert('Validation Error', 'Please fill in all required fields');
      return;
    }

    const requiresSite = SITE_REQUIRED_TYPES.includes(documentType as DocumentType);
    if (requiresSite && !siteId) {
      Alert.alert('Validation Error', 'Site is required for this document type');
      return;
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
        try {
          const cat = await database.collections.get('design_document_categories').find(categoryId);
          categoryName = (cat as any).name;
        } catch (e) { /* ignored */ }

        await database.write(async () => {
          await record.update((rec: any) => {
            rec.documentNumber = documentNumber;
            rec.title = title;
            rec.description = state.form.description || null;
            rec.documentType = documentType;
            rec.categoryId = categoryId;
            rec.siteId = requiresSite ? siteId : null;
            rec.revisionNumber = revisionNumber || 'R0';
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
            rec.categoryId = categoryId;
            rec.projectId = projectId;
            rec.siteId = requiresSite ? siteId : null;
            rec.revisionNumber = revisionNumber || 'R0';
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
          try {
            const cat = await database.collections.get('design_document_categories').find(categoryId);
            categoryName = (cat as any).name;
          } catch (e) { /* ignored */ }

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
        revisionNumber: doc.revisionNumber,
      },
    });
    dispatch({ type: 'OPEN_DIALOG', payload: { editingDocumentId: doc.id } });
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

  const handleAddCategory = async (name: string, documentType: DocumentType) => {
    if (!projectId || !engineerId) return;

    try {
      const categoriesCollection = database.collections.get('design_document_categories');

      const existingCategories = await categoriesCollection
        .query(
          Q.where('project_id', projectId),
          Q.where('document_type', documentType),
        )
        .fetch();

      let newCategory: DesignDocumentCategory | null = null;

      await database.write(async () => {
        const record = await categoriesCollection.create((rec: any) => {
          rec.name = name;
          rec.documentType = documentType;
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
          documentType,
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

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      // Check if any documents use this category
      const docsCollection = database.collections.get('design_documents');
      const docsUsingCategory = await docsCollection
        .query(Q.where('category_id', categoryId))
        .fetchCount();

      if (docsUsingCategory > 0) {
        Alert.alert('Cannot Delete', 'This category is used by existing documents. Remove documents first.');
        return;
      }

      const categoriesCollection = database.collections.get('design_document_categories');
      const record = await categoriesCollection.find(categoryId);

      await database.write(async () => {
        await record.markAsDeleted();
      });

      dispatch({ type: 'DELETE_CATEGORY', payload: { categoryId } });
    } catch (error: any) {
      logger.error('[DesignDocument] Error deleting category:', error);
      Alert.alert('Error', 'Failed to delete category');
    }
  };

  const [fabOpen, setFabOpen] = React.useState(false);

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
              <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                <Text style={styles.logoutText}>Logout</Text>
              </TouchableOpacity>
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
            <View>
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
            <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
          <Searchbar
            placeholder="Search documents..."
            onChangeText={(query) => dispatch({ type: 'SET_SEARCH_QUERY', payload: { query } })}
            value={state.filters.searchQuery}
            style={styles.searchbar}
            accessible
            accessibilityLabel="Search design documents"
            accessibilityRole="search"
          />

          {/* Document Type Filter Chips */}
          <View style={styles.filterRow}>
            <Chip
              mode={state.filters.documentType === null ? 'flat' : 'outlined'}
              selected={state.filters.documentType === null}
              onPress={() => dispatch({ type: 'SET_FILTER_DOCUMENT_TYPE', payload: { documentType: null } })}
              style={[styles.filterChip, state.filters.documentType === null && styles.activeChip]}
              textStyle={state.filters.documentType === null ? styles.activeChipText : undefined}
            >
              All
            </Chip>
            {DOCUMENT_TYPES.map((type) => (
              <Chip
                key={type.value}
                mode={state.filters.documentType === type.value ? 'flat' : 'outlined'}
                selected={state.filters.documentType === type.value}
                onPress={() =>
                  dispatch({
                    type: 'SET_FILTER_DOCUMENT_TYPE',
                    payload: { documentType: state.filters.documentType === type.value ? null : type.value },
                  })
                }
                style={[styles.filterChip, state.filters.documentType === type.value && styles.activeChip]}
                textStyle={state.filters.documentType === type.value ? styles.activeChipText : undefined}
              >
                {type.label}
              </Chip>
            ))}
          </View>

          {/* Status Filter Chips */}
          <View style={styles.filterRow}>
            {STATUS_VALUES.filter((s) => ['draft', 'submitted', 'approved', 'rejected'].includes(s.value)).map((status) => (
              <Chip
                key={status.value}
                mode={state.filters.status === status.value ? 'flat' : 'outlined'}
                selected={state.filters.status === status.value}
                onPress={() =>
                  dispatch({
                    type: 'SET_FILTER_STATUS',
                    payload: { status: state.filters.status === status.value ? null : status.value as DocumentStatus },
                  })
                }
                style={[styles.filterChip, state.filters.status === status.value && styles.activeChip]}
                textStyle={state.filters.status === status.value ? styles.activeChipText : undefined}
              >
                {status.label}
              </Chip>
            ))}
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
        />

        <ManageCategoriesDialog
          visible={state.ui.categoriesDialogVisible}
          onDismiss={() => dispatch({ type: 'CLOSE_CATEGORIES_DIALOG' })}
          categories={state.data.categories}
          onAddCategory={handleAddCategory}
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
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  filterChip: {
    marginBottom: 4,
  },
  activeChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  activeChipText: {
    color: '#FFF',
    fontWeight: 'bold',
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
});

export default DesignDocumentManagementScreen;
