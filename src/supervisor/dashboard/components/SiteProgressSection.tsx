import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Card, ProgressBar } from 'react-native-paper';
import { COLORS } from '../../../theme/colors';
import type { SiteProgressEntry } from '../hooks/useDashboardData';

const getProgressColor = (progress: number): string => {
  if (progress >= 100) return COLORS.SUCCESS;
  if (progress >= 50) return COLORS.INFO;
  if (progress > 0) return COLORS.WARNING;
  return COLORS.DISABLED;
};

interface SiteProgressSectionProps {
  sites: SiteProgressEntry[];
  loading?: boolean;
}

export const SiteProgressSection: React.FC<SiteProgressSectionProps> = ({ sites, loading }) => {
  if (loading || sites.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text variant="titleMedium" style={styles.sectionTitle}>
        Site Progress
      </Text>
      <Card mode="elevated" style={styles.card}>
        <Card.Content style={styles.cardContent}>
          {sites.map((site, index) => {
            const progressColor = getProgressColor(site.progress);
            return (
              <View
                key={site.id}
                style={[styles.siteItem, index > 0 && styles.separator]}
              >
                <View style={styles.siteHeader}>
                  <View style={styles.siteInfo}>
                    <Text style={styles.siteName} numberOfLines={1}>
                      {site.name}
                    </Text>
                    {site.location ? (
                      <Text style={styles.siteLocation} numberOfLines={1}>
                        {site.location}
                      </Text>
                    ) : null}
                  </View>
                  <Text style={[styles.progressText, { color: progressColor }]}>
                    {Math.round(site.progress)}%
                  </Text>
                </View>
                <ProgressBar
                  progress={site.progress / 100}
                  color={progressColor}
                  style={styles.progressBar}
                />
                {site.itemCount > 0 && (
                  <Text style={styles.itemCountText}>
                    {site.itemCount} item{site.itemCount !== 1 ? 's' : ''}
                  </Text>
                )}
              </View>
            );
          })}
        </Card.Content>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    marginHorizontal: 16,
    marginBottom: 12,
    fontWeight: 'bold',
  },
  card: {
    marginHorizontal: 8,
    elevation: 2,
  },
  cardContent: {
    paddingVertical: 8,
  },
  siteItem: {
    paddingVertical: 8,
  },
  separator: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 12,
    marginTop: 4,
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
  itemCountText: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
    fontStyle: 'italic',
  },
});
