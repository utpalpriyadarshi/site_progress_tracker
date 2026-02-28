/**
 * TimelineView Component
 *
 * Timeline view for schedule items showing items in chronological order
 * with progress bars and schedule details.
 *
 * @version 2.0.0
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
  IconButton,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { database } from '../../../../models/database';
import { logger } from '../../../services/LoggingService';
import { StatusBadge } from '../../components/StatusBadge';
import { EmptyState } from '../../../components/common/EmptyState';
import type { ScheduleItem, ScheduleFilters } from '../UnifiedSchedule';
import { COLORS } from '../../../theme/colors';

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
    return new Date(timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  const renderItem = ({ item }: { item: ScheduleItem }) => (
    <Card
      style={[styles.itemCard, item.isCriticalPath && styles.criticalPathCard]}
      accessible
      accessibilityLabel={`${item.name}, ${Math.round(item.progress * 100)}% complete, ${item.status}`}
    >
      <Card.Content>
        {/* Header: name + flag toggle */}
        <View style={styles.itemHeader}>
          <View style={styles.itemInfo}>
            <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
            <Text style={styles.itemMeta}>{item.categoryName} · {item.siteName}</Text>
            {item.assigneeName && (
              <View style={styles.assigneeRow}>
                <Icon
                  name={item.assigneeRole === 'designer' ? 'account-edit' : 'account-hard-hat'}
                  size={12}
                  color="#5C6BC0"
                />
                <Text style={styles.assigneeText}>{item.assigneeName}</Text>
              </View>
            )}
          </View>

          <View style={styles.headerRight}>
            {item.isDelayed && !item.isCriticalPath && (
              <StatusBadge status="delayed" size="small" />
            )}
            <IconButton
              icon="flag-variant"
              iconColor={item.isCriticalPath ? COLORS.ERROR : '#BDBDBD'}
              size={20}
              onPress={() => handleToggleCriticalPath(item.id, item.isCriticalPath)}
              accessible
              accessibilityRole="button"
              accessibilityLabel={
                item.isCriticalPath ? 'Remove from critical path' : 'Mark as critical path'
              }
              style={styles.flagButton}
            />
            <Text style={[
              styles.progressPct,
              { color: item.isCriticalPath ? COLORS.ERROR : COLORS.INFO },
            ]}>
              {Math.round(item.progress * 100)}%
            </Text>
          </View>
        </View>

        {/* Progress bar — full width, no inline label */}
        <View style={styles.progressRow}>
          <ProgressBar
            progress={item.progress}
            color={item.isCriticalPath ? COLORS.ERROR : COLORS.INFO}
            style={styles.progressBar}
          />
        </View>

        {/* Dates — only shown when at least one date is set */}
        {(item.plannedStartDate || item.plannedEndDate || item.actualStartDate) ? (
          <View style={styles.datesBlock}>
            {(item.plannedStartDate || item.plannedEndDate) && (
              <Text style={styles.dateText}>
                Planned: {formatDate(item.plannedStartDate)} → {formatDate(item.plannedEndDate)}
              </Text>
            )}
            {item.actualStartDate && (
              <Text style={styles.dateText}>
                Actual: {formatDate(item.actualStartDate)} →{' '}
                {item.actualEndDate ? formatDate(item.actualEndDate) : 'ongoing'}
              </Text>
            )}
          </View>
        ) : null}

        {/* Float / dependencies — single compact line */}
        {(item.floatDays !== undefined || (item.dependencies && item.dependencies.length > 0)) && (
          <Text style={[styles.floatText, item.floatDays !== undefined && item.floatDays <= 0 && styles.floatCritical]}>
            {item.floatDays !== undefined
              ? `Float: ${item.floatDays}d${item.floatDays <= 0 ? ' ⚠' : ''}`
              : ''}
            {item.dependencies && item.dependencies.length > 0
              ? `${item.floatDays !== undefined ? '  ·  ' : ''}${item.dependencies.length} dep(s)`
              : ''}
          </Text>
        )}
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
        onAction={() => navigation.navigate('CreateItem')}
      />
    );
  };

  return (
    <View style={styles.container}>
      {/* Filter Card */}
      <Card style={styles.headerCard}>
        <Card.Content>
          {/* Project */}
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

          {/* Site */}
          <Text style={styles.label}>Site:</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.chipContainer}
          >
            <Chip
              mode={filters.siteId === '' ? 'flat' : 'outlined'}
              selected={filters.siteId === ''}
              onPress={() => onSiteChange('')}
              style={styles.chip}
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
          />

          {/* Critical Path toggle */}
          <View style={styles.filterRow}>
            <View style={styles.filterLeft}>
              <Text style={styles.filterLabel}>Critical path only</Text>
              <Chip
                mode="flat"
                style={styles.criticalBadge}
                textStyle={styles.criticalBadgeText}
              >
                {criticalPathCount}
              </Chip>
            </View>
            <Switch
              value={filters.showCriticalPathOnly}
              onValueChange={onCriticalPathToggle}
              color={COLORS.ERROR}
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
    margin: 12,
    marginBottom: 6,
  },
  projectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  projectLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginRight: 8,
    color: '#555',
  },
  projectChip: {
    backgroundColor: COLORS.INFO_BG,
  },
  projectChipText: {
    color: '#1976D2',
    fontWeight: '600',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 6,
    color: '#555',
  },
  chipContainer: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  chip: {
    marginRight: 8,
  },
  searchBar: {
    marginTop: 8,
    marginBottom: 8,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterLabel: {
    fontSize: 13,
    color: '#555',
  },
  criticalBadge: {
    backgroundColor: COLORS.ERROR_BG,
  },
  criticalBadgeText: {
    color: COLORS.ERROR,
    fontSize: 11,
    fontWeight: '700',
  },
  listContent: {
    paddingBottom: 16,
  },
  // Item card
  itemCard: {
    marginHorizontal: 12,
    marginVertical: 5,
    borderRadius: 10,
  },
  criticalPathCard: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.ERROR,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  itemInfo: {
    flex: 1,
    paddingRight: 4,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  itemMeta: {
    fontSize: 12,
    color: '#777',
    marginTop: 2,
  },
  assigneeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
    gap: 4,
  },
  assigneeText: {
    fontSize: 12,
    color: '#5C6BC0',
    fontWeight: '500',
  },
  headerRight: {
    flexDirection: 'column',
    alignItems: 'center',
    minWidth: 44,
  },
  flagButton: {
    margin: 0,
  },
  // Progress
  progressRow: {
    marginBottom: 8,
  },
  progressPct: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 2,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
  // Dates
  datesBlock: {
    marginBottom: 4,
  },
  dateText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
  // Float/deps
  floatText: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
  },
  floatCritical: {
    color: COLORS.ERROR,
    fontWeight: '600',
  },
});

export default TimelineView;
