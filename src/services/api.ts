import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

export const API_BASE = 'https://time-production-b6d9.up.railway.app';

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  organization?: {
    id: string;
    name: string;
    tier: string;
  };
}

export interface Client {
  id: string;
  name: string;
  address?: string;
}

export interface Task {
  id: string;
  name: string;
  hourlyRate?: number;
  isBillable?: boolean;
  budgetHours?: number;
}

export interface Project {
  id: string;
  name: string;
  clientId?: string;
  clientName?: string;
  hourlyRate?: number;
  budget?: number;
  budgetLimit?: number;
  budgetType?: string;
  budgetHours?: number;
  isBillable?: boolean;
  tasks: Task[];
}

export interface Entry {
  id?: string;
  date: string; // YYYY-MM-DD
  taskId: string;
  projectId?: string;
  userId?: string;
  userName?: string;
  hours: number;
  note?: string;
  projectName?: string;
  taskName?: string;
  clientName?: string;
  isBillable?: boolean;
}

export interface Expense {
  id: string;
  amount: number;
  description: string;
  category: string;
  merchant?: string;
  date: string; // YYYY-MM-DD
  projectId: string;
  projectName?: string;
  clientName?: string;
  isBillable: boolean;
  status?: 'pending' | 'approved' | 'invoiced';
}

export interface SubmissionBreakdownItem {
  projectName: string;
  taskName: string;
  hours: number;
  isBillable: boolean;
}

export interface TimesheetSubmission {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole?: string;
  weekStartDate: string; // YYYY-MM-DD
  totalHours: number;
  billableHours: number;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  submittedAt: string;
  note?: string;
  breakdown?: SubmissionBreakdownItem[];
}

export interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'admin' | 'manager' | 'employee';
  capacityHours: number;
  defaultBillingRate: number;
  defaultCostRate: number;
  weeklyLoggedHours?: number;
}

export interface InvoiceLineItem {
  description: string;
  hours?: number;
  rate?: number;
  amount: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  projectName: string;
  amount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  issueDate: string;
  dueDate: string;
  totalHours?: number;
  billingMode?: 'hourly' | 'progress' | 'expense' | 'flat';
  taxRate?: number;
  notes?: string;
  auditHash?: string;
  lineItems?: InvoiceLineItem[];
}

export const SECURE_STORAGE_KEYS = {
  TOKEN: 'velotime_secure_token',
  USER: 'velotime_secure_user',
};

const STORAGE_KEYS = {
  TOKEN: 'velotime_auth_token',
  USER: 'velotime_user',
  PROJECTS: 'velotime_offline_projects',
  ENTRIES: 'velotime_offline_entries',
  EXPENSES: 'velotime_offline_expenses',
  SUBMISSIONS: 'velotime_offline_submissions',
  TEAM_MEMBERS: 'velotime_offline_team_members',
  INVOICES: 'velotime_offline_invoices',
  PENDING_SYNC: 'velotime_pending_sync_queue',
};

export async function getSecureValue(key: string): Promise<string | null> {
  try {
    const val = await SecureStore.getItemAsync(key);
    if (val !== null) return val;
  } catch {}
  try {
    return await AsyncStorage.getItem(key);
  } catch {
    return null;
  }
}

export async function setSecureValue(key: string, value: string | null): Promise<void> {
  if (value === null) {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {}
    try {
      await AsyncStorage.removeItem(key);
    } catch {}
    return;
  }
  try {
    await SecureStore.setItemAsync(key, value, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  } catch {}
  try {
    await AsyncStorage.setItem(key, value);
  } catch {}
}

export async function getStoredToken(): Promise<string | null> {
  const secure = await getSecureValue(SECURE_STORAGE_KEYS.TOKEN);
  if (secure) return secure;
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
  } catch {
    return null;
  }
}

export async function setStoredToken(token: string | null): Promise<void> {
  await setSecureValue(SECURE_STORAGE_KEYS.TOKEN, token);
  try {
    if (token) {
      await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, token);
    } else {
      await AsyncStorage.removeItem(STORAGE_KEYS.TOKEN);
    }
  } catch {}
}

export async function apiRequest<T = any>(
  path: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: any,
  tokenOverride?: string
): Promise<T> {
  const token = tokenOverride || (await getStoredToken());

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let errorMsg = `API Error ${res.status}`;
    try {
      const errJson = await res.json();
      if (errJson.error) errorMsg = errJson.error;
    } catch {}
    throw new Error(errorMsg);
  }

  return res.json();
}

export function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
