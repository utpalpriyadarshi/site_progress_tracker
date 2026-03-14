import React from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Card, Title, Paragraph, Chip, Divider, ProgressBar, Text } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS } from '../../../theme/colors';
import type { EngineeringData } from '../hooks/useEngineeringData';

interface EngineeringSectionProps {
  data: EngineeringData | null;
  loading?: boolean;
  onPressPM200?: () => void;
  onPressDoors?: () => void;
}

const DrillLink: React.FC<{ label: string; onPress?: () => void }> = ({ label, onPress }) => {
  if (!onPress) return null;
  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.drillLink}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text style={styles.drillLinkText}>{label}</Text>
      <Icon name="chevron-right" size={16} color={COLORS.INFO} />
    </TouchableOpacity>
  );
};

export const EngineeringSection: React.FC<EngineeringSectionProps> = ({
  data,
  loading = false,
  onPressPM200,
  onPressDoors,
}) => {
  if (loading || !data) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={COLORS.INFO} />
        <Text style={styles.loadingText}>Loading engineering data...</Text>
      </View>
    );
  }

  const {
    pm200Progress,
    pm200Status,
    totalDoors,
    doorsApproved,
    doorsUnderReview,
    doorsOpenIssues,
    totalRequirements,
    compliantRequirements,
    compliancePercentage,
    totalRfqs,
    rfqsQuotesReceived,
    rfqsUnderEvaluation,
    rfqsAwarded,
  } = data;

  const pm200Color =
    pm200Status === 'completed'
      ? COLORS.SUCCESS
      : pm200Status === 'in_progress'
      ? COLORS.INFO
      : COLORS.DISABLED;

  const complianceColor =
    compliancePercentage >= 80
      ? COLORS.SUCCESS
      : compliancePercentage >= 50
      ? '#FFC107'
      : COLORS.ERROR;

  return (
    <>
      {/* PM200 — Engineering Design */}
      <TouchableOpacity
        onPress={onPressPM200}
        activeOpacity={onPressPM200 ? 0.75 : 1}
        accessibilityRole={onPressPM200 ? 'button' : undefined}
        accessibilityLabel={`PM200 Engineering Design, ${pm200Progress}% complete, status ${pm200Status}`}
      >
        <Card mode="elevated" style={styles.sectionCard}>
          <Card.Content>
            <View style={styles.cardTitleRow}>
              <Icon name="drawing-box" size={18} color={COLORS.INFO} style={styles.cardTitleIcon} />
              <Title style={styles.cardTitle}>Engineering Design (PM200)</Title>
            </View>
            <View style={styles.engineeringRow}>
              <View style={styles.engineeringMetric}>
                <Title style={[styles.metricValue, { color: pm200Color }]}>{pm200Progress}%</Title>
                <Paragraph style={styles.metricLabel}>Design Completion</Paragraph>
              </View>
              <View style={styles.engineeringMetric}>
                <Chip
                  style={[styles.statusChip, { backgroundColor: pm200Color }]}
                  textStyle={{ color: '#fff', fontSize: 12 }}
                >
                  {pm200Status.replace(/_/g, ' ').toUpperCase()}
                </Chip>
                <Paragraph style={styles.metricLabel}>Status</Paragraph>
              </View>
            </View>
            <ProgressBar
              progress={pm200Progress / 100}
              color={pm200Color}
              style={styles.progressBar}
            />
            <DrillLink label="View Milestones" onPress={onPressPM200} />
          </Card.Content>
        </Card>
      </TouchableOpacity>

      {/* DOORS Packages */}
      <TouchableOpacity
        onPress={onPressDoors}
        activeOpacity={onPressDoors ? 0.75 : 1}
        accessibilityRole={onPressDoors ? 'button' : undefined}
        accessibilityLabel={`DOORS Packages: ${totalDoors} total, ${doorsApproved} approved`}
      >
        <Card mode="elevated" style={styles.sectionCard}>
          <Card.Content>
            <View style={styles.cardTitleRow}>
              <Icon name="package-variant" size={18} color={COLORS.INFO} style={styles.cardTitleIcon} />
              <Title style={styles.cardTitle}>DOORS Packages</Title>
            </View>
            <View style={styles.doorsRow}>
              <View style={styles.doorsMetric}>
                <Title style={styles.metricValue}>{totalDoors}</Title>
                <Paragraph style={styles.metricLabel}>Total Packages</Paragraph>
              </View>
              <Divider style={styles.verticalDivider} />
              <View style={styles.doorsBreakdown}>
                <View style={styles.doorsCountRow}>
                  <Icon name="check-circle" size={14} color={COLORS.SUCCESS} />
                  <Text style={styles.doorsCountText}>{doorsApproved} Approved</Text>
                </View>
                <View style={styles.doorsCountRow}>
                  <Icon name="clock-outline" size={14} color={COLORS.INFO} />
                  <Text style={styles.doorsCountText}>{doorsUnderReview} Under Review</Text>
                </View>
                <View style={styles.doorsCountRow}>
                  <Icon name="alert-outline" size={14} color={COLORS.WARNING} />
                  <Text style={[styles.doorsCountText, doorsOpenIssues > 0 && { color: COLORS.WARNING, fontWeight: '600' }]}>
                    {doorsOpenIssues} Open Issues
                  </Text>
                </View>
              </View>
            </View>

            <Divider style={styles.divider} />

            <View style={styles.complianceRow}>
              <Paragraph style={styles.complianceLabel}>Requirements Compliance</Paragraph>
              <Text style={[styles.complianceValue, { color: complianceColor }]}>
                {compliantRequirements}/{totalRequirements} ({compliancePercentage}%)
              </Text>
            </View>
            <ProgressBar
              progress={compliancePercentage / 100}
              color={complianceColor}
              style={styles.progressBar}
            />
            <DrillLink label="View Approval Queue" onPress={onPressDoors} />
          </Card.Content>
        </Card>
      </TouchableOpacity>

      {/* RFQ Status */}
      <Card mode="elevated" style={styles.sectionCard}>
        <Card.Content>
          <View style={styles.cardTitleRow}>
            <Icon name="file-document-outline" size={18} color={COLORS.INFO} style={styles.cardTitleIcon} />
            <Title style={styles.cardTitle}>RFQ Status (Procurement)</Title>
          </View>
          {totalRfqs === 0 ? (
            <Text style={styles.emptyText}>No RFQs raised yet for this project.</Text>
          ) : (
            <View style={styles.rfqRow}>
              <View style={styles.rfqMetric}>
                <Title style={styles.metricValue}>{totalRfqs}</Title>
                <Paragraph style={styles.metricLabel}>Total RFQs</Paragraph>
              </View>
              <Divider style={styles.verticalDivider} />
              <View style={styles.rfqBreakdown}>
                <View style={styles.doorsCountRow}>
                  <Icon name="email-receive-outline" size={14} color={COLORS.INFO} />
                  <Text style={styles.doorsCountText}>{rfqsQuotesReceived} Quotes Received</Text>
                </View>
                <View style={styles.doorsCountRow}>
                  <Icon name="scale-balance" size={14} color="#FFC107" />
                  <Text style={styles.doorsCountText}>{rfqsUnderEvaluation} Under Evaluation</Text>
                </View>
                <View style={styles.doorsCountRow}>
                  <Icon name="check-decagram" size={14} color={COLORS.SUCCESS} />
                  <Text style={styles.doorsCountText}>{rfqsAwarded} Awarded</Text>
                </View>
              </View>
            </View>
          )}
          <Text style={styles.rfqNote}>
            RFQs are managed by the Logistics team.
          </Text>
        </Card.Content>
      </Card>
    </>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  loadingText: {
    color: '#666',
    fontSize: 14,
  },
  sectionCard: {
    margin: 8,
    elevation: 2,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitleIcon: {
    marginRight: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  engineeringRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  engineeringMetric: {
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.INFO,
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  statusChip: {
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  doorsRow: {
    flexDirection: 'row',
    marginBottom: 4,
    alignItems: 'center',
  },
  doorsMetric: {
    alignItems: 'center',
    paddingRight: 8,
  },
  doorsBreakdown: {
    flex: 1,
    paddingLeft: 16,
    gap: 6,
  },
  doorsCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  doorsCountText: {
    fontSize: 13,
    color: '#444',
  },
  verticalDivider: {
    width: 1,
    alignSelf: 'stretch',
    marginHorizontal: 8,
  },
  divider: {
    marginVertical: 12,
  },
  complianceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  complianceLabel: {
    fontSize: 13,
    color: '#666',
  },
  complianceValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  rfqRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  rfqMetric: {
    alignItems: 'center',
    paddingRight: 8,
  },
  rfqBreakdown: {
    flex: 1,
    paddingLeft: 16,
    gap: 6,
  },
  rfqNote: {
    fontSize: 11,
    color: '#999',
    marginTop: 8,
    fontStyle: 'italic',
  },
  emptyText: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 12,
  },
  drillLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingTop: 8,
  },
  drillLinkText: {
    fontSize: 13,
    color: COLORS.INFO,
    fontWeight: '500',
  },
});
