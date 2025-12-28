import { useState, useCallback, useMemo } from 'react';
import { Invoice } from './useInvoiceData';

export const useInvoiceFilters = (invoices: Invoice[], selectedStatus: string | null) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredInvoices = useMemo(() => {
    let filtered = [...invoices];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (invoice) =>
          invoice.invoiceNumber.toLowerCase().includes(query) ||
          invoice.poId.toLowerCase().includes(query) ||
          (invoice.vendorName && invoice.vendorName.toLowerCase().includes(query))
      );
    }

    // Status filter
    if (selectedStatus) {
      filtered = filtered.filter((invoice) => invoice.paymentStatus === selectedStatus);
    }

    return filtered;
  }, [invoices, searchQuery, selectedStatus]);

  // Summary calculations
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

  return {
    searchQuery,
    setSearchQuery,
    filteredInvoices,
    summary,
  };
};
