import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';
import { usePhotoUpload } from '../../hooks/usePhotoUpload';
import { useSiteContext } from '../context/SiteContext';
import SiteSelector from '../components/SiteSelector';
import { useSnackbar } from '../../components/Snackbar';
import { ConfirmDialog } from '../../components/Dialog';
import { useHindranceData } from './hooks/useHindranceData';
import { useHindranceForm } from './hooks/useHindranceForm';
import { HindranceList } from './components/HindranceList';
import { HindranceForm } from './components/HindranceForm';
import { canAddHindrance } from './utils';
import { LoadingOverlay, SupervisorHeader, OfflineIndicator, HeaderSyncButton } from '../../components/common';
import { useOfflineSync } from '../../hooks/useOfflineSync';
import { SyncService } from '../../../services/sync/SyncService';
import { commonStyles } from '../../styles/common';

const HindranceReportScreen = () => {
  const { showSnackbar } = useSnackbar();
  const { selectedSiteId, supervisorId, projectId } = useSiteContext();

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
      loadHindrances();
    },
    // Removed onSyncError to prevent continuous popup when sync fails
    componentName: 'HindranceReportScreen',
  });

  // Photo upload hook
  const {
    photos,
    photoMenuVisible,
    setPhotoMenuVisible,
    handleTakePhoto,
    handleSelectPhotos: handleSelectPhoto,
    handleRemovePhoto,
    setPhotos,
  } = usePhotoUpload({
    maxPhotos: 10,
    quality: 0.8,
    onError: (error) => showSnackbar(error, 'error'),
  });

  // Data hook
  const {
    hindrances,
    siteItems,
    isLoading: hindrancesLoading,
    refreshing,
    loadHindrances,
    onRefresh,
  } = useHindranceData({
    supervisorId,
    projectId,
    selectedSiteId,
    onError: (message) => showSnackbar(message, 'error'),
  });

  // Form hook
  const {
    dialogVisible,
    closeDialog,
    showDeleteDialog,
    hindranceToDelete,
    title,
    setTitle,
    description,
    setDescription,
    priority,
    setPriority,
    status,
    setStatus,
    selectedItemId,
    setSelectedItemId,
    editingHindrance,
    isSaving,
    handleAdd,
    handleEdit,
    handleSave,
    handleDelete,
    confirmDelete,
    cancelDelete,
  } = useHindranceForm({
    supervisorId,
    selectedSiteId,
    onSuccess: (message) => showSnackbar(message, 'success'),
    onError: (message) => showSnackbar(message, 'error'),
    onLoadHindrances: loadHindrances,
    photos,
    setPhotos,
  });

  // Update pending count when hindrances change
  React.useEffect(() => {
    const pending = hindrances.filter(h => h.hindrance.appSyncStatus === 'pending').length;
    setPendingCount(pending);
  }, [hindrances, setPendingCount]);

  return (
    <View style={commonStyles.screen}>
      <SupervisorHeader
        title="Hindrance Reports"
        rightActions={
          <HeaderSyncButton
            syncStatus={syncStatus}
            isOnline={isOnline}
            pendingCount={pendingCount}
            onPress={manualSync}
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

      {/* Add Button */}
      <View style={styles.addButtonContainer}>
        <Button
          mode="contained"
          onPress={handleAdd}
          icon="plus"
          disabled={!canAddHindrance(selectedSiteId)}
        >
          Report Hindrance
        </Button>
      </View>

      {/* Hindrances List */}
      <HindranceList
        hindrances={hindrances}
        loading={hindrancesLoading}
        selectedSiteId={selectedSiteId}
        refreshing={refreshing}
        onRefresh={onRefresh}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Create/Edit Dialog */}
      <HindranceForm
        visible={dialogVisible}
        isEditing={!!editingHindrance}
        title={title}
        description={description}
        priority={priority}
        status={status}
        selectedItemId={selectedItemId}
        siteItems={siteItems}
        photos={photos}
        photoMenuVisible={photoMenuVisible}
        onTitleChange={setTitle}
        onDescriptionChange={setDescription}
        onPriorityChange={setPriority}
        onStatusChange={setStatus}
        onItemSelect={setSelectedItemId}
        onPhotoMenuToggle={setPhotoMenuVisible}
        onTakePhoto={handleTakePhoto}
        onSelectPhoto={handleSelectPhoto}
        onRemovePhoto={handleRemovePhoto}
        onSave={handleSave}
        onCancel={closeDialog}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        visible={showDeleteDialog}
        title="Delete Hindrance"
        message="Are you sure you want to delete this hindrance? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        destructive={true}
      />

      {/* Loading Overlay */}
      <LoadingOverlay
        visible={isSaving}
        message={hindranceToDelete ? "Deleting hindrance..." : "Saving hindrance..."}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  addButtonContainer: {
    padding: 16,
    paddingBottom: 8,
  },
});

export default HindranceReportScreen;
