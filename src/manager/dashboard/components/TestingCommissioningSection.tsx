import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Title, Paragraph, Chip, Divider, ProgressBar } from 'react-native-paper';

interface TestingCommissioningData {
  pm500Progress: number;
  pm500Status: string;
  pm600Progress: number;
  pm600Status: string;
  itemsInPreCommissioning: number;
  itemsInCommissioning: number;
  testsCompleted: number;
  testsPending: number;
  systemsEnergized: number;
  systemsOperational: number;
  totalInspections: number;
  inspectionsPassed: number;
  inspectionsFailed: number;
}

interface TestingCommissioningSectionProps {
  data: TestingCommissioningData;
}

export const TestingCommissioningSection: React.FC<TestingCommissioningSectionProps> = ({ data }) => {
  const {
    pm500Progress,
    pm500Status,
    pm600Progress,
    pm600Status,
    itemsInPreCommissioning,
    itemsInCommissioning,
    testsCompleted,
    testsPending,
    systemsEnergized,
    systemsOperational,
    totalInspections,
    inspectionsPassed,
    inspectionsFailed,
  } = data;

  const passRate = totalInspections > 0 ? Math.round((inspectionsPassed / totalInspections) * 100) : 0;

  return (
    <>
      {/* 6.1 Pre-commissioning (PM500) & Commissioning (PM600) */}
      <Card style={styles.sectionCard}>
        <Card.Content>
          <Title style={styles.cardTitle}>Pre-commissioning & Commissioning Overview</Title>
          <View style={styles.testingRow}>
            {/* PM500 */}
            <View style={styles.testingItem}>
              <Paragraph style={styles.testingLabel}>Pre-commissioning (PM500)</Paragraph>
              <Title style={styles.testingValue}>{pm500Progress}%</Title>
              <Chip
                style={[
                  styles.statusChip,
                  {
                    backgroundColor:
                      pm500Status === 'completed'
                        ? '#4CAF50'
                        : pm500Status === 'in_progress'
                        ? '#2196F3'
                        : '#9E9E9E',
                  },
                ]}
                textStyle={{ color: '#fff', fontSize: 11 }}
              >
                {pm500Status.replace('_', ' ').toUpperCase()}
              </Chip>
              <Paragraph style={styles.testingCount}>
                {itemsInPreCommissioning} Items in Phase
              </Paragraph>
            </View>

            <Divider style={styles.verticalDivider} />

            {/* PM600 */}
            <View style={styles.testingItem}>
              <Paragraph style={styles.testingLabel}>Commissioning (PM600)</Paragraph>
              <Title style={styles.testingValue}>{pm600Progress}%</Title>
              <Chip
                style={[
                  styles.statusChip,
                  {
                    backgroundColor:
                      pm600Status === 'completed'
                        ? '#4CAF50'
                        : pm600Status === 'in_progress'
                        ? '#2196F3'
                        : '#9E9E9E',
                  },
                ]}
                textStyle={{ color: '#fff', fontSize: 11 }}
              >
                {pm600Status.replace('_', ' ').toUpperCase()}
              </Chip>
              <Paragraph style={styles.testingCount}>
                {itemsInCommissioning} Items in Phase
              </Paragraph>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* 6.2 Testing & Systems Status */}
      <Card style={styles.sectionCard}>
        <Card.Content>
          <Title style={styles.cardTitle}>Testing & Systems Status</Title>
          <View style={styles.systemsRow}>
            <View style={styles.systemsLeft}>
              <Paragraph style={styles.systemsLabel}>Tests Progress:</Paragraph>
              <Paragraph style={styles.systemsItem}>
                ✅ {testsCompleted} Completed
              </Paragraph>
              <Paragraph style={styles.systemsItem}>
                ⏳ {testsPending} Pending
              </Paragraph>
            </View>
            <Divider style={styles.verticalDivider} />
            <View style={styles.systemsRight}>
              <Paragraph style={styles.systemsLabel}>Systems Status:</Paragraph>
              <Paragraph style={styles.systemsItem}>
                ⚡ {systemsEnergized} Energized
              </Paragraph>
              <Paragraph style={styles.systemsItem}>
                ✅ {systemsOperational} Operational
              </Paragraph>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* 6.3 Quality Inspections */}
      <Card style={styles.sectionCard}>
        <Card.Content>
          <Title style={styles.cardTitle}>Quality Inspections</Title>
          <View style={styles.inspectionRow}>
            <View style={styles.inspectionLeft}>
              <Title style={styles.inspectionTotal}>{totalInspections}</Title>
              <Paragraph style={styles.inspectionLabel}>Total Inspections</Paragraph>
            </View>
            <Divider style={styles.verticalDivider} />
            <View style={styles.inspectionRight}>
              <Paragraph style={styles.inspectionItem}>
                ✅ {inspectionsPassed} Passed
              </Paragraph>
              <Paragraph style={styles.inspectionItem}>
                ❌ {inspectionsFailed} Failed
              </Paragraph>
            </View>
          </View>
          <Divider style={styles.divider} />
          <View style={styles.passRateRow}>
            <Paragraph style={styles.passRateLabel}>Pass Rate:</Paragraph>
            <Paragraph
              style={[
                styles.passRateValue,
                { color: passRate >= 90 ? '#4CAF50' : passRate >= 70 ? '#FFC107' : '#F44336' },
              ]}
            >
              {passRate}%
            </Paragraph>
          </View>
          <ProgressBar
            progress={passRate / 100}
            color={passRate >= 90 ? '#4CAF50' : passRate >= 70 ? '#FFC107' : '#F44336'}
            style={styles.progressBar}
          />
          {inspectionsFailed > 0 && (
            <Paragraph style={styles.warningText}>
              ⚠️ {inspectionsFailed} inspections require rework
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
  testingRow: {
    flexDirection: 'row',
  },
  testingItem: {
    flex: 1,
    alignItems: 'center',
  },
  testingLabel: {
    fontSize: 11,
    color: '#666',
    marginBottom: 8,
  },
  testingValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  statusChip: {
    marginTop: 8,
  },
  testingCount: {
    fontSize: 10,
    color: '#999',
    marginTop: 8,
  },
  verticalDivider: {
    width: 1,
    marginHorizontal: 16,
  },
  systemsRow: {
    flexDirection: 'row',
  },
  systemsLeft: {
    flex: 1,
    paddingRight: 8,
  },
  systemsRight: {
    flex: 1,
    paddingLeft: 8,
  },
  systemsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  systemsItem: {
    fontSize: 12,
    color: '#666',
    marginVertical: 4,
  },
  inspectionRow: {
    flexDirection: 'row',
  },
  inspectionLeft: {
    flex: 1,
    alignItems: 'center',
  },
  inspectionTotal: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  inspectionLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
  },
  inspectionRight: {
    flex: 1,
    justifyContent: 'center',
  },
  inspectionItem: {
    fontSize: 12,
    color: '#333',
    marginVertical: 4,
  },
  divider: {
    marginVertical: 12,
  },
  passRateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  passRateLabel: {
    fontSize: 12,
    color: '#666',
  },
  passRateValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  warningText: {
    fontSize: 12,
    color: '#F44336',
    marginTop: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
