/**
 * ScheduleSection Component
 *
 * Start date, end date, and duration fields with auto-calculations
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, TextInput, HelperText } from 'react-native-paper';
import DatePickerField from '../../components/DatePickerField';

interface ScheduleSectionProps {
  startDate: Date;
  endDate: Date;
  duration: string;
  errors: Record<string, string>;
  isLocked: boolean;
  onStartDateChange: (date: Date) => void;
  onEndDateChange: (date: Date) => void;
  onDurationChange: (value: string) => void;
}

export const ScheduleSection: React.FC<ScheduleSectionProps> = ({
  startDate,
  endDate,
  duration,
  errors,
  isLocked,
  onStartDateChange,
  onEndDateChange,
  onDurationChange,
}) => {
  return (
    <View style={styles.section}>
      <Text variant="labelLarge" style={styles.sectionTitle}>
        Schedule
      </Text>

      <DatePickerField
        label="Start Date *"
        value={startDate}
        onChange={onStartDateChange}
        error={errors.startDate}
        disabled={isLocked}
      />

      <View style={styles.marginTop}>
        <DatePickerField
          label="End Date *"
          value={endDate}
          onChange={onEndDateChange}
          minimumDate={startDate}
          error={errors.endDate}
          disabled={isLocked}
        />
      </View>

      <TextInput
        label="Duration (days) *"
        value={duration}
        onChangeText={onDurationChange}
        mode="outlined"
        keyboardType="number-pad"
        error={!!errors.duration}
        style={styles.marginTop}
        disabled={isLocked}
      />
      {errors.duration && (
        <HelperText type="error">{errors.duration}</HelperText>
      )}
      <HelperText type="info">
        Duration auto-calculates based on start and end dates
      </HelperText>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 8,
    fontWeight: 'bold',
  },
  marginTop: {
    marginTop: 8,
  },
});
