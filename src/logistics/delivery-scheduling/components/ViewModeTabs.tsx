/**
 * ViewModeTabs Component
 *
 * Tab navigation for different delivery views
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ViewMode, VIEW_MODE_TABS } from '../utils/deliveryConstants';

interface ViewModeTabsProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  scheduledCount?: number;
  inTransitCount?: number;
  routesCount?: number;
}

export const ViewModeTabs: React.FC<ViewModeTabsProps> = ({
  viewMode,
  onViewModeChange,
  scheduledCount = 0,
  inTransitCount = 0,
  routesCount = 0,
}) => {
  const getBadgeCount = (mode: ViewMode): number | undefined => {
    switch (mode) {
      case 'schedule':
        return scheduledCount + inTransitCount;
      case 'tracking':
        return inTransitCount;
      case 'routes':
        return routesCount;
      default:
        return undefined;
    }
  };

  return (
    <View style={styles.container}>
      {VIEW_MODE_TABS.map(({ mode, label }) => {
        const badge = getBadgeCount(mode);
        const isActive = viewMode === mode;

        return (
          <TouchableOpacity
            key={mode}
            style={[styles.tab, isActive && styles.tabActive]}
            onPress={() => onViewModeChange(mode)}
          >
            <Text style={[styles.text, isActive && styles.textActive]}>
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
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: {
    backgroundColor: '#007AFF',
  },
  text: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  textActive: {
    color: '#fff',
  },
  badge: {
    marginLeft: 6,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#007AFF',
  },
});
