import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ViewMode } from '../utils';

interface ViewModeTabsProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  badges?: {
    overview?: number;
    locations?: number;
    transfers?: number;
    analytics?: number;
  };
}

/**
 * ViewModeTabs Component
 *
 * Horizontal tab selector for switching between inventory view modes.
 * Shows badges for each tab with counts.
 *
 * Extracted from InventoryManagementScreen.tsx Phase 3.
 */
export const ViewModeTabs: React.FC<ViewModeTabsProps> = ({
  viewMode,
  onViewModeChange,
  badges = {},
}) => {
  const modes: Array<{ mode: ViewMode; label: string }> = [
    { mode: 'overview', label: 'Overview' },
    { mode: 'locations', label: 'Locations' },
    { mode: 'transfers', label: 'Transfers' },
    { mode: 'analytics', label: 'Analytics' },
  ];

  return (
    <View style={styles.container}>
      {modes.map(({ mode, label }) => {
        const badge = badges[mode];
        const isActive = viewMode === mode;

        return (
          <TouchableOpacity
            key={mode}
            style={[styles.tab, isActive && styles.tabActive]}
            onPress={() => onViewModeChange(mode)}
          >
            <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
              {label}
            </Text>
            {badge !== undefined && badge > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{badge}</Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    borderRadius: 6,
    backgroundColor: '#f9fafb',
  },
  tabActive: {
    backgroundColor: '#3b82f6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  tabTextActive: {
    color: '#fff',
  },
  badge: {
    marginLeft: 6,
    backgroundColor: '#ef4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#fff',
  },
});
