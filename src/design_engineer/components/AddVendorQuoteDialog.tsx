import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Portal, Dialog, Button, TextInput, Chip } from 'react-native-paper';
import { Vendor, VendorQuote } from '../types/VendorQuoteTypes';

interface AddVendorQuoteDialogProps {
  visible: boolean;
  onDismiss: () => void;
  onSubmit: (data: {
    vendorId: string;
    quotedPrice: number;
    currency: string;
    leadTimeDays: number;
    validityDays: number;
    paymentTerms?: string;
    warrantyMonths?: number;
    technicalCompliancePercentage: number;
    notes?: string;
  }) => void;
  vendors: Vendor[];
  isEditing?: boolean;
  editingQuote?: VendorQuote | null;
}

const AddVendorQuoteDialog: React.FC<AddVendorQuoteDialogProps> = ({
  visible,
  onDismiss,
  onSubmit,
  vendors,
  isEditing = false,
  editingQuote,
}) => {
  const [vendorId, setVendorId] = useState('');
  const [quotedPrice, setQuotedPrice] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [leadTimeDays, setLeadTimeDays] = useState('');
  const [validityDays, setValidityDays] = useState('30');
  const [paymentTerms, setPaymentTerms] = useState('');
  const [warrantyMonths, setWarrantyMonths] = useState('');
  const [compliance, setCompliance] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (visible && isEditing && editingQuote) {
      setVendorId(editingQuote.vendorId);
      setQuotedPrice(String(editingQuote.quotedPrice));
      setCurrency(editingQuote.currency);
      setLeadTimeDays(String(editingQuote.leadTimeDays));
      setValidityDays(String(editingQuote.validityDays));
      setPaymentTerms(editingQuote.paymentTerms || '');
      setWarrantyMonths(editingQuote.warrantyMonths !== undefined ? String(editingQuote.warrantyMonths) : '');
      setCompliance(String(editingQuote.technicalCompliancePercentage));
      setNotes(editingQuote.notes || '');
    } else if (visible && !isEditing) {
      resetForm();
    }
  }, [visible, isEditing, editingQuote]);

  const resetForm = () => {
    setVendorId('');
    setQuotedPrice('');
    setCurrency('INR');
    setLeadTimeDays('');
    setValidityDays('30');
    setPaymentTerms('');
    setWarrantyMonths('');
    setCompliance('');
    setNotes('');
  };

  const handleSubmit = () => {
    if (!vendorId || !quotedPrice || !leadTimeDays || !compliance) {
      return;
    }

    const price = parseFloat(quotedPrice);
    const lead = parseInt(leadTimeDays);
    const validity = parseInt(validityDays) || 30;
    const comp = parseFloat(compliance);
    const warranty = warrantyMonths ? parseInt(warrantyMonths) : undefined;

    if (isNaN(price) || price <= 0 || isNaN(lead) || lead <= 0 || isNaN(comp) || comp < 0 || comp > 100) {
      return;
    }

    onSubmit({
      vendorId,
      quotedPrice: price,
      currency,
      leadTimeDays: lead,
      validityDays: validity,
      paymentTerms: paymentTerms || undefined,
      warrantyMonths: warranty,
      technicalCompliancePercentage: comp,
      notes: notes || undefined,
    });
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={styles.dialog}>
        <Dialog.Title>{isEditing ? 'Edit Vendor Quote' : 'Add Vendor Quote'}</Dialog.Title>
        <Dialog.ScrollArea>
          <ScrollView>
            <Dialog.Content>
              <Text style={styles.sectionLabel}>Vendor *</Text>
              <ScrollView style={styles.vendorScroll} horizontal showsHorizontalScrollIndicator={false}>
                {vendors.map((v) => (
                  <Chip
                    key={v.id}
                    mode={vendorId === v.id ? 'flat' : 'outlined'}
                    selected={vendorId === v.id}
                    onPress={() => setVendorId(v.id)}
                    style={styles.vendorChip}>
                    {v.vendorName}
                  </Chip>
                ))}
              </ScrollView>

              <TextInput
                label="Quoted Price *"
                value={quotedPrice}
                onChangeText={setQuotedPrice}
                style={styles.input}
                mode="outlined"
                keyboardType="numeric"
                placeholder="e.g., 500000"
              />

              <View style={styles.row}>
                <TextInput
                  label="Currency"
                  value={currency}
                  onChangeText={setCurrency}
                  style={[styles.input, styles.halfInput]}
                  mode="outlined"
                  placeholder="INR"
                />
                <TextInput
                  label="Lead Time (days) *"
                  value={leadTimeDays}
                  onChangeText={setLeadTimeDays}
                  style={[styles.input, styles.halfInput]}
                  mode="outlined"
                  keyboardType="numeric"
                  placeholder="60"
                />
              </View>

              <View style={styles.row}>
                <TextInput
                  label="Validity (days)"
                  value={validityDays}
                  onChangeText={setValidityDays}
                  style={[styles.input, styles.halfInput]}
                  mode="outlined"
                  keyboardType="numeric"
                  placeholder="30"
                />
                <TextInput
                  label="Warranty (months)"
                  value={warrantyMonths}
                  onChangeText={setWarrantyMonths}
                  style={[styles.input, styles.halfInput]}
                  mode="outlined"
                  keyboardType="numeric"
                  placeholder="12"
                />
              </View>

              <TextInput
                label="Payment Terms"
                value={paymentTerms}
                onChangeText={setPaymentTerms}
                style={styles.input}
                mode="outlined"
                placeholder="e.g., 30 days net"
              />

              <TextInput
                label="Technical Compliance % *"
                value={compliance}
                onChangeText={setCompliance}
                style={styles.input}
                mode="outlined"
                keyboardType="numeric"
                placeholder="0-100"
              />

              <TextInput
                label="Notes"
                value={notes}
                onChangeText={setNotes}
                style={styles.input}
                mode="outlined"
                multiline
                numberOfLines={3}
                placeholder="Additional notes..."
              />
            </Dialog.Content>
          </ScrollView>
        </Dialog.ScrollArea>
        <Dialog.Actions>
          <Button onPress={onDismiss}>Cancel</Button>
          <Button onPress={handleSubmit} disabled={!vendorId || !quotedPrice || !leadTimeDays || !compliance}>
            {isEditing ? 'Save' : 'Add Quote'}
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
  sectionLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  vendorScroll: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  vendorChip: {
    marginRight: 8,
  },
  input: {
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
});

export default AddVendorQuoteDialog;
