/**
 * UnifiedSchedule Screen
 *
 * Unified schedule view with Timeline, Calendar, and List tabs.
 * Provides multiple ways to view and manage project schedule items.
 *
 * @version 1.0.0
 * @since Planning Phase 3
 */

import React, { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { database } from '../../../models/database';
import { withObservables } from '@nozbe/watermelondb/react';
import ItemModel from '../../../models/ItemModel';
import { ErrorBoundary } from '../../components/common/ErrorBoundary';
import { useAccessibility } from '../../utils/accessibility';
import { useDebounce } from '../../utils/performance';

// Views
import { TimelineView } from './views/TimelineView';
import { CalendarView } from './views/CalendarView';
import { ListView } from './views/ListView';

// ==================== Types ====================

export interface ScheduleItem {
  id: string;
  name: string;
  categoryName: string;
  siteName: string;
  siteId: string;
  plannedStartDate: number | null;
  plannedEndDate: number | null;
  actualStartDate: number | null;
  actualEndDate: number | null;
  progress: number;
  isCriticalPath: boolean;
  isDelayed: boolean;
  status: string;
  floatDays?: number;
  dependencies?: string[];
}

export interface ScheduleFilters {
  projectId: string;
  siteId: string;
  searchQuery: string;
  showCriticalPathOnly: boolean;
}

// ==================== Tab Types ====================

type TabName = 'Timeline' | 'Calendar' | 'List';

interface TabButtonProps {
  name: TabName;
  isActive: boolean;
  onPress: () => void;
  theme: any;
}

// ==================== Tab Button Component ====================

const TabButton: React.FC<TabButtonProps> = ({ name, isActive, onPress, theme }) => (
  <Pressable
    onPress={onPress}
    style={[
      styles.tabButton,
      isActive && { borderBottomColor: theme.colors.primary, borderBottomWidth: 2 },
    ]}
    accessible
    accessibilityRole="tab"
    accessibilityState={{ selected: isActive }}
    accessibilityLabel={`${name} view`}
  >
    <Text
      style={[
        styles.tabLabel,
        { color: isActive ? theme.colors.primary : theme.colors.onSurfaceVariant },
      ]}
    >
      {name}
    </Text>
  </Pressable>
);

// ==================== Component ====================

interface UnifiedScheduleProps {
  items: ItemModel[];
  projects: any[];
  sites: any[];
  categories: any[];
}

const UnifiedScheduleComponent: React.FC<UnifiedScheduleProps> = ({
  items,
  projects,
  sites,
  categories,
}) => {
  const theme = useTheme();
  const { announce } = useAccessibility();

  // Tab state
  const [activeTab, setActiveTab] = useState<TabName>('Timeline');

  // Filter state
  const [filters, setFilters] = useState<ScheduleFilters>({
    projectId: projects[0]?.id || '',
    siteId: '',
    searchQuery: '',
    showCriticalPathOnly: false,
  });

  // Debounce search query for performance
  const debouncedSearchQuery = useDebounce(filters.searchQuery, 300);

  // Helper functions
  const getCategoryName = useCallback(
    (categoryId: string) => {
      const category = categories.find((c) => c.id === categoryId);
      return category ? category.name : 'Unknown';
    },
    [categories]
  );

  const getSiteName = useCallback(
    (siteId: string) => {
      const site = sites.find((s) => s.id === siteId);
      return site ? site.name : 'Unknown';
    },
    [sites]
  );

  // Filter and transform items with memoization
  const scheduleItems = useMemo((): ScheduleItem[] => {
    let filtered = items;

    // Filter by project
    const projectSiteIds = sites
      .filter((s) => s.projectId === filters.projectId)
      .map((s) => s.id);
    filtered = filtered.filter((item) => projectSiteIds.includes(item.siteId));

    // Filter by site
    if (filters.siteId) {
      filtered = filtered.filter((item) => item.siteId === filters.siteId);
    }

    // Filter by search query (debounced)
    if (debouncedSearchQuery) {
      const query = debouncedSearchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          getCategoryName(item.categoryId).toLowerCase().includes(query)
      );
    }

    // Filter by critical path
    if (filters.showCriticalPathOnly) {
      filtered = filtered.filter((item) => item.isCriticalPath);
    }

    // Transform to ScheduleItem
    return filtered.map((item) => {
      const progress = item.plannedQuantity > 0
        ? item.completedQuantity / item.plannedQuantity
        : 0;
      const isDelayed =
        item.plannedEndDate !== null &&
        Date.now() > item.plannedEndDate &&
        progress < 1;

      let status = 'planned';
      if (progress >= 1) status = 'completed';
      else if (item.actualStartDate) status = 'in_progress';
      else if (isDelayed) status = 'delayed';

      // Parse dependencies if stored as JSON string
      let parsedDependencies: string[] | undefined;
      if (item.dependencies) {
        try {
          parsedDependencies = typeof item.dependencies === 'string'
            ? JSON.parse(item.dependencies)
            : item.dependencies;
        } catch {
          parsedDependencies = undefined;
        }
      }

      return {
        id: item.id,
        name: item.name,
        categoryName: getCategoryName(item.categoryId),
        siteName: getSiteName(item.siteId),
        siteId: item.siteId,
        plannedStartDate: item.plannedStartDate ?? null,
        plannedEndDate: item.plannedEndDate ?? null,
        actualStartDate: item.actualStartDate ?? null,
        actualEndDate: item.actualEndDate ?? null,
        progress,
        isCriticalPath: item.isCriticalPath || false,
        isDelayed,
        status,
        floatDays: item.floatDays,
        dependencies: parsedDependencies,
      };
    });
  }, [items, sites, filters, debouncedSearchQuery, getCategoryName, getSiteName]);

  // Sort by planned start date
  const sortedItems = useMemo(() => {
    return [...scheduleItems].sort((a, b) => {
      const aDate = a.plannedStartDate || 0;
      const bDate = b.plannedStartDate || 0;
      return aDate - bDate;
    });
  }, [scheduleItems]);

  // Announce filter results
  React.useEffect(() => {
    if (debouncedSearchQuery) {
      announce(`Found ${sortedItems.length} items`);
    }
  }, [sortedItems.length, debouncedSearchQuery, announce]);

  // Filter handlers
  const handleProjectChange = useCallback((projectId: string) => {
    setFilters((prev) => ({ ...prev, projectId, siteId: '' }));
  }, []);

  const handleSiteChange = useCallback((siteId: string) => {
    setFilters((prev) => ({ ...prev, siteId }));
  }, []);

  const handleSearchChange = useCallback((query: string) => {
    setFilters((prev) => ({ ...prev, searchQuery: query }));
  }, []);

  const handleCriticalPathToggle = useCallback(() => {
    setFilters((prev) => ({ ...prev, showCriticalPathOnly: !prev.showCriticalPathOnly }));
  }, []);

  const clearSearch = useCallback(() => {
    setFilters((prev) => ({ ...prev, searchQuery: '' }));
  }, []);

  // Get filtered sites for current project
  const projectSites = useMemo(() => {
    return sites.filter((s) => s.projectId === filters.projectId);
  }, [sites, filters.projectId]);

  // Shared props for all views
  const viewProps = {
    items: sortedItems,
    filters,
    projects,
    sites: projectSites,
    onProjectChange: handleProjectChange,
    onSiteChange: handleSiteChange,
    onSearchChange: handleSearchChange,
    onCriticalPathToggle: handleCriticalPathToggle,
    onClearSearch: clearSearch,
  };

  const handleTabChange = useCallback(
    (tabName: TabName) => {
      setActiveTab(tabName);
      announce(`Switched to ${tabName} view`);
    },
    [announce]
  );

  // Render active view based on tab selection
  const renderActiveView = useCallback(() => {
    switch (activeTab) {
      case 'Timeline':
        return <TimelineView {...viewProps} />;
      case 'Calendar':
        return <CalendarView {...viewProps} />;
      case 'List':
        return <ListView {...viewProps} />;
      default:
        return <TimelineView {...viewProps} />;
    }
  }, [activeTab, viewProps]);

  return (
    <View style={styles.container}>
      {/* Custom Tab Bar */}
      <View
        style={[styles.tabBar, { backgroundColor: theme.colors.surface }]}
        accessible
        accessibilityRole="tablist"
        accessibilityLabel="Schedule view options"
      >
        <TabButton
          name="Timeline"
          isActive={activeTab === 'Timeline'}
          onPress={() => handleTabChange('Timeline')}
          theme={theme}
        />
        <TabButton
          name="Calendar"
          isActive={activeTab === 'Calendar'}
          onPress={() => handleTabChange('Calendar')}
          theme={theme}
        />
        <TabButton
          name="List"
          isActive={activeTab === 'List'}
          onPress={() => handleTabChange('List')}
          theme={theme}
        />
      </View>

      {/* Active View Content */}
      <View style={styles.content}>
        {renderActiveView()}
      </View>
    </View>
  );
};

// ==================== Database Connection ====================

const enhance = withObservables([], () => ({
  items: database.collections.get('items').query(),
  projects: database.collections.get('projects').query(),
  sites: database.collections.get('sites').query(),
  categories: database.collections.get('categories').query(),
}));

const UnifiedSchedule = enhance(UnifiedScheduleComponent as any);

// ==================== Styles ====================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  tabBar: {
    flexDirection: 'row',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
});

// ==================== Export ====================

const UnifiedScheduleWithBoundary: React.FC = () => (
  <ErrorBoundary name="UnifiedSchedule">
    <UnifiedSchedule />
  </ErrorBoundary>
);

export default UnifiedScheduleWithBoundary;
