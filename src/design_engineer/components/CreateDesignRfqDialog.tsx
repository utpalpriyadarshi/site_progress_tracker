import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Portal, Dialog, Button, TextInput, Chip } from 'react-native-paper';
import { DoorsPackage } from '../types/DesignRfqTypes';

interface CreateDesignRfqDialogProps {
  visible: boolean;
  onDismiss: () => void;
  onCreate: () => void;
  doorsPackages: DoorsPackage[];
  newTitle: string;
  setNewTitle: (value: string) => void;
  newDescription: string;
  setNewDescription: (value: string) => void;
  newDoorsPackageId: string;
  setNewDoorsPackageId: (value: string) => void;
  newExpectedDeliveryDays: string;
  setNewExpectedDeliveryDays: (value: string) => void;
}

const CreateDesignRfqDialog: React.FC<CreateDesignRfqDialogProps> = ({
  visible,
  onDismiss,
  onCreate,
  doorsPackages,
  newTitle,
  setNewTitle,
  newDescription,
  setNewDescription,
  newDoorsPackageId,
  setNewDoorsPackageId,
  newExpectedDeliveryDays,
  setNewExpectedDeliveryDays,
}) => {
  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={styles.dialog}>
        <Dialog.Title>Create Design RFQ</Dialog.Title>
        <Dialog.ScrollArea>
          <ScrollView>
            <Dialog.Content>
              <TextInput
                label="RFQ Title *"
                value={newTitle}
                onChangeText={setNewTitle}
                style={styles.input}
                mode="outlined"
                placeholder="e.g., Design review for equipment X"
              />
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
              <View style={styles.pickerContainer}>
                <Text style={styles.pickerLabel}>DOORS Package *</Text>
                <ScrollView style={styles.pickerScroll} horizontal showsHorizontalScrollIndicator={false}>
                  {doorsPackages.map((pkg) => (
                    <Chip
                      key={pkg.id}
                      mode={newDoorsPackageId === pkg.id ? 'flat' : 'outlined'}
                      selected={newDoorsPackageId === pkg.id}
                      onPress={() => setNewDoorsPackageId(pkg.id)}
                      style={styles.pickerChip}
                    >
                      {pkg.doorsId}
                    </Chip>
                  ))}
                </ScrollView>
              </View>
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
          <Button onPress={onCreate}>Create</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

const styles = StyleSheet.create({
  dialog: {
    maxHeight: '80%',
  },
  input: {
    marginBottom: 12,
  },
  pickerContainer: {
    marginBottom: 12,
  },
  pickerLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  pickerScroll: {
    flexDirection: 'row',
  },
  pickerChip: {
    marginRight: 8,
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
