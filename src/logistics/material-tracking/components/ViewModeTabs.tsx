import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { ViewMode } from '../utils/materialTrackingConstants';
import { COLORS } from '../../../theme/colors';

interface ViewModeTabsProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  stats: {
    total: number;
    shortageCount: number;
    procurementPending: number;
  };
}

/**
 * ViewModeTabs Component
 *
 * Navigation tabs for switching between different views:
 * - Requirements
 * - Shortages
 * - Procurement
 * - Analytics
 *
 * Extracted from MaterialTrackingScreen for reusability.
 */
export const ViewModeTabs: React.FC<ViewModeTabsProps> = ({
  viewMode,
  onViewModeChange,
  stats,
}) => {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Requirements Tab */}
        <TouchableOpacity
          style={[styles.tab, viewMode === 'requirements' && styles.tabActive]}
          onPress={() => onViewModeChange('requirements')}
        >
          <Text style={[styles.tabText, viewMode === 'requirements' && styles.tabTextActive]}>
            Requirements
          </Text>
          <View style={styles.tabBadge}>
            <Text style={styles.tabBadgeText}>{stats.total}</Text>
          </View>
        </TouchableOpacity>

        {/* Shortages Tab */}
        <TouchableOpacity
          style={[styles.tab, viewMode === 'shortages' && styles.tabActive]}
          onPress={() => onViewModeChange('shortages')}
        >
          <Text style={[styles.tabText, viewMode === 'shortages' && styles.tabTextActive]}>
            Shortages
          </Text>
          {stats.shortageCount > 0 && (
            <View style={[styles.tabBadge, styles.tabBadgeAlert]}>
              <Text style={styles.tabBadgeText}>{stats.shortageCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Procurement Tab */}
        <TouchableOpacity
          style={[styles.tab, viewMode === 'procurement' && styles.tabActive]}
          onPress={() => onViewModeChange('procurement')}
        >
          <Text style={[styles.tabText, viewMode === 'procurement' && styles.tabTextActive]}>
            Procurement
          </Text>
          {stats.procurementPending > 0 && (
            <View style={[styles.tabBadge, styles.tabBadgeWarning]}>
              <Text style={styles.tabBadgeText}>{stats.procurementPending}</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Analytics Tab */}
        <TouchableOpacity
          style={[styles.tab, viewMode === 'analytics' && styles.tabActive]}
          onPress={() => onViewModeChange('analytics')}
        >
          <Text style={[styles.tabText, viewMode === 'analytics' && styles.tabTextActive]}>
            Analytics
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  scrollContent: {
    flexDirection: 'row',
    paddingHorizontal: 4,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    gap: 6,
  },
  tabActive: {
    borderBottomColor: COLORS.INFO,
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  tabTextActive: {
    color: COLORS.INFO,
    fontWeight: '700',
  },
  tabBadge: {
    backgroundColor: '#666',
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBadgeAlert: {
    backgroundColor: '#FF5722',
  },
  tabBadgeWarning: {
    backgroundColor: COLORS.WARNING,
  },
  tabBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
});
