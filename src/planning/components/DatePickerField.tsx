/**
 * DatePickerField Component
 *
 * Reusable date picker field with consistent styling for WBS forms
 * Uses @react-native-community/datetimepicker
 */

import React, { useState } from 'react';
import { View, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { TextInput, HelperText } from 'react-native-paper';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import dayjs from 'dayjs';
import { COLORS } from '../../theme/colors';

interface DatePickerFieldProps {
  label: string;
  value: Date;
  onChange: (date: Date) => void;
  error?: string;
  disabled?: boolean;
  minimumDate?: Date;
  maximumDate?: Date;
}

const DatePickerField: React.FC<DatePickerFieldProps> = ({
  label,
  value,
  onChange,
  error,
  disabled = false,
  minimumDate,
  maximumDate,
}) => {
  const [showPicker, setShowPicker] = useState(false);

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    // On Android, the picker closes after selection
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }

    if (event.type === 'set' && selectedDate) {
      onChange(selectedDate);
    }
  };

  const handlePress = () => {
    if (!disabled) {
      setShowPicker(true);
    }
  };

  const formattedDate = dayjs(value).format('MMM DD, YYYY');

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={handlePress} activeOpacity={disabled ? 1 : 0.7}>
        <TextInput
          label={label}
          value={formattedDate}
          mode="outlined"
          editable={false}
          right={<TextInput.Icon icon="calendar" />}
          error={!!error}
          disabled={disabled}
          pointerEvents="none"
        />
      </TouchableOpacity>

      {error && <HelperText type="error">{error}</HelperText>}

      {showPicker && (
        <DateTimePicker
          value={value}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          // On iOS, show inline picker
          {...(Platform.OS === 'ios' && {
            onTouchCancel: () => setShowPicker(false),
          })}
        />
      )}

      {/* iOS: Show Done button */}
      {Platform.OS === 'ios' && showPicker && (
        <View style={styles.iosButtonContainer}>
          <TouchableOpacity
            style={styles.iosButton}
            onPress={() => setShowPicker(false)}
          >
            <HelperText type="info" style={styles.iosButtonText}>
              Done
            </HelperText>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 4,
  },
  iosButtonContainer: {
    alignItems: 'flex-end',
    marginTop: 8,
  },
  iosButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.INFO,
    borderRadius: 4,
  },
  iosButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default DatePickerField;
