/**
 * UnifiedSchedule Screen
 *
 * Unified schedule view with Timeline, Calendar, and List tabs (3 views).
 * Provides multiple ways to view and manage project schedule items.
 *
 * @version 1.0.0
 * @since Planning Phase 3
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { database } from '../../../models/database';
import { withObservables } from '@nozbe/watermelondb/react';
import ItemModel from '../../../models/ItemModel';
import ProjectModel from '../../../models/ProjectModel';
import SiteModel from '../../../models/SiteModel';
import CategoryModel from '../../../models/CategoryModel';
import UserModel from '../../../models/UserModel';
import { ErrorBoundary } from '../../components/common/ErrorBoundary';
import { useAccessibility } from '../../utils/accessibility';
import { useDebounce } from '../../utils/performance';
import { usePlanningContext } from '../context';

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
  assigneeName?: string;
  assigneeRole?: 'supervisor' | 'designer';
}

export interface ScheduleFilters {
  projectId: string;
  siteId: string;
  searchQuery: string;
  showCriticalPathOnly: boolean;
}

// ==================== Tab Types ====================

type TabName = 'Timeline' | 'Calendar' | 'List';

const TAB_CONFIG: Record<TabName, { icon: string; subtitle: string }> = {
  Timeline: { icon: 'chart-gantt',      subtitle: 'Chronological progress view with critical path' },
  Calendar:  { icon: 'calendar-month',  subtitle: 'Items overlaid on a monthly grid' },
  List:      { icon: 'view-list',       subtitle: 'Sortable table with status filters' },
};

interface TabButtonProps {
  name: TabName;
  isActive: boolean;
  onPress: () => void;
  theme: any;
}

// ==================== Tab Button Component ====================

const TabButton: React.FC<TabButtonProps> = ({ name, isActive, onPress, theme }) => {
  const { icon } = TAB_CONFIG[name];
  const activeColor = theme.colors.primary;
  const inactiveColor = theme.colors.onSurfaceVariant;
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.tabButton,
        isActive && { borderBottomColor: activeColor, borderBottomWidth: 2 },
      ]}
      accessible
      accessibilityRole="tab"
      accessibilityState={{ selected: isActive }}
      accessibilityLabel={`${name} view`}
    >
      <Icon name={icon} size={18} color={isActive ? activeColor : inactiveColor} style={styles.tabIcon} />
      <Text
        style={[
          styles.tabLabel,
          { color: isActive ? activeColor : inactiveColor },
        ]}
      >
        {name}
      </Text>
    </Pressable>
  );
};

// ==================== Component Props ====================

interface UnifiedScheduleObservedProps {
  items: ItemModel[];
  projects: ProjectModel[];
  sites: SiteModel[];
  categories: CategoryModel[];
  users: UserModel[];
}

const UnifiedScheduleComponent: React.FC<UnifiedScheduleObservedProps> = ({
  items,
  projects,
  sites,
  categories,
  users,
}) => {
  const theme = useTheme();
  const { announce } = useAccessibility();
  // Use assigned project from context (set by Admin in RoleManagement)
  const { projectId: assignedProjectId, selectedSiteId, selectSite } = usePlanningContext();

  // Tab state
  const [activeTab, setActiveTab] = useState<TabName>('Timeline');

  // Filter state - use assigned project from context
  const [filters, setFilters] = useState<ScheduleFilters>({
    projectId: assignedProjectId || '',
    siteId: selectedSiteId || '',
    searchQuery: '',
    showCriticalPathOnly: false,
  });

  // Sync filters with context when assigned project loads
  useEffect(() => {
    if (assignedProjectId && assignedProjectId !== filters.projectId) {
      setFilters((prev) => ({ ...prev, projectId: assignedProjectId, siteId: '' }));
    }
  }, [assignedProjectId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (selectedSiteId !== filters.siteId) {
      setFilters((prev) => ({ ...prev, siteId: selectedSiteId || '' }));
    }
  }, [selectedSiteId]); // eslint-disable-line react-hooks/exhaustive-deps

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
    // Build lookup maps for O(1) access
    const userMap: Record<string, string> = {};
    users.forEach(u => { userMap[u.id] = u.fullName; });
    const siteModelMap: Record<string, SiteModel> = {};
    sites.forEach(s => { siteModelMap[s.id] = s; });

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

      // Resolve assignee from site's supervisor or designer
      const siteModel = siteModelMap[item.siteId];
      const supervisorId = (siteModel as any)?.supervisorId;
      const designEngineerId = (siteModel as any)?.designEngineerId;
      const assigneeName = supervisorId
        ? userMap[supervisorId]
        : designEngineerId
          ? userMap[designEngineerId]
          : undefined;
      const assigneeRole: 'supervisor' | 'designer' | undefined = supervisorId
        ? 'supervisor'
        : designEngineerId
          ? 'designer'
          : undefined;

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
        assigneeName,
        assigneeRole,
      };
    });
  }, [items, sites, users, filters, debouncedSearchQuery, getCategoryName, getSiteName]);

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

  // Filter handlers - update local state and global context where applicable
  // Note: Project is assigned by Admin, so handleProjectChange is a no-op for uniformity
  const handleProjectChange = useCallback((_projectId: string) => {
    // Project is restricted to assigned project - no change allowed
    // This handler is kept for interface compatibility but does nothing
  }, []);

  const handleSiteChange = useCallback((siteId: string) => {
    setFilters((prev) => ({ ...prev, siteId }));
    selectSite(siteId); // Update global context
  }, [selectSite]);

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

  // Shared props for all views - memoized to prevent unnecessary re-renders
  const viewProps = useMemo(() => ({
    items: sortedItems,
    filters,
    projects,
    sites: projectSites,
    onProjectChange: handleProjectChange,
    onSiteChange: handleSiteChange,
    onSearchChange: handleSearchChange,
    onCriticalPathToggle: handleCriticalPathToggle,
    onClearSearch: clearSearch,
  }), [
    sortedItems,
    filters,
    projects,
    projectSites,
    handleProjectChange,
    handleSiteChange,
    handleSearchChange,
    handleCriticalPathToggle,
    clearSearch,
  ]);

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

      {/* Tab context strip — subtitle + item count */}
      <View style={styles.contextStrip}>
        <Text style={styles.contextSubtitle}>{TAB_CONFIG[activeTab].subtitle}</Text>
        <Text style={styles.contextCount}>{sortedItems.length} item{sortedItems.length !== 1 ? 's' : ''}</Text>
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
  items: database.collections.get<ItemModel>('items').query(),
  projects: database.collections.get<ProjectModel>('projects').query(),
  sites: database.collections.get<SiteModel>('sites').query(),
  categories: database.collections.get<CategoryModel>('categories').query(),
  users: database.collections.get<UserModel>('users').query(),
}));

// Type assertion: withObservables transforms observable queries to resolved arrays
// The HOC injects observed props at runtime, so we need to cast the component type
const UnifiedSchedule = enhance(
  UnifiedScheduleComponent as React.ComponentType<unknown>
);

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
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    flexDirection: 'row',
    gap: 6,
  },
  tabIcon: {
    // sits next to label
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  contextStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: '#EEF2FF',
    borderBottomWidth: 1,
    borderBottomColor: '#D8DFF5',
  },
  contextSubtitle: {
    fontSize: 12,
    color: '#5C6BC0',
    fontStyle: 'italic',
    flex: 1,
  },
  contextCount: {
    fontSize: 12,
    fontWeight: '700',
    color: '#5C6BC0',
    marginLeft: 8,
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
