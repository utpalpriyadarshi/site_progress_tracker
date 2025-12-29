import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import {
  Card,
  Button,
  Text,
  Chip,
  Searchbar,
  ProgressBar,
  Switch,
} from 'react-native-paper';
import { database } from '../../models/database';
import { withObservables } from '@nozbe/watermelondb/react';
import ItemModel from '../../models/ItemModel';
import { logger } from '../services/LoggingService';
import { ErrorBoundary } from '../components/common/ErrorBoundary';

/**
 * ScheduleManagementScreen (v2.11 Phase 4)
 *
 * Planning coordinator manages project schedule and critical path.
 * Features:
 * - View all items with schedule info
 * - Filter by critical path items
 * - Mark items as critical path
 * - View dependencies and float
 */

const ScheduleManagementScreenComponent = ({
  items,
  projects,
  sites,
  categories,
}: {
  items: ItemModel[];
  projects: any[];
  sites: any[];
  categories: any[];
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedSiteId, setSelectedSiteId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCriticalPathOnly, setShowCriticalPathOnly] = useState(false);

  React.useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects]);

  const handleToggleCriticalPath = async (item: ItemModel) => {
    try {
      await database.write(async () => {
        await item.update((record: any) => {
          record.isCriticalPath = !item.isCriticalPath;
        });
      });
    } catch (error) {
      logger.error('[Schedule] Error toggling critical path', error as Error);
      Alert.alert('Error', 'Failed to update critical path status');
    }
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : 'Unknown';
  };

  const getSiteName = (siteId: string) => {
    const site = sites.find(s => s.id === siteId);
    return site ? site.name : 'Unknown';
  };

  // Filter items
  let filteredItems = items;

  // Filter by project
  const projectSiteIds = sites.filter(s => s.projectId === selectedProjectId).map(s => s.id);
  filteredItems = filteredItems.filter(item => projectSiteIds.includes(item.siteId));

  // Filter by site
  if (selectedSiteId) {
    filteredItems = filteredItems.filter(item => item.siteId === selectedSiteId);
  }

  // Filter by search query
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filteredItems = filteredItems.filter(
      item =>
        item.name.toLowerCase().includes(query) ||
        getCategoryName(item.categoryId).toLowerCase().includes(query)
    );
  }

  // Filter by critical path
  if (showCriticalPathOnly) {
    filteredItems = filteredItems.filter(item => item.isCriticalPath);
  }

  // Sort by planned start date
  filteredItems = [...filteredItems].sort((a, b) => {
    const aDate = a.plannedStartDate || 0;
    const bDate = b.plannedStartDate || 0;
    return aDate - bDate;
  });

  const criticalPathCount = filteredItems.filter(item => item.isCriticalPath).length;
  const filteredSites = sites.filter(s => s.projectId === selectedProjectId);

  return (
    <View style={styles.container}>
      {/* Header Card with Filters */}
      <Card style={styles.headerCard}>
        <Card.Content>
          {/* Project Selector */}
          <Text style={styles.label}>Project:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipContainer}>
            {projects.map(project => (
              <Chip
                key={project.id}
                mode={selectedProjectId === project.id ? 'flat' : 'outlined'}
                selected={selectedProjectId === project.id}
                onPress={() => setSelectedProjectId(project.id)}
                style={styles.chip}
              >
                {project.name}
              </Chip>
            ))}
          </ScrollView>

          {/* Site Selector */}
          <Text style={styles.label}>Site:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipContainer}>
            <Chip
              mode={selectedSiteId === '' ? 'flat' : 'outlined'}
              selected={selectedSiteId === ''}
              onPress={() => setSelectedSiteId('')}
              style={styles.chip}
            >
              All Sites
            </Chip>
            {filteredSites.map(site => (
              <Chip
                key={site.id}
                mode={selectedSiteId === site.id ? 'flat' : 'outlined'}
                selected={selectedSiteId === site.id}
                onPress={() => setSelectedSiteId(site.id)}
                style={styles.chip}
              >
                {site.name}
              </Chip>
            ))}
          </ScrollView>

          {/* Search */}
          <Searchbar
            placeholder="Search items..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchBar}
          />

          {/* Critical Path Filter */}
          <View style={styles.filterRow}>
            <View style={styles.filterLeft}>
              <Text style={styles.filterLabel}>Show Critical Path Only</Text>
              <Chip
                mode="flat"
                style={styles.criticalPathBadge}
                textStyle={styles.criticalPathBadgeText}
              >
                {criticalPathCount} Critical
              </Chip>
            </View>
            <Switch
              value={showCriticalPathOnly}
              onValueChange={setShowCriticalPathOnly}
              color="#F44336"
            />
          </View>
        </Card.Content>
      </Card>

      {/* Items List */}
      <ScrollView style={styles.scrollView}>
        {filteredItems.map(item => {
          const progress = item.completedQuantity / item.plannedQuantity;
          const isDelayed = item.plannedEndDate && Date.now() > item.plannedEndDate && progress < 1;

          return (
            <Card
              key={item.id}
              style={[styles.itemCard, item.isCriticalPath && styles.criticalPathCard]}
            >
              <Card.Content>
                <View style={styles.itemHeader}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemCategory}>{getCategoryName(item.categoryId)}</Text>
                    <Text style={styles.itemSite}>📍 {getSiteName(item.siteId)}</Text>
                  </View>

                  {/* Critical Path Badge */}
                  <View style={styles.badgeContainer}>
                    {item.isCriticalPath && (
                      <Chip
                        mode="flat"
                        style={styles.criticalBadge}
                        textStyle={styles.criticalBadgeText}
                      >
                        CRITICAL
                      </Chip>
                    )}
                    {isDelayed && (
                      <Chip mode="flat" style={styles.delayedBadge} textStyle={styles.delayedBadgeText}>
                        DELAYED
                      </Chip>
                    )}
                  </View>
                </View>

                {/* Progress */}
                <View style={styles.progressSection}>
                  <Text style={styles.progressLabel}>
                    Progress: {Math.round(progress * 100)}%
                  </Text>
                  <ProgressBar
                    progress={progress}
                    color={item.isCriticalPath ? '#F44336' : '#2196F3'}
                    style={styles.progressBar}
                  />
                </View>

                {/* Schedule Dates */}
                <View style={styles.scheduleSection}>
                  {item.plannedStartDate && (
                    <View style={styles.dateRow}>
                      <Text style={styles.dateLabel}>📅 Planned:</Text>
                      <Text style={styles.dateValue}>
                        {new Date(item.plannedStartDate).toLocaleDateString()} →{' '}
                        {item.plannedEndDate
                          ? new Date(item.plannedEndDate).toLocaleDateString()
                          : 'TBD'}
                      </Text>
                    </View>
                  )}
                  {item.actualStartDate && (
                    <View style={styles.dateRow}>
                      <Text style={styles.dateLabel}>✅ Actual:</Text>
                      <Text style={styles.dateValue}>
                        {new Date(item.actualStartDate).toLocaleDateString()} →{' '}
                        {item.actualEndDate
                          ? new Date(item.actualEndDate).toLocaleDateString()
                          : 'In Progress'}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Dependencies & Float */}
                <View style={styles.detailsSection}>
                  {item.dependencies && item.dependencies.length > 0 && (
                    <Text style={styles.detailText}>
                      🔗 Dependencies: {item.dependencies.length} item(s)
                    </Text>
                  )}
                  {item.floatDays !== undefined && (
                    <Text style={[styles.detailText, item.floatDays <= 0 && styles.criticalFloat]}>
                      ⏱️ Float: {item.floatDays} days
                      {item.floatDays <= 0 && ' (Critical!)'}
                    </Text>
                  )}
                </View>

                {/* Actions */}
                <View style={styles.actions}>
                  <Button
                    mode={item.isCriticalPath ? 'contained' : 'outlined'}
                    onPress={() => handleToggleCriticalPath(item)}
                    style={styles.actionButton}
                    buttonColor={item.isCriticalPath ? '#F44336' : undefined}
                  >
                    {item.isCriticalPath ? 'Remove from Critical Path' : 'Mark as Critical Path'}
                  </Button>
                </View>
              </Card.Content>
            </Card>
          );
        })}

        {filteredItems.length === 0 && (
          <Card style={styles.emptyCard}>
            <Card.Content>
              <Text style={styles.emptyText}>
                {showCriticalPathOnly
                  ? 'No critical path items found'
                  : 'No items found for selected filters'}
              </Text>
            </Card.Content>
          </Card>
        )}
      </ScrollView>
    </View>
  );
};

const enhance = withObservables([], () => ({
  items: database.collections.get('items').query(),
  projects: database.collections.get('projects').query(),
  sites: database.collections.get('sites').query(),
  categories: database.collections.get('categories').query(),
}));

const ScheduleManagementScreen = enhance(ScheduleManagementScreenComponent as any);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  headerCard: {
    margin: 16,
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 8,
  },
  chipContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  chip: {
    marginRight: 8,
  },
  searchBar: {
    marginTop: 12,
    marginBottom: 12,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  filterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 8,
  },
  criticalPathBadge: {
    backgroundColor: '#FFEBEE',
  },
  criticalPathBadgeText: {
    color: '#F44336',
    fontSize: 10,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  itemCard: {
    margin: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  criticalPathCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  itemCategory: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  itemSite: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  badgeContainer: {
    marginLeft: 8,
  },
  criticalBadge: {
    backgroundColor: '#F44336',
    marginBottom: 4,
  },
  criticalBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  delayedBadge: {
    backgroundColor: '#FF9800',
  },
  delayedBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  progressSection: {
    marginBottom: 12,
  },
  progressLabel: {
    fontSize: 14,
    marginBottom: 4,
    color: '#333',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  scheduleSection: {
    marginBottom: 12,
    padding: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 4,
  },
  dateRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  dateLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    width: 80,
    color: '#666',
  },
  dateValue: {
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
  detailsSection: {
    marginBottom: 12,
    padding: 8,
    backgroundColor: '#E3F2FD',
    borderRadius: 4,
  },
  detailText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  criticalFloat: {
    color: '#F44336',
    fontWeight: 'bold',
  },
  actions: {
    marginTop: 8,
  },
  actionButton: {
    width: '100%',
  },
  emptyCard: {
    margin: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
  },
});

// Wrap with ErrorBoundary for graceful error handling
const ScheduleManagementScreenWithBoundary = () => (
  <ErrorBoundary name="ScheduleManagementScreen">
    <ScheduleManagementScreen />
  </ErrorBoundary>
);

export default ScheduleManagementScreenWithBoundary;
