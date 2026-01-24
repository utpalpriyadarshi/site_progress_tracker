/**
 * TimelineView Component
 *
 * Timeline view for schedule items showing items in chronological order
 * with progress bars and schedule details.
 *
 * @version 1.0.0
 * @since Planning Phase 3
 */

import React from 'react';
import { View, StyleSheet, ScrollView, FlatList, Alert } from 'react-native';
import {
  Card,
  Text,
  Chip,
  Searchbar,
  ProgressBar,
  Switch,
  Button,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { database } from '../../../../models/database';
import { logger } from '../../../services/LoggingService';
import { StatusBadge } from '../../components/StatusBadge';
import { EmptyState } from '../../../components/common/EmptyState';
import type { ScheduleItem, ScheduleFilters } from '../UnifiedSchedule';

// ==================== Types ====================

interface TimelineViewProps {
  items: ScheduleItem[];
  filters: ScheduleFilters;
  projects: any[];
  sites: any[];
  onProjectChange: (projectId: string) => void;
  onSiteChange: (siteId: string) => void;
  onSearchChange: (query: string) => void;
  onCriticalPathToggle: () => void;
  onClearSearch: () => void;
}

// ==================== Component ====================

export const TimelineView: React.FC<TimelineViewProps> = ({
  items,
  filters,
  projects,
  sites,
  onProjectChange,
  onSiteChange,
  onSearchChange,
  onCriticalPathToggle,
  onClearSearch,
}) => {
  const navigation = useNavigation<any>();
  const criticalPathCount = items.filter((item) => item.isCriticalPath).length;

  const handleToggleCriticalPath = async (itemId: string, currentValue: boolean) => {
    try {
      await database.write(async () => {
        const item = await database.collections.get('items').find(itemId);
        await item.update((record: any) => {
          record.isCriticalPath = !currentValue;
        });
      });
    } catch (error) {
      logger.error('[Timeline] Error toggling critical path', error as Error);
      Alert.alert('Error', 'Failed to update critical path status');
    }
  };

  const formatDate = (timestamp: number | null): string => {
    if (!timestamp) return 'TBD';
    return new Date(timestamp).toLocaleDateString();
  };

  const renderItem = ({ item }: { item: ScheduleItem }) => (
    <Card
      style={[styles.itemCard, item.isCriticalPath && styles.criticalPathCard]}
      accessible
      accessibilityRole="button"
      accessibilityLabel={`${item.name}, ${item.categoryName}, ${Math.round(item.progress * 100)}% complete, ${item.status}`}
    >
      <Card.Content>
        <View style={styles.itemHeader}>
          <View style={styles.itemInfo}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemCategory}>{item.categoryName}</Text>
            <Text style={styles.itemSite}>📍 {item.siteName}</Text>
          </View>

          <View style={styles.badgeContainer}>
            {item.isCriticalPath && (
              <StatusBadge status="critical" size="small" />
            )}
            {item.isDelayed && !item.isCriticalPath && (
              <StatusBadge status="delayed" size="small" />
            )}
          </View>
        </View>

        {/* Progress */}
        <View style={styles.progressSection}>
          <Text style={styles.progressLabel}>
            Progress: {Math.round(item.progress * 100)}%
          </Text>
          <ProgressBar
            progress={item.progress}
            color={item.isCriticalPath ? '#F44336' : '#2196F3'}
            style={styles.progressBar}
          />
        </View>

        {/* Schedule Dates */}
        <View style={styles.scheduleSection}>
          <View style={styles.dateRow}>
            <Text style={styles.dateLabel}>📅 Planned:</Text>
            <Text style={styles.dateValue}>
              {formatDate(item.plannedStartDate)} → {formatDate(item.plannedEndDate)}
            </Text>
          </View>
          {item.actualStartDate && (
            <View style={styles.dateRow}>
              <Text style={styles.dateLabel}>✅ Actual:</Text>
              <Text style={styles.dateValue}>
                {formatDate(item.actualStartDate)} →{' '}
                {item.actualEndDate ? formatDate(item.actualEndDate) : 'In Progress'}
              </Text>
            </View>
          )}
        </View>

        {/* Dependencies & Float */}
        {(item.dependencies?.length || item.floatDays !== undefined) && (
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
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            mode={item.isCriticalPath ? 'contained' : 'outlined'}
            onPress={() => handleToggleCriticalPath(item.id, item.isCriticalPath)}
            style={styles.actionButton}
            buttonColor={item.isCriticalPath ? '#F44336' : undefined}
            compact
            accessible
            accessibilityLabel={
              item.isCriticalPath
                ? 'Remove from critical path'
                : 'Mark as critical path'
            }
          >
            {item.isCriticalPath ? 'Remove Critical' : 'Mark Critical'}
          </Button>
        </View>
      </Card.Content>
    </Card>
  );

  const renderEmpty = () => {
    if (filters.searchQuery) {
      return (
        <EmptyState
          icon="magnify"
          title="No Items Found"
          message={`No schedule items match "${filters.searchQuery}"`}
          actionText="Clear Search"
          onAction={onClearSearch}
        />
      );
    }

    if (filters.showCriticalPathOnly) {
      return (
        <EmptyState
          icon="road-variant"
          title="No Critical Path Items"
          message="No items are marked as critical path for this project"
          actionText="Show All Items"
          onAction={onCriticalPathToggle}
        />
      );
    }

    return (
      <EmptyState
        icon="calendar-blank"
        title="No Schedule Items"
        message="Start planning by creating your first schedule item"
        actionText="Create Schedule Item"
        onAction={() => {
          navigation.navigate('CreateItem');
        }}
      />
    );
  };

  return (
    <View style={styles.container}>
      {/* Header Card with Filters */}
      <Card style={styles.headerCard}>
        <Card.Content>
          {/* Project Display (read-only - assigned by Admin) */}
          <View style={styles.projectHeader}>
            <Text style={styles.projectLabel}>Project:</Text>
            <Chip
              mode="flat"
              selected
              icon="folder-outline"
              style={styles.projectChip}
              textStyle={styles.projectChipText}
            >
              {projects.find((p) => p.id === filters.projectId)?.name || 'No Project Assigned'}
            </Chip>
          </View>

          {/* Site Selector */}
          <Text style={styles.label}>Site:</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.chipContainer}
            accessible
            accessibilityRole="menubar"
            accessibilityLabel="Site selector"
          >
            <Chip
              mode={filters.siteId === '' ? 'flat' : 'outlined'}
              selected={filters.siteId === ''}
              onPress={() => onSiteChange('')}
              style={styles.chip}
              accessible
              accessibilityRole="menuitem"
              accessibilityState={{ selected: filters.siteId === '' }}
            >
              All Sites
            </Chip>
            {sites.map((site) => (
              <Chip
                key={site.id}
                mode={filters.siteId === site.id ? 'flat' : 'outlined'}
                selected={filters.siteId === site.id}
                onPress={() => onSiteChange(site.id)}
                style={styles.chip}
                accessible
                accessibilityRole="menuitem"
                accessibilityState={{ selected: filters.siteId === site.id }}
              >
                {site.name}
              </Chip>
            ))}
          </ScrollView>

          {/* Search */}
          <Searchbar
            placeholder="Search items..."
            onChangeText={onSearchChange}
            value={filters.searchQuery}
            style={styles.searchBar}
            accessible
            accessibilityLabel="Search schedule items"
            accessibilityHint="Type to filter items by name or category"
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
              value={filters.showCriticalPathOnly}
              onValueChange={onCriticalPathToggle}
              color="#F44336"
              accessible
              accessibilityLabel="Toggle critical path filter"
              accessibilityState={{ checked: filters.showCriticalPathOnly }}
            />
          </View>
        </Card.Content>
      </Card>

      {/* Items List */}
      {items.length === 0 ? (
        renderEmpty()
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          accessible
          accessibilityLabel={`Schedule items, ${items.length} items`}
        />
      )}
    </View>
  );
};

// ==================== Styles ====================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  headerCard: {
    margin: 16,
    marginBottom: 8,
  },
  projectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  projectLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 8,
  },
  projectChip: {
    backgroundColor: '#E3F2FD',
  },
  projectChipText: {
    color: '#1976D2',
    fontWeight: '600',
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
  listContent: {
    paddingBottom: 16,
  },
  itemCard: {
    marginHorizontal: 16,
    marginVertical: 8,
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
    minWidth: 80,
    alignItems: 'flex-end',
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
});

export default TimelineView;
