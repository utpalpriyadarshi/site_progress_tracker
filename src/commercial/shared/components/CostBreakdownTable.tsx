/**
 * CostBreakdownTable - Shared Component
 * Tabular cost data with grouping, sorting, and totals
 *
 * Features:
 * - Grouping by category/date/poId
 * - Subtotals for groups
 * - Grand total row
 * - Budget comparison when provided
 * - Currency and date formatting
 * - Row press for details
 * - Empty state message
 * - Trend indicators
 */

import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Card, DataTable } from 'react-native-paper';
import type { CostBreakdownTableProps, Cost } from '../types';
import { COLORS } from '../../../theme/colors';

type SortField = 'category' | 'description' | 'amount' | 'costDate';
type SortOrder = 'asc' | 'desc';

const toRnpSortDirection = (order: SortOrder): 'ascending' | 'descending' =>
  order === 'asc' ? 'ascending' : 'descending';

export const CostBreakdownTable: React.FC<CostBreakdownTableProps> = ({
  costs,
  budgets,
  groupBy = 'category',
  showBudgetComparison = false,
  showTrends = false,
  dateRange,
  onCostPress,
  onCategoryPress,
}) => {
  const [sortField, setSortField] = useState<SortField>('costDate');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Format currency
  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Format date
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Get category color
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      labor: COLORS.INFO,
      materials: COLORS.SUCCESS,
      equipment: COLORS.WARNING,
      subcontractors: COLORS.STATUS_EVALUATED,
    };
    return colors[category.toLowerCase()] || COLORS.DISABLED;
  };

  // Sort costs
  const sortedCosts = useMemo(() => {
    const sorted = [...costs].sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      if (sortField === 'amount') {
        aValue = parseFloat(aValue);
        bValue = parseFloat(bValue);
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [costs, sortField, sortOrder]);

  // Group costs
  const groupedCosts = useMemo(() => {
    if (groupBy === 'category') {
      const groups: Record<string, Cost[]> = {};
      sortedCosts.forEach((cost) => {
        if (!groups[cost.category]) {
          groups[cost.category] = [];
        }
        groups[cost.category].push(cost);
      });
      return groups;
    } else if (groupBy === 'date') {
      const groups: Record<string, Cost[]> = {};
      sortedCosts.forEach((cost) => {
        const dateKey = formatDate(cost.costDate);
        if (!groups[dateKey]) {
          groups[dateKey] = [];
        }
        groups[dateKey].push(cost);
      });
      return groups;
    } else if (groupBy === 'poId') {
      const groups: Record<string, Cost[]> = {};
      sortedCosts.forEach((cost) => {
        const poKey = cost.poId || 'No PO';
        if (!groups[poKey]) {
          groups[poKey] = [];
        }
        groups[poKey].push(cost);
      });
      return groups;
    }
    return { All: sortedCosts };
  }, [sortedCosts, groupBy]);

  // Calculate totals
  const grandTotal = useMemo(() => {
    return costs.reduce((sum, cost) => sum + cost.amount, 0);
  }, [costs]);

  // Get budget for category
  const getBudgetForCategory = (category: string) => {
    if (!budgets || !showBudgetComparison) return null;
    const budget = budgets.find((b) => b.category === category);
    return budget ? budget.allocated : null;
  };

  // Handle sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Render empty state
  if (costs.length === 0) {
    return (
      <Card mode="elevated" style={styles.card}>
        <Card.Content>
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No cost data available</Text>
            {dateRange && (dateRange.startDate || dateRange.endDate) && (
              <Text style={styles.emptySubtext}>Try adjusting your date range filter</Text>
            )}
          </View>
        </Card.Content>
      </Card>
    );
  }

  return (
    <Card mode="elevated" style={styles.card}>
      <Card.Content>
        <View style={styles.header}>
          <Text style={styles.title}>Cost Breakdown</Text>
          <Text style={styles.subtitle}>
            {costs.length} {costs.length === 1 ? 'entry' : 'entries'}
          </Text>
        </View>

        {/* Date Range Filter Display */}
        {dateRange && (dateRange.startDate || dateRange.endDate) && (
          <View style={styles.dateRangeContainer}>
            <Text style={styles.dateRangeText}>
              {dateRange.startDate && formatDate(dateRange.startDate.getTime())}
              {dateRange.startDate && dateRange.endDate && ' - '}
              {dateRange.endDate && formatDate(dateRange.endDate.getTime())}
            </Text>
          </View>
        )}

        <ScrollView horizontal showsHorizontalScrollIndicator>
          <View>
            {/* Table Header */}
            <DataTable>
              <DataTable.Header style={styles.tableHeader}>
                <DataTable.Title
                  style={styles.colCategory}
                  onPress={() => handleSort('category')}
                  sortDirection={sortField === 'category' ? toRnpSortDirection(sortOrder) : undefined}
                >
                  Category
                </DataTable.Title>
                <DataTable.Title
                  style={styles.colDescription}
                  onPress={() => handleSort('description')}
                  sortDirection={sortField === 'description' ? toRnpSortDirection(sortOrder) : undefined}
                >
                  Description
                </DataTable.Title>
                <DataTable.Title
                  style={styles.colAmount}
                  numeric
                  onPress={() => handleSort('amount')}
                  sortDirection={sortField === 'amount' ? toRnpSortDirection(sortOrder) : undefined}
                >
                  Amount
                </DataTable.Title>
                <DataTable.Title
                  style={styles.colDate}
                  onPress={() => handleSort('costDate')}
                  sortDirection={sortField === 'costDate' ? toRnpSortDirection(sortOrder) : undefined}
                >
                  Date
                </DataTable.Title>
                {showBudgetComparison && (
                  <DataTable.Title style={styles.colBudget} numeric>
                    Budget
                  </DataTable.Title>
                )}
              </DataTable.Header>

              {/* Table Body - Grouped */}
              {Object.entries(groupedCosts).map(([group, groupCosts]) => {
                const subtotal = groupCosts.reduce((sum, cost) => sum + cost.amount, 0);
                const categoryBudget = getBudgetForCategory(group);

                return (
                  <View key={group}>
                    {/* Group Header */}
                    <TouchableOpacity
                      onPress={() => onCategoryPress && onCategoryPress(group)}
                      style={styles.groupHeaderContainer}
                    >
                      <View style={styles.groupHeader}>
                        <View style={styles.groupHeaderLeft}>
                          {groupBy === 'category' && (
                            <View
                              style={[
                                styles.categoryDot,
                                { backgroundColor: getCategoryColor(group) },
                              ]}
                            />
                          )}
                          <Text style={styles.groupTitle}>
                            {group.toUpperCase()} ({groupCosts.length})
                          </Text>
                        </View>
                        <Text style={styles.groupSubtotal}>{formatCurrency(subtotal)}</Text>
                      </View>
                    </TouchableOpacity>

                    {/* Group Rows */}
                    {groupCosts.map((cost) => (
                      <DataTable.Row
                        key={cost.id}
                        onPress={() => onCostPress && onCostPress(cost)}
                        style={styles.tableRow}
                      >
                        <DataTable.Cell style={styles.colCategory}>
                          <View style={styles.categoryCell}>
                            <View
                              style={[
                                styles.categoryDotSmall,
                                { backgroundColor: getCategoryColor(cost.category) },
                              ]}
                            />
                            <Text style={styles.cellText}>{cost.category}</Text>
                          </View>
                        </DataTable.Cell>
                        <DataTable.Cell style={styles.colDescription}>
                          <Text style={styles.cellText} numberOfLines={1}>
                            {cost.description}
                          </Text>
                        </DataTable.Cell>
                        <DataTable.Cell style={styles.colAmount} numeric>
                          <Text style={styles.amountText}>{formatCurrency(cost.amount)}</Text>
                        </DataTable.Cell>
                        <DataTable.Cell style={styles.colDate}>
                          <Text style={styles.dateText}>{formatDate(cost.costDate)}</Text>
                        </DataTable.Cell>
                        {showBudgetComparison && (
                          <DataTable.Cell style={styles.colBudget} numeric>
                            <Text style={styles.cellText}>
                              {categoryBudget ? formatCurrency(categoryBudget) : '-'}
                            </Text>
                          </DataTable.Cell>
                        )}
                      </DataTable.Row>
                    ))}

                    {/* Group Budget Comparison */}
                    {showBudgetComparison && categoryBudget && (
                      <View style={styles.budgetComparisonRow}>
                        <Text style={styles.budgetComparisonLabel}>
                          {group} Budget Variance:
                        </Text>
                        <Text
                          style={[
                            styles.budgetComparisonValue,
                            {
                              color: categoryBudget - subtotal >= 0 ? COLORS.SUCCESS : '#f44336',
                            },
                          ]}
                        >
                          {formatCurrency(categoryBudget - subtotal)}
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })}

              {/* Grand Total Row */}
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>GRAND TOTAL</Text>
                <Text style={styles.totalValue}>{formatCurrency(grandTotal)}</Text>
              </View>
            </DataTable>
          </View>
        </ScrollView>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    margin: 16,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
  },
  dateRangeContainer: {
    backgroundColor: '#f5f5f5',
    padding: 8,
    borderRadius: 4,
    marginBottom: 12,
  },
  dateRangeText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  tableHeader: {
    backgroundColor: '#f5f5f5',
  },
  tableRow: {
    minHeight: 48,
  },
  colCategory: {
    minWidth: 120,
  },
  colDescription: {
    minWidth: 200,
  },
  colAmount: {
    minWidth: 100,
  },
  colDate: {
    minWidth: 100,
  },
  colBudget: {
    minWidth: 100,
  },
  categoryCell: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  categoryDotSmall: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  cellText: {
    fontSize: 13,
    color: '#333',
  },
  amountText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  dateText: {
    fontSize: 12,
    color: '#666',
  },
  groupHeaderContainer: {
    backgroundColor: '#e3f2fd',
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  groupHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1976D2',
  },
  groupSubtotal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1976D2',
  },
  budgetComparisonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#f9f9f9',
  },
  budgetComparisonLabel: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  budgetComparisonValue: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#1976D2',
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#999',
    fontStyle: 'italic',
  },
});
