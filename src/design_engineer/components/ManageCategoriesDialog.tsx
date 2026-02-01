import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Portal, Dialog, Button, TextInput, Menu, IconButton, Chip } from 'react-native-paper';
import {
  DesignDocumentCategory,
  DOCUMENT_TYPES,
  DocumentType,
  getDocumentTypeLabel,
  getDocumentTypeColor,
} from '../types/DesignDocumentTypes';

interface ManageCategoriesDialogProps {
  visible: boolean;
  onDismiss: () => void;
  categories: DesignDocumentCategory[];
  onAddCategory: (name: string, documentType: DocumentType) => void;
  onDeleteCategory: (categoryId: string) => void;
}

const ManageCategoriesDialog: React.FC<ManageCategoriesDialogProps> = ({
  visible,
  onDismiss,
  categories,
  onAddCategory,
  onDeleteCategory,
}) => {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [selectedType, setSelectedType] = useState<DocumentType | ''>('');
  const [typeMenuVisible, setTypeMenuVisible] = useState(false);

  const filteredCategories = selectedType
    ? categories.filter((c) => c.documentType === selectedType)
    : categories;

  const handleAdd = () => {
    if (!newCategoryName.trim() || !selectedType) return;
    onAddCategory(newCategoryName.trim(), selectedType);
    setNewCategoryName('');
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={styles.dialog}>
        <Dialog.Title>Manage Categories</Dialog.Title>
        <Dialog.Content>
          {/* Type filter for viewing */}
          <Menu
            visible={typeMenuVisible}
            onDismiss={() => setTypeMenuVisible(false)}
            anchor={
              <Button
                mode="outlined"
                onPress={() => setTypeMenuVisible(true)}
                style={styles.typeButton}
              >
                {selectedType ? getDocumentTypeLabel(selectedType) : 'Select Document Type'}
              </Button>
            }
          >
            {DOCUMENT_TYPES.map((type) => (
              <Menu.Item
                key={type.value}
                onPress={() => {
                  setSelectedType(type.value);
                  setTypeMenuVisible(false);
                }}
                title={type.label}
              />
            ))}
          </Menu>

          {/* Category list */}
          <FlatList
            data={filteredCategories}
            keyExtractor={(item) => item.id}
            style={styles.categoryList}
            renderItem={({ item }) => (
              <View style={styles.categoryRow}>
                <View style={styles.categoryInfo}>
                  <Text style={styles.categoryName}>{item.name}</Text>
                  <Chip
                    mode="flat"
                    style={{ backgroundColor: getDocumentTypeColor(item.documentType) }}
                    textStyle={styles.chipText}
                  >
                    {getDocumentTypeLabel(item.documentType)}
                  </Chip>
                </View>
                {!item.isDefault && (
                  <IconButton
                    icon="delete"
                    size={20}
                    onPress={() => onDeleteCategory(item.id)}
                  />
                )}
                {item.isDefault && (
                  <Text style={styles.defaultBadge}>Default</Text>
                )}
              </View>
            )}
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                {selectedType ? 'No categories for this type' : 'Select a type to view categories'}
              </Text>
            }
          />

          {/* Add new category */}
          {selectedType !== '' && (
            <View style={styles.addRow}>
              <TextInput
                label="New Category Name"
                value={newCategoryName}
                onChangeText={setNewCategoryName}
                style={styles.addInput}
                mode="outlined"
                dense
              />
              <Button
                mode="contained"
                onPress={handleAdd}
                disabled={!newCategoryName.trim()}
                style={styles.addButton}
              >
                Add
              </Button>
            </View>
          )}
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss}>Close</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

const styles = StyleSheet.create({
  dialog: {
    maxHeight: '80%',
  },
  typeButton: {
    marginBottom: 12,
  },
  categoryList: {
    maxHeight: 250,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  categoryInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryName: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  chipText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  defaultBadge: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    marginRight: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 20,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  addInput: {
    flex: 1,
  },
  addButton: {
    marginTop: 6,
  },
});

export default ManageCategoriesDialog;
