import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Modal, Portal, Button, Text, Checkbox, Searchbar } from 'react-native-paper';
import ItemModel from '../../../models/ItemModel';
import { database } from '../../../models/database';
import PlanningService from '../../../services/planning/PlanningService';

interface DependencyModalProps {
  visible: boolean;
  item: ItemModel;
  allItems: ItemModel[];
  onClose: () => void;
  onSave: () => void;
}

const DependencyModal: React.FC<DependencyModalProps> = ({
  visible,
  item,
  allItems,
  onClose,
  onSave,
}) => {
  const [selectedDeps, setSelectedDeps] = useState<Set<string>>(
    new Set(item.getDependencies())
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleToggleDependency = (itemId: string) => {
    const newDeps = new Set(selectedDeps);
    if (newDeps.has(itemId)) {
      newDeps.delete(itemId);
    } else {
      newDeps.add(itemId);
    }
    setSelectedDeps(newDeps);
  };

  const handleSave = async () => {
    console.log('[DependencyModal] Save button clicked');
    console.log('[DependencyModal] Item:', item.name, 'ID:', item.id);
    console.log('[DependencyModal] Selected dependencies:', Array.from(selectedDeps));

    setIsSaving(true);
    try {
      // Validate dependencies for circular references
      // Create plain objects for validation (not WatermelonDB models)
      const testItems = allItems.map(i => {
        const plainItem = {
          id: i.id,
          name: i.name,
          dependencies: i.id === item.id ? JSON.stringify(Array.from(selectedDeps)) : i.dependencies,
          getDependencies: function() {
            if (!this.dependencies) return [];
            try {
              return JSON.parse(this.dependencies);
            } catch {
              return [];
            }
          }
        };
        return plainItem as ItemModel;
      });

      console.log('[DependencyModal] Validating dependencies...');
      const validation = PlanningService.validateDependencies(testItems);
      console.log('[DependencyModal] Validation result:', validation);

      if (!validation.valid) {
        console.log('[DependencyModal] Validation failed:', validation.errors);
        Alert.alert(
          'Invalid Dependencies',
          `Cannot save: ${validation.errors.join(', ')}`,
          [{ text: 'OK' }]
        );
        return;
      }

      // Save dependencies
      console.log('[DependencyModal] Saving to database...');
      const itemToUpdate = await database.collections.get<ItemModel>('items').find(item.id);
      await database.write(async () => {
        await itemToUpdate.update(i => {
          i.dependencies = JSON.stringify(Array.from(selectedDeps));
        });
      });

      console.log('[DependencyModal] Save successful, calling callbacks...');
      onSave();
      onClose();

      Alert.alert('Success', `Dependencies saved for ${item.name}`);
    } catch (error) {
      console.error('[DependencyModal] Error saving dependencies:', error);
      Alert.alert('Error', `Failed to save dependencies: ${error.message || error}`);
    } finally {
      setIsSaving(false);
    }
  };

  const availableItems = allItems.filter(i => {
    // Exclude current item
    if (i.id === item.id) return false;

    // Filter by search query
    if (searchQuery && !i.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    return true;
  });

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onClose}
        contentContainerStyle={styles.modalContainer}
      >
        <View style={styles.header}>
          <Text variant="headlineSmall" style={styles.title}>
            Manage Dependencies
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            {item.name}
          </Text>
        </View>

        <Text variant="bodySmall" style={styles.helpText}>
          Select items that must be completed before this item can start
        </Text>

        <Searchbar
          placeholder="Search items..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />

        <ScrollView style={styles.itemsList}>
          {availableItems.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text variant="bodyMedium" style={styles.emptyText}>
                No items available
              </Text>
            </View>
          ) : (
            availableItems.map(availableItem => (
              <View key={availableItem.id} style={styles.itemRow}>
                <Checkbox.Item
                  label={availableItem.name}
                  status={selectedDeps.has(availableItem.id) ? 'checked' : 'unchecked'}
                  onPress={() => handleToggleDependency(availableItem.id)}
                  labelStyle={styles.checkboxLabel}
                />
                <Text variant="bodySmall" style={styles.itemDetails}>
                  {new Date(availableItem.plannedStartDate).toLocaleDateString()} -{' '}
                  {new Date(availableItem.plannedEndDate).toLocaleDateString()}
                </Text>
              </View>
            ))
          )}
        </ScrollView>

        <View style={styles.footer}>
          <Text variant="bodySmall" style={styles.countText}>
            {selectedDeps.size} dependencies selected
          </Text>
          <View style={styles.buttonRow}>
            <Button
              mode="outlined"
              onPress={onClose}
              style={styles.button}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleSave}
              style={styles.button}
              loading={isSaving}
              disabled={isSaving}
            >
              Save
            </Button>
          </View>
        </View>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 8,
    maxHeight: '80%',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    color: '#666',
  },
  helpText: {
    padding: 16,
    paddingBottom: 8,
    color: '#666',
    fontStyle: 'italic',
  },
  searchbar: {
    margin: 16,
    marginTop: 8,
  },
  itemsList: {
    maxHeight: 300,
  },
  itemRow: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  checkboxLabel: {
    fontSize: 14,
  },
  itemDetails: {
    paddingLeft: 56,
    paddingBottom: 8,
    color: '#999',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#999',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  countText: {
    color: '#666',
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  button: {
    minWidth: 100,
  },
});

export default DependencyModal;
