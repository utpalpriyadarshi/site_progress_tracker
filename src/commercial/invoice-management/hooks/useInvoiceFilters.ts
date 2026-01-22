import { useMemo, useCallback } from 'react';
import { Invoice } from './useInvoiceData';
import { useDebounceSearch, useMemoizedFilters, FilterPredicates } from '../../shared/hooks';

/**
 * useInvoiceFilters - Optimized hook for invoice filtering
 *
 * Features:
 * - Debounced search (300ms) with caching
 * - Memoized status filtering
 * - Combined search + filter results
 * - Performance optimized for large lists
 */
export const useInvoiceFilters = (invoices: Invoice[], selectedStatus: string | null) => {
  // Define filter predicates
  const filterDefinitions = useMemo(
    () => ({
      status: (invoice: Invoice, status: string) => invoice.paymentStatus === status,
      dateRange: FilterPredicates.dateRange<Invoice>('invoiceDate'),
      amountRange: FilterPredicates.numberRange<Invoice>('amount'),
    }),
    []
  );

  // Use debounced search for text queries
  const {
    searchQuery,
    setSearchQuery,
    filteredItems: searchResults,
    isSearching,
    clearSearch,
    isSearchActive,
  } = useDebounceSearch({
    items: invoices,
    searchFields: ['invoiceNumber', 'poId', 'vendorName'],
    debounceMs: 300,
    cacheResults: true,
    minQueryLength: 1,
  });

  // Use memoized filters for status filtering
  const {
    filteredItems: statusFilteredItems,
    setFilter,
    clearFilter,
    filterCount,
  } = useMemoizedFilters({
    items: searchResults, // Apply filters on search results
    filters: filterDefinitions,
    initialFilters: selectedStatus ? { status: selectedStatus } : {},
  });

  // Update status filter when selectedStatus prop changes
  useMemo(() => {
    if (selectedStatus) {
      setFilter('status', selectedStatus);
    } else {
      clearFilter('status');
    }
  }, [selectedStatus, setFilter, clearFilter]);

  // Final filtered invoices
  const filteredInvoices = statusFilteredItems;

  // Summary calculations (memoized)
  const summary = useMemo(() => {
    const totalInvoices = invoices.length;
    const totalAmount = invoices.reduce((sum, inv) => sum + inv.amount, 0);
    const paidAmount = invoices
      .filter((inv) => inv.paymentStatus === 'paid')
      .reduce((sum, inv) => sum + inv.amount, 0);
    const pendingAmount = totalAmount - paidAmount;
    const overdueCount = invoices.filter((inv) => inv.paymentStatus === 'overdue').length;

    return {
      totalInvoices,
      totalAmount,
      paidAmount,
      pendingAmount,
      overdueCount,
    };
  }, [invoices]);

  // Filtered summary (for current view)
  const filteredSummary = useMemo(() => {
    const filteredTotal = filteredInvoices.length;
    const filteredAmount = filteredInvoices.reduce((sum, inv) => sum + inv.amount, 0);

    return {
      resultCount: filteredTotal,
      resultAmount: filteredAmount,
      isFiltered: isSearchActive || !!selectedStatus,
    };
  }, [filteredInvoices, isSearchActive, selectedStatus]);

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    clearSearch();
    clearFilter('status');
  }, [clearSearch, clearFilter]);

  return {
    // Search
    searchQuery,
    setSearchQuery,
    isSearching,
    clearSearch,
    isSearchActive,

    // Results
    filteredInvoices,
    resultCount: filteredInvoices.length,

    // Summaries
    summary,
    filteredSummary,

    // Filter management
    filterCount: filterCount + (isSearchActive ? 1 : 0),
    clearAllFilters,
    setFilter,
    clearFilter,
  };
};
