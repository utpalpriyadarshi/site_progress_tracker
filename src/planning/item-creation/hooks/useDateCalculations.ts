import { FormData } from './useItemForm';

interface UseDateCalculationsProps {
  formData: FormData;
  updateField: (field: keyof FormData, value: any) => void;
}

export const useDateCalculations = ({
  formData,
  updateField,
}: UseDateCalculationsProps) => {
  // Handle start date change - auto-calculate end date based on duration
  const handleStartDateChange = (date: Date) => {
    const durationDays = parseInt(formData.duration) || 30;
    const endDate = new Date(date.getTime() + durationDays * 24 * 60 * 60 * 1000);
    updateField('startDate', date);
    updateField('endDate', endDate);
  };

  // Handle end date change - auto-calculate duration
  const handleEndDateChange = (date: Date) => {
    const durationMs = date.getTime() - formData.startDate.getTime();
    const durationDays = Math.max(1, Math.ceil(durationMs / (24 * 60 * 60 * 1000)));
    updateField('endDate', date);
    updateField('duration', durationDays.toString());
  };

  // Handle duration change - auto-calculate end date
  const handleDurationChange = (value: string) => {
    if (value === '' || /^\d+$/.test(value)) {
      const durationDays = parseInt(value) || 1;
      const endDate = new Date(formData.startDate.getTime() + durationDays * 24 * 60 * 60 * 1000);
      updateField('duration', value);
      updateField('endDate', endDate);
    }
  };

  return {
    handleStartDateChange,
    handleEndDateChange,
    handleDurationChange,
  };
};
