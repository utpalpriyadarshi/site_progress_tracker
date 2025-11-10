import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuthService from '../../services/auth/AuthService';
import TokenStorage from '../../services/storage/TokenStorage';

export type UserRole = 'supervisor' | 'manager' | 'planning' | 'logistics' | 'admin';

interface User {
  userId: string;
  username: string;
  fullName?: string;
  email?: string;
  availableRoles: UserRole[];
}

interface Tokens {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiry: number;
  refreshTokenExpiry: number;
}

interface AuthContextType {
  user: User | null;
  currentRole: UserRole | null;
  tokens: Tokens | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (userId: string, username: string, availableRoles: UserRole[], tokens?: Tokens) => Promise<void>;
  logout: () => Promise<void>;
  selectRole: (role: UserRole) => Promise<void>;
  getLastSelectedRole: () => Promise<UserRole | null>;
  refreshAccessToken: () => Promise<boolean>;
  getAccessToken: () => Promise<string | null>;
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
  const [tokens, setTokens] = useState<Tokens | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load persisted auth state on mount (restore session with JWT)
  useEffect(() => {
    loadAuthState();
  }, []);

  const loadAuthState = async () => {
    try {
      console.log('AuthContext: Restoring session...');

      // Try to restore JWT session first
      const session = await AuthService.restoreSession();

      if (session) {
        console.log('AuthContext: JWT session restored');

        // In development mode, allow access to all roles for testing
        const allRoles: UserRole[] = ['supervisor', 'manager', 'planning', 'logistics', 'admin'];
        const backendRole = session.user.role as UserRole;
        const rolesToUse = __DEV__ ? allRoles : [backendRole];

        setUser({
          userId: session.user.userId,
          username: session.user.username,
          availableRoles: rolesToUse,
        });
        setCurrentRole(backendRole);

        // Load tokens
        const storedTokens = await TokenStorage.getTokens();
        if (storedTokens) {
          setTokens(storedTokens);
        }
      } else {
        // Fallback: Try old storage format for backward compatibility
        console.log('AuthContext: No JWT session, trying legacy storage...');
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
      }
    } catch (error) {
      console.error('AuthContext: Failed to load auth state:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (
    userId: string,
    username: string,
    availableRoles: UserRole[],
    jwtTokens?: Tokens
  ) => {
    try {
      // In development mode (__DEV__), allow access to all roles for testing
      // In production, only use the roles assigned by backend
      const allRoles: UserRole[] = ['supervisor', 'manager', 'planning', 'logistics', 'admin'];
      const rolesToUse = __DEV__ ? allRoles : availableRoles;

      const userData: User = {
        userId,
        username,
        availableRoles: rolesToUse,
      };

      console.log('AuthContext: Login -', {
        isDev: __DEV__,
        backendRoles: availableRoles,
        assignedRoles: rolesToUse,
      });

      // Store user data (legacy format for compatibility)
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
      setUser(userData);

      // Automatically set currentRole to first available role if not already set
      // This ensures RoleSwitcher has a role to display
      if (rolesToUse.length > 0) {
        const roleToSet = rolesToUse[0];
        console.log('AuthContext: Setting currentRole to', roleToSet);
        await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_ROLE, JSON.stringify(roleToSet));
        setCurrentRole(roleToSet);
      }

      // Store JWT tokens if provided
      if (jwtTokens) {
        console.log('AuthContext: Storing JWT tokens');
        setTokens(jwtTokens);
        // Tokens are already stored by AuthService, but we update state
      }
    } catch (error) {
      console.error('AuthContext: Failed to save user data:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      console.log('AuthContext: Logging out...');

      // Use AuthService to clear JWT tokens
      await AuthService.logout();

      // Clear legacy storage
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.USER),
        AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_ROLE),
        AsyncStorage.removeItem(STORAGE_KEYS.LAST_ROLE),
      ]);

      // Clear state
      setUser(null);
      setCurrentRole(null);
      setTokens(null);

      console.log('AuthContext: Logout complete');
    } catch (error) {
      console.error('AuthContext: Failed to logout:', error);
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

  const refreshAccessToken = async (): Promise<boolean> => {
    try {
      console.log('AuthContext: Refreshing access token...');

      if (!tokens?.refreshToken) {
        console.log('AuthContext: No refresh token available');
        return false;
      }

      const result = await AuthService.refreshAccessToken(tokens.refreshToken);

      if (result.success && result.accessToken && result.accessTokenExpiry) {
        // Update tokens in state
        setTokens({
          ...tokens,
          accessToken: result.accessToken,
          accessTokenExpiry: result.accessTokenExpiry,
        });
        console.log('AuthContext: Access token refreshed');
        return true;
      }

      console.log('AuthContext: Failed to refresh token');
      return false;
    } catch (error) {
      console.error('AuthContext: Error refreshing token:', error);
      return false;
    }
  };

  const getAccessToken = async (): Promise<string | null> => {
    try {
      // Use AuthService which handles automatic refresh
      return await AuthService.getAccessToken();
    } catch (error) {
      console.error('AuthContext: Error getting access token:', error);
      return null;
    }
  };

  const isAuthenticated = !!user && !!tokens;

  return (
    <AuthContext.Provider
      value={{
        user,
        currentRole,
        tokens,
        isLoading,
        isAuthenticated,
        login,
        logout,
        selectRole,
        getLastSelectedRole,
        refreshAccessToken,
        getAccessToken,
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
