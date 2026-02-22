import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Portal, Dialog, Button, TextInput, Menu, HelperText } from 'react-native-paper';
import {
  DesignDocument,
  DesignDocumentCategory,
  ResolvedKeyDate,
  Site,
  SITE_REQUIRED_TYPES,
  DocumentType,
  TOP_LEVEL_CATEGORY_TYPE,
  getCategorySlug,
} from '../types/DesignDocumentTypes';
import { DocumentFormData } from '../state/design-document-management';
import { COLORS } from '../../theme/colors';

const DOCUMENT_TYPE_PREFIXES: Record<string, string> = {
  simulation_study: 'SIM',
  installation: 'INS',
  product_equipment: 'PRD',
  as_built: 'ABD',
};

interface DoorsPackageItem {
  id: string;
  doorsId: string;
  equipmentType: string;
}

interface CreateDesignDocumentDialogProps {
  visible: boolean;
  onDismiss: () => void;
  onSave: () => void;
  isEditing: boolean;
  isSubmitting?: boolean;
  form: DocumentFormData;
  onUpdateField: (field: keyof DocumentFormData, value: string) => void;
  categories: DesignDocumentCategory[];
  sites: Site[];
  documents: DesignDocument[];
  /**
   * Key Date auto-resolved from the selected site (Category A lookup via key_date_sites).
   * null  = site is known but has no Category A Key Date linked → show warning.
   * undefined = no site context yet (project-scoped doc or site not yet picked).
   */
  resolvedKeyDate: ResolvedKeyDate | null | undefined;
  /** selectedSiteId from context — 'all' or a specific site ID */
  contextSiteId: string;
  /** Category A Key Dates for the project, used as picker for project-scoped docs */
  projectCategoryAKeyDates: Array<{ id: string; code: string; description: string }>;
  /** Called when user picks a site inside the form (only shown in 'all' context for site-required docs) */
  onSiteSelectedInForm: (siteId: string) => void;
  doorsPackages?: DoorsPackageItem[];
}

const CreateDesignDocumentDialog: React.FC<CreateDesignDocumentDialogProps> = ({
  visible,
  onDismiss,
  onSave,
  isEditing,
  isSubmitting = false,
  form,
  onUpdateField,
  categories,
  sites,
  documents,
  resolvedKeyDate,
  contextSiteId,
  projectCategoryAKeyDates,
  onSiteSelectedInForm,
  doorsPackages = [],
}) => {
  const [categoryMenuVisible, setCategoryMenuVisible] = useState(false);
  const [docTypeMenuVisible, setDocTypeMenuVisible] = useState(false);
  const [siteMenuVisible, setSiteMenuVisible] = useState(false);
  const [projectKdMenuVisible, setProjectKdMenuVisible] = useState(false);
  const [doorsMenuVisible, setDoorsMenuVisible] = useState(false);
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
  const selectedProjectKD = projectCategoryAKeyDates.find((kd) => kd.id === form.keyDateId);
  const selectedDoorsPackage = doorsPackages.find((p) => p.id === form.doorsPackageId);
  const requiresSite = SITE_REQUIRED_TYPES.includes(form.documentType as DocumentType);
  // True when a specific (non-all) site is already selected on the main screen
  const hasSiteContext = contextSiteId !== '' && contextSiteId !== 'all';
  // Whether we know the effective site (from context or from form)
  const hasSite = hasSiteContext || !!form.siteId;

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
      onUpdateField('keyDateId', '');
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

            {/* Site — read-only label when context site is known; picker when in 'All Sites' view */}
            {requiresSite && (
              hasSiteContext ? (
                <View style={styles.readOnlyRow}>
                  <Text style={styles.readOnlyLabel}>Site</Text>
                  <Text style={styles.readOnlyValue}>{selectedSite?.name || '—'}</Text>
                </View>
              ) : (
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
                        onSiteSelectedInForm(site.id);
                        setSiteMenuVisible(false);
                      }}
                      title={site.name}
                    />
                  ))}
                </Menu>
              )
            )}

            {/* Key Date — auto-resolved (read-only) for site-scoped docs; picker for project-scoped */}
            {requiresSite ? (
              !hasSite ? (
                // Site not yet selected in 'All Sites' view
                <View style={styles.keyDateInfoRow}>
                  <Text style={styles.keyDateInfoLabel}>Key Date</Text>
                  <Text style={styles.keyDatePlaceholder}>Select a site to determine Key Date</Text>
                </View>
              ) : resolvedKeyDate ? (
                // Site linked to a Category A Key Date
                <View style={[styles.keyDateInfoRow, styles.keyDateLinkedRow]}>
                  <Text style={styles.keyDateInfoLabel}>Key Date</Text>
                  <Text style={styles.keyDateLinkedCode}>{resolvedKeyDate.code}</Text>
                  <Text style={styles.keyDateLinkedDesc} numberOfLines={2}>
                    {resolvedKeyDate.description}
                  </Text>
                </View>
              ) : (
                // Site has no Category A Key Date linked
                <View style={[styles.keyDateInfoRow, styles.keyDateWarningRow]}>
                  <Text style={styles.keyDateInfoLabel}>Key Date</Text>
                  <Text style={styles.keyDateWarningText}>
                    No Key Date linked to this site — contact Planner
                  </Text>
                </View>
              )
            ) : (
              // Project-scoped doc — show Category A picker
              <Menu
                visible={projectKdMenuVisible}
                onDismiss={() => setProjectKdMenuVisible(false)}
                anchor={
                  <TouchableOpacity
                    onPress={() => setProjectKdMenuVisible(true)}
                    style={styles.pickerButton}
                  >
                    <Text style={styles.pickerLabel}>Key Date (Project)</Text>
                    <Text style={[styles.pickerValue, !form.keyDateId && styles.disabledText]}>
                      {selectedProjectKD
                        ? `${selectedProjectKD.code} — ${selectedProjectKD.description}`
                        : 'Select Project Key Date (optional)'}
                    </Text>
                  </TouchableOpacity>
                }
              >
                <Menu.Item
                  key="none"
                  onPress={() => {
                    onUpdateField('keyDateId', '');
                    setProjectKdMenuVisible(false);
                  }}
                  title="None — Progress not tracked"
                />
                {projectCategoryAKeyDates.map((kd) => (
                  <Menu.Item
                    key={kd.id}
                    onPress={() => {
                      onUpdateField('keyDateId', kd.id);
                      setProjectKdMenuVisible(false);
                    }}
                    title={`${kd.code} — ${kd.description}`}
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
            />
            <HelperText type="info">
              {requiresSite && form.siteId
                ? 'Total weightage per site should equal 100%'
                : 'Leave empty for project-wide documents'}
            </HelperText>

            {/* DOORS Package Link */}
            {doorsPackages.length > 0 && (
              <Menu
                visible={doorsMenuVisible}
                onDismiss={() => setDoorsMenuVisible(false)}
                anchor={
                  <TouchableOpacity
                    onPress={() => setDoorsMenuVisible(true)}
                    style={styles.pickerButton}
                  >
                    <Text style={styles.pickerLabel}>Link to DOORS Package</Text>
                    <Text style={[styles.pickerValue, !form.doorsPackageId && styles.disabledText]}>
                      {selectedDoorsPackage
                        ? `${selectedDoorsPackage.doorsId} — ${selectedDoorsPackage.equipmentType}`
                        : 'None (optional)'}
                    </Text>
                  </TouchableOpacity>
                }
              >
                <Menu.Item
                  key="none"
                  onPress={() => {
                    onUpdateField('doorsPackageId', '');
                    setDoorsMenuVisible(false);
                  }}
                  title="None"
                />
                {doorsPackages.map((pkg) => (
                  <Menu.Item
                    key={pkg.id}
                    onPress={() => {
                      onUpdateField('doorsPackageId', pkg.id);
                      setDoorsMenuVisible(false);
                    }}
                    title={`${pkg.doorsId} — ${pkg.equipmentType}`}
                  />
                ))}
              </Menu>
            )}
          </ScrollView>
        </Dialog.ScrollArea>
        <Dialog.Actions>
          <Button onPress={onDismiss} disabled={isSubmitting}>Cancel</Button>
          <Button onPress={onSave} loading={isSubmitting} disabled={isSubmitting}>
            {isEditing ? 'Update' : 'Create'}
          </Button>
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
  readOnlyRow: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 4,
    padding: 12,
    marginBottom: 12,
    marginHorizontal: 24,
    backgroundColor: '#F5F5F5',
  },
  readOnlyLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  readOnlyValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  keyDateInfoRow: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 4,
    padding: 12,
    marginBottom: 12,
    marginHorizontal: 24,
  },
  keyDateInfoLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  keyDateLinkedRow: {
    borderColor: COLORS.PRIMARY,
    backgroundColor: '#EEF4FF',
  },
  keyDateLinkedCode: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
    marginBottom: 2,
  },
  keyDateLinkedDesc: {
    fontSize: 13,
    color: '#444',
  },
  keyDateWarningRow: {
    borderColor: COLORS.WARNING,
    backgroundColor: '#FFF8E1',
  },
  keyDateWarningText: {
    fontSize: 13,
    color: '#E65100',
    fontStyle: 'italic',
  },
  keyDatePlaceholder: {
    fontSize: 13,
    color: '#999',
    fontStyle: 'italic',
  },
});

export default CreateDesignDocumentDialog;
