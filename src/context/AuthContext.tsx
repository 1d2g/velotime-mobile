import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import {
  User,
  API_BASE,
  SECURE_STORAGE_KEYS,
  getSecureValue,
  setSecureValue,
  getStoredToken,
  setStoredToken,
} from '../services/api';

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

export interface OrganizationSettings {
  orgName: string;
  invoicePrefix: string;
  nextInvoiceNumber: number;
  timerRoundingMinutes: 0 | 5 | 6 | 15;
  defaultTaxRate: number;
}

const DEFAULT_ORG_SETTINGS: OrganizationSettings = {
  orgName: 'Metropolis Architecture Studio',
  invoicePrefix: 'INV-2026-',
  nextInvoiceNumber: 105,
  timerRoundingMinutes: 0,
  defaultTaxRate: 0,
};

const BIOMETRIC_ENABLED_KEY = 'velotime_biometric_enabled';
const ORG_SETTINGS_KEY = 'velotime_org_settings';

interface SignInWorkspaceParams {
  email: string;
  name?: string;
  orgName?: string;
  apiKey?: string;
  role?: UserRole;
  enableBiometrics?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isDemoMode: boolean;
  previewRole: UserRole;
  setPreviewRole: (role: UserRole) => void;
  isManager: boolean;
  signIn: (email: string, token: string, userObj?: User) => Promise<void>;
  signInWithWorkspace: (params: SignInWorkspaceParams) => Promise<void>;
  enterDemoMode: () => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  syncStatus: 'synced' | 'syncing' | 'offline';
  setSyncStatus: (s: 'synced' | 'syncing' | 'offline') => void;
  isBiometricSupported: boolean;
  biometricLabel: string;
  biometricEnabled: boolean;
  isBiometricLocked: boolean;
  hasSavedCredentials: boolean;
  setBiometricEnabled: (enabled: boolean) => Promise<boolean>;
  authenticateWithFaceId: () => Promise<boolean>;
  orgSettings: OrganizationSettings;
  updateOrgSettings: (updates: Partial<OrganizationSettings>) => Promise<void>;
  isAuthModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [previewRole, setPreviewRoleState] = useState<UserRole>('admin');
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline'>('synced');

  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const [biometricLabel, setBiometricLabel] = useState('Face ID');
  const [biometricEnabled, setBiometricEnabledState] = useState(false);
  const [isBiometricLocked, setIsBiometricLocked] = useState(false);
  const [hasSavedCredentials, setHasSavedCredentials] = useState(false);
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);
  const [orgSettings, setOrgSettings] = useState<OrganizationSettings>(DEFAULT_ORG_SETTINGS);

  const setPreviewRole = (role: UserRole) => {
    setPreviewRoleState(role);
    AsyncStorage.setItem('velotime_preview_role', role).catch(() => {});
  };

  const isManager = useMemo(() => {
    if (previewRole === 'employee') return false;
    const baseRole = (user?.role || (isDemoMode ? 'admin' : 'employee')).toLowerCase();
    return (
      baseRole === 'admin' ||
      baseRole === 'manager' ||
      previewRole === 'admin' ||
      previewRole === 'manager'
    );
  }, [user?.role, isDemoMode, previewRole]);

  const updateOrgSettings = useCallback(async (updates: Partial<OrganizationSettings>) => {
    setOrgSettings((prev) => {
      const next = { ...prev, ...updates };
      AsyncStorage.setItem(ORG_SETTINGS_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const authenticateWithFaceId = useCallback(async (): Promise<boolean> => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();

      if (!compatible || !enrolled) {
        setIsBiometricLocked(false);
        return false;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: `Sign in to VeloTime with ${biometricLabel}`,
        fallbackLabel: 'Use Passcode',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });

      if (!result.success) {
        return false;
      }

      setIsBiometricLocked(false);

      // Restore Keychain-saved workspace credentials if signed out
      const [secureUserJson, secureToken] = await Promise.all([
        getSecureValue(SECURE_STORAGE_KEYS.USER),
        getStoredToken(),
      ]);

      if (secureUserJson) {
        try {
          const parsedUser = JSON.parse(secureUserJson) as User;
          setUser(parsedUser);
          setToken(secureToken || 'vt_faceid_session');
          setIsDemoMode(false);
          setHasSavedCredentials(true);
          setAuthModalOpen(false);
          return true;
        } catch {}
      }

      // If unlocked from studio/default state, keep active or restore Demo Studio
      setUser((prev) => prev || DEMO_USER);
      setIsDemoMode((prev) => (secureUserJson ? prev : true));
      setAuthModalOpen(false);
      return true;
    } catch {
      return false;
    }
  }, [biometricLabel]);

  useEffect(() => {
    async function loadInitialSession() {
      try {
        const [
          compatible,
          enrolled,
          types,
          storedToken,
          storedUser,
          secureUser,
          storedDemo,
          storedPreviewRole,
          storedBioEnabled,
          storedOrgSettings,
        ] = await Promise.all([
          LocalAuthentication.hasHardwareAsync().catch(() => false),
          LocalAuthentication.isEnrolledAsync().catch(() => false),
          LocalAuthentication.supportedAuthenticationTypesAsync().catch(
            (): LocalAuthentication.AuthenticationType[] => []
          ),
          getStoredToken(),
          AsyncStorage.getItem('velotime_user'),
          getSecureValue(SECURE_STORAGE_KEYS.USER),
          AsyncStorage.getItem('velotime_is_demo'),
          AsyncStorage.getItem('velotime_preview_role'),
          AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY),
          AsyncStorage.getItem(ORG_SETTINGS_KEY),
        ]);

        const bioAvailable = Boolean(compatible && enrolled);
        setIsBiometricSupported(bioAvailable);
        if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
          setBiometricLabel('Face ID');
        } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
          setBiometricLabel('Touch ID');
        } else {
          setBiometricLabel('Biometrics');
        }

        if (storedOrgSettings) {
          try {
            setOrgSettings({ ...DEFAULT_ORG_SETTINGS, ...JSON.parse(storedOrgSettings) });
          } catch {}
        }

        if (storedPreviewRole === 'admin' || storedPreviewRole === 'manager' || storedPreviewRole === 'employee') {
          setPreviewRoleState(storedPreviewRole);
        }

        setHasSavedCredentials(Boolean(secureUser || (storedToken && storedUser)));
        const bioOn = storedBioEnabled === 'true';
        setBiometricEnabledState(bioOn);

        if (storedDemo === 'true') {
          setIsDemoMode(true);
          setUser(DEMO_USER);
        } else if (storedToken && (secureUser || storedUser)) {
          const userObj = JSON.parse((secureUser || storedUser) as string) as User;
          setToken(storedToken);
          setUser(userObj);
          if (userObj.organization?.name && !storedOrgSettings) {
            setOrgSettings((prev) => ({ ...prev, orgName: userObj.organization!.name }));
          }
        } else if (storedToken === null && storedDemo === 'signed_out') {
          setUser(null);
          setAuthModalOpen(true);
        } else {
          // Default to Demo Studio workspace so Apple reviewers and new visitors
          // experience zero-friction live timers and timesheets immediately upon launch.
          setIsDemoMode(true);
          setUser(DEMO_USER);
        }

        if (bioOn && bioAvailable) {
          setIsBiometricLocked(true);
        }
      } catch {
        setIsDemoMode(true);
        setUser(DEMO_USER);
      } finally {
        setIsLoading(false);
      }
    }
    loadInitialSession();
  }, []);

  const setBiometricEnabled = async (enabled: boolean): Promise<boolean> => {
    if (enabled) {
      const compatible = await LocalAuthentication.hasHardwareAsync().catch(() => false);
      const enrolled = await LocalAuthentication.isEnrolledAsync().catch(() => false);
      if (!compatible || !enrolled) {
        return false;
      }
      const verified = await LocalAuthentication.authenticateAsync({
        promptMessage: `Enable ${biometricLabel} for VeloTime`,
        fallbackLabel: 'Use Passcode',
        cancelLabel: 'Cancel',
      });
      if (!verified.success) {
        return false;
      }
      if (user) {
        await setSecureValue(SECURE_STORAGE_KEYS.USER, JSON.stringify(user));
        setHasSavedCredentials(true);
      }
    }
    setBiometricEnabledState(enabled);
    await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, enabled ? 'true' : 'false').catch(() => {});
    return true;
  };

  const signIn = async (email: string, authToken: string, userObj?: User) => {
    setIsLoading(true);
    try {
      await setStoredToken(authToken);
      const finalUser = userObj || {
        id: 'usr_' + Date.now(),
        email,
        firstName: email.split('@')[0],
        role: 'admin',
        organization: { id: 'org_main', name: orgSettings.orgName || 'My Studio', tier: 'pro' },
      };
      const serialized = JSON.stringify(finalUser);
      await AsyncStorage.setItem('velotime_user', serialized);
      await setSecureValue(SECURE_STORAGE_KEYS.USER, serialized);
      await AsyncStorage.removeItem('velotime_is_demo');
      setToken(authToken);
      setUser(finalUser);
      setHasSavedCredentials(true);
      setIsDemoMode(false);
      setIsBiometricLocked(false);
      setAuthModalOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithWorkspace = async ({
    email,
    name,
    orgName,
    apiKey,
    role = 'admin',
    enableBiometrics = false,
  }: SignInWorkspaceParams) => {
    const cleanEmail = email.trim().toLowerCase();
    const parts = (name || cleanEmail.split('@')[0] || 'Studio Partner').trim().split(/\s+/);
    const firstName = parts[0] || 'Studio';
    const lastName = parts.slice(1).join(' ');
    const cleanOrg = orgName?.trim() || orgSettings.orgName || 'VeloTime Workspace';
    const cleanToken = apiKey?.trim() || `vt_session_${Date.now()}`;

    const newUser: User = {
      id: `usr_${Date.now()}`,
      email: cleanEmail,
      firstName,
      lastName,
      role,
      organization: {
        id: 'org_' + Date.now(),
        name: cleanOrg,
        tier: 'pro',
      },
    };

    await signIn(cleanEmail, cleanToken, newUser);
    setPreviewRole(role);
    await updateOrgSettings({ orgName: cleanOrg });

    if (enableBiometrics) {
      setBiometricEnabledState(true);
      await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, 'true').catch(() => {});
    }
  };

  const enterDemoMode = async () => {
    await setStoredToken(null);
    await AsyncStorage.setItem('velotime_is_demo', 'true');
    await AsyncStorage.removeItem('velotime_user');
    setIsDemoMode(true);
    setToken(null);
    setUser(DEMO_USER);
    setIsBiometricLocked(false);
    setAuthModalOpen(false);
  };

  const signOut = async () => {
    await AsyncStorage.setItem('velotime_is_demo', 'signed_out');
    await AsyncStorage.removeItem('velotime_user');
    // Keep Keychain credentials only if biometric quick sign-in is enabled, otherwise wipe
    if (!biometricEnabled) {
      await setStoredToken(null);
      await setSecureValue(SECURE_STORAGE_KEYS.USER, null);
      setHasSavedCredentials(false);
    }
    setUser(null);
    setToken(null);
    setIsDemoMode(false);
    setIsBiometricLocked(false);
    setAuthModalOpen(true);
  };

  const deleteAccount = async () => {
    if (token && token.startsWith('vt_live_')) {
      try {
        await fetch(`${API_BASE}/api/account`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch {
        // Proceed with full local erasure even if offline/demo
      }
    }

    await setStoredToken(null);
    await setSecureValue(SECURE_STORAGE_KEYS.USER, null);
    await AsyncStorage.multiRemove([
      'velotime_user',
      'velotime_offline_projects',
      'velotime_offline_entries',
      'velotime_offline_expenses',
      'velotime_offline_submissions',
      'velotime_offline_team_members',
      'velotime_offline_invoices',
      'velotime_pending_sync_queue',
      BIOMETRIC_ENABLED_KEY,
    ]).catch(() => {});
    await AsyncStorage.setItem('velotime_is_demo', 'signed_out').catch(() => {});

    setBiometricEnabledState(false);
    setHasSavedCredentials(false);
    setIsBiometricLocked(false);
    setUser(null);
    setToken(null);
    setIsDemoMode(false);
    setAuthModalOpen(true);
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
        signInWithWorkspace,
        enterDemoMode,
        signOut,
        deleteAccount,
        syncStatus,
        setSyncStatus,
        isBiometricSupported,
        biometricLabel,
        biometricEnabled,
        isBiometricLocked,
        hasSavedCredentials,
        setBiometricEnabled,
        authenticateWithFaceId,
        orgSettings,
        updateOrgSettings,
        isAuthModalOpen,
        setAuthModalOpen,
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
