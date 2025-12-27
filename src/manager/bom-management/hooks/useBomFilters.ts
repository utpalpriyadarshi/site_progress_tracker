/**
 * useBomFilters Hook
 * Manages BOM filtering and tab state
 */

import { useState, useMemo } from 'react';
import BomModel from '../../../models/BomModel';

export const useBomFilters = (boms: BomModel[]) => {
  const [activeTab, setActiveTab] = useState<'estimating' | 'execution'>('estimating');

  // Filter BOMs by type
  const filteredBoms = useMemo(() => {
    return boms.filter(bom => bom.type === activeTab);
  }, [boms, activeTab]);

  return {
    activeTab,
    setActiveTab,
    filteredBoms,
  };
};
