/**
 * TemplatesScreen
 *
 * Lists all activity templates (predefined + user-created), grouped by category.
 * FAB opens a dialog to create a new template.
 * Per-card: Edit (rename/category), Delete (user templates only), Tap → detail.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import {
  Text,
  Card,
  Chip,
  FAB,
  Portal,
  Dialog,
  Button,
  TextInput,
  Menu,
  IconButton,
  ActivityIndicator,
  Divider,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { database } from '../../../models/database';
import TemplateModuleModel, { TemplateCategory } from '../../../models/TemplateModuleModel';
import { SupervisorHeader, EmptyState } from '../../components/common';
import { useSnackbar } from '../../components/Snackbar';
import { logger } from '../../services/LoggingService';
import { seedPredefinedTemplates } from '../../services/TemplateService';
import { COLORS } from '../../theme/colors';
import { TemplatesStackParamList } from './TemplatesStackNavigator';

// ==================== Types ====================

type Nav = NativeStackNavigationProp<TemplatesStackParamList, 'TemplatesList'>;

const CATEGORY_LABELS: Record<TemplateCategory, string> = {
  substation: 'Substation (TSS)',
  ohe:        'Overhead Equipment (OHE)',
  building:   'Building / Civil',
  third_rail: 'Third Rail',
  interface:  'Interface',
};

const CATEGORY_COLORS: Record<TemplateCategory, string> = {
  substation: '#E53935',
  ohe:        '#1E88E5',
  building:   '#6D4C41',
  third_rail: '#8E24AA',
  interface:  '#00897B',
};

const CATEGORY_OPTIONS: TemplateCategory[] = ['substation', 'ohe', 'building', 'third_rail', 'interface'];

// ==================== Component ====================

const TemplatesScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const { showSnackbar } = useSnackbar();

  const [templates, setTemplates] = useState<TemplateModuleModel[]>([]);
  const [loading, setLoading] = useState(true);

  // Create / Edit dialog state
  const [dialogVisible, setDialogVisible] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TemplateModuleModel | null>(null);
  const [templateName, setTemplateName] = useState('');
  const [templateCategory, setTemplateCategory] = useState<TemplateCategory>('substation');
  const [categoryMenuVisible, setCategoryMenuVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  // Delete dialog state
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<TemplateModuleModel | null>(null);

  // ==================== Data Loading ====================

  const loadTemplates = useCallback(async () => {
    try {
      await seedPredefinedTemplates();
      const all = await database.collections
        .get<TemplateModuleModel>('template_modules')
        .query()
        .fetch();
      setTemplates(all);
    } catch (error) {
      logger.error('Failed to load templates', error as Error, { component: 'TemplatesScreen' });
      showSnackbar('Failed to load templates', 'error');
    } finally {
      setLoading(false);
    }
  }, [showSnackbar]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  // ==================== Handlers ====================

  const openCreateDialog = () => {
    setEditingTemplate(null);
    setTemplateName('');
    setTemplateCategory('substation');
    setDialogVisible(true);
  };

  const openEditDialog = (tpl: TemplateModuleModel) => {
    setEditingTemplate(tpl);
    setTemplateName(tpl.name);
    setTemplateCategory(tpl.category as TemplateCategory);
    setDialogVisible(true);
  };

  const handleSave = async () => {
    if (!templateName.trim()) {
      showSnackbar('Please enter a template name', 'warning');
      return;
    }
    setSaving(true);
    try {
      await database.write(async () => {
        if (editingTemplate) {
          await editingTemplate.update((rec: any) => {
            rec.name = templateName.trim();
            rec.category = templateCategory;
          });
        } else {
          await database.collections.get('template_modules').create((rec: any) => {
            rec.name = templateName.trim();
            rec.category = templateCategory;
            rec.description = '';
            rec.itemsJson = JSON.stringify([]);
            rec.compatibleModules = JSON.stringify([]);
            rec.isPredefined = false;
          });
        }
      });
      showSnackbar(editingTemplate ? 'Template updated' : 'Template created', 'success');
      setDialogVisible(false);
      loadTemplates();
    } catch (error) {
      logger.error('Failed to save template', error as Error, { component: 'TemplatesScreen' });
      showSnackbar('Failed to save template', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (tpl: TemplateModuleModel) => {
    setTemplateToDelete(tpl);
    setDeleteDialogVisible(true);
  };

  const confirmDelete = async () => {
    if (!templateToDelete) return;
    try {
      await database.write(async () => {
        await templateToDelete.markAsDeleted();
      });
      showSnackbar('Template deleted', 'success');
      setDeleteDialogVisible(false);
      setTemplateToDelete(null);
      loadTemplates();
    } catch (error) {
      logger.error('Failed to delete template', error as Error, { component: 'TemplatesScreen' });
      showSnackbar('Failed to delete template', 'error');
    }
  };

  // ==================== Render ====================

  const renderTemplate = ({ item }: { item: TemplateModuleModel }) => {
    const color = CATEGORY_COLORS[item.category as TemplateCategory] ?? COLORS.PRIMARY;
    const label = CATEGORY_LABELS[item.category as TemplateCategory] ?? item.category;
    const count = item.getItemCount();

    return (
      <TouchableOpacity
        onPress={() =>
          navigation.navigate('TemplateDetail', {
            template: { id: item.id, name: item.name, category: item.category },
          })
        }
        activeOpacity={0.8}
      >
        <Card style={styles.card}>
          <Card.Content style={styles.cardContent}>
            <View style={styles.cardMain}>
              <Text style={styles.templateName}>{item.name}</Text>
              <Chip
                style={[styles.categoryChip, { backgroundColor: color + '22' }]}
                textStyle={[styles.categoryChipText, { color }]}
              >
                {label}
              </Chip>
              <Text style={styles.activityCount}>
                {count} {count === 1 ? 'activity' : 'activities'}
              </Text>
            </View>
            <View style={styles.cardActions}>
              <IconButton
                icon="pencil"
                size={20}
                onPress={() => openEditDialog(item)}
              />
              {!item.isPredefined && (
                <IconButton
                  icon="delete"
                  size={20}
                  iconColor="#FF3B30"
                  onPress={() => handleDelete(item)}
                />
              )}
            </View>
          </Card.Content>
        </Card>
      </TouchableOpacity>
    );
  };

  const groupedTemplates = CATEGORY_OPTIONS.reduce(
    (acc, cat) => {
      const group = templates.filter(t => t.category === cat);
      if (group.length > 0) acc.push({ category: cat, items: group });
      return acc;
    },
    [] as Array<{ category: TemplateCategory; items: TemplateModuleModel[] }>
  );

  // Uncategorized / unknown categories
  const knownCategories = new Set<string>(CATEGORY_OPTIONS);
  const otherTemplates = templates.filter(t => !knownCategories.has(t.category));

  return (
    <View style={styles.container}>
      <SupervisorHeader title="Activity Templates" showBack={false} />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
        </View>
      ) : templates.length === 0 ? (
        <EmptyState
          icon="file-document-outline"
          title="No Templates"
          message="Create a template to quickly populate sites with standard activities."
          actionText="Create Template"
          onAction={openCreateDialog}
        />
      ) : (
        <FlatList
          data={[]}
          keyExtractor={() => 'dummy'}
          renderItem={() => null}
          ListHeaderComponent={
            <>
              {groupedTemplates.map(group => (
                <View key={group.category}>
                  <View style={styles.groupHeader}>
                    <Text style={styles.groupTitle}>
                      {CATEGORY_LABELS[group.category]}
                    </Text>
                    <Divider style={styles.groupDivider} />
                  </View>
                  {group.items.map(item => (
                    <React.Fragment key={item.id}>{renderTemplate({ item })}</React.Fragment>
                  ))}
                </View>
              ))}
              {otherTemplates.map(item => (
                <React.Fragment key={item.id}>{renderTemplate({ item })}</React.Fragment>
              ))}
            </>
          }
          contentContainerStyle={styles.listContent}
        />
      )}

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={openCreateDialog}
        label="New Template"
      />

      {/* Create / Edit Dialog */}
      <Portal>
        <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)}>
          <Dialog.Title>{editingTemplate ? 'Edit Template' : 'New Template'}</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Template Name *"
              value={templateName}
              onChangeText={setTemplateName}
              mode="outlined"
              style={styles.input}
            />
            <Text style={styles.inputLabel}>Category</Text>
            <Menu
              visible={categoryMenuVisible}
              onDismiss={() => setCategoryMenuVisible(false)}
              anchor={
                <Button
                  mode="outlined"
                  onPress={() => setCategoryMenuVisible(true)}
                  style={styles.categoryButton}
                >
                  {CATEGORY_LABELS[templateCategory]}
                </Button>
              }
            >
              {CATEGORY_OPTIONS.map(cat => (
                <Menu.Item
                  key={cat}
                  title={CATEGORY_LABELS[cat]}
                  onPress={() => {
                    setTemplateCategory(cat);
                    setCategoryMenuVisible(false);
                  }}
                  leadingIcon={templateCategory === cat ? 'check' : undefined}
                />
              ))}
            </Menu>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDialogVisible(false)} disabled={saving}>Cancel</Button>
            <Button onPress={handleSave} loading={saving} disabled={saving}>Save</Button>
          </Dialog.Actions>
        </Dialog>

        {/* Delete Confirmation */}
        <Dialog
          visible={deleteDialogVisible}
          onDismiss={() => setDeleteDialogVisible(false)}
        >
          <Dialog.Title>Delete Template</Dialog.Title>
          <Dialog.Content>
            <Text>
              Delete "{templateToDelete?.name}"? All activities in this template will be removed.
              This cannot be undone.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteDialogVisible(false)}>Cancel</Button>
            <Button onPress={confirmDelete} textColor="#FF3B30">Delete</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

// ==================== Styles ====================

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { paddingBottom: 100 },
  groupHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
  },
  groupTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  groupDivider: { marginBottom: 4 },
  card: {
    marginHorizontal: 16,
    marginVertical: 4,
    elevation: 2,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  cardMain: { flex: 1 },
  templateName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  categoryChip: {
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  categoryChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  activityCount: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  cardActions: { flexDirection: 'row', marginTop: 2 },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 24,
    backgroundColor: COLORS.PRIMARY,
  },
  input: { marginBottom: 12 },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 4,
  },
  categoryButton: { marginBottom: 4 },
});

export default TemplatesScreen;
