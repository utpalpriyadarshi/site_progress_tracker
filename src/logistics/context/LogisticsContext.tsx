/**
 * LogisticsContext - Enhanced
 *
 * Global context for Logistics role screens.
 * Follows PlanningContext pattern for project/site selection.
 * Stores selected project, site, and logistics-specific data.
 *
 * Features:
 * - useReducer for predictable state management
 * - Project/Site selection with AsyncStorage persistence
 * - Alerts & pending actions management
 * - KPI tracking
 * - Offline status indicator
 *
 * @version 2.0.0
 * @since Logistics Phase 3
 */

import React, { createContext, useContext, useReducer, useEffect, ReactNode, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { Q } from '@nozbe/watermelondb';
import { database } from '../../../models/database';
import ProjectModel from '../../../models/ProjectModel';
import SiteModel from '../../../models/SiteModel';
import MaterialModel from '../../../models/MaterialModel';
import { useAuth } from '../../auth/AuthContext';
import { logger } from '../../services/LoggingService';

// ==================== Sync Types ====================

export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

// ==================== Storage Keys ====================

const STORAGE_KEYS = {
  PROJECT_ID: '@logistics_project_id',
  SITE_ID: '@logistics_site_id',
};

// ==================== Types ====================

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';
export type AlertType = 'material' | 'equipment' | 'delivery' | 'inventory';

export interface LogisticsAlert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  description: string;
  affectedItems: string[];
  recommendedAction: string;
  timestamp: Date;
  acknowledged: boolean;
  projectId?: string;
  siteId?: string;
}

export interface PendingAction {
  id: string;
  type: 'procurement' | 'maintenance' | 'delivery' | 'transfer';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  dueDate: Date;
  assignedTo?: string;
  relatedId: string;
  status: 'pending' | 'in_progress' | 'completed';
}

export interface LogisticsKPIs {
  totalMaterialsTracked: number;
  materialsAtRisk: number;
  procurementCycleTime: number;
  totalEquipment: number;
  equipmentAvailability: number;
  maintenanceCompliance: number;
  deliveriesThisWeek: number;
  onTimeDeliveryRate: number;
  averageDeliveryCost: number;
  totalInventoryValue: number;
  inventoryTurnover: number;
  stockAccuracy: number;
}

export interface LogisticsStats {
  pendingDeliveries: number;
  lowStockItems: number;
  openPurchaseOrders: number;
  pendingRfqs: number;
}

interface LogisticsState {
  // Project/Site Selection (following PlanningContext pattern)
  selectedProjectId: string | null;
  selectedProject: ProjectModel | null;
  selectedSiteId: string | null;
  selectedSite: SiteModel | null;
  projects: ProjectModel[];
  sites: SiteModel[];
  materials: MaterialModel[];

  // Logistics-specific data
  stats: LogisticsStats;
  kpis: LogisticsKPIs;
  alerts: LogisticsAlert[];
  pendingActions: PendingAction[];

  // UI State
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  isOffline: boolean;
  lastRefreshTime: Date | null;

  // Sync State
  syncStatus: SyncStatus;
  pendingSyncCount: number;
  lastSyncTime: number | null;
}

type LogisticsAction =
  | { type: 'SET_PROJECT'; payload: { projectId: string | null; project: ProjectModel | null } }
  | { type: 'SET_SITE'; payload: { siteId: string | null; site: SiteModel | null } }
  | { type: 'SET_PROJECTS'; payload: ProjectModel[] }
  | { type: 'SET_SITES'; payload: SiteModel[] }
  | { type: 'SET_MATERIALS'; payload: MaterialModel[] }
  | { type: 'SET_STATS'; payload: Partial<LogisticsStats> }
  | { type: 'SET_KPIS'; payload: LogisticsKPIs }
  | { type: 'SET_ALERTS'; payload: LogisticsAlert[] }
  | { type: 'ADD_ALERT'; payload: LogisticsAlert }
  | { type: 'ACKNOWLEDGE_ALERT'; payload: string }
  | { type: 'DISMISS_ALERT'; payload: string }
  | { type: 'SET_PENDING_ACTIONS'; payload: PendingAction[] }
  | { type: 'ADD_PENDING_ACTION'; payload: PendingAction }
  | { type: 'UPDATE_ACTION_STATUS'; payload: { actionId: string; status: PendingAction['status'] } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_REFRESHING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_OFFLINE'; payload: boolean }
  | { type: 'SET_LAST_REFRESH'; payload: Date | null }
  | { type: 'SET_SYNC_STATUS'; payload: SyncStatus }
  | { type: 'SET_PENDING_SYNC_COUNT'; payload: number }
  | { type: 'SET_LAST_SYNC_TIME'; payload: number | null }
  | { type: 'RESET' };

interface LogisticsContextValue extends LogisticsState {
  // Project/Site Selection
  selectProject: (projectId: string | null) => void;
  selectSite: (siteId: string | null) => void;

  // Data Refresh
  refreshProjects: () => Promise<void>;
  refreshSites: () => Promise<void>;
  refreshMaterials: () => Promise<void>;
  refreshLogisticsStats: () => Promise<void>;
  refresh: () => Promise<void>;

  // Alerts Management
  addAlert: (alert: Omit<LogisticsAlert, 'id' | 'timestamp' | 'acknowledged'>) => void;
  acknowledgeAlert: (alertId: string) => void;
  dismissAlert: (alertId: string) => void;

  // Actions Management
  addPendingAction: (action: Omit<PendingAction, 'id'>) => void;
  updateActionStatus: (actionId: string, status: PendingAction['status']) => void;

  // Sync Management
  triggerSync: () => Promise<void>;
  setPendingSyncCount: (count: number) => void;
}

// ==================== Initial State ====================

const initialKPIs: LogisticsKPIs = {
  totalMaterialsTracked: 0,
  materialsAtRisk: 0,
  procurementCycleTime: 0,
  totalEquipment: 0,
  equipmentAvailability: 0,
  maintenanceCompliance: 0,
  deliveriesThisWeek: 0,
  onTimeDeliveryRate: 0,
  averageDeliveryCost: 0,
  totalInventoryValue: 0,
  inventoryTurnover: 0,
  stockAccuracy: 0,
};

const initialStats: LogisticsStats = {
  pendingDeliveries: 0,
  lowStockItems: 0,
  openPurchaseOrders: 0,
  pendingRfqs: 0,
};

const initialState: LogisticsState = {
  selectedProjectId: null,
  selectedProject: null,
  selectedSiteId: null,
  selectedSite: null,
  projects: [],
  sites: [],
  materials: [],
  stats: initialStats,
  kpis: initialKPIs,
  alerts: [],
  pendingActions: [],
  loading: true,
  refreshing: false,
  error: null,
  isOffline: false,
  lastRefreshTime: null,
  // Sync State
  syncStatus: 'idle',
  pendingSyncCount: 0,
  lastSyncTime: null,
};

// ==================== Reducer ====================

function logisticsReducer(state: LogisticsState, action: LogisticsAction): LogisticsState {
  switch (action.type) {
    case 'SET_PROJECT':
      return {
        ...state,
        selectedProjectId: action.payload.projectId,
        selectedProject: action.payload.project,
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

    case 'SET_PROJECTS':
      return { ...state, projects: action.payload };

    case 'SET_SITES':
      return { ...state, sites: action.payload };

    case 'SET_MATERIALS':
      return { ...state, materials: action.payload };

    case 'SET_STATS':
      return { ...state, stats: { ...state.stats, ...action.payload } };

    case 'SET_KPIS':
      return { ...state, kpis: action.payload };

    case 'SET_ALERTS':
      return { ...state, alerts: action.payload };

    case 'ADD_ALERT':
      return { ...state, alerts: [action.payload, ...state.alerts] };

    case 'ACKNOWLEDGE_ALERT':
      return {
        ...state,
        alerts: state.alerts.map(alert =>
          alert.id === action.payload ? { ...alert, acknowledged: true } : alert
        ),
      };

    case 'DISMISS_ALERT':
      return {
        ...state,
        alerts: state.alerts.filter(alert => alert.id !== action.payload),
      };

    case 'SET_PENDING_ACTIONS':
      return { ...state, pendingActions: action.payload };

    case 'ADD_PENDING_ACTION':
      return { ...state, pendingActions: [action.payload, ...state.pendingActions] };

    case 'UPDATE_ACTION_STATUS':
      return {
        ...state,
        pendingActions: state.pendingActions.map(pendingAction =>
          pendingAction.id === action.payload.actionId
            ? { ...pendingAction, status: action.payload.status }
            : pendingAction
        ),
      };

    case 'SET_LOADING':
      return { ...state, loading: action.payload };

    case 'SET_REFRESHING':
      return { ...state, refreshing: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload };

    case 'SET_OFFLINE':
      return { ...state, isOffline: action.payload };

    case 'SET_LAST_REFRESH':
      return { ...state, lastRefreshTime: action.payload };

    case 'SET_SYNC_STATUS':
      return { ...state, syncStatus: action.payload };

    case 'SET_PENDING_SYNC_COUNT':
      return { ...state, pendingSyncCount: action.payload };

    case 'SET_LAST_SYNC_TIME':
      return { ...state, lastSyncTime: action.payload };

    case 'RESET':
      return initialState;

    default:
      return state;
  }
}

// ==================== Context ====================

const LogisticsContext = createContext<LogisticsContextValue | undefined>(undefined);

// ==================== Provider ====================

interface LogisticsProviderProps {
  children: ReactNode;
}

export const LogisticsProvider: React.FC<LogisticsProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [state, dispatch] = useReducer(logisticsReducer, initialState);

  // ===== Network Status Monitoring =====

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((netState: NetInfoState) => {
      dispatch({
        type: 'SET_OFFLINE',
        payload: !(netState.isConnected ?? true),
      });
    });

    return () => unsubscribe();
  }, []);

  // ===== Data Loading Functions =====

  const refreshProjects = useCallback(async () => {
    try {
      const allProjects = await database.collections
        .get<ProjectModel>('projects')
        .query()
        .fetch();

      // Primary filter: projects that have BOMs (logistics-specific seeded data).
      // "Sample Construction Project" has sites but no BOMs → excluded.
      // Fallback: projects with sites (for fresh installs before Manager demo runs).
      const bomsCol = database.collections.get('boms');
      const sitesCol = database.collections.get('sites');

      const projectsWithBoms: ProjectModel[] = [];
      const projectsWithSites: ProjectModel[] = [];

      for (const project of allProjects) {
        const bomCount = await bomsCol.query(Q.where('project_id', project.id)).fetchCount();
        if (bomCount > 0) {
          projectsWithBoms.push(project);
        } else {
          const siteCount = await sitesCol.query(Q.where('project_id', project.id)).fetchCount();
          if (siteCount > 0) projectsWithSites.push(project);
        }
      }

      const projectsList = projectsWithBoms.length > 0 ? projectsWithBoms : projectsWithSites;

      dispatch({ type: 'SET_PROJECTS', payload: allProjects });

      // Step 1: honour the user's assigned project_id from the DB (same as Supervisor)
      let assignedProjectId: string | null = null;
      if (user?.userId) {
        try {
          const userRecord = await database.collections.get('users').find(user.userId);
          assignedProjectId = (userRecord as any).projectId || null;
        } catch {
          // non-critical
        }
      }

      const assignedProject = assignedProjectId
        ? allProjects.find(p => p.id === assignedProjectId) || null
        : null;

      if (assignedProject) {
        dispatch({
          type: 'SET_PROJECT',
          payload: { projectId: assignedProject.id, project: assignedProject },
        });
        await AsyncStorage.setItem(STORAGE_KEYS.PROJECT_ID, assignedProject.id);
        return;
      }

      // Step 2: validate saved AsyncStorage selection
      const savedIdIsValid = allProjects.some(p => p.id === state.selectedProjectId);

      if (savedIdIsValid && state.selectedProjectId) {
        const project = allProjects.find(p => p.id === state.selectedProjectId) || null;
        if (project && !state.selectedProject) {
          dispatch({
            type: 'SET_PROJECT',
            payload: { projectId: state.selectedProjectId, project },
          });
        }
        return;
      }

      // Step 3: fall back to first project from BOM/site filtered list
      if (projectsList.length > 0) {
        const firstProject = projectsList[0];
        dispatch({
          type: 'SET_PROJECT',
          payload: { projectId: firstProject.id, project: firstProject },
        });
        await AsyncStorage.setItem(STORAGE_KEYS.PROJECT_ID, firstProject.id);
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load projects' });
    }
  }, [user?.userId, state.selectedProjectId, state.selectedProject]);

  const refreshSites = useCallback(async () => {
    if (!state.selectedProjectId) {
      dispatch({ type: 'SET_SITES', payload: [] });
      return;
    }

    try {
      const sitesCollection = database.collections.get<SiteModel>('sites');
      const projectSites = await sitesCollection
        .query(Q.where('project_id', state.selectedProjectId))
        .fetch();
      dispatch({ type: 'SET_SITES', payload: projectSites });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load sites' });
    }
  }, [state.selectedProjectId]);

  const refreshMaterials = useCallback(async () => {
    try {
      // materials table has no project_id column — load all and let UI filter by context
      const materialsList = await database.collections
        .get<MaterialModel>('materials')
        .query()
        .fetch();
      dispatch({ type: 'SET_MATERIALS', payload: materialsList });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load materials' });
    }
  }, []);

  const refreshLogisticsStats = useCallback(async () => {
    if (!state.selectedProjectId) return;

    try {
      // Fetch stats from various collections
      const [rfqs, purchaseOrders] = await Promise.all([
        database.collections.get('rfqs')
          .query(Q.where('project_id', state.selectedProjectId))
          .fetch(),
        database.collections.get('purchase_orders')
          .query(Q.where('project_id', state.selectedProjectId))
          .fetch(),
      ]);

      // Calculate stats
      const pendingRfqs = rfqs.filter((r: any) => r.status === 'pending' || r.status === 'draft').length;
      const openPurchaseOrders = purchaseOrders.filter((p: any) => p.status !== 'completed' && p.status !== 'cancelled').length;

      // Low stock calculation from materials
      const lowStockItems = state.materials.filter(m =>
        m.quantityAvailable < m.quantityRequired * 0.3
      ).length;

      dispatch({
        type: 'SET_STATS',
        payload: {
          pendingRfqs,
          openPurchaseOrders,
          lowStockItems,
          pendingDeliveries: 0, // Will be enhanced with delivery tracking
        },
      });
    } catch (error) {
      // Stats are non-critical, don't set error
    }
  }, [state.selectedProjectId, state.materials]);

  const calculateKPIs = useCallback(() => {
    const materials = state.materials;

    const totalMaterialsTracked = materials.length;
    const materialsAtRisk = materials.filter(m =>
      m.quantityAvailable < m.quantityRequired * 0.3
    ).length;

    dispatch({
      type: 'SET_KPIS',
      payload: {
        totalMaterialsTracked,
        materialsAtRisk,
        procurementCycleTime: 7, // Placeholder
        totalEquipment: 0,
        equipmentAvailability: 0,
        maintenanceCompliance: 0,
        deliveriesThisWeek: 0,
        onTimeDeliveryRate: 0,
        averageDeliveryCost: 0,
        totalInventoryValue: 0,
        inventoryTurnover: 0,
        stockAccuracy: 100,
      },
    });
  }, [state.materials]);

  const refresh = useCallback(async () => {
    dispatch({ type: 'SET_REFRESHING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      await refreshProjects();
      await refreshSites();
      await refreshMaterials();
      await refreshLogisticsStats();
      calculateKPIs();
      dispatch({ type: 'SET_LAST_REFRESH', payload: new Date() });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to refresh logistics data' });
    } finally {
      dispatch({ type: 'SET_REFRESHING', payload: false });
    }
  }, [refreshProjects, refreshSites, refreshMaterials, refreshLogisticsStats, calculateKPIs]);

  // ===== Project/Site Selection =====

  const selectProject = useCallback(async (projectId: string | null) => {
    const project = state.projects.find(p => p.id === projectId) || null;
    dispatch({
      type: 'SET_PROJECT',
      payload: { projectId, project },
    });

    // Persist selection
    if (projectId) {
      await AsyncStorage.setItem(STORAGE_KEYS.PROJECT_ID, projectId);
    } else {
      await AsyncStorage.removeItem(STORAGE_KEYS.PROJECT_ID);
    }
  }, [state.projects]);

  const selectSite = useCallback(async (siteId: string | null) => {
    const site = state.sites.find(s => s.id === siteId) || null;
    dispatch({
      type: 'SET_SITE',
      payload: { siteId, site },
    });

    // Persist selection
    if (siteId) {
      await AsyncStorage.setItem(STORAGE_KEYS.SITE_ID, siteId);
    } else {
      await AsyncStorage.removeItem(STORAGE_KEYS.SITE_ID);
    }
  }, [state.sites]);

  // ===== Alerts Management =====

  const addAlert = useCallback((alertData: Omit<LogisticsAlert, 'id' | 'timestamp' | 'acknowledged'>) => {
    const newAlert: LogisticsAlert = {
      ...alertData,
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      acknowledged: false,
    };
    dispatch({ type: 'ADD_ALERT', payload: newAlert });
  }, []);

  const acknowledgeAlert = useCallback((alertId: string) => {
    dispatch({ type: 'ACKNOWLEDGE_ALERT', payload: alertId });
  }, []);

  const dismissAlert = useCallback((alertId: string) => {
    dispatch({ type: 'DISMISS_ALERT', payload: alertId });
  }, []);

  // ===== Actions Management =====

  const addPendingAction = useCallback((actionData: Omit<PendingAction, 'id'>) => {
    const newAction: PendingAction = {
      ...actionData,
      id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
    dispatch({ type: 'ADD_PENDING_ACTION', payload: newAction });
  }, []);

  const updateActionStatus = useCallback((actionId: string, status: PendingAction['status']) => {
    dispatch({ type: 'UPDATE_ACTION_STATUS', payload: { actionId, status } });
  }, []);

  // ===== Sync Management =====

  const setPendingSyncCount = useCallback((count: number) => {
    dispatch({ type: 'SET_PENDING_SYNC_COUNT', payload: count });
  }, []);

  const triggerSync = useCallback(async () => {
    // Don't sync if already syncing or offline
    if (state.syncStatus === 'syncing' || state.isOffline) {
      if (state.isOffline) {
        logger.warn('[LogisticsContext] Cannot sync while offline');
      }
      return;
    }

    dispatch({ type: 'SET_SYNC_STATUS', payload: 'syncing' });

    try {
      logger.info('[LogisticsContext] Sync started', {
        pendingCount: state.pendingSyncCount,
      });

      // Perform a full refresh which will sync data
      await refresh();

      dispatch({ type: 'SET_SYNC_STATUS', payload: 'success' });
      dispatch({ type: 'SET_LAST_SYNC_TIME', payload: Date.now() });
      dispatch({ type: 'SET_PENDING_SYNC_COUNT', payload: 0 });

      logger.info('[LogisticsContext] Sync completed successfully');

      // Reset to idle after success feedback
      setTimeout(() => {
        dispatch({ type: 'SET_SYNC_STATUS', payload: 'idle' });
      }, 2000);
    } catch (error) {
      dispatch({ type: 'SET_SYNC_STATUS', payload: 'error' });
      logger.error('[LogisticsContext] Sync failed', error as Error);

      // Reset to idle after error feedback
      setTimeout(() => {
        dispatch({ type: 'SET_SYNC_STATUS', payload: 'idle' });
      }, 3000);
    }
  }, [state.syncStatus, state.isOffline, state.pendingSyncCount, refresh]);

  // ===== Effects =====

  // Load saved state from AsyncStorage
  useEffect(() => {
    const loadSavedState = async () => {
      try {
        const [savedProjectId, savedSiteId] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.PROJECT_ID),
          AsyncStorage.getItem(STORAGE_KEYS.SITE_ID),
        ]);

        if (savedProjectId) {
          // Project will be set once projects are loaded
          dispatch({
            type: 'SET_PROJECT',
            payload: { projectId: savedProjectId, project: null },
          });
        }

        if (savedSiteId) {
          dispatch({
            type: 'SET_SITE',
            payload: { siteId: savedSiteId, site: null },
          });
        }
      } catch (error) {
        // Non-critical error
      }
    };

    loadSavedState();
  }, []);

  // Initial data load
  useEffect(() => {
    const loadInitialData = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        await refresh();
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    loadInitialData();
  }, []);

  // Load sites when project changes
  useEffect(() => {
    if (state.selectedProjectId) {
      refreshSites();
      refreshMaterials();
      refreshLogisticsStats();
    }
  }, [state.selectedProjectId]);

  // Update project object when projects list is loaded
  useEffect(() => {
    if (state.selectedProjectId && state.projects.length > 0 && !state.selectedProject) {
      const project = state.projects.find(p => p.id === state.selectedProjectId);
      if (project) {
        dispatch({
          type: 'SET_PROJECT',
          payload: { projectId: state.selectedProjectId, project },
        });
      }
    }
  }, [state.projects, state.selectedProjectId, state.selectedProject]);

  // Update site object when sites list is loaded
  useEffect(() => {
    if (state.selectedSiteId && state.sites.length > 0 && !state.selectedSite) {
      const site = state.sites.find(s => s.id === state.selectedSiteId);
      if (site) {
        dispatch({
          type: 'SET_SITE',
          payload: { siteId: state.selectedSiteId, site },
        });
      }
    }
  }, [state.sites, state.selectedSiteId, state.selectedSite]);

  // Recalculate KPIs when materials change
  useEffect(() => {
    calculateKPIs();
  }, [state.materials, calculateKPIs]);

  // ===== Context Value =====

  const value: LogisticsContextValue = {
    ...state,
    selectProject,
    selectSite,
    refreshProjects,
    refreshSites,
    refreshMaterials,
    refreshLogisticsStats,
    refresh,
    addAlert,
    acknowledgeAlert,
    dismissAlert,
    addPendingAction,
    updateActionStatus,
    triggerSync,
    setPendingSyncCount,
  };

  return (
    <LogisticsContext.Provider value={value}>
      {children}
    </LogisticsContext.Provider>
  );
};

// ==================== Hooks ====================

export const useLogistics = (): LogisticsContextValue => {
  const context = useContext(LogisticsContext);
  if (!context) {
    throw new Error('useLogistics must be used within LogisticsProvider');
  }
  return context;
};

// Alias for consistency with other contexts
export const useLogisticsContext = useLogistics;

export default LogisticsContext;
