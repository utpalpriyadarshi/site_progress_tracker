import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
} from 'react-native';
import {
  Card,
  Title,
  Button,
  TextInput,
  Portal,
  Dialog,
  IconButton,
  Text,
} from 'react-native-paper';
import { database } from '../../models/database';
import { withObservables } from '@nozbe/watermelondb/react';
import { Q } from '@nozbe/watermelondb';
import SiteModel from '../../models/SiteModel';
import { useSiteContext } from './context/SiteContext';
import { useSnackbar } from '../components/Snackbar';
import { SearchBar, FilterChips, SortMenu, FilterOption, SortOption } from '../components';

// Activity filter options
const ACTIVITY_FILTERS: FilterOption[] = [
  { id: 'all', label: 'All Sites' },
  { id: 'active', label: 'Active', icon: 'check-circle' },
  { id: 'inactive', label: 'Inactive', icon: 'circle-outline' },
];

// Sort options
const SORT_OPTIONS: SortOption[] = [
  { id: 'name', label: 'Name', icon: 'format-letter-case' },
  { id: 'date', label: 'Creation Date', icon: 'calendar' },
];

const SiteManagementScreenComponent = ({
  sites,
  projects,
}: {
  sites: SiteModel[];
  projects: any[];
}) => {
  const { supervisorId, setSelectedSiteId, projectId, projectName } = useSiteContext();
  const { showSnackbar } = useSnackbar();

  // Search, filter, sort state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedActivity, setSelectedActivity] = useState<string[]>(['all']);
  const [sortBy, setSortBy] = useState<'name' | 'date'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Existing state
  const [dialogVisible, setDialogVisible] = useState(false);
  const [editingSite, setEditingSite] = useState<SiteModel | null>(null);
  const [siteName, setSiteName] = useState('');
  const [siteLocation, setSiteLocation] = useState('');

  // Combined filtering and sorting logic
  const displayedSites = useMemo(() => {
    let result = sites;

    // 1. Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(site =>
        site.name.toLowerCase().includes(query) ||
        site.location.toLowerCase().includes(query)
      );
    }

    // 2. Activity filter (active sites have items, inactive don't)
    // Note: This is a simple implementation. In production, you might want to
    // track active/inactive status explicitly in the database.
    // For now, we'll consider all sites as "active"
    if (!selectedActivity.includes('all')) {
      // Since we don't have an explicit active/inactive field,
      // we'll keep all sites for now. This can be enhanced later.
      // For demo purposes, all sites are considered active.
    }

    // 3. Sort
    result = [...result].sort((a, b) => {
      let comparison = 0;

      if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === 'date') {
        comparison = a.createdAt - b.createdAt;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [sites, searchQuery, selectedActivity, sortBy, sortDirection]);

  // Filter toggle handler
  const handleActivityToggle = (id: string) => {
    if (id === 'all') {
      setSelectedActivity(['all']);
    } else {
      const newFilters = selectedActivity.includes(id)
        ? selectedActivity.filter(f => f !== id && f !== 'all')
        : [...selectedActivity.filter(f => f !== 'all'), id];
      setSelectedActivity(newFilters.length === 0 ? ['all'] : newFilters);
    }
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedActivity(['all']);
    setSortBy('name');
    setSortDirection('asc');
  };

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return searchQuery.trim() !== '' ||
           !selectedActivity.includes('all');
  }, [searchQuery, selectedActivity]);

  const openAddDialog = () => {
    setEditingSite(null);
    setSiteName('');
    setSiteLocation('');
    // Project ID will be auto-assigned from supervisor's project
    setDialogVisible(true);
  };

  const openEditDialog = (site: SiteModel) => {
    setEditingSite(site);
    setSiteName(site.name);
    setSiteLocation(site.location);
    // Project ID is locked to supervisor's project - not editable
    setDialogVisible(true);
  };

  const closeDialog = () => {
    setDialogVisible(false);
    setEditingSite(null);
    setSiteName('');
    setSiteLocation('');
  };

  const handleSave = async () => {
    if (!siteName.trim() || !siteLocation.trim()) {
      setDialogVisible(false);
      showSnackbar('Please fill in all fields', 'warning');
      return;
    }

    try {
      await database.write(async () => {
        if (editingSite) {
          // Update existing site (project cannot be changed)
          await editingSite.update((site: any) => {
            site.name = siteName.trim();
            site.location = siteLocation.trim();
            // Project ID is locked to supervisor's project - not editable
          });
          showSnackbar('Site updated successfully', 'success');
        } else {
          // Create new site (auto-assign to supervisor's project)
          const newSite = await database.collections.get('sites').create((site: any) => {
            site.name = siteName.trim();
            site.location = siteLocation.trim();
            site.projectId = projectId; // Use supervisor's assigned project
            site.supervisorId = supervisorId || null;
          });
          showSnackbar('Site created successfully', 'success');

          // Optionally auto-select the new site
          setSelectedSiteId(newSite.id);
        }
      });
      closeDialog();
    } catch (error) {
      console.error('Error saving site:', error);
      showSnackbar('Failed to save site: ' + (error as Error).message, 'error');
    }
  };

  return (
    <View style={styles.container}>
      {/* Project Header - Shows supervisor's assigned project */}
      {projectName && (
        <Card style={styles.projectCard}>
          <Card.Content>
            <View style={styles.projectHeader}>
              <View>
                <Text style={styles.projectLabel}>📁 Your Assigned Project</Text>
                <Title style={styles.projectTitle}>{projectName}</Title>
                <Text style={styles.projectNote}>All sites belong to this project</Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      )}

      <View style={styles.header}>
        <Button
          mode="contained"
          icon="plus"
          onPress={openAddDialog}
          style={styles.addButton}
        >
          Add Site
        </Button>
      </View>

      {/* Search Bar */}
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search sites by name or location..."
      />

      {/* Activity Filter Chips */}
      <FilterChips
        filters={ACTIVITY_FILTERS}
        selectedFilters={selectedActivity}
        onFilterToggle={handleActivityToggle}
      />

      {/* Results Row with Sort and Clear All */}
      <View style={styles.resultsRow}>
        <Text variant="bodySmall" style={styles.resultCount}>
          Showing {displayedSites.length} of {sites.length} sites
        </Text>

        {hasActiveFilters ? (
          <Button mode="text" onPress={clearAllFilters} compact>
            Clear All
          </Button>
        ) : null}

        <SortMenu
          sortOptions={SORT_OPTIONS}
          currentSort={sortBy}
          onSortChange={(id) => setSortBy(id as any)}
          sortDirection={sortDirection}
          onDirectionChange={setSortDirection}
        />
      </View>

      <ScrollView style={styles.scrollView}>
        {displayedSites.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content>
              <Text>
                {hasActiveFilters
                  ? 'No sites match your filters. Try adjusting the search or filters.'
                  : 'No sites found. Create your first site!'}
              </Text>
            </Card.Content>
          </Card>
        ) : (
          displayedSites.map((site) => {
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
                    </View>
                    <View style={styles.actions}>
                      <IconButton
                        icon="pencil"
                        size={20}
                        onPress={() => openEditDialog(site)}
                      />
                      {/* Delete button removed - supervisors cannot delete sites (admin function) */}
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
              label="Site Name"
              value={siteName}
              onChangeText={setSiteName}
              mode="outlined"
              style={styles.input}
            />
            <TextInput
              label="Location"
              value={siteLocation}
              onChangeText={setSiteLocation}
              mode="outlined"
              style={styles.input}
              multiline
              numberOfLines={2}
            />

            {/* Project selector removed - sites auto-assigned to supervisor's project */}
            {projectName && (
              <View style={styles.projectInfo}>
                <Text style={styles.label}>Project:</Text>
                <Text style={styles.projectDisplay}>{projectName}</Text>
                <Text style={styles.projectNote}>Sites are automatically assigned to your project</Text>
              </View>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={closeDialog}>Cancel</Button>
            <Button onPress={handleSave}>
              {editingSite ? 'Update' : 'Create'}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

// Enhance component with WatermelonDB observables
const enhance = withObservables(['supervisorId'], ({ supervisorId }: { supervisorId: string }) => ({
  sites: database.collections
    .get('sites')
    .query(Q.where('supervisor_id', supervisorId)),
  projects: database.collections.get('projects').query(),
}));

const EnhancedSiteManagementScreen = enhance(SiteManagementScreenComponent as any);

// Wrapper component that provides context
const SiteManagementScreen = () => {
  const { supervisorId } = useSiteContext();
  return <EnhancedSiteManagementScreen supervisorId={supervisorId} />;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  projectCard: {
    margin: 16,
    marginBottom: 8,
    elevation: 3,
    backgroundColor: '#E3F2FD',
  },
  projectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  projectLabel: {
    fontSize: 12,
    color: '#1976D2',
    fontWeight: '600',
    marginBottom: 4,
  },
  projectTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0D47A1',
    marginBottom: 4,
  },
  projectNote: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  projectInfo: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 4,
  },
  projectDisplay: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 4,
    marginBottom: 8,
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
    color: '#666',
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
  },
  actions: {
    flexDirection: 'row',
  },
  input: {
    marginBottom: 12,
  },
  projectSelector: {
    marginTop: 8,
  },
  projectList: {
    maxHeight: 200,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
});

export default SiteManagementScreen;
