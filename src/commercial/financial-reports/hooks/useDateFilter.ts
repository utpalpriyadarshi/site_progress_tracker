import { useState } from 'react';
import { Platform } from 'react-native';

export const useDateFilter = (
  initialStartDate: Date | null,
  initialEndDate: Date | null,
  setStartDate: (date: Date | null) => void,
  setEndDate: (date: Date | null) => void
) => {
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  const handleStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setStartDate(selectedDate);
    }
  };

  const handleEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setEndDate(selectedDate);
    }
  };

  const handleClearDates = () => {
    setStartDate(null);
    setEndDate(null);
  };

  return {
    showStartDatePicker,
    setShowStartDatePicker,
    showEndDatePicker,
    setShowEndDatePicker,
    handleStartDateChange,
    handleEndDateChange,
    handleClearDates,
  };
};
