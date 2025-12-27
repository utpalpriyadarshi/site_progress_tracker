import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Title, Paragraph, Divider, ProgressBar } from 'react-native-paper';
import { formatCurrency } from '../utils/dashboardFormatters';

interface FinancialData {
  projectBudget: number;
  budgetAllocated: number;
  budgetSpent: number;
  budgetRemaining: number;
  budgetUtilization: number;
  contractValue: number;
  estimatedCost: number;
  actualCost: number;
  projectedProfit: number;
  profitMargin: number;
  totalBOMs: number;
  bomsDraft: number;
  bomsApproved: number;
  bomsLocked: number;
  bomTotalCost: number;
  bomActualCost: number;
}

interface FinancialSectionProps {
  data: FinancialData;
}

export const FinancialSection: React.FC<FinancialSectionProps> = ({ data }) => {
  const {
    projectBudget,
    budgetAllocated,
    budgetSpent,
    budgetRemaining,
    budgetUtilization,
    contractValue,
    estimatedCost,
    actualCost,
    projectedProfit,
    profitMargin,
    totalBOMs,
    bomsDraft,
    bomsApproved,
    bomsLocked,
    bomTotalCost,
    bomActualCost,
  } = data;

  const bomCostVariance = bomTotalCost - bomActualCost;
  const bomVariancePercent =
    bomTotalCost > 0 ? ((bomCostVariance / bomTotalCost) * 100) : 0;

  return (
    <>
      {/* 5.1 Budget Overview */}
      <Card style={styles.sectionCard}>
        <Card.Content>
          <Title style={styles.cardTitle}>Budget Overview</Title>
          <View style={styles.budgetRow}>
            <View style={styles.budgetMetric}>
              <Title style={styles.budgetValue}>{formatCurrency(projectBudget)}</Title>
              <Paragraph style={styles.budgetLabel}>Total Budget</Paragraph>
            </View>
            <Divider style={styles.verticalDivider} />
            <View style={styles.budgetMetric}>
              <Paragraph style={styles.budgetItem}>
                Allocated: {formatCurrency(budgetAllocated)}
              </Paragraph>
              <Paragraph style={styles.budgetItem}>
                Spent: {formatCurrency(budgetSpent)}
              </Paragraph>
              <Paragraph style={styles.budgetItem}>
                Remaining: {formatCurrency(budgetRemaining)}
              </Paragraph>
            </View>
          </View>
          <Divider style={styles.divider} />
          <View style={styles.utilizationRow}>
            <Paragraph style={styles.utilizationLabel}>Budget Utilization:</Paragraph>
            <Paragraph
              style={[
                styles.utilizationValue,
                { color: budgetUtilization > 100 ? '#F44336' : '#4CAF50' },
              ]}
            >
              {budgetUtilization}%
            </Paragraph>
          </View>
          <ProgressBar
            progress={Math.min(budgetUtilization / 100, 1)}
            color={budgetUtilization > 100 ? '#F44336' : budgetUtilization > 90 ? '#FFC107' : '#4CAF50'}
            style={styles.progressBar}
          />
        </Card.Content>
      </Card>

      {/* 5.2 Profitability */}
      <Card style={styles.sectionCard}>
        <Card.Content>
          <Title style={styles.cardTitle}>Profitability</Title>
          <View style={styles.profitRow}>
            <View style={styles.profitLeft}>
              <Paragraph style={styles.profitLabel}>Contract Value:</Paragraph>
              <Title style={styles.profitValue}>{formatCurrency(contractValue)}</Title>
            </View>
            <View style={styles.profitRight}>
              <Paragraph style={styles.profitItem}>
                Estimated Cost: {formatCurrency(estimatedCost)}
              </Paragraph>
              <Paragraph style={styles.profitItem}>
                Actual Cost: {formatCurrency(actualCost)}
              </Paragraph>
            </View>
          </View>
          <Divider style={styles.divider} />
          <View style={styles.marginRow}>
            <View style={styles.marginMetric}>
              <Title style={[styles.marginValue, { color: projectedProfit >= 0 ? '#4CAF50' : '#F44336' }]}>
                {formatCurrency(projectedProfit)}
              </Title>
              <Paragraph style={styles.marginLabel}>Projected Profit/Loss</Paragraph>
            </View>
            <Divider style={styles.verticalDivider} />
            <View style={styles.marginMetric}>
              <Title style={[styles.marginValue, { color: profitMargin >= 0 ? '#4CAF50' : '#F44336' }]}>
                {profitMargin}%
              </Title>
              <Paragraph style={styles.marginLabel}>Profit Margin</Paragraph>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* 5.3 BOM Summary */}
      <Card style={styles.sectionCard}>
        <Card.Content>
          <Title style={styles.cardTitle}>BOM Summary</Title>
          <View style={styles.bomRow}>
            <View style={styles.bomLeft}>
              <Title style={styles.bomTotal}>{totalBOMs}</Title>
              <Paragraph style={styles.bomLabel}>Total BOMs</Paragraph>
              <Paragraph style={styles.bomStatus}>
                📝 {bomsDraft} Draft | ✅ {bomsApproved} Approved | 🔒 {bomsLocked} Locked
              </Paragraph>
            </View>
            <Divider style={styles.verticalDivider} />
            <View style={styles.bomRight}>
              <Paragraph style={styles.bomCostLabel}>BOM Total Cost:</Paragraph>
              <Title style={styles.bomCostValue}>{formatCurrency(bomTotalCost)}</Title>
              <Paragraph style={styles.bomCostLabel}>Actual Cost:</Paragraph>
              <Paragraph style={styles.bomActual}>{formatCurrency(bomActualCost)}</Paragraph>
            </View>
          </View>
          <Divider style={styles.divider} />
          <View style={styles.varianceRow}>
            <Paragraph style={styles.varianceLabel}>Cost Variance:</Paragraph>
            <Paragraph
              style={[
                styles.varianceValue,
                { color: bomCostVariance >= 0 ? '#4CAF50' : '#F44336' },
              ]}
            >
              {formatCurrency(Math.abs(bomCostVariance))} ({bomCostVariance >= 0 ? '+' : '-'}
              {Math.abs(Math.round(bomVariancePercent * 10) / 10)}%)
            </Paragraph>
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
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  budgetRow: {
    flexDirection: 'row',
  },
  budgetMetric: {
    flex: 1,
    alignItems: 'center',
  },
  budgetValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  budgetLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
  },
  budgetItem: {
    fontSize: 12,
    color: '#333',
    marginVertical: 2,
  },
  verticalDivider: {
    width: 1,
    marginHorizontal: 16,
  },
  divider: {
    marginVertical: 12,
  },
  utilizationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  utilizationLabel: {
    fontSize: 12,
    color: '#666',
  },
  utilizationValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  profitRow: {
    flexDirection: 'row',
  },
  profitLeft: {
    flex: 1,
    alignItems: 'center',
  },
  profitLabel: {
    fontSize: 11,
    color: '#666',
    marginBottom: 8,
  },
  profitValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  profitRight: {
    flex: 1,
    justifyContent: 'center',
  },
  profitItem: {
    fontSize: 12,
    color: '#333',
    marginVertical: 2,
  },
  marginRow: {
    flexDirection: 'row',
  },
  marginMetric: {
    flex: 1,
    alignItems: 'center',
  },
  marginValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  marginLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  bomRow: {
    flexDirection: 'row',
  },
  bomLeft: {
    flex: 1,
    alignItems: 'center',
  },
  bomTotal: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  bomLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
  },
  bomStatus: {
    fontSize: 10,
    color: '#999',
    marginTop: 8,
  },
  bomRight: {
    flex: 1,
    justifyContent: 'center',
  },
  bomCostLabel: {
    fontSize: 11,
    color: '#666',
    marginVertical: 2,
  },
  bomCostValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  bomActual: {
    fontSize: 14,
    color: '#333',
  },
  varianceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  varianceLabel: {
    fontSize: 12,
    color: '#666',
  },
  varianceValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});
