/**
 * KeyDateView Component
 *
 * Displays key dates in a timeline view within the Schedule tab.
 * Shows key dates with progress, status, and deadline information.
 *
 * @version 1.0.0
 * @since Phase 5c - Key Dates Integration
 */

import React, { useMemo, useCallback } from 'react';
import { View, StyleSheet, ScrollView, FlatList } from 'react-native';
import {
  Card,
  Text,
  Chip,
  Searchbar,
  SegmentedButtons,
  ProgressBar,
  Divider,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { database } from '../../../../models/database';
import { withObservables } from '@nozbe/watermelondb/react';
import { Q } from '@nozbe/watermelondb';
import KeyDateModel, { KeyDateCategory, KeyDateStatus } from '../../../../models/KeyDateModel';
import { EmptyState } from '../../../components/common/EmptyState';
import { usePlanningContext } from '../../context';
import {
  KEY_DATE_CATEGORY_COLORS,
  KEY_DATE_STATUS_COLORS,
  KEY_DATE_STATUS_LABELS,
  formatDaysRemaining,
} from '../../key-dates/utils/keyDateConstants';

// ==================== Types ====================

interface KeyDateViewInputProps {
  projectId: string;
}

interface KeyDateViewObservedProps {
  keyDates: KeyDateModel[];
}

interface KeyDateViewFilters {
  searchQuery: string;
  statusFilter: KeyDateStatus | 'all';
}

type KeyDateViewProps = KeyDateViewInputProps & KeyDateViewObservedProps;

// ==================== Main Component ====================

const KeyDateViewComponent: React.FC<KeyDateViewProps> = ({ keyDates }) => {
  const navigation = useNavigation<any>();

  // Local filter state
  const [filters, setFilters] = React.useState<KeyDateViewFilters>({
    searchQuery: '',
    statusFilter: 'all',
  });

  // Filter key dates
  const filteredKeyDates = useMemo(() => {
    let result = keyDates;

    // Filter by search query
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      result = result.filter(
        (kd) =>
          kd.code.toLowerCase().includes(query) ||
          kd.description.toLowerCase().includes(query) ||
          kd.categoryName.toLowerCase().includes(query)
      );
    }

    // Filter by status
    if (filters.statusFilter !== 'all') {
      result = result.filter((kd) => kd.status === filters.statusFilter);
    }

    // Sort by target days
    return result.sort((a, b) => a.targetDays - b.targetDays);
  }, [keyDates, filters]);

  // Statistics
  const stats = useMemo(() => {
    const total = keyDates.length;
    const completed = keyDates.filter((kd) => kd.status === 'completed').length;
    const delayed = keyDates.filter((kd) => kd.status === 'delayed').length;
    const inProgress = keyDates.filter((kd) => kd.status === 'in_progress').length;
    const critical = keyDates.filter((kd) => kd.isCritical()).length;

    return { total, completed, delayed, inProgress, critical };
  }, [keyDates]);

  // Handlers
  const handleSearchChange = useCallback((query: string) => {
    setFilters((prev) => ({ ...prev, searchQuery: query }));
  }, []);

  const handleStatusFilterChange = useCallback((status: string) => {
    setFilters((prev) => ({ ...prev, statusFilter: status as KeyDateStatus | 'all' }));
  }, []);

  const handleNavigateToKeyDates = useCallback(() => {
    navigation.navigate('KeyDates');
  }, [navigation]);

  // Render item
  const renderKeyDateItem = useCallback(({ item }: { item: KeyDateModel }) => {
    const daysRemaining = item.getDaysRemaining();
    const daysDelayed = item.getDaysDelayed();
    const isCritical = item.isCritical();
    const categoryColor = KEY_DATE_CATEGORY_COLORS[item.category];
    const statusColor = KEY_DATE_STATUS_COLORS[item.status];

    return (
      <Card
        style={[styles.keyDateCard, isCritical && styles.criticalCard]}
        onPress={handleNavigateToKeyDates}
      >
        {/* Category Color Bar */}
        <View style={[styles.categoryBar, { backgroundColor: categoryColor }]} />

        <Card.Content style={styles.cardContent}>
          {/* Header Row */}
          <View style={styles.headerRow}>
            <View style={styles.codeContainer}>
              <Text style={[styles.code, { color: categoryColor }]}>{item.code}</Text>
              <Chip
                mode="flat"
                compact
                style={[styles.statusChip, { backgroundColor: statusColor }]}
                textStyle={styles.statusChipText}
              >
                {KEY_DATE_STATUS_LABELS[item.status]}
              </Chip>
            </View>
          </View>

          {/* Category */}
          <Text style={styles.category}>{item.categoryName}</Text>

          {/* Description */}
          <Text style={styles.description} numberOfLines={2}>
            {item.description}
          </Text>

          {/* Progress */}
          <View style={styles.progressSection}>
            <Text style={styles.progressLabel}>
              Progress: {item.progressPercentage.toFixed(0)}%
            </Text>
            <ProgressBar
              progress={item.progressPercentage / 100}
              color={item.status === 'delayed' ? '#F44336' : categoryColor}
              style={styles.progressBar}
            />
          </View>

          {/* Timeline Info */}
          <View style={styles.timelineInfo}>
            <View style={styles.timelineItem}>
              <Text style={styles.timelineLabel}>Target</Text>
              <Text style={styles.timelineValue}>{item.targetDays} days</Text>
            </View>

            <View style={styles.timelineDivider} />

            <View style={styles.timelineItem}>
              <Text style={styles.timelineLabel}>Status</Text>
              <Text
                style={[
                  styles.timelineValue,
                  daysDelayed > 0 && styles.delayedText,
                ]}
              >
                {formatDaysRemaining(daysRemaining)}
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  }, [handleNavigateToKeyDates]);

  return (
    <View style={styles.container}>
      {/* Stats Header */}
      <Card style={styles.statsCard}>
        <Card.Content>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.total}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#4CAF50' }]}>
                {stats.completed}
              </Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#2196F3' }]}>
                {stats.inProgress}
              </Text>
              <Text style={styles.statLabel}>In Progress</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#F44336' }]}>
                {stats.delayed}
              </Text>
              <Text style={styles.statLabel}>Delayed</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#FF9800' }]}>
                {stats.critical}
              </Text>
              <Text style={styles.statLabel}>Critical</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Filters */}
      <Card style={styles.filterCard}>
        <Card.Content>
          <Searchbar
            placeholder="Search key dates..."
            onChangeText={handleSearchChange}
            value={filters.searchQuery}
            style={styles.searchbar}
          />

          <SegmentedButtons
            value={filters.statusFilter}
            onValueChange={handleStatusFilterChange}
            buttons={[
              { value: 'all', label: 'All' },
              { value: 'in_progress', label: 'Active' },
              { value: 'delayed', label: 'Delayed' },
              { value: 'completed', label: 'Done' },
            ]}
            style={styles.segmentedButtons}
            density="small"
          />
        </Card.Content>
      </Card>

      {/* Key Dates List */}
      {filteredKeyDates.length === 0 ? (
        <EmptyState
          icon="calendar-check"
          title="No Key Dates"
          message={
            filters.searchQuery || filters.statusFilter !== 'all'
              ? 'No key dates match your filters'
              : 'No key dates configured for this project'
          }
          actionText="Manage Key Dates"
          onAction={handleNavigateToKeyDates}
        />
      ) : (
        <FlatList
          data={filteredKeyDates}
          keyExtractor={(item) => item.id}
          renderItem={renderKeyDateItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

// ==================== WatermelonDB Enhancement ====================

const enhance = withObservables(
  ['projectId'],
  ({ projectId }: KeyDateViewInputProps) => ({
    keyDates: database.collections
      .get<KeyDateModel>('key_dates')
      .query(Q.where('project_id', projectId))
      .observe(),
  })
);

const EnhancedKeyDateView = enhance(
  KeyDateViewComponent as React.ComponentType<KeyDateViewInputProps>
);

// ==================== Wrapper with Context ====================

export const KeyDateView: React.FC = () => {
  const { projectId } = usePlanningContext();

  if (!projectId) {
    return (
      <EmptyState
        icon="folder-alert-outline"
        title="No Project Assigned"
        message="Please contact your administrator to assign a project."
        variant="large"
      />
    );
  }

  return <EnhancedKeyDateView projectId={projectId} />;
};

// ==================== Styles ====================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  statsCard: {
    margin: 16,
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  filterCard: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  searchbar: {
    marginBottom: 12,
    elevation: 0,
    backgroundColor: '#F5F5F5',
  },
  segmentedButtons: {
    marginTop: 4,
  },
  listContent: {
    paddingBottom: 16,
  },
  keyDateCard: {
    marginHorizontal: 16,
    marginVertical: 8,
    overflow: 'hidden',
  },
  criticalCard: {
    borderWidth: 1,
    borderColor: '#F44336',
  },
  categoryBar: {
    height: 4,
  },
  cardContent: {
    paddingTop: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  code: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusChip: {
    height: 24,
  },
  statusChipText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  category: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#333',
    marginBottom: 12,
    lineHeight: 20,
  },
  progressSection: {
    marginBottom: 12,
  },
  progressLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
  timelineInfo: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
  },
  timelineItem: {
    flex: 1,
    alignItems: 'center',
  },
  timelineDivider: {
    width: 1,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 8,
  },
  timelineLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 2,
  },
  timelineValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  delayedText: {
    color: '#F44336',
  },
});

export default KeyDateView;
