import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';
import NetInfo from '@react-native-community/netinfo';
import { database } from '../../../models/database';
import { withObservables } from '@nozbe/watermelondb/react';
import { Q } from '@nozbe/watermelondb';
import ItemModel from '../../../models/ItemModel';
import SiteModel from '../../../models/SiteModel';
import { useSiteContext } from '../context/SiteContext';
import SiteSelector from '../components/SiteSelector';
import { useSnackbar } from '../../components/Snackbar';
import { ConfirmDialog } from '../../components/Dialog';
import { usePhotoUpload } from '../../hooks/usePhotoUpload';
import { useReportData } from './hooks/useReportData';
import { useReportForm } from './hooks/useReportForm';
import { useReportSync } from './hooks/useReportSync';
import { ReportSyncStatus } from './components/ReportSyncStatus';
import { ItemsList } from './components/ItemsList';
import { ProgressReportForm } from './components/ProgressReportForm';
import { LoadingOverlay, SupervisorHeader } from '../../components/common';

interface DailyReportsScreenComponentProps {
  sites: SiteModel[];
  items: ItemModel[];
}

/**
 * DailyReportsScreen Component
 *
 * Main screen for daily progress reporting
 * Allows supervisors to update item progress with photos and notes
 * Supports offline mode and report submission
 */
const DailyReportsScreenComponent: React.FC<DailyReportsScreenComponentProps> = ({
  sites,
  items,
}) => {
  const { selectedSiteId, supervisorId } = useSiteContext();
  const { showSnackbar } = useSnackbar();
  const [isOnline, setIsOnline] = useState(true);

  // Monitor network status
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected ?? false);
    });
    return () => unsubscribe();
  }, []);

  // Photo upload hook (shared)
  const {
    photos,
    photoMenuVisible,
    setPhotoMenuVisible,
    handleTakePhoto,
    handleSelectPhotos: handleChooseFromGallery,
    handleRemovePhoto: removePhoto,
    setPhotos,
  } = usePhotoUpload({
    maxPhotos: 10,
    quality: 0.8,
    onPhotoAdded: count => showSnackbar(`${count} photo(s) added`, 'success'),
    onError: error => showSnackbar(error, 'error'),
  });

  // Data management hook
  const {
    itemsWithSites,
    itemPhotoCounts,
    refreshing,
    loadPhotoCounts,
    onRefresh,
  } = useReportData({
    supervisorId,
    selectedSiteId,
    sites,
    items,
  });

  // Form state hook
  const {
    dialogVisible,
    closeDialog,
    selectedItem,
    quantityInput,
    setQuantityInput,
    notesInput,
    setNotesInput,
    showExceedsWarning,
    setShowExceedsWarning,
    pendingQuantity,
    openUpdateDialog,
    incrementQuantity,
    handleUpdateProgress,
    saveProgress,
  } = useReportForm({
    supervisorId,
    onSuccess: message => showSnackbar(message, 'success'),
    onError: message => showSnackbar(message, 'error'),
    onLoadPhotoCounts: loadPhotoCounts,
    photos,
    setPhotos,
  });

  // Report sync hook
  const {
    isSyncing,
    showOfflineConfirm,
    setShowOfflineConfirm,
    handleSubmitAllReports,
    submitReports,
  } = useReportSync({
    supervisorId,
    sites,
    items,
    isOnline,
    onSuccess: message => showSnackbar(message, 'success'),
    onError: message => showSnackbar(message, 'error'),
    onWarning: message => showSnackbar(message, 'warning'),
  });

  // Filter sites based on selection
  const displayedSites =
    selectedSiteId === 'all'
      ? sites
      : sites.filter(site => site.id === selectedSiteId);

  return (
    <View style={styles.container}>
      <SupervisorHeader
        title="Daily Work"
        rightActions={
          <ReportSyncStatus isOnline={isOnline} isSyncing={isSyncing} />
        }
      />

      {/* Site Selector */}
      <View style={styles.selectorContainer}>
        <SiteSelector />
      </View>

      {/* Items List */}
      <ItemsList
        sites={displayedSites}
        itemsWithSites={itemsWithSites}
        itemPhotoCounts={itemPhotoCounts}
        refreshing={refreshing}
        onRefresh={onRefresh}
        onUpdateItem={openUpdateDialog}
      />

      {/* Submit Button */}
      {items.length > 0 && (
        <View style={styles.footer}>
          <Button
            mode="contained"
            icon="upload"
            onPress={handleSubmitAllReports}
            loading={isSyncing}
            disabled={isSyncing}
            style={styles.submitButton}>
            Submit Progress Reports
          </Button>
        </View>
      )}

      {/* Update Progress Dialog */}
      <ProgressReportForm
        visible={dialogVisible}
        selectedItem={selectedItem}
        quantityInput={quantityInput}
        notesInput={notesInput}
        photos={photos}
        photoMenuVisible={photoMenuVisible}
        onQuantityChange={setQuantityInput}
        onNotesChange={setNotesInput}
        onIncrementQuantity={incrementQuantity}
        onPhotoMenuToggle={setPhotoMenuVisible}
        onTakePhoto={handleTakePhoto}
        onChooseFromGallery={handleChooseFromGallery}
        onRemovePhoto={removePhoto}
        onSave={handleUpdateProgress}
        onCancel={closeDialog}
      />

      {/* Warning: Quantity Exceeds Planned */}
      <ConfirmDialog
        visible={showExceedsWarning}
        title="Warning"
        message="Completed quantity exceeds planned quantity. Continue?"
        confirmText="Continue"
        cancelText="Cancel"
        onConfirm={() => {
          setShowExceedsWarning(false);
          saveProgress(pendingQuantity);
        }}
        onCancel={() => {
          setShowExceedsWarning(false);
        }}
        destructive={false}
      />

      {/* Offline Confirmation */}
      <ConfirmDialog
        visible={showOfflineConfirm}
        title="Offline Mode"
        message="Reports will be saved locally and synced when connection is restored."
        confirmText="Save Offline"
        cancelText="Cancel"
        onConfirm={() => {
          setShowOfflineConfirm(false);
          submitReports();
        }}
        onCancel={() => {
          setShowOfflineConfirm(false);
        }}
        destructive={false}
      />

      {/* Loading Overlay */}
      <LoadingOverlay
        visible={isSyncing}
        message="Submitting progress reports..."
      />
    </View>
  );
};

// WatermelonDB observable enhancement
const enhance = withObservables(
  ['supervisorId', 'projectId'],
  ({ supervisorId, projectId }: { supervisorId: string; projectId: string }) => ({
    sites: database.collections
      .get('sites')
      .query(Q.where('supervisor_id', supervisorId)),
    items: database.collections.get('items').query(Q.on('sites', 'project_id', projectId)),
  })
);

// @ts-expect-error - WatermelonDB withObservables HOC has typing limitations
const EnhancedDailyReportsScreen = enhance(DailyReportsScreenComponent);

// Wrapper component that provides context
const DailyReportsScreen = () => {
  const { supervisorId, projectId } = useSiteContext();
  return <EnhancedDailyReportsScreen supervisorId={supervisorId} projectId={projectId} />;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    elevation: 2,
  },
  selectorContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingBottom: 8,
    elevation: 1,
  },
  footer: {
    padding: 16,
    backgroundColor: 'white',
    elevation: 4,
  },
  submitButton: {
    paddingVertical: 6,
  },
});

export default DailyReportsScreen;
