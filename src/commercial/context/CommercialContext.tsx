import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { database } from '../../../models/database';
import { Q } from '@nozbe/watermelondb';
import { useAuth } from '../../auth/AuthContext';
import { logger } from '../../services/LoggingService';

/**
 * CommercialContext (v2.11 Phase 5)
 *
 * Provides shared state management across Commercial Manager role screens.
 * Similar to DesignEngineerContext pattern.
 *
 * Features:
 * - Project isolation (commercial manager assigned to one project)
 * - Budget filtering and management
 * - Cost tracking and analysis
 * - Invoice management
 * - Financial reporting
 * - Refresh trigger for data updates
 * - Project loading from database on login
 *
 * Commercial Manager Role Scope:
 * - Manages project budgets (PROJECT LEVEL ONLY - no site breakdown)
 * - Tracks actual costs against budget
 * - Manages invoices and payment status
 * - Generates financial reports and variance analysis
 * - Cash flow projection
 */

interface CommercialContextType {
  managerId: string;
  setManagerId: (id: string) => void;
  projectId: string;
  setProjectId: (id: string) => void;
  projectName: string;
  setProjectName: (name: string) => void;

  // Budget filtering
  selectedBudgetCategory: string | null;
  setSelectedBudgetCategory: (category: string | null) => void;

  // Cost filtering
  selectedCostCategory: string | null;
  setSelectedCostCategory: (category: string | null) => void;

  // Invoice filtering
  selectedInvoiceStatus: string | null;
  setSelectedInvoiceStatus: (status: string | null) => void;

  // Date range filtering for reports
  startDate: Date | null;
  setStartDate: (date: Date | null) => void;
  endDate: Date | null;
  setEndDate: (date: Date | null) => void;

  // Refresh trigger
  refreshTrigger: number;
  triggerRefresh: () => void;
}

const CommercialContext = createContext<CommercialContextType | undefined>(undefined);

const MANAGER_ID_KEY = '@commercial_manager_id';
const PROJECT_ID_KEY = '@commercial_project_id';
const PROJECT_NAME_KEY = '@commercial_project_name';

export const CommercialProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth(); // Get logged-in user
  const [managerId, setManagerIdState] = useState<string>('');
  const [projectId, setProjectIdState] = useState<string>('');
  const [projectName, setProjectNameState] = useState<string>('');
  const [selectedBudgetCategory, setSelectedBudgetCategory] = useState<string | null>(null);
  const [selectedCostCategory, setSelectedCostCategory] = useState<string | null>(null);
  const [selectedInvoiceStatus, setSelectedInvoiceStatus] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Load commercial manager's project from database when user logs in OR when role switching
  useEffect(() => {
    const loadManagerProject = async () => {
      if (!user || !user.userId) {
        logger.debug('[CommercialContext] No user or userId available');
        return;
      }

      try {
        logger.debug('[CommercialContext] Loading project for user:', user.userId);

        // Fetch user from database to get project assignment
        let userRecord;
        try {
          userRecord = await database.collections.get('users').find(user.userId);
        } catch (findError) {
          logger.debug('[CommercialContext] User not found by ID, checking if role switching...');

          // When role switching from Admin, user.userId is admin's ID
          // Find the actual Commercial Manager user instead
          const rolesCollection = database.collections.get('roles');
          const roles = await rolesCollection.query().fetch();
          const commercialRole = roles.find((r: any) => r.name === 'CommercialManager');

          if (commercialRole) {
            logger.debug('[CommercialContext] Found CommercialManager role:', commercialRole.id);
            const usersCollection = database.collections.get('users');
            const commercialManagers = await usersCollection
              .query(Q.where('role_id', commercialRole.id))
              .fetch();

            if (commercialManagers.length > 0) {
              userRecord = commercialManagers[0];
              logger.debug('[CommercialContext] Found Commercial Manager user:', (userRecord as any).username);
            }
          }
        }

        if (userRecord) {
          const projectId = (userRecord as any).projectId;
          const userId = (userRecord as any).id;

          logger.debug('[CommercialContext] User project assignment:', projectId);

          if (projectId) {
            const project = await database.collections.get('projects').find(projectId);
            const projectName = (project as any).name;

            logger.debug('[CommercialContext] Project found:', projectName);

            // Save to state
            await setManagerId(userId);
            await setProjectId(projectId);
            await setProjectName(projectName);

            logger.debug('[CommercialContext] ✅ Project loaded successfully');
          } else {
            logger.warn('[CommercialContext] ⚠️ User has no project assignment');
          }
        } else {
          logger.warn('[CommercialContext] ⚠️ No user record found');
        }
      } catch (error) {
        logger.error('[CommercialContext] ❌ Error loading manager project:', error);
      }
    };

    loadManagerProject();
  }, [user]);

  // Persist managerId to AsyncStorage
  const setManagerId = async (id: string) => {
    setManagerIdState(id);
    try {
      await AsyncStorage.setItem(MANAGER_ID_KEY, id);
    } catch (error) {
      logger.error('[CommercialContext] Error saving manager ID:', error);
    }
  };

  // Persist projectId to AsyncStorage
  const setProjectId = async (id: string) => {
    setProjectIdState(id);
    try {
      await AsyncStorage.setItem(PROJECT_ID_KEY, id);
    } catch (error) {
      logger.error('[CommercialContext] Error saving project ID:', error);
    }
  };

  // Persist projectName to AsyncStorage
  const setProjectName = async (name: string) => {
    setProjectNameState(name);
    try {
      await AsyncStorage.setItem(PROJECT_NAME_KEY, name);
    } catch (error) {
      logger.error('[CommercialContext] Error saving project name:', error);
    }
  };

  // Load persisted data on mount
  useEffect(() => {
    const loadPersistedData = async () => {
      try {
        const savedManagerId = await AsyncStorage.getItem(MANAGER_ID_KEY);
        const savedProjectId = await AsyncStorage.getItem(PROJECT_ID_KEY);
        const savedProjectName = await AsyncStorage.getItem(PROJECT_NAME_KEY);

        if (savedManagerId) setManagerIdState(savedManagerId);
        if (savedProjectId) setProjectIdState(savedProjectId);
        if (savedProjectName) setProjectNameState(savedProjectName);
      } catch (error) {
        logger.error('[CommercialContext] Error loading persisted data:', error);
      }
    };

    loadPersistedData();
  }, []);

  const triggerRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const value: CommercialContextType = {
    managerId,
    setManagerId,
    projectId,
    setProjectId,
    projectName,
    setProjectName,
    selectedBudgetCategory,
    setSelectedBudgetCategory,
    selectedCostCategory,
    setSelectedCostCategory,
    selectedInvoiceStatus,
    setSelectedInvoiceStatus,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    refreshTrigger,
    triggerRefresh,
  };

  return <CommercialContext.Provider value={value}>{children}</CommercialContext.Provider>;
};

export const useCommercial = (): CommercialContextType => {
  const context = useContext(CommercialContext);
  if (!context) {
    throw new Error('useCommercial must be used within CommercialProvider');
  }
  return context;
};

export default CommercialContext;
