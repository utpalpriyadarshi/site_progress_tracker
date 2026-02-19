import React from 'react';
import { View, StyleSheet, ScrollView, Image } from 'react-native';
import {
  Portal,
  Dialog,
  Paragraph,
  TextInput,
  IconButton,
  Button,
  Text,
} from 'react-native-paper';
import ItemModel from '../../../../models/ItemModel';
import { PhotoPickerDialog } from '../../../components/dialogs/PhotoPickerDialog';
import { COLORS } from '../../../theme/colors';

interface ProgressReportFormProps {
  visible: boolean;
  selectedItem: ItemModel | null;
  quantityInput: string;
  notesInput: string;
  photos: string[];
  photoMenuVisible: boolean;
  onQuantityChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  onIncrementQuantity: (amount: number) => void;
  onPhotoMenuToggle: (visible: boolean) => void;
  onTakePhoto: () => void;
  onChooseFromGallery: () => void;
  onRemovePhoto: (index: number) => void;
  onSave: () => void;
  onCancel: () => void;
}

/**
 * ProgressReportForm Component
 *
 * Dialog form for updating item progress
 * Includes quantity input, notes, and photo upload
 */
export const ProgressReportForm: React.FC<ProgressReportFormProps> = ({
  visible,
  selectedItem,
  quantityInput,
  notesInput,
  photos,
  photoMenuVisible,
  onQuantityChange,
  onNotesChange,
  onIncrementQuantity,
  onPhotoMenuToggle,
  onTakePhoto,
  onChooseFromGallery,
  onRemovePhoto,
  onSave,
  onCancel,
}) => {
  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onCancel}>
        <Dialog.Title>Update Progress</Dialog.Title>
        <Dialog.Content>
          {selectedItem && (
            <>
              {/* Item Information */}
              <Paragraph style={styles.dialogItemName}>
                {selectedItem.name}
              </Paragraph>
              <Paragraph style={styles.dialogPlanned}>
                Planned: {selectedItem.plannedQuantity}{' '}
                {selectedItem.unitOfMeasurement}
              </Paragraph>

              {/* Quantity Input with +/- buttons */}
              <View style={styles.quantityInputContainer}>
                <IconButton
                  icon="minus"
                  mode="contained"
                  onPress={() => onIncrementQuantity(-1)}
                  style={styles.quantityButton}
                />
                <TextInput
                  label="Completed Quantity"
                  value={quantityInput}
                  onChangeText={onQuantityChange}
                  keyboardType="numeric"
                  mode="outlined"
                  style={styles.quantityInput}
                />
                <IconButton
                  icon="plus"
                  mode="contained"
                  onPress={() => onIncrementQuantity(1)}
                  style={styles.quantityButton}
                />
              </View>

              {/* Notes Input */}
              <TextInput
                label="Notes (Optional)"
                value={notesInput}
                onChangeText={onNotesChange}
                mode="outlined"
                multiline
                numberOfLines={3}
                style={styles.notesInput}
              />

              {/* Photo Section */}
              <View style={styles.photoSection}>
                <Text style={styles.photoSectionTitle}>
                  📸 Photos ({photos.length})
                </Text>

                <Button
                  mode="outlined"
                  icon="camera"
                  onPress={() => onPhotoMenuToggle(true)}
                  style={styles.addPhotoButton}>
                  Add Photos
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
                    onChooseFromGallery();
                  }}
                />

                {/* Photo Gallery */}
                {photos.length > 0 && (
                  <ScrollView
                    horizontal
                    style={styles.photoGallery}
                    showsHorizontalScrollIndicator={false}>
                    {photos.map((photoUri, index) => (
                      <View key={index} style={styles.photoContainer}>
                        <Image
                          source={{ uri: photoUri }}
                          style={styles.photoThumbnail}
                        />
                        <IconButton
                          icon="close-circle"
                          size={20}
                          iconColor={COLORS.ERROR}
                          style={styles.removePhotoButton}
                          onPress={() => onRemovePhoto(index)}
                        />
                      </View>
                    ))}
                  </ScrollView>
                )}
              </View>
            </>
          )}
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onCancel}>Cancel</Button>
          <Button onPress={onSave}>Save</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

const styles = StyleSheet.create({
  dialogItemName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  dialogPlanned: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  quantityInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  quantityButton: {
    margin: 0,
  },
  quantityInput: {
    flex: 1,
    marginHorizontal: 8,
  },
  notesInput: {
    marginTop: 8,
  },
  photoSection: {
    marginTop: 16,
  },
  photoSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  addPhotoButton: {
    marginTop: 8,
  },
  photoGallery: {
    marginTop: 12,
  },
  photoContainer: {
    position: 'relative',
    marginRight: 12,
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
    margin: 0,
    backgroundColor: 'white',
    borderRadius: 12,
  },
});
