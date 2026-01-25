import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Modal, Portal, Button, Text, Checkbox, Searchbar } from 'react-native-paper';
import ItemModel from '../../../models/ItemModel';
import { database } from '../../../models/database';
import PlanningService from '../../../services/planning/PlanningService';
import { useSnackbar } from '../../components/Snackbar';
import { logger } from '../../services/LoggingService';

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
  const { showSnackbar } = useSnackbar();
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
    logger.debug('[DependencyModal] Save button clicked', { itemName: item.name, itemId: item.id, selectedDeps: Array.from(selectedDeps) });

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
            } catch (parseError) {
              logger.warn('[DependencyModal] Failed to parse dependencies JSON', {
                component: 'DependencyModal',
                action: 'getDependencies',
                itemId: this.id,
                rawValue: this.dependencies,
              });
              return [];
            }
          }
        };
        return plainItem as ItemModel;
      });

      logger.debug('[DependencyModal] Validating dependencies');
      const validation = PlanningService.validateDependencies(testItems);
      logger.debug('[DependencyModal] Validation result', { validation });

      if (!validation.valid) {
        logger.debug('[DependencyModal] Validation failed', { errors: validation.errors });
        showSnackbar(`Cannot save: ${validation.errors.join(', ')}`, 'error');
        return;
      }

      // Save dependencies
      logger.debug('[DependencyModal] Saving to database');
      const itemToUpdate = await database.collections.get<ItemModel>('items').find(item.id);
      await database.write(async () => {
        await itemToUpdate.update(i => {
          i.dependencies = JSON.stringify(Array.from(selectedDeps));
        });
      });

      logger.debug('[DependencyModal] Save successful, calling callbacks');
      onSave();
      onClose();

      showSnackbar(`Dependencies saved for ${item.name}`, 'success');
    } catch (error) {
      logger.error('[DependencyModal] Error saving dependencies', error as Error);
      showSnackbar(`Failed to save dependencies: ${(error as Error).message || error}`, 'error');
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
            availableItems.map(availableItem => {
              // Safe date formatting with null checks
              const startDate = availableItem.plannedStartDate
                ? new Date(availableItem.plannedStartDate).toLocaleDateString()
                : 'Not set';
              const endDate = availableItem.plannedEndDate
                ? new Date(availableItem.plannedEndDate).toLocaleDateString()
                : 'Not set';

              return (
                <View key={availableItem.id} style={styles.itemRow}>
                  <Checkbox.Item
                    label={availableItem.name}
                    status={selectedDeps.has(availableItem.id) ? 'checked' : 'unchecked'}
                    onPress={() => handleToggleDependency(availableItem.id)}
                    labelStyle={styles.checkboxLabel}
                  />
                  <Text variant="bodySmall" style={styles.itemDetails}>
                    {startDate} - {endDate}
                  </Text>
                </View>
              );
            })
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
