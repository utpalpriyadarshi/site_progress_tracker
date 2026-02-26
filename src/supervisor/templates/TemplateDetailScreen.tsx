/**
 * TemplateDetailScreen
 *
 * Shows all activities in a template, grouped by phase.
 * Add / Edit / Delete activities via a dialog.
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
  Switch,
  Divider,
} from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { database } from '../../../models/database';
import TemplateModuleModel, { TemplateItem } from '../../../models/TemplateModuleModel';
import { SupervisorHeader } from '../../components/common';
import { useSnackbar } from '../../components/Snackbar';
import { logger } from '../../services/LoggingService';
import { COLORS } from '../../theme/colors';
import { TemplatesStackParamList } from './TemplatesStackNavigator';

// ==================== Types ====================

type RouteType = RouteProp<TemplatesStackParamList, 'TemplateDetail'>;

const PHASES = [
  { id: 'site_prep',     label: 'Site Prep',     color: '#8BC34A' },
  { id: 'construction',  label: 'Construction',  color: COLORS.SUCCESS },
  { id: 'testing',       label: 'Testing',       color: COLORS.INFO },
  { id: 'commissioning', label: 'Commissioning', color: '#3F51B5' },
  { id: 'sat',           label: 'SAT',           color: COLORS.PRIMARY },
  { id: 'handover',      label: 'Handover',      color: '#009688' },
];

const PHASE_LABELS: Record<string, string> = Object.fromEntries(PHASES.map(p => [p.id, p.label]));
const PHASE_COLORS: Record<string, string> = Object.fromEntries(PHASES.map(p => [p.id, p.color]));

const COMMON_UNITS = ['nos', 'm', 'm²', 'm³', 'tons', 'kg', 'pcs', 'bags'];

// ==================== Blank item factory ====================

const blankItem = (): Omit<TemplateItem, 'dependencies'> & { dependencies: string[] } => ({
  name: '',
  phase: 'site_prep',
  duration: 1,
  dependencies: [],
  wbsCode: '',
  isMilestone: false,
  quantity: 1,
  unit: 'nos',
  weightage: 0,
  categoryName: '',
});

// ==================== Component ====================

const TemplateDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteType>();
  const { template } = route.params;
  const { showSnackbar } = useSnackbar();

  const [templateRecord, setTemplateRecord] = useState<TemplateModuleModel | null>(null);
  const [items, setItems] = useState<TemplateItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog state
  const [dialogVisible, setDialogVisible] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [form, setForm] = useState(blankItem());
  const [phaseMenuVisible, setPhaseMenuVisible] = useState(false);
  const [unitMenuVisible, setUnitMenuVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  // Delete dialog
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);

  // ==================== Data Loading ====================

  const loadTemplate = useCallback(async () => {
    try {
      const rec = await database.collections
        .get<TemplateModuleModel>('template_modules')
        .find(template.id);
      setTemplateRecord(rec);
      setItems(rec.getItems());
    } catch (error) {
      logger.error('Failed to load template', error as Error, { component: 'TemplateDetailScreen' });
      showSnackbar('Failed to load template', 'error');
    } finally {
      setLoading(false);
    }
  }, [template.id, showSnackbar]);

  useEffect(() => {
    loadTemplate();
  }, [loadTemplate]);

  // ==================== Persist helpers ====================

  const persistItems = async (updatedItems: TemplateItem[]) => {
    if (!templateRecord) return;
    await database.write(async () => {
      await templateRecord.update((rec: any) => {
        rec.itemsJson = JSON.stringify(updatedItems);
      });
    });
    setItems(updatedItems);
  };

  // ==================== Dialog helpers ====================

  const openAddDialog = () => {
    setEditingIndex(null);
    setForm(blankItem());
    setDialogVisible(true);
  };

  const openEditDialog = (index: number) => {
    const item = items[index];
    setEditingIndex(index);
    setForm({
      name: item.name,
      phase: item.phase,
      duration: item.duration,
      dependencies: item.dependencies,
      wbsCode: item.wbsCode,
      isMilestone: item.isMilestone ?? false,
      quantity: item.quantity ?? 1,
      unit: item.unit ?? 'nos',
      weightage: item.weightage ?? 0,
      categoryName: item.categoryName ?? '',
    });
    setDialogVisible(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      showSnackbar('Please enter an activity name', 'warning');
      return;
    }
    setSaving(true);
    try {
      const newItem: TemplateItem = {
        name: form.name.trim(),
        phase: form.phase,
        duration: form.duration,
        dependencies: form.dependencies,
        wbsCode: form.wbsCode,
        isMilestone: form.isMilestone,
        quantity: form.quantity,
        unit: form.unit,
        weightage: form.weightage,
        categoryName: form.categoryName || undefined,
      };

      let updatedItems: TemplateItem[];
      if (editingIndex !== null) {
        updatedItems = items.map((it, i) => (i === editingIndex ? newItem : it));
      } else {
        updatedItems = [...items, newItem];
      }

      await persistItems(updatedItems);
      showSnackbar(editingIndex !== null ? 'Activity updated' : 'Activity added', 'success');
      setDialogVisible(false);
    } catch (error) {
      logger.error('Failed to save activity', error as Error, { component: 'TemplateDetailScreen' });
      showSnackbar('Failed to save activity', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (deleteIndex === null) return;
    try {
      const updatedItems = items.filter((_, i) => i !== deleteIndex);
      await persistItems(updatedItems);
      showSnackbar('Activity deleted', 'success');
      setDeleteDialogVisible(false);
      setDeleteIndex(null);
    } catch (error) {
      logger.error('Failed to delete activity', error as Error, { component: 'TemplateDetailScreen' });
      showSnackbar('Failed to delete activity', 'error');
    }
  };

  // ==================== Render ====================

  const groupedItems = PHASES.map(phase => ({
    phase,
    items: items
      .map((item, idx) => ({ item, idx }))
      .filter(({ item }) => item.phase === phase.id),
  })).filter(g => g.items.length > 0);

  const renderItem = (item: TemplateItem, idx: number) => (
    <Card key={idx} style={styles.itemCard}>
      <Card.Content style={styles.itemContent}>
        <View style={styles.itemMain}>
          <Text style={styles.itemName}>{item.name}</Text>
          <View style={styles.itemMeta}>
            {item.isMilestone && (
              <Chip compact style={styles.milestoneChip} textStyle={styles.milestoneChipText}>
                Milestone
              </Chip>
            )}
            {item.categoryName ? (
              <Text style={styles.metaText}>Cat: {item.categoryName}</Text>
            ) : null}
            <Text style={styles.metaText}>
              {item.quantity} {item.unit} · {item.weightage ?? 0}%
            </Text>
          </View>
        </View>
        <View style={styles.itemActions}>
          <IconButton icon="pencil" size={18} onPress={() => openEditDialog(idx)} />
          <IconButton
            icon="delete"
            size={18}
            iconColor="#FF3B30"
            onPress={() => {
              setDeleteIndex(idx);
              setDeleteDialogVisible(true);
            }}
          />
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <SupervisorHeader title={template.name} showBack={true} />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <FlatList
          data={[]}
          keyExtractor={() => 'dummy'}
          renderItem={() => null}
          ListHeaderComponent={
            <>
              {items.length === 0 && (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No activities yet. Tap + to add the first one.</Text>
                </View>
              )}
              {groupedItems.map(({ phase, items: phaseItems }) => (
                <View key={phase.id}>
                  <View style={styles.phaseHeader}>
                    <View style={[styles.phaseBar, { backgroundColor: phase.color }]} />
                    <Text style={[styles.phaseTitle, { color: phase.color }]}>
                      {phase.label}
                    </Text>
                    <Text style={styles.phaseCount}>({phaseItems.length})</Text>
                  </View>
                  {phaseItems.map(({ item, idx }) => renderItem(item, idx))}
                </View>
              ))}
            </>
          }
          contentContainerStyle={styles.listContent}
        />
      )}

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={openAddDialog}
      />

      {/* Add / Edit Dialog */}
      <Portal>
        <Dialog
          visible={dialogVisible}
          onDismiss={() => setDialogVisible(false)}
          style={styles.dialog}
        >
          <Dialog.Title>{editingIndex !== null ? 'Edit Activity' : 'Add Activity'}</Dialog.Title>
          <Dialog.ScrollArea style={styles.dialogScrollArea}>
            <FlatList
              data={[]}
              keyExtractor={() => 'f'}
              renderItem={() => null}
              ListHeaderComponent={
                <View style={styles.formContainer}>
                  <TextInput
                    label="Activity Name *"
                    value={form.name}
                    onChangeText={v => setForm(f => ({ ...f, name: v }))}
                    mode="outlined"
                    style={styles.input}
                  />

                  {/* Phase picker */}
                  <Text style={styles.inputLabel}>Phase</Text>
                  <Menu
                    visible={phaseMenuVisible}
                    onDismiss={() => setPhaseMenuVisible(false)}
                    anchor={
                      <Button
                        mode="outlined"
                        onPress={() => setPhaseMenuVisible(true)}
                        style={styles.pickerButton}
                      >
                        {PHASE_LABELS[form.phase] ?? form.phase}
                      </Button>
                    }
                  >
                    {PHASES.map(p => (
                      <Menu.Item
                        key={p.id}
                        title={p.label}
                        onPress={() => {
                          setForm(f => ({ ...f, phase: p.id }));
                          setPhaseMenuVisible(false);
                        }}
                        leadingIcon={form.phase === p.id ? 'check' : undefined}
                      />
                    ))}
                  </Menu>

                  <TextInput
                    label="Quantity"
                    value={String(form.quantity ?? '')}
                    onChangeText={v => setForm(f => ({ ...f, quantity: parseFloat(v) || 0 }))}
                    mode="outlined"
                    keyboardType="numeric"
                    style={styles.input}
                  />

                  {/* Unit picker */}
                  <Text style={styles.inputLabel}>Unit</Text>
                  <Menu
                    visible={unitMenuVisible}
                    onDismiss={() => setUnitMenuVisible(false)}
                    anchor={
                      <Button
                        mode="outlined"
                        onPress={() => setUnitMenuVisible(true)}
                        style={styles.pickerButton}
                      >
                        {form.unit ?? 'nos'}
                      </Button>
                    }
                  >
                    {COMMON_UNITS.map(u => (
                      <Menu.Item
                        key={u}
                        title={u}
                        onPress={() => {
                          setForm(f => ({ ...f, unit: u }));
                          setUnitMenuVisible(false);
                        }}
                        leadingIcon={form.unit === u ? 'check' : undefined}
                      />
                    ))}
                  </Menu>

                  <TextInput
                    label="Weightage (%)"
                    value={String(form.weightage ?? '')}
                    onChangeText={v => setForm(f => ({ ...f, weightage: parseFloat(v) || 0 }))}
                    mode="outlined"
                    keyboardType="numeric"
                    style={styles.input}
                  />

                  <TextInput
                    label="Category Name (optional)"
                    value={form.categoryName ?? ''}
                    onChangeText={v => setForm(f => ({ ...f, categoryName: v }))}
                    mode="outlined"
                    style={styles.input}
                    placeholder="e.g. OHE, Civil"
                  />

                  <TextInput
                    label="WBS Code"
                    value={form.wbsCode}
                    onChangeText={v => setForm(f => ({ ...f, wbsCode: v }))}
                    mode="outlined"
                    style={styles.input}
                  />

                  <View style={styles.switchRow}>
                    <Text style={styles.switchLabel}>Is Milestone</Text>
                    <Switch
                      value={form.isMilestone ?? false}
                      onValueChange={v => setForm(f => ({ ...f, isMilestone: v }))}
                    />
                  </View>
                </View>
              }
            />
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setDialogVisible(false)} disabled={saving}>Cancel</Button>
            <Button onPress={handleSave} loading={saving} disabled={saving}>Save</Button>
          </Dialog.Actions>
        </Dialog>

        {/* Delete Activity Confirmation */}
        <Dialog
          visible={deleteDialogVisible}
          onDismiss={() => setDeleteDialogVisible(false)}
        >
          <Dialog.Title>Delete Activity</Dialog.Title>
          <Dialog.Content>
            <Text>Remove this activity from the template?</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleDeleteConfirm} textColor="#FF3B30">Delete</Button>
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
  emptyContainer: {
    margin: 24,
    alignItems: 'center',
  },
  emptyText: { color: '#888', fontSize: 14 },
  phaseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 6,
  },
  phaseBar: {
    width: 4,
    height: 16,
    borderRadius: 2,
    marginRight: 8,
  },
  phaseTitle: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  phaseCount: {
    fontSize: 12,
    color: '#888',
    marginLeft: 6,
  },
  itemCard: {
    marginHorizontal: 16,
    marginVertical: 3,
    elevation: 1,
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemMain: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  itemMeta: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 12, color: '#666' },
  milestoneChip: { backgroundColor: '#FFF3E0', height: 22 },
  milestoneChipText: { fontSize: 10, color: '#E65100' },
  itemActions: { flexDirection: 'row' },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 24,
    backgroundColor: COLORS.PRIMARY,
  },
  dialog: { maxHeight: '90%' },
  dialogScrollArea: { maxHeight: 480 },
  formContainer: { paddingVertical: 8 },
  input: { marginBottom: 12 },
  inputLabel: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  pickerButton: { marginBottom: 12 },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  switchLabel: { fontSize: 15 },
});

export default TemplateDetailScreen;
