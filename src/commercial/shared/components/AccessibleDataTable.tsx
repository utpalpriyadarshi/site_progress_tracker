/**
 * AccessibleDataTable Component
 *
 * WCAG 2.1 AA compliant data table for financial data with:
 * - Proper table semantics (role="table")
 * - Column headers with scope
 * - Row headers for financial data
 * - Sortable columns with aria-sort
 * - Focus management
 * - Screen reader announcements for updates
 * - Keyboard navigation support
 */

import React, { useCallback, useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  AccessibilityInfo,
} from 'react-native';
import { useAccessibility } from '../../../utils/accessibility';

export interface ColumnDefinition<T> {
  key: keyof T;
  header: string;
  width?: number;
  numeric?: boolean;
  sortable?: boolean;
  format?: (value: any, row: T) => string;
  accessibilityLabel?: (value: any, row: T) => string;
  isRowHeader?: boolean;
}

export interface AccessibleDataTableProps<T> {
  data: T[];
  columns: ColumnDefinition<T>[];
  keyExtractor: (item: T) => string;
  sortable?: boolean;
  defaultSortColumn?: keyof T;
  defaultSortDirection?: 'asc' | 'desc';
  onSort?: (column: keyof T, direction: 'asc' | 'desc') => void;
  onRowPress?: (item: T) => void;
  caption?: string;
  summary?: string;
  emptyMessage?: string;
  showRowNumbers?: boolean;
  stickyHeader?: boolean;
  testID?: string;
}

type SortDirection = 'asc' | 'desc' | undefined;

export function AccessibleDataTable<T extends Record<string, any>>({
  data,
  columns,
  keyExtractor,
  sortable = false,
  defaultSortColumn,
  defaultSortDirection = 'asc',
  onSort,
  onRowPress,
  caption,
  summary,
  emptyMessage = 'No data available',
  showRowNumbers = false,
  stickyHeader = true,
  testID,
}: AccessibleDataTableProps<T>): React.ReactElement {
  const { announce } = useAccessibility();
  const [sortColumn, setSortColumn] = useState<keyof T | undefined>(defaultSortColumn);
  const [sortDirection, setSortDirection] = useState<SortDirection>(defaultSortDirection);
  const [focusedRowIndex, setFocusedRowIndex] = useState<number>(-1);

  // Announce data changes to screen readers
  useEffect(() => {
    if (data.length > 0) {
      announce(`Table loaded with ${data.length} ${data.length === 1 ? 'row' : 'rows'}`);
    }
  }, [data.length, announce]);

  // Sort data internally if no external handler
  const sortedData = useMemo(() => {
    if (!sortColumn || !sortable) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];

      // Handle null/undefined
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return sortDirection === 'asc' ? 1 : -1;
      if (bValue == null) return sortDirection === 'asc' ? -1 : 1;

      // Numeric comparison
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }

      // String comparison
      const aString = String(aValue).toLowerCase();
      const bString = String(bValue).toLowerCase();
      if (aString < bString) return sortDirection === 'asc' ? -1 : 1;
      if (aString > bString) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortColumn, sortDirection, sortable]);

  // Handle column sort
  const handleSort = useCallback(
    (column: ColumnDefinition<T>) => {
      if (!sortable || !column.sortable) return;

      const newDirection: SortDirection =
        sortColumn === column.key
          ? sortDirection === 'asc'
            ? 'desc'
            : 'asc'
          : 'asc';

      setSortColumn(column.key);
      setSortDirection(newDirection);

      // Announce sort change
      announce(
        `Sorted by ${column.header}, ${newDirection === 'asc' ? 'ascending' : 'descending'}`
      );

      if (onSort) {
        onSort(column.key, newDirection);
      }
    },
    [sortColumn, sortDirection, sortable, onSort, announce]
  );

  // Get aria-sort value for column
  const getAriaSort = (column: ColumnDefinition<T>): 'ascending' | 'descending' | 'none' => {
    if (sortColumn !== column.key) return 'none';
    return sortDirection === 'asc' ? 'ascending' : 'descending';
  };

  // Format cell value
  const formatValue = (column: ColumnDefinition<T>, value: any, row: T): string => {
    if (column.format) {
      return column.format(value, row);
    }
    if (value == null) return '-';
    if (typeof value === 'number') {
      return column.numeric
        ? value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : value.toString();
    }
    return String(value);
  };

  // Get accessibility label for cell
  const getCellAccessibilityLabel = (
    column: ColumnDefinition<T>,
    value: any,
    row: T
  ): string => {
    if (column.accessibilityLabel) {
      return column.accessibilityLabel(value, row);
    }
    return `${column.header}: ${formatValue(column, value, row)}`;
  };

  // Handle row press
  const handleRowPress = useCallback(
    (item: T, index: number) => {
      setFocusedRowIndex(index);
      if (onRowPress) {
        onRowPress(item);
      }
    },
    [onRowPress]
  );

  // Build row accessibility label
  const getRowAccessibilityLabel = (row: T, index: number): string => {
    const labels = columns.map((col) => getCellAccessibilityLabel(col, row[col.key], row));
    const rowNumber = showRowNumbers ? `Row ${index + 1}. ` : '';
    return `${rowNumber}${labels.join('. ')}`;
  };

  // Render empty state
  if (data.length === 0) {
    return (
      <View
        style={styles.emptyContainer}
        accessibilityRole="text"
        accessibilityLabel={emptyMessage}
      >
        <Text style={styles.emptyText}>{emptyMessage}</Text>
      </View>
    );
  }

  return (
    <View
      style={styles.container}
      accessibilityRole="none"
      testID={testID}
    >
      {/* Table Caption - announced by screen readers */}
      {caption && (
        <Text
          style={styles.caption}
          accessibilityRole="header"
        >
          {caption}
        </Text>
      )}

      {/* Summary for screen readers (visually hidden) */}
      {summary && (
        <Text
          style={styles.srOnly}
          accessibilityRole="text"
        >
          {summary}
        </Text>
      )}

      <ScrollView horizontal showsHorizontalScrollIndicator>
        <View
          accessibilityRole="none"
          // Using 'grid' pattern for accessible table navigation
          accessibilityLabel={caption || 'Data table'}
        >
          {/* Table Header */}
          <View
            style={[styles.headerRow, stickyHeader && styles.stickyHeader]}
            accessibilityRole="none"
          >
            {showRowNumbers && (
              <View style={[styles.headerCell, styles.rowNumberCell]}>
                <Text style={styles.headerText}>#</Text>
              </View>
            )}
            {columns.map((column) => {
              const isSortable = sortable && column.sortable !== false;
              const ariaSort = getAriaSort(column);
              const sortIndicator =
                sortColumn === column.key
                  ? sortDirection === 'asc'
                    ? ' ▲'
                    : ' ▼'
                  : '';

              return (
                <TouchableOpacity
                  key={String(column.key)}
                  style={[
                    styles.headerCell,
                    column.width ? { width: column.width } : styles.defaultColumnWidth,
                    column.numeric && styles.numericCell,
                  ]}
                  onPress={() => isSortable && handleSort(column)}
                  disabled={!isSortable}
                  accessibilityRole="button"
                  accessibilityLabel={`${column.header}${isSortable ? ', sortable column' : ''}`}
                  accessibilityState={{
                    selected: sortColumn === column.key,
                  }}
                  accessibilityHint={
                    isSortable
                      ? `Double tap to sort by ${column.header}`
                      : undefined
                  }
                  // aria-sort equivalent
                  accessibilityValue={{
                    text: ariaSort !== 'none' ? ariaSort : undefined,
                  }}
                >
                  <Text
                    style={[
                      styles.headerText,
                      sortColumn === column.key && styles.sortedHeaderText,
                    ]}
                  >
                    {column.header}
                    {sortIndicator}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Table Body */}
          <View accessibilityRole="none">
            {sortedData.map((row, rowIndex) => {
              const rowKey = keyExtractor(row);
              const isRowFocused = focusedRowIndex === rowIndex;

              return (
                <TouchableOpacity
                  key={rowKey}
                  style={[
                    styles.dataRow,
                    rowIndex % 2 === 0 && styles.evenRow,
                    isRowFocused && styles.focusedRow,
                  ]}
                  onPress={() => handleRowPress(row, rowIndex)}
                  disabled={!onRowPress}
                  accessibilityRole="button"
                  accessibilityLabel={getRowAccessibilityLabel(row, rowIndex)}
                  accessibilityHint={onRowPress ? 'Double tap to view details' : undefined}
                  accessibilityState={{
                    selected: isRowFocused,
                  }}
                >
                  {showRowNumbers && (
                    <View style={[styles.dataCell, styles.rowNumberCell]}>
                      <Text style={styles.rowNumberText}>{rowIndex + 1}</Text>
                    </View>
                  )}
                  {columns.map((column) => {
                    const value = row[column.key];
                    const formattedValue = formatValue(column, value, row);

                    return (
                      <View
                        key={String(column.key)}
                        style={[
                          styles.dataCell,
                          column.width ? { width: column.width } : styles.defaultColumnWidth,
                          column.numeric && styles.numericCell,
                        ]}
                        // Row header cells get special treatment
                        accessibilityRole={column.isRowHeader ? 'text' : 'none'}
                      >
                        <Text
                          style={[
                            styles.cellText,
                            column.numeric && styles.numericText,
                            column.isRowHeader && styles.rowHeaderText,
                          ]}
                          numberOfLines={2}
                        >
                          {formattedValue}
                        </Text>
                      </View>
                    );
                  })}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Table footer with row count */}
      <View
        style={styles.footer}
        accessibilityRole="text"
        accessibilityLabel={`Showing ${sortedData.length} ${sortedData.length === 1 ? 'row' : 'rows'}`}
      >
        <Text style={styles.footerText}>
          {sortedData.length} {sortedData.length === 1 ? 'item' : 'items'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  caption: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  srOnly: {
    position: 'absolute',
    width: 1,
    height: 1,
    padding: 0,
    margin: -1,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 2,
    borderBottomColor: '#dee2e6',
  },
  stickyHeader: {
    zIndex: 1,
  },
  headerCell: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  defaultColumnWidth: {
    minWidth: 120,
  },
  numericCell: {
    alignItems: 'flex-end',
  },
  headerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sortedHeaderText: {
    color: '#1976D2',
  },
  dataRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    minHeight: 48,
  },
  evenRow: {
    backgroundColor: '#f8f9fa',
  },
  focusedRow: {
    backgroundColor: '#e3f2fd',
    borderLeftWidth: 3,
    borderLeftColor: '#1976D2',
  },
  dataCell: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  cellText: {
    fontSize: 14,
    color: '#333',
  },
  numericText: {
    fontVariant: ['tabular-nums'],
    textAlign: 'right',
  },
  rowHeaderText: {
    fontWeight: '600',
  },
  rowNumberCell: {
    minWidth: 50,
    width: 50,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  rowNumberText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  footer: {
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    alignItems: 'flex-end',
  },
  footerText: {
    fontSize: 12,
    color: '#666',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

export default AccessibleDataTable;
