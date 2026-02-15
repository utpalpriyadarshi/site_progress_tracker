import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Portal, Dialog, Button, TextInput, Menu, Chip, HelperText, IconButton } from 'react-native-paper';
import { Site, DOORS_CATEGORIES } from '../types/DoorsPackageTypes';
import { DoorsPackageTemplate } from '../data/doorsPackageTemplates';

/** Common equipment types per category for quick-fill chips */
const EQUIPMENT_SUGGESTIONS: Record<string, { label: string; abbr: string; equipment: string; material?: string }[]> = {
  OHE: [
    { label: 'Contact Wire', abbr: 'CW', equipment: 'Contact Wire Assembly', material: 'Cu-Mg / Cu-Sn' },
    { label: 'Cantilever', abbr: 'CANT', equipment: 'Cantilever Assembly', material: 'Aluminium Alloy' },
    { label: 'Mast', abbr: 'MAST', equipment: 'OHE Mast', material: 'Steel' },
    { label: 'Dropper', abbr: 'DRP', equipment: 'Dropper Assembly', material: 'Copper' },
    { label: 'Insulator', abbr: 'INS', equipment: 'Insulator (9/25 kV)', material: 'Porcelain / Composite' },
    { label: 'Foundation', abbr: 'FDN', equipment: 'Mast Foundation', material: 'RCC' },
  ],
  TSS: [
    { label: 'Transformer', abbr: 'TRF', equipment: 'Power Transformer' },
    { label: 'Switchgear', abbr: 'SWG', equipment: 'HV Switchgear' },
    { label: 'CT/PT', abbr: 'CTPT', equipment: 'Current/Potential Transformer' },
    { label: 'Battery', abbr: 'BAT', equipment: 'Battery Bank & Charger' },
    { label: 'Isolator', abbr: 'ISO', equipment: 'Motorized Isolator' },
  ],
  SCADA: [
    { label: 'RTU', abbr: 'RTU', equipment: 'Remote Terminal Unit' },
    { label: 'HMI', abbr: 'HMI', equipment: 'HMI Workstation' },
    { label: 'Comm Switch', abbr: 'CSW', equipment: 'Communication Switch' },
    { label: 'Fiber Optic', abbr: 'FO', equipment: 'Fiber Optic System' },
  ],
  Cables: [
    { label: 'Power Cable', abbr: 'PWR', equipment: 'Power Cable', material: 'XLPE Insulated' },
    { label: 'Control Cable', abbr: 'CTL', equipment: 'Control Cable', material: 'PVC Insulated' },
    { label: 'Signal Cable', abbr: 'SIG', equipment: 'Signal Cable', material: 'Shielded Copper' },
    { label: 'OFC', abbr: 'OFC', equipment: 'Optical Fiber Cable' },
  ],
  Hardware: [
    { label: 'Fasteners', abbr: 'FST', equipment: 'Fasteners & Clamps', material: 'Stainless Steel / GI' },
    { label: 'Brackets', abbr: 'BRK', equipment: 'Mounting Brackets', material: 'Steel' },
    { label: 'Guy Wire', abbr: 'GUY', equipment: 'Guy Wire & Accessories', material: 'GI Steel' },
    { label: 'Earth Rod', abbr: 'ERD', equipment: 'Earthing Rod & Strip', material: 'Copper / GI' },
  ],
  Consumables: [
    { label: 'Welding', abbr: 'WLD', equipment: 'Welding Materials', material: 'Various' },
    { label: 'Paints', abbr: 'PNT', equipment: 'Anti-Corrosion Paint', material: 'Epoxy / Zinc' },
    { label: 'Lubricants', abbr: 'LUB', equipment: 'Lubricants & Greases' },
    { label: 'Tapes', abbr: 'TPE', equipment: 'Insulation Tape & Sealant' },
  ],
};

/** Derive abbreviation from equipment type: take uppercase first letter of each word */
function deriveAbbr(equipmentType: string): string {
  if (!equipmentType) return 'GEN';
  const words = equipmentType.replace(/[^a-zA-Z0-9\s]/g, '').trim().split(/\s+/);
  const abbr = words.map(w => w[0]?.toUpperCase() || '').join('');
  return abbr.slice(0, 4) || 'GEN';
}

/** Look up known abbreviation for an equipment type within a category */
function getEquipmentAbbr(category: string, equipmentType: string): string {
  const suggestions = EQUIPMENT_SUGGESTIONS[category];
  if (suggestions) {
    const match = suggestions.find(s => s.equipment === equipmentType);
    if (match) return match.abbr;
  }
  return deriveAbbr(equipmentType);
}

/** Generate next DOORS ID: DOORS-{CAT}-{EQUIP_ABBR}-{NNN} */
function generateDoorsId(category: string, equipAbbr: string, existingDoorsIds: string[]): string {
  if (!category) return '';
  const prefix = `DOORS-${category}-${equipAbbr}-`;
  const existingNumbers = existingDoorsIds
    .filter(id => id.startsWith(prefix))
    .map(id => {
      const suffix = id.slice(prefix.length);
      const num = parseInt(suffix, 10);
      return isNaN(num) ? 0 : num;
    });
  const nextNum = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
  return `${prefix}${String(nextNum).padStart(3, '0')}`;
}

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
  templates?: DoorsPackageTemplate[];
  onSelectTemplate?: (template: DoorsPackageTemplate) => void;
  existingDoorsIds?: string[];
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
  templates,
  onSelectTemplate,
  existingDoorsIds = [],
}) => {
  const [siteMenuVisible, setSiteMenuVisible] = useState(false);
  const [categoryMenuVisible, setCategoryMenuVisible] = useState(false);
  // Track whether user manually typed into DOORS ID field
  const [idManuallyEdited, setIdManuallyEdited] = useState(false);

  const openSiteMenu = () => setSiteMenuVisible(true);
  const closeSiteMenu = () => setSiteMenuVisible(false);

  const handleSiteSelect = (siteId: string) => {
    setNewSiteId(siteId);
    closeSiteMenu();
  };

  const handleCategorySelect = (category: string) => {
    setNewCategory(category);
    setCategoryMenuVisible(false);
    // Auto-generate DOORS ID when category is selected (not editing)
    if (!isEditing) {
      setIdManuallyEdited(false);
      const abbr = newEquipmentType ? getEquipmentAbbr(category, newEquipmentType) : 'GEN';
      setNewDoorsId(generateDoorsId(category, abbr, existingDoorsIds));
    }
  };

  const handleEquipmentQuickFill = (suggestion: { label: string; abbr: string; equipment: string; material?: string }) => {
    setNewEquipmentType(suggestion.equipment);
    if (suggestion.material) {
      setNewMaterialType(suggestion.material);
    }
    // Auto-update DOORS ID with specific equipment abbreviation
    if (!isEditing && !idManuallyEdited && newCategory) {
      setNewDoorsId(generateDoorsId(newCategory, suggestion.abbr, existingDoorsIds));
    }
  };

  const handleDoorsIdChange = (value: string) => {
    setIdManuallyEdited(true);
    setNewDoorsId(value);
  };

  const handleResetDoorsId = () => {
    if (newCategory) {
      setIdManuallyEdited(false);
      const abbr = newEquipmentType ? getEquipmentAbbr(newCategory, newEquipmentType) : 'GEN';
      setNewDoorsId(generateDoorsId(newCategory, abbr, existingDoorsIds));
    }
  };

  const selectedCategoryLabel = DOORS_CATEGORIES.find(c => c.value === newCategory)?.label || 'Select Category';

  const categoryTemplates = !isEditing && newCategory && templates
    ? templates.filter((t) => t.category === newCategory)
    : [];

  const equipmentSuggestions = newCategory ? (EQUIPMENT_SUGGESTIONS[newCategory] || []) : [];

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss}>
        <Dialog.Title>{isEditing ? 'Edit DOORS Package' : 'Create DOORS Package'}</Dialog.Title>
        <Dialog.Content style={styles.dialogContent}>
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator>
            {/* Site picker first */}
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

            {/* Category picker second */}
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

            {/* Auto-generated DOORS ID */}
            <View style={styles.doorsIdRow}>
              <TextInput
                label="DOORS ID *"
                value={newDoorsId}
                onChangeText={handleDoorsIdChange}
                style={styles.doorsIdInput}
                mode="outlined"
              />
              {idManuallyEdited && newCategory ? (
                <IconButton
                  icon="refresh"
                  size={20}
                  onPress={handleResetDoorsId}
                  style={styles.resetButton}
                />
              ) : null}
            </View>
            {!isEditing && newCategory ? (
              <HelperText type="info" visible>
                Auto-generated. Pick equipment below to refine.
              </HelperText>
            ) : null}
            {!newCategory && !isEditing ? (
              <HelperText type="info" visible>
                Select category & equipment to auto-generate
              </HelperText>
            ) : null}

            {/* Quick-fill templates */}
            {categoryTemplates.length > 0 && onSelectTemplate && (
              <View style={styles.templateSection}>
                <Text style={styles.sectionLabel}>Quick-fill template:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                  {categoryTemplates.map((tpl) => (
                    <Chip
                      key={tpl.id}
                      mode="outlined"
                      onPress={() => {
                        onSelectTemplate(tpl);
                        // Also auto-generate DOORS ID using template's equipment
                        if (!isEditing && !idManuallyEdited) {
                          const abbr = getEquipmentAbbr(tpl.category, tpl.equipmentType);
                          setNewDoorsId(generateDoorsId(tpl.category, abbr, existingDoorsIds));
                        }
                      }}
                      style={styles.templateChip}
                      compact
                      icon="flash"
                    >
                      {tpl.name}
                    </Chip>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Equipment type with quick-fill suggestions */}
            <TextInput
              label="Equipment Type *"
              value={newEquipmentType}
              onChangeText={setNewEquipmentType}
              style={styles.input}
              mode="outlined"
            />
            {equipmentSuggestions.length > 0 && (
              <View style={styles.suggestionsSection}>
                <Text style={styles.sectionLabel}>Quick pick:</Text>
                <View style={styles.chipWrap}>
                  {equipmentSuggestions.map((s) => (
                    <Chip
                      key={s.label}
                      mode={newEquipmentType === s.equipment ? 'flat' : 'outlined'}
                      selected={newEquipmentType === s.equipment}
                      onPress={() => handleEquipmentQuickFill(s)}
                      style={styles.suggestionChip}
                      compact
                    >
                      {s.label}
                    </Chip>
                  ))}
                </View>
              </View>
            )}

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
            <Text style={styles.infoText}>Typical range: 50-200 requirements per package</Text>
          </ScrollView>
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
  dialogContent: {
    maxHeight: 420,
    paddingBottom: 0,
  },
  scrollView: {
    flexGrow: 0,
  },
  input: {
    marginBottom: 12,
  },
  doorsIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  doorsIdInput: {
    flex: 1,
    marginBottom: 0,
  },
  resetButton: {
    marginLeft: 4,
    marginTop: 4,
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
    marginBottom: 8,
  },
  templateSection: {
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
    fontWeight: '500',
  },
  chipScroll: {
    flexDirection: 'row',
  },
  templateChip: {
    marginRight: 8,
  },
  suggestionsSection: {
    marginBottom: 12,
    marginTop: -4,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  suggestionChip: {
    marginBottom: 2,
  },
});

export default CreateDoorsPackageDialog;
