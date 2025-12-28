/**
 * useDeliveryFilters Hook
 *
 * Manages filtering and searching for deliveries
 */

import { useState, useMemo } from 'react';
import { DeliverySchedule } from '../../../services/DeliverySchedulingService';
import { StatusFilter } from '../utils/deliveryConstants';

export const useDeliveryFilters = (
  deliveries: DeliverySchedule[],
  selectedProjectId?: string
) => {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter deliveries based on status, search, and project
  const filteredDeliveries = useMemo(() => {
    let filtered = deliveries;

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(d => d.status === statusFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(d =>
        d.deliveryNumber.toLowerCase().includes(query) ||
        d.materialName.toLowerCase().includes(query) ||
        d.siteName.toLowerCase().includes(query) ||
        d.supplierName.toLowerCase().includes(query)
      );
    }

    // Filter by selected project
    if (selectedProjectId) {
      filtered = filtered.filter(d => d.projectId === selectedProjectId);
    }

    // Sort by scheduled date
    return filtered.sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime());
  }, [deliveries, statusFilter, searchQuery, selectedProjectId]);

  return {
    statusFilter,
    setStatusFilter,
    searchQuery,
    setSearchQuery,
    filteredDeliveries,
  };
};
