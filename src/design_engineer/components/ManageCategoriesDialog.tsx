import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Portal, Dialog, Button, TextInput, IconButton } from 'react-native-paper';
import { DesignDocumentCategory } from '../types/DesignDocumentTypes';

interface ManageCategoriesDialogProps {
  visible: boolean;
  onDismiss: () => void;
  categories: DesignDocumentCategory[];
  onAddCategory: (name: string) => void;
  onUpdateCategory: (categoryId: string, newName: string) => void;
  onDeleteCategory: (categoryId: string) => void;
}

const ManageCategoriesDialog: React.FC<ManageCategoriesDialogProps> = ({
  visible,
  onDismiss,
  categories,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
}) => {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const handleAdd = () => {
    if (!newCategoryName.trim()) return;
    onAddCategory(newCategoryName.trim());
    setNewCategoryName('');
  };

  const startEditing = (item: DesignDocumentCategory) => {
    setEditingId(item.id);
    setEditingName(item.name);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingName('');
  };

  const saveEditing = () => {
    if (!editingId || !editingName.trim()) return;
    onUpdateCategory(editingId, editingName.trim());
    setEditingId(null);
    setEditingName('');
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={styles.dialog}>
        <Dialog.Title>Manage Categories</Dialog.Title>
        <Dialog.Content>
          {/* Category list */}
          <FlatList
            data={categories}
            keyExtractor={(item) => item.id}
            style={styles.categoryList}
            renderItem={({ item }) => (
              <View style={styles.categoryRow}>
                {editingId === item.id ? (
                  <View style={styles.editRow}>
                    <TextInput
                      value={editingName}
                      onChangeText={setEditingName}
                      style={styles.editInput}
                      mode="outlined"
                      dense
                      autoFocus
                    />
                    <IconButton
                      icon="check"
                      size={20}
                      iconColor="#4CAF50"
                      onPress={saveEditing}
                      disabled={!editingName.trim()}
                    />
                    <IconButton
                      icon="close"
                      size={20}
                      iconColor="#999"
                      onPress={cancelEditing}
                    />
                  </View>
                ) : (
                  <>
                    <Text style={styles.categoryName}>{item.name}</Text>
                    <View style={styles.actionButtons}>
                      <IconButton
                        icon="pencil"
                        size={20}
                        onPress={() => startEditing(item)}
                      />
                      <IconButton
                        icon="delete"
                        size={20}
                        onPress={() => onDeleteCategory(item.id)}
                      />
                    </View>
                  </>
                )}
              </View>
            )}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No categories yet</Text>
            }
          />

          {/* Add new category */}
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
    maxHeight: '90%',
  },
  categoryList: {
    maxHeight: 400,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  categoryName: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  editInput: {
    flex: 1,
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
