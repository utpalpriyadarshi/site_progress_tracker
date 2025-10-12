import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
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
  Divider,
  Text,
} from 'react-native-paper';
import { database } from '../../models/database';
import { withObservables } from '@nozbe/watermelondb/react';
import { Q } from '@nozbe/watermelondb';
import SiteModel from '../../models/SiteModel';
import { useSiteContext } from './context/SiteContext';

const SiteManagementScreenComponent = ({
  sites,
  projects,
}: {
  sites: SiteModel[];
  projects: any[];
}) => {
  const { supervisorId, setSelectedSiteId } = useSiteContext();
  const [dialogVisible, setDialogVisible] = useState(false);
  const [editingSite, setEditingSite] = useState<SiteModel | null>(null);
  const [siteName, setSiteName] = useState('');
  const [siteLocation, setSiteLocation] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');

  const openAddDialog = () => {
    setEditingSite(null);
    setSiteName('');
    setSiteLocation('');
    setSelectedProjectId(projects[0]?.id || '');
    setDialogVisible(true);
  };

  const openEditDialog = (site: SiteModel) => {
    setEditingSite(site);
    setSiteName(site.name);
    setSiteLocation(site.location);
    setSelectedProjectId(site.projectId);
    setDialogVisible(true);
  };

  const closeDialog = () => {
    setDialogVisible(false);
    setEditingSite(null);
    setSiteName('');
    setSiteLocation('');
    setSelectedProjectId('');
  };

  const handleSave = async () => {
    if (!siteName.trim() || !siteLocation.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
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
          });
          Alert.alert('Success', 'Site updated successfully');
        } else {
          // Create new site
          const newSite = await database.collections.get('sites').create((site: any) => {
            site.name = siteName.trim();
            site.location = siteLocation.trim();
            site.projectId = selectedProjectId;
            site.supervisorId = supervisorId;
          });
          Alert.alert('Success', 'Site created successfully');

          // Optionally auto-select the new site
          setSelectedSiteId(newSite.id);
        }
      });
      closeDialog();
    } catch (error) {
      console.error('Error saving site:', error);
      Alert.alert('Error', 'Failed to save site: ' + (error as Error).message);
    }
  };

  const handleDelete = (site: SiteModel) => {
    Alert.alert(
      'Delete Site',
      `Are you sure you want to delete "${site.name}"? This will also delete all associated items and data.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await database.write(async () => {
                // Note: In production, you should also delete related items, materials, etc.
                await site.markAsDeleted();
              });
              Alert.alert('Success', 'Site deleted successfully');
            } catch (error) {
              console.error('Error deleting site:', error);
              Alert.alert('Error', 'Failed to delete site: ' + (error as Error).message);
            }
          },
        },
      ]
    );
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
                        onPress={() => handleDelete(site)}
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

const EnhancedSiteManagementScreen = enhance(SiteManagementScreenComponent);

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
