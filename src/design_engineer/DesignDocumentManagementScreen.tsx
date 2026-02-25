import React, { useReducer, useEffect, useCallback, useState, useRef, useMemo } from 'react';
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
import ApplyTemplateDialog from './components/ApplyTemplateDialog';
import SiteSelector from './components/SiteSelector';
import { database } from '../../models/database';
import { Q } from '@nozbe/watermelondb';
import { logger } from '../services/LoggingService';
import {
  DesignDocument,
  ResolvedKeyDate,
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
import { useRoute, useNavigation } from '@react-navigation/native';
import { EmptyState } from '../components/common/EmptyState';
import { COLORS } from '../theme/colors';
import { commonStyles } from '../styles/common';
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
  const { projectId, projectName, engineerId, refreshTrigger, selectedSiteId, setSelectedSiteId } = useDesignEngineerContext();
  const [state, dispatch] = useReducer(designDocumentManagementReducer, createDesignDocumentInitialState());
  const { announce } = useAccessibility();
  const route = useRoute<any>();
  const navigation = useNavigation();

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
  const [templateDialogVisible, setTemplateDialogVisible] = useState(false);

  const debouncedSearchQuery = useDebounce(state.filters.searchQuery, 300);

  const {
    projectCategoryAKeyDates,
    doorsPackages,
    isSubmitting,
    isApproving,
    loadSites,
    loadProjectKeyDates,
    resolveKeyDateForSite,
    loadDoorsPackages,
    loadCategories,
    loadDocuments,
    handleCreateOrUpdateDocument,
    handleDeleteDocument,
    handleEditDocument,
    handleReviseDocument,
    handleApprovalAction,
  } = useDocumentCrud({ projectId, engineerId, selectedSiteId, state, dispatch, announce });

  // Tracks the auto-resolved Key Date for the currently open dialog
  const [resolvedKeyDate, setResolvedKeyDate] = useState<ResolvedKeyDate | null | undefined>(undefined);
  // Stable ref so async callbacks don't capture stale state
  const resolveKeyDateForSiteRef = useRef(resolveKeyDateForSite);
  useEffect(() => { resolveKeyDateForSiteRef.current = resolveKeyDateForSite; }, [resolveKeyDateForSite]);

  /** Resolves and stores the Key Date for a given site, also syncs form.keyDateId. */
  const resolveAndSetKeyDate = useCallback(async (siteId: string) => {
    const kd = await resolveKeyDateForSiteRef.current(siteId);
    setResolvedKeyDate(kd);
    dispatch({
      type: 'UPDATE_FORM_FIELD',
      payload: { field: 'keyDateId', value: kd?.id || '' },
    });
  }, [dispatch]);

  /** Opens the create dialog, pre-setting siteId and resolving the Key Date when a site is in context. */
  const handleOpenCreateDialog = useCallback(async () => {
    dispatch({ type: 'OPEN_DIALOG' });
    if (selectedSiteId && selectedSiteId !== 'all') {
      dispatch({ type: 'UPDATE_FORM_FIELD', payload: { field: 'siteId', value: selectedSiteId } });
      await resolveAndSetKeyDate(selectedSiteId);
    } else {
      setResolvedKeyDate(undefined);
    }
  }, [selectedSiteId, dispatch, resolveAndSetKeyDate]);

  /** Wraps handleEditDocument to also resolve the Key Date from the doc's site. */
  const handleEditWithKD = useCallback(async (doc: DesignDocument) => {
    handleEditDocument(doc);
    const effectiveSite = doc.siteId || (selectedSiteId !== 'all' ? selectedSiteId : '');
    if (effectiveSite) {
      await resolveAndSetKeyDate(effectiveSite);
    } else {
      setResolvedKeyDate(undefined);
    }
  }, [handleEditDocument, selectedSiteId, resolveAndSetKeyDate]);

  /** Wraps handleReviseDocument to also resolve the Key Date from the doc's site. */
  const handleReviseWithKD = useCallback(async (doc: DesignDocument) => {
    handleReviseDocument(doc);
    const effectiveSite = doc.siteId || (selectedSiteId !== 'all' ? selectedSiteId : '');
    if (effectiveSite) {
      await resolveAndSetKeyDate(effectiveSite);
    } else {
      setResolvedKeyDate(undefined);
    }
  }, [handleReviseDocument, selectedSiteId, resolveAndSetKeyDate]);

  /** Set of document IDs that are the latest revision for their documentNumber. */
  const latestRevisionIds = useMemo(() => {
    const getRevNum = (rev: string) => {
      const m = rev.match(/^R(\d+)$/);
      return m ? parseInt(m[1], 10) : 0;
    };
    const latest = new Map<string, { id: string; revNum: number }>();
    for (const doc of state.data.documents) {
      const revNum = getRevNum(doc.revisionNumber);
      const existing = latest.get(doc.documentNumber);
      if (!existing || revNum > existing.revNum) {
        latest.set(doc.documentNumber, { id: doc.id, revNum });
      }
    }
    return new Set(Array.from(latest.values()).map((v) => v.id));
  }, [state.data.documents]);

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
    loadProjectKeyDates();
    loadDoorsPackages();
  }, [projectId, refreshTrigger, selectedSiteId, engineerId]);

  // Apply statusFilter from dashboard navigation (e.g. clicking "Rejected" widget)
  useEffect(() => {
    const statusFilter = route.params?.statusFilter as DocumentStatus | undefined;
    if (statusFilter) {
      // Reset site to "All Sites" so the filter spans the whole project, not just the last-viewed site
      setSelectedSiteId('all');
      dispatch({ type: 'SET_FILTER_STATUS', payload: { status: statusFilter } });
      // Clear the param so navigating back and tapping the same widget again re-applies the filter
      navigation.setParams({ statusFilter: undefined } as never);
    }
  }, [route.params?.statusFilter]);

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


  // ==================== Normalize Weightage ====================

  const handleNormalizeWeightage = async (siteId: string, totalWeightage: number) => {
    Alert.alert(
      'Normalize Weightage',
      `Scale all document weightages proportionally so the total equals exactly 100%?\n\nCurrent total: ${totalWeightage.toFixed(1)}%`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Normalize',
          onPress: async () => {
            try {
              const docsCollection = database.collections.get('design_documents');
              const siteDocs = await docsCollection.query(Q.where('site_id', siteId)).fetch();
              const weightedDocs = siteDocs.filter((d: any) => d.weightage > 0);
              if (weightedDocs.length === 0) return;

              const scaleFactor = 100 / totalWeightage;
              const newWeightages = weightedDocs.map((d: any) =>
                Math.max(0, Math.round(d.weightage * scaleFactor * 10) / 10)
              );

              // Fix rounding drift on last doc
              const scaledSum = newWeightages.reduce((a, b) => a + b, 0);
              const diff = parseFloat((100 - scaledSum).toFixed(1));
              newWeightages[newWeightages.length - 1] = parseFloat(
                (newWeightages[newWeightages.length - 1] + diff).toFixed(1)
              );

              await database.write(async () => {
                for (let i = 0; i < weightedDocs.length; i++) {
                  await weightedDocs[i].update((rec: any) => {
                    rec.weightage = newWeightages[i];
                  });
                }
              });

              showSnackbar('Weightage normalized to 100%');
              loadDocuments();
            } catch (error) {
              logger.error('[DesignDocument] Error normalizing weightage:', error as Error);
            }
          },
        },
      ]
    );
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
          onAction={handleOpenCreateDialog}
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
        <View style={commonStyles.screen}>
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
      <View style={commonStyles.screen}>
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
                    <View style={styles.weightageRow}>
                      <Text style={[styles.weightageText, totalWeightage > 100 && styles.weightageWarning]}>
                        {totalWeightage > 100
                          ? `⚠ ${totalWeightage.toFixed(1)}% (over by ${(totalWeightage - 100).toFixed(1)}%)`
                          : `${totalWeightage.toFixed(1)}% used · ${remaining.toFixed(1)}% available`}
                      </Text>
                      {totalWeightage > 100 && (
                        <TouchableOpacity
                          onPress={() => handleNormalizeWeightage(selectedSiteId, totalWeightage)}
                          style={styles.normalizeButton}
                        >
                          <Text style={styles.normalizeButtonText}>Normalize</Text>
                        </TouchableOpacity>
                      )}
                    </View>
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

          {/* Active filter chips — tap × to clear */}
          {(state.filters.status !== null || state.filters.documentType !== null) && (
            <View style={styles.activeFiltersRow}>
              {state.filters.documentType !== null && (
                <TouchableOpacity
                  style={styles.activeFilterChip}
                  onPress={() => dispatch({ type: 'SET_FILTER_DOCUMENT_TYPE', payload: { documentType: null } })}
                  accessibilityLabel={`Clear type filter: ${DOCUMENT_TYPES.find(t => t.value === state.filters.documentType)?.label}`}
                >
                  <Text style={styles.activeFilterChipText}>
                    {DOCUMENT_TYPES.find(t => t.value === state.filters.documentType)?.label}  ×
                  </Text>
                </TouchableOpacity>
              )}
              {state.filters.status !== null && (
                <TouchableOpacity
                  style={styles.activeFilterChip}
                  onPress={() => dispatch({ type: 'SET_FILTER_STATUS', payload: { status: null } })}
                  accessibilityLabel={`Clear status filter: ${STATUS_VALUES.find(s => s.value === state.filters.status)?.label}`}
                >
                  <Text style={styles.activeFilterChipText}>
                    {STATUS_VALUES.find(s => s.value === state.filters.status)?.label}  ×
                  </Text>
                </TouchableOpacity>
              )}
              {state.filters.status !== null && state.filters.documentType !== null && (
                <TouchableOpacity
                  style={[styles.activeFilterChip, styles.clearAllChip]}
                  onPress={() => {
                    dispatch({ type: 'SET_FILTER_DOCUMENT_TYPE', payload: { documentType: null } });
                    dispatch({ type: 'SET_FILTER_STATUS', payload: { status: null } });
                  }}
                  accessibilityLabel="Clear all filters"
                >
                  <Text style={[styles.activeFilterChipText, styles.clearAllChipText]}>Clear all</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
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
                onEdit={handleEditWithKD}
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
                onRevise={latestRevisionIds.has(item.id) ? handleReviseWithKD : undefined}
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
              onPress: handleOpenCreateDialog,
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
          isRevising={state.ui.isRevising}
          isSubmitting={isSubmitting}
          form={state.form}
          onUpdateField={(field, value) =>
            dispatch({ type: 'UPDATE_FORM_FIELD', payload: { field, value } })
          }
          categories={state.data.categories}
          sites={state.data.sites}
          documents={state.data.documents}
          resolvedKeyDate={resolvedKeyDate}
          contextSiteId={selectedSiteId}
          projectCategoryAKeyDates={projectCategoryAKeyDates}
          onSiteSelectedInForm={resolveAndSetKeyDate}
          doorsPackages={doorsPackages}
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
  activeFiltersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  activeFilterChip: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  activeFilterChipText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  clearAllChip: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#FFF',
  },
  clearAllChipText: {
    color: '#FFF',
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
  weightageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 3,
  },
  weightageText: {
    fontSize: 11,
    color: '#555',
    flex: 1,
  },
  normalizeButton: {
    backgroundColor: COLORS.ERROR,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  normalizeButtonText: {
    fontSize: 10,
    color: '#FFF',
    fontWeight: '600',
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
