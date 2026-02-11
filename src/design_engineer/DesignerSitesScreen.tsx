/**
 * DesignerSitesScreen
 *
 * Dedicated screen for designers to view their assigned sites.
 * Follows the supervisor Sites screen pattern (read-only version).
 *
 * Features:
 * - Shows all sites assigned to the current designer
 * - Search and filter sites
 * - Site cards showing site details
 * - Empty state when no sites assigned
 * - Read-only (designers cannot add/edit sites)
 *
 * @version 2.0.0
 */

import React, { useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Title, Button, FAB, Portal, Dialog, TextInput } from 'react-native-paper';
import { useDesignEngineerContext } from './context/DesignEngineerContext';
import { database } from '../../models/database';
import { Q } from '@nozbe/watermelondb';
import { withObservables } from '@nozbe/watermelondb/react';
import SiteModel from '../../models/SiteModel';
import { EmptyState } from '../components/common/EmptyState';
import ErrorBoundary from '../components/common/ErrorBoundary';
import { SearchBar, FilterChips, SortMenu, FilterOption, SortOption } from '../components';
import { useDebounce } from '../hooks';
import { useSnackbar } from '../components/Snackbar';
import { logger } from '../services/LoggingService';

// Activity filter options
const ACTIVITY_FILTERS: FilterOption[] = [
  { id: 'all', label: 'All Sites' },
  { id: 'active', label: 'Active', icon: 'check-circle' },
  { id: 'inactive', label: 'Inactive', icon: 'circle-outline' },
];

// Sort options
const SORT_OPTIONS: SortOption[] = [
  { id: 'name', label: 'Name', icon: 'format-letter-case' },
];

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
  const [selectedActivity, setSelectedActivity] = useState<string[]>(['all']);
  const [sortBy, setSortBy] = useState<'name'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Site creation dialog state
  const [dialogVisible, setDialogVisible] = useState(false);
  const [siteName, setSiteName] = useState('');
  const [siteLocation, setSiteLocation] = useState('');

  // Combined filtering and sorting logic (memoized for performance)
  const displayedSites = useMemo(() => {
    let result = sites;

    // 1. Search filter (using debounced value for better performance)
    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase();
      result = result.filter(site =>
        site.name.toLowerCase().includes(query) ||
        site.location.toLowerCase().includes(query)
      );
    }

    // 2. Activity filter (for now, all sites are considered active)
    if (!selectedActivity.includes('all')) {
      // Can be enhanced later with explicit active/inactive status
    }

    // 3. Sort by name
    result = [...result].sort((a, b) => {
      const comparison = a.name.localeCompare(b.name);
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [sites, debouncedSearchQuery, selectedActivity, sortBy, sortDirection]);

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
    return debouncedSearchQuery.trim() !== '' ||
           !selectedActivity.includes('all');
  }, [debouncedSearchQuery, selectedActivity]);

  // ==================== Site Creation ====================

  const openAddDialog = () => {
    setSiteName('');
    setSiteLocation('');
    setDialogVisible(true);
  };

  const closeDialog = () => {
    setDialogVisible(false);
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
        await database.collections.get('sites').create((site: any) => {
          site.name = siteName.trim();
          site.location = siteLocation.trim();
          site.projectId = projectId;
          site.designEngineerId = engineerId;
        });
      });

      showSnackbar('Site created successfully', 'success');
      closeDialog();

      logger.info('Site created successfully', {
        component: 'DesignerSitesScreen',
        siteName: siteName.trim(),
        engineerId,
      });
    } catch (error) {
      logger.error('Failed to create site', error as Error, {
        component: 'DesignerSitesScreen',
        action: 'createSite',
        siteName,
      });
      showSnackbar('Failed to create site: ' + (error as Error).message, 'error');
    }
  };

  return (
    <ErrorBoundary>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.headerTitle}>My Sites</Text>
              <Text style={styles.headerSubtitle}>Design Engineer</Text>
            </View>
          </View>
        </View>

        {/* Project Header - Shows designer's assigned project */}
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
          <Text style={styles.resultCount}>
            Showing {displayedSites.length} of {sites.length} sites
          </Text>

          {hasActiveFilters && (
            <Button mode="text" onPress={clearAllFilters} compact>
              Clear All
            </Button>
          )}

          <SortMenu
            sortOptions={SORT_OPTIONS}
            currentSort={sortBy}
            onSortChange={(id) => setSortBy(id as any)}
            sortDirection={sortDirection}
            onDirectionChange={setSortDirection}
          />
        </View>

        {/* Sites List */}
        <ScrollView style={styles.scrollView}>
          {displayedSites.length === 0 ? (
            <EmptyState
              icon={hasActiveFilters ? 'filter-variant' : 'map-marker-off'}
              title={hasActiveFilters ? 'No Sites Found' : 'No Sites Assigned'}
              message={
                hasActiveFilters
                  ? 'No sites match your current search or filter criteria.'
                  : "You don't have any sites assigned yet. Click the + button to add a new site."
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
                        <Text style={styles.siteLocation}>📍 {site.location}</Text>
                        {project && (
                          <Text style={styles.projectName}>
                            Project: {project.name}
                          </Text>
                        )}
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
            <Dialog.Title>Add New Site</Dialog.Title>
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
                This site will be added to {projectName}
              </Text>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={closeDialog}>Cancel</Button>
              <Button
                mode="contained"
                onPress={handleSave}
                disabled={!siteName.trim() || !siteLocation.trim()}
              >
                Create
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </View>
    </ErrorBoundary>
  );
};

// Enhance component with WatermelonDB observables
const enhance = withObservables(['engineerId'], ({ engineerId }: { engineerId: string }) => ({
  sites: database.collections
    .get('sites')
    .query(Q.where('design_engineer_id', engineerId)),
  projects: database.collections.get('projects').query(),
}));

const EnhancedDesignerSitesScreen = enhance(DesignerSitesScreenComponent as any);

// Wrapper component that provides context
const DesignerSitesScreen = () => {
  const { engineerId } = useDesignEngineerContext();
  return <EnhancedDesignerSitesScreen engineerId={engineerId} />;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#673AB7',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#FFF',
    opacity: 0.9,
  },
  projectCard: {
    margin: 16,
    marginBottom: 8,
    elevation: 3,
    backgroundColor: '#EDE7F6',
  },
  projectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  projectLabel: {
    fontSize: 12,
    color: '#673AB7',
    fontWeight: '600',
    marginBottom: 4,
  },
  projectTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4527A0',
    marginBottom: 4,
  },
  projectNote: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
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
  projectName: {
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
