import React, { useState, useEffect } from 'react';
import { Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Portal, Dialog, Button, TextInput, Menu } from 'react-native-paper';
import {
  DesignDocument,
  DesignDocumentCategory,
  Site,
  SITE_REQUIRED_TYPES,
  DocumentType,
  TOP_LEVEL_CATEGORY_TYPE,
  getCategorySlug,
} from '../types/DesignDocumentTypes';
import { DocumentFormData } from '../state/design-document-management';

const DOCUMENT_TYPE_PREFIXES: Record<string, string> = {
  simulation_study: 'SIM',
  installation: 'INS',
  product_equipment: 'PRD',
  as_built: 'ABD',
};

interface CreateDesignDocumentDialogProps {
  visible: boolean;
  onDismiss: () => void;
  onSave: () => void;
  isEditing: boolean;
  form: DocumentFormData;
  onUpdateField: (field: keyof DocumentFormData, value: string) => void;
  categories: DesignDocumentCategory[];
  sites: Site[];
  documents: DesignDocument[];
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
  documents,
}) => {
  const [categoryMenuVisible, setCategoryMenuVisible] = useState(false);
  const [docTypeMenuVisible, setDocTypeMenuVisible] = useState(false);
  const [siteMenuVisible, setSiteMenuVisible] = useState(false);
  const [docNumberManuallyEdited, setDocNumberManuallyEdited] = useState(false);

  // Top-level categories (documentType === '_category')
  const topLevelCategories = categories.filter((c) => c.documentType === TOP_LEVEL_CATEGORY_TYPE);

  // Derive the slug for the currently selected top-level category
  const selectedTopLevel = topLevelCategories.find((c) => {
    const slug = getCategorySlug(c.name);
    return slug === form.documentType;
  });

  // Sub-categories (document types) filtered by the selected category's slug
  const subCategories = form.documentType
    ? categories.filter((c) => c.documentType === form.documentType)
    : [];

  const selectedSubCategory = categories.find((c) => c.id === form.categoryId);
  const selectedSite = sites.find((s) => s.id === form.siteId);
  const requiresSite = SITE_REQUIRED_TYPES.includes(form.documentType as DocumentType);

  // Reset manual edit flag when dialog opens
  useEffect(() => {
    if (visible && !isEditing) {
      setDocNumberManuallyEdited(false);
    }
    if (visible && isEditing) {
      setDocNumberManuallyEdited(true);
    }
  }, [visible, isEditing]);

  const generateDocumentNumber = (slug: string): string => {
    const prefix = DOCUMENT_TYPE_PREFIXES[slug] || slug.substring(0, 3).toUpperCase();
    const docsOfType = documents.filter((d) => d.documentType === slug);
    const nextNumber = docsOfType.length + 1;
    return `DD-${prefix}-${String(nextNumber).padStart(3, '0')}`;
  };

  const handleCategorySelect = (category: DesignDocumentCategory) => {
    const slug = getCategorySlug(category.name);
    onUpdateField('documentType', slug as string);
    onUpdateField('categoryId', '');
    if (!SITE_REQUIRED_TYPES.includes(slug as DocumentType)) {
      onUpdateField('siteId', '');
    }
    if (!docNumberManuallyEdited) {
      onUpdateField('documentNumber', generateDocumentNumber(slug as string));
    }
    setCategoryMenuVisible(false);
  };

  const handleDocTypeSelect = (subCategory: DesignDocumentCategory) => {
    onUpdateField('categoryId', subCategory.id);
    setDocTypeMenuVisible(false);
  };

  const handleDocNumberChange = (value: string) => {
    setDocNumberManuallyEdited(true);
    onUpdateField('documentNumber', value);
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={styles.dialog}>
        <Dialog.Title>{isEditing ? 'Edit Document' : 'Create Design Document'}</Dialog.Title>
        <Dialog.ScrollArea style={styles.scrollArea}>
          <ScrollView>
            {/* Category Dropdown - FIRST (top-level categories) */}
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
                    {selectedTopLevel?.name || 'Select Category'}
                  </Text>
                </TouchableOpacity>
              }
            >
              {topLevelCategories.length === 0 ? (
                <Menu.Item
                  title="No categories available"
                  disabled
                  onPress={() => {}}
                />
              ) : (
                topLevelCategories.map((cat) => (
                  <Menu.Item
                    key={cat.id}
                    onPress={() => handleCategorySelect(cat)}
                    title={cat.name}
                  />
                ))
              )}
            </Menu>

            {/* Document Type Dropdown - SECOND (sub-categories, optional) */}
            {form.documentType !== '' && (
              <Menu
                visible={docTypeMenuVisible}
                onDismiss={() => setDocTypeMenuVisible(false)}
                anchor={
                  <TouchableOpacity
                    onPress={() => subCategories.length > 0 && setDocTypeMenuVisible(true)}
                    style={styles.pickerButton}
                  >
                    <Text style={styles.pickerLabel}>Document Type</Text>
                    <Text style={[styles.pickerValue, subCategories.length === 0 && styles.disabledText]}>
                      {subCategories.length === 0
                        ? 'None available'
                        : selectedSubCategory?.name || 'Select Document Type'}
                    </Text>
                  </TouchableOpacity>
                }
              >
                {subCategories.map((cat) => (
                  <Menu.Item
                    key={cat.id}
                    onPress={() => handleDocTypeSelect(cat)}
                    title={cat.name}
                  />
                ))}
              </Menu>
            )}

            {/* Document Number - auto-generated but editable */}
            <TextInput
              label="Document Number *"
              value={form.documentNumber}
              onChangeText={handleDocNumberChange}
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

            <TextInput
              label="Weightage (%)"
              value={form.weightage}
              onChangeText={(v) => onUpdateField('weightage', v)}
              style={styles.input}
              mode="outlined"
              keyboardType="numeric"
              placeholder="0-100"
              helperText={
                requiresSite && form.siteId
                  ? 'Total weightage per site should equal 100%'
                  : 'Leave empty for project-wide documents'
              }
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
  disabledText: {
    color: '#999',
    fontStyle: 'italic',
  },
});

export default CreateDesignDocumentDialog;
