import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Portal, Dialog, Button, TextInput, Chip } from 'react-native-paper';
import { DoorsPackage, Domain } from '../types/DesignRfqTypes';

interface CreateDesignRfqDialogProps {
  visible: boolean;
  onDismiss: () => void;
  onCreate: () => void;
  isEditing?: boolean;
  domains: Domain[];
  doorsPackages: DoorsPackage[];
  newTitle: string;
  setNewTitle: (value: string) => void;
  newDescription: string;
  setNewDescription: (value: string) => void;
  newDomainId: string;
  setNewDomainId: (value: string) => void;
  newDoorsPackageId: string;
  setNewDoorsPackageId: (value: string) => void;
  newExpectedDeliveryDays: string;
  setNewExpectedDeliveryDays: (value: string) => void;
  onPackageSelected: (pkg: DoorsPackage) => void;
}

const CreateDesignRfqDialog: React.FC<CreateDesignRfqDialogProps> = ({
  visible,
  onDismiss,
  onCreate,
  isEditing = false,
  domains,
  doorsPackages,
  newTitle,
  setNewTitle,
  newDescription,
  setNewDescription,
  newDomainId,
  setNewDomainId,
  newDoorsPackageId,
  setNewDoorsPackageId,
  newExpectedDeliveryDays,
  setNewExpectedDeliveryDays,
  onPackageSelected,
}) => {
  // Filter packages by selected domain
  const filteredPackages = useMemo(() => {
    if (!newDomainId) return doorsPackages;
    return doorsPackages.filter((pkg) => pkg.domainId === newDomainId);
  }, [doorsPackages, newDomainId]);

  const selectedPackage = doorsPackages.find((pkg) => pkg.id === newDoorsPackageId);

  const handleDomainSelect = (domainId: string) => {
    setNewDomainId(domainId === newDomainId ? '' : domainId);
    // Clear package selection when domain changes
    if (domainId !== newDomainId) {
      setNewDoorsPackageId('');
    }
  };

  const handlePackageSelect = (pkg: DoorsPackage) => {
    setNewDoorsPackageId(pkg.id);
    onPackageSelected(pkg);
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={styles.dialog}>
        <Dialog.Title>{isEditing ? 'Edit Design RFQ' : 'Create Design RFQ'}</Dialog.Title>
        <Dialog.ScrollArea>
          <ScrollView>
            <Dialog.Content>
              {/* Step 1: Domain selector */}
              {domains.length > 0 && (
                <View style={styles.sectionContainer}>
                  <Text style={styles.sectionLabel}>Domain</Text>
                  <ScrollView style={styles.chipScroll} horizontal showsHorizontalScrollIndicator={false}>
                    {domains.map((domain) => (
                      <Chip
                        key={domain.id}
                        mode={newDomainId === domain.id ? 'flat' : 'outlined'}
                        selected={newDomainId === domain.id}
                        onPress={() => handleDomainSelect(domain.id)}
                        style={styles.chip}
                      >
                        {domain.name}
                      </Chip>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* Step 2: DOORS Package selector */}
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionLabel}>DOORS Package *</Text>
                {filteredPackages.length > 0 ? (
                  <ScrollView style={styles.chipScroll} horizontal showsHorizontalScrollIndicator={false}>
                    {filteredPackages.map((pkg) => (
                      <Chip
                        key={pkg.id}
                        mode={newDoorsPackageId === pkg.id ? 'flat' : 'outlined'}
                        selected={newDoorsPackageId === pkg.id}
                        onPress={() => handlePackageSelect(pkg)}
                        style={styles.chip}
                      >
                        {pkg.doorsId} - {pkg.equipmentType}
                      </Chip>
                    ))}
                  </ScrollView>
                ) : (
                  <Text style={styles.emptyText}>
                    {newDomainId ? 'No packages in this domain' : 'No DOORS packages available'}
                  </Text>
                )}
              </View>

              {/* Package info display */}
              {selectedPackage && (
                <View style={styles.packageInfo}>
                  <Text style={styles.packageInfoTitle}>Selected Package</Text>
                  <Text style={styles.packageInfoText}>
                    {selectedPackage.equipmentType} ({selectedPackage.category})
                  </Text>
                  {selectedPackage.materialType && (
                    <Text style={styles.packageInfoText}>Material: {selectedPackage.materialType}</Text>
                  )}
                  <Text style={styles.packageInfoText}>
                    Requirements: {selectedPackage.totalRequirements}
                  </Text>
                  {selectedPackage.siteName && (
                    <Text style={styles.packageInfoText}>Site: {selectedPackage.siteName}</Text>
                  )}
                </View>
              )}

              {/* Step 3: Title (auto-populated, editable) */}
              <TextInput
                label="RFQ Title *"
                value={newTitle}
                onChangeText={setNewTitle}
                style={styles.input}
                mode="outlined"
                placeholder="e.g., Design review for equipment X"
              />

              {/* Step 4: Description (auto-populated, editable) */}
              <TextInput
                label="Description"
                value={newDescription}
                onChangeText={setNewDescription}
                style={styles.input}
                mode="outlined"
                multiline
                numberOfLines={3}
                placeholder="Enter detailed description..."
              />

              {/* Step 5: Expected delivery days */}
              <TextInput
                label="Expected Delivery Days"
                value={newExpectedDeliveryDays}
                onChangeText={setNewExpectedDeliveryDays}
                style={styles.input}
                mode="outlined"
                keyboardType="numeric"
                placeholder="30"
              />

              <Text style={styles.infoText}>
                Design RFQs are used during the engineering phase (pre-PM200) to request design services or
                technical specifications from vendors.
              </Text>
            </Dialog.Content>
          </ScrollView>
        </Dialog.ScrollArea>
        <Dialog.Actions>
          <Button onPress={onDismiss}>Cancel</Button>
          <Button onPress={onCreate}>{isEditing ? 'Save' : 'Create'}</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

const styles = StyleSheet.create({
  dialog: {
    maxHeight: '80%',
  },
  sectionContainer: {
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  chipScroll: {
    flexDirection: 'row',
  },
  chip: {
    marginRight: 8,
  },
  emptyText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  packageInfo: {
    backgroundColor: '#E3F2FD',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  packageInfoTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1565C0',
    marginBottom: 4,
  },
  packageInfoText: {
    fontSize: 12,
    color: '#333',
    lineHeight: 18,
  },
  input: {
    marginBottom: 12,
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 8,
    lineHeight: 18,
  },
});

export default CreateDesignRfqDialog;
