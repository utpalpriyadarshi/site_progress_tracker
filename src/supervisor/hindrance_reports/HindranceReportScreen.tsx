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
import { LoadingOverlay } from '../../components/common/LoadingOverlay';

const HindranceReportScreen = () => {
  const { showSnackbar } = useSnackbar();
  const { selectedSiteId, supervisorId, projectId } = useSiteContext();

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

  return (
    <View style={styles.container}>
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
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  addButtonContainer: {
    padding: 16,
    paddingBottom: 8,
  },
});

export default HindranceReportScreen;
