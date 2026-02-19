/**
 * DesignerSitesScreen
 *
 * Dedicated screen for designers to manage their sites and domains.
 *
 * Features:
 * - Domain management (CRUD) — horizontal chip/card section at top
 * - Sites list with domain assignment and domain filtering
 * - Search and filter sites
 * - Create, edit, and delete sites
 *
 * @version 4.0.0
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, Button, FAB, Portal, Dialog, TextInput, IconButton, Chip } from 'react-native-paper';
import { useDesignEngineerContext } from './context/DesignEngineerContext';
import { database } from '../../models/database';
import { Q } from '@nozbe/watermelondb';
import { withObservables } from '@nozbe/watermelondb/react';
import SiteModel from '../../models/SiteModel';
import DomainModel from '../../models/DomainModel';
import { EmptyState } from '../components/common/EmptyState';
import ErrorBoundary from '../components/common/ErrorBoundary';
import { SearchBar } from '../components';
import { useDebounce } from '../hooks';
import { useSnackbar } from '../components/Snackbar';
import { logger } from '../services/LoggingService';
import { COLORS } from '../theme/colors';

interface DesignerSitesScreenProps {
  sites: SiteModel[];
  domains: DomainModel[];
  projects: any[];
}

const DesignerSitesScreenComponent: React.FC<DesignerSitesScreenProps> = ({ sites, domains, projects }) => {
  const { projectName, projectId, engineerId } = useDesignEngineerContext();
  const { showSnackbar } = useSnackbar();

  // Search, filter, sort state
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [sortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedDomainFilter, setSelectedDomainFilter] = useState<string | null>(null);

  // Site Dialog state
  const [dialogVisible, setDialogVisible] = useState(false);
  const [editingSiteId, setEditingSiteId] = useState<string | null>(null);
  const [siteName, setSiteName] = useState('');
  const [siteLocation, setSiteLocation] = useState('');
  const [siteDomainId, setSiteDomainId] = useState<string>('');

  // Domain Dialog state
  const [domainDialogVisible, setDomainDialogVisible] = useState(false);
  const [editingDomainId, setEditingDomainId] = useState<string | null>(null);
  const [domainName, setDomainName] = useState('');

  // Filtering and sorting
  const displayedSites = useMemo(() => {
    let result = sites;

    // Filter by domain
    if (selectedDomainFilter) {
      result = result.filter(site => (site as any).domainId === selectedDomainFilter);
    }

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
  }, [sites, debouncedSearchQuery, sortDirection, selectedDomainFilter]);

  const hasActiveFilters = debouncedSearchQuery.trim() !== '' || selectedDomainFilter !== null;

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedDomainFilter(null);
  };

  // Helper: get domain name by ID
  const getDomainName = useCallback((domainId: string | undefined) => {
    if (!domainId) return null;
    const domain = domains.find(d => d.id === domainId);
    return domain ? domain.name : null;
  }, [domains]);

  // ==================== Domain CRUD ====================

  const openAddDomainDialog = () => {
    setEditingDomainId(null);
    setDomainName('');
    setDomainDialogVisible(true);
  };

  const openEditDomainDialog = (domain: DomainModel) => {
    setEditingDomainId(domain.id);
    setDomainName(domain.name);
    setDomainDialogVisible(true);
  };

  const closeDomainDialog = () => {
    setDomainDialogVisible(false);
    setEditingDomainId(null);
    setDomainName('');
  };

  const handleSaveDomain = async () => {
    if (!domainName.trim()) {
      showSnackbar('Please enter a domain name', 'warning');
      return;
    }

    try {
      if (editingDomainId) {
        const domainRecord = await database.collections.get('domains').find(editingDomainId);
        await database.write(async () => {
          await domainRecord.update((record: any) => {
            record.name = domainName.trim();
          });
        });
        showSnackbar('Domain updated successfully', 'success');
      } else {
        await database.write(async () => {
          await database.collections.get('domains').create((record: any) => {
            record.name = domainName.trim();
            record.projectId = projectId;
            record.createdAt = Date.now();
            record.appSyncStatus = 'pending';
            record.version = 1;
          });
        });
        showSnackbar('Domain created successfully', 'success');
      }
      closeDomainDialog();
      logger.info(`Domain ${editingDomainId ? 'updated' : 'created'}`, { component: 'DesignerSitesScreen', domainName: domainName.trim() });
    } catch (error) {
      logger.error(`Failed to ${editingDomainId ? 'update' : 'create'} domain`, error as Error);
      showSnackbar(`Failed to ${editingDomainId ? 'update' : 'create'} domain`, 'error');
    }
  };

  const handleDeleteDomain = (domain: DomainModel) => {
    // Check if sites exist under this domain
    const sitesInDomain = sites.filter(s => (s as any).domainId === domain.id);

    const warningMessage = sitesInDomain.length > 0
      ? `This domain has ${sitesInDomain.length} site(s) assigned. They will be unassigned. Are you sure?`
      : `Are you sure you want to delete "${domain.name}"?`;

    Alert.alert('Delete Domain', warningMessage, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await database.write(async () => {
              // Unassign sites from this domain
              for (const site of sitesInDomain) {
                await site.update((s: any) => {
                  s.domainId = null;
                });
              }
              await domain.markAsDeleted();
            });

            // Clear filter if we were filtering by this domain
            if (selectedDomainFilter === domain.id) {
              setSelectedDomainFilter(null);
            }

            showSnackbar('Domain deleted successfully', 'success');
            logger.info('Domain deleted', { component: 'DesignerSitesScreen', domainId: domain.id });
          } catch (error) {
            logger.error('Failed to delete domain', error as Error);
            showSnackbar('Failed to delete domain', 'error');
          }
        },
      },
    ]);
  };

  // ==================== Site CRUD ====================

  const openAddDialog = () => {
    setEditingSiteId(null);
    setSiteName('');
    setSiteLocation('');
    setSiteDomainId('');
    setDialogVisible(true);
  };

  const openEditDialog = (site: SiteModel) => {
    setEditingSiteId(site.id);
    setSiteName(site.name);
    setSiteLocation(site.location);
    setSiteDomainId((site as any).domainId || '');
    setDialogVisible(true);
  };

  const closeDialog = () => {
    setDialogVisible(false);
    setEditingSiteId(null);
    setSiteName('');
    setSiteLocation('');
    setSiteDomainId('');
  };

  const handleSave = async () => {
    if (!siteName.trim() || !siteLocation.trim()) {
      showSnackbar('Please fill in all fields', 'warning');
      return;
    }

    try {
      if (editingSiteId) {
        const siteRecord = await database.collections.get('sites').find(editingSiteId);
        await database.write(async () => {
          await siteRecord.update((site: any) => {
            site.name = siteName.trim();
            site.location = siteLocation.trim();
            site.domainId = siteDomainId || null;
          });
        });
        showSnackbar('Site updated successfully', 'success');
      } else {
        await database.write(async () => {
          await database.collections.get('sites').create((site: any) => {
            site.name = siteName.trim();
            site.location = siteLocation.trim();
            site.projectId = projectId;
            site.domainId = siteDomainId || null;
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
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>My Sites</Text>
            {projectName && (
              <Text style={styles.headerProject}>{projectName}</Text>
            )}
          </View>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search sites..."
          />
        </View>

        {/* Domains Section */}
        <View style={styles.domainSection}>
          <View style={styles.domainHeaderRow}>
            <Text style={styles.domainSectionTitle}>Domains</Text>
            <IconButton
              icon="plus-circle"
              size={22}
              iconColor={COLORS.PRIMARY}
              onPress={openAddDomainDialog}
              accessibilityLabel="Add domain"
            />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.domainChipScroll}>
            <Chip
              mode={selectedDomainFilter === null ? 'flat' : 'outlined'}
              selected={selectedDomainFilter === null}
              onPress={() => setSelectedDomainFilter(null)}
              style={styles.domainChip}
              compact
            >
              All
            </Chip>
            {domains.map((domain) => (
              <Chip
                key={domain.id}
                mode={selectedDomainFilter === domain.id ? 'flat' : 'outlined'}
                selected={selectedDomainFilter === domain.id}
                onPress={() => setSelectedDomainFilter(
                  selectedDomainFilter === domain.id ? null : domain.id
                )}
                onLongPress={() => {
                  Alert.alert(
                    domain.name,
                    'What would you like to do?',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Edit', onPress: () => openEditDomainDialog(domain) },
                      { text: 'Delete', style: 'destructive', onPress: () => handleDeleteDomain(domain) },
                    ]
                  );
                }}
                style={styles.domainChip}
                compact
              >
                {domain.name}
              </Chip>
            ))}
          </ScrollView>
          {domains.length === 0 && (
            <Text style={styles.noDomainHint}>
              No domains yet. Tap + to create domains like OHE, TSS, SCADA, etc.
            </Text>
          )}
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
                      'Assign sites to domains for better organization',
                      'Track design compliance across all your sites',
                    ]
              }
              variant={hasActiveFilters ? 'search' : 'default'}
              secondaryActionText={hasActiveFilters ? 'Clear Filters' : undefined}
              onSecondaryAction={hasActiveFilters ? clearAllFilters : undefined}
            />
          ) : (
            displayedSites.map((site) => {
              const project = projects.find((p) => p.id === site.projectId);
              const domainNameStr = getDomainName((site as any).domainId);

              return (
                <Card key={site.id} style={styles.siteCard}>
                  <Card.Content>
                    <View style={styles.siteHeader}>
                      <View style={styles.siteInfo}>
                        <Text style={styles.siteName}>{site.name}</Text>
                        <Text style={styles.siteLocation}>{site.location}</Text>
                        {domainNameStr && (
                          <View style={styles.domainBadgeRow}>
                            <Chip
                              compact
                              mode="outlined"
                              style={styles.domainBadge}
                              textStyle={styles.domainBadgeText}
                              icon="shape"
                            >
                              {domainNameStr}
                            </Chip>
                          </View>
                        )}
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
                          iconColor={COLORS.PRIMARY}
                          onPress={() => openEditDialog(site)}
                          accessibilityLabel={`Edit ${site.name}`}
                        />
                        <IconButton
                          icon="delete"
                          size={20}
                          iconColor={COLORS.ERROR}
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
              {/* Domain Picker */}
              <Text style={styles.pickerLabel}>Domain (Optional)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.domainPickerScroll}>
                <Chip
                  mode={!siteDomainId ? 'flat' : 'outlined'}
                  selected={!siteDomainId}
                  onPress={() => setSiteDomainId('')}
                  style={styles.domainPickerChip}
                  compact
                >
                  None
                </Chip>
                {domains.map((domain) => (
                  <Chip
                    key={domain.id}
                    mode={siteDomainId === domain.id ? 'flat' : 'outlined'}
                    selected={siteDomainId === domain.id}
                    onPress={() => setSiteDomainId(domain.id)}
                    style={styles.domainPickerChip}
                    compact
                  >
                    {domain.name}
                  </Chip>
                ))}
              </ScrollView>
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

        {/* Add/Edit Domain Dialog */}
        <Portal>
          <Dialog
            visible={domainDialogVisible}
            onDismiss={closeDomainDialog}
            style={styles.dialog}
          >
            <Dialog.Title>{editingDomainId ? 'Edit Domain' : 'Add New Domain'}</Dialog.Title>
            <Dialog.Content>
              <TextInput
                label="Domain Name *"
                value={domainName}
                onChangeText={setDomainName}
                mode="outlined"
                style={styles.input}
                autoFocus
                placeholder="e.g. OHE, TSS, SCADA, Civil"
              />
              <Text style={styles.helperText}>
                Domains group sites and DOORS packages by engineering discipline.
              </Text>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={closeDomainDialog}>Cancel</Button>
              <Button
                mode="contained"
                onPress={handleSaveDomain}
                disabled={!domainName.trim()}
              >
                {editingDomainId ? 'Update' : 'Create'}
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </View>
    </ErrorBoundary>
  );
};

// Enhance component with WatermelonDB observables — show all project sites and domains
const enhance = withObservables(['projectId'], ({ projectId }: { projectId: string }) => ({
  sites: database.collections
    .get<SiteModel>('sites')
    .query(Q.where('project_id', projectId)),
  domains: database.collections
    .get<DomainModel>('domains')
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
    backgroundColor: COLORS.PRIMARY,
    paddingTop: 12,
    paddingBottom: 8,
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  headerProject: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E0D0FF',
  },
  // Domain section
  domainSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  domainHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  domainSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  domainChipScroll: {
    flexDirection: 'row',
    marginTop: 4,
    paddingRight: 16,
  },
  domainChip: {
    marginRight: 8,
    marginBottom: 4,
  },
  noDomainHint: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 4,
    marginBottom: 4,
  },
  // Results
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
  domainBadgeRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  domainBadge: {
    backgroundColor: '#F3E5F5',
  },
  domainBadgeText: {
    fontSize: 12,
    color: COLORS.PRIMARY,
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
  pickerLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
  },
  domainPickerScroll: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  domainPickerChip: {
    marginRight: 8,
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    fontStyle: 'italic',
  },
});

export default DesignerSitesScreen;
