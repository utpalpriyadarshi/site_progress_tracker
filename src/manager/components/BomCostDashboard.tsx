import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import BomCalculatorService from '../../services/BomCalculatorService';
import BomModel from '../../../models/BomModel';
import BomItemModel from '../../../models/BomItemModel';

/**
 * BomCostDashboard
 *
 * Displays comprehensive cost analytics for a BOM
 *
 * Features:
 * - Cost summary cards
 * - Budget utilization indicator
 * - Category breakdown with percentages
 * - Cost Performance Index (CPI)
 * - Visual indicators (Green/Yellow/Red)
 * - Phase-wise cost breakdown
 */

interface BomCostDashboardProps {
  bom: BomModel;
  items: BomItemModel[];
}

const BomCostDashboard: React.FC<BomCostDashboardProps> = ({ bom, items }) => {
  const summary = BomCalculatorService.calculateCostSummary(bom, items);

  const renderKPICard = (
    title: string,
    value: string,
    subtitle?: string,
    color: string = '#2196F3'
  ) => (
    <View style={[styles.kpiCard, { borderLeftColor: color, borderLeftWidth: 4 }]}>
      <Text style={styles.kpiTitle}>{title}</Text>
      <Text style={[styles.kpiValue, { color }]}>{value}</Text>
      {subtitle && <Text style={styles.kpiSubtitle}>{subtitle}</Text>}
    </View>
  );

  const renderCategoryBar = (
    category: string,
    percentage: number,
    estimatedCost: number,
    actualCost: number,
    color: string
  ) => (
    <View key={category} style={styles.categoryRow}>
      <View style={styles.categoryHeader}>
        <Text style={styles.categoryLabel}>{category}</Text>
        <Text style={styles.categoryPercentage}>
          {BomCalculatorService.formatPercentage(percentage)}
        </Text>
      </View>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { width: `${Math.min(percentage, 100)}%`, backgroundColor: color }]} />
      </View>
      <View style={styles.categoryValues}>
        <Text style={styles.categoryEstimated}>
          Est: {BomCalculatorService.formatCurrency(estimatedCost)}
        </Text>
        {bom.type === 'execution' && actualCost > 0 && (
          <Text style={styles.categoryActual}>
            Act: {BomCalculatorService.formatCurrency(actualCost)}
          </Text>
        )}
      </View>
    </View>
  );

  const categoryColors: Record<string, string> = {
    material: '#2196F3',
    labor: '#4CAF50',
    equipment: '#FF9800',
    subcontractor: '#9C27B0',
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Main KPI Cards */}
      <View style={styles.kpiContainer}>
        {renderKPICard(
          'Total Estimated',
          BomCalculatorService.formatCurrency(summary.breakdown.totalEstimated),
          `${items.length} items`,
          '#2196F3'
        )}
        {bom.type === 'execution' && (
          renderKPICard(
            'Total Actual',
            BomCalculatorService.formatCurrency(summary.breakdown.totalActual),
            summary.costPerformance
              ? `Variance: ${BomCalculatorService.formatCurrency(summary.costPerformance.costVariance)}`
              : undefined,
            summary.breakdown.totalActual > summary.breakdown.totalEstimated ? '#F44336' : '#4CAF50'
          )
        )}
        {renderKPICard(
          'Grand Total',
          BomCalculatorService.formatCurrency(summary.breakdown.grandTotal),
          `Inc. ${bom.contingency}% contingency + ${bom.profitMargin}% profit`,
          '#FF9800'
        )}
      </View>

      {/* Budget Utilization (Execution BOMs only) */}
      {bom.type === 'execution' && summary.budgetUtilization && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Budget Utilization</Text>
          <View style={styles.budgetCard}>
            <View style={styles.budgetHeader}>
              <Text style={styles.budgetLabel}>
                {BomCalculatorService.formatPercentage(summary.budgetUtilization.budgetUtilization, 1)} Used
              </Text>
              <Text
                style={[
                  styles.budgetStatus,
                  {
                    color: BomCalculatorService.getBudgetStatusColor(
                      summary.budgetUtilization.budgetUtilization
                    ),
                  },
                ]}
              >
                {BomCalculatorService.getBudgetStatusLabel(summary.budgetUtilization.budgetUtilization)}
              </Text>
            </View>
            <View style={styles.budgetProgressContainer}>
              <View
                style={[
                  styles.budgetProgress,
                  {
                    width: `${Math.min(summary.budgetUtilization.budgetUtilization, 100)}%`,
                    backgroundColor: BomCalculatorService.getBudgetStatusColor(
                      summary.budgetUtilization.budgetUtilization
                    ),
                  },
                ]}
              />
            </View>
            <View style={styles.budgetDetails}>
              <View style={styles.budgetDetailRow}>
                <Text style={styles.budgetDetailLabel}>Budget:</Text>
                <Text style={styles.budgetDetailValue}>
                  {BomCalculatorService.formatCurrency(bom.contractValue || bom.totalEstimatedCost)}
                </Text>
              </View>
              <View style={styles.budgetDetailRow}>
                <Text style={styles.budgetDetailLabel}>Spent:</Text>
                <Text style={[styles.budgetDetailValue, { color: '#F44336' }]}>
                  {BomCalculatorService.formatCurrency(summary.budgetUtilization.spent)}
                </Text>
              </View>
              <View style={styles.budgetDetailRow}>
                <Text style={styles.budgetDetailLabel}>Remaining:</Text>
                <Text
                  style={[
                    styles.budgetDetailValue,
                    { color: summary.budgetUtilization.remaining >= 0 ? '#4CAF50' : '#F44336' },
                  ]}
                >
                  {BomCalculatorService.formatCurrency(summary.budgetUtilization.remaining)}
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Cost Performance Index (Execution BOMs only) */}
      {bom.type === 'execution' && summary.costPerformance && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cost Performance</Text>
          <View style={styles.performanceCard}>
            <View style={styles.performanceRow}>
              <Text style={styles.performanceLabel}>Cost Performance Index (CPI):</Text>
              <Text
                style={[
                  styles.performanceValue,
                  {
                    color:
                      summary.costPerformance.costPerformanceIndex >= 1
                        ? '#4CAF50'
                        : summary.costPerformance.costPerformanceIndex >= 0.9
                        ? '#FF9800'
                        : '#F44336',
                  },
                ]}
              >
                {summary.costPerformance.costPerformanceIndex.toFixed(2)}
              </Text>
            </View>
            <Text style={styles.performanceHint}>
              {summary.costPerformance.costPerformanceIndex > 1
                ? 'Under budget - Good performance'
                : summary.costPerformance.costPerformanceIndex === 1
                ? 'On budget - As planned'
                : 'Over budget - Review needed'}
            </Text>
            <View style={styles.performanceDivider} />
            <View style={styles.performanceRow}>
              <Text style={styles.performanceLabel}>Estimate at Completion:</Text>
              <Text style={styles.performanceValue}>
                {BomCalculatorService.formatCurrency(summary.costPerformance.estimateAtCompletion)}
              </Text>
            </View>
            <View style={styles.performanceRow}>
              <Text style={styles.performanceLabel}>Projected Variance:</Text>
              <Text
                style={[
                  styles.performanceValue,
                  {
                    color: summary.costPerformance.varianceAtCompletion >= 0 ? '#4CAF50' : '#F44336',
                  },
                ]}
              >
                {BomCalculatorService.formatCurrency(summary.costPerformance.varianceAtCompletion)}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Category Breakdown */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cost by Category</Text>
        <View style={styles.categoryContainer}>
          {summary.categoryBreakdown.map((cat) =>
            renderCategoryBar(
              cat.category.charAt(0).toUpperCase() + cat.category.slice(1),
              cat.percentage,
              cat.estimatedCost,
              cat.actualCost,
              categoryColors[cat.category] || '#757575'
            )
          )}
        </View>
      </View>

      {/* Phase Breakdown */}
      {summary.phaseBreakdown.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cost by Phase</Text>
          <View style={styles.phaseContainer}>
            {summary.phaseBreakdown.map((phase) => (
              <View key={phase.phase} style={styles.phaseRow}>
                <View style={styles.phaseHeader}>
                  <Text style={styles.phaseLabel}>{phase.phase}</Text>
                  <Text style={styles.phaseItemCount}>{phase.itemCount} items</Text>
                </View>
                <View style={styles.phaseValues}>
                  <Text style={styles.phaseEstimated}>
                    {BomCalculatorService.formatCurrency(phase.estimatedCost)}
                  </Text>
                  <Text style={styles.phasePercentage}>
                    {BomCalculatorService.formatPercentage(phase.percentage)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Cost Summary Table */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cost Summary</Text>
        <View style={styles.summaryTable}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Material:</Text>
            <Text style={styles.summaryValue}>
              {BomCalculatorService.formatCurrency(summary.breakdown.materialCost)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Labor:</Text>
            <Text style={styles.summaryValue}>
              {BomCalculatorService.formatCurrency(summary.breakdown.laborCost)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Equipment:</Text>
            <Text style={styles.summaryValue}>
              {BomCalculatorService.formatCurrency(summary.breakdown.equipmentCost)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subcontractor:</Text>
            <Text style={styles.summaryValue}>
              {BomCalculatorService.formatCurrency(summary.breakdown.subcontractorCost)}
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabelBold}>Subtotal:</Text>
            <Text style={styles.summaryValueBold}>
              {BomCalculatorService.formatCurrency(summary.breakdown.totalEstimated)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Contingency ({bom.contingency}%):</Text>
            <Text style={styles.summaryValue}>
              {BomCalculatorService.formatCurrency(summary.breakdown.contingencyAmount)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Profit ({bom.profitMargin}%):</Text>
            <Text style={styles.summaryValue}>
              {BomCalculatorService.formatCurrency(summary.breakdown.profitAmount)}
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabelGrand}>Grand Total:</Text>
            <Text style={styles.summaryValueGrand}>
              {BomCalculatorService.formatCurrency(summary.breakdown.grandTotal)}
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  kpiContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  kpiCard: {
    flex: 1,
    minWidth: 150,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
  },
  kpiTitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  kpiValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  kpiSubtitle: {
    fontSize: 11,
    color: '#999',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  budgetCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  budgetLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  budgetStatus: {
    fontSize: 14,
    fontWeight: '600',
  },
  budgetProgressContainer: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 16,
  },
  budgetProgress: {
    height: '100%',
    borderRadius: 4,
  },
  budgetDetails: {
    gap: 8,
  },
  budgetDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  budgetDetailLabel: {
    fontSize: 14,
    color: '#666',
  },
  budgetDetailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  performanceCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
  },
  performanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  performanceLabel: {
    fontSize: 14,
    color: '#666',
  },
  performanceValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  performanceHint: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  performanceDivider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 12,
  },
  categoryContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    gap: 16,
  },
  categoryRow: {
    marginBottom: 12,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  categoryPercentage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  categoryValues: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  categoryEstimated: {
    fontSize: 12,
    color: '#666',
  },
  categoryActual: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  phaseContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    gap: 12,
  },
  phaseRow: {
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  phaseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  phaseLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  phaseItemCount: {
    fontSize: 12,
    color: '#999',
  },
  phaseValues: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  phaseEstimated: {
    fontSize: 14,
    color: '#666',
  },
  phasePercentage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2196F3',
  },
  summaryTable: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    color: '#333',
  },
  summaryLabelBold: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  summaryValueBold: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  summaryLabelGrand: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  summaryValueGrand: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 8,
  },
});

export default BomCostDashboard;
