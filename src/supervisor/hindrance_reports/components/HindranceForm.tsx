import React from 'react';
import { View, StyleSheet, ScrollView, Image } from 'react-native';
import {
  Portal,
  Dialog,
  TextInput,
  Text,
  SegmentedButtons,
  Chip,
  Button,
  IconButton,
} from 'react-native-paper';
import ItemModel from '../../../../models/ItemModel';
import { HindrancePriority, HindranceStatus } from '../types';
import { PhotoPickerDialog } from '../../../components/dialogs/PhotoPickerDialog';
import { COLORS } from '../../../theme/colors';

interface HindranceFormProps {
  visible: boolean;
  isEditing: boolean;
  title: string;
  description: string;
  priority: HindrancePriority;
  status: HindranceStatus;
  selectedItemId: string;
  siteItems: ItemModel[];
  photos: string[];
  photoMenuVisible: boolean;
  onTitleChange: (text: string) => void;
  onDescriptionChange: (text: string) => void;
  onPriorityChange: (priority: HindrancePriority) => void;
  onStatusChange: (status: HindranceStatus) => void;
  onItemSelect: (itemId: string) => void;
  onPhotoMenuToggle: (visible: boolean) => void;
  onTakePhoto: () => void;
  onSelectPhoto: () => void;
  onRemovePhoto: (index: number) => void;
  onSave: () => void;
  onCancel: () => void;
}

// Memoized photo thumbnail component for performance
const PhotoThumbnail = React.memo(({ uri, index, onRemove }: { uri: string; index: number; onRemove: (index: number) => void }) => (
  <View style={styles.photoContainer}>
    <Image source={{ uri }} style={styles.photoThumbnail} resizeMode="cover" />
    <IconButton
      icon="close-circle"
      size={20}
      iconColor={COLORS.ERROR}
      style={styles.removePhotoButton}
      onPress={() => onRemove(index)}
    />
  </View>
));

export const HindranceForm: React.FC<HindranceFormProps> = ({
  visible,
  isEditing,
  title,
  description,
  priority,
  status,
  selectedItemId,
  siteItems,
  photos,
  photoMenuVisible,
  onTitleChange,
  onDescriptionChange,
  onPriorityChange,
  onStatusChange,
  onItemSelect,
  onPhotoMenuToggle,
  onTakePhoto,
  onSelectPhoto,
  onRemovePhoto,
  onSave,
  onCancel,
}) => {
  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onCancel}>
        <Dialog.Title>
          {isEditing ? 'Edit Hindrance' : 'Report Hindrance'}
        </Dialog.Title>
        <Dialog.ScrollArea>
          <ScrollView>
            <View style={styles.dialogContent}>
              <TextInput
                label="Title *"
                value={title}
                onChangeText={onTitleChange}
                mode="outlined"
                style={styles.input}
              />

              <TextInput
                label="Description"
                value={description}
                onChangeText={onDescriptionChange}
                mode="outlined"
                multiline
                numberOfLines={4}
                style={styles.input}
              />

              <Text style={styles.label}>Priority</Text>
              <SegmentedButtons
                value={priority}
                onValueChange={(value) => onPriorityChange(value as HindrancePriority)}
                buttons={[
                  { value: 'low', label: 'Low' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'high', label: 'High' },
                ]}
                style={styles.input}
              />

              <Text style={styles.label}>Status</Text>
              <SegmentedButtons
                value={status}
                onValueChange={(value) => onStatusChange(value as HindranceStatus)}
                buttons={[
                  { value: 'open', label: 'Open' },
                  { value: 'in_progress', label: 'In Progress' },
                  { value: 'resolved', label: 'Resolved' },
                  { value: 'closed', label: 'Closed' },
                ]}
                style={styles.input}
              />

              <Text style={styles.label}>Related Item (Optional)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.itemChipsContainer}>
                  <Chip
                    selected={selectedItemId === ''}
                    onPress={() => onItemSelect('')}
                    style={styles.itemChip}
                  >
                    None
                  </Chip>
                  {siteItems.map((item) => (
                    <Chip
                      key={item.id}
                      selected={selectedItemId === item.id}
                      onPress={() => onItemSelect(item.id)}
                      style={styles.itemChip}
                    >
                      {item.name}
                    </Chip>
                  ))}
                </View>
              </ScrollView>

              {/* Photo Picker */}
              <Text style={styles.label}>Photos (Optional)</Text>
              <Button
                mode="outlined"
                icon="camera"
                onPress={() => onPhotoMenuToggle(true)}
                style={styles.input}
              >
                Add Photos ({photos.length})
              </Button>

              <PhotoPickerDialog
                visible={photoMenuVisible}
                onDismiss={() => onPhotoMenuToggle(false)}
                onTakePhoto={() => {
                  onPhotoMenuToggle(false);
                  onTakePhoto();
                }}
                onChooseFromGallery={() => {
                  onPhotoMenuToggle(false);
                  onSelectPhoto();
                }}
              />

              {/* Photo Gallery */}
              {photos.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoGallery}>
                  {photos.map((photoUri, index) => (
                    <PhotoThumbnail
                      key={`${photoUri}-${index}`}
                      uri={photoUri}
                      index={index}
                      onRemove={onRemovePhoto}
                    />
                  ))}
                </ScrollView>
              )}

              <Text style={styles.helperText}>
                * Required fields
              </Text>
            </View>
          </ScrollView>
        </Dialog.ScrollArea>
        <Dialog.Actions>
          <Button onPress={onCancel}>Cancel</Button>
          <Button onPress={onSave}>
            {isEditing ? 'Update' : 'Create'}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

const styles = StyleSheet.create({
  dialogContent: {
    padding: 16,
  },
  input: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
  },
  itemChipsContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 8,
  },
  itemChip: {
    marginRight: 8,
  },
  helperText: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
    fontStyle: 'italic',
  },
  photoGallery: {
    marginBottom: 16,
  },
  photoContainer: {
    position: 'relative',
    marginRight: 12,
  },
  photoThumbnail: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: 'white',
    margin: 0,
  },
});
