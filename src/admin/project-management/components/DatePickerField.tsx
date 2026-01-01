import React from 'react';
import { Platform } from 'react-native';
import { Button, Paragraph } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { StyleSheet } from 'react-native';
import { formatDateObject } from '../utils';

interface DatePickerFieldProps {
  label: string;
  value: Date;
  visible: boolean;
  onPress: () => void;
  onChange: (event: any, selectedDate?: Date) => void;
}

export const DatePickerField: React.FC<DatePickerFieldProps> = ({
  label,
  value,
  visible,
  onPress,
  onChange,
}) => {
  return (
    <>
      <Paragraph style={styles.label}>{label}</Paragraph>
      <Button
        mode="outlined"
        onPress={onPress}
        style={styles.dateButton}
        icon="calendar"
      >
        {formatDateObject(value)}
      </Button>

      {visible && (
        <DateTimePicker
          value={value}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onChange}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  label: {
    marginTop: 10,
    marginBottom: 10,
    fontWeight: 'bold',
  },
  dateButton: {
    marginBottom: 15,
    justifyContent: 'flex-start',
  },
});
