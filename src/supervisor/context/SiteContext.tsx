import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SiteModel from '../../../models/SiteModel';

interface SiteContextType {
  selectedSiteId: string | 'all';
  setSelectedSiteId: (siteId: string | 'all') => void;
  selectedSite: SiteModel | null;
  setSelectedSite: (site: SiteModel | null) => void;
  supervisorId: string;
  setSupervisorId: (id: string) => void;
}

const SiteContext = createContext<SiteContextType | undefined>(undefined);

const STORAGE_KEY = '@supervisor_selected_site';
const SUPERVISOR_ID_KEY = '@supervisor_id';

interface SiteProviderProps {
  children: ReactNode;
}

export const SiteProvider: React.FC<SiteProviderProps> = ({ children }) => {
  const [selectedSiteId, setSelectedSiteIdState] = useState<string | 'all'>('all');
  const [selectedSite, setSelectedSite] = useState<SiteModel | null>(null);
  const [supervisorId, setSupervisorIdState] = useState<string>('supervisor-1'); // Default

  // Load saved site selection on mount
  useEffect(() => {
    const loadSavedSelection = async () => {
      try {
        const [savedSiteId, savedSupervisorId] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY),
          AsyncStorage.getItem(SUPERVISOR_ID_KEY),
        ]);

        if (savedSiteId) {
          setSelectedSiteIdState(savedSiteId);
        }

        if (savedSupervisorId) {
          setSupervisorIdState(savedSupervisorId);
        }
      } catch (error) {
        console.error('Error loading saved site selection:', error);
      }
    };

    loadSavedSelection();
  }, []);

  // Save site selection when it changes
  const setSelectedSiteId = async (siteId: string | 'all') => {
    setSelectedSiteIdState(siteId);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, siteId);
    } catch (error) {
      console.error('Error saving site selection:', error);
    }
  };

  // Save supervisor ID when it changes
  const setSupervisorId = async (id: string) => {
    setSupervisorIdState(id);
    try {
      await AsyncStorage.setItem(SUPERVISOR_ID_KEY, id);
    } catch (error) {
      console.error('Error saving supervisor ID:', error);
    }
  };

  const value: SiteContextType = {
    selectedSiteId,
    setSelectedSiteId,
    selectedSite,
    setSelectedSite,
    supervisorId,
    setSupervisorId,
  };

  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
};

export const useSiteContext = (): SiteContextType => {
  const context = useContext(SiteContext);
  if (context === undefined) {
    throw new Error('useSiteContext must be used within a SiteProvider');
  }
  return context;
};
