import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Title, Paragraph, Chip, Divider, ProgressBar } from 'react-native-paper';
import { COLORS } from '../../../theme/colors';

interface EngineeringData {
  pm200Progress: number;
  pm200Status: string;
  totalDoors: number;
  doorsApproved: number;
  doorsUnderReview: number;
  doorsOpenIssues: number;
  totalRequirements: number;
  compliantRequirements: number;
  totalRfqs: number;
  rfqsQuotesReceived: number;
  rfqsUnderEvaluation: number;
  rfqsAwarded: number;
}

interface EngineeringSectionProps {
  data: EngineeringData;
}

export const EngineeringSection: React.FC<EngineeringSectionProps> = ({ data }) => {
  const {
    pm200Progress,
    pm200Status,
    totalDoors,
    doorsApproved,
    doorsUnderReview,
    doorsOpenIssues,
    totalRequirements,
    compliantRequirements,
    totalRfqs,
    rfqsQuotesReceived,
    rfqsUnderEvaluation,
    rfqsAwarded,
  } = data;

  const compliancePercentage =
    totalRequirements > 0 ? Math.round((compliantRequirements / totalRequirements) * 100) : 0;

  return (
    <>
      {/* Engineering Overview */}
      <Card mode="elevated" style={styles.sectionCard}>
        <Card.Content>
          <Title style={styles.cardTitle}>Engineering Overview (PM200)</Title>
          <View style={styles.engineeringRow}>
            <View style={styles.engineeringMetric}>
              <Title style={styles.metricValue}>{pm200Progress}%</Title>
              <Paragraph style={styles.metricLabel}>Design Completion</Paragraph>
            </View>
            <View style={styles.engineeringMetric}>
              <Chip
                style={[
                  styles.statusChip,
                  {
                    backgroundColor:
                      pm200Status === 'completed'
                        ? COLORS.SUCCESS
                        : pm200Status === 'in_progress'
                        ? COLORS.INFO
                        : COLORS.DISABLED,
                  },
                ]}
                textStyle={{ color: '#fff', fontSize: 12 }}
              >
                {pm200Status.replace('_', ' ').toUpperCase()}
              </Chip>
              <Paragraph style={styles.metricLabel}>Status</Paragraph>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* DOORS Packages */}
      <Card mode="elevated" style={styles.sectionCard}>
        <Card.Content>
          <Title style={styles.cardTitle}>DOORS Packages</Title>
          <View style={styles.doorsRow}>
            <View style={styles.doorsMetric}>
              <Title style={styles.metricValue}>{totalDoors}</Title>
              <Paragraph style={styles.metricLabel}>Total Packages</Paragraph>
            </View>
            <Divider style={styles.verticalDivider} />
            <View style={styles.doorsMetric}>
              <Paragraph style={styles.doorsCount}>✅ {doorsApproved} Approved</Paragraph>
              <Paragraph style={styles.doorsCount}>🔄 {doorsUnderReview} Under Review</Paragraph>
              <Paragraph style={styles.doorsCount}>⚠️ {doorsOpenIssues} Open Issues</Paragraph>
            </View>
          </View>
          <Divider style={styles.divider} />
          <View style={styles.complianceRow}>
            <Paragraph style={styles.complianceLabel}>Requirements Compliance:</Paragraph>
            <Paragraph style={styles.complianceValue}>
              {compliantRequirements}/{totalRequirements} ({compliancePercentage}%)
            </Paragraph>
          </View>
          <ProgressBar
            progress={compliancePercentage / 100}
            color={
              compliancePercentage >= 80 ? COLORS.SUCCESS : compliancePercentage >= 50 ? '#FFC107' : COLORS.ERROR
            }
            style={styles.progressBar}
          />
        </Card.Content>
      </Card>

      {/* RFQ Status */}
      <Card mode="elevated" style={styles.sectionCard}>
        <Card.Content>
          <Title style={styles.cardTitle}>RFQ Status (Procurement)</Title>
          <View style={styles.rfqRow}>
            <View style={styles.rfqMetric}>
              <Title style={styles.metricValue}>{totalRfqs}</Title>
              <Paragraph style={styles.metricLabel}>Total RFQs</Paragraph>
            </View>
            <Divider style={styles.verticalDivider} />
            <View style={styles.rfqMetric}>
              <Paragraph style={styles.rfqCount}>📨 {rfqsQuotesReceived} Quotes Received</Paragraph>
              <Paragraph style={styles.rfqCount}>⚖️ {rfqsUnderEvaluation} Under Evaluation</Paragraph>
              <Paragraph style={styles.rfqCount}>✅ {rfqsAwarded} Awarded</Paragraph>
            </View>
          </View>
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
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  engineeringRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
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
  doorsRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  doorsMetric: {
    flex: 1,
    alignItems: 'center',
  },
  verticalDivider: {
    width: 1,
    height: '100%',
    marginHorizontal: 16,
  },
  doorsCount: {
    fontSize: 14,
    marginVertical: 4,
  },
  divider: {
    marginVertical: 12,
  },
  complianceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  complianceLabel: {
    fontSize: 14,
    color: '#666',
  },
  complianceValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  rfqRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  rfqMetric: {
    flex: 1,
    alignItems: 'center',
  },
  rfqCount: {
    fontSize: 14,
    marginVertical: 4,
  },
});
