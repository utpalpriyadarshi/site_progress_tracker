import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { List, Text, Portal, Dialog, Button, Searchbar } from 'react-native-paper';
import { database } from '../../../models/database';
import UserModel from '../../../models/UserModel';
import { Q } from '@nozbe/watermelondb';

interface SupervisorAssignmentPickerProps {
  visible: boolean;
  selectedSupervisorId?: string;
  onDismiss: () => void;
  onSelect: (supervisorId?: string) => void;
}

const SupervisorAssignmentPicker: React.FC<SupervisorAssignmentPickerProps> = ({
  visible,
  selectedSupervisorId,
  onDismiss,
  onSelect,
}) => {
  const [supervisors, setSupervisors] = useState<UserModel[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      loadSupervisors();
    }
  }, [visible]);

  const loadSupervisors = async () => {
    setLoading(true);
    try {
      // Get all roles to find supervisor role ID
      const roles = await database.collections.get('roles').query().fetch();
      const supervisorRole = roles.find(
        (role: any) => role.name.toLowerCase() === 'supervisor'
      );

      if (supervisorRole) {
        // Get all users with supervisor role
        const supervisorUsers = await database.collections
          .get('users')
          .query(Q.where('role_id', supervisorRole.id))
          .fetch();
        setSupervisors(supervisorUsers as UserModel[]);
      } else {
        setSupervisors([]);
      }
    } catch (error) {
      console.error('Error loading supervisors:', error);
      setSupervisors([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredSupervisors = supervisors.filter((supervisor) =>
    supervisor.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    supervisor.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (supervisorId?: string) => {
    onSelect(supervisorId);
    onDismiss();
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={styles.dialog}>
        <Dialog.Title>Assign Supervisor</Dialog.Title>
        <Dialog.Content>
          <Searchbar
            placeholder="Search supervisors..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchbar}
          />

          <ScrollView style={styles.scrollView}>
            {/* Option to leave unassigned */}
            <List.Item
              title="Unassigned"
              description="No supervisor assigned yet"
              left={(props) => (
                <List.Icon
                  {...props}
                  icon={
                    !selectedSupervisorId
                      ? 'radiobox-marked'
                      : 'radiobox-blank'
                  }
                />
              )}
              onPress={() => handleSelect(undefined)}
              style={styles.listItem}
            />

            {loading ? (
              <Text style={styles.loadingText}>Loading supervisors...</Text>
            ) : filteredSupervisors.length === 0 ? (
              <Text style={styles.emptyText}>
                {searchQuery ? 'No supervisors found' : 'No supervisors available'}
              </Text>
            ) : (
              filteredSupervisors.map((supervisor) => (
                <List.Item
                  key={supervisor.id}
                  title={supervisor.fullName}
                  description={`@${supervisor.username}`}
                  left={(props) => (
                    <List.Icon
                      {...props}
                      icon={
                        selectedSupervisorId === supervisor.id
                          ? 'radiobox-marked'
                          : 'radiobox-blank'
                      }
                    />
                  )}
                  onPress={() => handleSelect(supervisor.id)}
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

export default SupervisorAssignmentPicker;
