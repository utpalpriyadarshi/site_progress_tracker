import React, { useEffect } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import {
  Portal,
  Dialog,
  Text,
  SegmentedButtons,
  Button,
  TextInput,
  Divider,
} from 'react-native-paper';
import { usePhotoUpload } from '../../../hooks';
import { useChecklist } from '../../../hooks';
import { PhotoGallery } from './PhotoGallery';
import { ChecklistSection } from './ChecklistSection';
import { InspectionFormProps, InspectionType, OverallRating } from '../types';

// Default safety checklist template
const DEFAULT_CHECKLIST = [
  // PPE & Safety Equipment
  { id: '1', category: 'PPE & Safety Equipment', item: 'Hard hats worn by all workers', status: 'na' as const, notes: '' },
  { id: '2', category: 'PPE & Safety Equipment', item: 'Safety boots in good condition', status: 'na' as const, notes: '' },
  { id: '3', category: 'PPE & Safety Equipment', item: 'High-visibility vests worn', status: 'na' as const, notes: '' },
  { id: '4', category: 'PPE & Safety Equipment', item: 'Safety glasses/goggles available', status: 'na' as const, notes: '' },
  { id: '5', category: 'PPE & Safety Equipment', item: 'Gloves appropriate for tasks', status: 'na' as const, notes: '' },
  // Scaffolding & Work at Height
  { id: '6', category: 'Scaffolding & Work at Height', item: 'Scaffolding properly erected and tagged', status: 'na' as const, notes: '' },
  { id: '7', category: 'Scaffolding & Work at Height', item: 'Fall protection systems in place', status: 'na' as const, notes: '' },
  { id: '8', category: 'Scaffolding & Work at Height', item: 'Ladders in good condition', status: 'na' as const, notes: '' },
  { id: '9', category: 'Scaffolding & Work at Height', item: 'Edge protection adequate', status: 'na' as const, notes: '' },
  // Equipment & Tools
  { id: '10', category: 'Equipment & Tools', item: 'Power tools properly guarded', status: 'na' as const, notes: '' },
  { id: '11', category: 'Equipment & Tools', item: 'Equipment inspected and tagged', status: 'na' as const, notes: '' },
  { id: '12', category: 'Equipment & Tools', item: 'Electrical cords in good condition', status: 'na' as const, notes: '' },
  { id: '13', category: 'Equipment & Tools', item: 'Machinery properly maintained', status: 'na' as const, notes: '' },
  // Fire Safety & Emergency
  { id: '14', category: 'Fire Safety & Emergency', item: 'Fire extinguishers accessible', status: 'na' as const, notes: '' },
  { id: '15', category: 'Fire Safety & Emergency', item: 'Emergency exits clearly marked', status: 'na' as const, notes: '' },
  { id: '16', category: 'Fire Safety & Emergency', item: 'First aid kit available', status: 'na' as const, notes: '' },
  { id: '17', category: 'Fire Safety & Emergency', item: 'Emergency contact numbers posted', status: 'na' as const, notes: '' },
  // Housekeeping & Site Conditions
  { id: '18', category: 'Housekeeping & Site Conditions', item: 'Work area clean and organized', status: 'na' as const, notes: '' },
  { id: '19', category: 'Housekeeping & Site Conditions', item: 'Materials properly stored', status: 'na' as const, notes: '' },
  { id: '20', category: 'Housekeeping & Site Conditions', item: 'Waste disposal adequate', status: 'na' as const, notes: '' },
  { id: '21', category: 'Housekeeping & Site Conditions', item: 'Walkways clear of obstructions', status: 'na' as const, notes: '' },
];

/**
 * InspectionForm Component
 *
 * Large composite form component for creating/editing site inspections.
 * Combines multiple sub-components and manages form state.
 *
 * Features:
 * - Inspection type and rating selectors
 * - Safety flag toggle
 * - Notes input
 * - Photo gallery (camera/gallery integration)
 * - Safety checklist with categories
 * - Follow-up scheduling
 * - Edit mode population
 *
 * Uses hooks:
 * - usePhotoUpload for photo management
 * - useChecklist for checklist state
 */
export const InspectionForm: React.FC<InspectionFormProps> = ({
  visible,
  editingInspection,
  selectedSiteId: _selectedSiteId,
  onSave,
  onCancel,
}) => {
  // Form state
  const [inspectionType, setInspectionType] = React.useState<InspectionType>('daily');
  const [overallRating, setOverallRating] = React.useState<OverallRating>('good');
  const [safetyFlagged, setSafetyFlagged] = React.useState(false);
  const [notes, setNotes] = React.useState('');
  const [followUpRequired, setFollowUpRequired] = React.useState(false);
  const [followUpDate, setFollowUpDate] = React.useState('');
  const [followUpNotes, setFollowUpNotes] = React.useState('');

  // Photo upload hook
  const {
    photos,
    photoMenuVisible,
    setPhotoMenuVisible,
    handleTakePhoto,
    handleSelectPhotos,
    handleRemovePhoto,
    setPhotos,
    clearPhotos,
  } = usePhotoUpload({
    maxPhotos: 10,
    quality: 0.8,
  });

  // Checklist hook
  const {
    checklistData,
    setChecklistData,
    expandedCategories,
    toggleCategory,
    updateItemStatus,
    updateItemNotes,
    resetChecklist,
  } = useChecklist({
    defaultChecklist: DEFAULT_CHECKLIST,
    initialExpanded: [],
  });

  /**
   * Populate form when editing
   */
  useEffect(() => {
    if (editingInspection) {
      setInspectionType(editingInspection.inspectionType as InspectionType);
      setOverallRating(editingInspection.overallRating as OverallRating);
      setSafetyFlagged(editingInspection.safetyFlagged);
      setNotes(editingInspection.notes);
      setFollowUpRequired(editingInspection.followUpDate > 0);
      setFollowUpDate(
        editingInspection.followUpDate > 0
          ? new Date(editingInspection.followUpDate).toISOString().split('T')[0]
          : ''
      );
      setFollowUpNotes(editingInspection.followUpNotes || '');

      // Parse and set checklist
      try {
        const parsedChecklist = JSON.parse(editingInspection.checklistData || '[]');
        if (parsedChecklist.length > 0) {
          setChecklistData(parsedChecklist);
        }
      } catch {
        // Use default checklist if parsing fails
        resetChecklist();
      }

      // Parse and set photos
      try {
        const parsedPhotos = JSON.parse(editingInspection.photos || '[]');
        setPhotos(parsedPhotos);
      } catch {
        clearPhotos();
      }
    } else {
      // Reset form for new inspection
      resetForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingInspection]);

  /**
   * Reset form to initial state
   */
  const resetForm = () => {
    setInspectionType('daily');
    setOverallRating('good');
    setSafetyFlagged(false);
    setNotes('');
    setFollowUpRequired(false);
    setFollowUpDate('');
    setFollowUpNotes('');
    resetChecklist();
    clearPhotos();
  };

  /**
   * Handle save button
   */
  const handleSaveClick = async () => {
    await onSave({
      inspectionType,
      overallRating,
      safetyFlagged,
      notes,
      checklistData,
      photos,
      followUpRequired,
      followUpDate,
      followUpNotes,
    });

    // Reset form after save
    resetForm();
  };

  /**
   * Handle cancel button
   */
  const handleCancelClick = () => {
    resetForm();
    onCancel();
  };

  /**
   * Update checklist item (wrapper for hook methods)
   */
  const updateChecklistItem = (id: string, field: 'status' | 'notes', value: any) => {
    if (field === 'status') {
      updateItemStatus(id, value);
    } else if (field === 'notes') {
      updateItemNotes(id, value);
    }
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={handleCancelClick}>
        <Dialog.Title>
          {editingInspection ? 'Edit Inspection' : 'New Site Inspection'}
        </Dialog.Title>
        <Dialog.ScrollArea>
          <ScrollView>
            <View style={styles.dialogContent}>
              {/* Inspection Type */}
              <Text style={styles.label}>Inspection Type</Text>
              <SegmentedButtons
                value={inspectionType}
                onValueChange={(value) => setInspectionType(value as InspectionType)}
                buttons={[
                  { value: 'daily', label: 'Daily' },
                  { value: 'weekly', label: 'Weekly' },
                  { value: 'safety', label: 'Safety' },
                  { value: 'quality', label: 'Quality' },
                ]}
                style={styles.input}
              />

              {/* Overall Rating */}
              <Text style={styles.label}>Overall Rating</Text>
              <SegmentedButtons
                value={overallRating}
                onValueChange={(value) => setOverallRating(value as OverallRating)}
                buttons={[
                  { value: 'excellent', label: 'Excellent' },
                  { value: 'good', label: 'Good' },
                  { value: 'fair', label: 'Fair' },
                  { value: 'poor', label: 'Poor' },
                ]}
                style={styles.input}
              />

              {/* Safety Flag */}
              <View style={styles.safetyFlagRow}>
                <Text style={styles.label}>Safety Issue Found?</Text>
                <Button
                  mode={safetyFlagged ? 'contained' : 'outlined'}
                  icon={safetyFlagged ? 'alert' : 'alert-outline'}
                  onPress={() => setSafetyFlagged(!safetyFlagged)}
                  buttonColor={safetyFlagged ? '#F44336' : undefined}
                  textColor={safetyFlagged ? 'white' : '#F44336'}
                  style={styles.safetyButton}
                >
                  {safetyFlagged ? 'Yes - Flagged' : 'No Issues'}
                </Button>
              </View>

              {/* Notes */}
              <TextInput
                label="Inspection Notes"
                value={notes}
                onChangeText={setNotes}
                mode="outlined"
                multiline
                numberOfLines={4}
                style={styles.input}
                placeholder="Add overall inspection notes..."
              />

              {/* Photo Gallery */}
              <Divider style={styles.divider} />
              <PhotoGallery
                photos={photos}
                maxPhotos={10}
                onTakePhoto={handleTakePhoto}
                onSelectPhoto={handleSelectPhotos}
                onRemovePhoto={handleRemovePhoto}
                photoMenuVisible={photoMenuVisible}
                setPhotoMenuVisible={setPhotoMenuVisible}
              />

              {/* Checklist Section */}
              <Divider style={styles.divider} />
              <ChecklistSection
                checklistData={checklistData}
                expandedCategories={expandedCategories}
                onToggleCategory={toggleCategory}
                onUpdateItem={updateChecklistItem}
              />

              {/* Follow-up Scheduling */}
              <Divider style={styles.divider} />
              <View style={styles.followUpSection}>
                <Text style={styles.sectionTitle}>Schedule Follow-up Inspection</Text>
                <View style={styles.followUpToggleContainer}>
                  <Button
                    mode={followUpRequired ? 'contained' : 'outlined'}
                    icon={followUpRequired ? 'calendar-check' : 'calendar-plus'}
                    onPress={() => setFollowUpRequired(!followUpRequired)}
                    compact
                    buttonColor={followUpRequired ? '#FF9800' : undefined}
                    style={styles.followUpToggleButton}
                  >
                    {followUpRequired ? 'Scheduled' : 'Schedule'}
                  </Button>
                </View>

                {followUpRequired && (
                  <>
                    <TextInput
                      label="Follow-up Date"
                      value={followUpDate}
                      onChangeText={setFollowUpDate}
                      mode="outlined"
                      placeholder="YYYY-MM-DD"
                      style={styles.input}
                      right={<TextInput.Icon icon="calendar" />}
                      keyboardType="numeric"
                    />
                    <TextInput
                      label="Follow-up Notes / Action Items"
                      value={followUpNotes}
                      onChangeText={setFollowUpNotes}
                      mode="outlined"
                      multiline
                      numberOfLines={3}
                      style={styles.input}
                      placeholder="What needs to be checked or fixed..."
                    />
                    <Text style={styles.helperText}>
                      💡 Schedule a follow-up if issues were found that need re-inspection
                    </Text>
                  </>
                )}
              </View>
            </View>
          </ScrollView>
        </Dialog.ScrollArea>
        <Dialog.Actions>
          <Button onPress={handleCancelClick}>Cancel</Button>
          <Button onPress={handleSaveClick}>
            {editingInspection ? 'Update' : 'Create'}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

const styles = StyleSheet.create({
  dialogContent: {
    padding: 16,
  },
  input: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
  },
  safetyFlagRow: {
    marginBottom: 16,
  },
  safetyButton: {
    marginTop: 8,
  },
  divider: {
    marginVertical: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    marginTop: 8,
  },
  followUpSection: {
    marginTop: 8,
  },
  followUpToggleContainer: {
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  followUpToggleButton: {
    alignSelf: 'flex-start',
  },
  helperText: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
    fontStyle: 'italic',
  },
});
