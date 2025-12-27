import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { database } from '../../../models/database';
import { useAuth } from '../../auth/AuthContext';
import { logger } from '../../services/LoggingService';

/**
 * ManagerContext (Enhanced for v2.10)
 *
 * Provides shared state management across Manager role screens.
 * Similar to SiteProvider for Supervisor role.
 *
 * Features:
 * - Project isolation (manager assigned to one project)
 * - Selected team tracking
 * - Filter state management
 * - Refresh trigger for data updates
 * - Project loading from database on login
 */

interface ManagerContextType {
  managerId: string;
  setManagerId: (id: string) => void;
  projectId: string;
  setProjectId: (id: string) => void;
  projectName: string;
  setProjectName: (name: string) => void;
  selectedTeamId: string | null;
  setSelectedTeamId: (id: string | null) => void;
  filterStatus: string | null;
  setFilterStatus: (status: string | null) => void;
  refreshTrigger: number;
  triggerRefresh: () => void;
}

const ManagerContext = createContext<ManagerContextType | undefined>(undefined);

const MANAGER_ID_KEY = '@manager_id';
const PROJECT_ID_KEY = '@manager_project_id';
const PROJECT_NAME_KEY = '@manager_project_name';

export const ManagerProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth(); // v2.10: Get logged-in user
  const [managerId, setManagerIdState] = useState<string>('');
  const [projectId, setProjectIdState] = useState<string>('');
  const [projectName, setProjectNameState] = useState<string>('');
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // v2.10: Load manager's project from database when user logs in
  useEffect(() => {
    const loadManagerProject = async () => {
      if (!user || !user.userId) return;

      try {
        logger.debug('[ManagerContext] Loading project for user', { userId: user.userId });

        // Fetch user from database to get project assignment
        const userRecord = await database.collections.get('users').find(user.userId);

        if (userRecord) {
          const projectId = (userRecord as any).projectId;
          logger.debug('[ManagerContext] User projectId', { projectId });

          if (projectId) {
            // Fetch project details
            const project = await database.collections.get('projects').find(projectId);
            const projectName = (project as any).name;

            logger.debug('[ManagerContext] Setting project', { projectName });

            // Update context state and persist to AsyncStorage
            await setProjectId(projectId);
            await setProjectName(projectName);
            await setManagerId(user.userId);
          } else {
            logger.warn('[ManagerContext] No project assigned to user');
          }
        }
      } catch (error) {
        logger.error('[ManagerContext] Error loading manager project', error as Error);
      }
    };

    loadManagerProject();
  }, [user]);

  // Load saved data on mount (fallback if user context not available)
  useEffect(() => {
    const loadSavedData = async () => {
      try {
        const [savedManagerId, savedProjectId, savedProjectName] = await Promise.all([
          AsyncStorage.getItem(MANAGER_ID_KEY),
          AsyncStorage.getItem(PROJECT_ID_KEY),
          AsyncStorage.getItem(PROJECT_NAME_KEY),
        ]);

        if (savedManagerId && !user) {
          setManagerIdState(savedManagerId);
        }

        if (savedProjectId && !user) {
          setProjectIdState(savedProjectId);
        }

        if (savedProjectName && !user) {
          setProjectNameState(savedProjectName);
        }
      } catch (error) {
        logger.error('[ManagerContext] Error loading saved data', error as Error);
      }
    };

    loadSavedData();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Save manager ID when it changes
  const setManagerId = async (id: string) => {
    setManagerIdState(id);
    try {
      await AsyncStorage.setItem(MANAGER_ID_KEY, id);
    } catch (error) {
      logger.error('[ManagerContext] Error saving manager ID', error as Error);
    }
  };

  // Save project ID when it changes
  const setProjectId = async (id: string) => {
    setProjectIdState(id);
    try {
      await AsyncStorage.setItem(PROJECT_ID_KEY, id);
    } catch (error) {
      logger.error('[ManagerContext] Error saving project ID', error as Error);
    }
  };

  // Save project name when it changes
  const setProjectName = async (name: string) => {
    setProjectNameState(name);
    try {
      await AsyncStorage.setItem(PROJECT_NAME_KEY, name);
    } catch (error) {
      logger.error('[ManagerContext] Error saving project name', error as Error);
    }
  };

  const triggerRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <ManagerContext.Provider
      value={{
        managerId,
        setManagerId,
        projectId,
        setProjectId,
        projectName,
        setProjectName,
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

// Alias for convenience
export const useManager = useManagerContext;
