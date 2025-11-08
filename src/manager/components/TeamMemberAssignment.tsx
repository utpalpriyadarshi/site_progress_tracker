import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { database } from '../../../models/database';
import { Q } from '@nozbe/watermelondb';
import TeamManagementService from '../../../services/team/TeamManagementService';
import TeamModel from '../../../models/TeamModel';
import TeamMemberModel from '../../../models/TeamMemberModel';

interface TeamMemberAssignmentProps {
  visible: boolean;
  teamId: string;
  onClose: () => void;
  onAssigned: () => void;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

const ROLE_OPTIONS = [
  { value: 'lead', label: 'Team Lead', color: '#2196F3' },
  { value: 'supervisor', label: 'Supervisor', color: '#4CAF50' },
  { value: 'worker', label: 'Worker', color: '#FF9800' },
];

export default function TeamMemberAssignment({
  visible,
  teamId,
  onClose,
  onAssigned,
}: TeamMemberAssignmentProps) {
  const [loading, setLoading] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('worker');
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMemberModel[]>([]);
  const [team, setTeam] = useState<TeamModel | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  useEffect(() => {
    if (visible && teamId) {
      loadData();
    }
  }, [visible, teamId]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load team
      const loadedTeam = await database.collections
        .get<TeamModel>('teams')
        .find(teamId);
      setTeam(loadedTeam);

      // Load team members
      const members = await TeamManagementService.getTeamMembers(teamId);
      setTeamMembers(members);

      // Get assigned user IDs
      const assignedUserIds = members
        .filter((m) => m.status === 'active')
        .map((m) => m.userId);

      // Load all users (mock for now - in real app, fetch from users table)
      // For this implementation, we'll create mock users
      const mockUsers: User[] = [
        { id: 'user1', name: 'John Doe', email: 'john@example.com', role: 'supervisor' },
        { id: 'user2', name: 'Jane Smith', email: 'jane@example.com', role: 'worker' },
        { id: 'user3', name: 'Bob Johnson', email: 'bob@example.com', role: 'worker' },
        { id: 'user4', name: 'Alice Williams', email: 'alice@example.com', role: 'supervisor' },
        { id: 'user5', name: 'Charlie Brown', email: 'charlie@example.com', role: 'worker' },
        { id: 'user6', name: 'Diana Davis', email: 'diana@example.com', role: 'worker' },
        { id: 'user7', name: 'Eve Miller', email: 'eve@example.com', role: 'supervisor' },
        { id: 'user8', name: 'Frank Wilson', email: 'frank@example.com', role: 'worker' },
      ];

      // Filter out already assigned users
      const available = mockUsers.filter((u) => !assignedUserIds.includes(u.id));
      setAvailableUsers(available);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignMember = async () => {
    if (!selectedUserId || isAssigning) {
      if (!selectedUserId) {
        Alert.alert('Error', 'Please select a user to assign');
      }
      return;
    }

    try {
      setIsAssigning(true);
      await TeamManagementService.assignMember(teamId, selectedUserId, selectedRole);
      Alert.alert('Success', 'Team member assigned successfully');
      setSelectedUserId('');
      setSearchQuery('');
      onAssigned();
      await loadData(); // Reload data
    } catch (error) {
      console.error('Error assigning member:', error);
      Alert.alert('Error', 'Failed to assign team member');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleRemoveMember = async (memberId: string, userName: string) => {
    Alert.alert(
      'Remove Member',
      `Are you sure you want to remove ${userName} from the team?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await TeamManagementService.removeMember(memberId);
              Alert.alert('Success', 'Team member removed successfully');
              onAssigned();
              loadData();
            } catch (error) {
              console.error('Error removing member:', error);
              Alert.alert('Error', 'Failed to remove team member');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  // Memoize filtered users for better performance
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) {
      return availableUsers;
    }

    const query = searchQuery.toLowerCase().trim();
    return availableUsers.filter((user) => {
      const nameMatch = user.name.toLowerCase().includes(query);
      const emailMatch = user.email.toLowerCase().includes(query);
      return nameMatch || emailMatch;
    });
  }, [availableUsers, searchQuery]);

  // Memoize active members for better performance
  const activeMembers = useMemo(() =>
    teamMembers.filter((m) => m.status === 'active'),
    [teamMembers]
  );

  // Use useCallback for user selection to prevent re-renders
  const handleUserSelect = useCallback((userId: string) => {
    setSelectedUserId(userId);
  }, []);

  const getRoleColor = (role: string) => {
    const roleOption = ROLE_OPTIONS.find((r) => r.value === role);
    return roleOption?.color || '#757575';
  };

  const getRoleLabel = (role: string) => {
    const roleOption = ROLE_OPTIONS.find((r) => r.value === role);
    return roleOption?.label || role;
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Manage Team Members</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2196F3" />
          </View>
        )}

        {!loading && (
          <ScrollView style={styles.content}>
            {/* Team Info */}
            {team && (
              <View style={styles.teamInfoCard}>
                <Text style={styles.teamName}>{team.name}</Text>
                <Text style={styles.teamInfo}>
                  {team.specialization || 'General Construction'}
                </Text>
                <Text style={styles.teamInfo}>
                  Current Members: {activeMembers.length}
                </Text>
              </View>
            )}

            {/* Current Team Members */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Current Team Members</Text>
              {activeMembers.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>No team members assigned yet</Text>
                </View>
              ) : (
                activeMembers.map((member) => {
                    // Find user info (mock)
                    const user = availableUsers.find((u) => u.id === member.userId) || {
                      id: member.userId,
                      name: `User ${member.userId}`,
                      email: `user${member.userId}@example.com`,
                      role: member.role,
                    };
                    return (
                      <View key={member.id} style={styles.memberCard}>
                        <View style={styles.memberInfo}>
                          <Text style={styles.memberName}>{user.name}</Text>
                          <Text style={styles.memberEmail}>{user.email}</Text>
                          <View
                            style={[
                              styles.roleBadge,
                              { backgroundColor: getRoleColor(member.role) },
                            ]}
                          >
                            <Text style={styles.roleBadgeText}>
                              {getRoleLabel(member.role)}
                            </Text>
                          </View>
                        </View>
                        <TouchableOpacity
                          onPress={() => handleRemoveMember(member.id, user.name)}
                          style={styles.removeButton}
                        >
                          <Text style={styles.removeButtonText}>Remove</Text>
                        </TouchableOpacity>
                      </View>
                    );
                  })
              )}
            </View>

            {/* Assign New Member */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Assign New Member</Text>

              {/* Role Selection */}
              <Text style={styles.label}>Select Role:</Text>
              <View style={styles.roleSelector}>
                {ROLE_OPTIONS.map((role) => (
                  <TouchableOpacity
                    key={role.value}
                    style={[
                      styles.roleOption,
                      selectedRole === role.value && styles.roleOptionSelected,
                      { borderColor: role.color },
                    ]}
                    onPress={() => setSelectedRole(role.value)}
                  >
                    <Text
                      style={[
                        styles.roleOptionText,
                        selectedRole === role.value && { color: role.color },
                      ]}
                    >
                      {role.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Search Users */}
              <Text style={styles.label}>Select User:</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Search by name or email..."
                value={searchQuery}
                onChangeText={setSearchQuery}
              />

              {/* Available Users List */}
              <View style={styles.usersList}>
                {filteredUsers.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyStateText}>
                      {searchQuery
                        ? 'No users found matching search'
                        : 'No available users to assign'}
                    </Text>
                  </View>
                ) : (
                  filteredUsers.map((user) => (
                    <TouchableOpacity
                      key={user.id}
                      style={[
                        styles.userCard,
                        selectedUserId === user.id && styles.userCardSelected,
                      ]}
                      onPress={() => handleUserSelect(user.id)}
                    >
                      <View style={styles.userInfo}>
                        <Text style={styles.userName}>{user.name}</Text>
                        <Text style={styles.userEmail}>{user.email}</Text>
                      </View>
                      {selectedUserId === user.id && (
                        <View style={styles.selectedIndicator}>
                          <Text style={styles.selectedIndicatorText}>✓</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  ))
                )}
              </View>

              {/* Assign Button */}
              {selectedUserId && (
                <TouchableOpacity
                  style={[
                    styles.assignButton,
                    isAssigning && styles.assignButtonDisabled,
                  ]}
                  onPress={handleAssignMember}
                  disabled={isAssigning || loading}
                >
                  {isAssigning ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.assignButtonText}>
                      Assign as {getRoleLabel(selectedRole)}
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    elevation: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212121',
  },
  closeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  closeButtonText: {
    color: '#2196F3',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  teamInfoCard: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  teamName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 8,
  },
  teamInfo: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 4,
  },
  section: {
    backgroundColor: '#fff',
    padding: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 16,
  },
  memberCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 4,
  },
  memberEmail: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 8,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  removeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f44336',
    borderRadius: 4,
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#424242',
    marginBottom: 8,
    marginTop: 8,
  },
  roleSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  roleOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderWidth: 2,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  roleOptionSelected: {
    backgroundColor: '#f0f8ff',
  },
  roleOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#757575',
  },
  searchInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  usersList: {
    maxHeight: 300,
  },
  userCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  userCardSelected: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196F3',
    borderWidth: 2,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#757575',
  },
  selectedIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedIndicatorText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  assignButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  assignButtonDisabled: {
    backgroundColor: '#9E9E9E',
    opacity: 0.7,
  },
  assignButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyState: {
    padding: 24,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#9e9e9e',
    fontStyle: 'italic',
  },
});
