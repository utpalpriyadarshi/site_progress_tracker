/**
 * SiteProgressWidget Component
 *
 * Displays per-site progress breakdown in the planner dashboard.
 * Shows each site's name, assigned roles, and combined progress.
 *
 * @version 1.0.0
 * @since Planning Dashboard Phase 6
 */

import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, ProgressBar } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { BaseWidget } from './BaseWidget';
import { EmptyState } from '../../../components/common/EmptyState';
import type { SiteProgressItem } from '../hooks/useSiteProgressData';
import { COLORS } from '../../../theme/colors';

// ==================== Types ====================

export interface SiteProgressWidgetProps {
  sites: SiteProgressItem[];
  loading?: boolean;
  error?: string | null;
  docsOnly?: boolean;
  onPress?: () => void;
  onRetry?: () => void;
  onRefresh?: () => void;
}

// ==================== Helpers ====================

const getProgressColor = (progress: number): string => {
  if (progress >= 100) return COLORS.SUCCESS;
  if (progress >= 50) return COLORS.INFO;
  if (progress > 0) return COLORS.WARNING;
  return COLORS.DISABLED;
};

// ==================== Component ====================

const SiteProgressWidget: React.FC<SiteProgressWidgetProps> = ({
  sites,
  loading,
  error,
  docsOnly,
  onPress,
  onRetry,
  onRefresh,
}) => {
  const renderSiteItem = ({ item }: { item: SiteProgressItem }) => {
    const displayProgress = docsOnly ? item.docProgress : item.progress;
    const progressColor = getProgressColor(displayProgress);

    return (
      <View style={styles.siteItem}>
        <View style={styles.siteHeader}>
          <View style={styles.siteInfo}>
            <Text style={styles.siteName} numberOfLines={1}>{item.name}</Text>
            {item.location ? (
              <Text style={styles.siteLocation} numberOfLines={1}>{item.location}</Text>
            ) : null}
          </View>
          <Text style={[styles.progressText, { color: progressColor }]}>
            {Math.round(displayProgress)}%
          </Text>
        </View>

        <ProgressBar
          progress={displayProgress / 100}
          color={progressColor}
          style={styles.progressBar}
        />

        <View style={styles.siteFooter}>
          <View style={styles.roleIcons}>
            {item.hasSupervisor && (
              <View style={styles.roleTag}>
                <Icon name="hard-hat" size={13} color="#666" />
                <Text style={styles.roleTagText}>Supervisor</Text>
              </View>
            )}
            {item.hasDE && (
              <View style={styles.roleTag}>
                <Icon name="pencil-ruler" size={13} color="#666" />
                <Text style={styles.roleTagText}>Design Eng.</Text>
              </View>
            )}
            {!item.hasSupervisor && !item.hasDE && (
              <Text style={styles.unassignedText}>Unassigned</Text>
            )}
          </View>
          {item.kdCount > 0 && (
            <Text style={styles.kdCountText}>{item.kdCount} KD{item.kdCount > 1 ? 's' : ''}</Text>
          )}
        </View>

        {docsOnly ? (
          item.docProgress > 0 ? (
            <Text style={styles.breakdownText}>
              Docs: {Math.round(item.docProgress)}%
            </Text>
          ) : null
        ) : (item.itemProgress > 0 || item.docProgress > 0) ? (
          <Text style={styles.breakdownText}>
            Items: {Math.round(item.itemProgress)}% | Docs: {Math.round(item.docProgress)}%
          </Text>
        ) : null}
      </View>
    );
  };

  const renderContent = () => {
    if (sites.length === 0) {
      return (
        <EmptyState
          icon="map-marker-off-outline"
          title="No Sites"
          message="No sites have been created for this project yet."
        />
      );
    }

    return (
      <FlatList
        data={sites}
        keyExtractor={(item) => item.id}
        renderItem={renderSiteItem}
        scrollEnabled={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    );
  };

  return (
    <BaseWidget
      title="Site Progress"
      icon="map-marker-multiple"
      loading={loading}
      error={error}
      onPress={onPress}
      onRetry={onRetry}
      onRefresh={onRefresh}
    >
      {renderContent()}
    </BaseWidget>
  );
};
// ==================== Styles ====================

const styles = StyleSheet.create({
  siteItem: {
    paddingVertical: 8,
  },
  siteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  siteInfo: {
    flex: 1,
    marginRight: 8,
  },
  siteName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  siteLocation: {
    fontSize: 12,
    color: '#666',
    marginTop: 1,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '700',
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    marginVertical: 4,
  },
  siteFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  roleIcons: {
    flexDirection: 'row',
    gap: 8,
  },
  roleTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  roleTagText: {
    fontSize: 11,
    color: '#666',
  },
  unassignedText: {
    fontSize: 11,
    color: '#999',
    fontStyle: 'italic',
  },
  kdCountText: {
    fontSize: 11,
    color: '#888',
  },
  breakdownText: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
    fontStyle: 'italic',
  },
  separator: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 4,
  },
});

const SiteProgressWidgetMemo = React.memo(SiteProgressWidget);
export { SiteProgressWidgetMemo as SiteProgressWidget };
