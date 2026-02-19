import React, { useState, useMemo } from 'react';
import { logger } from '../../services/LoggingService';

import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import DoorsPackageModel from '../../../models/DoorsPackageModel';
import { COLORS } from '../../theme/colors';

/**
 * DoorsLinkingModal
 *
 * Modal for linking BOM items to DOORS packages
 * Shows searchable list of DOORS packages
 */

interface DoorsLinkingModalProps {
  visible: boolean;
  bomItemName: string;
  bomItemId: string;
  onClose: () => void;
  onLink: (doorsPackageId: string, doorsPackageName: string) => Promise<void>;
  doorsPackages: DoorsPackageModel[];
}

const DoorsLinkingModal: React.FC<DoorsLinkingModalProps> = ({
  visible,
  bomItemName,
  onClose,
  onLink,
  doorsPackages,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [linking, setLinking] = useState(false);


  // Filter packages based on search
  const filteredPackages = useMemo(() => {
    if (!doorsPackages || doorsPackages.length === 0) return [];
    if (!searchQuery.trim()) return doorsPackages;

    const query = searchQuery.toLowerCase();
    return doorsPackages.filter(
      pkg =>
        pkg.doorsId.toLowerCase().includes(query) ||
        pkg.equipmentName.toLowerCase().includes(query) ||
        pkg.category.toLowerCase().includes(query)
    );
  }, [doorsPackages, searchQuery]);

  const handleLink = async () => {
    if (!selectedPackageId) return;

    const selectedPackage = doorsPackages.find(pkg => pkg.id === selectedPackageId);
    if (!selectedPackage) return;

    try {
      setLinking(true);
      await onLink(selectedPackageId, selectedPackage.equipmentName);
      setSelectedPackageId(null);
      setSearchQuery('');
      onClose();
    } catch (error) {
      logger.error('[DoorsLinkingModal] Error linking:', error);
    } finally {
      setLinking(false);
    }
  };

  const renderPackageItem = ({ item }: { item: DoorsPackageModel }) => {
    const isSelected = item.id === selectedPackageId;

    return (
      <TouchableOpacity
        style={[styles.packageItem, isSelected && styles.packageItemSelected]}
        onPress={() => setSelectedPackageId(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.packageHeader}>
          <Text style={styles.packageId}>{item.doorsId}</Text>
          <View style={[styles.statusBadge, getStatusColor(item.status)]}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>
        <Text style={styles.packageName}>{item.equipmentName}</Text>
        <View style={styles.packageFooter}>
          <Text style={styles.categoryBadge}>{item.category}</Text>
          <Text style={styles.complianceText}>
            {item.compliancePercentage}% Compliance
          </Text>
        </View>
        {isSelected && (
          <View style={styles.selectedIndicator}>
            <Text style={styles.selectedCheck}>✓</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Link to DOORS</Text>
              <Text style={styles.headerSubtitle}>{bomItemName}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Search */}
          <View style={styles.searchContainer}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search DOORS packages..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#999"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Text style={styles.clearIcon}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Package List */}
          <FlatList
            data={filteredPackages}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={{
                  padding: 16,
                  marginBottom: 12,
                  backgroundColor: '#fff',
                  borderRadius: 8,
                  borderWidth: 2,
                  borderColor: item.id === selectedPackageId ? '#007AFF' : '#E0E0E0',
                }}
                onPress={() => setSelectedPackageId(item.id)}
              >
                <Text style={{fontSize: 16, fontWeight: 'bold'}}>{item.doorsId}</Text>
                <Text style={{fontSize: 14}}>{item.equipmentName}</Text>
                <Text style={{fontSize: 12, color: '#666'}}>{item.category}</Text>
              </TouchableOpacity>
            )}
            keyExtractor={item => item.id}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>📋</Text>
                <Text style={styles.emptyText}>
                  {searchQuery ? 'No packages found' : 'No DOORS packages available'}
                </Text>
              </View>
            }
          />

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.linkButton, !selectedPackageId && styles.linkButtonDisabled]}
              onPress={handleLink}
              disabled={!selectedPackageId || linking}
            >
              {linking ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.linkButtonText}>Link Package</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Helper function
function getStatusColor(status: string) {
  switch (status) {
    case 'draft':
      return { backgroundColor: COLORS.WARNING_BG };
    case 'under_review':
      return { backgroundColor: COLORS.INFO_BG };
    case 'approved':
      return { backgroundColor: COLORS.SUCCESS_BG };
    case 'closed':
      return { backgroundColor: '#F5F5F5' };
    default:
      return { backgroundColor: '#F5F5F5' };
  }
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '90%',
    paddingTop: 20,
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 28,
    color: '#999',
    fontWeight: '300',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    marginHorizontal: 20,
    marginTop: 16,
    paddingHorizontal: 12,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  clearIcon: {
    fontSize: 20,
    color: '#999',
    padding: 4,
  },
  list: {
    flex: 1,
    minHeight: 200,
  },
  listContent: {
    padding: 20,
  },
  packageItem: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    position: 'relative',
  },
  packageItemSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F8FF',
  },
  packageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  packageId: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
  },
  packageName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  packageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryBadge: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  complianceText: {
    fontSize: 12,
    color: '#666',
  },
  selectedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedCheck: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DDD',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  linkButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  linkButtonDisabled: {
    backgroundColor: '#CCC',
  },
  linkButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});

export default DoorsLinkingModal;
