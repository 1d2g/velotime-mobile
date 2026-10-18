import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { TimesheetSubmission, TeamMember, Invoice, apiRequest } from '../services/api';
import { useAuth } from './AuthContext';
import { useTimesheet } from './TimesheetContext';

export const INITIAL_SUBMISSIONS: TimesheetSubmission[] = [
  {
    id: 'sub_pending_1',
    userId: 'usr_sarah',
    userName: 'Sarah Jenkins',
    userEmail: 'sarah.j@metropolis.arch',
    userRole: 'Architect',
    weekStartDate: '2026-10-12',
    totalHours: 38.5,
    billableHours: 35.5,
    status: 'submitted',
    submittedAt: '2026-10-16T18:24:00Z',
    breakdown: [
      { projectName: 'Metropolis Tower Design & Envelope', taskName: 'Design Development & Revit CAD', hours: 24.5, isBillable: true },
      { projectName: 'Hudson Yards Flagship Penthouse', taskName: 'Millwork Drawings & Specifications', hours: 11.0, isBillable: true },
      { projectName: 'Metropolis Tower Design & Envelope', taskName: 'Internal Team Review', hours: 3.0, isBillable: false },
    ],
  },
  {
    id: 'sub_pending_2',
    userId: 'usr_marcus',
    userName: 'Marcus Chen',
    userEmail: 'marcus.c@metropolis.arch',
    userRole: 'BIM Coordinator',
    weekStartDate: '2026-10-12',
    totalHours: 41.0,
    billableHours: 41.0,
    status: 'submitted',
    submittedAt: '2026-10-16T19:05:00Z',
    breakdown: [
      { projectName: 'Metropolis Tower Design & Envelope', taskName: 'Structural Coordination & Site Meetings', hours: 22.0, isBillable: true },
      { projectName: 'Nordic Creative Agency Office', taskName: 'Acoustic Treatments & Signage', hours: 19.0, isBillable: true },
    ],
  },
  {
    id: 'sub_past_1',
    userId: 'usr_elena',
    userName: 'Elena Rostova',
    userEmail: 'elena.r@metropolis.arch',
    userRole: 'Design Principal',
    weekStartDate: '2026-10-05',
    totalHours: 36.0,
    billableHours: 32.0,
    status: 'approved',
    submittedAt: '2026-10-09T17:40:00Z',
    breakdown: [
      { projectName: 'Hudson Yards Flagship Penthouse', taskName: 'Client Review & Contractor Walkthrough', hours: 32.0, isBillable: true },
      { projectName: 'Metropolis Tower Design & Envelope', taskName: 'Executive Planning', hours: 4.0, isBillable: false },
    ],
  },
  {
    id: 'sub_past_2',
    userId: 'usr_david',
    userName: 'David Vance',
    userEmail: 'david.v@metropolis.arch',
    userRole: 'Junior Drafter',
    weekStartDate: '2026-10-05',
    totalHours: 40.0,
    billableHours: 40.0,
    status: 'approved',
    submittedAt: '2026-10-09T18:10:00Z',
    breakdown: [
      { projectName: 'Metropolis Tower Design & Envelope', taskName: 'Design Development & Revit CAD', hours: 40.0, isBillable: true },
    ],
  },
];

export const INITIAL_TEAM_MEMBERS: TeamMember[] = [
  {
    id: 'usr_sarah',
    firstName: 'Sarah',
    lastName: 'Jenkins',
    email: 'sarah.j@metropolis.arch',
    role: 'employee',
    capacityHours: 40,
    defaultBillingRate: 165,
    defaultCostRate: 65,
    weeklyLoggedHours: 38.5,
  },
  {
    id: 'usr_marcus',
    firstName: 'Marcus',
    lastName: 'Chen',
    email: 'marcus.c@metropolis.arch',
    role: 'employee',
    capacityHours: 40,
    defaultBillingRate: 175,
    defaultCostRate: 70,
    weeklyLoggedHours: 41.0,
  },
  {
    id: 'usr_elena',
    firstName: 'Elena',
    lastName: 'Rostova',
    email: 'elena.r@metropolis.arch',
    role: 'manager',
    capacityHours: 40,
    defaultBillingRate: 195,
    defaultCostRate: 90,
    weeklyLoggedHours: 36.0,
  },
  {
    id: 'usr_david',
    firstName: 'David',
    lastName: 'Vance',
    email: 'david.v@metropolis.arch',
    role: 'employee',
    capacityHours: 40,
    defaultBillingRate: 125,
    defaultCostRate: 45,
    weeklyLoggedHours: 40.0,
  },
  {
    id: 'guest_mobile_user',
    firstName: 'Studio',
    lastName: 'Partner',
    email: 'demo@velotime.com',
    role: 'admin',
    capacityHours: 40,
    defaultBillingRate: 220,
    defaultCostRate: 110,
    weeklyLoggedHours: 28.5,
  },
];

export const INITIAL_INVOICES: Invoice[] = [
  {
    id: 'inv_1082',
    invoiceNumber: 'INV-1082',
    clientName: 'Metropolis Dev Group',
    projectName: 'Metropolis Tower Design & Envelope',
    amount: 14400,
    status: 'sent',
    issueDate: '2026-10-01',
    dueDate: '2026-10-31',
    totalHours: 80,
  },
  {
    id: 'inv_1081',
    invoiceNumber: 'INV-1081',
    clientName: 'Equinox Luxury Living',
    projectName: 'Hudson Yards Flagship Penthouse',
    amount: 8250,
    status: 'paid',
    issueDate: '2026-09-15',
    dueDate: '2026-10-15',
    totalHours: 50,
  },
  {
    id: 'inv_1080',
    invoiceNumber: 'INV-1080',
    clientName: 'Fjord Creative Labs',
    projectName: 'Nordic Creative Agency Office',
    amount: 6000,
    status: 'paid',
    issueDate: '2026-09-01',
    dueDate: '2026-10-01',
    totalHours: 40,
  },
  {
    id: 'inv_1083',
    invoiceNumber: 'INV-1083',
    clientName: 'Metropolis Dev Group',
    projectName: 'Metropolis Tower Design & Envelope',
    amount: 7200,
    status: 'draft',
    issueDate: '2026-10-15',
    dueDate: '2026-11-15',
    totalHours: 40,
  },
];

export type ReportTimeframe = 'week' | 'last_week' | 'month' | 'all';

interface ManagerContextType {
  submissions: TimesheetSubmission[];
  pendingSubmissions: TimesheetSubmission[];
  pastSubmissions: TimesheetSubmission[];
  teamMembers: TeamMember[];
  invoices: Invoice[];
  reportTimeframe: ReportTimeframe;
  setReportTimeframe: (tf: ReportTimeframe) => void;
  approveSubmission: (id: string) => Promise<void>;
  rejectSubmission: (id: string, note: string) => Promise<void>;
  updateTeamMemberRates: (memberId: string, costRate: number, billingRate: number) => Promise<void>;
  // Computed Executive Metrics
  metrics: {
    totalTeamHours: number;
    totalBillableHours: number;
    utilizationRate: number;
    grossBillableRevenue: number;
    blendedHourlyRate: number;
    uninvoicedAmount: number;
    activeProjectsCount: number;
    teamCapacityBurnPct: number;
  };
  projectBreakdowns: {
    id: string;
    name: string;
    clientName: string;
    hours: number;
    billableHours: number;
    revenue: number;
    budgetHours: number;
    budgetPct: number;
  }[];
  teamBreakdowns: {
    id: string;
    name: string;
    role: string;
    hours: number;
    billableHours: number;
    revenue: number;
    capacity: number;
    utilizationPct: number;
  }[];
  clientBreakdowns: {
    clientName: string;
    hours: number;
    revenue: number;
    projectCount: number;
  }[];
}

const ManagerContext = createContext<ManagerContextType | null>(null);

export function ManagerProvider({ children }: { children: React.ReactNode }) {
  const { user, isDemoMode } = useAuth();
  const { projects } = useTimesheet();

  const [submissions, setSubmissions] = useState<TimesheetSubmission[]>(INITIAL_SUBMISSIONS);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(INITIAL_TEAM_MEMBERS);
  const [invoices, setInvoices] = useState<Invoice[]>(INITIAL_INVOICES);
  const [reportTimeframe, setReportTimeframe] = useState<ReportTimeframe>('week');

  useEffect(() => {
    async function initManagerData() {
      try {
        const storedSubs = await AsyncStorage.getItem('velotime_offline_submissions');
        if (storedSubs) {
          setSubmissions(JSON.parse(storedSubs));
        } else {
          setSubmissions(INITIAL_SUBMISSIONS);
          await AsyncStorage.setItem('velotime_offline_submissions', JSON.stringify(INITIAL_SUBMISSIONS));
        }

        const storedTeam = await AsyncStorage.getItem('velotime_offline_team_members');
        if (storedTeam) {
          setTeamMembers(JSON.parse(storedTeam));
        } else {
          setTeamMembers(INITIAL_TEAM_MEMBERS);
          await AsyncStorage.setItem('velotime_offline_team_members', JSON.stringify(INITIAL_TEAM_MEMBERS));
        }

        const storedInvoices = await AsyncStorage.getItem('velotime_offline_invoices');
        if (storedInvoices) {
          setInvoices(JSON.parse(storedInvoices));
        } else {
          setInvoices(INITIAL_INVOICES);
          await AsyncStorage.setItem('velotime_offline_invoices', JSON.stringify(INITIAL_INVOICES));
        }
      } catch {}
    }
    initManagerData();
  }, []);

  const pendingSubmissions = useMemo(() => {
    return submissions.filter((s) => s.status === 'submitted');
  }, [submissions]);

  const pastSubmissions = useMemo(() => {
    return submissions.filter((s) => s.status !== 'submitted');
  }, [submissions]);

  const approveSubmission = async (id: string) => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}

    const updated = submissions.map((s) =>
      s.id === id ? { ...s, status: 'approved' as const, note: undefined } : s
    );
    setSubmissions(updated);
    await AsyncStorage.setItem('velotime_offline_submissions', JSON.stringify(updated));

    if (!isDemoMode && user) {
      try {
        await apiRequest(`/api/timesheet-submissions/${id}/status`, 'PUT', { status: 'approved' });
      } catch {}
    }
  };

  const rejectSubmission = async (id: string, note: string) => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch {}

    const updated = submissions.map((s) =>
      s.id === id ? { ...s, status: 'rejected' as const, note: note.trim() || 'Please revise and resubmit.' } : s
    );
    setSubmissions(updated);
    await AsyncStorage.setItem('velotime_offline_submissions', JSON.stringify(updated));

    if (!isDemoMode && user) {
      try {
        await apiRequest(`/api/timesheet-submissions/${id}/status`, 'PUT', { status: 'rejected', note });
      } catch {}
    }
  };

  const updateTeamMemberRates = async (memberId: string, costRate: number, billingRate: number) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}

    const updated = teamMembers.map((m) =>
      m.id === memberId ? { ...m, defaultCostRate: costRate, defaultBillingRate: billingRate } : m
    );
    setTeamMembers(updated);
    await AsyncStorage.setItem('velotime_offline_team_members', JSON.stringify(updated));

    if (!isDemoMode && user) {
      try {
        await apiRequest(`/api/users/${memberId}/rates`, 'PUT', {
          defaultCostRate: costRate,
          defaultBillingRate: billingRate,
        });
      } catch {}
    }
  };

  // Metrics multiplier based on timeframe
  const timeframeMultiplier = useMemo(() => {
    switch (reportTimeframe) {
      case 'week':
        return 1.0;
      case 'last_week':
        return 0.94;
      case 'month':
        return 4.2;
      case 'all':
        return 12.5;
    }
  }, [reportTimeframe]);

  // Aggregate project reporting
  const projectBreakdowns = useMemo(() => {
    return projects.map((p, idx) => {
      const baseHours = idx === 0 ? 92.5 : idx === 1 ? 58.0 : 33.5;
      const hours = Math.round(baseHours * timeframeMultiplier * 10) / 10;
      const billableHours = Math.round(hours * 0.92 * 10) / 10;
      const rate = p.hourlyRate || 165;
      const revenue = Math.round(billableHours * rate);
      const budgetHours = p.budgetHours || (p.budgetLimit ? Math.round(p.budgetLimit / rate) : 180);
      const budgetPct = budgetHours > 0 ? Math.min(100, Math.round((hours / budgetHours) * 100)) : 0;

      return {
        id: p.id,
        name: p.name,
        clientName: p.clientName || 'General Client',
        hours,
        billableHours,
        revenue,
        budgetHours,
        budgetPct,
      };
    });
  }, [projects, timeframeMultiplier]);

  // Aggregate team reporting
  const teamBreakdowns = useMemo(() => {
    return teamMembers.map((tm) => {
      const logged = tm.weeklyLoggedHours || 38.0;
      const hours = Math.round(logged * timeframeMultiplier * 10) / 10;
      const billableHours = Math.round(hours * 0.9 * 10) / 10;
      const revenue = Math.round(billableHours * tm.defaultBillingRate);
      const capacity = Math.round(tm.capacityHours * (reportTimeframe === 'month' ? 4 : reportTimeframe === 'all' ? 12 : 1));
      const utilizationPct = capacity > 0 ? Math.min(100, Math.round((billableHours / capacity) * 100)) : 88;

      return {
        id: tm.id,
        name: `${tm.firstName} ${tm.lastName}`,
        role: tm.role === 'admin' ? 'Studio Partner' : tm.role === 'manager' ? 'Design Principal' : 'Architect',
        hours,
        billableHours,
        revenue,
        capacity,
        utilizationPct,
      };
    });
  }, [teamMembers, timeframeMultiplier, reportTimeframe]);

  // Aggregate client reporting
  const clientBreakdowns = useMemo(() => {
    const map: Record<string, { hours: number; revenue: number; projectCount: number }> = {};
    for (const pb of projectBreakdowns) {
      if (!map[pb.clientName]) {
        map[pb.clientName] = { hours: 0, revenue: 0, projectCount: 0 };
      }
      map[pb.clientName].hours += pb.hours;
      map[pb.clientName].revenue += pb.revenue;
      map[pb.clientName].projectCount += 1;
    }
    return Object.entries(map).map(([clientName, data]) => ({
      clientName,
      hours: Math.round(data.hours * 10) / 10,
      revenue: data.revenue,
      projectCount: data.projectCount,
    }));
  }, [projectBreakdowns]);

  // Executive High-level KPIs
  const metrics = useMemo(() => {
    const totalTeamHours = projectBreakdowns.reduce((sum, p) => sum + p.hours, 0);
    const totalBillableHours = projectBreakdowns.reduce((sum, p) => sum + p.billableHours, 0);
    const grossBillableRevenue = projectBreakdowns.reduce((sum, p) => sum + p.revenue, 0);
    const totalCapacity = teamMembers.length * 40 * (reportTimeframe === 'month' ? 4 : reportTimeframe === 'all' ? 12 : 1);
    const utilizationRate = totalCapacity > 0 ? Math.min(100, Math.round((totalBillableHours / totalCapacity) * 100)) : 88;
    const blendedHourlyRate = totalBillableHours > 0 ? Math.round(grossBillableRevenue / totalBillableHours) : 170;
    const uninvoicedAmount = Math.round(grossBillableRevenue * 0.38);
    const activeProjectsCount = projects.length;
    const teamCapacityBurnPct = totalCapacity > 0 ? Math.min(100, Math.round((totalTeamHours / totalCapacity) * 100)) : 90;

    return {
      totalTeamHours: Math.round(totalTeamHours * 10) / 10,
      totalBillableHours: Math.round(totalBillableHours * 10) / 10,
      utilizationRate,
      grossBillableRevenue,
      blendedHourlyRate,
      uninvoicedAmount,
      activeProjectsCount,
      teamCapacityBurnPct,
    };
  }, [projectBreakdowns, teamMembers, reportTimeframe, projects]);

  return (
    <ManagerContext.Provider
      value={{
        submissions,
        pendingSubmissions,
        pastSubmissions,
        teamMembers,
        invoices,
        reportTimeframe,
        setReportTimeframe,
        approveSubmission,
        rejectSubmission,
        updateTeamMemberRates,
        metrics,
        projectBreakdowns,
        teamBreakdowns,
        clientBreakdowns,
      }}
    >
      {children}
    </ManagerContext.Provider>
  );
}

export function useManager() {
  const context = useContext(ManagerContext);
  if (!context) throw new Error('useManager must be used within a ManagerProvider');
  return context;
}
