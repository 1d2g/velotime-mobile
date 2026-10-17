import AsyncStorage from '@react-native-async-storage/async-storage';

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
}

export interface Project {
  id: string;
  name: string;
  clientId?: string;
  clientName?: string;
  hourlyRate?: number;
  budget?: number;
  budgetHours?: number;
  tasks: Task[];
}

export interface Entry {
  id?: string;
  date: string; // YYYY-MM-DD
  taskId: string;
  userId?: string;
  hours: number;
  note?: string;
  projectName?: string;
  taskName?: string;
  clientName?: string;
  isBillable?: boolean;
}

const STORAGE_KEYS = {
  TOKEN: 'velotime_auth_token',
  USER: 'velotime_user',
  PROJECTS: 'velotime_offline_projects',
  ENTRIES: 'velotime_offline_entries',
  PENDING_SYNC: 'velotime_pending_sync_queue',
};

export async function getStoredToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
  } catch {
    return null;
  }
}

export async function setStoredToken(token: string | null): Promise<void> {
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
