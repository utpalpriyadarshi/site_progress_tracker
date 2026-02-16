import { useState, useEffect } from 'react';
import { DoorsPackage } from '../types/DoorsPackageTypes';

export const useDoorsPackageFilters = (packages: DoorsPackage[]) => {
  const [filteredPackages, setFilteredPackages] = useState<DoorsPackage[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [filterDomain, setFilterDomain] = useState<string | null>(null);

  useEffect(() => {
    applyFilters();
  }, [packages, searchQuery, filterStatus, filterCategory, filterDomain]);

  const applyFilters = () => {
    let filtered = [...packages];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (pkg) =>
          pkg.doorsId.toLowerCase().includes(query) ||
          pkg.equipmentType.toLowerCase().includes(query) ||
          (pkg.materialType && pkg.materialType.toLowerCase().includes(query)) ||
          (pkg.siteName && pkg.siteName.toLowerCase().includes(query)) ||
          (pkg.domainName && pkg.domainName.toLowerCase().includes(query))
      );
    }

    if (filterStatus) {
      filtered = filtered.filter((pkg) => pkg.status === filterStatus);
    }

    if (filterCategory) {
      filtered = filtered.filter((pkg) => pkg.category === filterCategory);
    }

    if (filterDomain) {
      filtered = filtered.filter((pkg) => pkg.domainId === filterDomain);
    }

    setFilteredPackages(filtered);
  };

  return {
    filteredPackages,
    searchQuery,
    setSearchQuery,
    filterStatus,
    setFilterStatus,
    filterCategory,
    setFilterCategory,
    filterDomain,
    setFilterDomain,
  };
};
