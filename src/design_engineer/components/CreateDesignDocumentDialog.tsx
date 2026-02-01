import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Portal, Dialog, Button, TextInput, Menu } from 'react-native-paper';
import {
  DesignDocumentCategory,
  Site,
  DOCUMENT_TYPES,
  SITE_REQUIRED_TYPES,
  DocumentType,
} from '../types/DesignDocumentTypes';
import { DocumentFormData } from '../state/design-document-management';

interface CreateDesignDocumentDialogProps {
  visible: boolean;
  onDismiss: () => void;
  onSave: () => void;
  isEditing: boolean;
  form: DocumentFormData;
  onUpdateField: (field: keyof DocumentFormData, value: string) => void;
  categories: DesignDocumentCategory[];
  sites: Site[];
}

const CreateDesignDocumentDialog: React.FC<CreateDesignDocumentDialogProps> = ({
  visible,
  onDismiss,
  onSave,
  isEditing,
  form,
  onUpdateField,
  categories,
  sites,
}) => {
  const [typeMenuVisible, setTypeMenuVisible] = useState(false);
  const [categoryMenuVisible, setCategoryMenuVisible] = useState(false);
  const [siteMenuVisible, setSiteMenuVisible] = useState(false);

  const requiresSite = SITE_REQUIRED_TYPES.includes(form.documentType as DocumentType);
  const filteredCategories = categories.filter((c) => c.documentType === form.documentType);
  const selectedType = DOCUMENT_TYPES.find((t) => t.value === form.documentType);
  const selectedCategory = categories.find((c) => c.id === form.categoryId);
  const selectedSite = sites.find((s) => s.id === form.siteId);

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={styles.dialog}>
        <Dialog.Title>{isEditing ? 'Edit Document' : 'Create Design Document'}</Dialog.Title>
        <Dialog.ScrollArea style={styles.scrollArea}>
          <ScrollView>
            <TextInput
              label="Document Number *"
              value={form.documentNumber}
              onChangeText={(v) => onUpdateField('documentNumber', v)}
              style={styles.input}
              mode="outlined"
            />
            <TextInput
              label="Title *"
              value={form.title}
              onChangeText={(v) => onUpdateField('title', v)}
              style={styles.input}
              mode="outlined"
            />
            <TextInput
              label="Description"
              value={form.description}
              onChangeText={(v) => onUpdateField('description', v)}
              style={styles.input}
              mode="outlined"
              multiline
              numberOfLines={3}
            />

            {/* Document Type Dropdown */}
            <Menu
              visible={typeMenuVisible}
              onDismiss={() => setTypeMenuVisible(false)}
              anchor={
                <TouchableOpacity
                  onPress={() => setTypeMenuVisible(true)}
                  style={styles.pickerButton}
                >
                  <Text style={styles.pickerLabel}>Document Type *</Text>
                  <Text style={styles.pickerValue}>
                    {selectedType?.label || 'Select Type'}
                  </Text>
                </TouchableOpacity>
              }
            >
              {DOCUMENT_TYPES.map((type) => (
                <Menu.Item
                  key={type.value}
                  onPress={() => {
                    onUpdateField('documentType', type.value);
                    onUpdateField('categoryId', '');
                    if (!SITE_REQUIRED_TYPES.includes(type.value)) {
                      onUpdateField('siteId', '');
                    }
                    setTypeMenuVisible(false);
                  }}
                  title={type.label}
                />
              ))}
            </Menu>

            {/* Category Dropdown (filtered by type) */}
            {form.documentType !== '' && (
              <Menu
                visible={categoryMenuVisible}
                onDismiss={() => setCategoryMenuVisible(false)}
                anchor={
                  <TouchableOpacity
                    onPress={() => setCategoryMenuVisible(true)}
                    style={styles.pickerButton}
                  >
                    <Text style={styles.pickerLabel}>Category *</Text>
                    <Text style={styles.pickerValue}>
                      {selectedCategory?.name || 'Select Category'}
                    </Text>
                  </TouchableOpacity>
                }
              >
                {filteredCategories.length === 0 ? (
                  <Menu.Item
                    title="No categories - add via Manage Categories"
                    disabled
                    onPress={() => {}}
                  />
                ) : (
                  filteredCategories.map((cat) => (
                    <Menu.Item
                      key={cat.id}
                      onPress={() => {
                        onUpdateField('categoryId', cat.id);
                        setCategoryMenuVisible(false);
                      }}
                      title={cat.name}
                    />
                  ))
                )}
              </Menu>
            )}

            {/* Site Dropdown (only for Installation/As-Built) */}
            {requiresSite && (
              <Menu
                visible={siteMenuVisible}
                onDismiss={() => setSiteMenuVisible(false)}
                anchor={
                  <TouchableOpacity
                    onPress={() => setSiteMenuVisible(true)}
                    style={styles.pickerButton}
                  >
                    <Text style={styles.pickerLabel}>Site *</Text>
                    <Text style={styles.pickerValue}>
                      {selectedSite?.name || 'Select Site'}
                    </Text>
                  </TouchableOpacity>
                }
              >
                {sites.map((site) => (
                  <Menu.Item
                    key={site.id}
                    onPress={() => {
                      onUpdateField('siteId', site.id);
                      setSiteMenuVisible(false);
                    }}
                    title={site.name}
                  />
                ))}
              </Menu>
            )}

            <TextInput
              label="Revision Number"
              value={form.revisionNumber}
              onChangeText={(v) => onUpdateField('revisionNumber', v)}
              style={styles.input}
              mode="outlined"
            />
          </ScrollView>
        </Dialog.ScrollArea>
        <Dialog.Actions>
          <Button onPress={onDismiss}>Cancel</Button>
          <Button onPress={onSave}>{isEditing ? 'Update' : 'Create'}</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

const styles = StyleSheet.create({
  dialog: {
    maxHeight: '80%',
  },
  scrollArea: {
    paddingHorizontal: 0,
  },
  input: {
    marginBottom: 12,
    marginHorizontal: 24,
  },
  pickerButton: {
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 4,
    padding: 12,
    marginBottom: 12,
    marginHorizontal: 24,
  },
  pickerLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  pickerValue: {
    fontSize: 16,
    color: '#000',
  },
});

export default CreateDesignDocumentDialog;
