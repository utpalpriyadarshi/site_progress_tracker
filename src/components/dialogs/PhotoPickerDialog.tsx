/**
 * PhotoPickerDialog Component
 *
 * Reusable menu for photo selection (Camera vs Gallery)
 * Used across all screens that support photo uploads
 *
 * Features:
 * - Camera option with icon
 * - Gallery option with icon
 * - Consistent styling
 * - Anchor-based positioning
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
 * @version 1.0 - Phase 2, Task 2.2.3
 */

import React from 'react';
import { Menu } from 'react-native-paper';

// ==================== Types ====================

export interface PhotoPickerDialogProps {
  /** Menu visibility */
  visible: boolean;

  /** Callback when menu should close */
  onDismiss: () => void;

  /** Callback when "Take Photo" is selected */
  onTakePhoto: () => void;

  /** Callback when "Choose from Gallery" is selected */
  onChooseFromGallery: () => void;

  /** Anchor element for positioning (optional) */
  anchor?: React.ReactNode;

  /** Custom text for camera option (default: "Take Photo") */
  cameraText?: string;

  /** Custom text for gallery option (default: "Choose from Gallery") */
  galleryText?: string;
}

// ==================== Component ====================

/**
 * PhotoPickerDialog Component
 *
 * Note: This is a Menu component, not a Dialog, but named "Dialog" for
 * consistency with other picker components in the app.
 */
export const PhotoPickerDialog: React.FC<PhotoPickerDialogProps> = ({
  visible,
  onDismiss,
  onTakePhoto,
  onChooseFromGallery,
  anchor,
  cameraText = 'Take Photo',
  galleryText = 'Choose from Gallery',
}) => {
  return (
    <Menu
      visible={visible}
      onDismiss={onDismiss}
      anchor={anchor}
      anchorPosition="bottom"
    >
      <Menu.Item
        leadingIcon="camera"
        onPress={onTakePhoto}
        title={cameraText}
      />
      <Menu.Item
        leadingIcon="image"
        onPress={onChooseFromGallery}
        title={galleryText}
      />
    </Menu>
  );
};
