/**
 * PlanningContext
 *
 * Global context for Planning role screens.
 * Uses user's assigned project from database (set by Admin in RoleManagement).
 * Follows same pattern as Supervisor's SiteContext for uniformity.
 *
 * @version 2.0.0
 * @since Planning Phase 4
 */

import React, { createContext, useContext, useReducer, useEffect, ReactNode, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Q } from '@nozbe/watermelondb';
import { database } from '../../../models/database';
import ProjectModel from '../../../models/ProjectModel';
import SiteModel from '../../../models/SiteModel';
import { useAuth } from '../../auth/AuthContext';

// ==================== Storage Keys ====================

const STORAGE_KEYS = {
  PROJECT_ID: '@planning_project_id',
  PROJECT_NAME: '@planning_project_name',
  SITE_ID: '@planning_site_id',
};

// ==================== Types ====================

interface PlanningState {
  projectId: string | null;
  projectName: string | null;
  selectedSiteId: string | null;
  selectedSite: SiteModel | null;
  sites: SiteModel[];
  loading: boolean;
  error: string | null;
}

type PlanningAction =
  | { type: 'SET_PROJECT'; payload: { projectId: string | null; projectName: string | null } }
  | { type: 'SET_SITE'; payload: { siteId: string | null; site: SiteModel | null } }
  | { type: 'SET_SITES'; payload: SiteModel[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'RESET' };

interface PlanningContextValue extends PlanningState {
  selectSite: (siteId: string | null) => void;
  refreshSites: () => Promise<void>;
  refreshProject: () => Promise<void>;
}

// ==================== Initial State ====================

const initialState: PlanningState = {
  projectId: null,
  projectName: null,
  selectedSiteId: null,
  selectedSite: null,
  sites: [],
  loading: true,
  error: null,
};

// ==================== Reducer ====================

function planningReducer(state: PlanningState, action: PlanningAction): PlanningState {
  switch (action.type) {
    case 'SET_PROJECT':
      return {
        ...state,
        projectId: action.payload.projectId,
        projectName: action.payload.projectName,
        // Reset site when project changes
        selectedSiteId: null,
        selectedSite: null,
      };
    case 'SET_SITE':
      return {
        ...state,
        selectedSiteId: action.payload.siteId,
        selectedSite: action.payload.site,
      };
    case 'SET_SITES':
      return { ...state, sites: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

// ==================== Context ====================

const PlanningContext = createContext<PlanningContextValue | undefined>(undefined);

// ==================== Provider ====================

interface PlanningProviderProps {
  children: ReactNode;
}

export const PlanningProvider: React.FC<PlanningProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [state, dispatch] = useReducer(planningReducer, initialState);

  // Load user's assigned project from database (set by Admin in RoleManagement)
  const loadUserProject = useCallback(async () => {
    if (!user?.userId) {
      dispatch({ type: 'SET_LOADING', payload: false });
      return;
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      // Fetch user from database to get project assignment
      const userRecord = await database.collections.get('users').find(user.userId);

      if (userRecord) {
        const assignedProjectId = (userRecord as any).projectId;

        if (assignedProjectId) {
          // Fetch project details
          const project = await database.collections.get<ProjectModel>('projects').find(assignedProjectId);
          const projectName = (project as any).name || 'Unknown Project';

          // Update context state
          dispatch({
            type: 'SET_PROJECT',
            payload: { projectId: assignedProjectId, projectName },
          });

          // Persist to AsyncStorage for offline/fallback
          await Promise.all([
            AsyncStorage.setItem(STORAGE_KEYS.PROJECT_ID, assignedProjectId),
            AsyncStorage.setItem(STORAGE_KEYS.PROJECT_NAME, projectName),
          ]);
        } else {
          dispatch({
            type: 'SET_ERROR',
            payload: 'No project assigned. Please contact Admin.',
          });
        }
      }
    } catch (error) {
      console.error('PlanningContext: Failed to load user project:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load assigned project' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [user?.userId]);

  // Load sites for assigned project
  const loadSites = useCallback(async (projectId: string) => {
    try {
      const sitesCollection = database.collections.get<SiteModel>('sites');
      const projectSites = await sitesCollection
        .query(Q.where('project_id', projectId))
        .fetch();
      dispatch({ type: 'SET_SITES', payload: projectSites });
    } catch (error) {
      console.error('PlanningContext: Failed to load sites:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load sites' });
    }
  }, []);

  // Load saved state from AsyncStorage (fallback when user context not available)
  useEffect(() => {
    const loadSavedState = async () => {
      if (user) return; // User context available, will load from DB

      try {
        const [savedProjectId, savedProjectName, savedSiteId] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.PROJECT_ID),
          AsyncStorage.getItem(STORAGE_KEYS.PROJECT_NAME),
          AsyncStorage.getItem(STORAGE_KEYS.SITE_ID),
        ]);

        if (savedProjectId && savedProjectName) {
          dispatch({
            type: 'SET_PROJECT',
            payload: { projectId: savedProjectId, projectName: savedProjectName },
          });
        }

        if (savedSiteId) {
          // Site object will be loaded when sites are fetched
          dispatch({
            type: 'SET_SITE',
            payload: { siteId: savedSiteId, site: null },
          });
        }
      } catch (error) {
        console.error('PlanningContext: Failed to load saved state:', error);
      }
    };

    loadSavedState();
  }, [user]);

  // Load user's project when user logs in
  useEffect(() => {
    if (user?.userId) {
      loadUserProject();
    }
  }, [user?.userId, loadUserProject]);

  // Load sites when project changes
  useEffect(() => {
    if (state.projectId) {
      loadSites(state.projectId);
    } else {
      dispatch({ type: 'SET_SITES', payload: [] });
    }
  }, [state.projectId, loadSites]);

  // Select site handler
  const selectSite = useCallback(async (siteId: string | null) => {
    const site = state.sites.find((s) => s.id === siteId) || null;
    dispatch({ type: 'SET_SITE', payload: { siteId, site } });

    // Persist selection
    if (siteId) {
      await AsyncStorage.setItem(STORAGE_KEYS.SITE_ID, siteId);
    } else {
      await AsyncStorage.removeItem(STORAGE_KEYS.SITE_ID);
    }
  }, [state.sites]);

  // Refresh handlers
  const refreshProject = useCallback(async () => {
    await loadUserProject();
  }, [loadUserProject]);

  const refreshSites = useCallback(async () => {
    if (state.projectId) {
      await loadSites(state.projectId);
    }
  }, [state.projectId, loadSites]);

  const value: PlanningContextValue = {
    ...state,
    selectSite,
    refreshSites,
    refreshProject,
  };

  return (
    <PlanningContext.Provider value={value}>
      {children}
    </PlanningContext.Provider>
  );
};

// ==================== Hook ====================

export const usePlanningContext = (): PlanningContextValue => {
  const context = useContext(PlanningContext);
  if (!context) {
    throw new Error('usePlanningContext must be used within PlanningProvider');
  }
  return context;
};

export default PlanningContext;
