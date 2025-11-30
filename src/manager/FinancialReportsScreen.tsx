import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Chip,
  Divider,
  ProgressBar,
  ActivityIndicator,
} from 'react-native-paper';
import { useManager } from './context/ManagerContext';
import { useDatabase } from '@nozbe/watermelondb/hooks';
import { Q } from '@nozbe/watermelondb';
import XLSX from 'xlsx';
import RNFS from 'react-native-fs';

interface FinancialData {
  // Budget Metrics
  projectBudget: number;
  budgetAllocated: number;
  budgetSpent: number;
  budgetRemaining: number;
  budgetUtilization: number;

  // Profitability Metrics
  contractValue: number;
  estimatedCost: number;
  actualCost: number;
  projectedProfit: number;
  profitMargin: number;

  // BOM Metrics
  totalBOMs: number;
  bomsDraft: number;
  bomsApproved: number;
  bomsLocked: number;
  bomTotalCost: number;
  bomActualCost: number;

  // PO Metrics
  totalPOs: number;
  totalPOValue: number;
  posDraft: number;
  posIssued: number;
  posInProgress: number;
  posDelivered: number;
  posClosed: number;

  // Cost by Category
  materialCost: number;
  laborCost: number;
  equipmentCost: number;
  subcontractorCost: number;
}

const FinancialReportsScreen = () => {
  const { projectId, projectInfo } = useManager();
  const database = useDatabase();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [financialData, setFinancialData] = useState<FinancialData>({
    projectBudget: 0,
    budgetAllocated: 0,
    budgetSpent: 0,
    budgetRemaining: 0,
    budgetUtilization: 0,
    contractValue: 0,
    estimatedCost: 0,
    actualCost: 0,
    projectedProfit: 0,
    profitMargin: 0,
    totalBOMs: 0,
    bomsDraft: 0,
    bomsApproved: 0,
    bomsLocked: 0,
    bomTotalCost: 0,
    bomActualCost: 0,
    totalPOs: 0,
    totalPOValue: 0,
    posDraft: 0,
    posIssued: 0,
    posInProgress: 0,
    posDelivered: 0,
    posClosed: 0,
    materialCost: 0,
    laborCost: 0,
    equipmentCost: 0,
    subcontractorCost: 0,
  });

  useEffect(() => {
    loadFinancialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const loadFinancialData = async () => {
    if (!projectId || !projectInfo) return;

    try {
      setLoading(true);

      // Get project budget from projectInfo
      const projectBudget = projectInfo.budget || 0;
      const contractValue = projectBudget;

      // Get all BOMs for the project
      const boms = await database.collections
        .get('boms')
        .query(Q.where('project_id', projectId))
        .fetch();

      const totalBOMs = boms.length;
      let bomsDraft = 0;
      let bomsApproved = 0;
      let bomsLocked = 0;
      let bomTotalCost = 0;

      boms.forEach((bom: any) => {
        if (bom.status === 'draft') bomsDraft++;
        else if (bom.status === 'approved') bomsApproved++;
        else if (bom.status === 'locked') bomsLocked++;
        bomTotalCost += bom.totalCost || 0;
      });

      // Get BOM items for cost by category
      const bomItemsCollection = database.collections.get('bom_items');
      const bomIds = boms.map((b) => b.id);

      let materialCost = 0;
      let laborCost = 0;
      let equipmentCost = 0;
      let subcontractorCost = 0;

      if (bomIds.length > 0) {
        const bomItems = await bomItemsCollection
          .query(Q.where('bom_id', Q.oneOf(bomIds)))
          .fetch();

        bomItems.forEach((item: any) => {
          const cost = item.totalCost || 0;
          switch (item.category) {
            case 'material':
              materialCost += cost;
              break;
            case 'labor':
              laborCost += cost;
              break;
            case 'equipment':
              equipmentCost += cost;
              break;
            case 'subcontractor':
              subcontractorCost += cost;
              break;
          }
        });
      }

      // Get all purchase orders for actual cost
      const allPOs = await database.collections
        .get('purchase_orders')
        .query(Q.where('project_id', projectId))
        .fetch();

      const totalPOs = allPOs.length;
      let totalPOValue = 0;
      let posDraft = 0;
      let posIssued = 0;
      let posInProgress = 0;
      let posDelivered = 0;
      let posClosed = 0;
      let actualCost = 0;

      allPOs.forEach((po: any) => {
        const poValue = po.poValue || 0;
        totalPOValue += poValue;

        switch (po.status) {
          case 'draft':
            posDraft++;
            break;
          case 'issued':
            posIssued++;
            break;
          case 'in_progress':
            posInProgress++;
            break;
          case 'delivered':
            posDelivered++;
            actualCost += poValue;
            break;
          case 'closed':
            posClosed++;
            actualCost += poValue;
            break;
        }
      });

      // Calculate budget metrics
      const budgetAllocated = bomTotalCost;
      const budgetSpent = actualCost;
      const budgetRemaining = projectBudget - budgetSpent;
      const budgetUtilization = projectBudget > 0 ? (budgetSpent / projectBudget) * 100 : 0;

      // Calculate profitability
      const estimatedCost = bomTotalCost;
      const projectedProfit = contractValue - actualCost;
      const profitMargin = contractValue > 0 ? (projectedProfit / contractValue) * 100 : 0;

      setFinancialData({
        projectBudget,
        budgetAllocated,
        budgetSpent,
        budgetRemaining,
        budgetUtilization: Math.round(budgetUtilization * 10) / 10,
        contractValue,
        estimatedCost,
        actualCost,
        projectedProfit,
        profitMargin: Math.round(profitMargin * 10) / 10,
        totalBOMs,
        bomsDraft,
        bomsApproved,
        bomsLocked,
        bomTotalCost,
        bomActualCost: actualCost,
        totalPOs,
        totalPOValue,
        posDraft,
        posIssued,
        posInProgress,
        posDelivered,
        posClosed,
        materialCost,
        laborCost,
        equipmentCost,
        subcontractorCost,
      });
    } catch (error) {
      console.error('[FinancialReports] Error loading financial data:', error);
      Alert.alert('Error', 'Failed to load financial data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadFinancialData();
  };

  const formatCurrency = (amount: number): string => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const getUtilizationColor = (utilization: number): string => {
    if (utilization <= 90) return '#4CAF50';
    if (utilization <= 100) return '#FFC107';
    return '#F44336';
  };

  const exportToExcel = async () => {
    if (!projectInfo) {
      Alert.alert('Error', 'No project information available');
      return;
    }

    try {
      setExporting(true);

      // Create workbook
      const wb = XLSX.utils.book_new();

      // Sheet 1: Financial Summary
      const summaryData = [
        ['FINANCIAL REPORT'],
        [],
        ['Project:', projectInfo.name],
        ['Client:', projectInfo.client || ''],
        ['Report Date:', new Date().toLocaleDateString('en-IN')],
        [],
        ['BUDGET OVERVIEW'],
        ['Total Project Budget:', formatCurrency(financialData.projectBudget)],
        ['Budget Allocated:', formatCurrency(financialData.budgetAllocated)],
        ['Budget Spent:', formatCurrency(financialData.budgetSpent)],
        ['Budget Remaining:', formatCurrency(financialData.budgetRemaining)],
        ['Budget Utilization:', `${financialData.budgetUtilization}%`],
        [],
        ['PROFITABILITY ANALYSIS'],
        ['Contract Value:', formatCurrency(financialData.contractValue)],
        ['Estimated Cost:', formatCurrency(financialData.estimatedCost)],
        ['Actual Cost to Date:', formatCurrency(financialData.actualCost)],
        ['Projected Profit:', formatCurrency(financialData.projectedProfit)],
        ['Profit Margin:', `${financialData.profitMargin}%`],
        [],
        ['BOM SUMMARY'],
        ['Total BOMs:', financialData.totalBOMs],
        ['Draft:', financialData.bomsDraft],
        ['Approved:', financialData.bomsApproved],
        ['Locked:', financialData.bomsLocked],
        ['BOM Total Cost:', formatCurrency(financialData.bomTotalCost)],
        ['Actual Cost:', formatCurrency(financialData.bomActualCost)],
        [],
        ['PURCHASE ORDERS'],
        ['Total POs:', financialData.totalPOs],
        ['Total PO Value:', formatCurrency(financialData.totalPOValue)],
        ['Draft:', financialData.posDraft],
        ['Issued:', financialData.posIssued],
        ['In Progress:', financialData.posInProgress],
        ['Delivered:', financialData.posDelivered],
        ['Closed:', financialData.posClosed],
      ];

      const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
      ws1['!cols'] = [{ wch: 25 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(wb, ws1, 'Summary');

      // Sheet 2: Cost Breakdown
      const costBreakdownData = [
        ['COST BREAKDOWN BY CATEGORY'],
        [],
        ['Category', 'Cost (₹)', 'Percentage'],
        [
          'Material',
          financialData.materialCost,
          financialData.bomTotalCost > 0
            ? `${((financialData.materialCost / financialData.bomTotalCost) * 100).toFixed(1)}%`
            : '0%',
        ],
        [
          'Labor',
          financialData.laborCost,
          financialData.bomTotalCost > 0
            ? `${((financialData.laborCost / financialData.bomTotalCost) * 100).toFixed(1)}%`
            : '0%',
        ],
        [
          'Equipment',
          financialData.equipmentCost,
          financialData.bomTotalCost > 0
            ? `${((financialData.equipmentCost / financialData.bomTotalCost) * 100).toFixed(1)}%`
            : '0%',
        ],
        [
          'Subcontractor',
          financialData.subcontractorCost,
          financialData.bomTotalCost > 0
            ? `${((financialData.subcontractorCost / financialData.bomTotalCost) * 100).toFixed(1)}%`
            : '0%',
        ],
        [],
        ['TOTAL', financialData.bomTotalCost, '100%'],
      ];

      const ws2 = XLSX.utils.aoa_to_sheet(costBreakdownData);
      ws2['!cols'] = [{ wch: 20 }, { wch: 20 }, { wch: 15 }];
      XLSX.utils.book_append_sheet(wb, ws2, 'Cost Breakdown');

      // Write to file
      const wbout = XLSX.write(wb, { type: 'binary', bookType: 'xlsx' });

      // Convert binary string to base64
      const base64 = RNFS.base64encode ? wbout : btoa(wbout);

      // Determine file path
      const timestamp = new Date().toISOString().split('T')[0];
      const fileName = `FinancialReport_${projectInfo.name.replace(/\s+/g, '_')}_${timestamp}.xlsx`;
      const filePath =
        Platform.OS === 'android'
          ? `${RNFS.DownloadDirectoryPath}/${fileName}`
          : `${RNFS.DocumentDirectoryPath}/${fileName}`;

      // Write file
      await RNFS.writeFile(filePath, base64, 'base64');

      Alert.alert(
        'Export Successful',
        `Financial report exported to:\n${filePath}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('[FinancialReports] Export error:', error);
      Alert.alert('Export Failed', 'Failed to export financial report');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Paragraph style={styles.loadingText}>Loading financial data...</Paragraph>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Header with Export Button */}
      <View style={styles.header}>
        <Title style={styles.screenTitle}>Financial Reports</Title>
        <Button
          mode="contained"
          onPress={exportToExcel}
          loading={exporting}
          disabled={exporting}
          icon="file-excel"
          style={styles.exportButton}
        >
          Export to Excel
        </Button>
      </View>

      {/* Budget Overview Card */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.cardTitle}>Budget Overview</Title>

          <View style={styles.budgetRow}>
            <View style={styles.budgetMetric}>
              <Paragraph style={styles.metricLabel}>Total Budget</Paragraph>
              <Title style={styles.metricValue}>{formatCurrency(financialData.projectBudget)}</Title>
            </View>
            <Divider style={styles.verticalDivider} />
            <View style={styles.budgetMetric}>
              <Paragraph style={styles.metricLabel}>Remaining</Paragraph>
              <Title style={[styles.metricValue, { color: financialData.budgetRemaining >= 0 ? '#4CAF50' : '#F44336' }]}>
                {formatCurrency(financialData.budgetRemaining)}
              </Title>
            </View>
          </View>

          <Divider style={styles.divider} />

          <View style={styles.budgetDetails}>
            <View style={styles.budgetDetailRow}>
              <Paragraph>Budget Allocated (BOM)</Paragraph>
              <Paragraph style={styles.budgetDetailValue}>{formatCurrency(financialData.budgetAllocated)}</Paragraph>
            </View>
            <View style={styles.budgetDetailRow}>
              <Paragraph>Budget Spent (POs)</Paragraph>
              <Paragraph style={styles.budgetDetailValue}>{formatCurrency(financialData.budgetSpent)}</Paragraph>
            </View>
          </View>

          <Divider style={styles.divider} />

          <Paragraph style={styles.utilizationLabel}>
            Budget Utilization: {financialData.budgetUtilization}%
          </Paragraph>
          <ProgressBar
            progress={Math.min(financialData.budgetUtilization / 100, 1)}
            color={getUtilizationColor(financialData.budgetUtilization)}
            style={styles.progressBar}
          />
          {financialData.budgetUtilization > 100 && (
            <Paragraph style={styles.warningText}>
              ⚠️ Budget exceeded by {formatCurrency(Math.abs(financialData.budgetRemaining))}
            </Paragraph>
          )}
        </Card.Content>
      </Card>

      {/* Profitability Analysis Card */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.cardTitle}>Profitability Analysis</Title>

          <View style={styles.profitRow}>
            <View style={styles.profitMetric}>
              <Paragraph style={styles.metricLabel}>Contract Value</Paragraph>
              <Title style={styles.metricValue}>{formatCurrency(financialData.contractValue)}</Title>
            </View>
            <Divider style={styles.verticalDivider} />
            <View style={styles.profitMetric}>
              <Paragraph style={styles.metricLabel}>Projected Profit</Paragraph>
              <Title style={[styles.metricValue, { color: financialData.projectedProfit >= 0 ? '#4CAF50' : '#F44336' }]}>
                {formatCurrency(financialData.projectedProfit)}
              </Title>
            </View>
          </View>

          <Divider style={styles.divider} />

          <View style={styles.costDetails}>
            <View style={styles.costDetailRow}>
              <Paragraph>Estimated Cost (BOM)</Paragraph>
              <Paragraph style={styles.costDetailValue}>{formatCurrency(financialData.estimatedCost)}</Paragraph>
            </View>
            <View style={styles.costDetailRow}>
              <Paragraph>Actual Cost to Date</Paragraph>
              <Paragraph style={styles.costDetailValue}>{formatCurrency(financialData.actualCost)}</Paragraph>
            </View>
          </View>

          <Divider style={styles.divider} />

          <View style={styles.marginRow}>
            <Paragraph style={styles.marginLabel}>Profit Margin</Paragraph>
            <Chip
              style={[
                styles.marginChip,
                { backgroundColor: financialData.profitMargin >= 0 ? '#4CAF50' : '#F44336' },
              ]}
              textStyle={{ color: '#fff', fontWeight: 'bold' }}
            >
              {financialData.profitMargin >= 0 ? '+' : ''}{financialData.profitMargin}%
            </Chip>
          </View>
        </Card.Content>
      </Card>

      {/* Cost Breakdown by Category Card */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.cardTitle}>Cost Breakdown by Category</Title>

          <View style={styles.categoryRow}>
            <View style={styles.categoryItem}>
              <Paragraph style={styles.categoryLabel}>🧱 Material</Paragraph>
              <Title style={styles.categoryValue}>{formatCurrency(financialData.materialCost)}</Title>
              <Paragraph style={styles.categoryPercent}>
                {financialData.bomTotalCost > 0
                  ? `${((financialData.materialCost / financialData.bomTotalCost) * 100).toFixed(1)}%`
                  : '0%'}
              </Paragraph>
            </View>
            <View style={styles.categoryItem}>
              <Paragraph style={styles.categoryLabel}>👷 Labor</Paragraph>
              <Title style={styles.categoryValue}>{formatCurrency(financialData.laborCost)}</Title>
              <Paragraph style={styles.categoryPercent}>
                {financialData.bomTotalCost > 0
                  ? `${((financialData.laborCost / financialData.bomTotalCost) * 100).toFixed(1)}%`
                  : '0%'}
              </Paragraph>
            </View>
          </View>

          <View style={styles.categoryRow}>
            <View style={styles.categoryItem}>
              <Paragraph style={styles.categoryLabel}>🚜 Equipment</Paragraph>
              <Title style={styles.categoryValue}>{formatCurrency(financialData.equipmentCost)}</Title>
              <Paragraph style={styles.categoryPercent}>
                {financialData.bomTotalCost > 0
                  ? `${((financialData.equipmentCost / financialData.bomTotalCost) * 100).toFixed(1)}%`
                  : '0%'}
              </Paragraph>
            </View>
            <View style={styles.categoryItem}>
              <Paragraph style={styles.categoryLabel}>🏗️ Subcontractor</Paragraph>
              <Title style={styles.categoryValue}>{formatCurrency(financialData.subcontractorCost)}</Title>
              <Paragraph style={styles.categoryPercent}>
                {financialData.bomTotalCost > 0
                  ? `${((financialData.subcontractorCost / financialData.bomTotalCost) * 100).toFixed(1)}%`
                  : '0%'}
              </Paragraph>
            </View>
          </View>

          <Divider style={styles.divider} />

          <View style={styles.totalRow}>
            <Paragraph style={styles.totalLabel}>Total BOM Cost</Paragraph>
            <Title style={styles.totalValue}>{formatCurrency(financialData.bomTotalCost)}</Title>
          </View>
        </Card.Content>
      </Card>

      {/* BOM Summary Card */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.cardTitle}>Bill of Materials Summary</Title>

          <View style={styles.bomRow}>
            <View style={styles.bomMetric}>
              <Title style={styles.bomCount}>{financialData.totalBOMs}</Title>
              <Paragraph style={styles.bomLabel}>Total BOMs</Paragraph>
            </View>
            <Divider style={styles.verticalDivider} />
            <View style={styles.bomStatus}>
              <Paragraph style={styles.bomStatusItem}>📝 {financialData.bomsDraft} Draft</Paragraph>
              <Paragraph style={styles.bomStatusItem}>✅ {financialData.bomsApproved} Approved</Paragraph>
              <Paragraph style={styles.bomStatusItem}>🔒 {financialData.bomsLocked} Locked</Paragraph>
            </View>
          </View>

          <Divider style={styles.divider} />

          <View style={styles.bomCostRow}>
            <View style={styles.bomCostItem}>
              <Paragraph style={styles.bomCostLabel}>BOM Total Cost</Paragraph>
              <Title style={styles.bomCostValue}>{formatCurrency(financialData.bomTotalCost)}</Title>
            </View>
            <View style={styles.bomCostItem}>
              <Paragraph style={styles.bomCostLabel}>Actual Cost</Paragraph>
              <Title style={styles.bomCostValue}>{formatCurrency(financialData.bomActualCost)}</Title>
            </View>
          </View>

          <View style={styles.varianceRow}>
            <Paragraph>Cost Variance</Paragraph>
            <Paragraph
              style={[
                styles.varianceValue,
                {
                  color:
                    financialData.bomActualCost - financialData.bomTotalCost <= 0
                      ? '#4CAF50'
                      : '#F44336',
                },
              ]}
            >
              {financialData.bomActualCost - financialData.bomTotalCost >= 0 ? '+' : ''}
              {formatCurrency(financialData.bomActualCost - financialData.bomTotalCost)}
            </Paragraph>
          </View>
        </Card.Content>
      </Card>

      {/* Purchase Orders Card */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.cardTitle}>Purchase Orders</Title>

          <View style={styles.poRow}>
            <View style={styles.poMetric}>
              <Title style={styles.poCount}>{financialData.totalPOs}</Title>
              <Paragraph style={styles.poLabel}>Total POs</Paragraph>
              <Paragraph style={styles.poValue}>{formatCurrency(financialData.totalPOValue)}</Paragraph>
            </View>
            <Divider style={styles.verticalDivider} />
            <View style={styles.poStatus}>
              <Paragraph style={styles.poStatusItem}>📝 {financialData.posDraft} Draft</Paragraph>
              <Paragraph style={styles.poStatusItem}>📤 {financialData.posIssued} Issued</Paragraph>
              <Paragraph style={styles.poStatusItem}>⏳ {financialData.posInProgress} In Progress</Paragraph>
              <Paragraph style={styles.poStatusItem}>📦 {financialData.posDelivered} Delivered</Paragraph>
              <Paragraph style={styles.poStatusItem}>✅ {financialData.posClosed} Closed</Paragraph>
            </View>
          </View>
        </Card.Content>
      </Card>

      <View style={styles.footer}>
        <Paragraph style={styles.footerText}>
          Report generated on {new Date().toLocaleDateString('en-IN')}
        </Paragraph>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  exportButton: {
    alignSelf: 'flex-start',
  },
  card: {
    margin: 16,
    marginBottom: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  budgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  budgetMetric: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  verticalDivider: {
    width: 1,
    height: '100%',
    backgroundColor: '#e0e0e0',
    marginHorizontal: 16,
  },
  divider: {
    marginVertical: 12,
    backgroundColor: '#e0e0e0',
  },
  budgetDetails: {
    marginVertical: 8,
  },
  budgetDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  budgetDetailValue: {
    fontWeight: '600',
    color: '#333',
  },
  utilizationLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  warningText: {
    marginTop: 8,
    color: '#F44336',
    fontSize: 12,
    fontWeight: '600',
  },
  profitRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  profitMetric: {
    flex: 1,
    alignItems: 'center',
  },
  costDetails: {
    marginVertical: 8,
  },
  costDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  costDetailValue: {
    fontWeight: '600',
    color: '#333',
  },
  marginRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  marginLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  marginChip: {
    height: 32,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  categoryItem: {
    flex: 1,
    alignItems: 'center',
    padding: 8,
  },
  categoryLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  categoryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  categoryPercent: {
    fontSize: 12,
    color: '#2196F3',
    marginTop: 2,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  bomRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  bomMetric: {
    flex: 1,
    alignItems: 'center',
  },
  bomCount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  bomLabel: {
    fontSize: 12,
    color: '#666',
  },
  bomStatus: {
    flex: 2,
    justifyContent: 'center',
  },
  bomStatusItem: {
    fontSize: 13,
    marginVertical: 2,
    color: '#333',
  },
  bomCostRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  bomCostItem: {
    flex: 1,
    alignItems: 'center',
  },
  bomCostLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  bomCostValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  varianceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  varianceValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  poRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  poMetric: {
    flex: 1,
    alignItems: 'center',
  },
  poCount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  poLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  poValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  poStatus: {
    flex: 2,
    justifyContent: 'center',
  },
  poStatusItem: {
    fontSize: 13,
    marginVertical: 2,
    color: '#333',
  },
  footer: {
    padding: 16,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
  },
});

export default FinancialReportsScreen;
