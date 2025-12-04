import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { database } from '../../../models/database';
import { useAuth } from '../../auth/AuthContext';

/**
 * DesignEngineerContext (v2.11)
 *
 * Provides shared state management across Design Engineer role screens.
 * Similar to ManagerContext pattern.
 *
 * Features:
 * - Project isolation (design engineer assigned to one project)
 * - DOORS package filtering
 * - Design RFQ filtering
 * - Refresh trigger for data updates
 * - Project loading from database on login
 *
 * Design Engineer Role Scope:
 * - Manages DOORS packages (100 requirements per equipment/material)
 * - Creates and manages Design RFQs (engineering phase, pre-PM200)
 * - Tracks design compliance and engineering progress
 */

interface DesignEngineerContextType {
  engineerId: string;
  setEngineerId: (id: string) => void;
  projectId: string;
  setProjectId: (id: string) => void;
  projectName: string;
  setProjectName: (name: string) => void;
  selectedDoorsId: string | null;
  setSelectedDoorsId: (id: string | null) => void;
  filterStatus: string | null;
  setFilterStatus: (status: string | null) => void;
  filterCategory: string | null;
  setFilterCategory: (category: string | null) => void;
  refreshTrigger: number;
  triggerRefresh: () => void;
}

const DesignEngineerContext = createContext<DesignEngineerContextType | undefined>(undefined);

const ENGINEER_ID_KEY = '@design_engineer_id';
const PROJECT_ID_KEY = '@design_engineer_project_id';
const PROJECT_NAME_KEY = '@design_engineer_project_name';

export const DesignEngineerProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth(); // Get logged-in user
  const [engineerId, setEngineerIdState] = useState<string>('');
  const [projectId, setProjectIdState] = useState<string>('');
  const [projectName, setProjectNameState] = useState<string>('');
  const [selectedDoorsId, setSelectedDoorsId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Load design engineer's project from database when user logs in OR when role switching
  useEffect(() => {
    const loadEngineerProject = async () => {
      if (!user || !user.userId) {
        console.log('[DesignEngineerContext] No user or userId available');
        return;
      }

      try {
        console.log('[DesignEngineerContext] Loading project for user:', user.userId);

        // Fetch user from database to get project assignment
        let userRecord;
        try {
          userRecord = await database.collections.get('users').find(user.userId);
        } catch (findError) {
          console.log('[DesignEngineerContext] User not found by ID, checking if role switching...');

          // When role switching from Admin, user.userId is admin's ID
          // Find the actual Design Engineer user instead
          const rolesCollection = database.collections.get('roles');
          const roles = await rolesCollection.query().fetch();
          const designEngineerRole = roles.find((r: any) => r.name === 'DesignEngineer');

          if (designEngineerRole) {
            console.log('[DesignEngineerContext] Found DesignEngineer role:', designEngineerRole.id);
            const usersCollection = database.collections.get('users');
            const designEngineers = await usersCollection
              .query(Q.where('role_id', designEngineerRole.id))
              .fetch();

            if (designEngineers.length > 0) {
              userRecord = designEngineers[0]; // Get first design engineer
              console.log('[DesignEngineerContext] Found Design Engineer user:', (userRecord as any).username);
            }
          }
        }

        if (userRecord) {
          const projectId = (userRecord as any).projectId;
          const userId = (userRecord as any).id;
          console.log('[DesignEngineerContext] User record found');
          console.log('[DesignEngineerContext] User projectId:', projectId);
          console.log('[DesignEngineerContext] ProjectId type:', typeof projectId);

          if (projectId) {
            try {
              // Fetch project details
              const project = await database.collections.get('projects').find(projectId);
              const projectName = (project as any).name;

              console.log('[DesignEngineerContext] Project found:', projectName);
              console.log('[DesignEngineerContext] Setting project in context...');

              // Update context state and persist to AsyncStorage
              await setProjectId(projectId);
              await setProjectName(projectName);
              await setEngineerId(userId); // Use the design engineer's actual ID

              console.log('[DesignEngineerContext] ✅ Project loaded successfully');
            } catch (projectError) {
              console.error('[DesignEngineerContext] ❌ Error fetching project:', projectError);
            }
          } else {
            console.log('[DesignEngineerContext] ⚠️ No project assigned to user (projectId is null/undefined)');
          }
        } else {
          console.log('[DesignEngineerContext] ❌ User record not found in database');
        }
      } catch (error) {
        console.error('[DesignEngineerContext] ❌ Error loading engineer project:', error);
      }
    };

    loadEngineerProject();
  }, [user]);

  // Load saved data on mount (fallback if user context not available)
  useEffect(() => {
    const loadSavedData = async () => {
      try {
        const [savedEngineerId, savedProjectId, savedProjectName] = await Promise.all([
          AsyncStorage.getItem(ENGINEER_ID_KEY),
          AsyncStorage.getItem(PROJECT_ID_KEY),
          AsyncStorage.getItem(PROJECT_NAME_KEY),
        ]);

        if (savedEngineerId && !user) {
          setEngineerIdState(savedEngineerId);
        }

        if (savedProjectId && !user) {
          setProjectIdState(savedProjectId);
        }

        if (savedProjectName && !user) {
          setProjectNameState(savedProjectName);
        }
      } catch (error) {
        console.error('[DesignEngineerContext] Error loading saved data:', error);
      }
    };

    loadSavedData();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Save engineer ID when it changes
  const setEngineerId = async (id: string) => {
    setEngineerIdState(id);
    try {
      await AsyncStorage.setItem(ENGINEER_ID_KEY, id);
    } catch (error) {
      console.error('[DesignEngineerContext] Error saving engineer ID:', error);
    }
  };

  // Save project ID when it changes
  const setProjectId = async (id: string) => {
    setProjectIdState(id);
    try {
      await AsyncStorage.setItem(PROJECT_ID_KEY, id);
    } catch (error) {
      console.error('[DesignEngineerContext] Error saving project ID:', error);
    }
  };

  // Save project name when it changes
  const setProjectName = async (name: string) => {
    setProjectNameState(name);
    try {
      await AsyncStorage.setItem(PROJECT_NAME_KEY, name);
    } catch (error) {
      console.error('[DesignEngineerContext] Error saving project name:', error);
    }
  };

  const triggerRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <DesignEngineerContext.Provider
      value={{
        engineerId,
        setEngineerId,
        projectId,
        setProjectId,
        projectName,
        setProjectName,
        selectedDoorsId,
        setSelectedDoorsId,
        filterStatus,
        setFilterStatus,
        filterCategory,
        setFilterCategory,
        refreshTrigger,
        triggerRefresh,
      }}
    >
      {children}
    </DesignEngineerContext.Provider>
  );
};

export const useDesignEngineerContext = () => {
  const context = useContext(DesignEngineerContext);
  if (!context) {
    throw new Error('useDesignEngineerContext must be used within DesignEngineerProvider');
  }
  return context;
};

// Alias for convenience
export const useDesignEngineer = useDesignEngineerContext;
