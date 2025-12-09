import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SiteModel from '../../../models/SiteModel';
import { database } from '../../../models/database';
import { useAuth } from '../../auth/AuthContext';
import { logger } from '../../services/LoggingService';

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
        logger.debug('Loading project for user', {
          component: 'SiteContext',
          action: 'loadSupervisorProject',
          userId: user.userId,
        });

        // Fetch user from database to get project assignment
        const userRecord = await database.collections.get('users').find(user.userId);

        if (userRecord) {
          const projectId = (userRecord as any).projectId;
          logger.debug('User project ID retrieved', {
            component: 'SiteContext',
            action: 'loadSupervisorProject',
            userId: user.userId,
            projectId,
          });

          if (projectId) {
            // Fetch project details
            const project = await database.collections.get('projects').find(projectId);
            const projectName = (project as any).name;

            logger.info('Setting supervisor project', {
              component: 'SiteContext',
              action: 'loadSupervisorProject',
              projectId,
              projectName,
            });

            // Update context state and persist to AsyncStorage
            await setProjectId(projectId);
            await setProjectName(projectName);
            await setSupervisorId(user.userId);
          } else {
            logger.warn('No project assigned to user', {
              component: 'SiteContext',
              action: 'loadSupervisorProject',
              userId: user.userId,
            });
          }
        }
      } catch (error) {
        logger.error('Failed to load supervisor project', error as Error, {
          component: 'SiteContext',
          action: 'loadSupervisorProject',
          userId: user?.userId,
        });
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
        logger.error('Failed to load saved site selection', error as Error, {
          component: 'SiteContext',
          action: 'loadSavedSelection',
        });
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
      logger.error('Failed to save site selection', error as Error, {
        component: 'SiteContext',
        action: 'setSelectedSiteId',
        siteId,
      });
    }
  };

  // Save supervisor ID when it changes
  const setSupervisorId = async (id: string) => {
    setSupervisorIdState(id);
    try {
      await AsyncStorage.setItem(SUPERVISOR_ID_KEY, id);
    } catch (error) {
      logger.error('Failed to save supervisor ID', error as Error, {
        component: 'SiteContext',
        action: 'setSupervisorId',
        supervisorId: id,
      });
    }
  };

  // Save project ID when it changes
  const setProjectId = async (id: string) => {
    setProjectIdState(id);
    try {
      await AsyncStorage.setItem(PROJECT_ID_KEY, id);
    } catch (error) {
      logger.error('Failed to save project ID', error as Error, {
        component: 'SiteContext',
        action: 'setProjectId',
        projectId: id,
      });
    }
  };

  // Save project name when it changes
  const setProjectName = async (name: string) => {
    setProjectNameState(name);
    try {
      await AsyncStorage.setItem(PROJECT_NAME_KEY, name);
    } catch (error) {
      logger.error('Failed to save project name', error as Error, {
        component: 'SiteContext',
        action: 'setProjectName',
        projectName: name,
      });
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
