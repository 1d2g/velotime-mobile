import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { Project, Entry, apiRequest } from '../services/api';
import { useAuth } from './AuthContext';

// Rich sample projects for instant mobile onboarding / offline mode
export const INITIAL_MOBILE_PROJECTS: Project[] = [
  {
    id: 'p1',
    name: 'Metropolis Tower Design & Envelope',
    clientName: 'Metropolis Dev Group',
    hourlyRate: 175,
    budgetHours: 240,
    budget: 42000,
    tasks: [
      { id: 't1_1', name: 'Schematic Design & Facade Study', hourlyRate: 180, isBillable: true },
      { id: 't1_2', name: 'Design Development & Revit CAD', hourlyRate: 165, isBillable: true },
      { id: 't1_3', name: 'Structural Coordination & Site Meetings', hourlyRate: 175, isBillable: true },
    ],
  },
  {
    id: 'p2',
    name: 'Hudson Yards Flagship Penthouse',
    clientName: 'Equinox Luxury Living',
    hourlyRate: 160,
    budgetHours: 120,
    budget: 19200,
    tasks: [
      { id: 't2_1', name: 'Millwork Drawings & Specifications', hourlyRate: 160, isBillable: true },
      { id: 't2_2', name: 'Lighting Layout & Material Schedule', hourlyRate: 155, isBillable: true },
      { id: 't2_3', name: 'Client Review & Contractor Walkthrough', hourlyRate: 165, isBillable: true },
    ],
  },
  {
    id: 'p3',
    name: 'Nordic Creative Agency Office',
    clientName: 'Fjord Creative Labs',
    hourlyRate: 150,
    budgetHours: 80,
    budget: 12000,
    tasks: [
      { id: 't3_1', name: 'Spatial Programming & Layout', hourlyRate: 150, isBillable: true },
      { id: 't3_2', name: 'Acoustic Treatments & Signage', hourlyRate: 145, isBillable: true },
    ],
  },
];

export interface ActiveTimer {
  isRunning: boolean;
  projectId: string;
  taskId: string;
  startTime: number | null; // timestamp ms
  elapsedSeconds: number;
  note: string;
}

interface TimesheetContextType {
  projects: Project[];
  entries: Entry[];
  activeTimer: ActiveTimer;
  todayTotalHours: number;
  weekTotalHours: number;
  todayEntries: Entry[];
  getEntriesForDate: (dateStr: string) => Entry[];
  startTimer: (projectId: string, taskId: string, note?: string) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  resetTimer: () => void;
  saveTimer: () => Promise<Entry | null>;
  setTimerNote: (note: string) => void;
  setTimerProjectAndTask: (projectId: string, taskId: string) => void;
  logManualEntry: (date: string, projectId: string, taskId: string, hours: number, note?: string) => Promise<void>;
  deleteEntry: (entryIdOrIndex: string | number) => Promise<void>;
  submitWeekTimesheet: () => Promise<void>;
  weekDates: { id: string; label: string; dateStr: string; isToday: boolean }[];
  refreshData: () => Promise<void>;
}

const TimesheetContext = createContext<TimesheetContextType | null>(null);

export function TimesheetProvider({ children }: { children: React.ReactNode }) {
  const { user, isDemoMode, setSyncStatus } = useAuth();
  const [projects, setProjects] = useState<Project[]>(INITIAL_MOBILE_PROJECTS);
  const [entries, setEntries] = useState<Entry[]>([]);
  
  // Stopwatch State
  const [activeTimer, setActiveTimer] = useState<ActiveTimer>({
    isRunning: false,
    projectId: 'p1',
    taskId: 't1_1',
    startTime: null,
    elapsedSeconds: 0,
    note: '',
  });

  const tickerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Generate current Monday - Sunday date items
  const weekDates = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Monday
    const monday = new Date(today.setDate(diff));

    const result = [];
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const date = String(d.getDate()).padStart(2, '0');
      const id = `${year}-${month}-${date}`;
      const actualToday = new Date().toISOString().split('T')[0];

      result.push({
        id,
        label: dayNames[i],
        dateStr: `${d.getMonth() + 1}/${d.getDate()}`,
        isToday: id === actualToday,
      });
    }
    return result;
  }, []);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Load initial entries & stored timer state
  useEffect(() => {
    async function init() {
      try {
        const storedEntries = await AsyncStorage.getItem('velotime_mobile_entries');
        if (storedEntries) {
          setEntries(JSON.parse(storedEntries));
        } else {
          // Pre-populate realistic sample week entries
          const initialMockEntries: Entry[] = [
            {
              id: 'e_1',
              date: todayStr,
              taskId: 't1_1',
              hours: 4.5,
              note: 'Schematic drawings and cantilever facade calculations.',
              projectName: 'Metropolis Tower Design & Envelope',
              taskName: 'Schematic Design & Facade Study',
              clientName: 'Metropolis Dev Group',
              isBillable: true,
            },
            {
              id: 'e_2',
              date: todayStr,
              taskId: 't2_1',
              hours: 2.25,
              note: 'Penthouse master suite millwork detailing.',
              projectName: 'Hudson Yards Flagship Penthouse',
              taskName: 'Millwork Drawings & Specifications',
              clientName: 'Equinox Luxury Living',
              isBillable: true,
            },
          ];
          setEntries(initialMockEntries);
          await AsyncStorage.setItem('velotime_mobile_entries', JSON.stringify(initialMockEntries));
        }

        // Restore active timer if was running
        const storedTimer = await AsyncStorage.getItem('velotime_active_timer');
        if (storedTimer) {
          const parsed: ActiveTimer = JSON.parse(storedTimer);
          if (parsed.isRunning && parsed.startTime) {
            const elapsedSince = Math.floor((Date.now() - parsed.startTime) / 1000);
            setActiveTimer({
              ...parsed,
              elapsedSeconds: parsed.elapsedSeconds + Math.max(0, elapsedSince),
              startTime: Date.now(),
            });
          } else {
            setActiveTimer(parsed);
          }
        }
      } catch (err) {}
    }
    init();
  }, [todayStr]);

  // Stopwatch Interval Ticker
  useEffect(() => {
    if (activeTimer.isRunning) {
      tickerRef.current = setInterval(() => {
        setActiveTimer((prev) => {
          const nextSeconds = prev.elapsedSeconds + 1;
          const updated = { ...prev, elapsedSeconds: nextSeconds };
          AsyncStorage.setItem('velotime_active_timer', JSON.stringify(updated)).catch(() => {});
          return updated;
        });
      }, 1000);
    } else {
      if (tickerRef.current) clearInterval(tickerRef.current);
    }

    return () => {
      if (tickerRef.current) clearInterval(tickerRef.current);
    };
  }, [activeTimer.isRunning]);

  // Timer Handlers
  const startTimer = (projectId: string, taskId: string, note = '') => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}

    const updated: ActiveTimer = {
      isRunning: true,
      projectId: projectId || activeTimer.projectId,
      taskId: taskId || activeTimer.taskId,
      startTime: Date.now(),
      elapsedSeconds: activeTimer.elapsedSeconds,
      note: note !== undefined ? note : activeTimer.note,
    };
    setActiveTimer(updated);
    AsyncStorage.setItem('velotime_active_timer', JSON.stringify(updated)).catch(() => {});
  };

  const pauseTimer = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}

    const updated: ActiveTimer = {
      ...activeTimer,
      isRunning: false,
      startTime: null,
    };
    setActiveTimer(updated);
    AsyncStorage.setItem('velotime_active_timer', JSON.stringify(updated)).catch(() => {});
  };

  const resumeTimer = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}

    const updated: ActiveTimer = {
      ...activeTimer,
      isRunning: true,
      startTime: Date.now(),
    };
    setActiveTimer(updated);
    AsyncStorage.setItem('velotime_active_timer', JSON.stringify(updated)).catch(() => {});
  };

  const resetTimer = () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch {}

    const updated: ActiveTimer = {
      ...activeTimer,
      isRunning: false,
      startTime: null,
      elapsedSeconds: 0,
      note: '',
    };
    setActiveTimer(updated);
    AsyncStorage.removeItem('velotime_active_timer').catch(() => {});
  };

  const saveTimer = async (): Promise<Entry | null> => {
    if (activeTimer.elapsedSeconds < 30) {
      // Ignore accidental micro-taps under 30 seconds
      return null;
    }

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}

    const rawHours = activeTimer.elapsedSeconds / 3600;
    // Round to standard 2 decimal places (minimum 0.05 hr = 3 mins)
    const hours = Math.max(0.05, Math.round(rawHours * 100) / 100);

    const project = projects.find((p) => p.id === activeTimer.projectId) || projects[0];
    const task = project.tasks.find((t) => t.id === activeTimer.taskId) || project.tasks[0];

    const newEntry: Entry = {
      id: 'e_' + Date.now(),
      date: todayStr,
      taskId: task.id,
      hours,
      note: activeTimer.note.trim() || 'Logged via VeloTime Mobile Stopwatch',
      projectName: project.name,
      taskName: task.name,
      clientName: project.clientName || 'General',
      isBillable: task.isBillable !== false,
    };

    const updatedList = [newEntry, ...entries];
    setEntries(updatedList);
    await AsyncStorage.setItem('velotime_mobile_entries', JSON.stringify(updatedList));

    // Reset Stopwatch
    resetTimer();

    // Push to backend if authenticated
    if (!isDemoMode && user) {
      try {
        setSyncStatus('syncing');
        await apiRequest('/api/entries', 'POST', {
          dateId: todayStr,
          taskId: task.id,
          hours,
          note: newEntry.note,
        });
        setSyncStatus('synced');
      } catch (err) {
        setSyncStatus('offline');
      }
    }

    return newEntry;
  };

  const setTimerNote = (note: string) => {
    setActiveTimer((prev) => ({ ...prev, note }));
  };

  const setTimerProjectAndTask = (projectId: string, taskId: string) => {
    setActiveTimer((prev) => ({ ...prev, projectId, taskId }));
  };

  const logManualEntry = async (date: string, projectId: string, taskId: string, hours: number, note = '') => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}

    const project = projects.find((p) => p.id === projectId) || projects[0];
    const task = project.tasks.find((t) => t.id === taskId) || project.tasks[0];

    const newEntry: Entry = {
      id: 'e_' + Date.now(),
      date,
      taskId: task.id,
      hours: Math.round(hours * 100) / 100,
      note: note.trim() || 'Manual mobile log',
      projectName: project.name,
      taskName: task.name,
      clientName: project.clientName || 'General',
      isBillable: task.isBillable !== false,
    };

    const updatedList = [newEntry, ...entries];
    setEntries(updatedList);
    await AsyncStorage.setItem('velotime_mobile_entries', JSON.stringify(updatedList));

    if (!isDemoMode && user) {
      try {
        setSyncStatus('syncing');
        await apiRequest('/api/entries', 'POST', {
          dateId: date,
          taskId: task.id,
          hours: newEntry.hours,
          note: newEntry.note,
        });
        setSyncStatus('synced');
      } catch {
        setSyncStatus('offline');
      }
    }
  };

  const deleteEntry = async (entryIdOrIndex: string | number) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}

    const updatedList = entries.filter((e, idx) => (e.id ? e.id !== entryIdOrIndex : idx !== entryIdOrIndex));
    setEntries(updatedList);
    await AsyncStorage.setItem('velotime_mobile_entries', JSON.stringify(updatedList));
  };

  const submitWeekTimesheet = async () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}

    if (!isDemoMode && user) {
      const weekStartId = weekDates[0]?.id;
      if (weekStartId) {
        await apiRequest('/api/timesheet/submit', 'POST', { weekStartDate: weekStartId });
      }
    }
  };

  const refreshData = async () => {
    if (isDemoMode) return;
    try {
      setSyncStatus('syncing');
      const remoteProjects = await apiRequest('/api/projects');
      if (Array.isArray(remoteProjects)) {
        setProjects(remoteProjects);
      }
      setSyncStatus('synced');
    } catch {
      setSyncStatus('offline');
    }
  };

  const todayEntries = useMemo(() => {
    return entries.filter((e) => e.date === todayStr);
  }, [entries, todayStr]);

  const todayTotalHours = useMemo(() => {
    return todayEntries.reduce((sum, e) => sum + e.hours, 0);
  }, [todayEntries]);

  const weekDateSet = useMemo(() => new Set(weekDates.map((d) => d.id)), [weekDates]);

  const weekTotalHours = useMemo(() => {
    return entries
      .filter((e) => weekDateSet.has(e.date))
      .reduce((sum, e) => sum + e.hours, 0);
  }, [entries, weekDateSet]);

  const getEntriesForDate = (dateStr: string) => {
    return entries.filter((e) => e.date === dateStr);
  };

  return (
    <TimesheetContext.Provider
      value={{
        projects,
        entries,
        activeTimer,
        todayTotalHours,
        weekTotalHours,
        todayEntries,
        getEntriesForDate,
        startTimer,
        pauseTimer,
        resumeTimer,
        resetTimer,
        saveTimer,
        setTimerNote,
        setTimerProjectAndTask,
        logManualEntry,
        deleteEntry,
        submitWeekTimesheet,
        weekDates,
        refreshData,
      }}
    >
      {children}
    </TimesheetContext.Provider>
  );
}

export function useTimesheet() {
  const context = useContext(TimesheetContext);
  if (!context) throw new Error('useTimesheet must be used within a TimesheetProvider');
  return context;
}
