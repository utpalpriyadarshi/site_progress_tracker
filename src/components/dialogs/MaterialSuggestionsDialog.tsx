/**
 * MaterialSuggestionsDialog
 *
 * B1 feature: "Suggest Materials" per item card in ItemsManagementScreen.
 *
 * Shows a multi-select checklist of suggested materials for a given work item.
 * User can deselect any rows, then tap "Add N Materials" to bulk-create them.
 * If no suggestions exist, shows a friendly empty message.
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import {
  Dialog,
  Portal,
  Button,
  Text,
  Checkbox,
  ActivityIndicator,
  Divider,
} from 'react-native-paper';
import { database } from '../../../models/database';
import ItemModel from '../../../models/ItemModel';
import { TemplateMaterial } from '../../../models/TemplateModuleModel';
import { getSuggestionsForItem } from '../../services/MaterialSuggestionsService';
import { logger } from '../../services/LoggingService';
import { COLORS } from '../../theme/colors';

export interface MaterialSuggestionsDialogProps {
  visible: boolean;
  item: ItemModel;
  categoryName: string;
  onClose: () => void;
  onSuccess: (created: number) => void;
}

export const MaterialSuggestionsDialog: React.FC<MaterialSuggestionsDialogProps> = ({
  visible,
  item,
  categoryName,
  onClose,
  onSuccess,
}) => {
  const [suggestions, setSuggestions] = useState<TemplateMaterial[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    const list = getSuggestionsForItem(item.name, categoryName);
    setSuggestions(list);
    // Pre-check all suggestions
    setSelected(new Set(list.map((_, i) => i)));
  }, [visible, item.name, categoryName]);

  const toggleRow = (idx: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  };

  const selectedCount = selected.size;

  const handleAdd = async () => {
    if (selectedCount === 0) return;
    setSaving(true);
    try {
      const toCreate = suggestions.filter((_, i) => selected.has(i));
      await database.write(async () => {
        for (const mat of toCreate) {
          await database.collections.get('materials').create((rec: any) => {
            rec.name = mat.name;
            rec.itemId = item.id;
            rec.quantityRequired = mat.quantityRequired;
            rec.quantityAvailable = 0;
            rec.quantityUsed = 0;
            rec.unit = mat.unit;
            rec.status = 'ordered';
            rec.supplier = mat.supplier ?? '';
            rec.procurementManagerId = '';
            rec.appSyncStatus = 'pending';
            rec._version = 1;
          });
        }
      });
      onSuccess(toCreate.length);
    } catch (error) {
      logger.error('Failed to create suggested materials', error as Error, {
        component: 'MaterialSuggestionsDialog',
        itemId: item.id,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onClose} style={styles.dialog}>
        <Dialog.Title>Suggest Materials</Dialog.Title>
        <Dialog.Content>
          <Text style={styles.subtitle}>
            For: <Text style={styles.bold}>{item.name}</Text>
          </Text>
        </Dialog.Content>

        {suggestions.length === 0 ? (
          <Dialog.Content>
            <Text style={styles.emptyText}>
              No suggestions available for this item type. Add materials manually in Material Tracking.
            </Text>
          </Dialog.Content>
        ) : (
          <Dialog.ScrollArea style={styles.scrollArea}>
            <ScrollView>
              {suggestions.map((mat, idx) => (
                <React.Fragment key={idx}>
                  <View style={styles.row}>
                    <Checkbox
                      status={selected.has(idx) ? 'checked' : 'unchecked'}
                      onPress={() => toggleRow(idx)}
                    />
                    <View style={styles.rowInfo}>
                      <Text style={styles.matName}>{mat.name}</Text>
                      <Text style={styles.matMeta}>
                        {mat.quantityRequired} {mat.unit}
                        {mat.supplier ? ` · ${mat.supplier}` : ''}
                      </Text>
                    </View>
                  </View>
                  {idx < suggestions.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </ScrollView>
          </Dialog.ScrollArea>
        )}

        <Dialog.Actions>
          <Button onPress={onClose} disabled={saving}>Cancel</Button>
          {suggestions.length > 0 && (
            <Button
              mode="contained"
              onPress={handleAdd}
              loading={saving}
              disabled={saving || selectedCount === 0}
            >
              Add {selectedCount > 0 ? `${selectedCount} ` : ''}Material{selectedCount !== 1 ? 's' : ''}
            </Button>
          )}
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

const styles = StyleSheet.create({
  dialog: { maxWidth: 500, alignSelf: 'center', width: '92%' },
  subtitle: { fontSize: 13, color: '#555' },
  bold: { fontWeight: '700', color: '#222' },
  scrollArea: { maxHeight: 340 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  rowInfo: { flex: 1, marginLeft: 4 },
  matName: { fontSize: 14, fontWeight: '600' },
  matMeta: { fontSize: 12, color: '#666', marginTop: 2 },
  emptyText: {
    fontSize: 14,
    color: '#888',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 16,
  },
});
