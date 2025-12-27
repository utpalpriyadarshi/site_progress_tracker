import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { database } from '../../models/database';
import DoorsRequirementModel from '../../models/DoorsRequirementModel';
import { useAuth } from '../auth/AuthContext';
import DoorsEditService, { RequirementEditData } from '../services/DoorsEditService';
import { ErrorBoundary } from '../components/common/ErrorBoundary';

/**
 * DOORS Requirement Edit Screen
 *
 * Allows editing of requirement compliance status and vendor response
 * Automatically recalculates package statistics on save
 * Phase 3: Activity 4 - DOORS Advanced Features (Day 2)
 */

interface DoorsRequirementEditScreenProps {
  route: {
    params: {
      requirementId: string;
    };
  };
  navigation: any;
}

const DoorsRequirementEditScreen: React.FC<DoorsRequirementEditScreenProps> = ({ route, navigation }) => {
  const { user, currentRole } = useAuth();
  const { requirementId } = route.params;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [requirement, setRequirement] = useState<DoorsRequirementModel | null>(null);

  // Form state - editable fields
  const [complianceStatus, setComplianceStatus] = useState('');
  const [compliancePercentage, setCompliancePercentage] = useState('');
  const [vendorResponse, setVendorResponse] = useState('');
  const [reviewStatus, setReviewStatus] = useState('');
  const [reviewComments, setReviewComments] = useState('');

  // Load requirement data
  useEffect(() => {
    loadRequirement();
  }, [requirementId]);

  const loadRequirement = async () => {
    try {
      setLoading(true);
      const doorsRequirementsCollection = database.collections.get<DoorsRequirementModel>('doors_requirements');
      const req = await doorsRequirementsCollection.find(requirementId);

      setRequirement(req);
      setComplianceStatus(req.complianceStatus);
      setCompliancePercentage(req.compliancePercentage?.toString() || '');
      setVendorResponse(req.vendorResponse || '');
      setReviewStatus(req.reviewStatus);
      setReviewComments(req.reviewComments || '');
    } catch (error) {
      console.error('[DoorsRequirementEdit] Error loading requirement:', error);
      Alert.alert('Error', 'Failed to load requirement details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!requirement || !user) return;

    try {
      setSaving(true);

      // Validate compliance percentage for partial status
      let percentageNum: number | undefined = undefined;
      if (complianceStatus === 'partial') {
        percentageNum = parseFloat(compliancePercentage);
        if (isNaN(percentageNum) || percentageNum < 0 || percentageNum > 100) {
          Alert.alert('Validation Error', 'Compliance percentage must be between 0 and 100 for partial compliance');
          return;
        }
      }

      // Prepare updates
      const updates: RequirementEditData = {
        complianceStatus,
        compliancePercentage: percentageNum,
        vendorResponse,
        reviewStatus,
        reviewComments,
      };

      // Update requirement
      await DoorsEditService.updateRequirement(requirementId, updates, user.userId, currentRole || 'logistics');

      Alert.alert('Success', 'Requirement updated successfully', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error: any) {
      console.error('[DoorsRequirementEdit] Save error:', error);

      if (error.message && error.message.includes('Validation failed')) {
        Alert.alert('Validation Error', error.message);
      } else if (error.message && error.message.includes("don't have permission")) {
        Alert.alert('Permission Denied', error.message);
      } else {
        Alert.alert('Error', 'Failed to save requirement. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    Alert.alert('Discard Changes?', 'Are you sure you want to discard your changes?', [
      { text: 'Continue Editing', style: 'cancel' },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: () => navigation.goBack(),
      },
    ]);
  };

  if (loading || !requirement) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading requirement...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel} style={styles.headerButton}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Requirement</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving} style={styles.headerButton}>
          {saving ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Read-only: Requirement Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Requirement Details (Read-Only)</Text>
          <View style={styles.readOnlyCard}>
            <Text style={styles.readOnlyLabel}>Code</Text>
            <Text style={styles.readOnlyValue}>{requirement.requirementCode}</Text>
          </View>
          <View style={styles.readOnlyCard}>
            <Text style={styles.readOnlyLabel}>Requirement</Text>
            <Text style={styles.readOnlyValue}>{requirement.requirementText}</Text>
          </View>
          {requirement.specificationClause && (
            <View style={styles.readOnlyCard}>
              <Text style={styles.readOnlyLabel}>Specification Clause</Text>
              <Text style={styles.readOnlyValue}>{requirement.specificationClause}</Text>
            </View>
          )}
          <View style={styles.readOnlyCard}>
            <Text style={styles.readOnlyLabel}>Acceptance Criteria</Text>
            <Text style={styles.readOnlyValue}>{requirement.acceptanceCriteria}</Text>
          </View>
        </View>

        {/* Editable: Compliance Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Compliance Status</Text>

          {/* Status Selector */}
          <Text style={styles.label}>
            Compliance Status <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.statusGrid}>
            {['compliant', 'partial', 'non_compliant', 'not_verified'].map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.statusButton,
                  complianceStatus === status && styles.statusButtonActive,
                ]}
                onPress={() => {
                  setComplianceStatus(status);
                  // Clear percentage if not partial
                  if (status !== 'partial') {
                    setCompliancePercentage('');
                  }
                }}
              >
                <Text
                  style={[
                    styles.statusButtonText,
                    complianceStatus === status && styles.statusButtonTextActive,
                  ]}
                >
                  {status.replace('_', ' ').toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Percentage (only for partial) */}
          {complianceStatus === 'partial' && (
            <>
              <Text style={styles.label}>
                Compliance Percentage (0-100) <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                value={compliancePercentage}
                onChangeText={setCompliancePercentage}
                placeholder="Enter percentage (e.g., 75)"
                placeholderTextColor="#999"
                keyboardType="numeric"
              />
            </>
          )}
        </View>

        {/* Editable: Vendor Response */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vendor Response</Text>
          <Text style={styles.label}>Vendor's Compliance Statement</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={vendorResponse}
            onChangeText={setVendorResponse}
            placeholder="Enter vendor's response to this requirement..."
            placeholderTextColor="#999"
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Editable: Review Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Engineering Review</Text>

          {/* Review Status Selector */}
          <Text style={styles.label}>
            Review Status <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.statusGrid}>
            {['pending', 'approved', 'rejected', 'clarification_needed'].map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.reviewButton,
                  reviewStatus === status && styles.reviewButtonActive,
                ]}
                onPress={() => setReviewStatus(status)}
              >
                <Text
                  style={[
                    styles.reviewButtonText,
                    reviewStatus === status && styles.reviewButtonTextActive,
                  ]}
                >
                  {status.replace('_', ' ').toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Review Comments */}
          <Text style={styles.label}>Review Comments</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={reviewComments}
            onChangeText={setReviewComments}
            placeholder="Enter engineering review comments..."
            placeholderTextColor="#999"
            multiline
            numberOfLines={4}
          />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingTop: 48, // Account for status bar
  },
  headerButton: {
    minWidth: 60,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
  },
  saveButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },

  // Content
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },

  // Sections
  section: {
    backgroundColor: '#FFF',
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },

  // Read-only cards
  readOnlyCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  readOnlyLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  readOnlyValue: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },

  // Form inputs
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
    marginTop: 12,
  },
  required: {
    color: '#F44336',
  },
  input: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },

  // Status buttons
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  statusButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  statusButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
  },
  statusButtonTextActive: {
    color: '#FFF',
  },

  // Review buttons
  reviewButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  reviewButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  reviewButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
  },
  reviewButtonTextActive: {
    color: '#FFF',
  },
});

// Wrap with ErrorBoundary for graceful error handling
const DoorsRequirementEditScreenWithBoundary = () => (
  <ErrorBoundary name="Logistics - DoorsRequirementEditScreen">
    <DoorsRequirementEditScreen />
  </ErrorBoundary>
);

export default DoorsRequirementEditScreenWithBoundary;
