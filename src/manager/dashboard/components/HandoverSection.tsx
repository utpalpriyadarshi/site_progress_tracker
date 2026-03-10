import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Title, Paragraph, Chip, Divider, ProgressBar } from 'react-native-paper';
import { COLORS } from '../../../theme/colors';

interface HandoverData {
  pm700Progress: number;
  pm700Status: string;
  sitesReadyForHandover: number;
  sitesHandedOver: number;
  totalSites: number;
  documentationComplete: number;
  documentationPending: number;
  documentationPercentage: number;
  totalPunchItems: number;
  punchItemsClosed: number;
  punchItemsOpen: number;
  punchItemsCritical: number;
  punchListCompletion: number;
}

interface HandoverSectionProps {
  data: HandoverData;
}

export const HandoverSection: React.FC<HandoverSectionProps> = ({ data }) => {
  const {
    pm700Progress,
    pm700Status,
    sitesReadyForHandover,
    sitesHandedOver,
    totalSites,
    documentationComplete,
    documentationPending,
    documentationPercentage,
    totalPunchItems,
    punchItemsClosed,
    punchItemsOpen,
    punchItemsCritical,
    punchListCompletion,
  } = data;

  return (
    <>
      {/* 7.1 PM700 Overview & Site Status */}
      <Card mode="elevated" style={styles.sectionCard}>
        <Card.Content>
          <Title style={styles.cardTitle}>Handover Overview (PM700)</Title>
          <View style={styles.handoverOverviewRow}>
            <View style={styles.handoverOverviewLeft}>
              <Title style={styles.handoverProgress}>{pm700Progress}%</Title>
              <Paragraph style={styles.handoverLabel}>PM700 Progress</Paragraph>
              <Chip
                style={[
                  styles.statusChip,
                  {
                    backgroundColor:
                      pm700Status === 'completed'
                        ? COLORS.SUCCESS
                        : pm700Status === 'in_progress'
                        ? COLORS.INFO
                        : COLORS.DISABLED,
                  },
                ]}
                textStyle={{ color: '#fff', fontSize: 11 }}
              >
                {pm700Status.replace('_', ' ').toUpperCase()}
              </Chip>
            </View>
            <Divider style={styles.verticalDivider} />
            <View style={styles.handoverOverviewRight}>
              <Paragraph style={styles.handoverSiteLabel}>Site Status:</Paragraph>
              <Paragraph style={styles.handoverSiteItem}>
                ✅ {sitesHandedOver} Handed Over
              </Paragraph>
              <Paragraph style={styles.handoverSiteItem}>
                🎯 {sitesReadyForHandover} Ready
              </Paragraph>
              <Paragraph style={styles.handoverSiteItem}>
                📊 {totalSites} Total Sites
              </Paragraph>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* 7.2 Documentation Status */}
      <Card mode="elevated" style={styles.sectionCard}>
        <Card.Content>
          <Title style={styles.cardTitle}>Documentation Status</Title>
          <View style={styles.documentationRow}>
            <View style={styles.documentationLeft}>
              <Title style={styles.documentationTotal}>{documentationComplete}</Title>
              <Paragraph style={styles.documentationLabel}>Items Documented</Paragraph>
              <Paragraph style={styles.documentationPending}>
                {documentationPending} Pending
              </Paragraph>
            </View>
            <Divider style={styles.verticalDivider} />
            <View style={styles.documentationRight}>
              <Paragraph style={styles.documentationPercentageLabel}>
                Completion:
              </Paragraph>
              <Title style={styles.documentationPercentageValue}>
                {documentationPercentage}%
              </Title>
            </View>
          </View>
          <Divider style={styles.divider} />
          <ProgressBar
            progress={documentationPercentage / 100}
            color={
              documentationPercentage >= 90
                ? COLORS.SUCCESS
                : documentationPercentage >= 70
                ? '#FFC107'
                : COLORS.ERROR
            }
            style={styles.progressBar}
          />
          <Paragraph style={styles.documentationNote}>
            📄 Includes as-built drawings, O&M manuals, test certificates, and warranties
          </Paragraph>
        </Card.Content>
      </Card>

      {/* 7.3 Punch List Summary */}
      <Card mode="elevated" style={styles.sectionCard}>
        <Card.Content>
          <Title style={styles.cardTitle}>Punch List</Title>
          <View style={styles.punchListRow}>
            <View style={styles.punchListLeft}>
              <Title style={styles.punchListTotal}>{totalPunchItems}</Title>
              <Paragraph style={styles.punchListLabel}>Total Items</Paragraph>
            </View>
            <Divider style={styles.verticalDivider} />
            <View style={styles.punchListRight}>
              <Paragraph style={styles.punchListItem}>
                ✅ {punchItemsClosed} Closed
              </Paragraph>
              <Paragraph style={styles.punchListItem}>
                ⏳ {punchItemsOpen} Open
              </Paragraph>
              {punchItemsCritical > 0 && (
                <Paragraph style={styles.punchListCritical}>
                  ⚠️ {punchItemsCritical} Critical
                </Paragraph>
              )}
            </View>
          </View>
          <Divider style={styles.divider} />
          <View style={styles.punchCompletionRow}>
            <Paragraph style={styles.punchCompletionLabel}>Punch List Completion:</Paragraph>
            <Paragraph
              style={[
                styles.punchCompletionValue,
                {
                  color:
                    punchListCompletion >= 90
                      ? COLORS.SUCCESS
                      : punchListCompletion >= 70
                      ? '#FFC107'
                      : COLORS.ERROR,
                },
              ]}
            >
              {punchListCompletion}%
            </Paragraph>
          </View>
          <ProgressBar
            progress={punchListCompletion / 100}
            color={
              punchListCompletion >= 90
                ? COLORS.SUCCESS
                : punchListCompletion >= 70
                ? '#FFC107'
                : COLORS.ERROR
            }
            style={styles.progressBar}
          />
          {punchItemsCritical > 0 && (
            <Paragraph style={styles.warningText}>
              ⚠️ {punchItemsCritical} critical items must be resolved before handover
            </Paragraph>
          )}
        </Card.Content>
      </Card>
    </>
  );
};

const styles = StyleSheet.create({
  sectionCard: {
    margin: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  handoverOverviewRow: {
    flexDirection: 'row',
  },
  handoverOverviewLeft: {
    flex: 1,
    alignItems: 'center',
  },
  handoverProgress: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.INFO,
  },
  handoverLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
  },
  statusChip: {
    marginTop: 8,
  },
  verticalDivider: {
    width: 1,
    marginHorizontal: 16,
  },
  handoverOverviewRight: {
    flex: 1,
    justifyContent: 'center',
  },
  handoverSiteLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  handoverSiteItem: {
    fontSize: 12,
    color: '#666',
    marginVertical: 2,
  },
  documentationRow: {
    flexDirection: 'row',
  },
  documentationLeft: {
    flex: 1,
    alignItems: 'center',
  },
  documentationTotal: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.SUCCESS,
  },
  documentationLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
  },
  documentationPending: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  documentationRight: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  documentationPercentageLabel: {
    fontSize: 11,
    color: '#666',
    marginBottom: 4,
  },
  documentationPercentageValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.INFO,
  },
  divider: {
    marginVertical: 12,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  documentationNote: {
    fontSize: 10,
    color: '#999',
    marginTop: 12,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  punchListRow: {
    flexDirection: 'row',
  },
  punchListLeft: {
    flex: 1,
    alignItems: 'center',
  },
  punchListTotal: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#666',
  },
  punchListLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
  },
  punchListRight: {
    flex: 1,
    justifyContent: 'center',
  },
  punchListItem: {
    fontSize: 12,
    color: '#333',
    marginVertical: 2,
  },
  punchListCritical: {
    fontSize: 12,
    color: COLORS.ERROR,
    fontWeight: '600',
    marginVertical: 2,
  },
  punchCompletionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  punchCompletionLabel: {
    fontSize: 12,
    color: '#666',
  },
  punchCompletionValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  warningText: {
    fontSize: 12,
    color: COLORS.ERROR,
    marginTop: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
