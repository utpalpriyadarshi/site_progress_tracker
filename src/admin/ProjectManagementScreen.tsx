import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { FAB, Searchbar, Paragraph, ActivityIndicator } from 'react-native-paper';
import { useSnackbar } from '../components/Snackbar';
import { ConfirmDialog } from '../components/Dialog';
import { useAuth } from '../auth/AuthContext';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import {
  ProjectCard,
  ProjectFormDialog,
} from './project-management/components';
import {
  useProjectData,
  useProjectFilters,
  useProjectForm,
  useProjectDelete,
} from './project-management/hooks';

const ProjectManagementScreen = () => {
  const { showSnackbar } = useSnackbar();
  const { user } = useAuth();

  // Load project data
  const { projects, loading, reloadProjects } = useProjectData();

  // Filter projects
  const { searchQuery, setSearchQuery, filteredProjects } = useProjectFilters(projects);

  // Project form management
  const {
    modalVisible,
    setModalVisible,
    editingProject,
    formData,
    updateFormData,
    showStartDatePicker,
    setShowStartDatePicker,
    showEndDatePicker,
    setShowEndDatePicker,
    openCreateModal,
    openEditModal,
    handleSave,
    handleStartDateChange,
    handleEndDateChange,
  } = useProjectForm({
    currentUserId: user?.userId,
    onSuccess: (message) => showSnackbar(message, 'success'),
    onError: (message) => showSnackbar(message, 'error'),
    onDataReload: reloadProjects,
  });

  // Project delete management
  const {
    showDeleteDialog,
    projectToDelete,
    deleteMessage,
    handleDelete,
    confirmDelete,
    cancelDelete,
  } = useProjectDelete({
    onSuccess: (message) => showSnackbar(message, 'success'),
    onError: (message) => showSnackbar(message, 'error'),
    onDataReload: reloadProjects,
  });

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
            <ProjectCard
              key={project.id}
              project={project}
              onEdit={openEditModal}
              onDelete={handleDelete}
            />
          ))
        )}
      </ScrollView>

      <FAB style={styles.fab} icon="plus" onPress={openCreateModal} />

      <ProjectFormDialog
        visible={modalVisible}
        editingProject={editingProject}
        formData={formData}
        showStartDatePicker={showStartDatePicker}
        showEndDatePicker={showEndDatePicker}
        onDismiss={() => setModalVisible(false)}
        onFormDataChange={updateFormData}
        onSave={handleSave}
        onStartDatePress={() => setShowStartDatePicker(true)}
        onEndDatePress={() => setShowEndDatePicker(true)}
        onStartDateChange={handleStartDateChange}
        onEndDateChange={handleEndDateChange}
      />

      <ConfirmDialog
        visible={showDeleteDialog}
        title="Delete Project"
        message={deleteMessage}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
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
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#007AFF',
  },
});

// Wrap with ErrorBoundary for graceful error handling
const ProjectManagementScreenWithBoundary = () => (
  <ErrorBoundary name="ProjectManagementScreen">
    <ProjectManagementScreen />
  </ErrorBoundary>
);

export default ProjectManagementScreenWithBoundary;
