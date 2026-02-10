/**
 * TeamMemberPicker Component
 *
 * Generic user assignment picker that can filter users by project and/or role.
 * Replaces SupervisorAssignmentPicker with more flexible functionality.
 *
 * @version 2.0.0
 * @since Phase 2 - Activity Management Enhancement
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { List, Text, Portal, Dialog, Button, Searchbar } from 'react-native-paper';
import { database } from '../../../models/database';
import UserModel from '../../../models/UserModel';
import { Q } from '@nozbe/watermelondb';
import { logger } from '../../services/LoggingService';

interface TeamMemberPickerProps {
  visible: boolean;
  selectedUserId?: string;
  projectId?: string; // Filter by project assignment
  roleFilter?: string; // Optional: filter by role name (e.g., 'supervisor')
  title?: string; // Dialog title (default: "Assign Team Member")
  onDismiss: () => void;
  onSelect: (userId?: string) => void;
}

const TeamMemberPicker: React.FC<TeamMemberPickerProps> = ({
  visible,
  selectedUserId,
  projectId,
  roleFilter,
  title = 'Assign Team Member',
  onDismiss,
  onSelect,
}) => {
  const [users, setUsers] = useState<UserModel[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      loadUsers();
    }
  }, [visible, projectId, roleFilter]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      // Build query conditions
      const queryConditions: any[] = [];

      // Filter by project if provided
      if (projectId) {
        queryConditions.push(Q.where('project_id', projectId));
      }

      // Filter by role if provided
      if (roleFilter) {
        // Get role ID for the specified role name
        const roles = await database.collections.get('roles').query().fetch();
        const targetRole = roles.find(
          (role: any) => role.name.toLowerCase() === roleFilter.toLowerCase()
        );

        if (targetRole) {
          queryConditions.push(Q.where('role_id', targetRole.id));
        } else {
          // If role not found, return empty list
          setUsers([]);
          setLoading(false);
          return;
        }
      }

      // Query users with the built conditions
      const userQuery = queryConditions.length > 0
        ? database.collections.get('users').query(...queryConditions)
        : database.collections.get('users').query();

      const fetchedUsers = await userQuery.fetch();
      setUsers(fetchedUsers as UserModel[]);
    } catch (error) {
      logger.error('[TeamMemberPicker] Error loading users', error as Error, {
        component: 'TeamMemberPicker',
        projectId,
        roleFilter,
      });
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((user) =>
    user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (userId?: string) => {
    onSelect(userId);
    onDismiss();
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={styles.dialog}>
        <Dialog.Title>{title}</Dialog.Title>
        <Dialog.Content>
          <Searchbar
            placeholder="Search team members..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchbar}
          />

          <ScrollView style={styles.scrollView}>
            {/* Option to leave unassigned */}
            <List.Item
              title="Unassigned"
              description="No team member assigned yet"
              left={(props) => (
                <List.Icon
                  {...props}
                  icon={
                    !selectedUserId
                      ? 'radiobox-marked'
                      : 'radiobox-blank'
                  }
                />
              )}
              onPress={() => handleSelect(undefined)}
              style={styles.listItem}
            />

            {loading ? (
              <Text style={styles.loadingText}>Loading team members...</Text>
            ) : filteredUsers.length === 0 ? (
              <Text style={styles.emptyText}>
                {searchQuery
                  ? 'No team members found'
                  : projectId
                    ? 'No users assigned to this project'
                    : 'No users available'}
              </Text>
            ) : (
              filteredUsers.map((user) => (
                <List.Item
                  key={user.id}
                  title={user.fullName}
                  description={`@${user.username}`}
                  left={(props) => (
                    <List.Icon
                      {...props}
                      icon={
                        selectedUserId === user.id
                          ? 'radiobox-marked'
                          : 'radiobox-blank'
                      }
                    />
                  )}
                  onPress={() => handleSelect(user.id)}
                  style={styles.listItem}
                />
              ))
            )}
          </ScrollView>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss}>Cancel</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

const styles = StyleSheet.create({
  dialog: {
    maxHeight: '80%',
  },
  searchbar: {
    marginBottom: 12,
  },
  scrollView: {
    maxHeight: 400,
  },
  listItem: {
    paddingVertical: 4,
  },
  loadingText: {
    textAlign: 'center',
    padding: 16,
    color: '#666',
  },
  emptyText: {
    textAlign: 'center',
    padding: 16,
    color: '#999',
  },
});

export default TeamMemberPicker;
