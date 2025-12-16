import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { FAB } from 'react-native-paper';
import { database } from '../../models/database';
import SiteInspectionModel from '../../models/SiteInspectionModel';
import { useSiteContext } from './context/SiteContext';
import SiteSelector from './components/SiteSelector';
import { useSnackbar } from '../components/Snackbar';
import { ConfirmDialog } from '../components/Dialog';
import { logger } from '../services/LoggingService';
import {
  InspectionList,
  InspectionForm,
} from './site_inspection/components';
import { useInspectionData } from './site_inspection/hooks';
import {
  InspectionWithSite,
  InspectionFormData,
} from './site_inspection/types';
import { LoadingOverlay, SupervisorHeader, OfflineIndicator, SyncButton } from '../components/common';
import { useOfflineSync } from '../hooks/useOfflineSync';
import { SyncService } from '../../services/sync/SyncService';

/**
 * SiteInspectionScreen
 *
 * Main screen for creating, viewing, editing, and deleting site inspections.
 * Refactored from 1,258 lines to ~280 lines using modular components and hooks.
 *
 * Architecture:
 * - Uses useInspectionData hook for data loading and sync
 * - Uses InspectionList component for display
 * - Uses InspectionForm component for create/edit dialog
 * - Keeps screen-level state for dialog visibility and delete confirmation
 * - Keeps database write operations (handleSave, confirmDelete)
 */
const SiteInspectionScreen = () => {
  const { showSnackbar } = useSnackbar();
  const { selectedSiteId, supervisorId, projectId } = useSiteContext();

  // Screen-level state
  const [dialogVisible, setDialogVisible] = useState(false);
  const [editingInspection, setEditingInspection] = useState<SiteInspectionModel | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [inspectionToDelete, setInspectionToDelete] = useState<SiteInspectionModel | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Offline sync management
  const {
    isOnline,
    syncStatus,
    pendingCount,
    sync: manualSync,
    setPendingCount,
  } = useOfflineSync({
    onSync: async () => {
      await SyncService.syncUp();
      return { success: true };
    },
    autoSync: false,
    onSyncSuccess: () => {
      showSnackbar('Data synced successfully', 'success');
      reload();
    },
    onSyncError: (error) => showSnackbar(typeof error === 'string' ? error : 'Sync failed', 'error'),
    componentName: 'SiteInspectionScreen',
  });

  // Data loading hook
  const {
    inspections,
    refreshing,
    reload,
    onRefresh,
  } = useInspectionData({
    supervisorId,
    projectId,
    selectedSiteId,
    onError: (msg) => showSnackbar(msg, 'error'),
    onSyncSuccess: (count) => showSnackbar(`${count} records synced successfully`, 'success'),
  });

  // Update pending count when inspections change
  React.useEffect(() => {
    const pending = inspections.filter(({ inspection }) => inspection.appSyncStatus === 'pending').length;
    setPendingCount(pending);
  }, [inspections, setPendingCount]);

  /**
   * Handle add inspection button
   * Validates site selection before opening dialog
   */
  const handleAdd = () => {
    if (selectedSiteId === 'all') {
      showSnackbar('Please select a specific site to create an inspection', 'warning');
      return;
    }

    setEditingInspection(null);
    setDialogVisible(true);
  };

  /**
   * Handle edit inspection
   * Opens dialog with pre-populated data
   */
  const handleEdit = (inspectionWithSite: InspectionWithSite) => {
    setEditingInspection(inspectionWithSite.inspection);
    setDialogVisible(true);
  };

  /**
   * Handle delete inspection
   * Shows confirmation dialog
   */
  const handleDelete = (inspection: SiteInspectionModel) => {
    setInspectionToDelete(inspection);
    setShowDeleteDialog(true);
  };

  /**
   * Confirm delete inspection
   * Performs database deletion
   */
  const confirmDelete = async () => {
    if (!inspectionToDelete) return;

    setShowDeleteDialog(false);
    setIsSaving(true);
    try {
      await database.write(async () => {
        await inspectionToDelete.markAsDeleted();
      });
      showSnackbar('Inspection deleted successfully', 'success');
      reload();
      setInspectionToDelete(null);
    } catch (error) {
      logger.error('Failed to delete inspection', error as Error, {
        component: 'SiteInspectionScreen',
        action: 'confirmDelete',
        inspectionId: inspectionToDelete?.id,
      });
      showSnackbar('Failed to delete inspection', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Handle save inspection (create or update)
   * Performs validation and database write
   */
  const handleSave = async (data: InspectionFormData) => {
    // Validate site selection
    if (!selectedSiteId || selectedSiteId === 'all') {
      setDialogVisible(false);
      showSnackbar('Please select a site', 'warning');
      return;
    }

    // Validate follow-up
    if (data.followUpRequired && !data.followUpDate) {
      setDialogVisible(false);
      showSnackbar('Please select a follow-up date', 'warning');
      return;
    }

    setIsSaving(true);
    try {
      const followUpTimestamp = data.followUpRequired && data.followUpDate
        ? new Date(data.followUpDate).getTime()
        : 0;

      await database.write(async () => {
        if (editingInspection) {
          // Update existing inspection
          await editingInspection.update((inspection) => {
            inspection.inspectionType = data.inspectionType;
            inspection.overallRating = data.overallRating;
            inspection.safetyFlagged = data.safetyFlagged;
            inspection.notes = data.notes;
            inspection.checklistData = JSON.stringify(data.checklistData);
            inspection.photos = JSON.stringify(data.photos);
            inspection.followUpDate = followUpTimestamp;
            inspection.followUpNotes = data.followUpRequired ? data.followUpNotes : '';
            inspection.appSyncStatus = 'pending';
          });
        } else {
          // Create new inspection
          const inspectionsCollection = database.collections.get<SiteInspectionModel>('site_inspections');
          await inspectionsCollection.create((inspection) => {
            inspection.siteId = selectedSiteId;
            inspection.inspectorId = supervisorId;
            inspection.inspectionDate = new Date().getTime();
            inspection.inspectionType = data.inspectionType;
            inspection.overallRating = data.overallRating;
            inspection.checklistData = JSON.stringify(data.checklistData);
            inspection.photos = JSON.stringify(data.photos);
            inspection.safetyFlagged = data.safetyFlagged;
            inspection.followUpDate = followUpTimestamp;
            inspection.followUpNotes = data.followUpRequired ? data.followUpNotes : '';
            inspection.notes = data.notes;
            inspection.appSyncStatus = 'pending';
          });
        }
      });

      showSnackbar(
        editingInspection ? 'Inspection updated successfully' : 'Inspection created successfully',
        'success'
      );
      setDialogVisible(false);
      setEditingInspection(null);
      reload();
    } catch (error) {
      logger.error('Failed to save inspection', error as Error, {
        component: 'SiteInspectionScreen',
        action: 'handleSave',
        inspectionType: data.inspectionType,
      });
      showSnackbar('Failed to save inspection', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Handle cancel form
   */
  const handleCancel = () => {
    setDialogVisible(false);
    setEditingInspection(null);
  };

  return (
    <View style={styles.container}>
      <SupervisorHeader
        title="Site Inspection"
        rightActions={
          <SyncButton
            syncStatus={syncStatus}
            isOnline={isOnline}
            pendingCount={pendingCount}
            onPress={manualSync}
            variant="icon"
            showPendingCount
          />
        }
      />

      {/* Offline Indicator Banner */}
      <OfflineIndicator
        isOnline={isOnline}
        pendingCount={pendingCount}
        onSync={manualSync}
        showWhenPending
      />

      {/* Site Selector */}
      <SiteSelector />

      {/* Inspection List */}
      <InspectionList
        inspections={inspections}
        refreshing={refreshing}
        onRefresh={onRefresh}
        onEdit={handleEdit}
        onDelete={handleDelete}
        emptyMessage="No inspections found. Tap + to create your first inspection."
      />

      {/* Create/Edit Form Dialog */}
      <InspectionForm
        visible={dialogVisible}
        editingInspection={editingInspection}
        selectedSiteId={selectedSiteId}
        onSave={handleSave}
        onCancel={handleCancel}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        visible={showDeleteDialog}
        title="Delete Inspection"
        message="Are you sure you want to delete this inspection? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => {
          setShowDeleteDialog(false);
          setInspectionToDelete(null);
        }}
        confirmText="Delete"
        cancelText="Cancel"
      />

      {/* FAB for adding new inspection */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={handleAdd}
        label="New Inspection"
      />

      {/* Loading Overlay */}
      <LoadingOverlay
        visible={isSaving}
        message={inspectionToDelete ? "Deleting inspection..." : "Saving inspection..."}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default SiteInspectionScreen;
