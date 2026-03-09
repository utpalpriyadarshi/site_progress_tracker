import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Platform, KeyboardAvoidingView } from 'react-native';
import { Portal, Dialog, Button, TextInput, Chip, Snackbar } from 'react-native-paper';
import { useSnackbar } from '../../../hooks/useSnackbar';
import DateTimePicker from '@react-native-community/datetimepicker';
import { InvoiceFormData, Invoice } from '../hooks';
import { PAYMENT_STATUSES, validateInvoiceForm } from '../utils';
import { useAccessibility } from '../../../utils/accessibility';

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
  const { announce } = useAccessibility();
  const { show: showSnackbar, snackbarProps } = useSnackbar();
  const [formInvoiceNumber, setFormInvoiceNumber] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formPoId, setFormPoId] = useState('');
  const [formVendorName, setFormVendorName] = useState('');
  const [formInvoiceDate, setFormInvoiceDate] = useState<Date>(new Date());
  const [formDueDate, setFormDueDate] = useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d;
  });
  const [formPaymentDate, setFormPaymentDate] = useState<Date | undefined>(undefined);
  const [formPaymentStatus, setFormPaymentStatus] = useState('pending');
  const [showInvoiceDatePicker, setShowInvoiceDatePicker] = useState(false);
  const [showDueDatePicker, setShowDueDatePicker] = useState(false);
  const [showPaymentDatePicker, setShowPaymentDatePicker] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Refs for focus management
  const invoiceNumberRef = useRef<any>(null);
  const poIdRef = useRef<any>(null);
  const vendorNameRef = useRef<any>(null);
  const amountRef = useRef<any>(null);

  // Announce dialog open/close
  useEffect(() => {
    if (visible) {
      const mode = editingInvoice ? 'Edit' : 'Create';
      announce(`${mode} invoice dialog opened. ${editingInvoice ? 'Editing invoice ' + editingInvoice.invoiceNumber : 'Fill in the required fields to create a new invoice.'}`);
      // Focus first field after dialog opens
      setTimeout(() => {
        invoiceNumberRef.current?.focus();
      }, 300);
    }
  }, [visible, editingInvoice, announce]);

  // Clear validation errors when form values change
  const handleFieldChange = useCallback((field: string, setter: (value: string) => void) => {
    return (value: string) => {
      setter(value);
      if (validationErrors[field]) {
        setValidationErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      }
    };
  }, [validationErrors]);

  // Populate form when editing
  useEffect(() => {
    if (editingInvoice) {
      setFormInvoiceNumber(editingInvoice.invoiceNumber);
      setFormAmount(editingInvoice.amount.toString());
      setFormPoId(editingInvoice.poId);
      setFormVendorName(editingInvoice.vendorName || '');
      setFormInvoiceDate(new Date(editingInvoice.invoiceDate));
      if (editingInvoice.dueDate) {
        setFormDueDate(new Date(editingInvoice.dueDate));
      } else {
        const d = new Date(editingInvoice.invoiceDate);
        d.setDate(d.getDate() + 30);
        setFormDueDate(d);
      }
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
    const defaultDue = new Date();
    defaultDue.setDate(defaultDue.getDate() + 30);
    setFormDueDate(defaultDue);
    setFormPaymentDate(undefined);
    setFormPaymentStatus('pending');
    setValidationErrors({});
  };

  // When invoice date changes, shift the due date by the same offset to preserve terms
  const handleInvoiceDateChangeWithDueDate = (event: any, selectedDate?: Date) => {
    setShowInvoiceDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      const daysDiff = Math.round((formDueDate.getTime() - formInvoiceDate.getTime()) / (24 * 60 * 60 * 1000));
      const newDue = new Date(selectedDate);
      newDue.setDate(newDue.getDate() + daysDiff);
      setFormInvoiceDate(selectedDate);
      setFormDueDate(newDue);
      announce(`Invoice date set to ${selectedDate.toLocaleDateString()}, due date updated to ${newDue.toLocaleDateString()}`);
    }
  };

  const handleDueDateChange = (event: any, selectedDate?: Date) => {
    setShowDueDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setFormDueDate(selectedDate);
      announce(`Due date set to ${selectedDate.toLocaleDateString()}`);
    }
  };

  const handleSubmit = async () => {
    const formData: InvoiceFormData = {
      invoiceNumber: formInvoiceNumber,
      amount: formAmount,
      poId: formPoId,
      vendorName: formVendorName,
      invoiceDate: formInvoiceDate,
      dueDate: formDueDate,
      paymentDate: formPaymentDate,
      paymentStatus: formPaymentStatus,
    };

    const validation = validateInvoiceForm(formData);
    if (!validation.isValid) {
      // Set validation errors and announce them
      const errors: Record<string, string> = {};
      if (!formInvoiceNumber) errors.invoiceNumber = 'Invoice number is required';
      if (!formPoId) errors.poId = 'Purchase order number is required';
      if (!formVendorName) errors.vendorName = 'Vendor name is required';
      if (!formAmount || isNaN(parseFloat(formAmount))) errors.amount = 'Valid amount is required';
      setValidationErrors(errors);

      // Announce validation error for screen readers
      const errorCount = Object.keys(errors).length;
      announce(`Validation failed. ${errorCount} ${errorCount === 1 ? 'error' : 'errors'} found. ${validation.error}`);

      showSnackbar(validation.error ?? 'Validation failed');
      return;
    }

    const success = await onSubmit(formData);
    if (success) {
      announce(`Invoice ${editingInvoice ? 'updated' : 'created'} successfully`);
      resetForm();
      onDismiss();
    } else {
      announce('Failed to save invoice. Please try again.');
    }
  };

  // Handle payment status change with announcement
  const handlePaymentStatusChange = (status: string) => {
    setFormPaymentStatus(status);
    const statusLabel = PAYMENT_STATUSES.find(s => s.value === status)?.label || status;
    announce(`Payment status changed to ${statusLabel}`);
  };

  const handlePaymentDateChange = (event: any, selectedDate?: Date) => {
    setShowPaymentDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setFormPaymentDate(selectedDate);
      announce(`Payment date set to ${selectedDate.toLocaleDateString()}`);
    }
  };

  return (
    <Portal>
      <Dialog
        visible={visible}
        onDismiss={onDismiss}
      >
        <Dialog.Title accessibilityRole="header">{title}</Dialog.Title>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
        >
        <Dialog.ScrollArea>
          <ScrollView
            style={styles.dialogContent}
            accessibilityLabel="Invoice form"
          >
            <TextInput
              ref={invoiceNumberRef}
              label="Invoice Number *"
              value={formInvoiceNumber}
              onChangeText={handleFieldChange('invoiceNumber', setFormInvoiceNumber)}
              mode="outlined"
              style={styles.input}
              error={!!validationErrors.invoiceNumber}
              accessibilityLabel="Invoice Number, required field"
              accessibilityHint="Enter the invoice number"
              accessibilityState={{ disabled: false }}
              returnKeyType="next"
              onSubmitEditing={() => poIdRef.current?.focus()}
            />
            {validationErrors.invoiceNumber && (
              <Text style={styles.errorText} accessibilityRole="alert">
                {validationErrors.invoiceNumber}
              </Text>
            )}

            <TextInput
              ref={poIdRef}
              label="Purchase Order # *"
              value={formPoId}
              onChangeText={handleFieldChange('poId', setFormPoId)}
              mode="outlined"
              style={styles.input}
              error={!!validationErrors.poId}
              accessibilityLabel="Purchase Order Number, required field"
              accessibilityHint="Enter the associated purchase order number"
              returnKeyType="next"
              onSubmitEditing={() => vendorNameRef.current?.focus()}
            />
            {validationErrors.poId && (
              <Text style={styles.errorText} accessibilityRole="alert">
                {validationErrors.poId}
              </Text>
            )}

            <TextInput
              ref={vendorNameRef}
              label="Vendor Name *"
              value={formVendorName}
              onChangeText={handleFieldChange('vendorName', setFormVendorName)}
              mode="outlined"
              style={styles.input}
              placeholder="Enter vendor name"
              error={!!validationErrors.vendorName}
              accessibilityLabel="Vendor Name, required field"
              accessibilityHint="Enter the name of the vendor"
              returnKeyType="next"
              onSubmitEditing={() => amountRef.current?.focus()}
            />
            {validationErrors.vendorName && (
              <Text style={styles.errorText} accessibilityRole="alert">
                {validationErrors.vendorName}
              </Text>
            )}

            <TextInput
              ref={amountRef}
              label="Amount *"
              value={formAmount}
              onChangeText={handleFieldChange('amount', setFormAmount)}
              keyboardType="numeric"
              mode="outlined"
              style={styles.input}
              left={<TextInput.Affix text="₹" />}
              error={!!validationErrors.amount}
              accessibilityLabel="Invoice Amount in dollars, required field"
              accessibilityHint="Enter the invoice amount"
              returnKeyType="done"
            />
            {validationErrors.amount && (
              <Text style={styles.errorText} accessibilityRole="alert">
                {validationErrors.amount}
              </Text>
            )}

            <Text
              style={styles.dialogLabel}
              accessibilityRole="text"
              nativeID="invoiceDateLabel"
            >
              Invoice Date *
            </Text>
            <Button
              mode="outlined"
              onPress={() => setShowInvoiceDatePicker(true)}
              style={styles.dateButton}
              accessibilityLabel={`Invoice date: ${formInvoiceDate.toLocaleDateString()}`}
              accessibilityHint="Tap to change the invoice date"
              accessibilityRole="button"
            >
              {formInvoiceDate.toLocaleDateString()}
            </Button>

            {showInvoiceDatePicker && (
              <DateTimePicker
                value={formInvoiceDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleInvoiceDateChangeWithDueDate}
              />
            )}

            <Text
              style={styles.dialogLabel}
              accessibilityRole="text"
            >
              Due Date
            </Text>
            <Button
              mode="outlined"
              onPress={() => setShowDueDatePicker(true)}
              style={styles.dateButton}
              accessibilityLabel={`Due date: ${formDueDate.toLocaleDateString()}`}
              accessibilityHint="Tap to change the payment due date"
              accessibilityRole="button"
            >
              {formDueDate.toLocaleDateString()}
            </Button>

            {showDueDatePicker && (
              <DateTimePicker
                value={formDueDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleDueDateChange}
              />
            )}

            <Text
              style={styles.dialogLabel}
              accessibilityRole="text"
              nativeID="paymentStatusLabel"
            >
              Payment Status *
            </Text>
            <View
              style={styles.statusButtons}
              accessibilityRole="radiogroup"
              accessibilityLabel="Payment status options"
            >
              {PAYMENT_STATUSES.filter((s) => s.value !== 'overdue').map((status) => (
                <Chip
                  key={status.value}
                  selected={formPaymentStatus === status.value}
                  onPress={() => handlePaymentStatusChange(status.value)}
                  style={styles.statusButton}
                  selectedColor="#007AFF"
                  accessibilityRole="radio"
                  accessibilityState={{ checked: formPaymentStatus === status.value }}
                  accessibilityLabel={`${status.label}${formPaymentStatus === status.value ? ', selected' : ''}`}
                  accessibilityHint={`Select ${status.label} as payment status`}
                >
                  {status.label}
                </Chip>
              ))}
            </View>

            {formPaymentStatus === 'paid' && (
              <>
                <Text
                  style={styles.dialogLabel}
                  accessibilityRole="text"
                  nativeID="paymentDateLabel"
                >
                  Payment Date
                </Text>
                <Button
                  mode="outlined"
                  onPress={() => setShowPaymentDatePicker(true)}
                  style={styles.dateButton}
                  accessibilityLabel={`Payment date: ${formPaymentDate ? formPaymentDate.toLocaleDateString() : 'Not selected'}`}
                  accessibilityHint="Tap to select the payment date"
                  accessibilityRole="button"
                >
                  {formPaymentDate ? formPaymentDate.toLocaleDateString() : 'Select Date'}
                </Button>

                {showPaymentDatePicker && (
                  <DateTimePicker
                    value={formPaymentDate || new Date()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handlePaymentDateChange}
                  />
                )}
              </>
            )}
          </ScrollView>
        </Dialog.ScrollArea>
        </KeyboardAvoidingView>
        <Dialog.Actions>
          <Button
            onPress={onDismiss}
            accessibilityLabel="Cancel"
            accessibilityHint="Dismiss the dialog without saving"
            accessibilityRole="button"
          >
            Cancel
          </Button>
          <Button
            onPress={handleSubmit}
            accessibilityLabel={editingInvoice ? 'Save invoice' : 'Create invoice'}
            accessibilityHint={editingInvoice ? 'Save changes to this invoice' : 'Create a new invoice with the entered details'}
            accessibilityRole="button"
          >
            {editingInvoice ? 'Save' : 'Create'}
          </Button>
        </Dialog.Actions>
      </Dialog>
      <Snackbar {...snackbarProps} duration={3000} />
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
  errorText: {
    fontSize: 12,
    color: '#d32f2f',
    marginTop: -12,
    marginBottom: 12,
    marginLeft: 4,
  },
});
