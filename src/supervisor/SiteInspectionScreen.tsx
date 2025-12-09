import React, { useState, useEffect, useCallback } from 'react';
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
import {
  Card,
  Title,
  Paragraph,
  Button,
  Portal,
  Dialog,
  Text,
  Chip,
  SegmentedButtons,
  TextInput,
  Divider,
  IconButton,
  Menu,
  List,
  RadioButton,
} from 'react-native-paper';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { database } from '../../models/database';
import { Q } from '@nozbe/watermelondb';
import SiteInspectionModel from '../../models/SiteInspectionModel';
import SiteModel from '../../models/SiteModel';
import { useSiteContext } from './context/SiteContext';
import SiteSelector from './components/SiteSelector';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { SyncService } from '../../services/sync/SyncService';
import { useSnackbar } from '../components/Snackbar';
import { ConfirmDialog } from '../components/Dialog';
import { logger } from '../services/LoggingService';

interface InspectionWithSite {
  inspection: SiteInspectionModel;
  site: SiteModel;
}

interface ChecklistItem {
  id: string;
  category: string;
  item: string;
  status: 'pass' | 'fail' | 'na';
  notes: string;
}

// Memoized photo thumbnail component
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

// Accordion icon components to avoid inline definitions
const AccordionLeftIcon = () => <List.Icon icon="clipboard-list" />;
const AccordionRightIcon = ({ passCount, total }: { passCount: number; total: number }) => (
  <Text style={styles.categoryCount}>
    {passCount}/{total}
  </Text>
);

const SiteInspectionScreen = () => {
  const { showSnackbar } = useSnackbar();
  const { selectedSiteId, supervisorId, projectId } = useSiteContext();
  const [refreshing, setRefreshing] = useState(false);
  const [inspections, setInspections] = useState<InspectionWithSite[]>([]);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [editingInspection, setEditingInspection] = useState<SiteInspectionModel | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [inspectionToDelete, setInspectionToDelete] = useState<SiteInspectionModel | null>(null);

  // Form state
  const [inspectionType, setInspectionType] = useState<'daily' | 'weekly' | 'safety' | 'quality'>('daily');
  const [overallRating, setOverallRating] = useState<'excellent' | 'good' | 'fair' | 'poor'>('good');
  const [safetyFlagged, setSafetyFlagged] = useState(false);
  const [notes, setNotes] = useState('');
  const [followUpRequired, setFollowUpRequired] = useState(false);
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpNotes, setFollowUpNotes] = useState('');

  // Checklist and photos state
  const [checklistData, setChecklistData] = useState<ChecklistItem[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [photoMenuVisible, setPhotoMenuVisible] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  // Default checklist template
  const defaultChecklist: ChecklistItem[] = [
    // PPE & Safety Equipment
    { id: '1', category: 'PPE & Safety Equipment', item: 'Hard hats worn by all workers', status: 'na', notes: '' },
    { id: '2', category: 'PPE & Safety Equipment', item: 'Safety boots in good condition', status: 'na', notes: '' },
    { id: '3', category: 'PPE & Safety Equipment', item: 'High-visibility vests worn', status: 'na', notes: '' },
    { id: '4', category: 'PPE & Safety Equipment', item: 'Safety glasses/goggles available', status: 'na', notes: '' },
    { id: '5', category: 'PPE & Safety Equipment', item: 'Gloves appropriate for tasks', status: 'na', notes: '' },

    // Scaffolding & Work at Height
    { id: '6', category: 'Scaffolding & Work at Height', item: 'Scaffolding properly erected and tagged', status: 'na', notes: '' },
    { id: '7', category: 'Scaffolding & Work at Height', item: 'Fall protection systems in place', status: 'na', notes: '' },
    { id: '8', category: 'Scaffolding & Work at Height', item: 'Ladders in good condition', status: 'na', notes: '' },
    { id: '9', category: 'Scaffolding & Work at Height', item: 'Edge protection adequate', status: 'na', notes: '' },

    // Equipment & Tools
    { id: '10', category: 'Equipment & Tools', item: 'Power tools properly guarded', status: 'na', notes: '' },
    { id: '11', category: 'Equipment & Tools', item: 'Equipment inspected and tagged', status: 'na', notes: '' },
    { id: '12', category: 'Equipment & Tools', item: 'Electrical cords in good condition', status: 'na', notes: '' },
    { id: '13', category: 'Equipment & Tools', item: 'Machinery properly maintained', status: 'na', notes: '' },

    // Fire Safety & Emergency
    { id: '14', category: 'Fire Safety & Emergency', item: 'Fire extinguishers accessible', status: 'na', notes: '' },
    { id: '15', category: 'Fire Safety & Emergency', item: 'Emergency exits clearly marked', status: 'na', notes: '' },
    { id: '16', category: 'Fire Safety & Emergency', item: 'First aid kit available', status: 'na', notes: '' },
    { id: '17', category: 'Fire Safety & Emergency', item: 'Emergency contact numbers posted', status: 'na', notes: '' },

    // Housekeeping & Site Conditions
    { id: '18', category: 'Housekeeping & Site Conditions', item: 'Work area clean and organized', status: 'na', notes: '' },
    { id: '19', category: 'Housekeeping & Site Conditions', item: 'Materials properly stored', status: 'na', notes: '' },
    { id: '20', category: 'Housekeeping & Site Conditions', item: 'Waste disposal adequate', status: 'na', notes: '' },
    { id: '21', category: 'Housekeeping & Site Conditions', item: 'Walkways clear of obstructions', status: 'na', notes: '' },
  ];

  // Load inspections
  const loadInspections = async () => {
    try {
      const inspectionsCollection = database.collections.get<SiteInspectionModel>('site_inspections');
      const sitesCollection = database.collections.get<SiteModel>('sites');

      // Build query - filter by project and optionally by site
      const queryConditions = [
        Q.where('inspector_id', supervisorId),
        Q.on('sites', 'project_id', projectId), // Project isolation
      ];

      if (selectedSiteId !== 'all') {
        queryConditions.push(Q.where('site_id', selectedSiteId));
      }

      const fetchedInspections = await inspectionsCollection
        .query(...queryConditions, Q.sortBy('inspection_date', Q.desc))
        .fetch();

      // Fetch related data
      const inspectionsWithSites: InspectionWithSite[] = [];

      for (const inspection of fetchedInspections) {
        const site = await sitesCollection.find(inspection.siteId);
        logger.debug('Inspection loaded', {
          component: 'SiteInspectionScreen',
          inspectionId: inspection.id,
          syncStatus: inspection.appSyncStatus,
        });
        inspectionsWithSites.push({
          inspection,
          site,
        });
      }

      setInspections(inspectionsWithSites);
    } catch (error) {
      logger.error('Failed to load inspections', error as Error, {
        component: 'SiteInspectionScreen',
        action: 'loadInspections',
        supervisorId,
      });
      showSnackbar('Failed to load inspections', 'error');
    }
  };

  useEffect(() => {
    const init = async () => {
      await loadInspections();

      // Auto-sync after 2 seconds
      setTimeout(async () => {
        logger.debug('Auto-sync triggered', { component: 'SiteInspectionScreen' });
        try {
          const syncResult = await SyncService.syncUp();
          logger.debug('Auto-sync completed', {
            component: 'SiteInspectionScreen',
            syncResult,
          });

          if (syncResult.success && syncResult.syncedRecords > 0) {
            // Silently reload inspections to update UI
            await loadInspections();
            logger.debug('Inspections reloaded after sync', {
              component: 'SiteInspectionScreen',
            });
          }
        } catch (error) {
          logger.error('Auto-sync failed', error as Error, {
            component: 'SiteInspectionScreen',
          });
        }
      }, 2000);
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supervisorId, selectedSiteId]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Perform sync operation to update sync status
      const syncResult = await SyncService.syncUp();
      logger.info('Sync completed', {
        component: 'SiteInspectionScreen',
        action: 'onRefresh',
        syncResult,
      });

      // Reload inspections to show updated sync status
      await loadInspections();

      if (syncResult.success && syncResult.syncedRecords > 0) {
        showSnackbar(`${syncResult.syncedRecords} records synced successfully`, 'success');
      }
    } catch (error) {
      logger.error('Refresh failed', error as Error, {
        component: 'SiteInspectionScreen',
        action: 'onRefresh',
      });
      showSnackbar('Failed to sync data', 'error');
    }
    setRefreshing(false);
  };

  const handleAdd = () => {
    if (selectedSiteId === 'all') {
      showSnackbar('Please select a specific site to create an inspection', 'warning');
      return;
    }

    setEditingInspection(null);
    resetForm();
    setDialogVisible(true);
  };

  const handleEdit = (inspectionWithSite: InspectionWithSite) => {
    const { inspection } = inspectionWithSite;
    setEditingInspection(inspection);
    setInspectionType(inspection.inspectionType as any);
    setOverallRating(inspection.overallRating as any);
    setSafetyFlagged(inspection.safetyFlagged);
    setNotes(inspection.notes || '');

    // Parse checklist data
    try {
      const checklist = JSON.parse(inspection.checklistData || '[]');
      setChecklistData(checklist.length > 0 ? checklist : [...defaultChecklist]);
    } catch (e) {
      setChecklistData([...defaultChecklist]);
    }

    // Parse photos
    try {
      const photosArray = JSON.parse(inspection.photos || '[]');
      setPhotos(photosArray);
    } catch (e) {
      setPhotos([]);
    }

    // Follow-up data
    const hasFollowUp = inspection.followUpDate > 0;
    setFollowUpRequired(hasFollowUp);
    if (hasFollowUp) {
      const followUpDateObj = new Date(inspection.followUpDate);
      setFollowUpDate(followUpDateObj.toISOString().split('T')[0]);
    } else {
      setFollowUpDate('');
    }
    setFollowUpNotes(inspection.followUpNotes || '');

    setDialogVisible(true);
  };

  const handleDelete = (inspection: SiteInspectionModel) => {
    setInspectionToDelete(inspection);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!inspectionToDelete) return;

    setShowDeleteDialog(false);
    try {
      await database.write(async () => {
        await inspectionToDelete.markAsDeleted();
      });
      showSnackbar('Inspection deleted successfully', 'success');
      loadInspections();
      setInspectionToDelete(null);
    } catch (error) {
      logger.error('Failed to delete inspection', error as Error, {
        component: 'SiteInspectionScreen',
        action: 'confirmDelete',
        inspectionId: inspectionToDelete?.id,
      });
      showSnackbar('Failed to delete inspection', 'error');
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
        logger.warn('Camera permission request failed', {
          component: 'SiteInspectionScreen',
          error: String(err),
        });
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

    if (result.didCancel) return;
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

    if (result.didCancel) return;
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

  // Checklist functions
  const toggleCategory = (category: string) => {
    setExpandedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const updateChecklistItem = (id: string, field: 'status' | 'notes', value: any) => {
    setChecklistData(prev =>
      prev.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const getChecklistSummary = () => {
    const pass = checklistData.filter(i => i.status === 'pass').length;
    const fail = checklistData.filter(i => i.status === 'fail').length;
    const na = checklistData.filter(i => i.status === 'na').length;
    return { pass, fail, na, total: checklistData.length };
  };

  const handleSave = async () => {
    if (!selectedSiteId || selectedSiteId === 'all') {
      setDialogVisible(false);
      showSnackbar('Please select a site', 'warning');
      return;
    }

    // Validate follow-up
    if (followUpRequired && !followUpDate) {
      setDialogVisible(false);
      showSnackbar('Please select a follow-up date', 'warning');
      return;
    }

    try {
      const followUpTimestamp = followUpRequired && followUpDate
        ? new Date(followUpDate).getTime()
        : 0;

      await database.write(async () => {
        if (editingInspection) {
          // Update existing
          await editingInspection.update((inspection) => {
            inspection.inspectionType = inspectionType;
            inspection.overallRating = overallRating;
            inspection.safetyFlagged = safetyFlagged;
            inspection.notes = notes;
            inspection.checklistData = JSON.stringify(checklistData);
            inspection.photos = JSON.stringify(photos);
            inspection.followUpDate = followUpTimestamp;
            inspection.followUpNotes = followUpRequired ? followUpNotes : '';
            inspection.appSyncStatus = 'pending';
          });
        } else {
          // Create new
          const inspectionsCollection = database.collections.get<SiteInspectionModel>('site_inspections');
          await inspectionsCollection.create((inspection) => {
            inspection.siteId = selectedSiteId;
            inspection.inspectorId = supervisorId;
            inspection.inspectionDate = new Date().getTime();
            inspection.inspectionType = inspectionType;
            inspection.overallRating = overallRating;
            inspection.checklistData = JSON.stringify(checklistData);
            inspection.photos = JSON.stringify(photos);
            inspection.safetyFlagged = safetyFlagged;
            inspection.followUpDate = followUpTimestamp;
            inspection.followUpNotes = followUpRequired ? followUpNotes : '';
            inspection.notes = notes;
            inspection.appSyncStatus = 'pending';
          });
        }
      });

      showSnackbar(editingInspection ? 'Inspection updated successfully' : 'Inspection created successfully', 'success');
      setDialogVisible(false);
      resetForm();
      loadInspections();
    } catch (error) {
      logger.error('Failed to save inspection', error as Error, {
        component: 'SiteInspectionScreen',
        action: 'handleSave',
        inspectionType,
      });
      showSnackbar('Failed to save inspection', 'error');
    }
  };

  const resetForm = () => {
    setInspectionType('daily');
    setOverallRating('good');
    setSafetyFlagged(false);
    setNotes('');
    setChecklistData([...defaultChecklist]);
    setPhotos([]);
    setExpandedCategories([]);
    setFollowUpRequired(false);
    setFollowUpDate('');
    setFollowUpNotes('');
    setEditingInspection(null);
  };

  const getInspectionTypeColor = (type: string) => {
    switch (type) {
      case 'safety':
        return '#F44336';
      case 'quality':
        return '#2196F3';
      case 'weekly':
        return '#FF9800';
      case 'daily':
      default:
        return '#4CAF50';
    }
  };

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'excellent':
        return '#4CAF50';
      case 'good':
        return '#8BC34A';
      case 'fair':
        return '#FF9800';
      case 'poor':
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
          icon="clipboard-check"
          disabled={selectedSiteId === 'all'}
        >
          New Inspection
        </Button>
      </View>

      {/* Inspections List */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {inspections.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content>
              <MaterialCommunityIcons
                name="clipboard-check-outline"
                size={64}
                color="#999"
                style={styles.emptyIcon}
              />
              <Title>No Inspections</Title>
              <Paragraph>
                {selectedSiteId === 'all'
                  ? 'Select a site to view inspections'
                  : 'No inspections recorded for this site'}
              </Paragraph>
            </Card.Content>
          </Card>
        ) : (
          inspections.map(({ inspection, site }) => (
            <Card key={inspection.id} style={styles.card}>
              <Card.Content>
                <View style={styles.cardHeader}>
                  <View style={styles.headerLeft}>
                    <View style={styles.typeRow}>
                      <Chip
                        style={[
                          styles.typeChip,
                          { backgroundColor: getInspectionTypeColor(inspection.inspectionType) },
                        ]}
                        textStyle={styles.chipText}
                      >
                        {inspection.inspectionType.toUpperCase()}
                      </Chip>
                      {inspection.safetyFlagged && (
                        <Chip
                          icon="alert"
                          style={styles.safetyChip}
                          textStyle={styles.chipText}
                        >
                          SAFETY
                        </Chip>
                      )}
                    </View>
                    <Text style={styles.siteName}>{site.name}</Text>
                    <Text style={styles.dateText}>{formatDate(inspection.inspectionDate)}</Text>
                  </View>
                  <View style={styles.headerRight}>
                    <Chip
                      style={[
                        styles.ratingChip,
                        { backgroundColor: getRatingColor(inspection.overallRating) },
                      ]}
                      textStyle={styles.chipText}
                    >
                      {inspection.overallRating.toUpperCase()}
                    </Chip>
                  </View>
                </View>

                <Divider style={styles.divider} />

                {/* Notes Section */}
                {inspection.notes && (
                  <View style={styles.notesSection}>
                    <View style={styles.notesSectionHeader}>
                      <MaterialCommunityIcons name="note-text" size={16} color="#666" />
                      <Text style={styles.notesSectionTitle}>Notes</Text>
                    </View>
                    <Text style={styles.notes}>{inspection.notes}</Text>
                  </View>
                )}

                {/* Checklist Summary */}
                {(() => {
                  try {
                    const checklist = JSON.parse(inspection.checklistData || '[]');
                    if (checklist.length > 0) {
                      const pass = checklist.filter((i: any) => i.status === 'pass').length;
                      const fail = checklist.filter((i: any) => i.status === 'fail').length;
                      const failedItems = checklist.filter((i: any) => i.status === 'fail');

                      return (
                        <>
                          <View style={[styles.checklistSummary, fail > 0 && styles.checklistSummaryWithFails]}>
                            <MaterialCommunityIcons
                              name="clipboard-list"
                              size={16}
                              color={fail > 0 ? "#F44336" : "#666"}
                            />
                            <Text style={[styles.checklistText, fail > 0 && styles.checklistTextFailed]}>
                              {pass} Pass, {fail} Fail
                            </Text>
                          </View>

                          {/* Show failed items with notes */}
                          {failedItems.length > 0 && (
                            <View style={styles.failedItemsContainer}>
                              {failedItems.map((item: any, index: number) => (
                                <View key={index} style={styles.failedItem}>
                                  <Text style={styles.failedItemText}>
                                    • {item.item}
                                  </Text>
                                  {item.notes && (
                                    <Text style={styles.failedItemNotes}>
                                      {item.notes}
                                    </Text>
                                  )}
                                </View>
                              ))}
                            </View>
                          )}
                        </>
                      );
                    }
                  } catch (e) {}
                  return null;
                })()}

                {/* Photos Preview */}
                {(() => {
                  try {
                    const photosArray = JSON.parse(inspection.photos || '[]');
                    if (photosArray.length > 0) {
                      return (
                        <View style={styles.photosPreview}>
                          <MaterialCommunityIcons name="camera" size={16} color="#666" />
                          <Text style={styles.photosText}>{photosArray.length} photo(s)</Text>
                        </View>
                      );
                    }
                  } catch (e) {}
                  return null;
                })()}

                {/* Follow-up Indicator */}
                {inspection.followUpDate > 0 && (
                  <View style={styles.followUpBanner}>
                    <MaterialCommunityIcons name="calendar-clock" size={16} color="#FF9800" />
                    <Text style={styles.followUpText}>
                      Follow-up: {new Date(inspection.followUpDate).toLocaleDateString()}
                    </Text>
                  </View>
                )}

                {/* Sync Status */}
                <View style={styles.statusRow}>
                  {inspection.appSyncStatus && (
                    <View style={styles.syncStatusContainer}>
                      <MaterialCommunityIcons
                        name={inspection.appSyncStatus === 'synced' ? 'cloud-check' : 'cloud-upload'}
                        size={16}
                        color={inspection.appSyncStatus === 'synced' ? '#4CAF50' : '#FF9800'}
                      />
                      <Text style={[
                        styles.syncStatusText,
                        { color: inspection.appSyncStatus === 'synced' ? '#4CAF50' : '#FF9800' }
                      ]}>
                        {inspection.appSyncStatus === 'synced' ? 'Synced' : 'Pending Sync'}
                      </Text>
                    </View>
                  )}
                </View>
              </Card.Content>

              <Card.Actions>
                <Button icon="pencil" onPress={() => handleEdit({ inspection, site })}>
                  Edit
                </Button>
                <Button
                  icon="delete"
                  textColor="#F44336"
                  onPress={() => handleDelete(inspection)}
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
            {editingInspection ? 'Edit Inspection' : 'New Site Inspection'}
          </Dialog.Title>
          <Dialog.ScrollArea>
            <ScrollView>
              <View style={styles.dialogContent}>
                <Text style={styles.label}>Inspection Type</Text>
                <SegmentedButtons
                  value={inspectionType}
                  onValueChange={(value) => setInspectionType(value as any)}
                  buttons={[
                    { value: 'daily', label: 'Daily' },
                    { value: 'weekly', label: 'Weekly' },
                    { value: 'safety', label: 'Safety' },
                    { value: 'quality', label: 'Quality' },
                  ]}
                  style={styles.input}
                />

                <Text style={styles.label}>Overall Rating</Text>
                <SegmentedButtons
                  value={overallRating}
                  onValueChange={(value) => setOverallRating(value as any)}
                  buttons={[
                    { value: 'excellent', label: 'Excellent' },
                    { value: 'good', label: 'Good' },
                    { value: 'fair', label: 'Fair' },
                    { value: 'poor', label: 'Poor' },
                  ]}
                  style={styles.input}
                />

                <View style={styles.safetyFlagRow}>
                  <Text style={styles.label}>Safety Issue Found?</Text>
                  <Button
                    mode={safetyFlagged ? 'contained' : 'outlined'}
                    icon={safetyFlagged ? 'alert' : 'alert-outline'}
                    onPress={() => setSafetyFlagged(!safetyFlagged)}
                    buttonColor={safetyFlagged ? '#F44336' : undefined}
                    textColor={safetyFlagged ? 'white' : '#F44336'}
                    style={styles.safetyButton}
                  >
                    {safetyFlagged ? 'Yes - Flagged' : 'No Issues'}
                  </Button>
                </View>

                <TextInput
                  label="Inspection Notes"
                  value={notes}
                  onChangeText={setNotes}
                  mode="outlined"
                  multiline
                  numberOfLines={4}
                  style={styles.input}
                  placeholder="Add overall inspection notes..."
                />

                {/* Photo Capture Section */}
                <Divider style={styles.divider} />
                <Text style={styles.sectionTitle}>Photos ({photos.length}/10)</Text>

                <View style={styles.photosGrid}>
                  {photos.map((uri, index) => (
                    <PhotoThumbnail key={index} uri={uri} index={index} onRemove={handleRemovePhoto} />
                  ))}

                  {photos.length < 10 && (
                    <Menu
                      visible={photoMenuVisible}
                      onDismiss={() => setPhotoMenuVisible(false)}
                      anchor={
                        <TouchableOpacity
                          style={styles.addPhotoButton}
                          onPress={() => setPhotoMenuVisible(true)}
                        >
                          <MaterialCommunityIcons name="camera-plus" size={40} color="#666" />
                          <Text style={styles.addPhotoText}>Add Photo</Text>
                        </TouchableOpacity>
                      }
                    >
                      <Menu.Item
                        onPress={handleTakePhoto}
                        leadingIcon="camera"
                        title="Take Photo"
                      />
                      <Menu.Item
                        onPress={handleSelectPhoto}
                        leadingIcon="image"
                        title="Choose from Gallery"
                      />
                    </Menu>
                  )}
                </View>

                {/* Checklist Section */}
                <Divider style={styles.divider} />
                <Text style={styles.sectionTitle}>
                  Safety Checklist ({getChecklistSummary().pass} Pass / {getChecklistSummary().fail} Fail)
                </Text>

                {/* Group checklist by category */}
                {Array.from(new Set(checklistData.map(item => item.category))).map(category => {
                  const categoryItems = checklistData.filter(item => item.category === category);
                  const isExpanded = expandedCategories.includes(category);
                  const passCount = categoryItems.filter(i => i.status === 'pass').length;

                  return (
                    <View key={category} style={styles.checklistCategory}>
                      <List.Accordion
                        title={category}
                        expanded={isExpanded}
                        onPress={() => toggleCategory(category)}
                        left={AccordionLeftIcon}
                        right={() => <AccordionRightIcon passCount={passCount} total={categoryItems.length} />}
                      >
                        {categoryItems.map(item => (
                          <View key={item.id} style={styles.checklistItem}>
                            <Text style={styles.checklistItemText}>{item.item}</Text>

                            <View style={styles.statusButtons}>
                              <RadioButton.Group
                                onValueChange={value => updateChecklistItem(item.id, 'status', value)}
                                value={item.status}
                              >
                                <View style={styles.radioRow}>
                                  <View style={styles.radioItem}>
                                    <RadioButton.Android value="pass" color="#4CAF50" />
                                    <Text style={styles.radioLabel}>Pass</Text>
                                  </View>
                                  <View style={styles.radioItem}>
                                    <RadioButton.Android value="fail" color="#F44336" />
                                    <Text style={styles.radioLabel}>Fail</Text>
                                  </View>
                                  <View style={styles.radioItem}>
                                    <RadioButton.Android value="na" color="#999" />
                                    <Text style={styles.radioLabel}>N/A</Text>
                                  </View>
                                </View>
                              </RadioButton.Group>
                            </View>

                            {item.status === 'fail' && (
                              <TextInput
                                label="Notes (required for failed items)"
                                value={item.notes}
                                onChangeText={value => updateChecklistItem(item.id, 'notes', value)}
                                mode="outlined"
                                dense
                                multiline
                                style={styles.checklistNotes}
                              />
                            )}
                          </View>
                        ))}
                      </List.Accordion>
                    </View>
                  );
                })}

                {/* Follow-up Scheduling Section */}
                <Divider style={styles.divider} />
                <View style={styles.followUpSection}>
                  <Text style={styles.sectionTitle}>Schedule Follow-up Inspection</Text>
                  <View style={styles.followUpToggleContainer}>
                    <Button
                      mode={followUpRequired ? 'contained' : 'outlined'}
                      icon={followUpRequired ? 'calendar-check' : 'calendar-plus'}
                      onPress={() => setFollowUpRequired(!followUpRequired)}
                      compact
                      buttonColor={followUpRequired ? '#FF9800' : undefined}
                      style={styles.followUpToggleButton}
                    >
                      {followUpRequired ? 'Scheduled' : 'Schedule'}
                    </Button>
                  </View>

                  {followUpRequired && (
                    <>
                      <TextInput
                        label="Follow-up Date"
                        value={followUpDate}
                        onChangeText={setFollowUpDate}
                        mode="outlined"
                        placeholder="YYYY-MM-DD"
                        style={styles.input}
                        right={<TextInput.Icon icon="calendar" />}
                        keyboardType="numeric"
                      />
                      <TextInput
                        label="Follow-up Notes / Action Items"
                        value={followUpNotes}
                        onChangeText={setFollowUpNotes}
                        mode="outlined"
                        multiline
                        numberOfLines={3}
                        style={styles.input}
                        placeholder="What needs to be checked or fixed..."
                      />
                      <Text style={styles.helperText}>
                        💡 Schedule a follow-up if issues were found that need re-inspection
                      </Text>
                    </>
                  )}
                </View>
              </View>
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleSave}>
              {editingInspection ? 'Update' : 'Create'}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        visible={showDeleteDialog}
        title="Delete Inspection"
        message="Are you sure you want to delete this inspection? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onCancel={() => {
          setShowDeleteDialog(false);
          setInspectionToDelete(null);
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
  emptyIcon: {
    alignSelf: 'center',
    marginBottom: 16,
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
  typeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  typeChip: {
    alignSelf: 'flex-start',
  },
  safetyChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#F44336',
  },
  ratingChip: {
    alignSelf: 'flex-start',
  },
  chipText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 11,
  },
  siteName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 12,
    color: '#666',
  },
  divider: {
    marginVertical: 12,
  },
  notes: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  statusRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  syncStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
  },
  syncStatusText: {
    fontSize: 12,
    fontWeight: '600',
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
  safetyFlagRow: {
    marginBottom: 16,
  },
  safetyButton: {
    marginTop: 8,
  },
  helperText: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
    fontStyle: 'italic',
  },
  checklistSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  checklistText: {
    fontSize: 12,
    color: '#666',
  },
  photosPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  photosText: {
    fontSize: 12,
    color: '#666',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    marginTop: 8,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  photoContainer: {
    position: 'relative',
    width: 100,
    height: 100,
  },
  photoThumbnail: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  removePhotoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: 'white',
    margin: 0,
  },
  addPhotoButton: {
    width: 100,
    height: 100,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fafafa',
  },
  addPhotoText: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
  },
  checklistCategory: {
    marginBottom: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
  },
  checklistItem: {
    padding: 12,
    paddingLeft: 20,
    backgroundColor: '#fafafa',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  checklistItemText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  statusButtons: {
    marginBottom: 8,
  },
  radioRow: {
    flexDirection: 'row',
    gap: 16,
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioLabel: {
    fontSize: 13,
    color: '#666',
    marginLeft: -4,
  },
  checklistNotes: {
    marginTop: 8,
    backgroundColor: 'white',
  },
  categoryCount: {
    fontSize: 12,
    color: '#666',
    marginRight: 8,
  },
  followUpBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFF3E0',
    padding: 8,
    borderRadius: 4,
    marginTop: 8,
    marginBottom: 4,
  },
  followUpText: {
    fontSize: 12,
    color: '#FF9800',
    fontWeight: 'bold',
  },
  followUpSection: {
    marginTop: 8,
  },
  followUpToggleContainer: {
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  followUpToggleButton: {
    alignSelf: 'flex-start',
  },
  notesSection: {
    marginBottom: 12,
  },
  notesSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  notesSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  checklistSummaryWithFails: {
    backgroundColor: '#FFEBEE',
    padding: 8,
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: '#F44336',
  },
  checklistTextFailed: {
    color: '#F44336',
    fontWeight: '600',
  },
  failedItemsContainer: {
    marginTop: 8,
    backgroundColor: '#FFF3E0',
    padding: 10,
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: '#FF9800',
  },
  failedItem: {
    marginBottom: 8,
  },
  failedItemText: {
    fontSize: 13,
    color: '#F44336',
    fontWeight: '600',
    marginBottom: 4,
  },
  failedItemNotes: {
    fontSize: 12,
    color: '#666',
    paddingLeft: 12,
    fontStyle: 'italic',
  },
});

export default SiteInspectionScreen;
