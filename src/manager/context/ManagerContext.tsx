import React, { createContext, useContext, useState, ReactNode } from 'react';

/**
 * ManagerContext
 *
 * Provides shared state management across Manager role screens.
 * Similar to SiteProvider for Supervisor role.
 *
 * Features:
 * - Selected team tracking
 * - Filter state management
 * - Refresh trigger for data updates
 */

interface ManagerContextType {
  selectedTeamId: string | null;
  setSelectedTeamId: (id: string | null) => void;
  filterStatus: string | null;
  setFilterStatus: (status: string | null) => void;
  refreshTrigger: number;
  triggerRefresh: () => void;
}

const ManagerContext = createContext<ManagerContextType | undefined>(undefined);

export const ManagerProvider = ({ children }: { children: ReactNode }) => {
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const triggerRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <ManagerContext.Provider
      value={{
        selectedTeamId,
        setSelectedTeamId,
        filterStatus,
        setFilterStatus,
        refreshTrigger,
        triggerRefresh,
      }}
    >
      {children}
    </ManagerContext.Provider>
  );
};

export const useManagerContext = () => {
  const context = useContext(ManagerContext);
  if (!context) {
    throw new Error('useManagerContext must be used within ManagerProvider');
  }
  return context;
};
