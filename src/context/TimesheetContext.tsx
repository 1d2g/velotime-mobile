import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { Project, Entry, apiRequest, getLocalDateString } from '../services/api';
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
  weekOffset: number;
  weekDates: { id: string; label: string; dateStr: string; isToday: boolean }[];
  weekLabel: string;
  submissionStatus: 'draft' | 'submitted' | 'approved' | 'rejected';
  submissionRejectNote?: string;
  getEntriesForDate: (dateStr: string) => Entry[];
  startTimer: (projectId: string, taskId: string, note?: string) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  resetTimer: () => void;
  saveTimer: () => Promise<Entry | null>;
  setTimerNote: (note: string) => void;
  setTimerProjectAndTask: (projectId: string, taskId: string) => void;
  logManualEntry: (date: string, projectId: string, taskId: string, hours: number, note?: string) => Promise<void>;
  updateEntry: (entryId: string, updates: { date?: string; projectId?: string; taskId?: string; hours?: number; note?: string }) => Promise<void>;
  deleteEntry: (entryIdOrIndex: string | number) => Promise<void>;
  selectedEmployeeName: string;
  setSelectedEmployeeName: (name: string) => void;
  submitWeekTimesheet: () => Promise<void>;
  unlockWeekTimesheet: (submissionId?: string) => Promise<void>;
  goToPrevWeek: () => void;
  goToNextWeek: () => void;
  goToCurrentWeek: () => void;
  addProject: (p: {
    name: string;
    clientName?: string;
    hourlyRate?: number;
    budget?: number;
    budgetHours?: number;
    budgetType?: string;
    tasks: Array<{ name: string; hourlyRate?: number; isBillable?: boolean; budgetHours?: number }>;
  }) => Promise<void>;
  editProject: (
    projectId: string,
    updates: Partial<Pick<Project, 'name' | 'clientName' | 'hourlyRate' | 'budget' | 'budgetHours' | 'budgetType' | 'isBillable'>>
  ) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  addTaskToProject: (
    projectId: string,
    task: { name: string; hourlyRate?: number; isBillable?: boolean; budgetHours?: number }
  ) => Promise<void>;
  editTask: (
    projectId: string,
    taskId: string,
    updates: { name?: string; hourlyRate?: number; isBillable?: boolean; budgetHours?: number }
  ) => Promise<void>;
  deleteTask: (projectId: string, taskId: string) => Promise<void>;
  refreshData: () => Promise<void>;
}

const TimesheetContext = createContext<TimesheetContextType | null>(null);

export function TimesheetProvider({ children }: { children: React.ReactNode }) {
  const { user, token, isDemoMode, setSyncStatus, orgSettings } = useAuth();
  const [projects, setProjects] = useState<Project[]>(INITIAL_MOBILE_PROJECTS);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [weekOffset, setWeekOffset] = useState<number>(0);
  const [submissionStatus, setSubmissionStatus] = useState<'draft' | 'submitted' | 'approved' | 'rejected'>('draft');
  const [submissionRejectNote, setSubmissionRejectNote] = useState<string | undefined>();
  const [selectedEmployeeName, setSelectedEmployeeName] = useState<string>('My Timesheet');
  
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

  // Generate current Monday - Sunday date items based on weekOffset
  const weekDates = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Monday of current week
    const targetMonday = new Date(today.setDate(diff + weekOffset * 7));

    const result = [];
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(targetMonday);
      d.setDate(targetMonday.getDate() + i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const date = String(d.getDate()).padStart(2, '0');
      const id = `${year}-${month}-${date}`;
      const actualToday = getLocalDateString();

      result.push({
        id,
        label: dayNames[i],
        dateStr: `${d.getMonth() + 1}/${d.getDate()}`,
        isToday: id === actualToday,
      });
    }
    return result;
  }, [weekOffset]);

  const weekLabel = useMemo(() => {
    if (weekDates.length === 0) return 'Current Week';
    const first = weekDates[0];
    const last = weekDates[6];
    return `${first.dateStr} – ${last.dateStr}`;
  }, [weekDates]);

  const goToPrevWeek = () => {
    try {
      Haptics.selectionAsync();
    } catch {}
    setWeekOffset((prev) => prev - 1);
  };

  const goToNextWeek = () => {
    try {
      Haptics.selectionAsync();
    } catch {}
    setWeekOffset((prev) => prev + 1);
  };

  const goToCurrentWeek = () => {
    try {
      Haptics.selectionAsync();
    } catch {}
    setWeekOffset(0);
  };

  const todayStr = useMemo(() => getLocalDateString(), []);

  // Load initial entries & stored timer state
  useEffect(() => {
    async function init() {
      try {
        const storedProjects = await AsyncStorage.getItem('velotime_offline_projects');
        if (storedProjects) {
          const parsedProjects = JSON.parse(storedProjects);
          if (Array.isArray(parsedProjects) && parsedProjects.length > 0) {
            setProjects(parsedProjects);
          }
        }
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

  // Auto-sync cloud workspace data when signing into a live account
  useEffect(() => {
    if (!isDemoMode && user && token?.startsWith('vt_live_')) {
      refreshData();
    }
  }, [token, isDemoMode, user?.id]);

  // Remote live stopwatch sync polling (Mobile <-> Web & Extension)
  useEffect(() => {
    if (isDemoMode || !user) return;

    let isMounted = true;
    const checkRemoteTimer = async () => {
      try {
        const remote = await apiRequest('/api/timer/active', 'GET');
        if (!isMounted || !remote) return;

        if (remote.activeTimerStart && remote.activeTimerTaskId) {
          // Timer is running on server / desktop
          const serverStartMs = new Date(remote.activeTimerStart).getTime();
          const elapsed = Math.max(0, Math.floor((Date.now() - serverStartMs) / 1000));

          setActiveTimer((prev) => {
            let targetProjectId = prev.projectId;
            for (const p of projects) {
              if (p.tasks?.some((t) => t.id === remote.activeTimerTaskId)) {
                targetProjectId = p.id;
                break;
              }
            }

            if (!prev.isRunning || prev.taskId !== remote.activeTimerTaskId) {
              return {
                isRunning: true,
                projectId: targetProjectId,
                taskId: remote.activeTimerTaskId,
                startTime: serverStartMs,
                elapsedSeconds: elapsed,
                note: prev.note || '',
              };
            }
            return prev;
          });
        } else {
          // Timer is stopped on server
          setActiveTimer((prev) => {
            if (prev.isRunning) {
              refreshData();
              return {
                ...prev,
                isRunning: false,
                startTime: null,
              };
            }
            return prev;
          });
        }
      } catch (e) {
        // network offline, ignore
      }
    };

    const interval = setInterval(checkRemoteTimer, 6000);
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        checkRemoteTimer();
      }
    });

    return () => {
      isMounted = false;
      clearInterval(interval);
      subscription.remove();
    };
  }, [isDemoMode, user, projects]);

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

    // Sync live stopwatch to server / web app / extension
    if (!isDemoMode && user) {
      apiRequest('/api/timer/toggle', 'POST', {
        action: 'start',
        taskId: updated.taskId,
        dateId: todayStr,
      }).catch(() => {});
    }
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

    if (!isDemoMode && user) {
      apiRequest('/api/timer/toggle', 'POST', {
        action: 'stop',
        taskId: activeTimer.taskId,
        dateId: todayStr,
      }).catch(() => {});
    }
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

    if (!isDemoMode && user) {
      apiRequest('/api/timer/toggle', 'POST', {
        action: 'start',
        taskId: updated.taskId,
        dateId: todayStr,
      }).catch(() => {});
    }
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

    if (!isDemoMode && user) {
      apiRequest('/api/timer/toggle', 'POST', {
        action: 'stop',
        taskId: activeTimer.taskId,
        dateId: todayStr,
      }).catch(() => {});
    }
  };

  const saveTimer = async (): Promise<Entry | null> => {
    if (activeTimer.elapsedSeconds < 30) {
      // Ignore accidental micro-taps under 30 seconds
      return null;
    }

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}

    const rawMinutes = activeTimer.elapsedSeconds / 60;
    const rounding = orgSettings.timerRoundingMinutes || 0;
    const adjustedMinutes =
      rounding > 0 ? Math.ceil(rawMinutes / rounding) * rounding : rawMinutes;
    const rawHours = adjustedMinutes / 60;
    // Round to standard 2 decimal places (minimum 0.05 hr = 3 mins)
    const hours = Math.max(0.05, Math.round(rawHours * 100) / 100);

    const project = projects.find((p) => p.id === activeTimer.projectId) || projects[0];
    const task = project.tasks.find((t) => t.id === activeTimer.taskId) || project.tasks[0];

    const newEntry: Entry = {
      id: 'e_' + Date.now(),
      date: todayStr,
      projectId: project.id,
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
        const endpoint = token?.startsWith('vt_live_') ? '/api/v1/entries' : '/api/entries';
        const saved = await apiRequest(endpoint, 'POST', {
          dateId: todayStr,
          date: todayStr,
          taskId: task.id,
          project_name: project.name,
          task_name: task.name,
          user_email: user.email,
          hours,
          note: newEntry.note,
        });
        if (saved?.id) {
          const syncedList = updatedList.map((item) =>
            item.id === newEntry.id ? { ...item, id: saved.id } : item
          );
          setEntries(syncedList);
          await AsyncStorage.setItem('velotime_mobile_entries', JSON.stringify(syncedList));
        }
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
    if (submissionStatus === 'approved') {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch {}
      return;
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}

    const project = projects.find((p) => p.id === projectId) || projects[0];
    const task = project.tasks.find((t) => t.id === taskId) || project.tasks[0];

    const newEntry: Entry = {
      id: 'e_' + Date.now(),
      date,
      projectId: project.id,
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
        const endpoint = token?.startsWith('vt_live_') ? '/api/v1/entries' : '/api/entries';
        const saved = await apiRequest(endpoint, 'POST', {
          dateId: date,
          date,
          taskId: task.id,
          project_name: project.name,
          task_name: task.name,
          user_email: user.email,
          hours: newEntry.hours,
          note: newEntry.note,
        });
        if (saved?.id) {
          const syncedList = updatedList.map((item) =>
            item.id === newEntry.id ? { ...item, id: saved.id } : item
          );
          setEntries(syncedList);
          await AsyncStorage.setItem('velotime_mobile_entries', JSON.stringify(syncedList));
        }
        setSyncStatus('synced');
      } catch {
        setSyncStatus('offline');
      }
    }
  };

  const updateEntry = async (
    entryId: string,
    updates: { date?: string; projectId?: string; taskId?: string; hours?: number; note?: string }
  ) => {
    if (submissionStatus === 'approved') {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch {}
      return;
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}

    const targetProject =
      (updates.projectId ? projects.find((p) => p.id === updates.projectId) : undefined) || projects[0];
    const targetTask =
      (updates.taskId && targetProject
        ? targetProject.tasks.find((t) => t.id === updates.taskId)
        : undefined) || targetProject?.tasks[0];

    let updatedEntryRef: Entry | null = null;
    const updatedList = entries.map((e) => {
      if (e.id !== entryId) return e;
      updatedEntryRef = {
        ...e,
        date: updates.date ?? e.date,
        projectId: targetProject?.id ?? e.projectId,
        projectName: targetProject?.name ?? e.projectName,
        clientName: targetProject?.clientName ?? e.clientName,
        taskId: targetTask?.id ?? e.taskId,
        taskName: targetTask?.name ?? e.taskName,
        isBillable: targetTask ? targetTask.isBillable !== false : e.isBillable,
        hours: updates.hours !== undefined ? Math.round(updates.hours * 100) / 100 : e.hours,
        note: updates.note !== undefined ? updates.note : e.note,
      };
      return updatedEntryRef;
    });

    setEntries(updatedList);
    await AsyncStorage.setItem('velotime_mobile_entries', JSON.stringify(updatedList));

    if (!isDemoMode && user && token?.startsWith('vt_live_') && updatedEntryRef) {
      const ref: Entry = updatedEntryRef;
      try {
        setSyncStatus('syncing');
        await apiRequest('/api/v1/entries', 'POST', {
          dateId: ref.date,
          date: ref.date,
          taskId: ref.taskId,
          project_name: ref.projectName,
          task_name: ref.taskName,
          user_email: user.email,
          hours: ref.hours,
          note: ref.note || '',
        });
        setSyncStatus('synced');
      } catch {
        setSyncStatus('offline');
      }
    }
  };

  const deleteEntry = async (entryIdOrIndex: string | number) => {
    if (submissionStatus === 'approved') {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch {}
      return;
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}

    const targetEntry = entries.find((e, idx) =>
      e.id ? e.id === entryIdOrIndex : idx === entryIdOrIndex
    );

    const updatedList = entries.filter((e, idx) => (e.id ? e.id !== entryIdOrIndex : idx !== entryIdOrIndex));
    setEntries(updatedList);
    await AsyncStorage.setItem('velotime_mobile_entries', JSON.stringify(updatedList));

    if (
      !isDemoMode &&
      user &&
      token?.startsWith('vt_live_') &&
      targetEntry?.id &&
      !String(targetEntry.id).startsWith('e_')
    ) {
      apiRequest(`/api/v1/entries/${encodeURIComponent(String(targetEntry.id))}`, 'DELETE').catch(() => {});
    }
  };

  const submitWeekTimesheet = async () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}

    setSubmissionStatus('submitted');
    await AsyncStorage.setItem('velotime_mobile_submission_status', 'submitted');

    if (!isDemoMode && user) {
      const weekStartId = weekDates[0]?.id;
      if (weekStartId) {
        try {
          await apiRequest('/api/timesheet/submit', 'POST', { weekStartDate: weekStartId });
        } catch {}
      }
    }
  };

  const unlockWeekTimesheet = async (submissionId?: string) => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}

    setSubmissionStatus('draft');
    await AsyncStorage.setItem('velotime_mobile_submission_status', 'draft');

    if (!isDemoMode && user) {
      try {
        if (submissionId) {
          await apiRequest(`/api/timesheet-submissions/${submissionId}/status`, 'PUT', { status: 'draft' });
        } else {
          const weekStartId = weekDates[0]?.id;
          await apiRequest('/api/timesheet/unlock', 'POST', { weekStartDate: weekStartId });
        }
      } catch {}
    }
  };

  const addProject = async (p: {
    name: string;
    clientName?: string;
    hourlyRate?: number;
    budget?: number;
    budgetHours?: number;
    budgetType?: string;
    tasks: Array<{ name: string; hourlyRate?: number; isBillable?: boolean; budgetHours?: number }>;
  }) => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}

    const newProject: Project = {
      id: 'p_' + Date.now(),
      name: p.name.trim(),
      clientName: p.clientName?.trim() || 'General Client',
      hourlyRate: p.hourlyRate || 165,
      budget: p.budget || 15000,
      budgetHours: p.budgetHours || 100,
      budgetType: p.budgetType || 'PROJECT_HOURS',
      tasks: (p.tasks || []).map((t, idx) => ({
        id: `t_${Date.now()}_${idx}`,
        name: t.name.trim(),
        hourlyRate: t.hourlyRate || p.hourlyRate || 165,
        isBillable: t.isBillable !== false,
        budgetHours: t.budgetHours,
      })),
    };

    if (newProject.tasks.length === 0) {
      newProject.tasks = [{ id: `t_${Date.now()}_0`, name: 'General Work', hourlyRate: newProject.hourlyRate, isBillable: true }];
    }

    const updated = [newProject, ...projects];
    setProjects(updated);
    await AsyncStorage.setItem('velotime_offline_projects', JSON.stringify(updated));

    if (!isDemoMode && user) {
      try {
        if (token?.startsWith('vt_live_')) {
          const created = await apiRequest('/api/v1/projects', 'POST', {
            name: newProject.name,
            client_name: newProject.clientName,
            budget_type: 'hours',
            budget_limit: newProject.budgetHours || 100,
          });
          if (created?.id) {
            await refreshData();
          }
        } else {
          await apiRequest('/api/projects', 'POST', newProject);
        }
      } catch {}
    }
  };

  const addTaskToProject = async (
    projectId: string,
    task: { name: string; hourlyRate?: number; isBillable?: boolean; budgetHours?: number }
  ) => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}

    const newTask = {
      id: `t_${Date.now()}`,
      name: task.name.trim(),
      hourlyRate: task.hourlyRate || 165,
      isBillable: task.isBillable !== false,
      budgetHours: task.budgetHours,
    };

    const updated = projects.map((p) => {
      if (p.id === projectId) {
        return {
          ...p,
          tasks: [...p.tasks, newTask],
        };
      }
      return p;
    });

    setProjects(updated);
    await AsyncStorage.setItem('velotime_offline_projects', JSON.stringify(updated));

    if (!isDemoMode && user) {
      try {
        await apiRequest(`/api/projects/${projectId}/tasks`, 'POST', newTask);
      } catch {}
    }
  };

  const editProject = async (
    projectId: string,
    updates: Partial<Pick<Project, 'name' | 'clientName' | 'hourlyRate' | 'budget' | 'budgetHours' | 'budgetType' | 'isBillable'>>
  ) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    const updated = projects.map((p) => (p.id === projectId ? { ...p, ...updates } : p));
    setProjects(updated);
    await AsyncStorage.setItem('velotime_offline_projects', JSON.stringify(updated));
  };

  const deleteProject = async (projectId: string) => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch {}
    const updated = projects.filter((p) => p.id !== projectId);
    setProjects(updated);
    await AsyncStorage.setItem('velotime_offline_projects', JSON.stringify(updated));
  };

  const editTask = async (
    projectId: string,
    taskId: string,
    updates: { name?: string; hourlyRate?: number; isBillable?: boolean; budgetHours?: number }
  ) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    const updated = projects.map((p) => {
      if (p.id !== projectId) return p;
      return {
        ...p,
        tasks: p.tasks.map((t) => (t.id === taskId ? { ...t, ...updates } : t)),
      };
    });
    setProjects(updated);
    await AsyncStorage.setItem('velotime_offline_projects', JSON.stringify(updated));
  };

  const deleteTask = async (projectId: string, taskId: string) => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch {}
    const updated = projects.map((p) => {
      if (p.id !== projectId) return p;
      return {
        ...p,
        tasks: p.tasks.filter((t) => t.id !== taskId),
      };
    });
    setProjects(updated);
    await AsyncStorage.setItem('velotime_offline_projects', JSON.stringify(updated));
  };

  const refreshData = async () => {
    if (isDemoMode || !user) return;
    try {
      setSyncStatus('syncing');
      if (token?.startsWith('vt_live_')) {
        const [projRes, entryRes] = await Promise.all([
          apiRequest('/api/v1/projects').catch(() => null),
          apiRequest('/api/v1/entries').catch(() => null),
        ]);
        const rawProjects = projRes?.projects || (Array.isArray(projRes) ? projRes : null);
        if (Array.isArray(rawProjects) && rawProjects.length > 0) {
          const normalizedProjects: Project[] = rawProjects.map((p: any) => ({
            id: p.id,
            name: p.name,
            clientName: p.clientName ?? p.client_name ?? 'General Client',
            hourlyRate: p.hourlyRate ?? 150,
            budgetLimit: p.budgetLimit ?? p.budget_limit ?? undefined,
            budgetHours: p.budgetHours ?? p.budget_limit ?? 100,
            budgetType: p.budgetType ?? p.budget_type ?? 'hours',
            tasks: Array.isArray(p.tasks)
              ? p.tasks.map((t: any) => ({
                  id: t.id,
                  name: t.name,
                  hourlyRate: t.hourlyRate ?? p.hourlyRate ?? 150,
                  isBillable: t.isBillable !== undefined ? t.isBillable : t.is_billable !== false,
                  budgetHours: t.budgetHours ?? undefined,
                }))
              : [],
          }));
          setProjects(normalizedProjects);
          await AsyncStorage.setItem('velotime_offline_projects', JSON.stringify(normalizedProjects));

          setActiveTimer((prev) => {
            if (prev.isRunning || prev.elapsedSeconds > 0) return prev;
            const hasProj = normalizedProjects.some((p) => p.id === prev.projectId);
            if (hasProj) return prev;
            const firstProj = normalizedProjects[0];
            const firstTask = firstProj.tasks?.[0];
            return {
              ...prev,
              projectId: firstProj.id,
              taskId: firstTask?.id || 'default',
            };
          });
        }
        const rawEntries = entryRes?.entries || (Array.isArray(entryRes) ? entryRes : null);
        if (Array.isArray(rawEntries)) {
          const normalizedEntries: Entry[] = rawEntries.map((e: any) => ({
            id: e.id,
            date: e.date,
            taskId: e.taskId || e.task_id || '',
            projectId: e.projectId || e.project_id || undefined,
            hours: Number(e.hours) || 0,
            note: e.note || '',
            projectName: e.projectName || e.project_name || 'General Project',
            taskName: e.taskName || e.task_name || 'General Task',
            clientName: e.clientName || e.client_name || 'General Client',
            userName: e.userName || e.user_name || undefined,
            isBillable: e.isBillable !== undefined ? e.isBillable : e.is_billable !== false,
          }));
          setEntries(normalizedEntries);
          await AsyncStorage.setItem('velotime_mobile_entries', JSON.stringify(normalizedEntries));
        }
      } else {
        const remoteProjects = await apiRequest('/api/projects');
        if (Array.isArray(remoteProjects)) {
          setProjects(remoteProjects);
        }
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
        weekOffset,
        weekDates,
        weekLabel,
        submissionStatus,
        submissionRejectNote,
        getEntriesForDate,
        startTimer,
        pauseTimer,
        resumeTimer,
        resetTimer,
        saveTimer,
        setTimerNote,
        setTimerProjectAndTask,
        logManualEntry,
        updateEntry,
        deleteEntry,
        selectedEmployeeName,
        setSelectedEmployeeName,
        submitWeekTimesheet,
        unlockWeekTimesheet,
        goToPrevWeek,
        goToNextWeek,
        goToCurrentWeek,
        addProject,
        editProject,
        deleteProject,
        addTaskToProject,
        editTask,
        deleteTask,
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
