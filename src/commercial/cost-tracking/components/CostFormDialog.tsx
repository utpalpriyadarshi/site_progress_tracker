import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { Portal, Dialog, Button, TextInput, Chip } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { COST_CATEGORIES } from '../utils';
import { useAccessibility } from '../../../utils/accessibility';

interface CostFormDialogProps {
  visible: boolean;
  onDismiss: () => void;
  onSave: () => void;
  title: string;
  formCategory: string;
  setFormCategory: (category: string) => void;
  formAmount: string;
  setFormAmount: (amount: string) => void;
  formDescription: string;
  setFormDescription: (description: string) => void;
  formPoId: string;
  setFormPoId: (poId: string) => void;
  formCostDate: Date;
  showDatePicker: boolean;
  setShowDatePicker: (show: boolean) => void;
  handleDateChange: (event: any, selectedDate?: Date) => void;
  validationErrors?: Record<string, string>;
  isEditing?: boolean;
}

export const CostFormDialog: React.FC<CostFormDialogProps> = ({
  visible,
  onDismiss,
  onSave,
  title,
  formCategory,
  setFormCategory,
  formAmount,
  setFormAmount,
  formDescription,
  setFormDescription,
  formPoId,
  setFormPoId,
  formCostDate,
  showDatePicker,
  setShowDatePicker,
  handleDateChange,
  validationErrors = {},
  isEditing = false,
}) => {
  const { announce } = useAccessibility();

  // Refs for focus management
  const amountRef = useRef<any>(null);
  const descriptionRef = useRef<any>(null);
  const poIdRef = useRef<any>(null);

  // Announce dialog open
  useEffect(() => {
    if (visible) {
      const mode = isEditing ? 'Edit' : 'Add';
      announce(`${mode} cost dialog opened. Fill in the required fields.`);
    }
  }, [visible, isEditing, announce]);

  // Handle category change with announcement
  const handleCategoryChange = (categoryValue: string) => {
    setFormCategory(categoryValue);
    const categoryLabel = COST_CATEGORIES.find(c => c.value === categoryValue)?.label || categoryValue;
    announce(`Category changed to ${categoryLabel}`);
  };

  // Handle date change with announcement
  const handleDateChangeWithAnnouncement = (event: any, selectedDate?: Date) => {
    handleDateChange(event, selectedDate);
    if (selectedDate) {
      announce(`Cost date set to ${selectedDate.toLocaleDateString()}`);
    }
  };

  // Handle save with validation announcement
  const handleSave = () => {
    // Check for validation errors
    const errors: string[] = [];
    if (!formCategory) errors.push('category');
    if (!formAmount || isNaN(parseFloat(formAmount))) errors.push('amount');
    if (!formDescription) errors.push('description');

    if (errors.length > 0) {
      announce(`Please fill in required fields: ${errors.join(', ')}`);
    }
    onSave();
  };

  return (
    <Portal>
      <Dialog
        visible={visible}
        onDismiss={onDismiss}
      >
        <Dialog.Title accessibilityRole="header">{title}</Dialog.Title>
        <Dialog.ScrollArea>
          <ScrollView
            style={styles.content}
            accessibilityLabel="Cost entry form"
          >
            <Text
              style={styles.label}
              accessibilityRole="text"
              nativeID="categoryLabel"
            >
              Category *
            </Text>
            <View
              style={styles.categoryButtons}
              accessibilityRole="radiogroup"
              accessibilityLabel="Cost category options"
            >
              {COST_CATEGORIES.map((cat) => (
                <Chip
                  key={cat.value}
                  selected={formCategory === cat.value}
                  onPress={() => handleCategoryChange(cat.value)}
                  style={styles.categoryButton}
                  selectedColor="#007AFF"
                  accessibilityRole="radio"
                  accessibilityState={{ checked: formCategory === cat.value }}
                  accessibilityLabel={`${cat.label}${formCategory === cat.value ? ', selected' : ''}`}
                  accessibilityHint={`Select ${cat.label} as the cost category`}
                >
                  {cat.label}
                </Chip>
              ))}
            </View>
            {validationErrors.category && (
              <Text style={styles.errorText} accessibilityRole="alert">
                {validationErrors.category}
              </Text>
            )}

            <TextInput
              ref={amountRef}
              label="Amount *"
              value={formAmount}
              onChangeText={setFormAmount}
              keyboardType="numeric"
              mode="outlined"
              style={styles.input}
              left={<TextInput.Affix text="$" />}
              error={!!validationErrors.amount}
              accessibilityLabel="Cost amount in dollars, required field"
              accessibilityHint="Enter the cost amount"
              returnKeyType="next"
              onSubmitEditing={() => descriptionRef.current?.focus()}
            />
            {validationErrors.amount && (
              <Text style={styles.errorText} accessibilityRole="alert">
                {validationErrors.amount}
              </Text>
            )}

            <TextInput
              ref={descriptionRef}
              label="Description *"
              value={formDescription}
              onChangeText={setFormDescription}
              mode="outlined"
              multiline
              numberOfLines={3}
              style={styles.input}
              error={!!validationErrors.description}
              accessibilityLabel="Cost description, required field"
              accessibilityHint="Enter a description of this cost"
              returnKeyType="next"
              blurOnSubmit={true}
              onSubmitEditing={() => poIdRef.current?.focus()}
            />
            {validationErrors.description && (
              <Text style={styles.errorText} accessibilityRole="alert">
                {validationErrors.description}
              </Text>
            )}

            <TextInput
              ref={poIdRef}
              label="Purchase Order # (Optional)"
              value={formPoId}
              onChangeText={setFormPoId}
              mode="outlined"
              style={styles.input}
              accessibilityLabel="Purchase Order Number, optional field"
              accessibilityHint="Enter the associated purchase order number if applicable"
              returnKeyType="done"
            />

            <Text
              style={styles.label}
              accessibilityRole="text"
              nativeID="costDateLabel"
            >
              Cost Date *
            </Text>
            <Button
              mode="outlined"
              onPress={() => setShowDatePicker(true)}
              style={styles.dateButton}
              accessibilityLabel={`Cost date: ${formCostDate.toLocaleDateString()}`}
              accessibilityHint="Tap to change the cost date"
              accessibilityRole="button"
            >
              {formCostDate.toLocaleDateString()}
            </Button>

            {showDatePicker && (
              <DateTimePicker
                value={formCostDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleDateChangeWithAnnouncement}
              />
            )}
          </ScrollView>
        </Dialog.ScrollArea>
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
            onPress={handleSave}
            accessibilityLabel="Save cost"
            accessibilityHint="Save the cost entry"
            accessibilityRole="button"
          >
            Save
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    marginTop: 16,
  },
  categoryButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  categoryButton: {
    marginRight: 8,
  },
  input: {
    marginBottom: 16,
  },
  dateButton: {
    marginBottom: 16,
    borderColor: '#007AFF',
  },
  errorText: {
    fontSize: 12,
    color: '#d32f2f',
    marginTop: -12,
    marginBottom: 12,
    marginLeft: 4,
  },
});
