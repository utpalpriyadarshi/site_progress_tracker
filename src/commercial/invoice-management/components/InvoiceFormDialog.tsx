import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Platform, Alert } from 'react-native';
import { Portal, Dialog, Button, TextInput, Chip } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { InvoiceFormData, Invoice } from '../hooks';
import { PAYMENT_STATUSES, validateInvoiceForm } from '../utils';

interface InvoiceFormDialogProps {
  visible: boolean;
  onDismiss: () => void;
  onSubmit: (formData: InvoiceFormData) => Promise<boolean>;
  editingInvoice?: Invoice | null;
  title: string;
}

export const InvoiceFormDialog: React.FC<InvoiceFormDialogProps> = ({
  visible,
  onDismiss,
  onSubmit,
  editingInvoice,
  title,
}) => {
  const [formInvoiceNumber, setFormInvoiceNumber] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formPoId, setFormPoId] = useState('');
  const [formVendorName, setFormVendorName] = useState('');
  const [formInvoiceDate, setFormInvoiceDate] = useState<Date>(new Date());
  const [formPaymentDate, setFormPaymentDate] = useState<Date | undefined>(undefined);
  const [formPaymentStatus, setFormPaymentStatus] = useState('pending');
  const [showInvoiceDatePicker, setShowInvoiceDatePicker] = useState(false);
  const [showPaymentDatePicker, setShowPaymentDatePicker] = useState(false);

  // Populate form when editing
  useEffect(() => {
    if (editingInvoice) {
      setFormInvoiceNumber(editingInvoice.invoiceNumber);
      setFormAmount(editingInvoice.amount.toString());
      setFormPoId(editingInvoice.poId);
      setFormVendorName(editingInvoice.vendorName || '');
      setFormInvoiceDate(new Date(editingInvoice.invoiceDate));
      setFormPaymentDate(
        editingInvoice.paymentDate ? new Date(editingInvoice.paymentDate) : undefined
      );
      setFormPaymentStatus(
        editingInvoice.paymentStatus === 'overdue' ? 'pending' : editingInvoice.paymentStatus
      );
    } else {
      resetForm();
    }
  }, [editingInvoice, visible]);

  const resetForm = () => {
    setFormInvoiceNumber('');
    setFormAmount('');
    setFormPoId('');
    setFormVendorName('');
    setFormInvoiceDate(new Date());
    setFormPaymentDate(undefined);
    setFormPaymentStatus('pending');
  };

  const handleSubmit = async () => {
    const formData: InvoiceFormData = {
      invoiceNumber: formInvoiceNumber,
      amount: formAmount,
      poId: formPoId,
      vendorName: formVendorName,
      invoiceDate: formInvoiceDate,
      paymentDate: formPaymentDate,
      paymentStatus: formPaymentStatus,
    };

    const validation = validateInvoiceForm(formData);
    if (!validation.isValid) {
      Alert.alert('Validation Error', validation.error);
      return;
    }

    const success = await onSubmit(formData);
    if (success) {
      resetForm();
      onDismiss();
    }
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss}>
        <Dialog.Title>{title}</Dialog.Title>
        <Dialog.ScrollArea>
          <ScrollView style={styles.dialogContent}>
            <TextInput
              label="Invoice Number *"
              value={formInvoiceNumber}
              onChangeText={setFormInvoiceNumber}
              mode="outlined"
              style={styles.input}
            />

            <TextInput
              label="Purchase Order # *"
              value={formPoId}
              onChangeText={setFormPoId}
              mode="outlined"
              style={styles.input}
            />

            <TextInput
              label="Vendor Name *"
              value={formVendorName}
              onChangeText={setFormVendorName}
              mode="outlined"
              style={styles.input}
              placeholder="Enter vendor name"
            />

            <TextInput
              label="Amount *"
              value={formAmount}
              onChangeText={setFormAmount}
              keyboardType="numeric"
              mode="outlined"
              style={styles.input}
              left={<TextInput.Affix text="$" />}
            />

            <Text style={styles.dialogLabel}>Invoice Date *</Text>
            <Button
              mode="outlined"
              onPress={() => setShowInvoiceDatePicker(true)}
              style={styles.dateButton}
            >
              {formInvoiceDate.toLocaleDateString()}
            </Button>

            {showInvoiceDatePicker && (
              <DateTimePicker
                value={formInvoiceDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, selectedDate) => {
                  setShowInvoiceDatePicker(Platform.OS === 'ios');
                  if (selectedDate) {
                    setFormInvoiceDate(selectedDate);
                  }
                }}
              />
            )}

            <Text style={styles.dialogLabel}>Payment Status *</Text>
            <View style={styles.statusButtons}>
              {PAYMENT_STATUSES.filter((s) => s.value !== 'overdue').map((status) => (
                <Chip
                  key={status.value}
                  selected={formPaymentStatus === status.value}
                  onPress={() => setFormPaymentStatus(status.value)}
                  style={styles.statusButton}
                  selectedColor="#007AFF"
                >
                  {status.label}
                </Chip>
              ))}
            </View>

            {formPaymentStatus === 'paid' && (
              <>
                <Text style={styles.dialogLabel}>Payment Date</Text>
                <Button
                  mode="outlined"
                  onPress={() => setShowPaymentDatePicker(true)}
                  style={styles.dateButton}
                >
                  {formPaymentDate ? formPaymentDate.toLocaleDateString() : 'Select Date'}
                </Button>

                {showPaymentDatePicker && (
                  <DateTimePicker
                    value={formPaymentDate || new Date()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(event, selectedDate) => {
                      setShowPaymentDatePicker(Platform.OS === 'ios');
                      if (selectedDate) {
                        setFormPaymentDate(selectedDate);
                      }
                    }}
                  />
                )}
              </>
            )}
          </ScrollView>
        </Dialog.ScrollArea>
        <Dialog.Actions>
          <Button onPress={onDismiss}>Cancel</Button>
          <Button onPress={handleSubmit}>{editingInvoice ? 'Save' : 'Create'}</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

const styles = StyleSheet.create({
  dialogContent: {
    paddingHorizontal: 24,
  },
  dialogLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    marginBottom: 16,
  },
  dateButton: {
    marginBottom: 16,
    borderColor: '#007AFF',
  },
  statusButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  statusButton: {
    marginRight: 8,
  },
});
