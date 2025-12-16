import { useState, useCallback } from 'react';
import { Platform, PermissionsAndroid } from 'react-native';
import {
  launchCamera,
  launchImageLibrary,
  ImagePickerResponse,
  Asset,
} from 'react-native-image-picker';

/**
 * Configuration options for the usePhotoUpload hook
 */
export interface UsePhotoUploadOptions {
  /** Maximum number of photos allowed (default: 10) */
  maxPhotos?: number;
  /** Image quality from 0-1 (default: 0.8) */
  quality?: number;
  /** Initial photos for edit mode */
  initialPhotos?: string[];
  /** Callback when photos are added successfully */
  onPhotoAdded?: (count: number) => void;
  /** Callback when a photo is removed */
  onPhotoRemoved?: (index: number) => void;
  /** Callback when an error occurs */
  onError?: (message: string) => void;
}

/**
 * Return type for the usePhotoUpload hook
 */
export interface UsePhotoUploadReturn {
  /** Array of photo URIs */
  photos: string[];
  /** Photo menu visibility state */
  photoMenuVisible: boolean;
  /** Set photo menu visibility */
  setPhotoMenuVisible: (visible: boolean) => void;
  /** Launch camera to take a photo */
  handleTakePhoto: () => Promise<void>;
  /** Launch gallery to select photos */
  handleSelectPhotos: () => Promise<void>;
  /** Remove photo by index */
  handleRemovePhoto: (index: number) => void;
  /** Clear all photos */
  clearPhotos: () => void;
  /** Set photos directly (for edit mode) */
  setPhotos: (photos: string[]) => void;
  /** Whether more photos can be added */
  canAddMore: boolean;
}

/**
 * Custom hook for photo upload functionality with camera and gallery support
 *
 * Features:
 * - Camera capture with permission handling (Android/iOS)
 * - Gallery selection with multi-select support
 * - Photo removal and limit enforcement
 * - Error handling with callbacks
 *
 * @param options - Configuration options
 * @param options.maxPhotos - Maximum number of photos (default: 10)
 * @param options.quality - Image quality 0-1 (default: 0.8)
 * @param options.initialPhotos - Initial photos for edit mode
 * @param options.onPhotoAdded - Callback when photos added
 * @param options.onPhotoRemoved - Callback when photo removed
 * @param options.onError - Callback on error
 *
 * @returns Photo state and handler functions
 *
 * @example
 * ```tsx
 * const {
 *   photos,
 *   handleTakePhoto,
 *   handleSelectPhotos,
 *   handleRemovePhoto,
 *   photoMenuVisible,
 *   setPhotoMenuVisible
 * } = usePhotoUpload({
 *   maxPhotos: 5,
 *   quality: 0.8,
 *   onPhotoAdded: (count) => showSnackbar(`${count} photo(s) added`, 'success'),
 *   onError: (error) => showSnackbar(error, 'error')
 * });
 * ```
 */
export function usePhotoUpload(
  options: UsePhotoUploadOptions = {}
): UsePhotoUploadReturn {
  const {
    maxPhotos = 10,
    quality = 0.8,
    initialPhotos = [],
    onPhotoAdded,
    onPhotoRemoved,
    onError,
  } = options;

  const [photos, setPhotos] = useState<string[]>(initialPhotos);
  const [photoMenuVisible, setPhotoMenuVisible] = useState(false);

  /**
   * Handle camera launch and photo capture
   */
  const handleTakePhoto = useCallback(async () => {
    setPhotoMenuVisible(false);

    // Check if photo limit reached
    if (photos.length >= maxPhotos) {
      onError?.(`Maximum ${maxPhotos} photos allowed`);
      return;
    }

    // Request camera permission (Android only)
    const requestCameraPermission = async (): Promise<boolean> => {
      if (Platform.OS === 'android') {
        try {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.CAMERA,
            {
              title: 'Camera Permission',
              message: 'App needs camera permission to take photos',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            }
          );
          return granted === PermissionsAndroid.RESULTS.GRANTED;
        } catch (err) {
          onError?.('Camera permission request failed');
          return false;
        }
      }
      // iOS handles permissions automatically through Info.plist
      return true;
    };

    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      onError?.('Camera permission is required to take photos');
      return;
    }

    const result: ImagePickerResponse = await launchCamera({
      mediaType: 'photo',
      quality: quality as 0 | 0.1 | 0.2 | 0.3 | 0.4 | 0.5 | 0.6 | 0.7 | 0.8 | 0.9 | 1,
      saveToPhotos: true,
    });

    if (result.didCancel) return;

    if (result.errorCode) {
      onError?.(result.errorMessage || 'Failed to take photo');
      return;
    }

    if (result.assets && result.assets.length > 0) {
      const photoUri = result.assets[0].uri;
      if (photoUri) {
        setPhotos(prev => {
          const newPhotos = [...prev, photoUri];
          onPhotoAdded?.(1);
          return newPhotos;
        });
      }
    }
  }, [photos.length, maxPhotos, quality, onError, onPhotoAdded]);

  /**
   * Handle gallery selection with multi-select
   */
  const handleSelectPhotos = useCallback(async () => {
    setPhotoMenuVisible(false);

    // Calculate how many more photos can be added
    const remainingSlots = maxPhotos - photos.length;
    if (remainingSlots <= 0) {
      onError?.(`Maximum ${maxPhotos} photos allowed`);
      return;
    }

    const result: ImagePickerResponse = await launchImageLibrary({
      mediaType: 'photo',
      quality: quality as 0 | 0.1 | 0.2 | 0.3 | 0.4 | 0.5 | 0.6 | 0.7 | 0.8 | 0.9 | 1,
      selectionLimit: Math.min(5, remainingSlots), // Allow up to 5 at a time, but respect limit
    });

    if (result.didCancel) return;

    if (result.errorCode) {
      onError?.(result.errorMessage || 'Failed to select photo');
      return;
    }

    if (result.assets && result.assets.length > 0) {
      const newPhotoUris = result.assets
        .map((asset: Asset) => asset.uri)
        .filter((uri): uri is string => !!uri);

      if (newPhotoUris.length > 0) {
        setPhotos(prev => {
          const combined = [...prev, ...newPhotoUris];
          // Enforce max limit (should not happen, but safety check)
          const limited = combined.slice(0, maxPhotos);
          onPhotoAdded?.(newPhotoUris.length);
          return limited;
        });
      }
    }
  }, [photos.length, maxPhotos, quality, onError, onPhotoAdded]);

  /**
   * Remove photo by index
   */
  const handleRemovePhoto = useCallback(
    (index: number) => {
      setPhotos(prev => {
        if (index < 0 || index >= prev.length) return prev;
        const newPhotos = [...prev];
        newPhotos.splice(index, 1);
        onPhotoRemoved?.(index);
        return newPhotos;
      });
    },
    [onPhotoRemoved]
  );

  /**
   * Clear all photos
   */
  const clearPhotos = useCallback(() => {
    setPhotos([]);
  }, []);

  return {
    photos,
    photoMenuVisible,
    setPhotoMenuVisible,
    handleTakePhoto,
    handleSelectPhotos,
    handleRemovePhoto,
    clearPhotos,
    setPhotos,
    canAddMore: photos.length < maxPhotos,
  };
}
