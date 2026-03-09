import React, { useState, useMemo } from 'react';
import { logger } from '../services/LoggingService';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Snackbar } from 'react-native-paper';
import { useSnackbar } from '../hooks/useSnackbar';
import { database } from '../../models/database';
import DoorsPackageModel from '../../models/DoorsPackageModel';
import VendorModel from '../../models/VendorModel';
import { Q } from '@nozbe/watermelondb';
import withObservables from '@nozbe/with-observables';
import { useAuth } from '../auth/AuthContext';
import RfqService from '../services/RfqService';
import { ErrorBoundary } from '../components/common/ErrorBoundary';


/**
 * RFQ Create Screen
 *
 * Create new RFQ from a DOORS package
 * - Select DOORS package
 * - Set closing date and delivery timeline
 * - Select vendors to invite
 * - Review and create/issue RFQ
 *
 * Phase 3: Activity 4 - Days 5-7
 */

interface RfqCreateScreenProps {
  navigation: any;
  route: any;
  doorsPackages: DoorsPackageModel[];
  vendors: VendorModel[];
}

const RfqCreateScreen: React.FC<RfqCreateScreenProps> = ({
  navigation,
  route,
  doorsPackages,
  vendors,
}) => {
  const { user } = useAuth();
  const { show: showSnackbar, snackbarProps } = useSnackbar();

  // Debug logging
  React.useEffect(() => {
    logger.debug('[RfqCreate] Loaded:', {
      doorsPackages: doorsPackages.length,
      vendors: vendors.length,
    });
  }, [doorsPackages.length, vendors.length]);

  // Pre-selected DOORS package from navigation
  const preSelectedDoorsId = route.params?.doorsPackageId;

  // Form state
  const [selectedDoorsPackage, setSelectedDoorsPackage] = useState<DoorsPackageModel | null>(
    preSelectedDoorsId
      ? doorsPackages.find((pkg) => pkg.id === preSelectedDoorsId) || null
      : null
  );
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [closingDate, setClosingDate] = useState('');
  const [expectedDeliveryDays, setExpectedDeliveryDays] = useState('60');
  const [selectedVendorIds, setSelectedVendorIds] = useState<Set<string>>(new Set());

  // Modal state
  const [showDoorsModal, setShowDoorsModal] = useState(false);
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [doorsSearchQuery, setDoorsSearchQuery] = useState('');
  const [vendorSearchQuery, setVendorSearchQuery] = useState('');

  // Loading state
  const [creating, setCreating] = useState(false);

  // Auto-generate title when DOORS package is selected
  React.useEffect(() => {
    if (selectedDoorsPackage && !title) {
      setTitle(`RFQ for ${selectedDoorsPackage.equipmentName}`);
      setDescription(
        `Request for Quotation for ${selectedDoorsPackage.equipmentName} (${selectedDoorsPackage.quantity} ${selectedDoorsPackage.unit})`
      );
    }
  }, [selectedDoorsPackage]);

  // Filter DOORS packages
  const filteredDoorsPackages = useMemo(() => {
    let filtered = doorsPackages.filter((pkg) => pkg.status !== 'closed');

    if (doorsSearchQuery.trim()) {
      const query = doorsSearchQuery.toLowerCase();
      filtered = filtered.filter(
        (pkg) =>
          pkg.doorsId.toLowerCase().includes(query) ||
          pkg.equipmentName.toLowerCase().includes(query) ||
          pkg.category.toLowerCase().includes(query)
      );
    }

    logger.debug('[RfqCreate] Filtered DOORS packages:', { value: filtered.length });
    return filtered;
  }, [doorsPackages, doorsSearchQuery]);

  // Filter vendors (only approved vendors)
  const filteredVendors = useMemo(() => {
    let filtered = vendors.filter((v) => v.isApproved);

    // Filter by category if DOORS package selected
    if (selectedDoorsPackage) {
      filtered = filtered.filter((v) => v.category === selectedDoorsPackage.category);
    }

    if (vendorSearchQuery.trim()) {
      const query = vendorSearchQuery.toLowerCase();
      filtered = filtered.filter(
        (v) =>
          v.vendorName.toLowerCase().includes(query) ||
          v.vendorCode.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [vendors, selectedDoorsPackage, vendorSearchQuery]);

  // Toggle vendor selection
  const toggleVendor = (vendorId: string) => {
    const newSet = new Set(selectedVendorIds);
    if (newSet.has(vendorId)) {
      newSet.delete(vendorId);
    } else {
      newSet.add(vendorId);
    }
    setSelectedVendorIds(newSet);
  };

  // Validate form
  const validateForm = (): { valid: boolean; error?: string } => {
    if (!selectedDoorsPackage) {
      return { valid: false, error: 'Please select a DOORS package' };
    }
    if (!title.trim()) {
      return { valid: false, error: 'Please enter RFQ title' };
    }
    if (selectedVendorIds.size === 0) {
      return { valid: false, error: 'Please select at least one vendor' };
    }
    if (closingDate && !isValidDate(closingDate)) {
      return { valid: false, error: 'Please enter valid closing date (DD/MM/YYYY)' };
    }
    const deliveryDays = parseInt(expectedDeliveryDays);
    if (isNaN(deliveryDays) || deliveryDays < 1) {
      return { valid: false, error: 'Please enter valid expected delivery days' };
    }
    return { valid: true };
  };

  // Parse date string (DD/MM/YYYY) to timestamp
  const parseDateString = (dateStr: string): number | undefined => {
    if (!dateStr) return undefined;
    const parts = dateStr.split('/');
    if (parts.length !== 3) return undefined;
    const day = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1;
    const year = parseInt(parts[2]);
    const date = new Date(year, month, day);
    return date.getTime();
  };

  // Validate date string
  const isValidDate = (dateStr: string): boolean => {
    const timestamp = parseDateString(dateStr);
    if (!timestamp) return false;
    // Check if date is in the future
    return timestamp > Date.now();
  };

  // Create RFQ (as draft)
  const handleCreateDraft = async () => {
    const validation = validateForm();
    if (!validation.valid) {
      showSnackbar(validation.error!);
      return;
    }

    try {
      setCreating(true);

      const rfq = await RfqService.createRfq(
        {
          doorsPackageId: selectedDoorsPackage!.id,
          title: title.trim(),
          description: description.trim(),
          closingDate: parseDateString(closingDate),
          expectedDeliveryDays: parseInt(expectedDeliveryDays),
          vendorIds: Array.from(selectedVendorIds),
        },
        user?.userId || 'demo-user'
      );

      showSnackbar('RFQ created as draft successfully');
      navigation.navigate('RfqDetail', { rfqId: rfq.id });
    } catch (error) {
      logger.error('[RfqCreate] Error creating RFQ:', error as Error);
      showSnackbar('Failed to create RFQ. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  // Create and Issue RFQ
  const handleCreateAndIssue = async () => {
    const validation = validateForm();
    if (!validation.valid) {
      showSnackbar(validation.error!);
      return;
    }

    if (!closingDate) {
      showSnackbar('Closing date is required to issue RFQ');
      return;
    }

    Alert.alert(
      'Confirm Issue',
      `Issue RFQ to ${selectedVendorIds.size} vendor(s)? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Issue',
          style: 'default',
          onPress: async () => {
            try {
              setCreating(true);

              // Create RFQ
              logger.info('[RfqCreate] Step 1: Creating RFQ...');
              const rfq = await RfqService.createRfq(
                {
                  doorsPackageId: selectedDoorsPackage!.id,
                  title: title.trim(),
                  description: description.trim(),
                  closingDate: parseDateString(closingDate)!,
                  expectedDeliveryDays: parseInt(expectedDeliveryDays),
                  vendorIds: Array.from(selectedVendorIds),
                },
                user?.userId || 'demo-user'
              );
              logger.info('[RfqCreate] Step 2: RFQ created successfully, ID:', { value: rfq.id });

              // Issue RFQ
              logger.info('[RfqCreate] Step 3: Issuing RFQ...');
              await RfqService.issueRfq(rfq.id);
              logger.info('[RfqCreate] Step 4: RFQ issued successfully');

              showSnackbar('RFQ issued successfully to vendors');
              navigation.navigate('RfqDetail', { rfqId: rfq.id });
            } catch (error) {
              logger.error('[RfqCreate] Error issuing RFQ:', error as Error);
              showSnackbar('Failed to issue RFQ. Please try again.');
            } finally {
              setCreating(false);
            }
          },
        },
      ]
    );
  };

  // Render DOORS package selection modal
  const renderDoorsModal = () => (
    <Modal visible={showDoorsModal} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select DOORS Package</Text>
            <TouchableOpacity onPress={() => setShowDoorsModal(false)}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.modalSearchInput}
            placeholder="Search packages..."
            value={doorsSearchQuery}
            onChangeText={setDoorsSearchQuery}
            placeholderTextColor="#9CA3AF"
          />

          <FlatList
            data={filteredDoorsPackages}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => {
                  setSelectedDoorsPackage(item);
                  setShowDoorsModal(false);
                  setDoorsSearchQuery('');
                }}
              >
                <Text style={styles.modalItemTitle}>{item.equipmentName}</Text>
                <Text style={styles.modalItemSubtitle}>
                  {item.doorsId} • {item.category} • {item.compliancePercentage}% compliant
                </Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={{ padding: 20, alignItems: 'center' }}>
                <Text style={{ color: '#6B7280' }}>No DOORS packages available</Text>
              </View>
            }
            style={styles.modalList}
            contentContainerStyle={{ flexGrow: 1 }}
          />
        </View>
      </View>
    </Modal>
  );

  // Render vendor selection modal
  const renderVendorModal = () => (
    <Modal visible={showVendorModal} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Vendors</Text>
            <TouchableOpacity onPress={() => setShowVendorModal(false)}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.modalSearchInput}
            placeholder="Search vendors..."
            value={vendorSearchQuery}
            onChangeText={setVendorSearchQuery}
            placeholderTextColor="#9CA3AF"
          />

          <Text style={styles.selectedCount}>
            {selectedVendorIds.size} vendor(s) selected
          </Text>

          <FlatList
            data={filteredVendors}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
              const isSelected = selectedVendorIds.has(item.id);
              return (
                <TouchableOpacity
                  style={[styles.modalItem, isSelected && styles.modalItemSelected]}
                  onPress={() => toggleVendor(item.id)}
                >
                  <View style={styles.modalItemContent}>
                    <Text style={styles.modalItemTitle}>{item.vendorName}</Text>
                    <Text style={styles.modalItemSubtitle}>
                      {item.vendorCode} • Rating: {item.rating || 'N/A'}/5
                    </Text>
                  </View>
                  {isSelected && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
              );
            }}
            style={styles.modalList}
          />

          <TouchableOpacity
            style={styles.modalDoneButton}
            onPress={() => setShowVendorModal(false)}
          >
            <Text style={styles.modalDoneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <Text style={styles.screenTitle}>Create New RFQ</Text>

        {/* DOORS Package Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            1. Select DOORS Package <Text style={styles.required}>*</Text>
          </Text>
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => setShowDoorsModal(true)}
            disabled={!!preSelectedDoorsId}
          >
            <Text style={styles.selectButtonText}>
              {selectedDoorsPackage
                ? `${selectedDoorsPackage.equipmentName} (${selectedDoorsPackage.doorsId})`
                : 'Tap to select DOORS package'}
            </Text>
          </TouchableOpacity>
          {selectedDoorsPackage && (
            <View style={styles.packageInfo}>
              <Text style={styles.packageInfoText}>
                Category: {selectedDoorsPackage.category} • Qty: {selectedDoorsPackage.quantity}{' '}
                {selectedDoorsPackage.unit}
              </Text>
              <Text style={styles.packageInfoText}>
                Compliance: {selectedDoorsPackage.compliancePercentage}%
              </Text>
            </View>
          )}
        </View>

        {/* RFQ Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            2. RFQ Details <Text style={styles.required}>*</Text>
          </Text>
          <Text style={styles.inputLabel}>Title</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Enter RFQ title"
            value={title}
            onChangeText={setTitle}
            placeholderTextColor="#9CA3AF"
          />

          <Text style={styles.inputLabel}>Description</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            placeholder="Enter RFQ description"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {/* Timeline */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Timeline</Text>

          <Text style={styles.inputLabel}>Closing Date (DD/MM/YYYY)</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g., 31/12/2025"
            value={closingDate}
            onChangeText={setClosingDate}
            keyboardType="numbers-and-punctuation"
            placeholderTextColor="#9CA3AF"
          />

          <Text style={styles.inputLabel}>
            Expected Delivery Days <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g., 60"
            value={expectedDeliveryDays}
            onChangeText={setExpectedDeliveryDays}
            keyboardType="numeric"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {/* Vendor Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            4. Select Vendors <Text style={styles.required}>*</Text>
          </Text>
          <TouchableOpacity style={styles.selectButton} onPress={() => setShowVendorModal(true)}>
            <Text style={styles.selectButtonText}>
              {selectedVendorIds.size > 0
                ? `${selectedVendorIds.size} vendor(s) selected`
                : 'Tap to select vendors'}
            </Text>
          </TouchableOpacity>
          {selectedDoorsPackage && filteredVendors.length === 0 && (
            <Text style={styles.warningText}>
              No approved vendors found for category: {selectedDoorsPackage.category}
            </Text>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.button, styles.draftButton]}
            onPress={handleCreateDraft}
            disabled={creating}
          >
            {creating ? (
              <ActivityIndicator color="#3B82F6" />
            ) : (
              <Text style={styles.draftButtonText}>Save as Draft</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.issueButton]}
            onPress={handleCreateAndIssue}
            disabled={creating}
          >
            {creating ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.issueButtonText}>Create & Issue</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modals */}
      {renderDoorsModal()}
      {renderVendorModal()}
      <Snackbar {...snackbarProps} duration={3000} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 24,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  required: {
    color: '#EF4444',
  },
  selectButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectButtonText: {
    fontSize: 14,
    color: '#111827',
  },
  packageInfo: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 6,
  },
  packageInfoText: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 12,
  },
  textInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  warningText: {
    fontSize: 13,
    color: '#EF4444',
    marginTop: 8,
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  draftButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  draftButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
  },
  issueButton: {
    backgroundColor: '#3B82F6',
  },
  issueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    height: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  modalClose: {
    fontSize: 24,
    color: '#6B7280',
    fontWeight: '300',
  },
  modalSearchInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    fontSize: 14,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectedCount: {
    fontSize: 13,
    color: '#6B7280',
    paddingHorizontal: 16,
    marginBottom: 8,
    fontWeight: '600',
  },
  modalList: {
    flex: 1,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalItemSelected: {
    backgroundColor: '#EFF6FF',
  },
  modalItemContent: {
    flex: 1,
  },
  modalItemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  modalItemSubtitle: {
    fontSize: 13,
    color: '#6B7280',
  },
  checkmark: {
    fontSize: 20,
    color: '#3B82F6',
    fontWeight: '700',
  },
  modalDoneButton: {
    backgroundColor: '#3B82F6',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalDoneButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

// HOC to inject observables
const enhance = withObservables([], () => ({
  doorsPackages: database.collections.get<DoorsPackageModel>('doors_packages').query().observe(),
  vendors: database.collections.get<VendorModel>('vendors').query().observe(),
}));

const EnhancedRfqCreateScreen = enhance(RfqCreateScreen);

// Wrap with ErrorBoundary for graceful error handling
const RfqCreateScreenWithBoundary = (props: any) => (
  <ErrorBoundary name="Logistics - RfqCreateScreen">
    <EnhancedRfqCreateScreen {...props} />
  </ErrorBoundary>
);

export default RfqCreateScreenWithBoundary;
