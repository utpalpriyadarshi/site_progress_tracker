/**
 * DesignerSitesScreen
 *
 * Dedicated screen for designers to manage their sites.
 *
 * Features:
 * - Shows all sites in the engineer's project
 * - Search and filter sites
 * - Create, edit, and delete sites
 * - Site cards with edit/delete actions
 *
 * @version 3.0.0
 */

import React, { useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, Button, FAB, Portal, Dialog, TextInput, IconButton } from 'react-native-paper';
import { useDesignEngineerContext } from './context/DesignEngineerContext';
import { database } from '../../models/database';
import { Q } from '@nozbe/watermelondb';
import { withObservables } from '@nozbe/watermelondb/react';
import SiteModel from '../../models/SiteModel';
import { EmptyState } from '../components/common/EmptyState';
import ErrorBoundary from '../components/common/ErrorBoundary';
import { SearchBar } from '../components';
import { useDebounce } from '../hooks';
import { useSnackbar } from '../components/Snackbar';
import { logger } from '../services/LoggingService';

interface DesignerSitesScreenProps {
  sites: SiteModel[];
  projects: any[];
}

const DesignerSitesScreenComponent: React.FC<DesignerSitesScreenProps> = ({ sites, projects }) => {
  const { projectName, projectId, engineerId } = useDesignEngineerContext();
  const { showSnackbar } = useSnackbar();

  // Search, filter, sort state
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [sortDirection] = useState<'asc' | 'desc'>('asc');

  // Dialog state
  const [dialogVisible, setDialogVisible] = useState(false);
  const [editingSiteId, setEditingSiteId] = useState<string | null>(null);
  const [siteName, setSiteName] = useState('');
  const [siteLocation, setSiteLocation] = useState('');

  // Filtering and sorting
  const displayedSites = useMemo(() => {
    let result = sites;

    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase();
      result = result.filter(site =>
        site.name.toLowerCase().includes(query) ||
        site.location.toLowerCase().includes(query)
      );
    }

    result = [...result].sort((a, b) => {
      const comparison = a.name.localeCompare(b.name);
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [sites, debouncedSearchQuery, sortDirection]);

  const hasActiveFilters = debouncedSearchQuery.trim() !== '';

  const clearAllFilters = () => {
    setSearchQuery('');
  };

  // ==================== Site CRUD ====================

  const openAddDialog = () => {
    setEditingSiteId(null);
    setSiteName('');
    setSiteLocation('');
    setDialogVisible(true);
  };

  const openEditDialog = (site: SiteModel) => {
    setEditingSiteId(site.id);
    setSiteName(site.name);
    setSiteLocation(site.location);
    setDialogVisible(true);
  };

  const closeDialog = () => {
    setDialogVisible(false);
    setEditingSiteId(null);
    setSiteName('');
    setSiteLocation('');
  };

  const handleSave = async () => {
    if (!siteName.trim() || !siteLocation.trim()) {
      showSnackbar('Please fill in all fields', 'warning');
      return;
    }

    try {
      if (editingSiteId) {
        // Update existing site
        const siteRecord = await database.collections.get('sites').find(editingSiteId);
        await database.write(async () => {
          await siteRecord.update((site: any) => {
            site.name = siteName.trim();
            site.location = siteLocation.trim();
          });
        });
        showSnackbar('Site updated successfully', 'success');
      } else {
        // Create new site
        await database.write(async () => {
          await database.collections.get('sites').create((site: any) => {
            site.name = siteName.trim();
            site.location = siteLocation.trim();
            site.projectId = projectId;
            site.designEngineerId = engineerId;
          });
        });
        showSnackbar('Site created successfully', 'success');
      }

      closeDialog();

      logger.info(`Site ${editingSiteId ? 'updated' : 'created'} successfully`, {
        component: 'DesignerSitesScreen',
        siteName: siteName.trim(),
        engineerId,
      });
    } catch (error) {
      logger.error(`Failed to ${editingSiteId ? 'update' : 'create'} site`, error as Error, {
        component: 'DesignerSitesScreen',
        siteName,
      });
      showSnackbar(`Failed to ${editingSiteId ? 'update' : 'create'} site: ` + (error as Error).message, 'error');
    }
  };

  const handleDelete = (site: SiteModel) => {
    Alert.alert(
      'Delete Site',
      `Are you sure you want to delete "${site.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await database.write(async () => {
                await site.markAsDeleted();
              });
              showSnackbar('Site deleted successfully', 'success');
              logger.info('Site deleted', { component: 'DesignerSitesScreen', siteId: site.id });
            } catch (error) {
              logger.error('Failed to delete site', error as Error, {
                component: 'DesignerSitesScreen',
                siteId: site.id,
              });
              showSnackbar('Failed to delete site: ' + (error as Error).message, 'error');
            }
          },
        },
      ],
    );
  };

  return (
    <ErrorBoundary>
      <View style={styles.container}>
        {/* Compact Header with project info */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Sites</Text>
          {projectName && (
            <Text style={styles.headerProject}>{projectName}</Text>
          )}
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search sites..."
          />
        </View>

        {/* Results count */}
        <View style={styles.resultsRow}>
          <Text style={styles.resultCount}>
            {displayedSites.length} site{displayedSites.length !== 1 ? 's' : ''}
          </Text>
          {hasActiveFilters && (
            <Button mode="text" onPress={clearAllFilters} compact>
              Clear
            </Button>
          )}
        </View>

        {/* Sites List */}
        <ScrollView style={styles.scrollView}>
          {displayedSites.length === 0 ? (
            <EmptyState
              icon={hasActiveFilters ? 'filter-variant' : 'map-marker-off'}
              title={hasActiveFilters ? 'No Sites Found' : 'No Sites Yet'}
              message={
                hasActiveFilters
                  ? 'No sites match your current search or filter criteria.'
                  : "No sites created yet. Click the + button to add a new site."
              }
              helpText={
                hasActiveFilters
                  ? undefined
                  : 'Sites are locations where you manage design documents, DOORS packages, and Design RFQs.'
              }
              tips={
                hasActiveFilters
                  ? undefined
                  : [
                      'Each site can have multiple design documents and DOORS packages',
                      'Use the site selector to filter your work by site',
                      'Track design compliance across all your sites',
                    ]
              }
              variant={hasActiveFilters ? 'search' : 'default'}
              secondaryActionText={hasActiveFilters ? 'Clear Filters' : undefined}
              onSecondaryAction={
                hasActiveFilters
                  ? () => {
                      setSearchQuery('');
                      setSelectedActivity(['all']);
                    }
                  : undefined
              }
            />
          ) : (
            displayedSites.map((site) => {
              const project = projects.find((p) => p.id === site.projectId);

              return (
                <Card key={site.id} style={styles.siteCard}>
                  <Card.Content>
                    <View style={styles.siteHeader}>
                      <View style={styles.siteInfo}>
                        <Text style={styles.siteName}>{site.name}</Text>
                        <Text style={styles.siteLocation}>{site.location}</Text>
                        {project && (
                          <Text style={styles.projectNameText}>
                            Project: {project.name}
                          </Text>
                        )}
                      </View>
                      <View style={styles.siteActions}>
                        <IconButton
                          icon="pencil"
                          size={20}
                          iconColor="#673AB7"
                          onPress={() => openEditDialog(site)}
                          accessibilityLabel={`Edit ${site.name}`}
                        />
                        <IconButton
                          icon="delete"
                          size={20}
                          iconColor="#F44336"
                          onPress={() => handleDelete(site)}
                          accessibilityLabel={`Delete ${site.name}`}
                        />
                      </View>
                    </View>
                  </Card.Content>
                </Card>
              );
            })
          )}
        </ScrollView>

        {/* Add Site FAB */}
        <FAB
          style={styles.fab}
          icon="plus"
          label="Add Site"
          onPress={openAddDialog}
          accessibilityLabel="Add new site"
          color="#FFFFFF"
        />

        {/* Add/Edit Site Dialog */}
        <Portal>
          <Dialog
            visible={dialogVisible}
            onDismiss={closeDialog}
            style={styles.dialog}
          >
            <Dialog.Title>{editingSiteId ? 'Edit Site' : 'Add New Site'}</Dialog.Title>
            <Dialog.Content>
              <TextInput
                label="Site Name *"
                value={siteName}
                onChangeText={setSiteName}
                mode="outlined"
                style={styles.input}
                autoFocus
              />
              <TextInput
                label="Location *"
                value={siteLocation}
                onChangeText={setSiteLocation}
                mode="outlined"
                style={styles.input}
              />
              <Text style={styles.helperText}>
                This site will be {editingSiteId ? 'updated in' : 'added to'} {projectName}
              </Text>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={closeDialog}>Cancel</Button>
              <Button
                mode="contained"
                onPress={handleSave}
                disabled={!siteName.trim() || !siteLocation.trim()}
              >
                {editingSiteId ? 'Update' : 'Create'}
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </View>
    </ErrorBoundary>
  );
};

// Enhance component with WatermelonDB observables — show all project sites
const enhance = withObservables(['projectId'], ({ projectId }: { projectId: string }) => ({
  sites: database.collections
    .get('sites')
    .query(Q.where('project_id', projectId)),
  projects: database.collections.get('projects').query(),
}));

const EnhancedDesignerSitesScreen = enhance(DesignerSitesScreenComponent as any);

// Wrapper component that provides context
const DesignerSitesScreen = () => {
  const { projectId } = useDesignEngineerContext();
  return <EnhancedDesignerSitesScreen projectId={projectId} />;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#673AB7',
    paddingTop: 12,
    paddingBottom: 8,
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  headerProject: {
    fontSize: 13,
    color: '#E0D0FF',
    marginBottom: 6,
  },
  resultsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'white',
  },
  resultCount: {
    flex: 1,
    fontSize: 12,
    color: '#666',
  },
  scrollView: {
    flex: 1,
  },
  siteCard: {
    margin: 16,
    marginBottom: 8,
    elevation: 2,
    backgroundColor: '#FFFFFF',
  },
  siteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  siteInfo: {
    flex: 1,
  },
  siteActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  siteName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  siteLocation: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  projectNameText: {
    fontSize: 12,
    color: '#999',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: '#7C4DFF',
  },
  dialog: {
    maxWidth: 500,
    alignSelf: 'center',
    width: '90%',
  },
  input: {
    marginBottom: 12,
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    fontStyle: 'italic',
  },
});

export default DesignerSitesScreen;
