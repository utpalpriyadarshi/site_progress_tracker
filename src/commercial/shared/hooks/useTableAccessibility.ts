/**
 * useTableAccessibility - Custom hook for table accessibility features
 *
 * Provides utilities for:
 * - Screen reader announcements for table changes
 * - Row/cell navigation state
 * - Sort state announcements
 * - Selection state management
 * - Focus management
 *
 * Usage:
 * ```ts
 * const {
 *   announceSort,
 *   announceRowCount,
 *   announceSelection,
 *   getRowAccessibilityProps,
 *   getCellAccessibilityProps,
 * } = useTableAccessibility({ rowCount: data.length });
 * ```
 */

import { useCallback, useState, useRef, useEffect } from 'react';
import { useAccessibility } from '../../../utils/accessibility';

export interface UseTableAccessibilityOptions {
  rowCount: number;
  columnCount?: number;
  tableName?: string;
  announceOnMount?: boolean;
}

export interface RowAccessibilityProps {
  accessibilityRole: 'button' | 'none';
  accessibilityLabel: string;
  accessibilityHint?: string;
  accessibilityState: {
    selected?: boolean;
    expanded?: boolean;
  };
}

export interface CellAccessibilityProps {
  accessibilityRole: 'text' | 'none';
  accessibilityLabel: string;
}

export interface SortState {
  column: string;
  direction: 'ascending' | 'descending';
}

export const useTableAccessibility = ({
  rowCount,
  columnCount = 0,
  tableName = 'Data table',
  announceOnMount = true,
}: UseTableAccessibilityOptions) => {
  const { announce, isScreenReaderEnabled } = useAccessibility();
  const [selectedRowIndex, setSelectedRowIndex] = useState<number>(-1);
  const [focusedCellIndex, setFocusedCellIndex] = useState<{ row: number; col: number }>({
    row: -1,
    col: -1,
  });
  const previousRowCount = useRef(rowCount);
  const [isScreenReader, setIsScreenReader] = useState(false);

  // Check if screen reader is enabled
  useEffect(() => {
    const checkScreenReader = async () => {
      const enabled = await isScreenReaderEnabled();
      setIsScreenReader(enabled);
    };
    checkScreenReader();
  }, [isScreenReaderEnabled]);

  // Announce row count on mount and when it changes
  useEffect(() => {
    if (announceOnMount && rowCount !== previousRowCount.current) {
      const change = rowCount - previousRowCount.current;
      if (change > 0) {
        announce(`${change} ${change === 1 ? 'row' : 'rows'} added. Total: ${rowCount}`);
      } else if (change < 0) {
        announce(
          `${Math.abs(change)} ${Math.abs(change) === 1 ? 'row' : 'rows'} removed. Total: ${rowCount}`
        );
      }
      previousRowCount.current = rowCount;
    }
  }, [rowCount, announce, announceOnMount]);

  /**
   * Announces sort state change
   */
  const announceSort = useCallback(
    (sortState: SortState) => {
      announce(`Sorted by ${sortState.column}, ${sortState.direction}`);
    },
    [announce]
  );

  /**
   * Announces current row count
   */
  const announceRowCount = useCallback(
    (customMessage?: string) => {
      const message = customMessage || `${tableName} has ${rowCount} ${rowCount === 1 ? 'row' : 'rows'}`;
      announce(message);
    },
    [announce, rowCount, tableName]
  );

  /**
   * Announces row selection
   */
  const announceSelection = useCallback(
    (rowIndex: number, rowLabel?: string) => {
      setSelectedRowIndex(rowIndex);
      const label = rowLabel || `Row ${rowIndex + 1}`;
      announce(`${label} selected`);
    },
    [announce]
  );

  /**
   * Announces filtered results
   */
  const announceFilterResults = useCallback(
    (resultCount: number, filterDescription?: string) => {
      const filterText = filterDescription ? ` for ${filterDescription}` : '';
      announce(`${resultCount} ${resultCount === 1 ? 'result' : 'results'} found${filterText}`);
    },
    [announce]
  );

  /**
   * Announces data loading state
   */
  const announceLoading = useCallback(
    (isLoading: boolean) => {
      announce(isLoading ? `${tableName} loading` : `${tableName} loaded`);
    },
    [announce, tableName]
  );

  /**
   * Announces error state
   */
  const announceError = useCallback(
    (errorMessage: string) => {
      announce(`Error: ${errorMessage}`);
    },
    [announce]
  );

  /**
   * Gets accessibility props for a table row
   */
  const getRowAccessibilityProps = useCallback(
    (
      rowIndex: number,
      rowData: { label: string; hint?: string; isSelected?: boolean; isExpanded?: boolean }
    ): RowAccessibilityProps => {
      return {
        accessibilityRole: 'button',
        accessibilityLabel: `Row ${rowIndex + 1}. ${rowData.label}`,
        accessibilityHint: rowData.hint,
        accessibilityState: {
          selected: rowData.isSelected ?? selectedRowIndex === rowIndex,
          expanded: rowData.isExpanded,
        },
      };
    },
    [selectedRowIndex]
  );

  /**
   * Gets accessibility props for a table cell
   */
  const getCellAccessibilityProps = useCallback(
    (
      columnHeader: string,
      cellValue: string,
      isRowHeader: boolean = false
    ): CellAccessibilityProps => {
      return {
        accessibilityRole: isRowHeader ? 'text' : 'none',
        accessibilityLabel: `${columnHeader}: ${cellValue}`,
      };
    },
    []
  );

  /**
   * Generates table summary for screen readers
   */
  const getTableSummary = useCallback(
    (additionalInfo?: string): string => {
      const baseSummary = `${tableName} with ${rowCount} ${rowCount === 1 ? 'row' : 'rows'}`;
      const columnInfo = columnCount > 0 ? ` and ${columnCount} columns` : '';
      const extra = additionalInfo ? `. ${additionalInfo}` : '';
      return `${baseSummary}${columnInfo}${extra}`;
    },
    [tableName, rowCount, columnCount]
  );

  /**
   * Formats currency value for screen reader
   */
  const formatCurrencyForScreenReader = useCallback(
    (amount: number, currency: string = 'USD'): string => {
      const formatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
      }).format(amount);

      // Convert to more natural speech
      // e.g., "$1,234.56" -> "1,234 dollars and 56 cents"
      const parts = amount.toFixed(2).split('.');
      const dollars = parseInt(parts[0]).toLocaleString();
      const cents = parseInt(parts[1]);

      if (cents === 0) {
        return `${dollars} dollars`;
      }
      return `${dollars} dollars and ${cents} cents`;
    },
    []
  );

  /**
   * Formats percentage for screen reader
   */
  const formatPercentageForScreenReader = useCallback((value: number): string => {
    return `${value.toFixed(1)} percent`;
  }, []);

  /**
   * Formats date for screen reader
   */
  const formatDateForScreenReader = useCallback((date: Date | number): string => {
    const d = typeof date === 'number' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, []);

  /**
   * Navigate to next row
   */
  const navigateToNextRow = useCallback(() => {
    setFocusedCellIndex((prev) => ({
      ...prev,
      row: Math.min(prev.row + 1, rowCount - 1),
    }));
  }, [rowCount]);

  /**
   * Navigate to previous row
   */
  const navigateToPreviousRow = useCallback(() => {
    setFocusedCellIndex((prev) => ({
      ...prev,
      row: Math.max(prev.row - 1, 0),
    }));
  }, []);

  /**
   * Navigate to next cell
   */
  const navigateToNextCell = useCallback(() => {
    setFocusedCellIndex((prev) => {
      if (prev.col >= columnCount - 1) {
        // Move to first cell of next row
        return {
          row: Math.min(prev.row + 1, rowCount - 1),
          col: 0,
        };
      }
      return {
        ...prev,
        col: prev.col + 1,
      };
    });
  }, [columnCount, rowCount]);

  /**
   * Navigate to previous cell
   */
  const navigateToPreviousCell = useCallback(() => {
    setFocusedCellIndex((prev) => {
      if (prev.col <= 0) {
        // Move to last cell of previous row
        return {
          row: Math.max(prev.row - 1, 0),
          col: columnCount - 1,
        };
      }
      return {
        ...prev,
        col: prev.col - 1,
      };
    });
  }, [columnCount]);

  return {
    // Announcement functions
    announceSort,
    announceRowCount,
    announceSelection,
    announceFilterResults,
    announceLoading,
    announceError,

    // Props generators
    getRowAccessibilityProps,
    getCellAccessibilityProps,
    getTableSummary,

    // Formatters for screen readers
    formatCurrencyForScreenReader,
    formatPercentageForScreenReader,
    formatDateForScreenReader,

    // Navigation state
    selectedRowIndex,
    setSelectedRowIndex,
    focusedCellIndex,
    setFocusedCellIndex,
    navigateToNextRow,
    navigateToPreviousRow,
    navigateToNextCell,
    navigateToPreviousCell,

    // State
    isScreenReaderActive: isScreenReader,
  };
};

export default useTableAccessibility;
