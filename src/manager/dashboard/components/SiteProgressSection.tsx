import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Title, Paragraph, Chip, Divider, ProgressBar } from 'react-native-paper';

interface SiteProgressData {
  siteId: string;
  siteName: string;
  supervisorName: string;
  overallProgress: number;
  status: 'on_track' | 'at_risk' | 'delayed';
  criticalIssues: number;
  itemsProgress: number;
  milestonesProgress: number;
}

interface SiteProgressSectionProps {
  sites: SiteProgressData[];
}

export const SiteProgressSection: React.FC<SiteProgressSectionProps> = ({ sites }) => {
  if (sites.length === 0) {
    return (
      <Card style={styles.sectionCard}>
        <Card.Content>
          <Paragraph style={styles.emptyText}>No sites found for this project</Paragraph>
        </Card.Content>
      </Card>
    );
  }

  return (
    <>
      {sites.map((site) => (
        <Card key={site.siteId} style={styles.siteCard}>
          <Card.Content>
            <View style={styles.siteHeader}>
              <View style={styles.siteHeaderLeft}>
                <Title style={styles.siteName}>{site.siteName}</Title>
                <Paragraph style={styles.supervisorText}>👷 {site.supervisorName}</Paragraph>
              </View>
              <Chip
                style={[
                  styles.siteStatusChip,
                  {
                    backgroundColor:
                      site.status === 'on_track'
                        ? '#4CAF50'
                        : site.status === 'at_risk'
                        ? '#FFC107'
                        : '#F44336',
                  },
                ]}
                textStyle={{ color: '#fff', fontSize: 11, fontWeight: 'bold' }}
              >
                {site.status === 'on_track' ? 'ON TRACK' : site.status === 'at_risk' ? 'AT RISK' : 'DELAYED'}
              </Chip>
            </View>

            <Divider style={styles.divider} />

            <View style={styles.siteProgressSection}>
              <View style={styles.siteProgressLeft}>
                <Title style={styles.siteProgressValue}>{site.overallProgress}%</Title>
                <Paragraph style={styles.siteProgressLabel}>Overall Progress</Paragraph>
                <Paragraph style={styles.siteProgressFormula}>
                  ({site.itemsProgress}% items × 0.6 + {site.milestonesProgress}% milestones × 0.4)
                </Paragraph>
              </View>

              <View style={styles.siteProgressRight}>
                <View style={styles.siteMetric}>
                  <Paragraph style={styles.siteMetricValue}>{site.criticalIssues}</Paragraph>
                  <Paragraph style={styles.siteMetricLabel}>Critical Issues</Paragraph>
                </View>
              </View>
            </View>

            <ProgressBar
              progress={site.overallProgress / 100}
              color={
                site.status === 'on_track' ? '#4CAF50' : site.status === 'at_risk' ? '#FFC107' : '#F44336'
              }
              style={styles.progressBar}
            />
          </Card.Content>
        </Card>
      ))}
    </>
  );
};

const styles = StyleSheet.create({
  sectionCard: {
    margin: 8,
    elevation: 2,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontStyle: 'italic',
  },
  siteCard: {
    margin: 8,
    elevation: 2,
  },
  siteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  siteHeaderLeft: {
    flex: 1,
  },
  siteName: {
    fontSize: 16,
    fontWeight: '600',
  },
  supervisorText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  siteStatusChip: {
    marginLeft: 8,
  },
  divider: {
    marginVertical: 12,
  },
  siteProgressSection: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  siteProgressLeft: {
    flex: 2,
    alignItems: 'center',
  },
  siteProgressValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  siteProgressLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  siteProgressFormula: {
    fontSize: 10,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 4,
  },
  siteProgressRight: {
    flex: 1,
    justifyContent: 'center',
  },
  siteMetric: {
    alignItems: 'center',
  },
  siteMetricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F44336',
  },
  siteMetricLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
});
