import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Image } from 'react-native';
import { Button, Text, IconButton } from 'react-native-paper';
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
import { PhotoPickerDialog } from '../../components/dialogs/PhotoPickerDialog';
import { COLORS } from '../../theme/colors';
import { commonStyles } from '../../styles/common';

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

  // Per-item photo upload hook (used inside the progress dialog)
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

  // Site-level photo upload hook (attached to the overall daily report)
  const {
    photos: sitePhotos,
    handleTakePhoto: handleTakeSitePhoto,
    handleSelectPhotos: handleChooseSitePhotos,
    handleRemovePhoto: removeSitePhoto,
    setPhotoMenuVisible: setSitePhotoMenuVisible,
    photoMenuVisible: sitePhotoMenuVisible,
  } = usePhotoUpload({
    maxPhotos: 10,
    quality: 0.8,
    onPhotoAdded: count => showSnackbar(`${count} site photo(s) added`, 'success'),
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
    sitePhotos,
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
    <View style={commonStyles.screen}>
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

      {/* Site Overview Photos */}
      <View style={styles.sitePhotosSection}>
        <View style={styles.sitePhotosHeader}>
          <Text style={styles.sitePhotosTitle}>
            Site Photos ({sitePhotos.length})
          </Text>
          <Button
            mode="outlined"
            icon="camera"
            compact
            onPress={() => setSitePhotoMenuVisible(true)}
            disabled={isSyncing}>
            Add
          </Button>
        </View>
        {sitePhotos.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.sitePhotoGallery}>
            {sitePhotos.map((uri, index) => (
              <View key={index} style={styles.sitePhotoContainer}>
                <Image source={{ uri }} style={styles.sitePhotoThumbnail} />
                <IconButton
                  icon="close-circle"
                  size={18}
                  iconColor={COLORS.ERROR}
                  style={styles.removeSitePhotoButton}
                  onPress={() => removeSitePhoto(index)}
                />
              </View>
            ))}
          </ScrollView>
        )}
        <PhotoPickerDialog
          visible={sitePhotoMenuVisible}
          onDismiss={() => setSitePhotoMenuVisible(false)}
          onTakePhoto={() => {
            setSitePhotoMenuVisible(false);
            handleTakeSitePhoto();
          }}
          onChooseFromGallery={() => {
            setSitePhotoMenuVisible(false);
            handleChooseSitePhotos();
          }}
        />
      </View>

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

      {/* Loading Overlay - Phase B: Updated with PDF background generation message */}
      <LoadingOverlay
        visible={isSyncing}
        message="Submitting progress reports..."
        subMessage="PDF will generate in background"
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
    items: database.collections.get('items').query(
      Q.on('sites', Q.and(
        Q.where('project_id', projectId),
        Q.where('supervisor_id', supervisorId)
      ))
    ),
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
  sitePhotosSection: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
  },
  sitePhotosHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sitePhotosTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.TEXT_SECONDARY,
  },
  sitePhotoGallery: {
    marginTop: 8,
  },
  sitePhotoContainer: {
    position: 'relative',
    marginRight: 10,
  },
  sitePhotoThumbnail: {
    width: 72,
    height: 72,
    borderRadius: 6,
    backgroundColor: COLORS.BORDER,
  },
  removeSitePhotoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    margin: 0,
    backgroundColor: 'white',
    borderRadius: 10,
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
