import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Card, Button } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';

interface DateRangeFilterProps {
  startDate: Date | null;
  endDate: Date | null;
  showStartDatePicker: boolean;
  showEndDatePicker: boolean;
  setShowStartDatePicker: (show: boolean) => void;
  setShowEndDatePicker: (show: boolean) => void;
  handleStartDateChange: (event: any, selectedDate?: Date) => void;
  handleEndDateChange: (event: any, selectedDate?: Date) => void;
  handleClearDates: () => void;
}

export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  startDate,
  endDate,
  showStartDatePicker,
  showEndDatePicker,
  setShowStartDatePicker,
  setShowEndDatePicker,
  handleStartDateChange,
  handleEndDateChange,
  handleClearDates,
}) => {
  return (
    <Card style={styles.card}>
      <Card.Content>
        <Text style={styles.sectionTitle}>Date Range Filter</Text>
        <View style={styles.dateFilterContainer}>
          <View style={styles.datePickerRow}>
            <Text style={styles.dateLabel}>Start Date:</Text>
            <Button
              mode="outlined"
              onPress={() => setShowStartDatePicker(true)}
              style={styles.dateButton}
            >
              {startDate ? startDate.toLocaleDateString() : 'All Time'}
            </Button>
          </View>

          <View style={styles.datePickerRow}>
            <Text style={styles.dateLabel}>End Date:</Text>
            <Button
              mode="outlined"
              onPress={() => setShowEndDatePicker(true)}
              style={styles.dateButton}
            >
              {endDate ? endDate.toLocaleDateString() : 'All Time'}
            </Button>
          </View>

          {(startDate || endDate) && (
            <Button mode="text" onPress={handleClearDates} textColor="#007AFF">
              Clear Filters
            </Button>
          )}
        </View>

        {showStartDatePicker && (
          <DateTimePicker
            value={startDate || new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleStartDateChange}
          />
        )}

        {showEndDatePicker && (
          <DateTimePicker
            value={endDate || new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleEndDateChange}
          />
        )}
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    margin: 16,
    marginBottom: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  dateFilterContainer: {
    gap: 12,
  },
  datePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateLabel: {
    fontSize: 14,
    color: '#666',
  },
  dateButton: {
    flex: 1,
    marginLeft: 12,
    borderColor: '#007AFF',
  },
});
