import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  FlatList,
} from 'react-native';
import { COLORS } from '../../../theme/colors';

/**
 * TeamMemberSelector
 *
 * Reusable dropdown/modal selector for choosing team members with search and filter
 *
 * Features:
 * - Search functionality
 * - Filter by role/site
 * - Multi-select support
 * - Availability indicators
 * - Avatar display (with fallback initials)
 * - Alphabetical sorting
 * - Selected count badge
 * - Confirm/Cancel actions
 * - Empty state handling
 *
 * @example
 * ```tsx
 * <TeamMemberSelector
 *   visible={isVisible}
 *   members={teamMembers}
 *   onSelect={(ids) => console.log('Selected:', ids)}
 *   onCancel={() => setIsVisible(false)}
 *   multiSelect={true}
 *   title="Select Team Members"
 * />
 * ```
 */

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  site?: string;
  availability?: 'available' | 'busy' | 'offline';
}

interface TeamMemberSelectorProps {
  visible: boolean;
  members: TeamMember[];
  selectedMembers?: string[];
  onSelect: (memberIds: string[]) => void;
  onCancel: () => void;
  multiSelect?: boolean;
  filterBySite?: string;
  filterByRole?: string;
  showAvailability?: boolean;
  title?: string;
  searchPlaceholder?: string;
}

const TeamMemberSelector: React.FC<TeamMemberSelectorProps> = ({
  visible,
  members,
  selectedMembers = [],
  onSelect,
  onCancel,
  multiSelect = false,
  filterBySite,
  filterByRole,
  showAvailability = true,
  title = 'Select Team Member',
  searchPlaceholder = 'Search by name...',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selected, setSelected] = useState<string[]>(selectedMembers);

  // Reset selection when modal opens
  React.useEffect(() => {
    if (visible) {
      setSelected(selectedMembers);
      setSearchQuery('');
    }
  }, [visible, selectedMembers]);

  // Filter and search members
  const filteredMembers = useMemo(() => {
    let filtered = members;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((member) =>
        member.name.toLowerCase().includes(query)
      );
    }

    // Filter by site
    if (filterBySite) {
      filtered = filtered.filter((member) => member.site === filterBySite);
    }

    // Filter by role
    if (filterByRole) {
      filtered = filtered.filter((member) => member.role === filterByRole);
    }

    // Sort alphabetically by name
    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  }, [members, searchQuery, filterBySite, filterByRole]);

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getAvatarColor = (name: string) => {
    // Generate consistent color based on name
    const colors = [COLORS.INFO, COLORS.SUCCESS, COLORS.WARNING, COLORS.STATUS_EVALUATED, COLORS.ERROR, '#00BCD4'];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const getAvailabilityColor = (availability?: TeamMember['availability']) => {
    switch (availability) {
      case 'available':
        return COLORS.SUCCESS;
      case 'busy':
        return '#FFC107';
      case 'offline':
        return COLORS.DISABLED;
      default:
        return COLORS.DISABLED;
    }
  };

  const toggleSelection = (memberId: string) => {
    if (multiSelect) {
      if (selected.includes(memberId)) {
        setSelected(selected.filter((id) => id !== memberId));
      } else {
        setSelected([...selected, memberId]);
      }
    } else {
      setSelected([memberId]);
    }
  };

  const handleConfirm = () => {
    onSelect(selected);
  };

  const handleCancel = () => {
    setSelected(selectedMembers);
    onCancel();
  };

  const renderMember = ({ item }: { item: TeamMember }) => {
    const isSelected = selected.includes(item.id);

    return (
      <TouchableOpacity
        style={[styles.memberItem, isSelected && styles.memberItemSelected]}
        onPress={() => toggleSelection(item.id)}
      >
        {/* Avatar */}
        <View
          style={[styles.avatar, { backgroundColor: getAvatarColor(item.name) }]}
        >
          {item.avatar ? (
            <Text style={styles.avatarImage}>{item.avatar}</Text>
          ) : (
            <Text style={styles.avatarText}>{getInitials(item.name)}</Text>
          )}
          {showAvailability && item.availability && (
            <View
              style={[
                styles.availabilityDot,
                { backgroundColor: getAvailabilityColor(item.availability) },
              ]}
            />
          )}
        </View>

        {/* Member Info */}
        <View style={styles.memberInfo}>
          <Text style={styles.memberName}>{item.name}</Text>
          <View style={styles.memberMeta}>
            <Text style={styles.memberRole}>{item.role}</Text>
            {item.site && (
              <>
                <Text style={styles.metaSeparator}>•</Text>
                <Text style={styles.memberSite}>{item.site}</Text>
              </>
            )}
          </View>
        </View>

        {/* Selection Indicator */}
        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
          {isSelected && <Text style={styles.checkmark}>✓</Text>}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleCancel}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{title}</Text>
            {multiSelect && selected.length > 0 && (
              <View style={styles.selectedBadge}>
                <Text style={styles.selectedBadgeText}>Selected ({selected.length})</Text>
              </View>
            )}
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={searchPlaceholder}
              placeholderTextColor="#999"
            />
          </View>

          {/* Members List */}
          {filteredMembers.length > 0 ? (
            <FlatList
              data={filteredMembers}
              renderItem={renderMember}
              keyExtractor={(item) => item.id}
              style={styles.list}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                {searchQuery ? 'No members found' : 'No team members available'}
              </Text>
            </View>
          )}

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmButton, selected.length === 0 && styles.confirmButtonDisabled]}
              onPress={handleConfirm}
              disabled={selected.length === 0}
            >
              <Text style={styles.confirmButtonText}>
                Confirm {multiSelect && selected.length > 0 && `(${selected.length})`}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  selectedBadge: {
    backgroundColor: COLORS.INFO,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  selectedBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  searchContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  searchInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#333',
  },
  list: {
    maxHeight: 400,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  memberItemSelected: {
    backgroundColor: COLORS.INFO_BG,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    position: 'relative',
  },
  avatarImage: {
    fontSize: 24,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  availabilityDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  memberMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberRole: {
    fontSize: 13,
    color: '#666',
  },
  metaSeparator: {
    fontSize: 13,
    color: '#999',
    marginHorizontal: 6,
  },
  memberSite: {
    fontSize: 13,
    color: '#666',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: COLORS.INFO,
    borderColor: COLORS.INFO,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  actions: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  cancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    marginRight: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  confirmButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: COLORS.INFO,
    alignItems: 'center',
    marginLeft: 8,
  },
  confirmButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default TeamMemberSelector;
