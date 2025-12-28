import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { Portal, Dialog, Button, TextInput, Chip } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { COST_CATEGORIES } from '../utils';

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
}) => {
  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss}>
        <Dialog.Title>{title}</Dialog.Title>
        <Dialog.ScrollArea>
          <ScrollView style={styles.content}>
            <Text style={styles.label}>Category *</Text>
            <View style={styles.categoryButtons}>
              {COST_CATEGORIES.map((cat) => (
                <Chip
                  key={cat.value}
                  selected={formCategory === cat.value}
                  onPress={() => setFormCategory(cat.value)}
                  style={styles.categoryButton}
                  selectedColor="#007AFF"
                >
                  {cat.label}
                </Chip>
              ))}
            </View>

            <TextInput
              label="Amount *"
              value={formAmount}
              onChangeText={setFormAmount}
              keyboardType="numeric"
              mode="outlined"
              style={styles.input}
              left={<TextInput.Affix text="$" />}
            />

            <TextInput
              label="Description *"
              value={formDescription}
              onChangeText={setFormDescription}
              mode="outlined"
              multiline
              numberOfLines={3}
              style={styles.input}
            />

            <TextInput
              label="Purchase Order # (Optional)"
              value={formPoId}
              onChangeText={setFormPoId}
              mode="outlined"
              style={styles.input}
            />

            <Text style={styles.label}>Cost Date *</Text>
            <Button
              mode="outlined"
              onPress={() => setShowDatePicker(true)}
              style={styles.dateButton}
            >
              {formCostDate.toLocaleDateString()}
            </Button>

            {showDatePicker && (
              <DateTimePicker
                value={formCostDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleDateChange}
              />
            )}
          </ScrollView>
        </Dialog.ScrollArea>
        <Dialog.Actions>
          <Button onPress={onDismiss}>Cancel</Button>
          <Button onPress={onSave}>Save</Button>
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
});
