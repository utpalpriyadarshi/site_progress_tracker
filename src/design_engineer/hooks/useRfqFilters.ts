import { useState, useEffect } from 'react';
import { DesignRfq } from '../types/DesignRfqTypes';

export const useRfqFilters = (rfqs: DesignRfq[]) => {
  const [filteredRfqs, setFilteredRfqs] = useState<DesignRfq[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | null>(null);

  useEffect(() => {
    applyFilters();
  }, [rfqs, searchQuery, filterStatus]);

  const applyFilters = () => {
    let filtered = [...rfqs];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (rfq) =>
          rfq.rfqNumber.toLowerCase().includes(query) ||
          rfq.title.toLowerCase().includes(query) ||
          rfq.doorsId.toLowerCase().includes(query)
      );
    }

    if (filterStatus) {
      filtered = filtered.filter((rfq) => rfq.status === filterStatus);
    }

    setFilteredRfqs(filtered);
  };

  return {
    filteredRfqs,
    searchQuery,
    setSearchQuery,
    filterStatus,
    setFilterStatus,
  };
};
