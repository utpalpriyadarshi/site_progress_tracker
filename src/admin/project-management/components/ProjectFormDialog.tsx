import React from 'react';
import { View, StyleSheet, ScrollView, Platform } from 'react-native';
import {
  Portal,
  Modal,
  Title,
  TextInput,
  Button,
  Paragraph,
  Chip,
} from 'react-native-paper';
import ProjectModel from '../../../../models/ProjectModel';
import { ProjectFormData, PROJECT_STATUSES } from '../utils';
import { DatePickerField } from './DatePickerField';

interface ProjectFormDialogProps {
  visible: boolean;
  editingProject: ProjectModel | null;
  formData: ProjectFormData;
  showStartDatePicker: boolean;
  showEndDatePicker: boolean;
  onDismiss: () => void;
  onFormDataChange: (data: Partial<ProjectFormData>) => void;
  onSave: () => void;
  onStartDatePress: () => void;
  onEndDatePress: () => void;
  onStartDateChange: (event: any, selectedDate?: Date) => void;
  onEndDateChange: (event: any, selectedDate?: Date) => void;
}

export const ProjectFormDialog: React.FC<ProjectFormDialogProps> = ({
  visible,
  editingProject,
  formData,
  showStartDatePicker,
  showEndDatePicker,
  onDismiss,
  onFormDataChange,
  onSave,
  onStartDatePress,
  onEndDatePress,
  onStartDateChange,
  onEndDateChange,
}) => {
  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={styles.modalContent}>
        <ScrollView>
          <Title style={styles.modalTitle}>
            {editingProject ? 'Edit Project' : 'Create New Project'}
          </Title>

          <TextInput
            label="Project Name"
            value={formData.name}
            onChangeText={(text) => onFormDataChange({ name: text })}
            style={styles.input}
            mode="outlined"
          />

          <TextInput
            label="Client"
            value={formData.client}
            onChangeText={(text) => onFormDataChange({ client: text })}
            style={styles.input}
            mode="outlined"
          />

          <TextInput
            label="Budget"
            value={formData.budget}
            onChangeText={(text) => onFormDataChange({ budget: text })}
            style={styles.input}
            mode="outlined"
            keyboardType="numeric"
          />

          <DatePickerField
            label="Start Date"
            value={formData.startDate}
            visible={showStartDatePicker}
            onPress={onStartDatePress}
            onChange={onStartDateChange}
          />

          <DatePickerField
            label="End Date"
            value={formData.endDate}
            visible={showEndDatePicker}
            onPress={onEndDatePress}
            onChange={onEndDateChange}
          />

          <Paragraph style={styles.label}>Status</Paragraph>
          <View style={styles.statusButtons}>
            {PROJECT_STATUSES.map((status) => (
              <Chip
                key={status}
                selected={formData.status === status}
                onPress={() => onFormDataChange({ status })}
                style={styles.statusOption}
              >
                {status.replace('_', ' ').toUpperCase()}
              </Chip>
            ))}
          </View>

          <View style={styles.modalActions}>
            <Button onPress={onDismiss}>Cancel</Button>
            <Button mode="contained" onPress={onSave}>
              {editingProject ? 'Update' : 'Create'}
            </Button>
          </View>
        </ScrollView>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
    maxHeight: '80%',
  },
  modalTitle: {
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    marginBottom: 15,
  },
  label: {
    marginTop: 10,
    marginBottom: 10,
    fontWeight: 'bold',
  },
  statusButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  statusOption: {
    marginRight: 10,
    marginBottom: 10,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 20,
  },
});
