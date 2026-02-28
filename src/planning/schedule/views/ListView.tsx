/**
 * ListView Component
 *
 * Flat list view for schedule items with sorting and filtering options.
 *
 * @version 1.0.0
 * @since Planning Phase 3
 */

import React, { useState, useMemo, useCallback } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Text, Card, Searchbar, Chip, useTheme, Menu, Button } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { StatusBadge } from '../../components/StatusBadge';
import { EmptyState } from '../../../components/common/EmptyState';
import { useAccessibility } from '../../../utils/accessibility';
import type { ScheduleItem, ScheduleFilters } from '../UnifiedSchedule';
import { COLORS } from '../../../theme/colors';

// ==================== Types ====================

interface ListViewProps {
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

type SortOption = 'name' | 'date' | 'progress' | 'status';
type SortDirection = 'asc' | 'desc';

// ==================== Component ====================

export const ListView: React.FC<ListViewProps> = ({
  items,
  filters,
  onSearchChange,
  onCriticalPathToggle,
  onClearSearch,
}) => {
  const theme = useTheme();
  const { announce } = useAccessibility();

  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [sortMenuVisible, setSortMenuVisible] = useState(false);

  // Status filter
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  // Sort items
  const sortedItems = useMemo(() => {
    let filtered = [...items];

    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter((item) => item.status === statusFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'date':
          comparison = (a.plannedStartDate || 0) - (b.plannedStartDate || 0);
          break;
        case 'progress':
          comparison = a.progress - b.progress;
          break;
        case 'status':
          const statusOrder = { completed: 0, in_progress: 1, planned: 2, delayed: 3 };
          comparison = (statusOrder[a.status as keyof typeof statusOrder] || 4) -
                       (statusOrder[b.status as keyof typeof statusOrder] || 4);
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [items, sortBy, sortDirection, statusFilter]);

  const handleSort = useCallback((option: SortOption) => {
    if (sortBy === option) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(option);
      setSortDirection('asc');
    }
    setSortMenuVisible(false);
    announce(`Sorted by ${option}, ${sortDirection === 'asc' ? 'ascending' : 'descending'}`);
  }, [sortBy, sortDirection, announce]);

  const handleStatusFilter = useCallback((status: string | null) => {
    setStatusFilter(status);
    if (status) {
      announce(`Filtered by ${status} status`);
    } else {
      announce('Showing all statuses');
    }
  }, [announce]);

  const formatDate = (timestamp: number | null): string => {
    if (!timestamp) return 'TBD';
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  // Status counts for quick filters
  const statusCounts = useMemo(() => {
    return {
      completed: items.filter((i) => i.status === 'completed').length,
      in_progress: items.filter((i) => i.status === 'in_progress').length,
      planned: items.filter((i) => i.status === 'planned').length,
      delayed: items.filter((i) => i.status === 'delayed').length,
    };
  }, [items]);

  const renderItem = ({ item }: { item: ScheduleItem }) => (
    <Card
      style={styles.itemCard}
      accessible
      accessibilityRole="button"
      accessibilityLabel={`${item.name}, ${item.status}, ${Math.round(item.progress * 100)}% complete`}
    >
      <View style={styles.itemRow}>
        {/* Status Column */}
        <View style={styles.statusColumn}>
          <StatusBadge status={item.status} size="small" />
        </View>

        {/* Main Content */}
        <View style={styles.mainContent}>
          <Text style={styles.itemName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.itemMeta}>
            {item.categoryName} • {item.siteName}
          </Text>
          {item.assigneeName && (
            <View style={styles.assigneeRow}>
              <Icon
                name={item.assigneeRole === 'designer' ? 'account-edit' : 'account-hard-hat'}
                size={11}
                color="#5C6BC0"
              />
              <Text style={styles.assigneeText}>{item.assigneeName}</Text>
            </View>
          )}
        </View>

        {/* Date Column */}
        <View style={styles.dateColumn}>
          {item.plannedStartDate ? (
            <>
              <Text style={styles.dateText}>{formatDate(item.plannedStartDate)}</Text>
              {item.plannedEndDate && (
                <Text style={styles.dateEndText}>{formatDate(item.plannedEndDate)}</Text>
              )}
            </>
          ) : (
            <Text style={styles.dateText}>TBD</Text>
          )}
        </View>

        {/* Progress Column */}
        <View style={styles.progressColumn}>
          <Text
            style={[
              styles.progressText,
              item.progress >= 1 && styles.completedProgress,
              item.isDelayed && styles.delayedProgress,
            ]}
          >
            {Math.round(item.progress * 100)}%
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.min(item.progress * 100, 100)}%` },
                item.isCriticalPath && styles.criticalProgressFill,
              ]}
            />
          </View>
        </View>

        {/* Critical Path Indicator */}
        {item.isCriticalPath && (
          <View style={styles.criticalIndicator}>
            <Icon name="flag-variant" size={14} color={COLORS.ERROR} />
          </View>
        )}
      </View>
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

    if (statusFilter) {
      return (
        <EmptyState
          icon="filter-off"
          title="No Items"
          message={`No ${statusFilter.replace('_', ' ')} items found`}
          actionText="Clear Filter"
          onAction={() => handleStatusFilter(null)}
        />
      );
    }

    return (
      <EmptyState
        icon="format-list-bulleted"
        title="No Schedule Items"
        message="Start planning by creating your first schedule item"
      />
    );
  };

  const getSortLabel = (): string => {
    const labels: Record<SortOption, string> = {
      name: 'Name',
      date: 'Date',
      progress: 'Progress',
      status: 'Status',
    };
    return labels[sortBy];
  };

  return (
    <View style={styles.container}>
      {/* Search and Sort Header */}
      <View style={styles.header}>
        <Searchbar
          placeholder="Search items..."
          onChangeText={onSearchChange}
          value={filters.searchQuery}
          style={styles.searchBar}
          accessible
          accessibilityLabel="Search schedule items"
        />

        <View style={styles.controlsRow}>
          {/* Sort Menu */}
          <Menu
            visible={sortMenuVisible}
            onDismiss={() => setSortMenuVisible(false)}
            anchor={
              <Button
                mode="outlined"
                onPress={() => setSortMenuVisible(true)}
                compact
                style={styles.sortButton}
                icon={sortDirection === 'asc' ? 'sort-ascending' : 'sort-descending'}
              >
                {getSortLabel()}
              </Button>
            }
          >
            <Menu.Item onPress={() => handleSort('name')} title="Name" />
            <Menu.Item onPress={() => handleSort('date')} title="Date" />
            <Menu.Item onPress={() => handleSort('progress')} title="Progress" />
            <Menu.Item onPress={() => handleSort('status')} title="Status" />
          </Menu>

          {/* Critical Path Toggle */}
          <Chip
            mode={filters.showCriticalPathOnly ? 'flat' : 'outlined'}
            selected={filters.showCriticalPathOnly}
            onPress={onCriticalPathToggle}
            style={styles.filterChip}
            textStyle={filters.showCriticalPathOnly ? { color: 'white' } : undefined}
            selectedColor={filters.showCriticalPathOnly ? COLORS.ERROR : undefined}
          >
            Critical Only
          </Chip>
        </View>

        {/* Status Filter Chips */}
        <View style={styles.statusFilters}>
          <Chip
            mode={statusFilter === null ? 'flat' : 'outlined'}
            selected={statusFilter === null}
            onPress={() => handleStatusFilter(null)}
            style={styles.statusChip}
            compact
          >
            All ({items.length})
          </Chip>
          <Chip
            mode={statusFilter === 'in_progress' ? 'flat' : 'outlined'}
            selected={statusFilter === 'in_progress'}
            onPress={() => handleStatusFilter('in_progress')}
            style={styles.statusChip}
            compact
          >
            In Progress ({statusCounts.in_progress})
          </Chip>
          <Chip
            mode={statusFilter === 'completed' ? 'flat' : 'outlined'}
            selected={statusFilter === 'completed'}
            onPress={() => handleStatusFilter('completed')}
            style={styles.statusChip}
            compact
          >
            Completed ({statusCounts.completed})
          </Chip>
          <Chip
            mode={statusFilter === 'delayed' ? 'flat' : 'outlined'}
            selected={statusFilter === 'delayed'}
            onPress={() => handleStatusFilter('delayed')}
            style={styles.statusChip}
            compact
          >
            Delayed ({statusCounts.delayed})
          </Chip>
        </View>
      </View>

      {/* Table Header */}
      <View style={styles.tableHeader}>
        <Text style={[styles.headerCell, styles.statusColumn]}>Status</Text>
        <Text style={[styles.headerCell, styles.mainContent]}>Item</Text>
        <Text style={[styles.headerCell, styles.dateColumn]}>Start</Text>
        <Text style={[styles.headerCell, styles.progressColumn]}>Progress</Text>
      </View>

      {/* List */}
      {sortedItems.length === 0 ? (
        renderEmpty()
      ) : (
        <FlatList
          data={sortedItems}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          accessible
          accessibilityLabel={`Schedule items, ${sortedItems.length} items`}
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
  header: {
    backgroundColor: 'white',
    padding: 12,
    paddingBottom: 8,
  },
  searchBar: {
    marginBottom: 8,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sortButton: {
    borderRadius: 20,
  },
  filterChip: {
    backgroundColor: 'transparent',
  },
  statusFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  statusChip: {
    marginBottom: 4,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
  },
  headerCell: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  listContent: {
    paddingBottom: 16,
  },
  itemCard: {
    marginHorizontal: 8,
    marginTop: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  statusColumn: {
    width: 80,
    minHeight: 32,
    justifyContent: 'center',
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 8,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  itemMeta: {
    fontSize: 11,
    color: '#666',
  },
  dateColumn: {
    width: 60,
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
    fontWeight: '500',
  },
  dateEndText: {
    fontSize: 10,
    color: '#888',
    marginTop: 1,
  },
  dateLabel: {
    fontSize: 10,
    color: '#999',
  },
  assigneeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
    gap: 3,
  },
  assigneeText: {
    fontSize: 11,
    color: '#5C6BC0',
  },
  progressColumn: {
    width: 60,
    alignItems: 'center',
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.INFO,
    marginBottom: 2,
  },
  completedProgress: {
    color: COLORS.SUCCESS,
  },
  delayedProgress: {
    color: COLORS.ERROR,
  },
  progressBar: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.INFO,
    borderRadius: 2,
  },
  criticalProgressFill: {
    backgroundColor: COLORS.ERROR,
  },
  criticalIndicator: {
    width: 24,
    alignItems: 'center',
  },
});

export default ListView;
