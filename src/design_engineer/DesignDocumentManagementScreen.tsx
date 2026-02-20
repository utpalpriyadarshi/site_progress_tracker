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
import ApplyTemplateDialog from './components/ApplyTemplateDialog';
import SiteSelector from './components/SiteSelector';
import { database } from '../../models/database';
import { Q } from '@nozbe/watermelondb';
import { logger } from '../services/LoggingService';
import {
  DesignDocument,
  DocumentType,
  DocumentStatus,
  DOCUMENT_TYPES,
  STATUS_VALUES,
} from './types/DesignDocumentTypes';
import {
  designDocumentManagementReducer,
  createInitialState as createDesignDocumentInitialState,
} from './state/design-document-management';
import { useAccessibility } from '../utils/accessibility';
import { useDebounce } from '../utils/performance';
import { useAuth } from '../auth/AuthContext';
import { EmptyState } from '../components/common/EmptyState';
import { COLORS } from '../theme/colors';
import { useSnackbar } from '../hooks/useSnackbar';
import { useFlatListProps } from '../hooks/useFlatListProps';
import { useDocumentCrud } from './hooks/useDocumentCrud';
import { useCategoryManagement } from './hooks/useCategoryManagement';

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

  // Copy dialogs state
  const [copyDialogVisible, setCopyDialogVisible] = useState(false);
  const [duplicateDialogVisible, setDuplicateDialogVisible] = useState(false);
  const [duplicateNumbers, setDuplicateNumbers] = useState<string[]>([]);
  const [pendingCopyCallback, setPendingCopyCallback] = useState<
    ((skipDuplicates: boolean, selectedDuplicates: string[]) => void) | null
  >(null);
  const { show: showSnackbar, snackbarProps } = useSnackbar();
  const flatListProps = useFlatListProps<DesignDocument>();
  const [siteDocumentCount, setSiteDocumentCount] = useState(0);
  const [moveDialogVisible, setMoveDialogVisible] = useState(false);
  const [templateDialogVisible, setTemplateDialogVisible] = useState(false);
  const [moveDocument, setMoveDocument] = useState<DesignDocument | null>(null);

  const debouncedSearchQuery = useDebounce(state.filters.searchQuery, 300);

  const {
    keyDates,
    isSubmitting,
    isApproving,
    loadSites,
    loadKeyDates,
    loadCategories,
    loadDocuments,
    handleCreateOrUpdateDocument,
    handleDeleteDocument,
    handleEditDocument,
    handleReviseDocument,
    handleApprovalAction,
  } = useDocumentCrud({ projectId, engineerId, selectedSiteId, state, dispatch, announce });

  const {
    seedDefaultCategories,
    handleAddCategory,
    handleAddSubCategory,
    handleUpdateCategory,
    handleDeleteCategory,
  } = useCategoryManagement({ projectId, engineerId, dispatch, loadCategories });

  // Load data on mount
  useEffect(() => {
    loadSites();
    loadCategories();
    loadDocuments();
    loadKeyDates();
  }, [projectId, refreshTrigger, selectedSiteId, engineerId]);

  useEffect(() => {
    if (projectId && engineerId) {
      seedDefaultCategories();
    }
  }, [projectId, engineerId, seedDefaultCategories]);

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

  const handleCopySuccess = (copiedCount: number, destinationSiteName: string) => {
    showSnackbar(`Successfully copied ${copiedCount} document${copiedCount !== 1 ? 's' : ''} to ${destinationSiteName}`);
    setCopyDialogVisible(false);
    loadDocuments();
    logger.info('[DesignDocument] Documents copied successfully', { copiedCount, destinationSiteName });
  };

  const handleDuplicatesFound = (
    duplicates: string[],
    proceedWithCopy: (skipDuplicates: boolean, selectedDuplicates: string[]) => void,
  ) => {
    setDuplicateNumbers(duplicates);
    setPendingCopyCallback(() => proceedWithCopy);
    setDuplicateDialogVisible(true);
  };

  const handleSkipDuplicates = () => {
    if (pendingCopyCallback) {
      pendingCopyCallback(true, duplicateNumbers);
    }
    setDuplicateDialogVisible(false);
    setPendingCopyCallback(null);
    setDuplicateNumbers([]);
  };

  const handleCreateAllDuplicates = () => {
    if (pendingCopyCallback) {
      pendingCopyCallback(false, []);
    }
    setDuplicateDialogVisible(false);
    setPendingCopyCallback(null);
    setDuplicateNumbers([]);
  };

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
    showSnackbar(`Document moved to ${destinationSiteName}`);
    loadDocuments();
  };

  // ==================== Template Functionality ====================

  const handleTemplateSuccess = (createdCount: number, templateName: string) => {
    setTemplateDialogVisible(false);
    showSnackbar(`Created ${createdCount} document${createdCount !== 1 ? 's' : ''} from "${templateName}" template`);
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

          {/* Weightage Summary Bar - only when a specific site is selected */}
          {selectedSiteId && selectedSiteId !== 'all' && (() => {
            const siteDocuments = state.data.documents.filter(d => d.siteId === selectedSiteId);
            const totalWeightage = siteDocuments.reduce((sum, doc) => sum + (doc.weightage || 0), 0);
            const remaining = Math.max(0, 100 - totalWeightage);
            const barColor = totalWeightage > 100 ? COLORS.ERROR : totalWeightage > 80 ? COLORS.WARNING : COLORS.SUCCESS;
            const barWidth = Math.min(totalWeightage, 100);

            if (siteDocuments.length === 0) return null;

            return (
              <View style={styles.weightageContainer}>
                {totalWeightage === 0 ? (
                  <Text style={styles.weightageHint}>No weightage assigned</Text>
                ) : (
                  <>
                    <View style={styles.weightageBarBg}>
                      <View style={[styles.weightageBarFill, { width: `${barWidth}%`, backgroundColor: barColor }]} />
                    </View>
                    <Text style={[styles.weightageText, totalWeightage > 100 && styles.weightageWarning]}>
                      {totalWeightage > 100
                        ? `⚠ ${totalWeightage.toFixed(1)}% (over by ${(totalWeightage - 100).toFixed(1)}%)`
                        : `${totalWeightage.toFixed(1)}% used · ${remaining.toFixed(1)}% available`}
                    </Text>
                  </>
                )}
              </View>
            );
          })()}

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
            {...flatListProps}
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
              icon: 'file-document-multiple',
              label: 'Apply Template',
              onPress: () => setTemplateDialogVisible(true),
              accessibilityLabel: 'Apply document template',
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
          isSubmitting={isSubmitting}
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

        {/* Apply Template Dialog */}
        <ApplyTemplateDialog
          visible={templateDialogVisible}
          onDismiss={() => setTemplateDialogVisible(false)}
          onSuccess={handleTemplateSuccess}
        />

        {/* Success Snackbar */}
        <Snackbar
          {...snackbarProps}
          duration={4000}
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
    marginBottom: 8,
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
    color: COLORS.ERROR,
  },
  fabGroup: {
    position: 'absolute',
    right: 0,
    bottom: 0,
  },
  siteSelector: {
    marginTop: 4,
  },
  weightageContainer: {
    marginVertical: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  weightageBarBg: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  weightageBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  weightageText: {
    fontSize: 11,
    color: '#555',
    marginTop: 3,
    textAlign: 'center',
  },
  weightageWarning: {
    color: COLORS.ERROR,
    fontWeight: '600',
  },
  weightageHint: {
    fontSize: 11,
    color: '#999',
    textAlign: 'center',
  },
});

export default DesignDocumentManagementScreen;
