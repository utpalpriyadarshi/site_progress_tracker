import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { database } from '../../../models/database';
import SiteModel from '../../../models/SiteModel';
import ResourceRequestService from '../../../services/resource/ResourceRequestService';

interface ResourceRequestFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  currentUserId: string;
  preSelectedSite?: string;
}

/**
 * ResourceRequestForm
 *
 * Form for creating new resource requests.
 * Supports equipment, materials, and personnel requests.
 */
const ResourceRequestForm: React.FC<ResourceRequestFormProps> = ({
  onSuccess,
  onCancel,
  currentUserId,
  preSelectedSite,
}) => {
  const [sites, setSites] = useState<SiteModel[]>([]);
  const [resourceType, setResourceType] = useState<string>('equipment');
  const [resourceName, setResourceName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [priority, setPriority] = useState<string>('medium');
  const [siteId, setSiteId] = useState(preSelectedSite || '');
  const [neededByDays, setNeededByDays] = useState('7');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const resourceTypes = [
    { value: 'equipment', label: 'Equipment' },
    { value: 'material', label: 'Material' },
    { value: 'personnel', label: 'Personnel' },
  ];

  const priorities = [
    { value: 'low', label: 'Low', color: '#4CAF50' },
    { value: 'medium', label: 'Medium', color: '#FFC107' },
    { value: 'high', label: 'High', color: '#FF9800' },
    { value: 'urgent', label: 'Urgent', color: '#F44336' },
  ];

  useEffect(() => {
    loadSites();
  }, []);

  const loadSites = async () => {
    try {
      const loadedSites = await database.collections
        .get<SiteModel>('sites')
        .query()
        .fetch();
      setSites(loadedSites);
    } catch (error) {
      console.error('Error loading sites:', error);
    }
  };

  const getPriorityColor = (priorityValue: string) => {
    const p = priorities.find((pr) => pr.value === priorityValue);
    return p?.color || '#999';
  };

  const validateForm = (): boolean => {
    if (!resourceName.trim()) {
      Alert.alert('Validation Error', 'Please enter resource name');
      return false;
    }

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid quantity');
      return false;
    }

    if (!siteId) {
      Alert.alert('Validation Error', 'Please select a site');
      return false;
    }

    const days = parseInt(neededByDays, 10);
    if (isNaN(days) || days <= 0) {
      Alert.alert('Validation Error', 'Please enter valid number of days');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setSubmitting(true);

      const neededByDate = Date.now() + parseInt(neededByDays, 10) * 24 * 60 * 60 * 1000;

      await ResourceRequestService.createRequest({
        requestedBy: currentUserId,
        siteId,
        resourceType,
        resourceName: resourceName.trim(),
        quantity: parseInt(quantity, 10),
        priority,
        neededByDate,
        notes: notes.trim() || undefined,
      });

      Alert.alert('Success', 'Resource request submitted successfully');

      // Reset form
      setResourceName('');
      setQuantity('1');
      setPriority('medium');
      setNotes('');
      setNeededByDays('7');

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error creating resource request:', error);
      Alert.alert('Error', 'Failed to submit resource request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>New Resource Request</Text>

      {/* Resource Type */}
      <Text style={styles.label}>Resource Type *</Text>
      <View style={styles.typeSelector}>
        {resourceTypes.map((type) => (
          <TouchableOpacity
            key={type.value}
            style={[
              styles.typeOption,
              resourceType === type.value && styles.selectedTypeOption,
            ]}
            onPress={() => setResourceType(type.value)}
          >
            <Text
              style={[
                styles.typeOptionText,
                resourceType === type.value && styles.selectedTypeOptionText,
              ]}
            >
              {type.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Resource Name */}
      <Text style={styles.label}>Resource Name *</Text>
      <TextInput
        style={styles.input}
        value={resourceName}
        onChangeText={setResourceName}
        placeholder={`Enter ${resourceType} name`}
        placeholderTextColor="#999"
      />

      {/* Quantity */}
      <Text style={styles.label}>Quantity *</Text>
      <TextInput
        style={styles.input}
        value={quantity}
        onChangeText={setQuantity}
        keyboardType="numeric"
        placeholder="Enter quantity"
        placeholderTextColor="#999"
      />

      {/* Priority */}
      <Text style={styles.label}>Priority *</Text>
      <View style={styles.prioritySelector}>
        {priorities.map((p) => (
          <TouchableOpacity
            key={p.value}
            style={[
              styles.priorityOption,
              priority === p.value && {
                backgroundColor: p.color,
                borderColor: p.color,
              },
            ]}
            onPress={() => setPriority(p.value)}
          >
            <Text
              style={[
                styles.priorityOptionText,
                priority === p.value && styles.selectedPriorityOptionText,
              ]}
            >
              {p.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Site Selection */}
      <Text style={styles.label}>Site *</Text>
      <ScrollView style={styles.siteSelector} nestedScrollEnabled>
        {sites.map((site) => (
          <TouchableOpacity
            key={site.id}
            style={[
              styles.siteOption,
              siteId === site.id && styles.selectedSiteOption,
            ]}
            onPress={() => setSiteId(site.id)}
          >
            <Text
              style={[
                styles.siteOptionText,
                siteId === site.id && styles.selectedSiteOptionText,
              ]}
            >
              {site.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Needed By Date */}
      <Text style={styles.label}>Needed within (days) *</Text>
      <TextInput
        style={styles.input}
        value={neededByDays}
        onChangeText={setNeededByDays}
        keyboardType="numeric"
        placeholder="Number of days"
        placeholderTextColor="#999"
      />
      <Text style={styles.helpText}>
        Request will be marked as needed by {neededByDays} days from now
      </Text>

      {/* Notes */}
      <Text style={styles.label}>Notes (Optional)</Text>
      <TextInput
        style={[styles.input, styles.notesInput]}
        value={notes}
        onChangeText={setNotes}
        placeholder="Additional details or requirements"
        placeholderTextColor="#999"
        multiline
        numberOfLines={4}
        textAlignVertical="top"
      />

      {/* Action Buttons */}
      <View style={styles.actions}>
        {onCancel && (
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={onCancel}
            disabled={submitting}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.button, styles.submitButton]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          <Text style={styles.submitButtonText}>
            {submitting ? 'Submitting...' : 'Submit Request'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Priority Legend */}
      <View style={styles.legend}>
        <Text style={styles.legendTitle}>Priority Levels:</Text>
        <View style={styles.legendItems}>
          {priorities.map((p) => (
            <View key={p.value} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: p.color }]} />
              <Text style={styles.legendText}>{p.label}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  notesInput: {
    minHeight: 100,
  },
  helpText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
  typeSelector: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  typeOption: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
  },
  selectedTypeOption: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  typeOptionText: {
    fontSize: 14,
    color: '#666',
  },
  selectedTypeOptionText: {
    color: '#fff',
    fontWeight: '600',
  },
  prioritySelector: {
    flexDirection: 'row',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  priorityOption: {
    padding: 12,
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  priorityOptionText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  selectedPriorityOptionText: {
    color: '#fff',
  },
  siteSelector: {
    maxHeight: 150,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 8,
  },
  siteOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedSiteOption: {
    backgroundColor: '#E3F2FD',
  },
  siteOptionText: {
    fontSize: 16,
    color: '#333',
  },
  selectedSiteOptionText: {
    fontWeight: '600',
    color: '#2196F3',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 24,
    marginBottom: 16,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginLeft: 12,
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#2196F3',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  legend: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  legendItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
});

export default ResourceRequestForm;
