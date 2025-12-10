import { useState, useMemo, useCallback } from 'react';

/**
 * Individual checklist item
 */
export interface ChecklistItem {
  id: string;
  category: string;
  item: string;
  status: 'pass' | 'fail' | 'na';
  notes: string;
}

/**
 * Checklist summary with totals and category breakdown
 */
export interface ChecklistSummary {
  pass: number;
  fail: number;
  na: number;
  total: number;
  /** Summary grouped by category */
  byCategory: Record<string, {
    pass: number;
    fail: number;
    na: number;
    total: number;
  }>;
}

/**
 * Configuration options for the useChecklist hook
 */
export interface UseChecklistOptions {
  /** Initial checklist items (template) */
  defaultChecklist: ChecklistItem[];
  /** Initially expanded categories */
  initialExpanded?: string[];
}

/**
 * Return type for the useChecklist hook
 */
export interface UseChecklistReturn {
  /** Current checklist data */
  checklistData: ChecklistItem[];
  /** Set entire checklist (for edit mode) */
  setChecklistData: (data: ChecklistItem[]) => void;
  /** Expanded category IDs */
  expandedCategories: string[];
  /** Toggle category expansion */
  toggleCategory: (category: string) => void;
  /** Expand all categories */
  expandAll: () => void;
  /** Collapse all categories */
  collapseAll: () => void;
  /** Update item status */
  updateItemStatus: (id: string, status: ChecklistItem['status']) => void;
  /** Update item notes */
  updateItemNotes: (id: string, notes: string) => void;
  /** Update entire item */
  updateItem: (id: string, updates: Partial<Omit<ChecklistItem, 'id'>>) => void;
  /** Get checklist summary (memoized) */
  summary: ChecklistSummary;
  /** Get failed items only */
  failedItems: ChecklistItem[];
  /** Reset to default checklist */
  resetChecklist: () => void;
  /** Get unique categories */
  categories: string[];
}

/**
 * Custom hook for managing checklist state and operations
 *
 * Supports:
 * - Categorized checklist items
 * - Status tracking (pass/fail/na)
 * - Notes for failed items
 * - Category expansion/collapse
 * - Summary calculations (memoized for performance)
 *
 * @param options - Configuration options
 * @param options.defaultChecklist - Initial checklist template
 * @param options.initialExpanded - Initially expanded categories
 *
 * @returns Checklist state and handlers
 *
 * @example
 * ```tsx
 * const {
 *   checklistData,
 *   expandedCategories,
 *   toggleCategory,
 *   updateItemStatus,
 *   updateItemNotes,
 *   summary,
 *   resetChecklist
 * } = useChecklist({
 *   defaultChecklist: safetyChecklistTemplate,
 *   initialExpanded: ['PPE & Safety Equipment']
 * });
 * ```
 */
export function useChecklist(
  options: UseChecklistOptions
): UseChecklistReturn {
  const { defaultChecklist, initialExpanded = [] } = options;

  const [checklistData, setChecklistData] = useState<ChecklistItem[]>(defaultChecklist);
  const [expandedCategories, setExpandedCategories] = useState<string[]>(initialExpanded);

  /**
   * Toggle category expansion/collapse
   */
  const toggleCategory = useCallback((category: string) => {
    setExpandedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  }, []);

  /**
   * Expand all categories
   */
  const expandAll = useCallback(() => {
    const allCategories = Array.from(
      new Set(checklistData.map(item => item.category))
    );
    setExpandedCategories(allCategories);
  }, [checklistData]);

  /**
   * Collapse all categories
   */
  const collapseAll = useCallback(() => {
    setExpandedCategories([]);
  }, []);

  /**
   * Update item status
   */
  const updateItemStatus = useCallback((id: string, status: ChecklistItem['status']) => {
    setChecklistData(prev =>
      prev.map(item =>
        item.id === id
          ? {
              ...item,
              status,
              // Clear notes if status is not 'fail'
              notes: status === 'fail' ? item.notes : '',
            }
          : item
      )
    );
  }, []);

  /**
   * Update item notes
   */
  const updateItemNotes = useCallback((id: string, notes: string) => {
    setChecklistData(prev =>
      prev.map(item =>
        item.id === id ? { ...item, notes } : item
      )
    );
  }, []);

  /**
   * Update entire item with partial updates
   */
  const updateItem = useCallback((id: string, updates: Partial<Omit<ChecklistItem, 'id'>>) => {
    setChecklistData(prev =>
      prev.map(item =>
        item.id === id ? { ...item, ...updates } : item
      )
    );
  }, []);

  /**
   * Calculate checklist summary (memoized for performance)
   */
  const summary = useMemo((): ChecklistSummary => {
    const byCategory: ChecklistSummary['byCategory'] = {};

    checklistData.forEach(item => {
      if (!byCategory[item.category]) {
        byCategory[item.category] = { pass: 0, fail: 0, na: 0, total: 0 };
      }
      byCategory[item.category][item.status]++;
      byCategory[item.category].total++;
    });

    return {
      pass: checklistData.filter(i => i.status === 'pass').length,
      fail: checklistData.filter(i => i.status === 'fail').length,
      na: checklistData.filter(i => i.status === 'na').length,
      total: checklistData.length,
      byCategory,
    };
  }, [checklistData]);

  /**
   * Get failed items only (memoized)
   */
  const failedItems = useMemo(() => {
    return checklistData.filter(item => item.status === 'fail');
  }, [checklistData]);

  /**
   * Get unique categories (memoized)
   */
  const categories = useMemo(() => {
    return Array.from(new Set(checklistData.map(item => item.category)));
  }, [checklistData]);

  /**
   * Reset to default checklist
   */
  const resetChecklist = useCallback(() => {
    setChecklistData(defaultChecklist);
    setExpandedCategories(initialExpanded);
  }, [defaultChecklist, initialExpanded]);

  return {
    checklistData,
    setChecklistData,
    expandedCategories,
    toggleCategory,
    expandAll,
    collapseAll,
    updateItemStatus,
    updateItemNotes,
    updateItem,
    summary,
    failedItems,
    resetChecklist,
    categories,
  };
}
