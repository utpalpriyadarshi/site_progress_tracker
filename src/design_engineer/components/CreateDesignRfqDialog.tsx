import React, { useMemo, Dispatch } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Portal, Dialog, Button, TextInput, Chip } from 'react-native-paper';
import { DoorsPackage, Domain } from '../types/DesignRfqTypes';
import { COLORS } from '../../theme/colors';
import { RfqFormData, DesignRfqManagementAction } from '../state/design-rfq-management/designRfqManagementReducer';

interface CreateDesignRfqDialogProps {
  visible: boolean;
  onDismiss: () => void;
  onSubmit: () => void;
  isEditing?: boolean;
  isSubmitting?: boolean;
  formState: RfqFormData;
  dispatch: Dispatch<DesignRfqManagementAction>;
  domains: Domain[];
  doorsPackages: DoorsPackage[];
}

const CreateDesignRfqDialog: React.FC<CreateDesignRfqDialogProps> = ({
  visible,
  onDismiss,
  onSubmit,
  isEditing = false,
  isSubmitting = false,
  formState,
  dispatch,
  domains,
  doorsPackages,
}) => {
  const { title, description, domainId, doorsPackageId, expectedDeliveryDays } = formState;

  // Filter packages by selected domain
  const filteredPackages = useMemo(() => {
    if (!domainId) return doorsPackages;
    return doorsPackages.filter((pkg) => pkg.domainId === domainId);
  }, [doorsPackages, domainId]);

  const selectedPackage = doorsPackages.find((pkg) => pkg.id === doorsPackageId);

  const handleDomainSelect = (selectedId: string) => {
    const newDomainId = selectedId === domainId ? '' : selectedId;
    dispatch({ type: 'UPDATE_FORM_FIELD', payload: { field: 'domainId', value: newDomainId } });
    if (selectedId !== domainId) {
      dispatch({ type: 'UPDATE_FORM_FIELD', payload: { field: 'doorsPackageId', value: '' } });
    }
  };

  const handlePackageSelect = (pkg: DoorsPackage) => {
    const domainName = pkg.domainName || '';
    const autoTitle = `Design RFQ - ${pkg.equipmentType}${domainName ? ` - ${domainName}` : ''}`;
    const autoDesc = `${pkg.equipmentType}${pkg.materialType ? ` (${pkg.materialType})` : ''} - ${pkg.totalRequirements} requirements`;
    dispatch({
      type: 'SET_FORM',
      payload: {
        title: autoTitle,
        description: autoDesc,
        doorsPackageId: pkg.id,
        domainId: pkg.domainId || '',
      },
    });
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
                        mode={domainId === domain.id ? 'flat' : 'outlined'}
                        selected={domainId === domain.id}
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
                        mode={doorsPackageId === pkg.id ? 'flat' : 'outlined'}
                        selected={doorsPackageId === pkg.id}
                        onPress={() => handlePackageSelect(pkg)}
                        style={styles.chip}
                      >
                        {pkg.doorsId} - {pkg.equipmentType}
                      </Chip>
                    ))}
                  </ScrollView>
                ) : (
                  <Text style={styles.emptyText}>
                    {domainId ? 'No packages in this domain' : 'No DOORS packages available'}
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
                value={title}
                onChangeText={(v) => dispatch({ type: 'UPDATE_FORM_FIELD', payload: { field: 'title', value: v } })}
                style={styles.input}
                mode="outlined"
                placeholder="e.g., Design review for equipment X"
              />

              {/* Step 4: Description (auto-populated, editable) */}
              <TextInput
                label="Description"
                value={description}
                onChangeText={(v) => dispatch({ type: 'UPDATE_FORM_FIELD', payload: { field: 'description', value: v } })}
                style={styles.input}
                mode="outlined"
                multiline
                numberOfLines={3}
                placeholder="Enter detailed description..."
              />

              {/* Step 5: Expected delivery days */}
              <TextInput
                label="Expected Delivery Days"
                value={expectedDeliveryDays}
                onChangeText={(v) => dispatch({ type: 'UPDATE_FORM_FIELD', payload: { field: 'expectedDeliveryDays', value: v } })}
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
          <Button onPress={onDismiss} disabled={isSubmitting}>Cancel</Button>
          <Button onPress={onSubmit} loading={isSubmitting} disabled={isSubmitting}>
            {isEditing ? 'Save' : 'Create'}
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
    backgroundColor: COLORS.INFO_BG,
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
