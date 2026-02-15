import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Portal, Dialog, Button, Checkbox, Menu } from 'react-native-paper';
import { DoorsPackage, Site } from '../types/DoorsPackageTypes';

interface CopyDoorsPackagesDialogProps {
  visible: boolean;
  onDismiss: () => void;
  onCopy: (selectedIds: string[], targetSiteId: string) => void;
  packages: DoorsPackage[];
  sites: Site[];
  currentSiteId?: string;
}

const CopyDoorsPackagesDialog: React.FC<CopyDoorsPackagesDialogProps> = ({
  visible,
  onDismiss,
  onCopy,
  packages,
  sites,
  currentSiteId,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [targetSiteId, setTargetSiteId] = useState('');
  const [siteMenuVisible, setSiteMenuVisible] = useState(false);

  const availableSites = sites.filter((s) => s.id !== currentSiteId);
  const selectedSiteName = availableSites.find((s) => s.id === targetSiteId)?.name || 'Select Target Site';

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedIds.length === packages.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(packages.map((p) => p.id));
    }
  };

  const handleCopy = () => {
    onCopy(selectedIds, targetSiteId);
    setSelectedIds([]);
    setTargetSiteId('');
  };

  const handleDismiss = () => {
    setSelectedIds([]);
    setTargetSiteId('');
    onDismiss();
  };

  const canCopy = selectedIds.length > 0 && targetSiteId !== '';

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={handleDismiss} style={styles.dialog}>
        <Dialog.Title>Copy Packages to Another Site</Dialog.Title>
        <Dialog.Content>
          <Menu
            visible={siteMenuVisible}
            onDismiss={() => setSiteMenuVisible(false)}
            anchor={
              <TouchableOpacity
                onPress={() => setSiteMenuVisible(true)}
                style={styles.pickerButton}
              >
                <Text style={styles.pickerLabel}>Target Site *</Text>
                <Text style={styles.pickerValue}>{selectedSiteName}</Text>
              </TouchableOpacity>
            }
          >
            {availableSites.map((site) => (
              <Menu.Item
                key={site.id}
                onPress={() => {
                  setTargetSiteId(site.id);
                  setSiteMenuVisible(false);
                }}
                title={site.name}
              />
            ))}
          </Menu>

          <TouchableOpacity onPress={toggleAll} style={styles.selectAllRow}>
            <Checkbox
              status={
                selectedIds.length === packages.length && packages.length > 0
                  ? 'checked'
                  : selectedIds.length > 0
                  ? 'indeterminate'
                  : 'unchecked'
              }
              onPress={toggleAll}
            />
            <Text style={styles.selectAllText}>
              {selectedIds.length === packages.length ? 'Deselect All' : 'Select All'}
            </Text>
          </TouchableOpacity>

          <ScrollView style={styles.packageList}>
            {packages.map((pkg) => (
              <TouchableOpacity
                key={pkg.id}
                onPress={() => toggleSelection(pkg.id)}
                style={styles.packageRow}
              >
                <Checkbox
                  status={selectedIds.includes(pkg.id) ? 'checked' : 'unchecked'}
                  onPress={() => toggleSelection(pkg.id)}
                />
                <View style={styles.packageInfo}>
                  <Text style={styles.packageDoorsId}>{pkg.doorsId}</Text>
                  <Text style={styles.packageMeta}>
                    {pkg.category} — {pkg.equipmentType}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.infoText}>
            Copied packages will get new IDs and start with "pending" status.
          </Text>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={handleDismiss}>Cancel</Button>
          <Button onPress={handleCopy} disabled={!canCopy}>
            Copy {selectedIds.length > 0 ? `${selectedIds.length} Package(s)` : ''}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

const styles = StyleSheet.create({
  dialog: {
    maxHeight: '80%',
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
  selectAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    marginBottom: 4,
  },
  selectAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  packageList: {
    maxHeight: 250,
  },
  packageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#EEE',
  },
  packageInfo: {
    flex: 1,
    marginLeft: 4,
  },
  packageDoorsId: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  packageMeta: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 12,
  },
});

export default CopyDoorsPackagesDialog;
