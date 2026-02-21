import React from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import {
  Button,
  TextInput,
  Portal,
  Dialog,
  Text,
  Chip,
} from 'react-native-paper';
import BomItemModel from '../../../../models/BomItemModel';
import { ITEM_CATEGORIES } from '../utils/bomConstants';

interface BomItemFormDialogProps {
  visible: boolean;
  editingItem: BomItemModel | null;
  itemDescription: string;
  setItemDescription: (value: string) => void;
  itemCategory: 'material' | 'labor' | 'equipment' | 'subcontractor';
  setItemCategory: (value: 'material' | 'labor' | 'equipment' | 'subcontractor') => void;
  itemQuantity: string;
  setItemQuantity: (value: string) => void;
  itemUnit: string;
  setItemUnit: (value: string) => void;
  itemUnitCost: string;
  setItemUnitCost: (value: string) => void;
  itemPhase: string;
  setItemPhase: (value: string) => void;
  onDismiss: () => void;
  onSave: () => void;
}

/**
 * BomItemFormDialog - Dialog for adding/editing BOM items
 */
export const BomItemFormDialog: React.FC<BomItemFormDialogProps> = ({
  visible,
  editingItem,
  itemDescription,
  setItemDescription,
  itemCategory,
  setItemCategory,
  itemQuantity,
  setItemQuantity,
  itemUnit,
  setItemUnit,
  itemUnitCost,
  setItemUnitCost,
  itemPhase,
  setItemPhase,
  onDismiss,
  onSave,
}) => {
  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={styles.dialog}>
        <Dialog.Title>{editingItem ? 'Edit Item' : 'Add Item'}</Dialog.Title>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
        >
        <Dialog.ScrollArea>
          <ScrollView>
            <TextInput
              label="Description *"
              value={itemDescription}
              onChangeText={setItemDescription}
              mode="outlined"
              multiline
              numberOfLines={2}
              placeholder="e.g., Portland Cement OPC 53"
              style={styles.input}
            />

            <View style={styles.categorySelector}>
              <Text variant="labelLarge" style={styles.label}>Category *</Text>
              <View style={styles.categoryButtons}>
                {ITEM_CATEGORIES.map((cat) => (
                  <Chip
                    key={cat}
                    mode={itemCategory === cat ? 'flat' : 'outlined'}
                    selected={itemCategory === cat}
                    onPress={() => setItemCategory(cat as any)}
                    style={styles.categoryChipButton}
                  >
                    {cat}
                  </Chip>
                ))}
              </View>
            </View>

            <View style={styles.row}>
              <TextInput
                label="Quantity *"
                value={itemQuantity}
                onChangeText={setItemQuantity}
                keyboardType="numeric"
                mode="outlined"
                style={[styles.input, styles.halfInput]}
              />
              <TextInput
                label="Unit *"
                value={itemUnit}
                onChangeText={setItemUnit}
                mode="outlined"
                placeholder="kg, m3, etc."
                style={[styles.input, styles.halfInput]}
              />
            </View>

            <TextInput
              label="Unit Cost *"
              value={itemUnitCost}
              onChangeText={setItemUnitCost}
              keyboardType="numeric"
              mode="outlined"
              style={styles.input}
            />

            <TextInput
              label="Phase (Optional)"
              value={itemPhase}
              onChangeText={setItemPhase}
              mode="outlined"
              placeholder="foundation, structure, etc."
              style={styles.input}
            />
          </ScrollView>
        </Dialog.ScrollArea>
        </KeyboardAvoidingView>
        <Dialog.Actions>
          <Button onPress={onDismiss}>Cancel</Button>
          <Button onPress={onSave}>
            {editingItem ? 'Update' : 'Add'}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

const styles = StyleSheet.create({
  dialog: {
    maxHeight: '90%',
  },
  input: {
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  halfInput: {
    flex: 1,
  },
  label: {
    marginBottom: 8,
  },
  categorySelector: {
    marginBottom: 12,
  },
  categoryButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChipButton: {
    marginRight: 4,
  },
});
