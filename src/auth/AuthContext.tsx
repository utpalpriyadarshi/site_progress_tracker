import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type UserRole = 'supervisor' | 'manager' | 'planning' | 'logistics';

interface User {
  userId: string;
  username: string;
  availableRoles: UserRole[];
}

interface AuthContextType {
  user: User | null;
  currentRole: UserRole | null;
  isLoading: boolean;
  login: (userId: string, username: string, availableRoles: UserRole[]) => Promise<void>;
  logout: () => Promise<void>;
  selectRole: (role: UserRole) => Promise<void>;
  getLastSelectedRole: () => Promise<UserRole | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEYS = {
  USER: '@auth:user',
  CURRENT_ROLE: '@auth:current_role',
  LAST_ROLE: '@auth:last_role',
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [currentRole, setCurrentRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load persisted auth state on mount
  useEffect(() => {
    loadAuthState();
  }, []);

  const loadAuthState = async () => {
    try {
      const [userJson, roleJson] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.USER),
        AsyncStorage.getItem(STORAGE_KEYS.CURRENT_ROLE),
      ]);

      if (userJson) {
        setUser(JSON.parse(userJson));
      }
      if (roleJson) {
        setCurrentRole(JSON.parse(roleJson) as UserRole);
      }
    } catch (error) {
      console.error('Failed to load auth state:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (userId: string, username: string, availableRoles: UserRole[]) => {
    try {
      const userData: User = {
        userId,
        username,
        availableRoles,
      };

      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
      setUser(userData);
    } catch (error) {
      console.error('Failed to save user data:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.USER),
        AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_ROLE),
      ]);
      setUser(null);
      setCurrentRole(null);
    } catch (error) {
      console.error('Failed to logout:', error);
      throw error;
    }
  };

  const selectRole = async (role: UserRole) => {
    try {
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.CURRENT_ROLE, JSON.stringify(role)),
        AsyncStorage.setItem(STORAGE_KEYS.LAST_ROLE, JSON.stringify(role)),
      ]);
      setCurrentRole(role);
    } catch (error) {
      console.error('Failed to select role:', error);
      throw error;
    }
  };

  const getLastSelectedRole = async (): Promise<UserRole | null> => {
    try {
      const lastRole = await AsyncStorage.getItem(STORAGE_KEYS.LAST_ROLE);
      return lastRole ? JSON.parse(lastRole) : null;
    } catch (error) {
      console.error('Failed to get last role:', error);
      return null;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        currentRole,
        isLoading,
        login,
        logout,
        selectRole,
        getLastSelectedRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
