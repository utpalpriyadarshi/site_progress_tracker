/**
 * ApplyTemplateDialog
 *
 * Lets the supervisor pick a template and apply it to the currently selected site.
 * Duplicate activity names on the target site are automatically skipped.
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import {
  Text,
  Dialog,
  Portal,
  Button,
  RadioButton,
  ActivityIndicator,
  Divider,
  Chip,
} from 'react-native-paper';
import { database } from '../../../models/database';
import TemplateModuleModel, { TemplateCategory } from '../../../models/TemplateModuleModel';
import { applyTemplateToSite, seedPredefinedTemplates } from '../../services/TemplateService';
import { logger } from '../../services/LoggingService';

// ==================== Types ====================

export interface ApplyTemplateDialogProps {
  visible: boolean;
  siteId: string;
  siteName: string;
  projectId: string;
  onClose: () => void;
  onSuccess: (created: number, skipped: number, materialsCreated: number) => void;
}

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

// ==================== Component ====================

const ApplyTemplateDialog: React.FC<ApplyTemplateDialogProps> = ({
  visible,
  siteId,
  siteName,
  projectId,
  onClose,
  onSuccess,
}) => {
  const [templates, setTemplates] = useState<TemplateModuleModel[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [step, setStep] = useState<'pick' | 'confirm'>('pick');

  useEffect(() => {
    if (!visible) return;
    setSelectedId('');
    setStep('pick');

    const load = async () => {
      setLoading(true);
      try {
        await seedPredefinedTemplates();
        const all = await database.collections
          .get<TemplateModuleModel>('template_modules')
          .query()
          .fetch();
        setTemplates(all);
      } catch (error) {
        logger.error('Failed to load templates in ApplyTemplateDialog', error as Error, {
          component: 'ApplyTemplateDialog',
        });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [visible]);

  const selectedTemplate = templates.find(t => t.id === selectedId) ?? null;

  const handleApply = async () => {
    if (!selectedId) return;
    setApplying(true);
    try {
      const result = await applyTemplateToSite(selectedId, siteId, projectId);
      onSuccess(result.created, result.skipped, result.materialsCreated);
      onClose();
    } catch (error) {
      logger.error('Failed to apply template', error as Error, {
        component: 'ApplyTemplateDialog',
        templateId: selectedId,
        siteId,
      });
    } finally {
      setApplying(false);
    }
  };

  const renderTemplate = (tpl: TemplateModuleModel) => {
    const color = CATEGORY_COLORS[tpl.category as TemplateCategory] ?? '#666';
    const label = CATEGORY_LABELS[tpl.category as TemplateCategory] ?? tpl.category;
    const count = tpl.getItemCount();

    return (
      <TouchableOpacity
        key={tpl.id}
        style={styles.templateRow}
        onPress={() => setSelectedId(tpl.id)}
        activeOpacity={0.7}
      >
        <RadioButton
          value={tpl.id}
          status={selectedId === tpl.id ? 'checked' : 'unchecked'}
          onPress={() => setSelectedId(tpl.id)}
        />
        <View style={styles.templateInfo}>
          <Text style={styles.templateName}>{tpl.name}</Text>
          <View style={styles.templateMeta}>
            <Chip
              style={[styles.catChip, { backgroundColor: color + '22' }]}
              textStyle={[styles.catChipText, { color }]}
            >
              {label}
            </Chip>
            <Text style={styles.countText}>{count} activities</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // ── Step: pick ──────────────────────────────────────────────────────────────

  if (step === 'pick') {
    return (
      <Portal>
        <Dialog visible={visible} onDismiss={onClose} style={styles.dialog}>
          <Dialog.Title>Apply Template to Site</Dialog.Title>
          <Dialog.Content>
            <Text style={styles.subtitle}>
              Applying to: <Text style={styles.bold}>{siteName}</Text>
            </Text>
          </Dialog.Content>

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" />
            </View>
          ) : (
            <Dialog.ScrollArea style={styles.scrollArea}>
              <FlatList
                data={templates}
                keyExtractor={t => t.id}
                renderItem={({ item }) => renderTemplate(item)}
                ItemSeparatorComponent={() => <Divider />}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>No templates available.</Text>
                }
              />
            </Dialog.ScrollArea>
          )}

          <Dialog.Actions>
            <Button onPress={onClose}>Cancel</Button>
            <Button
              mode="contained"
              onPress={() => setStep('confirm')}
              disabled={!selectedId || loading}
            >
              Next
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    );
  }

  // ── Step: confirm ────────────────────────────────────────────────────────────

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onClose} style={styles.dialog}>
        <Dialog.Title>Confirm Apply</Dialog.Title>
        <Dialog.Content>
          <Text style={styles.confirmText}>
            Apply{' '}
            <Text style={styles.bold}>{selectedTemplate?.getItemCount() ?? 0} activities</Text>
            {' '}from{' '}
            <Text style={styles.bold}>"{selectedTemplate?.name}"</Text>
            {' '}to{' '}
            <Text style={styles.bold}>{siteName}</Text>?
          </Text>
          <Text style={styles.noteText}>
            Activities with duplicate names on this site will be skipped.
          </Text>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={() => setStep('pick')} disabled={applying}>Back</Button>
          <Button
            mode="contained"
            onPress={handleApply}
            loading={applying}
            disabled={applying}
          >
            Apply
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

// ==================== Styles ====================

const styles = StyleSheet.create({
  dialog: {
    maxWidth: 500,
    alignSelf: 'center',
    width: '92%',
  },
  subtitle: { fontSize: 14, color: '#555', marginBottom: 4 },
  bold: { fontWeight: '700', color: '#222' },
  loadingBox: { paddingVertical: 32, alignItems: 'center' },
  scrollArea: { maxHeight: 360 },
  templateRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  templateInfo: { flex: 1, marginLeft: 4 },
  templateName: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  templateMeta: { flexDirection: 'row', alignItems: 'flex-start', flexWrap: 'wrap', gap: 6 },
  catChip: { alignSelf: 'flex-start' },
  catChipText: { fontSize: 10, fontWeight: '600' },
  countText: { fontSize: 12, color: '#888', marginTop: 6 },
  emptyText: { textAlign: 'center', color: '#888', padding: 24 },
  confirmText: { fontSize: 15, lineHeight: 22, marginBottom: 12 },
  noteText: { fontSize: 13, color: '#888', fontStyle: 'italic' },
});

export default ApplyTemplateDialog;
