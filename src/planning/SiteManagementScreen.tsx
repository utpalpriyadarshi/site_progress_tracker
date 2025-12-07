import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import {
  Card,
  Title,
  Button,
  TextInput,
  Portal,
  Dialog,
  List,
  IconButton,
  Text,
  Chip,
  Snackbar,
} from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { database } from '../../models/database';
import { withObservables } from '@nozbe/watermelondb/react';
import { Q } from '@nozbe/watermelondb';
import SiteModel from '../../models/SiteModel';
import UserModel from '../../models/UserModel';
import SupervisorAssignmentPicker from './components/SupervisorAssignmentPicker';

const SiteManagementScreenComponent = ({
  sites,
  projects,
}: {
  sites: SiteModel[];
  projects: any[];
}) => {
  const [dialogVisible, setDialogVisible] = useState(false);
  const [supervisorPickerVisible, setSupervisorPickerVisible] = useState(false);
  const [editingSite, setEditingSite] = useState<SiteModel | null>(null);
  const [siteName, setSiteName] = useState('');
  const [siteLocation, setSiteLocation] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedSupervisorId, setSelectedSupervisorId] = useState<string | undefined>(undefined);
  const [supervisorName, setSupervisorName] = useState('Unassigned');

  // v2.11 Phase 4: Date fields
  const [plannedStartDate, setPlannedStartDate] = useState<Date | undefined>(undefined);
  const [plannedEndDate, setPlannedEndDate] = useState<Date | undefined>(undefined);
  const [actualStartDate, setActualStartDate] = useState<Date | undefined>(undefined);
  const [actualEndDate, setActualEndDate] = useState<Date | undefined>(undefined);
  const [showPlannedStartPicker, setShowPlannedStartPicker] = useState(false);
  const [showPlannedEndPicker, setShowPlannedEndPicker] = useState(false);
  const [showActualStartPicker, setShowActualStartPicker] = useState(false);
  const [showActualEndPicker, setShowActualEndPicker] = useState(false);

  // Snackbar state
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarType, setSnackbarType] = useState<'success' | 'error'>('success');

  // Dialog for delete confirmation
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [siteToDelete, setSiteToDelete] = useState<SiteModel | null>(null);

  const openAddDialog = () => {
    setEditingSite(null);
    setSiteName('');
    setSiteLocation('');
    setSelectedProjectId(projects[0]?.id || '');
    setSelectedSupervisorId(undefined);
    setSupervisorName('Unassigned');
    setPlannedStartDate(undefined);
    setPlannedEndDate(undefined);
    setActualStartDate(undefined);
    setActualEndDate(undefined);
    setDialogVisible(true);
  };

  const openEditDialog = async (site: SiteModel) => {
    setEditingSite(site);
    setSiteName(site.name);
    setSiteLocation(site.location);
    setSelectedProjectId(site.projectId);
    setSelectedSupervisorId(site.supervisorId);

    // Load supervisor name
    if (site.supervisorId) {
      try {
        const supervisor = await database.collections
          .get('users')
          .find(site.supervisorId) as UserModel;
        setSupervisorName(supervisor.fullName);
      } catch (error) {
        setSupervisorName('Unassigned');
      }
    } else {
      setSupervisorName('Unassigned');
    }

    // v2.11 Phase 4: Load dates
    setPlannedStartDate(site.plannedStartDate ? new Date(site.plannedStartDate) : undefined);
    setPlannedEndDate(site.plannedEndDate ? new Date(site.plannedEndDate) : undefined);
    setActualStartDate(site.actualStartDate ? new Date(site.actualStartDate) : undefined);
    setActualEndDate(site.actualEndDate ? new Date(site.actualEndDate) : undefined);

    setDialogVisible(true);
  };

  const closeDialog = () => {
    setDialogVisible(false);
    setEditingSite(null);
    setSiteName('');
    setSiteLocation('');
    setSelectedProjectId('');
    setSelectedSupervisorId(undefined);
    setSupervisorName('Unassigned');
  };

  const handleSupervisorSelect = async (supervisorId?: string) => {
    setSelectedSupervisorId(supervisorId);

    if (supervisorId) {
      try {
        const supervisor = await database.collections
          .get('users')
          .find(supervisorId) as UserModel;
        setSupervisorName(supervisor.fullName);
      } catch (error) {
        setSupervisorName('Unassigned');
      }
    } else {
      setSupervisorName('Unassigned');
    }
  };

  const handleSave = async () => {
    if (!siteName.trim() || !siteLocation.trim()) {
      setSnackbarMessage('Please fill in all required fields');
      setSnackbarType('error');
      setSnackbarVisible(true);
      return;
    }

    try {
      await database.write(async () => {
        if (editingSite) {
          // Update existing site
          await editingSite.update((site: any) => {
            site.name = siteName.trim();
            site.location = siteLocation.trim();
            site.projectId = selectedProjectId;
            site.supervisorId = selectedSupervisorId || null;
            // v2.11 Phase 4: Save dates
            site.plannedStartDate = plannedStartDate?.getTime() || null;
            site.plannedEndDate = plannedEndDate?.getTime() || null;
            site.actualStartDate = actualStartDate?.getTime() || null;
            site.actualEndDate = actualEndDate?.getTime() || null;
          });
          setSnackbarMessage('Site updated successfully');
        } else {
          // Create new site
          await database.collections.get('sites').create((site: any) => {
            site.name = siteName.trim();
            site.location = siteLocation.trim();
            site.projectId = selectedProjectId;
            site.supervisorId = selectedSupervisorId || null;
            // v2.11 Phase 4: Save dates
            site.plannedStartDate = plannedStartDate?.getTime() || null;
            site.plannedEndDate = plannedEndDate?.getTime() || null;
            site.actualStartDate = actualStartDate?.getTime() || null;
            site.actualEndDate = actualEndDate?.getTime() || null;
          });
          setSnackbarMessage('Site created successfully');
        }
        setSnackbarType('success');
        setSnackbarVisible(true);
      });
      closeDialog();
    } catch (error) {
      console.error('Error saving site:', error);
      setSnackbarMessage('Failed to save site: ' + (error as Error).message);
      setSnackbarType('error');
      setSnackbarVisible(true);
    }
  };

  const openDeleteDialog = (site: SiteModel) => {
    setSiteToDelete(site);
    setDeleteDialogVisible(true);
  };

  const handleDelete = async () => {
    if (!siteToDelete) return;

    try {
      await database.write(async () => {
        // Note: In production, you should cascade delete or handle related items
        await siteToDelete.markAsDeleted();
      });
      setSnackbarMessage('Site deleted successfully');
      setSnackbarType('success');
      setSnackbarVisible(true);
      setDeleteDialogVisible(false);
      setSiteToDelete(null);
    } catch (error) {
      console.error('Error deleting site:', error);
      setSnackbarMessage('Failed to delete site: ' + (error as Error).message);
      setSnackbarType('error');
      setSnackbarVisible(true);
    }
  };

  // Get supervisor display info
  const getSupervisorInfo = (site: SiteModel) => {
    // This will be reactive through WatermelonDB
    // For simplicity, we'll show the ID or "Unassigned"
    return site.supervisorId || null;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Title>Site Management</Title>
        <Button
          mode="contained"
          icon="plus"
          onPress={openAddDialog}
          style={styles.addButton}
        >
          Add Site
        </Button>
      </View>

      <ScrollView style={styles.scrollView}>
        {sites.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content>
              <Text>No sites found. Create your first site!</Text>
            </Card.Content>
          </Card>
        ) : (
          sites.map((site) => {
            const project = projects.find((p) => p.id === site.projectId);

            return (
              <Card key={site.id} style={styles.siteCard}>
                <Card.Content>
                  <View style={styles.siteHeader}>
                    <View style={styles.siteInfo}>
                      <Text style={styles.siteName}>{site.name}</Text>
                      <Text style={styles.siteLocation}>📍 {site.location}</Text>
                      {project && (
                        <Text style={styles.projectName}>
                          Project: {project.name}
                        </Text>
                      )}
                      <View style={styles.supervisorChip}>
                        <Chip
                          icon={site.supervisorId ? 'account-check' : 'account-alert'}
                          mode="outlined"
                          compact
                          style={site.supervisorId ? styles.assignedChip : styles.unassignedChip}
                        >
                          {site.supervisorId ? 'Assigned' : 'Unassigned'}
                        </Chip>
                      </View>
                    </View>
                    <View style={styles.actions}>
                      <IconButton
                        icon="pencil"
                        size={20}
                        onPress={() => openEditDialog(site)}
                      />
                      <IconButton
                        icon="delete"
                        size={20}
                        iconColor="#FF3B30"
                        onPress={() => openDeleteDialog(site)}
                      />
                    </View>
                  </View>
                </Card.Content>
              </Card>
            );
          })
        )}
      </ScrollView>

      {/* Add/Edit Site Dialog */}
      <Portal>
        <Dialog visible={dialogVisible} onDismiss={closeDialog}>
          <Dialog.Title>
            {editingSite ? 'Edit Site' : 'Add New Site'}
          </Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Site Name *"
              value={siteName}
              onChangeText={setSiteName}
              mode="outlined"
              style={styles.input}
            />
            <TextInput
              label="Location *"
              value={siteLocation}
              onChangeText={setSiteLocation}
              mode="outlined"
              style={styles.input}
              multiline
              numberOfLines={2}
            />

            {projects.length > 0 && (
              <View style={styles.projectSelector}>
                <Text style={styles.label}>Select Project:</Text>
                <ScrollView style={styles.projectList}>
                  {projects.map((project) => (
                    <List.Item
                      key={project.id}
                      title={project.name}
                      left={(props) => (
                        <List.Icon
                          {...props}
                          icon={
                            selectedProjectId === project.id
                              ? 'radiobox-marked'
                              : 'radiobox-blank'
                          }
                        />
                      )}
                      onPress={() => setSelectedProjectId(project.id)}
                    />
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Supervisor Assignment */}
            <View style={styles.supervisorSection}>
              <Text style={styles.label}>Assign Supervisor:</Text>
              <Button
                mode="outlined"
                icon="account"
                onPress={() => setSupervisorPickerVisible(true)}
                style={styles.supervisorButton}
              >
                {supervisorName}
              </Button>
            </View>

            {/* v2.11 Phase 4: Date Fields */}
            <View style={styles.dateSection}>
              <Text style={styles.sectionTitle}>Schedule Dates</Text>

              {/* Planned Start Date */}
              <View style={styles.dateRow}>
                <Text style={styles.dateLabel}>Planned Start:</Text>
                <Button
                  mode="outlined"
                  icon="calendar"
                  onPress={() => setShowPlannedStartPicker(true)}
                  style={styles.dateButton}
                >
                  {plannedStartDate ? plannedStartDate.toLocaleDateString() : 'Not Set'}
                </Button>
                {plannedStartDate && (
                  <IconButton
                    icon="close"
                    size={16}
                    onPress={() => setPlannedStartDate(undefined)}
                  />
                )}
              </View>

              {/* Planned End Date */}
              <View style={styles.dateRow}>
                <Text style={styles.dateLabel}>Planned End:</Text>
                <Button
                  mode="outlined"
                  icon="calendar"
                  onPress={() => setShowPlannedEndPicker(true)}
                  style={styles.dateButton}
                >
                  {plannedEndDate ? plannedEndDate.toLocaleDateString() : 'Not Set'}
                </Button>
                {plannedEndDate && (
                  <IconButton
                    icon="close"
                    size={16}
                    onPress={() => setPlannedEndDate(undefined)}
                  />
                )}
              </View>

              {/* Actual Start Date */}
              <View style={styles.dateRow}>
                <Text style={styles.dateLabel}>Actual Start:</Text>
                <Button
                  mode="outlined"
                  icon="calendar"
                  onPress={() => setShowActualStartPicker(true)}
                  style={styles.dateButton}
                >
                  {actualStartDate ? actualStartDate.toLocaleDateString() : 'Not Set'}
                </Button>
                {actualStartDate && (
                  <IconButton
                    icon="close"
                    size={16}
                    onPress={() => setActualStartDate(undefined)}
                  />
                )}
              </View>

              {/* Actual End Date */}
              <View style={styles.dateRow}>
                <Text style={styles.dateLabel}>Actual End:</Text>
                <Button
                  mode="outlined"
                  icon="calendar"
                  onPress={() => setShowActualEndPicker(true)}
                  style={styles.dateButton}
                >
                  {actualEndDate ? actualEndDate.toLocaleDateString() : 'Not Set'}
                </Button>
                {actualEndDate && (
                  <IconButton
                    icon="close"
                    size={16}
                    onPress={() => setActualEndDate(undefined)}
                  />
                )}
              </View>
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={closeDialog}>Cancel</Button>
            <Button onPress={handleSave}>
              {editingSite ? 'Update' : 'Create'}
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog
          visible={deleteDialogVisible}
          onDismiss={() => setDeleteDialogVisible(false)}
        >
          <Dialog.Title>Delete Site</Dialog.Title>
          <Dialog.Content>
            <Text>
              Are you sure you want to delete "{siteToDelete?.name}"? This will
              also delete all associated items and data.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleDelete} textColor="#FF3B30">
              Delete
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* v2.11 Phase 4: Date Pickers */}
      {showPlannedStartPicker && (
        <DateTimePicker
          value={plannedStartDate || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            setShowPlannedStartPicker(Platform.OS === 'ios');
            if (selectedDate) setPlannedStartDate(selectedDate);
          }}
        />
      )}
      {showPlannedEndPicker && (
        <DateTimePicker
          value={plannedEndDate || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            setShowPlannedEndPicker(Platform.OS === 'ios');
            if (selectedDate) setPlannedEndDate(selectedDate);
          }}
        />
      )}
      {showActualStartPicker && (
        <DateTimePicker
          value={actualStartDate || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            setShowActualStartPicker(Platform.OS === 'ios');
            if (selectedDate) setActualStartDate(selectedDate);
          }}
        />
      )}
      {showActualEndPicker && (
        <DateTimePicker
          value={actualEndDate || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            setShowActualEndPicker(Platform.OS === 'ios');
            if (selectedDate) setActualEndDate(selectedDate);
          }}
        />
      )}

      {/* Supervisor Assignment Picker */}
      <SupervisorAssignmentPicker
        visible={supervisorPickerVisible}
        selectedSupervisorId={selectedSupervisorId}
        onDismiss={() => setSupervisorPickerVisible(false)}
        onSelect={handleSupervisorSelect}
      />

      {/* Snackbar for notifications */}
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        style={snackbarType === 'error' ? styles.errorSnackbar : styles.successSnackbar}
      >
        {snackbarMessage}
      </Snackbar>
    </View>
  );
};

// Enhance component with WatermelonDB observables
const enhance = withObservables([], () => ({
  sites: database.collections.get('sites').query(), // Load ALL sites for planner
  projects: database.collections.get('projects').query(),
}));

const SiteManagementScreen = enhance(SiteManagementScreenComponent as any);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    elevation: 2,
  },
  addButton: {
    marginLeft: 8,
  },
  scrollView: {
    flex: 1,
  },
  emptyCard: {
    margin: 16,
    elevation: 2,
  },
  siteCard: {
    margin: 16,
    marginBottom: 8,
    elevation: 2,
  },
  siteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  siteInfo: {
    flex: 1,
  },
  siteName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  siteLocation: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  projectName: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  supervisorChip: {
    marginTop: 4,
    flexDirection: 'row',
  },
  assignedChip: {
    backgroundColor: '#E8F5E9',
  },
  unassignedChip: {
    backgroundColor: '#FFF3E0',
  },
  actions: {
    flexDirection: 'row',
  },
  input: {
    marginBottom: 12,
  },
  projectSelector: {
    marginTop: 8,
    marginBottom: 12,
  },
  projectList: {
    maxHeight: 150,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  supervisorSection: {
    marginTop: 8,
  },
  supervisorButton: {
    marginTop: 4,
  },
  // v2.11 Phase 4: Date section styles
  dateSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateLabel: {
    fontSize: 14,
    width: 100,
    color: '#666',
  },
  dateButton: {
    flex: 1,
    marginRight: 4,
  },
  errorSnackbar: {
    backgroundColor: '#D32F2F',
  },
  successSnackbar: {
    backgroundColor: '#388E3C',
  },
});

export default SiteManagementScreen;
