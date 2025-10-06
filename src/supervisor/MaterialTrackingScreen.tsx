import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { withObservables } from '@nozbe/watermelondb/react';
import { database } from '../../models/database';
import { Q } from '@nozbe/watermelondb';
import { useSiteContext } from './context/SiteContext';
import SiteSelector from './components/SiteSelector';
import MaterialModel from '../../models/MaterialModel';
import ItemModel from '../../models/ItemModel';
import { Portal, Dialog, Button, TextInput, Menu, IconButton } from 'react-native-paper';

// Sample Material Tracking screen for construction supervisors
const MaterialTrackingScreenComponent = ({
  materials,
  items,
}: {
  materials: MaterialModel[];
  items: ItemModel[];
}) => {
  const { selectedSiteId } = useSiteContext();
  const [filteredMaterials, setFilteredMaterials] = useState<MaterialModel[]>([]);

  // Dialog state
  const [dialogVisible, setDialogVisible] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<MaterialModel | null>(null);

  // Form state
  const [materialName, setMaterialName] = useState('');
  const [selectedItemId, setSelectedItemId] = useState('');
  const [quantityRequired, setQuantityRequired] = useState('');
  const [quantityAvailable, setQuantityAvailable] = useState('');
  const [quantityUsed, setQuantityUsed] = useState('');
  const [unit, setUnit] = useState('');
  const [status, setStatus] = useState('ordered');
  const [supplier, setSupplier] = useState('');

  // Menu states
  const [itemMenuVisible, setItemMenuVisible] = useState(false);
  const [statusMenuVisible, setStatusMenuVisible] = useState(false);

  const statusOptions = ['ordered', 'delivered', 'in_use', 'shortage'];

  // Filter materials based on selected site
  useEffect(() => {
    if (selectedSiteId === 'all') {
      setFilteredMaterials(materials);
    } else {
      // Get items for selected site
      const siteItems = items.filter(item => item.siteId === selectedSiteId);
      const siteItemIds = siteItems.map(item => item.id);

      // Filter materials that belong to items of the selected site
      const siteMaterials = materials.filter(material =>
        siteItemIds.includes(material.itemId)
      );
      setFilteredMaterials(siteMaterials);
    }
  }, [materials, items, selectedSiteId]);

  // Get items for current site
  const getSiteItems = (): ItemModel[] => {
    if (selectedSiteId === 'all') {
      return items;
    }
    return items.filter(item => item.siteId === selectedSiteId);
  };

  // Reset form
  const resetForm = () => {
    setMaterialName('');
    setSelectedItemId('');
    setQuantityRequired('');
    setQuantityAvailable('');
    setQuantityUsed('');
    setUnit('');
    setStatus('ordered');
    setSupplier('');
    setEditingMaterial(null);
  };

  // Open dialog for adding
  const openAddDialog = () => {
    if (selectedSiteId === 'all') {
      Alert.alert('Select a Site', 'Please select a specific site to add materials.');
      return;
    }
    const siteItems = getSiteItems();
    if (siteItems.length === 0) {
      Alert.alert('No Items', 'Please create items for this site first before adding materials.');
      return;
    }
    resetForm();
    setDialogVisible(true);
  };

  // Open dialog for editing
  const openEditDialog = (material: MaterialModel) => {
    setEditingMaterial(material);
    setMaterialName(material.name);
    setSelectedItemId(material.itemId);
    setQuantityRequired(material.quantityRequired.toString());
    setQuantityAvailable(material.quantityAvailable.toString());
    setQuantityUsed(material.quantityUsed.toString());
    setUnit(material.unit);
    setStatus(material.status);
    setSupplier(material.supplier || '');
    setDialogVisible(true);
  };

  // Close dialog
  const closeDialog = () => {
    setDialogVisible(false);
    resetForm();
  };

  // Create material
  const handleCreateMaterial = async () => {
    if (!materialName.trim() || !selectedItemId || !quantityRequired || !unit) {
      Alert.alert('Validation Error', 'Please fill in all required fields.');
      return;
    }

    try {
      await database.write(async () => {
        await database.collections.get('materials').create((material: any) => {
          material.name = materialName.trim();
          material.itemId = selectedItemId;
          material.quantityRequired = parseFloat(quantityRequired) || 0;
          material.quantityAvailable = parseFloat(quantityAvailable) || 0;
          material.quantityUsed = parseFloat(quantityUsed) || 0;
          material.unit = unit;
          material.status = status;
          material.supplier = supplier.trim();
          material.procurementManagerId = 'procurement-1'; // Default
        });
      });
      Alert.alert('Success', 'Material created successfully!');
      closeDialog();
    } catch (error) {
      console.error('Error creating material:', error);
      Alert.alert('Error', 'Failed to create material.');
    }
  };

  // Update material
  const handleUpdateMaterial = async () => {
    if (!editingMaterial || !materialName.trim() || !selectedItemId || !quantityRequired || !unit) {
      Alert.alert('Validation Error', 'Please fill in all required fields.');
      return;
    }

    try {
      await database.write(async () => {
        await editingMaterial.update((material: any) => {
          material.name = materialName.trim();
          material.itemId = selectedItemId;
          material.quantityRequired = parseFloat(quantityRequired) || 0;
          material.quantityAvailable = parseFloat(quantityAvailable) || 0;
          material.quantityUsed = parseFloat(quantityUsed) || 0;
          material.unit = unit;
          material.status = status;
          material.supplier = supplier.trim();
        });
      });
      Alert.alert('Success', 'Material updated successfully!');
      closeDialog();
    } catch (error) {
      console.error('Error updating material:', error);
      Alert.alert('Error', 'Failed to update material.');
    }
  };

  // Delete material
  const handleDeleteMaterial = (material: MaterialModel) => {
    Alert.alert(
      'Delete Material',
      `Are you sure you want to delete "${material.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await database.write(async () => {
                await material.markAsDeleted();
              });
              Alert.alert('Success', 'Material deleted successfully.');
            } catch (error) {
              console.error('Error deleting material:', error);
              Alert.alert('Error', 'Failed to delete material.');
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (material: MaterialModel): string => {
    const availablePercent = (material.quantityAvailable / material.quantityRequired) * 100;
    if (availablePercent < 50) return 'shortage';
    if (availablePercent < 80) return 'low';
    return 'ok';
  };

  const renderMaterial = ({ item }: { item: MaterialModel }) => {
    const statusColor = getStatusColor(item);

    return (
      <View style={[
        styles.materialItem,
        statusColor === 'shortage' && styles.shortage,
        statusColor === 'low' && styles.low,
        statusColor === 'ok' && styles.ok
      ]}>
        <View style={styles.materialInfo}>
          <Text style={styles.materialName}>{item.name}</Text>
          <Text style={styles.materialDetails}>
            Required: {item.quantityRequired} {item.unit} | Available: {item.quantityAvailable} {item.unit} | Used: {item.quantityUsed} {item.unit}
          </Text>
          {item.supplier && (
            <Text style={styles.supplierText}>Supplier: {item.supplier}</Text>
          )}
          <Text style={[styles.statusText, statusColor === 'shortage' && styles.shortageText]}>
            Status: {item.status}
          </Text>
        </View>
        <View style={styles.actionButtons}>
          <IconButton
            icon="pencil"
            size={20}
            iconColor="#007AFF"
            onPress={() => openEditDialog(item)}
          />
          <IconButton
            icon="delete"
            size={20}
            iconColor="#FF3B30"
            onPress={() => handleDeleteMaterial(item)}
          />
        </View>
      </View>
    );
  };

  const siteItems = getSiteItems();
  const selectedItem = siteItems.find(item => item.id === selectedItemId);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Material Tracking</Text>
        <Text style={styles.subtitle}>Track material usage and identify shortages</Text>
      </View>

      {/* Site Selector */}
      <View style={styles.selectorContainer}>
        <SiteSelector />
      </View>

      {/* Add Material Button */}
      <View style={styles.addButtonContainer}>
        <Button
          mode="contained"
          icon="plus"
          onPress={openAddDialog}
          style={styles.addButton}
          disabled={selectedSiteId === 'all'}
        >
          Add Material
        </Button>
      </View>

      {filteredMaterials.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No materials found for selected site</Text>
          {selectedSiteId !== 'all' && (
            <Text style={styles.emptyHint}>Tap "Add Material" to create one</Text>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredMaterials}
          renderItem={renderMaterial}
          keyExtractor={item => item.id}
          style={styles.list}
        />
      )}

      {/* Add/Edit Material Dialog */}
      <Portal>
        <Dialog visible={dialogVisible} onDismiss={closeDialog} style={styles.dialog}>
          <Dialog.Title>{editingMaterial ? 'Edit Material' : 'Add Material'}</Dialog.Title>
          <Dialog.ScrollArea>
            <ScrollView>
              <TextInput
                label="Material Name *"
                value={materialName}
                onChangeText={setMaterialName}
                mode="outlined"
                style={styles.input}
              />

              {/* Item Selection */}
              <Menu
                visible={itemMenuVisible}
                onDismiss={() => setItemMenuVisible(false)}
                anchor={
                  <Button
                    mode="outlined"
                    onPress={() => setItemMenuVisible(true)}
                    style={styles.input}
                  >
                    {selectedItem ? selectedItem.name : 'Select Item *'}
                  </Button>
                }
              >
                {siteItems.map((item) => (
                  <Menu.Item
                    key={item.id}
                    onPress={() => {
                      setSelectedItemId(item.id);
                      setItemMenuVisible(false);
                    }}
                    title={item.name}
                  />
                ))}
              </Menu>

              <TextInput
                label="Quantity Required *"
                value={quantityRequired}
                onChangeText={setQuantityRequired}
                keyboardType="numeric"
                mode="outlined"
                style={styles.input}
              />

              <TextInput
                label="Quantity Available"
                value={quantityAvailable}
                onChangeText={setQuantityAvailable}
                keyboardType="numeric"
                mode="outlined"
                style={styles.input}
              />

              <TextInput
                label="Quantity Used"
                value={quantityUsed}
                onChangeText={setQuantityUsed}
                keyboardType="numeric"
                mode="outlined"
                style={styles.input}
              />

              <TextInput
                label="Unit (e.g., m³, tons, bags) *"
                value={unit}
                onChangeText={setUnit}
                mode="outlined"
                style={styles.input}
              />

              {/* Status Selection */}
              <Menu
                visible={statusMenuVisible}
                onDismiss={() => setStatusMenuVisible(false)}
                anchor={
                  <Button
                    mode="outlined"
                    onPress={() => setStatusMenuVisible(true)}
                    style={styles.input}
                  >
                    Status: {status}
                  </Button>
                }
              >
                {statusOptions.map((statusOption) => (
                  <Menu.Item
                    key={statusOption}
                    onPress={() => {
                      setStatus(statusOption);
                      setStatusMenuVisible(false);
                    }}
                    title={statusOption}
                  />
                ))}
              </Menu>

              <TextInput
                label="Supplier"
                value={supplier}
                onChangeText={setSupplier}
                mode="outlined"
                style={styles.input}
              />
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={closeDialog}>Cancel</Button>
            <Button onPress={editingMaterial ? handleUpdateMaterial : handleCreateMaterial}>
              {editingMaterial ? 'Update' : 'Create'}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const enhance = withObservables([], () => ({
  materials: database.collections.get('materials').query(),
  items: database.collections.get('items').query(),
}));

const MaterialTrackingScreen = enhance(MaterialTrackingScreenComponent);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: 'white',
    padding: 16,
    elevation: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  selectorContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingBottom: 8,
    elevation: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyHint: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  list: {
    flex: 1,
    padding: 16,
  },
  materialItem: {
    backgroundColor: 'white',
    padding: 16,
    marginVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
  },
  shortage: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF3B30', // Red for shortage
  },
  low: {
    borderLeftWidth: 4,
    borderLeftColor: '#FFCC00', // Yellow for low
  },
  ok: {
    borderLeftWidth: 4,
    borderLeftColor: '#4CD964', // Green for OK
  },
  materialInfo: {
    flex: 1,
  },
  materialName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  materialDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  supplierText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#4CD964',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  shortageText: {
    color: '#FF3B30',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addButtonContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 8,
    elevation: 1,
  },
  addButton: {
    backgroundColor: '#007AFF',
  },
  dialog: {
    maxHeight: '80%',
  },
  input: {
    marginBottom: 12,
  },
});

export default MaterialTrackingScreen;