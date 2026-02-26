/**
 * PlanningContext
 *
 * Global context for Planning role screens.
 * Uses user's assigned project from database (set by Admin in RoleManagement).
 * Follows same pattern as Supervisor's SiteContext for uniformity.
 *
 * Includes a shared dashboard data cache that loads key_dates, key_date_sites,
 * items, and design_documents once and exposes them to all dashboard hooks.
 * A single unified subscription replaces 14+ individual hook subscriptions.
 *
 * @version 3.0.0
 * @since Planning Phase 4
 */

import React, { createContext, useContext, useReducer, useEffect, ReactNode, useCallback, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Q } from '@nozbe/watermelondb';
import { database } from '../../../models/database';
import ProjectModel from '../../../models/ProjectModel';
import SiteModel from '../../../models/SiteModel';
import UserModel from '../../../models/UserModel';
import KeyDateModel from '../../../models/KeyDateModel';
import KeyDateSiteModel from '../../../models/KeyDateSiteModel';
import ItemModel from '../../../models/ItemModel';
import DesignDocumentModel from '../../../models/DesignDocumentModel';
import { useAuth } from '../../auth/AuthContext';
import { logger } from '../../services/LoggingService';
import { batchLoadItemsBySites, batchLoadDocsByKeyDate, batchLoadDesignDocsBySites } from '../utils/dataLoading';
import type { GroupedData } from '../utils/dataLoading';

// ==================== Storage Keys ====================

const STORAGE_KEYS = {
  PROJECT_ID: '@planning_project_id',
  PROJECT_NAME: '@planning_project_name',
  SITE_ID: '@planning_site_id',
};

// ==================== Types ====================

/**
 * Cached dashboard data shared across all dashboard hooks.
 * Loaded once by loadDashboardData and kept in sync via unified subscription.
 */
export interface DashboardCache {
  keyDates: KeyDateModel[];
  sitesByKdId: Record<string, KeyDateSiteModel[]>;
  kdSitesBySiteId: Record<string, KeyDateSiteModel[]>;
  allItems: ItemModel[];
  itemsBySite: GroupedData<ItemModel>;
  docsByKeyDate: GroupedData<DesignDocumentModel>;
  docsBySite: GroupedData<DesignDocumentModel>;
  allProjectDesignDocs: DesignDocumentModel[];
  dataReady: boolean;
}

const initialDashboardCache: DashboardCache = {
  keyDates: [],
  sitesByKdId: {},
  kdSitesBySiteId: {},
  allItems: [],
  itemsBySite: {},
  docsByKeyDate: {},
  docsBySite: {},
  allProjectDesignDocs: [],
  dataReady: false,
};

interface PlanningState {
  projectId: string | null;
  projectName: string | null;
  projectStartDate: number | null;
  projectEndDate: number | null;
  selectedSiteId: string | null;
  selectedSite: SiteModel | null;
  sites: SiteModel[];
  loading: boolean;
  error: string | null;
}

type PlanningAction =
  | { type: 'SET_PROJECT'; payload: { projectId: string | null; projectName: string | null; startDate?: number | null; endDate?: number | null } }
  | { type: 'SET_PROJECT_AND_SITES'; payload: { projectId: string; projectName: string; startDate?: number | null; endDate?: number | null; sites: SiteModel[] } }
  | { type: 'SET_SITE'; payload: { siteId: string | null; site: SiteModel | null } }
  | { type: 'SET_SITES'; payload: SiteModel[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'RESET' };

interface PlanningContextValue extends PlanningState {
  selectSite: (siteId: string | null) => void;
  refreshSites: () => Promise<void>;
  refreshProject: () => Promise<void>;
  dashboardCache: DashboardCache;
  refreshDashboard: () => Promise<void>;
}

// ==================== Initial State ====================

const initialState: PlanningState = {
  projectId: null,
  projectName: null,
  projectStartDate: null,
  projectEndDate: null,
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
        projectStartDate: action.payload.startDate ?? state.projectStartDate,
        projectEndDate: action.payload.endDate ?? state.projectEndDate,
        // Reset site when project changes
        selectedSiteId: null,
        selectedSite: null,
      };
    case 'SET_PROJECT_AND_SITES':
      return {
        ...state,
        projectId: action.payload.projectId,
        projectName: action.payload.projectName,
        projectStartDate: action.payload.startDate ?? state.projectStartDate,
        projectEndDate: action.payload.endDate ?? state.projectEndDate,
        sites: action.payload.sites,
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
  const [dashboardCache, setDashboardCache] = useState<DashboardCache>(initialDashboardCache);

  // Load user's assigned project + sites from database in a single pass
  const loadUserProject = useCallback(async () => {
    if (!user?.userId) {
      dispatch({ type: 'SET_LOADING', payload: false });
      return;
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      // Fetch user record to get project assignment
      const userRecord = await database.collections
        .get<UserModel>('users')
        .find(user.userId);

      if (userRecord?.projectId) {
        const assignedProjectId = userRecord.projectId;

        // Fetch project details + sites in parallel (was sequential before)
        const [project, projectSites] = await Promise.all([
          database.collections.get<ProjectModel>('projects').find(assignedProjectId),
          database.collections.get<SiteModel>('sites')
            .query(Q.where('project_id', assignedProjectId))
            .fetch(),
        ]);

        const projectName = project.name || 'Unknown Project';

        // Dispatch project + sites atomically — single render, no intermediate empty-sites state
        dispatch({
          type: 'SET_PROJECT_AND_SITES',
          payload: {
            projectId: assignedProjectId,
            projectName,
            startDate: (project as any).startDate || null,
            endDate: (project as any).endDate || null,
            sites: projectSites,
          },
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
        // No project — unblock the dashboard so it can show the error state
        setDashboardCache({ ...initialDashboardCache, dataReady: true });
      }
    } catch (error) {
      logger.error('[PlanningContext] Failed to load user project', error as Error, {
        component: 'PlanningContext',
        action: 'loadUserProject',
        userId: user?.userId,
      });
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load assigned project' });
      // On error — unblock the dashboard so it can show the error state
      setDashboardCache({ ...initialDashboardCache, dataReady: true });
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
      logger.error('[PlanningContext] Failed to load sites', error as Error, {
        component: 'PlanningContext',
        action: 'loadSites',
        projectId,
      });
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load sites' });
    }
  }, []);

  // Load user's project + sites when user logs in
  useEffect(() => {
    if (user?.userId) {
      loadUserProject();
    }
  }, [user?.userId, loadUserProject]);

  // ==================== Dashboard Data Cache ====================

  /**
   * Loads all shared dashboard data in a single batch:
   * 1. Key dates for project (1 query)
   * 2. KD-sites for those KDs (1 query)
   * 3. Items for all sites via batchLoadItemsBySites (1 query)
   * 4. Design docs by KD via batchLoadDocsByKeyDate (1 query)
   * 5. Design docs by site via batchLoadDesignDocsBySites (1 query)
   * 6. All design docs for project — unlinked count (1 query)
   *
   * Total: 6 queries (down from ~28 across individual hooks)
   */
  const loadDashboardData = useCallback(async () => {
    if (!state.projectId || state.sites.length === 0) {
      // Not ready yet — skip silently. dataReady is set explicitly by loadUserProject
      // when no project is found, or will fire again once projectId + sites are both set.
      return;
    }

    try {
      const projectId = state.projectId;
      const siteIds = state.sites.map(s => s.id);

      // 1. Key dates for project
      const keyDates = await database.collections
        .get<KeyDateModel>('key_dates')
        .query(Q.where('project_id', projectId))
        .fetch();

      // 2. KD-sites for those KDs
      const kdIds = keyDates.map(kd => kd.id);
      const keyDateSites = kdIds.length > 0
        ? await database.collections
            .get<KeyDateSiteModel>('key_date_sites')
            .query(Q.where('key_date_id', Q.oneOf(kdIds)))
            .fetch()
        : [];

      // 3, 4 & 5. Items by site + design docs by KD + design docs by site (parallel)
      const [itemsBySite, docsByKeyDate, docsBySite] = await Promise.all([
        batchLoadItemsBySites(siteIds),
        kdIds.length > 0
          ? batchLoadDocsByKeyDate(kdIds)
          : Promise.resolve({} as GroupedData<DesignDocumentModel>),
        batchLoadDesignDocsBySites(siteIds),
      ]);

      // 6. All design docs for project (unlinked count)
      const allProjectDesignDocs = await database.collections
        .get<DesignDocumentModel>('design_documents')
        .query(Q.where('project_id', projectId))
        .fetch();

      // Build grouped lookups
      const sitesByKdId: Record<string, KeyDateSiteModel[]> = {};
      const kdSitesBySiteId: Record<string, KeyDateSiteModel[]> = {};
      for (const kds of keyDateSites) {
        if (!sitesByKdId[kds.keyDateId]) sitesByKdId[kds.keyDateId] = [];
        sitesByKdId[kds.keyDateId].push(kds);
        if (!kdSitesBySiteId[kds.siteId]) kdSitesBySiteId[kds.siteId] = [];
        kdSitesBySiteId[kds.siteId].push(kds);
      }

      const allItems = Object.values(itemsBySite).flat();

      setDashboardCache({
        keyDates,
        sitesByKdId,
        kdSitesBySiteId,
        allItems,
        itemsBySite,
        docsByKeyDate,
        docsBySite,
        allProjectDesignDocs,
        dataReady: true,
      });
    } catch (error) {
      logger.error('[PlanningContext] Failed to load dashboard data', error as Error, {
        component: 'PlanningContext',
        action: 'loadDashboardData',
      });
      // Set dataReady even on error so widgets show empty state instead of infinite loading
      setDashboardCache(prev => prev.dataReady ? prev : { ...initialDashboardCache, dataReady: true });
    }
  }, [state.projectId, state.sites]);

  // Unified subscription: one subscription replaces 14+ individual hook subscriptions
  useEffect(() => {
    // Always call so widgets can resolve their loading state (sets dataReady:true on early return)
    loadDashboardData();

    // Only set up live subscription when project + sites are available
    if (!state.projectId || state.sites.length === 0) return;

    let debounceTimer: ReturnType<typeof setTimeout>;
    const subscription = database
      .withChangesForTables(['items', 'design_documents', 'key_date_sites', 'key_dates', 'progress_logs'])
      .subscribe(() => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => loadDashboardData(), 300);
      });

    return () => {
      subscription.unsubscribe();
      clearTimeout(debounceTimer);
    };
  }, [loadDashboardData]);

  const refreshDashboard = useCallback(async () => {
    await loadDashboardData();
  }, [loadDashboardData]);

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
    dashboardCache,
    refreshDashboard,
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
