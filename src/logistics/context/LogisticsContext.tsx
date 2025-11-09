import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { database } from '../../../models/database';
import ProjectModel from '../../../models/ProjectModel';
import MaterialModel from '../../../models/MaterialModel';

/**
 * LogisticsContext
 *
 * Provides shared state management across all logistics tabs:
 * - Centralized data loading and caching
 * - Real-time alert management
 * - Cross-tab communication
 * - Performance optimization
 */

// ===== TYPES & INTERFACES =====

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
  // Material KPIs
  totalMaterialsTracked: number;
  materialsAtRisk: number;
  procurementCycleTime: number; // Days

  // Equipment KPIs
  totalEquipment: number;
  equipmentAvailability: number; // Percentage
  maintenanceCompliance: number; // Percentage

  // Delivery KPIs
  deliveriesThisWeek: number;
  onTimeDeliveryRate: number;
  averageDeliveryCost: number;

  // Inventory KPIs
  totalInventoryValue: number;
  inventoryTurnover: number;
  stockAccuracy: number; // Percentage
}

export interface LogisticsContextValue {
  // Shared Data
  selectedProjectId: string | null;
  setSelectedProjectId: (projectId: string | null) => void;
  projects: ProjectModel[];
  materials: MaterialModel[];

  // Loading States
  loading: boolean;
  refreshing: boolean;

  // Alerts & Actions
  alerts: LogisticsAlert[];
  pendingActions: PendingAction[];
  addAlert: (alert: Omit<LogisticsAlert, 'id' | 'timestamp' | 'acknowledged'>) => void;
  acknowledgeAlert: (alertId: string) => void;
  dismissAlert: (alertId: string) => void;
  addPendingAction: (action: Omit<PendingAction, 'id'>) => void;
  updateActionStatus: (actionId: string, status: PendingAction['status']) => void;

  // KPIs
  kpis: LogisticsKPIs;

  // Data Refresh
  refresh: () => Promise<void>;
  refreshProjects: () => Promise<void>;
  refreshMaterials: () => Promise<void>;

  // Cache Management
  lastRefreshTime: Date | null;
}

// ===== CONTEXT =====

const LogisticsContext = createContext<LogisticsContextValue | undefined>(undefined);

// ===== PROVIDER =====

interface LogisticsProviderProps {
  children: React.ReactNode;
}

export const LogisticsProvider: React.FC<LogisticsProviderProps> = ({ children }) => {
  // State
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [projects, setProjects] = useState<ProjectModel[]>([]);
  const [materials, setMaterials] = useState<MaterialModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [alerts, setAlerts] = useState<LogisticsAlert[]>([]);
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);

  // KPIs state (will be calculated from data)
  const [kpis, setKpis] = useState<LogisticsKPIs>({
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
  });

  // ===== DATA LOADING =====

  const refreshProjects = useCallback(async () => {
    try {
      const projectsList = await database.collections
        .get<ProjectModel>('projects')
        .query()
        .fetch();
      setProjects(projectsList);

      // Auto-select first project if none selected
      if (!selectedProjectId && projectsList.length > 0) {
        setSelectedProjectId(projectsList[0].id);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  }, [selectedProjectId]);

  const refreshMaterials = useCallback(async () => {
    try {
      const materialsList = await database.collections
        .get<MaterialModel>('materials')
        .query()
        .fetch();
      setMaterials(materialsList);
    } catch (error) {
      console.error('Error loading materials:', error);
    }
  }, []);

  const calculateKPIs = useCallback(async () => {
    try {
      // Material KPIs
      const totalMaterialsTracked = materials.length;
      const materialsAtRisk = materials.filter(m => {
        // Consider material at risk if quantity is low
        // This is a simplified calculation - will be enhanced with BOM data
        return m.quantityAvailable < m.quantityRequired * 0.3;
      }).length;

      // For now, use placeholder values for KPIs that require more complex data
      // These will be enhanced as we build out each module
      setKpis({
        totalMaterialsTracked,
        materialsAtRisk,
        procurementCycleTime: 7, // Placeholder
        totalEquipment: 0, // Will be calculated when equipment module is added
        equipmentAvailability: 0,
        maintenanceCompliance: 0,
        deliveriesThisWeek: 0,
        onTimeDeliveryRate: 0,
        averageDeliveryCost: 0,
        totalInventoryValue: 0, // TODO: Add unitCost field to MaterialModel to calculate inventory value
        inventoryTurnover: 0,
        stockAccuracy: 100, // Placeholder
      });
    } catch (error) {
      console.error('Error calculating KPIs:', error);
    }
  }, [materials]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refreshProjects(),
        refreshMaterials(),
      ]);
      await calculateKPIs();
      setLastRefreshTime(new Date());
    } catch (error) {
      console.error('Error refreshing logistics data:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refreshProjects, refreshMaterials, calculateKPIs]);

  // Initial load
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        await refresh();
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Recalculate KPIs when data changes
  useEffect(() => {
    calculateKPIs();
  }, [materials, calculateKPIs]);

  // ===== ALERT MANAGEMENT =====

  const addAlert = useCallback((alertData: Omit<LogisticsAlert, 'id' | 'timestamp' | 'acknowledged'>) => {
    const newAlert: LogisticsAlert = {
      ...alertData,
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      acknowledged: false,
    };

    setAlerts(prev => [newAlert, ...prev]);
  }, []);

  const acknowledgeAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.map(alert =>
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    ));
  }, []);

  const dismissAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  }, []);

  // ===== ACTION MANAGEMENT =====

  const addPendingAction = useCallback((actionData: Omit<PendingAction, 'id'>) => {
    const newAction: PendingAction = {
      ...actionData,
      id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

    setPendingActions(prev => [newAction, ...prev]);
  }, []);

  const updateActionStatus = useCallback((actionId: string, status: PendingAction['status']) => {
    setPendingActions(prev => prev.map(action =>
      action.id === actionId ? { ...action, status } : action
    ));
  }, []);

  // ===== CONTEXT VALUE =====

  const contextValue: LogisticsContextValue = {
    selectedProjectId,
    setSelectedProjectId,
    projects,
    materials,
    loading,
    refreshing,
    alerts,
    pendingActions,
    addAlert,
    acknowledgeAlert,
    dismissAlert,
    addPendingAction,
    updateActionStatus,
    kpis,
    refresh,
    refreshProjects,
    refreshMaterials,
    lastRefreshTime,
  };

  return (
    <LogisticsContext.Provider value={contextValue}>
      {children}
    </LogisticsContext.Provider>
  );
};

// ===== HOOK =====

export const useLogistics = (): LogisticsContextValue => {
  const context = useContext(LogisticsContext);
  if (!context) {
    throw new Error('useLogistics must be used within LogisticsProvider');
  }
  return context;
};

export default LogisticsContext;
