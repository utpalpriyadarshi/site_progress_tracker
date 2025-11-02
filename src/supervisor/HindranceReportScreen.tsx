import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Image,
  TouchableOpacity,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  Card,
  Title,
  Paragraph,
  Button,
  TextInput,
  Portal,
  Dialog,
  Chip,
  SegmentedButtons,
  Divider,
  Text,
  IconButton,
  Menu,
  Icon,
} from 'react-native-paper';
import { launchCamera, launchImageLibrary, ImagePickerResponse, Asset } from 'react-native-image-picker';
import { database } from '../../models/database';
import { Q } from '@nozbe/watermelondb';
import HindranceModel from '../../models/HindranceModel';
import SiteModel from '../../models/SiteModel';
import ItemModel from '../../models/ItemModel';
import { useSiteContext } from './context/SiteContext';
import SiteSelector from './components/SiteSelector';
import { useSnackbar } from '../components/Snackbar';
import { ConfirmDialog } from '../components/Dialog';

interface HindranceWithDetails {
  hindrance: HindranceModel;
  site: SiteModel;
  item?: ItemModel;
}

// Memoized photo thumbnail component for performance
const PhotoThumbnail = React.memo(({ uri, index, onRemove }: { uri: string; index: number; onRemove: (index: number) => void }) => (
  <View style={styles.photoContainer}>
    <Image source={{ uri }} style={styles.photoThumbnail} resizeMode="cover" />
    <IconButton
      icon="close-circle"
      size={20}
      iconColor="#F44336"
      style={styles.removePhotoButton}
      onPress={() => onRemove(index)}
    />
  </View>
));

const HindranceReportScreen = () => {
  const { showSnackbar } = useSnackbar();
  const { selectedSiteId, supervisorId } = useSiteContext();
  const [refreshing, setRefreshing] = useState(false);
  const [hindrances, setHindrances] = useState<HindranceWithDetails[]>([]);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [editingHindrance, setEditingHindrance] = useState<HindranceModel | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [hindranceToDelete, setHindranceToDelete] = useState<HindranceModel | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [status, setStatus] = useState<'open' | 'in_progress' | 'resolved' | 'closed'>('open');
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [siteItems, setSiteItems] = useState<ItemModel[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [photoMenuVisible, setPhotoMenuVisible] = useState(false);

  // Load hindrances
  const loadHindrances = async () => {
    try {
      const hindrancesCollection = database.collections.get<HindranceModel>('hindrances');
      const sitesCollection = database.collections.get<SiteModel>('sites');
      const itemsCollection = database.collections.get<ItemModel>('items');

      // Build query
      const queryConditions = [Q.where('reported_by', supervisorId)];

      if (selectedSiteId !== 'all') {
        queryConditions.push(Q.where('site_id', selectedSiteId));
      }

      const fetchedHindrances = await hindrancesCollection
        .query(...queryConditions, Q.sortBy('reported_at', Q.desc))
        .fetch();

      // Fetch related data
      const hindrancesWithDetails: HindranceWithDetails[] = [];

      for (const hindrance of fetchedHindrances) {
        const site = await sitesCollection.find(hindrance.siteId);
        let item: ItemModel | undefined;

        if (hindrance.itemId) {
          try {
            item = await itemsCollection.find(hindrance.itemId);
          } catch (e) {
            // Item might not exist
          }
        }

        hindrancesWithDetails.push({
          hindrance,
          site,
          item,
        });
      }

      setHindrances(hindrancesWithDetails);
    } catch (error) {
      console.error('Error loading hindrances:', error);
      showSnackbar('Failed to load hindrances', 'error');
    }
  };

  // Load site items for dropdown
  const loadSiteItems = async (siteId: string) => {
    if (siteId === 'all') {
      setSiteItems([]);
      return;
    }

    try {
      const itemsCollection = database.collections.get<ItemModel>('items');
      const items = await itemsCollection
        .query(Q.where('site_id', siteId))
        .fetch();

      setSiteItems(items);
    } catch (error) {
      console.error('Error loading site items:', error);
    }
  };

  useEffect(() => {
    loadHindrances();
  }, [supervisorId, selectedSiteId]);

  useEffect(() => {
    if (selectedSiteId && selectedSiteId !== 'all') {
      loadSiteItems(selectedSiteId);
    }
  }, [selectedSiteId]);

  const syncPendingHindrances = async () => {
    try {
      // Get all pending hindrances
      const hindrancesCollection = database.collections.get<HindranceModel>('hindrances');
      const pendingHindrances = await hindrancesCollection
        .query(Q.where('sync_status', 'pending'))
        .fetch();

      // Update all pending hindrances to synced
      await database.write(async () => {
        for (const hindrance of pendingHindrances) {
          await hindrance.update((h) => {
            h.appSyncStatus = 'synced';
          });
        }
      });

      console.log(`Synced ${pendingHindrances.length} hindrances`);
    } catch (error) {
      console.error('Error syncing hindrances:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await syncPendingHindrances(); // Sync pending items
    await loadHindrances(); // Reload to show updated status
    setRefreshing(false);
  };

  const handleAdd = () => {
    if (selectedSiteId === 'all') {
      showSnackbar('Please select a specific site to add a hindrance', 'warning');
      return;
    }

    setEditingHindrance(null);
    resetForm();
    setDialogVisible(true);
  };

  const handleEdit = (hindranceWithDetails: HindranceWithDetails) => {
    const { hindrance } = hindranceWithDetails;
    setEditingHindrance(hindrance);
    setTitle(hindrance.title);
    setDescription(hindrance.description);
    setPriority(hindrance.priority as 'low' | 'medium' | 'high');
    setStatus(hindrance.status as 'open' | 'in_progress' | 'resolved' | 'closed');
    setSelectedItemId(hindrance.itemId || '');

    // Load photos
    try {
      const photosArray = JSON.parse(hindrance.photos || '[]');
      setPhotos(photosArray);
    } catch (e) {
      setPhotos([]);
    }

    setDialogVisible(true);
  };

  const handleDelete = (hindrance: HindranceModel) => {
    setHindranceToDelete(hindrance);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!hindranceToDelete) return;

    setShowDeleteDialog(false);
    try {
      await database.write(async () => {
        await hindranceToDelete.markAsDeleted();
      });
      showSnackbar('Hindrance deleted successfully', 'success');
      loadHindrances();
      setHindranceToDelete(null);
    } catch (error) {
      console.error('Error deleting hindrance:', error);
      showSnackbar('Failed to delete hindrance', 'error');
    }
  };

  // Photo handling functions
  const requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'App needs camera permission to take photos',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  const handleTakePhoto = async () => {
    setPhotoMenuVisible(false);

    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      showSnackbar('Camera permission is required to take photos', 'warning');
      return;
    }

    const result = await launchCamera({
      mediaType: 'photo',
      quality: 0.8,
      saveToPhotos: true,
    });

    if (result.didCancel) {
      return;
    }

    if (result.errorCode) {
      showSnackbar(result.errorMessage || 'Failed to take photo', 'error');
      return;
    }

    if (result.assets && result.assets.length > 0) {
      const photoUri = result.assets[0].uri;
      if (photoUri) {
        setPhotos([...photos, photoUri]);
      }
    }
  };

  const handleSelectPhoto = async () => {
    setPhotoMenuVisible(false);

    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.8,
      selectionLimit: 5,
    });

    if (result.didCancel) {
      return;
    }

    if (result.errorCode) {
      showSnackbar(result.errorMessage || 'Failed to select photo', 'error');
      return;
    }

    if (result.assets && result.assets.length > 0) {
      const newPhotos = result.assets
        .map((asset) => asset.uri)
        .filter((uri): uri is string => !!uri);
      setPhotos([...photos, ...newPhotos]);
    }
  };

  const handleRemovePhoto = useCallback((index: number) => {
    setPhotos(prev => {
      const newPhotos = [...prev];
      newPhotos.splice(index, 1);
      return newPhotos;
    });
  }, []);

  const handleSave = async () => {
    if (!title.trim()) {
      setDialogVisible(false);
      showSnackbar('Please enter a title', 'warning');
      return;
    }

    if (!selectedSiteId || selectedSiteId === 'all') {
      setDialogVisible(false);
      showSnackbar('Please select a site', 'warning');
      return;
    }

    try {
      let savedHindrance: HindranceModel | null = null;

      await database.write(async () => {
        if (editingHindrance) {
          // Update existing
          await editingHindrance.update((h) => {
            h.title = title;
            h.description = description;
            h.priority = priority;
            h.status = status;
            h.itemId = selectedItemId || '';
            h.photos = JSON.stringify(photos);
            h.appSyncStatus = 'pending'; // Mark as pending when edited
          });
          savedHindrance = editingHindrance;
        } else {
          // Create new
          const hindrancesCollection = database.collections.get<HindranceModel>('hindrances');
          savedHindrance = await hindrancesCollection.create((h) => {
            h.title = title;
            h.description = description;
            h.siteId = selectedSiteId;
            h.itemId = selectedItemId || '';
            h.priority = priority;
            h.status = status;
            h.assignedTo = ''; // Default empty, can be assigned later
            h.reportedBy = supervisorId;
            h.reportedAt = new Date().getTime();
            h.photos = JSON.stringify(photos);
            h.appSyncStatus = 'pending';
          });
        }
      });

      showSnackbar(editingHindrance ? 'Hindrance updated successfully' : 'Hindrance created successfully', 'success');
      setDialogVisible(false);
      resetForm();
      loadHindrances();

      // Simulate sync to server after 2 seconds
      if (savedHindrance) {
        const hindranceId = savedHindrance.id;
        setTimeout(async () => {
          try {
            const hindrancesCollection = database.collections.get<HindranceModel>('hindrances');
            const hindrance = await hindrancesCollection.find(hindranceId);

            await database.write(async () => {
              await hindrance.update((h) => {
                h.appSyncStatus = 'synced';
              });
            });

            console.log('Hindrance synced successfully:', hindranceId);
            // Reload to show updated sync status
            loadHindrances();
          } catch (error) {
            console.error('Error updating sync status:', error);
          }
        }, 2000);
      }
    } catch (error) {
      console.error('Error saving hindrance:', error);
      showSnackbar('Failed to save hindrance', 'error');
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPriority('medium');
    setStatus('open');
    setSelectedItemId('');
    setPhotos([]);
    setEditingHindrance(null);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return '#F44336';
      case 'medium':
        return '#FF9800';
      case 'low':
        return '#4CAF50';
      default:
        return '#9E9E9E';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return '#F44336';
      case 'in_progress':
        return '#2196F3';
      case 'resolved':
        return '#4CAF50';
      case 'closed':
        return '#9E9E9E';
      default:
        return '#9E9E9E';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open':
        return 'Open';
      case 'in_progress':
        return 'In Progress';
      case 'resolved':
        return 'Resolved';
      case 'closed':
        return 'Closed';
      default:
        return status;
    }
  };

  return (
    <View style={styles.container}>
      {/* Site Selector */}
      <SiteSelector />

      {/* Add Button */}
      <View style={styles.addButtonContainer}>
        <Button
          mode="contained"
          onPress={handleAdd}
          icon="plus"
          disabled={selectedSiteId === 'all'}
        >
          Report Hindrance
        </Button>
      </View>

      {/* Hindrances List */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {hindrances.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content>
              <Title>No Hindrances</Title>
              <Paragraph>
                {selectedSiteId === 'all'
                  ? 'Select a site to view hindrances'
                  : 'No hindrances reported for this site'}
              </Paragraph>
            </Card.Content>
          </Card>
        ) : (
          hindrances.map(({ hindrance, site, item }) => (
            <Card key={hindrance.id} style={styles.card}>
              <Card.Content>
                <View style={styles.cardHeader}>
                  <View style={styles.headerLeft}>
                    <Title style={styles.title}>{hindrance.title}</Title>
                    <Text style={styles.siteName}>{site.name}</Text>
                    {item && (
                      <Text style={styles.itemName}>Item: {item.name}</Text>
                    )}
                  </View>
                  <View style={styles.headerRight}>
                    <Chip
                      style={[
                        styles.priorityChip,
                        { backgroundColor: getPriorityColor(hindrance.priority) },
                      ]}
                      textStyle={styles.chipText}
                    >
                      {hindrance.priority.toUpperCase()}
                    </Chip>
                  </View>
                </View>

                <Divider style={styles.divider} />

                <View style={styles.statusRow}>
                  <Chip
                    style={[
                      styles.statusChip,
                      { backgroundColor: getStatusColor(hindrance.status) },
                    ]}
                    textStyle={styles.chipText}
                  >
                    {getStatusLabel(hindrance.status)}
                  </Chip>
                  {hindrance.appSyncStatus && (
                    <View style={styles.syncChipContainer}>
                      <MaterialCommunityIcons
                        name={hindrance.appSyncStatus === 'synced' ? 'cloud-check' : 'cloud-upload'}
                        size={16}
                        color="#1976D2"
                      />
                      <Text style={styles.syncChipText}>{hindrance.appSyncStatus}</Text>
                    </View>
                  )}
                  {(() => {
                    try {
                      const photosArray = JSON.parse(hindrance.photos || '[]');
                      if (Array.isArray(photosArray) && photosArray.length > 0) {
                        return (
                          <Chip icon="camera" style={styles.photoChip}>
                            {photosArray.length}
                          </Chip>
                        );
                      }
                    } catch (e) {
                      // Invalid JSON, ignore
                    }
                    return null;
                  })()}
                </View>

                {hindrance.description && (
                  <>
                    <Divider style={styles.divider} />
                    <Text style={styles.description}>{hindrance.description}</Text>
                  </>
                )}
              </Card.Content>

              <Card.Actions>
                <Button icon="pencil" onPress={() => handleEdit({ hindrance, site, item })}>
                  Edit
                </Button>
                <Button
                  icon="delete"
                  textColor="#F44336"
                  onPress={() => handleDelete(hindrance)}
                >
                  Delete
                </Button>
              </Card.Actions>
            </Card>
          ))
        )}
      </ScrollView>

      {/* Create/Edit Dialog */}
      <Portal>
        <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)}>
          <Dialog.Title>
            {editingHindrance ? 'Edit Hindrance' : 'Report Hindrance'}
          </Dialog.Title>
          <Dialog.ScrollArea>
            <ScrollView>
              <View style={styles.dialogContent}>
                <TextInput
                  label="Title *"
                  value={title}
                  onChangeText={setTitle}
                  mode="outlined"
                  style={styles.input}
                />

                <TextInput
                  label="Description"
                  value={description}
                  onChangeText={setDescription}
                  mode="outlined"
                  multiline
                  numberOfLines={4}
                  style={styles.input}
                />

                <Text style={styles.label}>Priority</Text>
                <SegmentedButtons
                  value={priority}
                  onValueChange={(value) => setPriority(value as any)}
                  buttons={[
                    { value: 'low', label: 'Low' },
                    { value: 'medium', label: 'Medium' },
                    { value: 'high', label: 'High' },
                  ]}
                  style={styles.input}
                />

                <Text style={styles.label}>Status</Text>
                <SegmentedButtons
                  value={status}
                  onValueChange={(value) => setStatus(value as any)}
                  buttons={[
                    { value: 'open', label: 'Open' },
                    { value: 'in_progress', label: 'In Progress' },
                    { value: 'resolved', label: 'Resolved' },
                    { value: 'closed', label: 'Closed' },
                  ]}
                  style={styles.input}
                />

                <Text style={styles.label}>Related Item (Optional)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.itemChipsContainer}>
                    <Chip
                      selected={selectedItemId === ''}
                      onPress={() => setSelectedItemId('')}
                      style={styles.itemChip}
                    >
                      None
                    </Chip>
                    {siteItems.map((item) => (
                      <Chip
                        key={item.id}
                        selected={selectedItemId === item.id}
                        onPress={() => setSelectedItemId(item.id)}
                        style={styles.itemChip}
                      >
                        {item.name}
                      </Chip>
                    ))}
                  </View>
                </ScrollView>

                {/* Photo Picker */}
                <Text style={styles.label}>Photos (Optional)</Text>
                <Menu
                  visible={photoMenuVisible}
                  onDismiss={() => setPhotoMenuVisible(false)}
                  anchor={
                    <Button
                      mode="outlined"
                      icon="camera"
                      onPress={() => setPhotoMenuVisible(true)}
                      style={styles.input}
                    >
                      Add Photos ({photos.length})
                    </Button>
                  }
                >
                  <Menu.Item onPress={handleTakePhoto} leadingIcon="camera" title="Take Photo" />
                  <Menu.Item onPress={handleSelectPhoto} leadingIcon="image" title="Select from Gallery" />
                </Menu>

                {/* Photo Gallery */}
                {photos.length > 0 && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoGallery}>
                    {photos.map((photoUri, index) => (
                      <PhotoThumbnail
                        key={`${photoUri}-${index}`}
                        uri={photoUri}
                        index={index}
                        onRemove={handleRemovePhoto}
                      />
                    ))}
                  </ScrollView>
                )}

                <Text style={styles.helperText}>
                  * Required fields
                </Text>
              </View>
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleSave}>
              {editingHindrance ? 'Update' : 'Create'}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        visible={showDeleteDialog}
        title="Delete Hindrance"
        message="Are you sure you want to delete this hindrance? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onCancel={() => {
          setShowDeleteDialog(false);
          setHindranceToDelete(null);
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
  addButtonContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  scrollView: {
    flex: 1,
  },
  emptyCard: {
    margin: 16,
    alignItems: 'center',
    padding: 20,
  },
  card: {
    margin: 16,
    marginBottom: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    marginLeft: 12,
  },
  title: {
    fontSize: 18,
    marginBottom: 4,
  },
  siteName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  itemName: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  divider: {
    marginVertical: 12,
  },
  statusRow: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityChip: {
    alignSelf: 'flex-start',
  },
  statusChip: {
    alignSelf: 'flex-start',
  },
  syncChipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
    borderWidth: 1,
    borderColor: '#1976D2',
  },
  syncChipText: {
    color: '#1976D2',
    fontWeight: '600',
    fontSize: 12,
  },
  photoChip: {
    alignSelf: 'flex-start',
  },
  chipText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 11,
  },
  description: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  dialogContent: {
    padding: 16,
  },
  input: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
  },
  itemChipsContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 8,
  },
  itemChip: {
    marginRight: 8,
  },
  helperText: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
    fontStyle: 'italic',
  },
  photoGallery: {
    marginBottom: 16,
  },
  photoContainer: {
    position: 'relative',
    marginRight: 12,
  },
  photoThumbnail: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: 'white',
    margin: 0,
  },
});

export default HindranceReportScreen;
