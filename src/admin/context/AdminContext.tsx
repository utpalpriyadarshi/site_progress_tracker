import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type AdminRole = 'Supervisor' | 'Manager' | 'Planner' | 'Logistics' | 'DesignEngineer' | null;

interface AdminContextType {
  selectedRole: AdminRole;
  setSelectedRole: (role: AdminRole) => void;
  isAdminMode: boolean;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

const STORAGE_KEY = '@admin_selected_role';

interface AdminProviderProps {
  children: ReactNode;
}

export const AdminProvider: React.FC<AdminProviderProps> = ({ children }) => {
  const [selectedRole, setSelectedRoleState] = useState<AdminRole>(null);
  const isAdminMode = selectedRole !== null;

  // Load saved role selection on mount
  useEffect(() => {
    const loadSavedRole = async () => {
      try {
        const savedRole = await AsyncStorage.getItem(STORAGE_KEY);
        if (savedRole && ['Supervisor', 'Manager', 'Planner', 'Logistics', 'DesignEngineer'].includes(savedRole)) {
          setSelectedRoleState(savedRole as AdminRole);
        }
      } catch (error) {
        console.error('Error loading saved admin role:', error);
      }
    };

    loadSavedRole();
  }, []);

  // Save role selection when it changes and persist to AsyncStorage
  const setSelectedRole = async (role: AdminRole) => {
    setSelectedRoleState(role);
    try {
      if (role) {
        await AsyncStorage.setItem(STORAGE_KEY, role);
      } else {
        await AsyncStorage.removeItem(STORAGE_KEY);
      }
    } catch (error) {
      console.error('Error saving admin role:', error);
    }
  };

  const value: AdminContextType = {
    selectedRole,
    setSelectedRole,
    isAdminMode,
  };

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
};

export const useAdminContext = (): AdminContextType => {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdminContext must be used within an AdminProvider');
  }
  return context;
};
