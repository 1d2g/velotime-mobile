import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { Expense, apiRequest } from '../services/api';
import { useAuth } from './AuthContext';

export const INITIAL_MOBILE_EXPENSES: Expense[] = [
  {
    id: 'exp_1',
    amount: 185.0,
    description: 'Site survey drone photography & permit fees',
    category: 'Travel & Site Visits',
    date: new Date().toISOString().split('T')[0],
    projectId: 'p1',
    projectName: 'Metropolis Tower Design & Envelope',
    clientName: 'Metropolis Dev Group',
    isBillable: true,
    status: 'approved',
  },
  {
    id: 'exp_2',
    amount: 64.5,
    description: 'Contractor walkthrough lunch meeting',
    category: 'Meals & Hospitality',
    date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    projectId: 'p2',
    projectName: 'Hudson Yards Flagship Penthouse',
    clientName: 'Equinox Luxury Living',
    isBillable: true,
    status: 'pending',
  },
  {
    id: 'exp_3',
    amount: 240.0,
    description: 'Acoustic sample materials & freight delivery',
    category: 'Materials & Samples',
    date: new Date(Date.now() - 172800000).toISOString().split('T')[0],
    projectId: 'p3',
    projectName: 'Nordic Creative Agency Office',
    clientName: 'Fjord Creative Labs',
    isBillable: true,
    status: 'approved',
  },
  {
    id: 'exp_4',
    amount: 79.0,
    description: 'Cloud render node subscription compute',
    category: 'Software & Tools',
    date: new Date(Date.now() - 259200000).toISOString().split('T')[0],
    projectId: 'p1',
    projectName: 'Metropolis Tower Design & Envelope',
    clientName: 'Metropolis Dev Group',
    isBillable: false,
    status: 'approved',
  },
];

interface ExpenseContextType {
  expenses: Expense[];
  addExpense: (data: Omit<Expense, 'id'>) => Promise<Expense>;
  updateExpense: (id: string, updates: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  totalExpensesAmount: number;
  billableExpensesAmount: number;
  refreshExpenses: () => Promise<void>;
}

const ExpenseContext = createContext<ExpenseContextType | null>(null);

export function ExpenseProvider({ children }: { children: React.ReactNode }) {
  const { user, isDemoMode } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>(INITIAL_MOBILE_EXPENSES);

  useEffect(() => {
    async function loadExpenses() {
      try {
        const stored = await AsyncStorage.getItem('velotime_offline_expenses');
        if (stored) {
          setExpenses(JSON.parse(stored));
        } else {
          setExpenses(INITIAL_MOBILE_EXPENSES);
          await AsyncStorage.setItem('velotime_offline_expenses', JSON.stringify(INITIAL_MOBILE_EXPENSES));
        }
      } catch (e) {
        setExpenses(INITIAL_MOBILE_EXPENSES);
      }
    }
    loadExpenses();
  }, []);

  const totalExpensesAmount = useMemo(() => {
    return expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [expenses]);

  const billableExpensesAmount = useMemo(() => {
    return expenses
      .filter((e) => e.isBillable)
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [expenses]);

  const addExpense = async (data: Omit<Expense, 'id'>): Promise<Expense> => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}

    const newExpense: Expense = {
      ...data,
      id: 'exp_' + Date.now(),
      status: 'pending',
    };

    const updated = [newExpense, ...expenses];
    setExpenses(updated);
    await AsyncStorage.setItem('velotime_offline_expenses', JSON.stringify(updated));

    if (!isDemoMode && user) {
      try {
        await apiRequest('/api/expenses', 'POST', newExpense);
      } catch {}
    }

    return newExpense;
  };

  const updateExpense = async (id: string, updates: Partial<Expense>) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}

    const updated = expenses.map((e) => (e.id === id ? { ...e, ...updates } : e));
    setExpenses(updated);
    await AsyncStorage.setItem('velotime_offline_expenses', JSON.stringify(updated));

    if (!isDemoMode && user) {
      try {
        await apiRequest(`/api/expenses/${id}`, 'PUT', updates);
      } catch {}
    }
  };

  const deleteExpense = async (id: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}

    const updated = expenses.filter((e) => e.id !== id);
    setExpenses(updated);
    await AsyncStorage.setItem('velotime_offline_expenses', JSON.stringify(updated));

    if (!isDemoMode && user) {
      try {
        await apiRequest(`/api/expenses/${id}`, 'DELETE');
      } catch {}
    }
  };

  const refreshExpenses = async () => {
    if (isDemoMode) return;
    try {
      const serverExpenses = await apiRequest<Expense[]>('/api/expenses');
      if (Array.isArray(serverExpenses)) {
        setExpenses(serverExpenses);
        await AsyncStorage.setItem('velotime_offline_expenses', JSON.stringify(serverExpenses));
      }
    } catch {}
  };

  return (
    <ExpenseContext.Provider
      value={{
        expenses,
        addExpense,
        updateExpense,
        deleteExpense,
        totalExpensesAmount,
        billableExpensesAmount,
        refreshExpenses,
      }}
    >
      {children}
    </ExpenseContext.Provider>
  );
}

export function useExpenses() {
  const context = useContext(ExpenseContext);
  if (!context) throw new Error('useExpenses must be used within an ExpenseProvider');
  return context;
}
