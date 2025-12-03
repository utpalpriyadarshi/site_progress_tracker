import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { FAB, Card, Searchbar, Chip, Menu, Portal, Dialog, Button, TextInput } from 'react-native-paper';
import { database } from '../../models/database';
import { useDesignEngineerContext } from './context/DesignEngineerContext';
import { Q } from '@nozbe/watermelondb';

/**
 * DoorsPackageManagementScreen (v2.11)
 *
 * Design Engineer manages DOORS packages (100 requirements per equipment/material).
 *
 * Features:
 * - View all DOORS packages for engineer's project
 * - Filter by site, status, category
 * - Create new DOORS package
 * - Mark as received/reviewed
 * - View requirements count (100 per package)
 * - Link to Design RFQs
 */

interface DoorsPackage {
  id: string;
  doorsId: string;
  projectId: string;
  siteId?: string;
  siteName?: string;
  equipmentType: string;
  materialType?: string;
  category: string;
  totalRequirements: number;
  receivedDate?: number;
  reviewedDate?: number;
  status: string;
  engineerId: string;
  createdAt: Date;
}

const DoorsPackageManagementScreen = () => {
  const { projectId, projectName, refreshTrigger } = useDesignEngineerContext();
  const [packages, setPackages] = useState<DoorsPackage[]>([]);
  const [filteredPackages, setFilteredPackages] = useState<DoorsPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [sites, setSites] = useState<Array<{ id: string; name: string }>>([]);

  // Create dialog state
  const [newDoorsId, setNewDoorsId] = useState('');
  const [newSiteId, setNewSiteId] = useState('');
  const [newEquipmentType, setNewEquipmentType] = useState('');
  const [newMaterialType, setNewMaterialType] = useState('');
  const [newCategory, setNewCategory] = useState('equipment');

  useEffect(() => {
    loadPackages();
    loadSites();
  }, [projectId, refreshTrigger]);

  useEffect(() => {
    applyFilters();
  }, [packages, searchQuery, filterStatus, filterCategory]);

  const loadSites = async () => {
    if (!projectId) return;

    try {
      const sitesCollection = database.collections.get('sites');
      const sitesData = await sitesCollection
        .query(Q.where('project_id', projectId))
        .fetch();

      const sitesList = sitesData.map((site: any) => ({
        id: site.id,
        name: site.name,
      }));

      setSites(sitesList);
    } catch (error) {
      console.error('[DoorsPackage] Error loading sites:', error);
    }
  };

  const loadPackages = async () => {
    if (!projectId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('[DoorsPackage] Loading packages for project:', projectId);

      const doorsCollection = database.collections.get('doors_packages');
      const packagesData = await doorsCollection
        .query(Q.where('project_id', projectId))
        .fetch();

      // Fetch site names for each package
      const packagesWithSites = await Promise.all(
        packagesData.map(async (pkg: any) => {
          let siteName = '';
          if (pkg.siteId) {
            try {
              const site = await database.collections.get('sites').find(pkg.siteId);
              siteName = (site as any).name;
            } catch (error) {
              console.error('[DoorsPackage] Site not found:', pkg.siteId);
            }
          }

          return {
            id: pkg.id,
            doorsId: pkg.doorsId,
            projectId: pkg.projectId,
            siteId: pkg.siteId,
            siteName,
            equipmentType: pkg.equipmentType,
            materialType: pkg.materialType,
            category: pkg.category,
            totalRequirements: pkg.totalRequirements,
            receivedDate: pkg.receivedDate,
            reviewedDate: pkg.reviewedDate,
            status: pkg.status,
            engineerId: pkg.engineerId,
            createdAt: pkg.createdAt,
          };
        })
      );

      console.log('[DoorsPackage] Loaded packages:', packagesWithSites.length);
      setPackages(packagesWithSites);
    } catch (error) {
      console.error('[DoorsPackage] Error loading packages:', error);
      Alert.alert('Error', 'Failed to load DOORS packages');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...packages];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (pkg) =>
          pkg.doorsId.toLowerCase().includes(query) ||
          pkg.equipmentType.toLowerCase().includes(query) ||
          (pkg.materialType && pkg.materialType.toLowerCase().includes(query)) ||
          (pkg.siteName && pkg.siteName.toLowerCase().includes(query))
      );
    }

    // Status filter
    if (filterStatus) {
      filtered = filtered.filter((pkg) => pkg.status === filterStatus);
    }

    // Category filter
    if (filterCategory) {
      filtered = filtered.filter((pkg) => pkg.category === filterCategory);
    }

    setFilteredPackages(filtered);
  };

  const handleCreatePackage = async () => {
    if (!newDoorsId || !newEquipmentType || !newSiteId) {
      Alert.alert('Validation Error', 'Please fill in all required fields');
      return;
    }

    try {
      const doorsCollection = database.collections.get('doors_packages');

      await database.write(async () => {
        await doorsCollection.create((record: any) => {
          record.doorsId = newDoorsId;
          record.projectId = projectId;
          record.siteId = newSiteId;
          record.equipmentType = newEquipmentType;
          record.materialType = newMaterialType || null;
          record.category = newCategory;
          record.totalRequirements = 100; // Standard 100 requirements
          record.status = 'pending';
          record.engineerId = ''; // Will be set from context
          record.appSyncStatus = 'pending';
          record.version = 1;
        });
      });

      Alert.alert('Success', 'DOORS package created successfully');
      setShowCreateDialog(false);
      resetCreateDialog();
      loadPackages();
    } catch (error) {
      console.error('[DoorsPackage] Error creating package:', error);
      Alert.alert('Error', 'Failed to create DOORS package');
    }
  };

  const resetCreateDialog = () => {
    setNewDoorsId('');
    setNewSiteId('');
    setNewEquipmentType('');
    setNewMaterialType('');
    setNewCategory('equipment');
  };

  const handleMarkAsReceived = async (packageId: string) => {
    try {
      const doorsCollection = database.collections.get('doors_packages');
      const packageRecord = await doorsCollection.find(packageId);

      await database.write(async () => {
        await packageRecord.update((record: any) => {
          record.receivedDate = Date.now();
          record.status = 'received';
        });
      });

      Alert.alert('Success', 'Package marked as received');
      loadPackages();
    } catch (error) {
      console.error('[DoorsPackage] Error marking as received:', error);
      Alert.alert('Error', 'Failed to update package');
    }
  };

  const handleMarkAsReviewed = async (packageId: string) => {
    try {
      const doorsCollection = database.collections.get('doors_packages');
      const packageRecord = await doorsCollection.find(packageId);

      await database.write(async () => {
        await packageRecord.update((record: any) => {
          record.reviewedDate = Date.now();
          record.status = 'reviewed';
        });
      });

      Alert.alert('Success', 'Package marked as reviewed');
      loadPackages();
    } catch (error) {
      console.error('[DoorsPackage] Error marking as reviewed:', error);
      Alert.alert('Error', 'Failed to update package');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#FFA500';
      case 'received':
        return '#2196F3';
      case 'reviewed':
        return '#4CAF50';
      default:
        return '#9E9E9E';
    }
  };

  const renderPackageCard = ({ item }: { item: DoorsPackage }) => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <Text style={styles.doorsId}>{item.doorsId}</Text>
          <Chip
            mode="flat"
            style={[styles.statusChip, { backgroundColor: getStatusColor(item.status) }]}
            textStyle={styles.statusChipText}
          >
            {item.status.toUpperCase()}
          </Chip>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.label}>Site:</Text>
          <Text style={styles.value}>{item.siteName || 'N/A'}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.label}>Category:</Text>
          <Text style={styles.value}>{item.category}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.label}>Equipment:</Text>
          <Text style={styles.value}>{item.equipmentType}</Text>
        </View>

        {item.materialType && (
          <View style={styles.detailRow}>
            <Text style={styles.label}>Material:</Text>
            <Text style={styles.value}>{item.materialType}</Text>
          </View>
        )}

        <View style={styles.detailRow}>
          <Text style={styles.label}>Requirements:</Text>
          <Text style={styles.value}>{item.totalRequirements}</Text>
        </View>

        {item.receivedDate && (
          <View style={styles.detailRow}>
            <Text style={styles.label}>Received:</Text>
            <Text style={styles.value}>{new Date(item.receivedDate).toLocaleDateString()}</Text>
          </View>
        )}

        {item.reviewedDate && (
          <View style={styles.detailRow}>
            <Text style={styles.label}>Reviewed:</Text>
            <Text style={styles.value}>{new Date(item.reviewedDate).toLocaleDateString()}</Text>
          </View>
        )}

        <View style={styles.actionButtons}>
          {item.status === 'pending' && (
            <Button mode="contained" onPress={() => handleMarkAsReceived(item.id)} style={styles.actionButton}>
              Mark Received
            </Button>
          )}
          {item.status === 'received' && (
            <Button mode="contained" onPress={() => handleMarkAsReviewed(item.id)} style={styles.actionButton}>
              Mark Reviewed
            </Button>
          )}
        </View>
      </Card.Content>
    </Card>
  );

  if (!projectId) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>No project assigned</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.projectName}>{projectName}</Text>
        <Searchbar
          placeholder="Search DOORS packages..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />
        <View style={styles.filterRow}>
          <Chip
            mode={filterStatus ? 'flat' : 'outlined'}
            selected={filterStatus !== null}
            onPress={() => setShowFilterMenu(true)}
            style={styles.filterChip}
          >
            {filterStatus ? `Status: ${filterStatus}` : 'Filter'}
          </Chip>
          {filterStatus && (
            <Chip
              mode="outlined"
              onPress={() => setFilterStatus(null)}
              closeIcon="close"
              onClose={() => setFilterStatus(null)}
              style={styles.filterChip}
            >
              Clear
            </Chip>
          )}
        </View>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <FlatList
          data={filteredPackages}
          renderItem={renderPackageCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No DOORS packages found</Text>
            </View>
          }
        />
      )}

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => setShowCreateDialog(true)}
        label="New Package"
      />

      {/* Filter Menu */}
      <Portal>
        <Menu
          visible={showFilterMenu}
          onDismiss={() => setShowFilterMenu(false)}
          anchor={{ x: 0, y: 0 }}
        >
          <Menu.Item onPress={() => { setFilterStatus('pending'); setShowFilterMenu(false); }} title="Pending" />
          <Menu.Item onPress={() => { setFilterStatus('received'); setShowFilterMenu(false); }} title="Received" />
          <Menu.Item onPress={() => { setFilterStatus('reviewed'); setShowFilterMenu(false); }} title="Reviewed" />
        </Menu>
      </Portal>

      {/* Create Dialog */}
      <Portal>
        <Dialog visible={showCreateDialog} onDismiss={() => setShowCreateDialog(false)}>
          <Dialog.Title>Create DOORS Package</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="DOORS ID *"
              value={newDoorsId}
              onChangeText={setNewDoorsId}
              style={styles.input}
              mode="outlined"
            />
            <Menu
              visible={false}
              onDismiss={() => {}}
              anchor={
                <TouchableOpacity
                  onPress={() => {}}
                  style={styles.pickerButton}
                >
                  <Text style={styles.pickerLabel}>Site *</Text>
                  <Text style={styles.pickerValue}>
                    {sites.find((s) => s.id === newSiteId)?.name || 'Select Site'}
                  </Text>
                </TouchableOpacity>
              }
            >
              {sites.map((site) => (
                <Menu.Item
                  key={site.id}
                  onPress={() => setNewSiteId(site.id)}
                  title={site.name}
                />
              ))}
            </Menu>
            <TextInput
              label="Equipment Type *"
              value={newEquipmentType}
              onChangeText={setNewEquipmentType}
              style={styles.input}
              mode="outlined"
            />
            <TextInput
              label="Material Type (Optional)"
              value={newMaterialType}
              onChangeText={setNewMaterialType}
              style={styles.input}
              mode="outlined"
            />
            <Text style={styles.infoText}>Standard: 100 requirements per package</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => { setShowCreateDialog(false); resetCreateDialog(); }}>Cancel</Button>
            <Button onPress={handleCreatePackage}>Create</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#FFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  projectName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  searchbar: {
    marginBottom: 12,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    marginRight: 8,
  },
  listContainer: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  doorsId: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statusChip: {
    height: 28,
  },
  statusChipText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: '#666',
    width: 100,
    fontWeight: '600',
  },
  value: {
    fontSize: 14,
    color: '#000',
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    gap: 8,
  },
  actionButton: {
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  errorText: {
    fontSize: 16,
    color: '#F44336',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#007AFF',
  },
  input: {
    marginBottom: 12,
  },
  pickerButton: {
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 4,
    padding: 12,
    marginBottom: 12,
  },
  pickerLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  pickerValue: {
    fontSize: 16,
    color: '#000',
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 8,
  },
});

export default DoorsPackageManagementScreen;
