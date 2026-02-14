import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Portal, Dialog, Button, TextInput, Menu } from 'react-native-paper';
import { Site, DOORS_CATEGORIES } from '../types/DoorsPackageTypes';

interface CreateDoorsPackageDialogProps {
  visible: boolean;
  onDismiss: () => void;
  onCreate: () => void;
  isEditing?: boolean;
  sites: Site[];
  newDoorsId: string;
  setNewDoorsId: (value: string) => void;
  newSiteId: string;
  setNewSiteId: (value: string) => void;
  newEquipmentType: string;
  setNewEquipmentType: (value: string) => void;
  newMaterialType: string;
  setNewMaterialType: (value: string) => void;
  newCategory: string;
  setNewCategory: (value: string) => void;
  newTotalRequirements: string;
  setNewTotalRequirements: (value: string) => void;
}

const CreateDoorsPackageDialog: React.FC<CreateDoorsPackageDialogProps> = ({
  visible,
  onDismiss,
  onCreate,
  isEditing = false,
  sites,
  newDoorsId,
  setNewDoorsId,
  newSiteId,
  setNewSiteId,
  newEquipmentType,
  setNewEquipmentType,
  newMaterialType,
  setNewMaterialType,
  newCategory,
  setNewCategory,
  newTotalRequirements,
  setNewTotalRequirements,
}) => {
  const [siteMenuVisible, setSiteMenuVisible] = useState(false);
  const [categoryMenuVisible, setCategoryMenuVisible] = useState(false);

  const openSiteMenu = () => setSiteMenuVisible(true);
  const closeSiteMenu = () => setSiteMenuVisible(false);

  const handleSiteSelect = (siteId: string) => {
    setNewSiteId(siteId);
    closeSiteMenu();
  };

  const handleCategorySelect = (category: string) => {
    setNewCategory(category);
    setCategoryMenuVisible(false);
  };

  const selectedCategoryLabel = DOORS_CATEGORIES.find(c => c.value === newCategory)?.label || 'Select Category';

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss}>
        <Dialog.Title>{isEditing ? 'Edit DOORS Package' : 'Create DOORS Package'}</Dialog.Title>
        <Dialog.Content>
          <TextInput
            label="DOORS ID *"
            value={newDoorsId}
            onChangeText={setNewDoorsId}
            style={styles.input}
            mode="outlined"
          />
          <Menu
            visible={siteMenuVisible}
            onDismiss={closeSiteMenu}
            anchor={
              <TouchableOpacity onPress={openSiteMenu} style={styles.pickerButton}>
                <Text style={styles.pickerLabel}>Site *</Text>
                <Text style={styles.pickerValue}>
                  {sites.find((s) => s.id === newSiteId)?.name || 'Select Site'}
                </Text>
              </TouchableOpacity>
            }
          >
            {sites.map((site) => (
              <Menu.Item key={site.id} onPress={() => handleSiteSelect(site.id)} title={site.name} />
            ))}
          </Menu>
          <Menu
            visible={categoryMenuVisible}
            onDismiss={() => setCategoryMenuVisible(false)}
            anchor={
              <TouchableOpacity onPress={() => setCategoryMenuVisible(true)} style={styles.pickerButton}>
                <Text style={styles.pickerLabel}>Category *</Text>
                <Text style={styles.pickerValue}>{selectedCategoryLabel}</Text>
              </TouchableOpacity>
            }
          >
            {DOORS_CATEGORIES.map((cat) => (
              <Menu.Item key={cat.value} onPress={() => handleCategorySelect(cat.value)} title={cat.label} />
            ))}
          </Menu>
          <TextInput
            label="Equipment Type *"
            value={newEquipmentType}
            onChangeText={setNewEquipmentType}
            style={styles.input}
            mode="outlined"
          />
          <TextInput
            label="Material Type (Optional)"
            value={newMaterialType}
            onChangeText={setNewMaterialType}
            style={styles.input}
            mode="outlined"
          />
          <TextInput
            label="Total Requirements"
            value={newTotalRequirements}
            onChangeText={setNewTotalRequirements}
            style={styles.input}
            mode="outlined"
            keyboardType="numeric"
            placeholder="100"
          />
          <Text style={styles.infoText}>Typical range: 50–200 requirements per package</Text>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss}>Cancel</Button>
          <Button onPress={onCreate}>{isEditing ? 'Save' : 'Create'}</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

const styles = StyleSheet.create({
  input: {
    marginBottom: 12,
  },
  pickerButton: {
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 4,
    padding: 12,
    marginBottom: 12,
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
  infoText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 8,
  },
});

export default CreateDoorsPackageDialog;
