import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Portal, Dialog, Button, TextInput, IconButton } from 'react-native-paper';
import { DesignDocumentCategory, TOP_LEVEL_CATEGORY_TYPE, getCategorySlug } from '../types/DesignDocumentTypes';
import { COLORS } from '../../theme/colors';

interface ManageCategoriesDialogProps {
  visible: boolean;
  onDismiss: () => void;
  allCategories: DesignDocumentCategory[];
  onAddCategory: (name: string) => void;
  onAddSubCategory: (name: string, parentSlug: string) => void;
  onUpdateCategory: (categoryId: string, newName: string) => void;
  onDeleteCategory: (categoryId: string) => void;
}

const ManageCategoriesDialog: React.FC<ManageCategoriesDialogProps> = ({
  visible,
  onDismiss,
  allCategories,
  onAddCategory,
  onAddSubCategory,
  onUpdateCategory,
  onDeleteCategory,
}) => {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);
  const [newSubCategoryName, setNewSubCategoryName] = useState('');

  const topLevelCategories = allCategories.filter((c) => c.documentType === TOP_LEVEL_CATEGORY_TYPE);

  const getSubCategories = (parentCategory: DesignDocumentCategory): DesignDocumentCategory[] => {
    const slug = getCategorySlug(parentCategory.name);
    return allCategories.filter((c) => c.documentType === slug);
  };

  const handleAdd = () => {
    if (!newCategoryName.trim()) return;
    onAddCategory(newCategoryName.trim());
    setNewCategoryName('');
  };

  const handleAddSub = (parentCategory: DesignDocumentCategory) => {
    if (!newSubCategoryName.trim()) return;
    const slug = getCategorySlug(parentCategory.name);
    onAddSubCategory(newSubCategoryName.trim(), slug as string);
    setNewSubCategoryName('');
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

  const toggleExpand = (categoryId: string) => {
    setExpandedCategoryId(expandedCategoryId === categoryId ? null : categoryId);
    setNewSubCategoryName('');
  };

  const renderEditableRow = (item: DesignDocumentCategory, indented: boolean) => {
    if (editingId === item.id) {
      return (
        <View style={[styles.categoryRow, indented && styles.subCategoryRow]}>
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
              iconColor={COLORS.SUCCESS}
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
        </View>
      );
    }

    return (
      <View style={[styles.categoryRow, indented && styles.subCategoryRow]}>
        <Text style={[styles.categoryName, indented && styles.subCategoryName]}>
          {indented ? '  ' : ''}{item.name}
        </Text>
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
      </View>
    );
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={styles.dialog}>
        <Dialog.Title>Manage Categories</Dialog.Title>
        <Dialog.ScrollArea style={styles.scrollArea}>
          <ScrollView>
            {topLevelCategories.length === 0 ? (
              <Text style={styles.emptyText}>No categories yet</Text>
            ) : (
              topLevelCategories.map((topCat) => {
                const subCats = getSubCategories(topCat);
                const isExpanded = expandedCategoryId === topCat.id;

                return (
                  <View key={topCat.id}>
                    {/* Top-level category row */}
                    <View style={styles.topLevelRow}>
                      <TouchableOpacity
                        style={styles.expandArea}
                        onPress={() => toggleExpand(topCat.id)}
                      >
                        <Text style={styles.expandIcon}>{isExpanded ? '▼' : '▶'}</Text>
                        {editingId === topCat.id ? null : (
                          <Text style={styles.categoryName}>{topCat.name}</Text>
                        )}
                      </TouchableOpacity>
                      {editingId === topCat.id ? (
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
                            iconColor={COLORS.SUCCESS}
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
                        <View style={styles.actionButtons}>
                          <Text style={styles.subCountBadge}>{subCats.length}</Text>
                          <IconButton
                            icon="pencil"
                            size={20}
                            onPress={() => startEditing(topCat)}
                          />
                          <IconButton
                            icon="delete"
                            size={20}
                            onPress={() => onDeleteCategory(topCat.id)}
                          />
                        </View>
                      )}
                    </View>

                    {/* Expanded sub-categories */}
                    {isExpanded && (
                      <View style={styles.subCategorySection}>
                        {subCats.length === 0 ? (
                          <Text style={styles.subEmptyText}>No document types</Text>
                        ) : (
                          subCats.map((subCat) => (
                            <React.Fragment key={subCat.id}>
                              {renderEditableRow(subCat, true)}
                            </React.Fragment>
                          ))
                        )}

                        {/* Add new sub-category */}
                        <View style={styles.addSubRow}>
                          <TextInput
                            label="New Document Type"
                            value={newSubCategoryName}
                            onChangeText={setNewSubCategoryName}
                            style={styles.addSubInput}
                            mode="outlined"
                            dense
                          />
                          <Button
                            mode="contained-tonal"
                            onPress={() => handleAddSub(topCat)}
                            disabled={!newSubCategoryName.trim()}
                            compact
                            style={styles.addSubButton}
                          >
                            Add
                          </Button>
                        </View>
                      </View>
                    )}
                  </View>
                );
              })
            )}

            {/* Add new top-level category */}
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
          </ScrollView>
        </Dialog.ScrollArea>
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
  scrollArea: {
    paddingHorizontal: 0,
  },
  topLevelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  expandArea: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingVertical: 4,
  },
  expandIcon: {
    fontSize: 12,
    color: '#666',
    marginRight: 8,
    width: 16,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  subCategoryRow: {
    paddingLeft: 40,
    backgroundColor: '#FAFAFA',
  },
  categoryName: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  subCategoryName: {
    fontSize: 13,
    color: '#555',
  },
  subCountBadge: {
    fontSize: 12,
    color: '#999',
    marginRight: 4,
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
  subCategorySection: {
    backgroundColor: '#FAFAFA',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  subEmptyText: {
    fontSize: 13,
    color: '#999',
    fontStyle: 'italic',
    paddingLeft: 40,
    paddingVertical: 8,
  },
  addSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 40,
    paddingRight: 16,
    paddingVertical: 8,
    gap: 8,
  },
  addSubInput: {
    flex: 1,
  },
  addSubButton: {
    marginTop: 6,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingHorizontal: 16,
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
