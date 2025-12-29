/**
 * Edit Progress Dialog Component
 */

import React from 'react';
import { View, StyleSheet, ScrollView, Platform } from 'react-native';
import { Portal, Dialog, TextInput, Button, Text, Chip, IconButton } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import MilestoneModel from '../../../../models/MilestoneModel';
import { STATUS_OPTIONS } from '../utils/milestoneConstants';
import { formatStatusLabel } from '../utils/milestoneFormatters';

interface EditProgressDialogProps {
  visible: boolean;
  milestone: MilestoneModel | null;
  progressPercentage: string;
  status: string;
  notes: string;
  plannedStartDate: Date | undefined;
  plannedEndDate: Date | undefined;
  actualStartDate: Date | undefined;
  actualEndDate: Date | undefined;
  showPlannedStartPicker: boolean;
  showPlannedEndPicker: boolean;
  showActualStartPicker: boolean;
  showActualEndPicker: boolean;
  onChangeProgressPercentage: (value: string) => void;
  onChangeStatus: (value: string) => void;
  onChangeNotes: (value: string) => void;
  onChangePlannedStartDate: (date: Date | undefined) => void;
  onChangePlannedEndDate: (date: Date | undefined) => void;
  onChangeActualStartDate: (date: Date | undefined) => void;
  onChangeActualEndDate: (date: Date | undefined) => void;
  onShowPlannedStartPicker: (show: boolean) => void;
  onShowPlannedEndPicker: (show: boolean) => void;
  onShowActualStartPicker: (show: boolean) => void;
  onShowActualEndPicker: (show: boolean) => void;
  onSave: () => void;
  onCancel: () => void;
}

export const EditProgressDialog: React.FC<EditProgressDialogProps> = ({
  visible,
  milestone,
  progressPercentage,
  status,
  notes,
  plannedStartDate,
  plannedEndDate,
  actualStartDate,
  actualEndDate,
  showPlannedStartPicker,
  showPlannedEndPicker,
  showActualStartPicker,
  showActualEndPicker,
  onChangeProgressPercentage,
  onChangeStatus,
  onChangeNotes,
  onChangePlannedStartDate,
  onChangePlannedEndDate,
  onChangeActualStartDate,
  onChangeActualEndDate,
  onShowPlannedStartPicker,
  onShowPlannedEndPicker,
  onShowActualStartPicker,
  onShowActualEndPicker,
  onSave,
  onCancel,
}) => {
  return (
    <>
      {/* Main Dialog */}
      <Portal>
        <Dialog visible={visible} onDismiss={onCancel} style={styles.dialog}>
          <Dialog.Title>
            {milestone?.milestoneCode} - {milestone?.milestoneName}
          </Dialog.Title>
          <Dialog.ScrollArea>
            <ScrollView>
              <Dialog.Content>
                {/* Progress Percentage */}
                <TextInput
                  label="Progress (%)"
                  value={progressPercentage}
                  onChangeText={onChangeProgressPercentage}
                  keyboardType="numeric"
                  mode="outlined"
                  style={styles.input}
                />

                {/* Status */}
                <Text style={styles.label}>Status:</Text>
                <View style={styles.statusSelector}>
                  {STATUS_OPTIONS.map((statusOption) => (
                    <Chip
                      key={statusOption}
                      mode={status === statusOption ? 'flat' : 'outlined'}
                      selected={status === statusOption}
                      onPress={() => onChangeStatus(statusOption)}
                      style={styles.statusSelectorChip}
                    >
                      {formatStatusLabel(statusOption)}
                    </Chip>
                  ))}
                </View>

                {/* Planned Dates */}
                <Text style={styles.sectionTitle}>Planned Dates</Text>
                <View style={styles.dateRow}>
                  <Text style={styles.dateLabel}>Start:</Text>
                  <Button
                    mode="outlined"
                    icon="calendar"
                    onPress={() => onShowPlannedStartPicker(true)}
                    style={styles.dateButton}
                  >
                    {plannedStartDate ? plannedStartDate.toLocaleDateString() : 'Not Set'}
                  </Button>
                  {plannedStartDate && (
                    <IconButton
                      icon="close"
                      size={16}
                      onPress={() => onChangePlannedStartDate(undefined)}
                    />
                  )}
                </View>
                <View style={styles.dateRow}>
                  <Text style={styles.dateLabel}>End:</Text>
                  <Button
                    mode="outlined"
                    icon="calendar"
                    onPress={() => onShowPlannedEndPicker(true)}
                    style={styles.dateButton}
                  >
                    {plannedEndDate ? plannedEndDate.toLocaleDateString() : 'Not Set'}
                  </Button>
                  {plannedEndDate && (
                    <IconButton
                      icon="close"
                      size={16}
                      onPress={() => onChangePlannedEndDate(undefined)}
                    />
                  )}
                </View>

                {/* Actual Dates */}
                <Text style={styles.sectionTitle}>Actual Dates</Text>
                <View style={styles.dateRow}>
                  <Text style={styles.dateLabel}>Start:</Text>
                  <Button
                    mode="outlined"
                    icon="calendar"
                    onPress={() => onShowActualStartPicker(true)}
                    style={styles.dateButton}
                  >
                    {actualStartDate ? actualStartDate.toLocaleDateString() : 'Not Set'}
                  </Button>
                  {actualStartDate && (
                    <IconButton
                      icon="close"
                      size={16}
                      onPress={() => onChangeActualStartDate(undefined)}
                    />
                  )}
                </View>
                <View style={styles.dateRow}>
                  <Text style={styles.dateLabel}>End:</Text>
                  <Button
                    mode="outlined"
                    icon="calendar"
                    onPress={() => onShowActualEndPicker(true)}
                    style={styles.dateButton}
                  >
                    {actualEndDate ? actualEndDate.toLocaleDateString() : 'Not Set'}
                  </Button>
                  {actualEndDate && (
                    <IconButton
                      icon="close"
                      size={16}
                      onPress={() => onChangeActualEndDate(undefined)}
                    />
                  )}
                </View>

                {/* Notes */}
                <TextInput
                  label="Notes"
                  value={notes}
                  onChangeText={onChangeNotes}
                  mode="outlined"
                  multiline
                  numberOfLines={3}
                  style={styles.input}
                />
              </Dialog.Content>
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={onCancel}>Cancel</Button>
            <Button onPress={onSave}>Save</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Date Pickers */}
      {showPlannedStartPicker && (
        <DateTimePicker
          value={plannedStartDate || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            onShowPlannedStartPicker(Platform.OS === 'ios');
            if (selectedDate) onChangePlannedStartDate(selectedDate);
          }}
        />
      )}
      {showPlannedEndPicker && (
        <DateTimePicker
          value={plannedEndDate || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            onShowPlannedEndPicker(Platform.OS === 'ios');
            if (selectedDate) onChangePlannedEndDate(selectedDate);
          }}
        />
      )}
      {showActualStartPicker && (
        <DateTimePicker
          value={actualStartDate || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            onShowActualStartPicker(Platform.OS === 'ios');
            if (selectedDate) onChangeActualStartDate(selectedDate);
          }}
        />
      )}
      {showActualEndPicker && (
        <DateTimePicker
          value={actualEndDate || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            onShowActualEndPicker(Platform.OS === 'ios');
            if (selectedDate) onChangeActualEndDate(selectedDate);
          }}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  dialog: {
    maxHeight: '80%',
  },
  input: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  statusSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  statusSelectorChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 8,
    color: '#333',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateLabel: {
    fontSize: 14,
    width: 60,
    color: '#666',
  },
  dateButton: {
    flex: 1,
    marginRight: 4,
  },
});
