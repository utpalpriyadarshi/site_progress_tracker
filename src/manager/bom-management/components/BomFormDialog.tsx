import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import {
  Button,
  TextInput,
  Portal,
  Dialog,
  Text,
  Menu,
} from 'react-native-paper';
import BomModel from '../../../../models/BomModel';
import ProjectModel from '../../../../models/ProjectModel';
import { SITE_CATEGORIES } from '../utils/bomConstants';

interface BomFormDialogProps {
  visible: boolean;
  editingBom: BomModel | null;
  projects: ProjectModel[];
  bomName: string;
  setBomName: (value: string) => void;
  selectedProjectId: string;
  setSelectedProjectId: (value: string) => void;
  bomType: 'estimating' | 'execution';
  setBomType: (value: 'estimating' | 'execution') => void;
  siteCategory: string;
  setSiteCategory: (value: string) => void;
  quantity: string;
  setQuantity: (value: string) => void;
  unit: string;
  setUnit: (value: string) => void;
  description: string;
  setDescription: (value: string) => void;
  projectMenuVisible: boolean;
  setProjectMenuVisible: (value: boolean) => void;
  siteMenuVisible: boolean;
  setSiteMenuVisible: (value: boolean) => void;
  onDismiss: () => void;
  onSave: () => void;
}

/**
 * BomFormDialog - Dialog for adding/editing BOMs
 */
export const BomFormDialog: React.FC<BomFormDialogProps> = ({
  visible,
  editingBom,
  projects,
  bomName,
  setBomName,
  selectedProjectId,
  setSelectedProjectId,
  bomType,
  setBomType,
  siteCategory,
  setSiteCategory,
  quantity,
  setQuantity,
  unit,
  setUnit,
  description,
  setDescription,
  projectMenuVisible,
  setProjectMenuVisible,
  siteMenuVisible,
  setSiteMenuVisible,
  onDismiss,
  onSave,
}) => {
  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={styles.dialog}>
        <Dialog.Title>{editingBom ? 'Edit BOM' : 'Add New BOM'}</Dialog.Title>
        <Dialog.ScrollArea>
          <ScrollView>
            <TextInput
              label="BOM Name *"
              value={bomName}
              onChangeText={setBomName}
              mode="outlined"
              style={styles.input}
            />

            {/* Project Selection - Dropdown */}
            {projects.length > 0 && (
              <View style={styles.dropdownContainer}>
                <Text variant="labelLarge" style={styles.label}>Select Project *</Text>
                <Menu
                  visible={projectMenuVisible}
                  onDismiss={() => setProjectMenuVisible(false)}
                  anchor={
                    <Button
                      mode="outlined"
                      onPress={() => setProjectMenuVisible(true)}
                      icon="chevron-down"
                      contentStyle={{ flexDirection: 'row-reverse' }}
                      style={styles.dropdownButton}
                    >
                      {projects.find(p => p.id === selectedProjectId)?.name || 'Select Project'}
                    </Button>
                  }
                >
                  {projects.map((project) => (
                    <Menu.Item
                      key={project.id}
                      onPress={() => {
                        setSelectedProjectId(project.id);
                        setProjectMenuVisible(false);
                      }}
                      title={project.name}
                      leadingIcon={selectedProjectId === project.id ? 'check' : undefined}
                    />
                  ))}
                </Menu>
              </View>
            )}

            {!editingBom && (
              <View style={styles.typeSelector}>
                <Text variant="labelLarge" style={styles.label}>BOM Type *</Text>
                <View style={styles.typeButtons}>
                  <Button
                    mode={bomType === 'estimating' ? 'contained' : 'outlined'}
                    onPress={() => setBomType('estimating')}
                    style={styles.typeButton}
                  >
                    Estimating
                  </Button>
                  <Button
                    mode={bomType === 'execution' ? 'contained' : 'outlined'}
                    onPress={() => setBomType('execution')}
                    style={styles.typeButton}
                  >
                    Execution
                  </Button>
                </View>
              </View>
            )}

            {/* Site Category - Dropdown */}
            <View style={styles.dropdownContainer}>
              <Text variant="labelLarge" style={styles.label}>Site Category *</Text>
              <Menu
                visible={siteMenuVisible}
                onDismiss={() => setSiteMenuVisible(false)}
                anchor={
                  <Button
                    mode="outlined"
                    onPress={() => setSiteMenuVisible(true)}
                    icon="chevron-down"
                    contentStyle={{ flexDirection: 'row-reverse' }}
                    style={styles.dropdownButton}
                  >
                    {siteCategory || 'Select Site Category'}
                  </Button>
                }
              >
                {SITE_CATEGORIES.map((category) => (
                  <Menu.Item
                    key={category}
                    onPress={() => {
                      setSiteCategory(category);
                      setSiteMenuVisible(false);
                    }}
                    title={category}
                    leadingIcon={siteCategory === category ? 'check' : undefined}
                  />
                ))}
              </Menu>
            </View>

            <View style={styles.row}>
              <TextInput
                label="Quantity *"
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="numeric"
                mode="outlined"
                style={[styles.input, styles.halfInput]}
              />
              <TextInput
                label="Unit *"
                value={unit}
                onChangeText={setUnit}
                mode="outlined"
                placeholder="nos, floors, etc."
                style={[styles.input, styles.halfInput]}
              />
            </View>

            <TextInput
              label="Description"
              value={description}
              onChangeText={setDescription}
              mode="outlined"
              multiline
              numberOfLines={3}
              style={styles.input}
            />
          </ScrollView>
        </Dialog.ScrollArea>
        <Dialog.Actions>
          <Button onPress={onDismiss}>Cancel</Button>
          <Button onPress={onSave}>
            {editingBom ? 'Update' : 'Create'}
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
  typeSelector: {
    marginBottom: 12,
  },
  typeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  typeButton: {
    flex: 1,
  },
  dropdownContainer: {
    marginBottom: 12,
  },
  dropdownButton: {
    marginTop: 4,
    justifyContent: 'flex-start',
  },
});
