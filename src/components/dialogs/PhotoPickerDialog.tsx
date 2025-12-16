/**
 * PhotoPickerDialog Component
 *
 * Reusable dialog for photo selection (Camera vs Gallery)
 * Used across all screens that support photo uploads
 *
 * Features:
 * - Camera option with icon
 * - Gallery option with icon
 * - Consistent styling
 * - Portal-based rendering
 *
 * @example
 * ```tsx
 * <PhotoPickerDialog
 *   visible={photoMenuVisible}
 *   onDismiss={() => setPhotoMenuVisible(false)}
 *   onTakePhoto={() => {
 *     setPhotoMenuVisible(false);
 *     handleTakePhoto();
 *   }}
 *   onChooseFromGallery={() => {
 *     setPhotoMenuVisible(false);
 *     handleChooseFromGallery();
 *   }}
 * />
 * ```
 *
 * @version 1.1 - Phase 2 Bug Fix (Changed from Menu to Dialog)
 */

import React from 'react';
import { StyleSheet } from 'react-native';
import { Portal, Dialog, List } from 'react-native-paper';

// ==================== Types ====================

export interface PhotoPickerDialogProps {
  /** Dialog visibility */
  visible: boolean;

  /** Callback when dialog should close */
  onDismiss: () => void;

  /** Callback when "Take Photo" is selected */
  onTakePhoto: () => void;

  /** Callback when "Choose from Gallery" is selected */
  onChooseFromGallery: () => void;

  /** Custom text for camera option (default: "Take Photo") */
  cameraText?: string;

  /** Custom text for gallery option (default: "Choose from Gallery") */
  galleryText?: string;
}

// ==================== Component ====================

/**
 * PhotoPickerDialog Component
 *
 * Portal-based dialog for selecting photo source
 */
export const PhotoPickerDialog: React.FC<PhotoPickerDialogProps> = ({
  visible,
  onDismiss,
  onTakePhoto,
  onChooseFromGallery,
  cameraText = 'Take Photo',
  galleryText = 'Choose from Gallery',
}) => {
  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={styles.dialog}>
        <Dialog.Title>Add Photo</Dialog.Title>
        <Dialog.Content>
          <List.Item
            title={cameraText}
            left={props => <List.Icon {...props} icon="camera" />}
            onPress={onTakePhoto}
            style={styles.listItem}
          />
          <List.Item
            title={galleryText}
            left={props => <List.Icon {...props} icon="image" />}
            onPress={onChooseFromGallery}
            style={styles.listItem}
          />
        </Dialog.Content>
      </Dialog>
    </Portal>
  );
};

const styles = StyleSheet.create({
  dialog: {
    maxWidth: 400,
    alignSelf: 'center',
  },
  listItem: {
    paddingVertical: 0,
  },
});
