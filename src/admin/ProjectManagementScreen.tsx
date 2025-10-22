import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Platform } from 'react-native';
import {
  FAB,
  Searchbar,
  Card,
  Title,
  Paragraph,
  Button,
  Portal,
  Modal,
  TextInput,
  Chip,
  IconButton,
  ActivityIndicator,
  Dialog,
  Surface,
  Text,
} from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { database } from '../../models/database';
import ProjectModel from '../../models/ProjectModel';
import { Q } from '@nozbe/watermelondb';
import { useSnackbar } from '../components/Snackbar';
import { ConfirmDialog } from '../components/Dialog';

interface ProjectFormData {
  name: string;
  client: string;
  startDate: Date;
  endDate: Date;
  status: 'active' | 'completed' | 'on_hold' | 'cancelled';
  budget: string;
}

const ProjectManagementScreen = () => {
  const { showSnackbar } = useSnackbar();
  const [projects, setProjects] = useState<ProjectModel[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<ProjectModel[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectModel | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<ProjectModel | null>(null);
  const [deleteMessage, setDeleteMessage] = useState('');
  const [formData, setFormData] = useState<ProjectFormData>({
    name: '',
    client: '',
    startDate: new Date(),
    endDate: new Date(),
    status: 'active',
    budget: '0',
  });
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    filterProjects();
  }, [searchQuery, projects]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const projectsList = await database.collections
        .get<ProjectModel>('projects')
        .query()
        .fetch();
      setProjects(projectsList);
    } catch (error) {
      console.error('Error loading projects:', error);
      showSnackbar('Failed to load projects', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filterProjects = () => {
    if (!searchQuery.trim()) {
      setFilteredProjects(projects);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = projects.filter(
      (project) =>
        project.name.toLowerCase().includes(query) ||
        project.client.toLowerCase().includes(query) ||
        project.status.toLowerCase().includes(query)
    );
    setFilteredProjects(filtered);
  };

  const openCreateModal = () => {
    setEditingProject(null);
    setFormData({
      name: '',
      client: '',
      startDate: new Date(),
      endDate: new Date(),
      status: 'active',
      budget: '0',
    });
    setModalVisible(true);
  };

  const openEditModal = (project: ProjectModel) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      client: project.client,
      startDate: new Date(project.startDate),
      endDate: new Date(project.endDate),
      status: project.status as any,
      budget: project.budget.toString(),
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    // Validation
    if (!formData.name.trim()) {
      setModalVisible(false);
      showSnackbar('Project name is required', 'warning');
      return;
    }
    if (!formData.client.trim()) {
      setModalVisible(false);
      showSnackbar('Client name is required', 'warning');
      return;
    }

    const budget = parseFloat(formData.budget);
    if (isNaN(budget) || budget < 0) {
      setModalVisible(false);
      showSnackbar('Please enter a valid budget', 'warning');
      return;
    }

    try {
      await database.write(async () => {
        if (editingProject) {
          // Update existing project
          await editingProject.update((project: any) => {
            project.name = formData.name;
            project.client = formData.client;
            project.startDate = formData.startDate.getTime();
            project.endDate = formData.endDate.getTime();
            project.status = formData.status;
            project.budget = budget;
          });
        } else {
          // Create new project
          await database.collections.get('projects').create((project: any) => {
            project.name = formData.name;
            project.client = formData.client;
            project.startDate = formData.startDate.getTime();
            project.endDate = formData.endDate.getTime();
            project.status = formData.status;
            project.budget = budget;
          });
        }
      });

      setModalVisible(false);
      loadProjects();
      showSnackbar(
        editingProject ? 'Project updated successfully' : 'Project created successfully',
        'success'
      );
    } catch (error) {
      console.error('Error saving project:', error);
      showSnackbar('Failed to save project', 'error');
    }
  };

  const handleDelete = async (project: ProjectModel) => {
    // Get sites count for this project
    const sites = await database.collections
      .get('sites')
      .query(Q.where('project_id', project.id))
      .fetch();

    const sitesCount = sites.length;
    const message =
      sitesCount > 0
        ? `This project has ${sitesCount} site(s). Deleting it will also delete all associated sites, items, and data. This action cannot be undone.`
        : 'Are you sure you want to delete this project? This action cannot be undone.';

    setProjectToDelete(project);
    setDeleteMessage(message);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!projectToDelete) return;

    setShowDeleteDialog(false);
    try {
      // Get sites count for this project
      const sites = await database.collections
        .get('sites')
        .query(Q.where('project_id', projectToDelete.id))
        .fetch();

      await database.write(async () => {
        // Cascade delete: Delete all sites and their related data
        for (const site of sites) {
          // Get all items for this site
          const items = await database.collections
            .get('items')
            .query(Q.where('site_id', site.id))
            .fetch();

          // Delete all related data for each item
          for (const item of items) {
            // Delete progress logs
            const progressLogs = await database.collections
              .get('progress_logs')
              .query(Q.where('item_id', item.id))
              .fetch();
            await Promise.all(progressLogs.map((log) => log.markAsDeleted()));

            // Delete hindrances
            const hindrances = await database.collections
              .get('hindrances')
              .query(Q.where('item_id', item.id))
              .fetch();
            await Promise.all(hindrances.map((h) => h.markAsDeleted()));

            // Delete materials
            const materials = await database.collections
              .get('materials')
              .query(Q.where('item_id', item.id))
              .fetch();
            await Promise.all(materials.map((m) => m.markAsDeleted()));

            // Delete the item
            await item.markAsDeleted();
          }

          // Delete site-level hindrances
          const siteHindrances = await database.collections
            .get('hindrances')
            .query(Q.where('site_id', site.id))
            .fetch();
          await Promise.all(siteHindrances.map((h) => h.markAsDeleted()));

          // Delete daily reports
          const dailyReports = await database.collections
            .get('daily_reports')
            .query(Q.where('site_id', site.id))
            .fetch();
          await Promise.all(dailyReports.map((r) => r.markAsDeleted()));

          // Delete site inspections
          const inspections = await database.collections
            .get('site_inspections')
            .query(Q.where('site_id', site.id))
            .fetch();
          await Promise.all(inspections.map((i) => i.markAsDeleted()));

          // Delete the site
          await site.markAsDeleted();
        }

        // Finally, delete the project
        await projectToDelete.markAsDeleted();
      });

      loadProjects();
      showSnackbar('Project and all related data deleted successfully', 'success');
      setProjectToDelete(null);
    } catch (error) {
      console.error('Error deleting project:', error);
      showSnackbar('Failed to delete project', 'error');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#4CAF50';
      case 'completed':
        return '#2196F3';
      case 'on_hold':
        return '#FF9800';
      case 'cancelled':
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setFormData({ ...formData, startDate: selectedDate });
    }
  };

  const handleEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setFormData({ ...formData, endDate: selectedDate });
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search projects..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
      />

      <ScrollView style={styles.scrollView}>
        {filteredProjects.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Paragraph>No projects found</Paragraph>
          </View>
        ) : (
          filteredProjects.map((project) => (
            <Card key={project.id} style={styles.card}>
              <Card.Content>
                <View style={styles.cardHeader}>
                  <Title style={styles.projectName}>{project.name}</Title>
                  <Chip
                    style={[styles.statusChip, { backgroundColor: getStatusColor(project.status) }]}
                    textStyle={styles.statusChipText}
                  >
                    {project.status.replace('_', ' ').toUpperCase()}
                  </Chip>
                </View>
                <Paragraph style={styles.client}>Client: {project.client}</Paragraph>
                <Paragraph style={styles.budget}>Budget: {formatCurrency(project.budget)}</Paragraph>
                <Paragraph style={styles.dates}>
                  {formatDate(project.startDate)} - {formatDate(project.endDate)}
                </Paragraph>
              </Card.Content>
              <Card.Actions>
                <Button onPress={() => openEditModal(project)}>Edit</Button>
                <Button textColor="#F44336" onPress={() => handleDelete(project)}>
                  Delete
                </Button>
              </Card.Actions>
            </Card>
          ))
        )}
      </ScrollView>

      <FAB style={styles.fab} icon="plus" onPress={openCreateModal} />

      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          contentContainerStyle={styles.modalContent}
        >
          <ScrollView>
            <Title style={styles.modalTitle}>
              {editingProject ? 'Edit Project' : 'Create New Project'}
            </Title>

            <TextInput
              label="Project Name"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              style={styles.input}
              mode="outlined"
            />

            <TextInput
              label="Client"
              value={formData.client}
              onChangeText={(text) => setFormData({ ...formData, client: text })}
              style={styles.input}
              mode="outlined"
            />

            <TextInput
              label="Budget"
              value={formData.budget}
              onChangeText={(text) => setFormData({ ...formData, budget: text })}
              style={styles.input}
              mode="outlined"
              keyboardType="numeric"
            />

            <Paragraph style={styles.label}>Start Date</Paragraph>
            <Button
              mode="outlined"
              onPress={() => setShowStartDatePicker(true)}
              style={styles.dateButton}
              icon="calendar"
            >
              {formData.startDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </Button>

            {showStartDatePicker && (
              <DateTimePicker
                value={formData.startDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleStartDateChange}
              />
            )}

            <Paragraph style={styles.label}>End Date</Paragraph>
            <Button
              mode="outlined"
              onPress={() => setShowEndDatePicker(true)}
              style={styles.dateButton}
              icon="calendar"
            >
              {formData.endDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </Button>

            {showEndDatePicker && (
              <DateTimePicker
                value={formData.endDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleEndDateChange}
              />
            )}

            <Paragraph style={styles.label}>Status</Paragraph>
            <View style={styles.statusButtons}>
              {(['active', 'completed', 'on_hold', 'cancelled'] as const).map((status) => (
                <Chip
                  key={status}
                  selected={formData.status === status}
                  onPress={() => setFormData({ ...formData, status })}
                  style={styles.statusOption}
                >
                  {status.replace('_', ' ').toUpperCase()}
                </Chip>
              ))}
            </View>

            <View style={styles.modalActions}>
              <Button onPress={() => setModalVisible(false)}>Cancel</Button>
              <Button mode="contained" onPress={handleSave}>
                {editingProject ? 'Update' : 'Create'}
              </Button>
            </View>
          </ScrollView>
        </Modal>
      </Portal>

      <ConfirmDialog
        visible={showDeleteDialog}
        title="Delete Project"
        message={deleteMessage}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onCancel={() => {
          setShowDeleteDialog(false);
          setProjectToDelete(null);
          setDeleteMessage('');
        }}
        destructive={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchbar: {
    margin: 15,
  },
  scrollView: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 50,
  },
  card: {
    margin: 15,
    marginTop: 0,
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  projectName: {
    fontSize: 18,
    flex: 1,
  },
  statusChip: {
    marginLeft: 10,
  },
  statusChipText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  client: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  budget: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 5,
  },
  dates: {
    fontSize: 12,
    color: '#999',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#007AFF',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
    maxHeight: '80%',
  },
  modalTitle: {
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    marginBottom: 15,
  },
  label: {
    marginTop: 10,
    marginBottom: 10,
    fontWeight: 'bold',
  },
  dateButton: {
    marginBottom: 15,
    justifyContent: 'flex-start',
  },
  statusButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  statusOption: {
    marginRight: 10,
    marginBottom: 10,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 20,
  },
});

export default ProjectManagementScreen;
