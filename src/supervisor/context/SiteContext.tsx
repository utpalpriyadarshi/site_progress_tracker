import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SiteModel from '../../../models/SiteModel';
import { database } from '../../../models/database';
import { useAuth } from '../../auth/AuthContext';

interface SiteContextType {
  selectedSiteId: string | 'all';
  setSelectedSiteId: (siteId: string | 'all') => void;
  selectedSite: SiteModel | null;
  setSelectedSite: (site: SiteModel | null) => void;
  supervisorId: string;
  setSupervisorId: (id: string) => void;
  projectId: string;
  setProjectId: (id: string) => void;
  projectName: string;
  setProjectName: (name: string) => void;
}

const SiteContext = createContext<SiteContextType | undefined>(undefined);

const STORAGE_KEY = '@supervisor_selected_site';
const SUPERVISOR_ID_KEY = '@supervisor_id';
const PROJECT_ID_KEY = '@supervisor_project_id';
const PROJECT_NAME_KEY = '@supervisor_project_name';

interface SiteProviderProps {
  children: ReactNode;
}

export const SiteProvider: React.FC<SiteProviderProps> = ({ children }) => {
  const { user } = useAuth(); // v2.9: Get logged-in user
  const [selectedSiteId, setSelectedSiteIdState] = useState<string | 'all'>('all');
  const [selectedSite, setSelectedSite] = useState<SiteModel | null>(null);
  const [supervisorId, setSupervisorIdState] = useState<string>('supervisor-1'); // Default
  const [projectId, setProjectIdState] = useState<string>(''); // Assigned project ID
  const [projectName, setProjectNameState] = useState<string>(''); // Assigned project name

  // v2.9: Load supervisor's project from database when user logs in
  useEffect(() => {
    const loadSupervisorProject = async () => {
      if (!user || !user.userId) return;

      try {
        console.log('[SiteContext] Loading project for user:', user.userId);

        // Fetch user from database to get project assignment
        const userRecord = await database.collections.get('users').find(user.userId);

        if (userRecord) {
          const projectId = (userRecord as any).projectId;
          console.log('[SiteContext] User projectId:', projectId);

          if (projectId) {
            // Fetch project details
            const project = await database.collections.get('projects').find(projectId);
            const projectName = (project as any).name;

            console.log('[SiteContext] Setting project:', projectName);

            // Update context state and persist to AsyncStorage
            await setProjectId(projectId);
            await setProjectName(projectName);
            await setSupervisorId(user.userId);
          } else {
            console.log('[SiteContext] No project assigned to user');
          }
        }
      } catch (error) {
        console.error('[SiteContext] Error loading supervisor project:', error);
      }
    };

    loadSupervisorProject();
  }, [user]);

  // Load saved site selection on mount (fallback if user context not available)
  useEffect(() => {
    const loadSavedSelection = async () => {
      try {
        const [savedSiteId, savedSupervisorId, savedProjectId, savedProjectName] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY),
          AsyncStorage.getItem(SUPERVISOR_ID_KEY),
          AsyncStorage.getItem(PROJECT_ID_KEY),
          AsyncStorage.getItem(PROJECT_NAME_KEY),
        ]);

        if (savedSiteId) {
          setSelectedSiteIdState(savedSiteId);
        }

        if (savedSupervisorId && !user) {
          // Only use saved supervisorId if no user context
          setSupervisorIdState(savedSupervisorId);
        }

        if (savedProjectId && !user) {
          // Only use saved projectId if no user context
          setProjectIdState(savedProjectId);
        }

        if (savedProjectName && !user) {
          // Only use saved projectName if no user context
          setProjectNameState(savedProjectName);
        }
      } catch (error) {
        console.error('Error loading saved site selection:', error);
      }
    };

    loadSavedSelection();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // Save project ID when it changes
  const setProjectId = async (id: string) => {
    setProjectIdState(id);
    try {
      await AsyncStorage.setItem(PROJECT_ID_KEY, id);
    } catch (error) {
      console.error('Error saving project ID:', error);
    }
  };

  // Save project name when it changes
  const setProjectName = async (name: string) => {
    setProjectNameState(name);
    try {
      await AsyncStorage.setItem(PROJECT_NAME_KEY, name);
    } catch (error) {
      console.error('Error saving project name:', error);
    }
  };

  const value: SiteContextType = {
    selectedSiteId,
    setSelectedSiteId,
    selectedSite,
    setSelectedSite,
    supervisorId,
    setSupervisorId,
    projectId,
    setProjectId,
    projectName,
    setProjectName,
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
