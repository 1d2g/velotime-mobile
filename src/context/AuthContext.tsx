import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, apiRequest, getStoredToken, setStoredToken } from '../services/api';

export const DEMO_USER: User = {
  id: 'guest_mobile_user',
  email: 'demo@velotime.com',
  firstName: 'Studio',
  lastName: 'Partner',
  role: 'admin',
  organization: {
    id: 'org_demo_studio',
    name: 'Metropolis Architecture Studio',
    tier: 'pro',
  },
};

export type UserRole = 'admin' | 'manager' | 'employee';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isDemoMode: boolean;
  previewRole: UserRole;
  setPreviewRole: (role: UserRole) => void;
  isManager: boolean;
  signIn: (email: string, token: string, userObj?: User) => Promise<void>;
  enterDemoMode: () => Promise<void>;
  signOut: () => Promise<void>;
  syncStatus: 'synced' | 'syncing' | 'offline';
  setSyncStatus: (s: 'synced' | 'syncing' | 'offline') => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [previewRole, setPreviewRoleState] = useState<UserRole>('admin');
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline'>('synced');

  const setPreviewRole = (role: UserRole) => {
    setPreviewRoleState(role);
    AsyncStorage.setItem('velotime_preview_role', role).catch(() => {});
  };

  const isManager = useMemo(() => {
    if (previewRole === 'employee') return false;
    const baseRole = (user?.role || (isDemoMode ? 'admin' : 'employee')).toLowerCase();
    return baseRole === 'admin' || baseRole === 'manager' || previewRole === 'admin' || previewRole === 'manager';
  }, [user?.role, isDemoMode, previewRole]);

  useEffect(() => {
    async function loadInitialSession() {
      try {
        const storedToken = await getStoredToken();
        const storedUser = await AsyncStorage.getItem('velotime_user');
        const storedDemo = await AsyncStorage.getItem('velotime_is_demo');
        const storedPreviewRole = (await AsyncStorage.getItem('velotime_preview_role')) as UserRole | null;

        if (storedPreviewRole) {
          setPreviewRoleState(storedPreviewRole);
        }

        if (storedDemo === 'true') {
          setIsDemoMode(true);
          setUser(DEMO_USER);
        } else if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        } else {
          // Default to Demo Studio workspace so Apple reviewers and new visitors
          // experience zero-friction live timers and timesheets immediately upon launch!
          setIsDemoMode(true);
          setUser(DEMO_USER);
        }
      } catch (err) {
        setIsDemoMode(true);
        setUser(DEMO_USER);
      } finally {
        setIsLoading(false);
      }
    }
    loadInitialSession();
  }, []);

  const signIn = async (email: string, authToken: string, userObj?: User) => {
    setIsLoading(true);
    try {
      await setStoredToken(authToken);
      const finalUser = userObj || {
        id: 'usr_' + Date.now(),
        email,
        organization: { id: 'org_main', name: 'My Studio', tier: 'pro' },
      };
      await AsyncStorage.setItem('velotime_user', JSON.stringify(finalUser));
      await AsyncStorage.removeItem('velotime_is_demo');
      setToken(authToken);
      setUser(finalUser);
      setIsDemoMode(false);
    } finally {
      setIsLoading(false);
    }
  };

  const enterDemoMode = async () => {
    await setStoredToken(null);
    await AsyncStorage.setItem('velotime_is_demo', 'true');
    await AsyncStorage.removeItem('velotime_user');
    setIsDemoMode(true);
    setToken(null);
    setUser(DEMO_USER);
  };

  const signOut = async () => {
    await setStoredToken(null);
    await AsyncStorage.removeItem('velotime_user');
    await AsyncStorage.removeItem('velotime_is_demo');
    setUser(null);
    setToken(null);
    setIsDemoMode(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isDemoMode,
        previewRole,
        setPreviewRole,
        isManager,
        signIn,
        enterDemoMode,
        signOut,
        syncStatus,
        setSyncStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
