import React from 'react';
import { View, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Text, Menu, IconButton } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { PhotoGalleryProps } from '../types';

/**
 * Memoized photo thumbnail component for performance
 */
const PhotoThumbnail = React.memo<{
  uri: string;
  index: number;
  onRemove: (index: number) => void;
}>(({ uri, index, onRemove }) => (
  <View style={styles.photoContainer}>
    <Image source={{ uri }} style={styles.photoThumbnail} resizeMode="cover" />
    <IconButton
      icon="close-circle"
      size={20}
      iconColor="#F44336"
      style={styles.removePhotoButton}
      onPress={() => onRemove(index)}
    />
  </View>
));

PhotoThumbnail.displayName = 'PhotoThumbnail';

/**
 * PhotoGallery component for displaying and managing photos
 *
 * Features:
 * - Displays photo grid with thumbnails
 * - Remove photo button on each thumbnail
 * - Add photo button with menu (camera/gallery)
 * - Photo count indicator
 * - Enforces maximum photo limit
 *
 * @param props - PhotoGallery props
 */
export const PhotoGallery: React.FC<PhotoGalleryProps> = ({
  photos,
  maxPhotos = 10,
  onTakePhoto,
  onSelectPhoto,
  onRemovePhoto,
  photoMenuVisible,
  setPhotoMenuVisible,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>
        Photos ({photos.length}/{maxPhotos})
      </Text>

      <View style={styles.photosGrid}>
        {photos.map((uri, index) => (
          <PhotoThumbnail
            key={`${uri}-${index}`}
            uri={uri}
            index={index}
            onRemove={onRemovePhoto}
          />
        ))}

        {photos.length < maxPhotos && (
          <Menu
            visible={photoMenuVisible}
            onDismiss={() => setPhotoMenuVisible(false)}
            anchor={
              <TouchableOpacity
                style={styles.addPhotoButton}
                onPress={() => setPhotoMenuVisible(true)}
              >
                <MaterialCommunityIcons name="camera-plus" size={40} color="#666" />
                <Text style={styles.addPhotoText}>Add Photo</Text>
              </TouchableOpacity>
            }
          >
            <Menu.Item
              onPress={onTakePhoto}
              leadingIcon="camera"
              title="Take Photo"
            />
            <Menu.Item
              onPress={onSelectPhoto}
              leadingIcon="image"
              title="Choose from Gallery"
            />
          </Menu>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  photoContainer: {
    position: 'relative',
    width: 100,
    height: 100,
  },
  photoThumbnail: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  removePhotoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: 'white',
    margin: 0,
  },
  addPhotoButton: {
    width: 100,
    height: 100,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fafafa',
  },
  addPhotoText: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
  },
});
