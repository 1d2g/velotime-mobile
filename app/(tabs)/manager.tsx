import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  TextInput,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Share,
} from 'react-native';
import {
  BarChart3,
  CheckCheck,
  FileText,
  Users,
  Check,
  X,
  Clock,
  ArrowUpRight,
  DollarSign,
  Briefcase,
  AlertCircle,
  Calendar,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  CreditCard,
  Edit3,
  Percent,
  Unlock,
  AlertTriangle,
  AlertOctagon,
  Share2,
  ShieldCheck,
  Plus,
  Send,
  Trash2,
} from 'lucide-react-native';
import { useManager, ReportTimeframe } from '@/src/context/ManagerContext';
import { useTimesheet } from '@/src/context/TimesheetContext';
import { useExpenses } from '@/src/context/ExpenseContext';
import { useAuth } from '@/src/context/AuthContext';
import { useTheme } from '@/src/context/ThemeContext';
import { Spacing, Radius } from '@/src/constants/theme';
import { TimesheetSubmission, TeamMember, Invoice, getLocalDateString } from '@/src/services/api';

type ManagerSubTab = 'dashboard' | 'approvals' | 'reports' | 'team';
type ReportPreset = 'profitability' | 'clients' | 'utilization' | 'uninvoiced' | 'audit_log';

const REPORT_PRESETS: { id: ReportPreset; label: string }[] = [
  { id: 'profitability', label: 'Project Profitability' },
  { id: 'clients', label: 'Client Revenue' },
  { id: 'utilization', label: 'Team Utilization' },
  { id: 'uninvoiced', label: 'Uninvoiced Ledger' },
  { id: 'audit_log', label: 'Audit Log' },
];

export default function ManagerScreen() {
  const { colors } = useTheme();
  const { orgSettings } = useAuth();
  const { projects, entries } = useTimesheet();
  const { expenses } = useExpenses();
  const {
    pendingSubmissions,
    pastSubmissions,
    teamMembers,
    invoices,
    reportTimeframe,
    setReportTimeframe,
    approveSubmission,
    rejectSubmission,
    unlockSubmission,
    updateTeamMemberRates,
    addTeamMember,
    updateTeamMember,
    removeTeamMember,
    createInvoice,
    updateInvoiceStatus,
    deleteInvoice,
    metrics,
    projectBreakdowns,
    teamBreakdowns,
    clientBreakdowns,
  } = useManager();

  const [activeSubTab, setActiveSubTab] = useState<ManagerSubTab>('dashboard');
  const [reportPreset, setReportPreset] = useState<ReportPreset>('profitability');
  const [expandedSubmissionId, setExpandedSubmissionId] = useState<string | null>(null);

  // Reject Modal State
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [selectedSubForReject, setSelectedSubForReject] = useState<TimesheetSubmission | null>(null);
  const [rejectNote, setRejectNote] = useState('');

  // Team Member Modal State (Edit Rates / Invite Member)
  const [rateModalVisible, setRateModalVisible] = useState(false);
  const [selectedMemberForRate, setSelectedMemberForRate] = useState<TeamMember | null>(null);
  const [editBillingRate, setEditBillingRate] = useState('');
  const [editCostRate, setEditCostRate] = useState('');

  const [memberModalVisible, setMemberModalVisible] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [mFirstName, setMFirstName] = useState('');
  const [mLastName, setMLastName] = useState('');
  const [mEmail, setMEmail] = useState('');
  const [mRole, setMRole] = useState<'admin' | 'manager' | 'employee'>('employee');
  const [mCapacity, setMCapacity] = useState('40');
  const [mBillRate, setMBillRate] = useState('165');
  const [mCostRate, setMCostRate] = useState('65');

  // Create Invoice Modal State
  const [invoiceModalVisible, setInvoiceModalVisible] = useState(false);
  const [invProjectId, setInvProjectId] = useState(projects[0]?.id || 'p1');
  const [invBillingMode, setInvBillingMode] = useState<'hourly' | 'progress' | 'expense' | 'flat'>('hourly');
  const [invCustomAmount, setInvCustomAmount] = useState('4800');
  const [invTaxRate, setInvTaxRate] = useState(String(orgSettings.defaultTaxRate || 0));
  const [invDueDate, setInvDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return getLocalDateString(d);
  });
  const [invNotes, setInvNotes] = useState('');

  // Client Audit Proof Modal State
  const [auditInvoice, setAuditInvoice] = useState<Invoice | null>(null);

  const formatCurrency = (val: number) => {
    return '$' + val.toLocaleString('en-US', { maximumFractionDigits: 0 });
  };

  const handleOpenReject = (sub: TimesheetSubmission) => {
    setSelectedSubForReject(sub);
    setRejectNote('');
    setRejectModalVisible(true);
  };

  const handleConfirmReject = async () => {
    if (!selectedSubForReject) return;
    if (!rejectNote.trim()) {
      Alert.alert('Feedback Note Required', 'Please provide a brief note explaining why this timesheet was returned.');
      return;
    }
    await rejectSubmission(selectedSubForReject.id, rejectNote);
    setRejectModalVisible(false);
    setSelectedSubForReject(null);
  };

  const handleOpenRateEdit = (member: TeamMember) => {
    setSelectedMemberForRate(member);
    setEditBillingRate(String(member.defaultBillingRate || 165));
    setEditCostRate(String(member.defaultCostRate || 65));
    setRateModalVisible(true);
  };

  const handleSaveRates = async () => {
    if (!selectedMemberForRate) return;
    const bRate = parseFloat(editBillingRate);
    const cRate = parseFloat(editCostRate);
    if (isNaN(bRate) || isNaN(cRate) || bRate <= 0 || cRate <= 0) {
      Alert.alert('Invalid Rates', 'Please enter valid numerical hourly rates.');
      return;
    }
    await updateTeamMemberRates(selectedMemberForRate.id, cRate, bRate);
    setRateModalVisible(false);
    setSelectedMemberForRate(null);
  };

  const handleOpenAddMember = () => {
    setEditingMember(null);
    setMFirstName('');
    setMLastName('');
    setMEmail('');
    setMRole('employee');
    setMCapacity('40');
    setMBillRate('165');
    setMCostRate('65');
    setMemberModalVisible(true);
  };

  const handleOpenEditMember = (m: TeamMember) => {
    setEditingMember(m);
    setMFirstName(m.firstName);
    setMLastName(m.lastName);
    setMEmail(m.email);
    setMRole(m.role);
    setMCapacity(String(m.capacityHours || 40));
    setMBillRate(String(m.defaultBillingRate || 165));
    setMCostRate(String(m.defaultCostRate || 65));
    setMemberModalVisible(true);
  };

  const handleSaveMember = async () => {
    if (!mFirstName.trim() || !mEmail.trim()) {
      Alert.alert('Missing Details', 'First name and work email are required.');
      return;
    }
    const payload = {
      firstName: mFirstName.trim(),
      lastName: mLastName.trim() || 'Member',
      email: mEmail.trim().toLowerCase(),
      role: mRole,
      capacityHours: parseFloat(mCapacity) || 40,
      defaultBillingRate: parseFloat(mBillRate) || 165,
      defaultCostRate: parseFloat(mCostRate) || 65,
    };
    if (editingMember) {
      await updateTeamMember(editingMember.id, payload);
    } else {
      await addTeamMember({ ...payload, weeklyLoggedHours: 0 });
    }
    setMemberModalVisible(false);
    setEditingMember(null);
  };

  const selectedInvoiceProject = projects.find((p) => p.id === invProjectId) || projects[0];
  const selectedInvoiceProjStats = projectBreakdowns.find((pb) => pb.id === selectedInvoiceProject?.id);

  const computedInvoiceDraft = React.useMemo(() => {
    const baseHourlyRevenue = selectedInvoiceProjStats?.revenue || (selectedInvoiceProject?.hourlyRate || 165) * 20;
    const baseHours = selectedInvoiceProjStats?.billableHours || 20;
    const projExpenses = expenses
      .filter((ex) => ex.projectId === selectedInvoiceProject?.id && ex.isBillable)
      .reduce((s, ex) => s + ex.amount, 0);

    let subtotal = baseHourlyRevenue;
    let hours = baseHours;
    if (invBillingMode === 'progress') {
      subtotal = Math.round((selectedInvoiceProject?.budget || baseHourlyRevenue) * 0.25);
      hours = Math.round(baseHours * 0.5 * 10) / 10;
    } else if (invBillingMode === 'expense') {
      subtotal = Math.round((baseHourlyRevenue + projExpenses) * 100) / 100;
    } else if (invBillingMode === 'flat') {
      subtotal = parseFloat(invCustomAmount) || 0;
      hours = 0;
    }
    const taxPct = Math.max(0, parseFloat(invTaxRate) || 0);
    const total = Math.round(subtotal * (1 + taxPct / 100) * 100) / 100;
    return { subtotal, hours, total, projExpenses };
  }, [selectedInvoiceProject, selectedInvoiceProjStats, expenses, invBillingMode, invCustomAmount, invTaxRate]);

  const handleOpenCreateInvoice = () => {
    setInvProjectId(projects[0]?.id || 'p1');
    setInvBillingMode('hourly');
    setInvCustomAmount('4800');
    setInvTaxRate(String(orgSettings.defaultTaxRate || 0));
    setInvNotes('Net 30 payment terms. Verified via VeloTime Audit Log.');
    setInvoiceModalVisible(true);
  };

  const handleSaveNewInvoice = async () => {
    if (!selectedInvoiceProject) return;
    if (computedInvoiceDraft.total <= 0) {
      Alert.alert('Invalid Amount', 'Invoice total must be greater than $0.');
      return;
    }
    const invoiceNumber = `${orgSettings.invoicePrefix || 'INV-2026-'}${orgSettings.nextInvoiceNumber || invoices.length + 101}`;
    await createInvoice({
      invoiceNumber,
      clientName: selectedInvoiceProject.clientName || 'General Client',
      projectName: selectedInvoiceProject.name,
      amount: computedInvoiceDraft.total,
      status: 'draft',
      issueDate: getLocalDateString(),
      dueDate: invDueDate || getLocalDateString(),
      totalHours: computedInvoiceDraft.hours,
      billingMode: invBillingMode,
      taxRate: parseFloat(invTaxRate) || 0,
      notes: invNotes.trim(),
    });
    setInvoiceModalVisible(false);
  };

  const handleExportReportCSV = async () => {
    let lines: string[] = [];
    let title = 'VeloTime Report';

    if (reportPreset === 'profitability') {
      title = 'Project Profitability Report';
      lines.push('Project,Client,Hours,BillableHours,Revenue,LaborCost,Profit,MarginPct');
      projectBreakdowns.forEach((p) => {
        lines.push(`"${p.name}","${p.clientName}",${p.hours},${p.billableHours},${p.revenue},${p.costAmount},${p.profitAmount},${p.marginPercent}%`);
      });
    } else if (reportPreset === 'clients') {
      title = 'Client Revenue Report';
      lines.push('Client,ActiveProjects,Hours,Revenue');
      clientBreakdowns.forEach((c) => {
        lines.push(`"${c.clientName}",${c.projectCount},${c.hours},${c.revenue}`);
      });
    } else if (reportPreset === 'utilization') {
      title = 'Team Utilization Report';
      lines.push('Member,Role,CapacityHours,LoggedHours,BillableHours,UtilizationPct,Revenue');
      teamBreakdowns.forEach((t) => {
        lines.push(`"${t.name}","${t.role}",${t.capacity},${t.hours},${t.billableHours},${t.utilizationPct}%,${t.revenue}`);
      });
    } else if (reportPreset === 'uninvoiced') {
      title = 'Uninvoiced WIP & Expenses Ledger';
      lines.push('Category,Item,Client,Amount');
      lines.push(`"Uninvoiced Labor","Ready to Invoice Hours","All Clients",${Math.max(0, metrics.uninvoicedAmount - metrics.uninvoicedExpenseAmount)}`);
      expenses
        .filter((e) => e.isBillable && e.status !== 'invoiced')
        .forEach((e) => {
          lines.push(`"Billable Expense","${e.description}","${e.clientName || 'General'}",${e.amount}`);
        });
    } else {
      title = 'Detailed Time Entry Audit Log';
      lines.push('Date,Project,Task,Client,Hours,Billable,Note');
      entries.forEach((e) => {
        lines.push(`${e.date},"${e.projectName || ''}","${e.taskName || ''}","${e.clientName || ''}",${e.hours},${e.isBillable !== false ? 'Yes' : 'No'},"${(e.note || '').replace(/"/g, '""')}"`);
      });
    }

    try {
      await Share.share({
        title,
        message: lines.join('\n'),
      });
    } catch {}
  };

  const handleShareClientProof = async (inv: Invoice) => {
    const hash = inv.auditHash || `VT-PROOF-${inv.invoiceNumber}`;
    const summary = [
      `VELOTIME CLIENT AUDIT PROOF`,
      `Organization: ${orgSettings.orgName}`,
      `Invoice: ${inv.invoiceNumber} (${inv.status.toUpperCase()})`,
      `Client: ${inv.clientName}`,
      `Project: ${inv.projectName}`,
      `Total Verified Hours: ${(inv.totalHours || 0).toFixed(1)}h`,
      `Total Amount: $${inv.amount.toLocaleString()}`,
      `Issue Date: ${inv.issueDate} | Due: ${inv.dueDate}`,
      `Audit Verification Hash: ${hash}`,
    ].join('\n');
    try {
      await Share.share({ title: `Audit Proof ${inv.invoiceNumber}`, message: summary });
    } catch {}
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]}>
      {/* Top Segmented Sub-Tab Bar */}
      <View style={[styles.subTabBar, { backgroundColor: colors.surface, borderBottomColor: colors.borderSubtle }]}>
        <TouchableOpacity
          style={[
            styles.subTabItem,
            activeSubTab === 'dashboard' && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
          ]}
          onPress={() => setActiveSubTab('dashboard')}
          activeOpacity={0.7}
        >
          <TrendingUp
            color={activeSubTab === 'dashboard' ? colors.primary : colors.textDim}
            size={16}
            strokeWidth={2.2}
          />
          <Text
            style={[
              styles.subTabTitle,
              { color: activeSubTab === 'dashboard' ? colors.primary : colors.textMuted },
            ]}
          >
            Dashboard
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.subTabItem,
            activeSubTab === 'approvals' && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
          ]}
          onPress={() => setActiveSubTab('approvals')}
          activeOpacity={0.7}
        >
          <View style={styles.tabBadgeWrap}>
            <CheckCheck
              color={activeSubTab === 'approvals' ? colors.primary : colors.textDim}
              size={16}
              strokeWidth={2.2}
            />
            {pendingSubmissions.length > 0 && (
              <View style={[styles.tabBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.tabBadgeText}>{pendingSubmissions.length}</Text>
              </View>
            )}
          </View>
          <Text
            style={[
              styles.subTabTitle,
              { color: activeSubTab === 'approvals' ? colors.primary : colors.textMuted },
            ]}
          >
            Approvals
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.subTabItem,
            activeSubTab === 'reports' && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
          ]}
          onPress={() => setActiveSubTab('reports')}
          activeOpacity={0.7}
        >
          <BarChart3
            color={activeSubTab === 'reports' ? colors.primary : colors.textDim}
            size={16}
            strokeWidth={2.2}
          />
          <Text
            style={[
              styles.subTabTitle,
              { color: activeSubTab === 'reports' ? colors.primary : colors.textMuted },
            ]}
          >
            Reports
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.subTabItem,
            activeSubTab === 'team' && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
          ]}
          onPress={() => setActiveSubTab('team')}
          activeOpacity={0.7}
        >
          <Users
            color={activeSubTab === 'team' ? colors.primary : colors.textDim}
            size={16}
            strokeWidth={2.2}
          />
          <Text
            style={[
              styles.subTabTitle,
              { color: activeSubTab === 'team' ? colors.primary : colors.textMuted },
            ]}
          >
            Team & Invoices
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* ========================================================================= */}
        {/* SUBTAB 1: EXECUTIVE DASHBOARD */}
        {/* ========================================================================= */}
        {activeSubTab === 'dashboard' && (
          <View>
            {/* Pending Approvals Alert Banner */}
            {pendingSubmissions.length > 0 && (
              <TouchableOpacity
                style={[
                  styles.alertBanner,
                  { backgroundColor: `${colors.primary}12`, borderColor: colors.primary },
                ]}
                onPress={() => setActiveSubTab('approvals')}
                activeOpacity={0.8}
              >
                <View style={styles.alertBannerLeft}>
                  <AlertCircle color={colors.primary} size={18} strokeWidth={2.2} style={{ marginRight: 8 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.alertBannerTitle, { color: colors.text }]}>
                      {pendingSubmissions.length} Timesheet{pendingSubmissions.length === 1 ? '' : 's'} Awaiting Approval
                    </Text>
                    <Text style={[styles.alertBannerSub, { color: colors.textMuted }]}>
                      Review and unlock hours for Friday client billing.
                    </Text>
                  </View>
                </View>
                <ArrowUpRight color={colors.primary} size={18} />
              </TouchableOpacity>
            )}

            {/* KPI 2x2 Grid */}
            <View style={styles.gridRow}>
              <View
                style={[
                  styles.metricCard,
                  { backgroundColor: colors.surface, borderColor: colors.borderSubtle },
                ]}
              >
                <Text style={[styles.metricLabel, { color: colors.textDim }]}>GROSS BILLABLE REVENUE</Text>
                <Text style={[styles.metricValue, { color: colors.primary }]}>
                  {formatCurrency(metrics.grossBillableRevenue)}
                </Text>
                <Text style={[styles.metricSub, { color: colors.textMuted }]}>
                  Avg rate: ${metrics.blendedHourlyRate}/hr
                </Text>
              </View>

              <View
                style={[
                  styles.metricCard,
                  { backgroundColor: colors.surface, borderColor: colors.borderSubtle },
                ]}
              >
                <Text style={[styles.metricLabel, { color: colors.textDim }]}>TOTAL TEAM HOURS</Text>
                <Text style={[styles.metricValue, { color: colors.text }]}>
                  {metrics.totalTeamHours.toFixed(1)}h
                </Text>
                <Text style={[styles.metricSub, { color: colors.textMuted }]}>
                  {metrics.totalBillableHours.toFixed(1)}h billable to clients
                </Text>
              </View>
            </View>

            <View style={styles.gridRow}>
              <View
                style={[
                  styles.metricCard,
                  { backgroundColor: colors.surface, borderColor: colors.borderSubtle },
                ]}
              >
                <Text style={[styles.metricLabel, { color: colors.textDim }]}>BILLABLE UTILIZATION</Text>
                <Text style={[styles.metricValue, { color: colors.text }]}>
                  {metrics.utilizationRate}%
                </Text>
                <View style={[styles.progressTrack, { backgroundColor: colors.surfaceSubtle }]}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${metrics.utilizationRate}%`, backgroundColor: colors.primary },
                    ]}
                  />
                </View>
              </View>

              <View
                style={[
                  styles.metricCard,
                  { backgroundColor: colors.surface, borderColor: colors.borderSubtle },
                ]}
              >
                <Text style={[styles.metricLabel, { color: colors.textDim }]}>UNINVOICED WORK IN PROGRESS</Text>
                <Text style={[styles.metricValue, { color: colors.text }]}>
                  {formatCurrency(metrics.uninvoicedAmount)}
                </Text>
                <Text style={[styles.metricSub, { color: colors.textMuted }]}>
                  Ready to draft into invoices
                </Text>
              </View>
            </View>

            {/* Team Capacity Burn Bar */}
            <View
              style={[
                styles.capacityCard,
                { backgroundColor: colors.surface, borderColor: colors.borderSubtle },
              ]}
            >
              <View style={styles.capacityHeader}>
                <View>
                  <Text style={[styles.capacityTitle, { color: colors.text }]}>Studio Capacity Burn</Text>
                  <Text style={[styles.capacitySub, { color: colors.textMuted }]}>
                    {metrics.totalTeamHours.toFixed(1)} of {teamMembers.length * 40} available capacity hours logged
                  </Text>
                </View>
                <Text style={[styles.capacityPct, { color: colors.primary }]}>
                  {metrics.teamCapacityBurnPct}%
                </Text>
              </View>
              <View style={[styles.progressTrack, { backgroundColor: colors.surfaceSubtle, height: 8 }]}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${metrics.teamCapacityBurnPct}%`, backgroundColor: colors.primary },
                  ]}
                />
              </View>
            </View>

            {/* Active Projects Fast Summary */}
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionHeading, { color: colors.text }]}>Active Project Pacing</Text>
              <TouchableOpacity onPress={() => setActiveSubTab('reports')}>
                <Text style={[styles.seeAllText, { color: colors.primary }]}>Full Report</Text>
              </TouchableOpacity>
            </View>

            {projectBreakdowns.map((proj) => (
              <View
                key={proj.id}
                style={[
                  styles.projectSummaryCard,
                  { backgroundColor: colors.surface, borderColor: colors.borderSubtle },
                ]}
              >
                <View style={styles.projectSummaryTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.projectSummaryName, { color: colors.text }]}>{proj.name}</Text>
                    <Text style={[styles.projectSummaryClient, { color: colors.textMuted }]}>{proj.clientName}</Text>
                  </View>
                  <Text style={[styles.projectSummaryHours, { color: colors.text }]}>
                    {proj.hours.toFixed(1)} hrs
                  </Text>
                </View>
                <View style={[styles.progressTrack, { backgroundColor: colors.surfaceSubtle, marginTop: 8 }]}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${Math.min(100, proj.budgetPct)}%`,
                        backgroundColor: proj.budgetPct > 90 ? '#E11D48' : colors.primary,
                      },
                    ]}
                  />
                </View>
                <View style={styles.budgetMetaRow}>
                  <Text style={[styles.budgetMetaText, { color: colors.textDim }]}>
                    Budget: {proj.budgetHours} hrs ({proj.budgetPct}% consumed)
                  </Text>
                  <Text style={[styles.budgetMetaText, { color: colors.primary }]}>
                    {formatCurrency(proj.revenue)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ========================================================================= */}
        {/* SUBTAB 2: APPROVALS */}
        {/* ========================================================================= */}
        {activeSubTab === 'approvals' && (
          <View>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionHeading, { color: colors.text }]}>
                Pending Timesheet Submissions ({pendingSubmissions.length})
              </Text>
            </View>

            {pendingSubmissions.length === 0 ? (
              <View
                style={[
                  styles.emptyCard,
                  { backgroundColor: colors.surface, borderColor: colors.borderSubtle },
                ]}
              >
                <CheckCheck color="#10B981" size={36} strokeWidth={2} style={{ marginBottom: Spacing.sm }} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>All Caught Up</Text>
                <Text style={[styles.emptyDesc, { color: colors.textMuted }]}>
                  Zero timesheets pending review. All employee hours have been approved.
                </Text>
              </View>
            ) : (
              pendingSubmissions.map((sub) => {
                const isExpanded = expandedSubmissionId === sub.id;
                return (
                  <View
                    key={sub.id}
                    style={[
                      styles.submissionCard,
                      { backgroundColor: colors.surface, borderColor: colors.borderSubtle },
                    ]}
                  >
                    <View style={styles.subCardTop}>
                      <View style={styles.avatarWrap}>
                        <Text style={[styles.avatarText, { color: colors.primary }]}>
                          {sub.userName.split(' ').map((n) => n[0]).join('')}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.subUserName, { color: colors.text }]}>{sub.userName}</Text>
                        <Text style={[styles.subMeta, { color: colors.textMuted }]}>
                          Week of {sub.weekStartDate} • {sub.userRole || 'Team Member'}
                        </Text>
                      </View>
                      <View style={styles.hoursBadge}>
                        <Text style={[styles.hoursBadgeText, { color: colors.primary }]}>
                          {sub.totalHours.toFixed(1)} hrs
                        </Text>
                      </View>
                    </View>

                    {/* Breakdown Accordion Toggle */}
                    {sub.breakdown && sub.breakdown.length > 0 && (
                      <TouchableOpacity
                        style={styles.expandRow}
                        onPress={() => setExpandedSubmissionId(isExpanded ? null : sub.id)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.expandText, { color: colors.textMuted }]}>
                          {isExpanded ? 'Hide Task Breakdown' : `View ${sub.breakdown.length} Logged Tasks`}
                        </Text>
                        {isExpanded ? (
                          <ChevronUp color={colors.textMuted} size={14} />
                        ) : (
                          <ChevronDown color={colors.textMuted} size={14} />
                        )}
                      </TouchableOpacity>
                    )}

                    {/* Expanded Task Breakdown */}
                    {isExpanded && sub.breakdown && (
                      <View
                        style={[
                          styles.breakdownDrawer,
                          { backgroundColor: colors.surfaceSubtle, borderColor: colors.borderSubtle },
                        ]}
                      >
                        {sub.breakdown.map((item, idx) => (
                          <View
                            key={idx}
                            style={[
                              styles.breakdownItem,
                              idx < sub.breakdown!.length - 1 && {
                                borderBottomColor: colors.borderSubtle,
                                borderBottomWidth: 1,
                              },
                            ]}
                          >
                            <View style={{ flex: 1 }}>
                              <Text style={[styles.breakdownProj, { color: colors.text }]}>
                                {item.projectName}
                              </Text>
                              <Text style={[styles.breakdownTask, { color: colors.textMuted }]}>
                                {item.taskName}
                              </Text>
                            </View>
                            <Text style={[styles.breakdownHours, { color: colors.text }]}>
                              {item.hours.toFixed(1)}h
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}

                    {/* Action Buttons: Reject & Approve */}
                    <View style={styles.subActionRow}>
                      <TouchableOpacity
                        style={[styles.rejectBtn, { borderColor: colors.borderSubtle }]}
                        onPress={() => handleOpenReject(sub)}
                        activeOpacity={0.7}
                      >
                        <X color="#E11D48" size={14} strokeWidth={2.5} style={{ marginRight: 4 }} />
                        <Text style={styles.rejectBtnText}>Reject</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.approveBtn, { backgroundColor: '#10B981' }]}
                        onPress={() => approveSubmission(sub.id)}
                        activeOpacity={0.8}
                      >
                        <Check color="#FFFFFF" size={14} strokeWidth={2.5} style={{ marginRight: 4 }} />
                        <Text style={styles.approveBtnText}>Approve Week</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}

            {/* Past Submissions History */}
            <View style={[styles.sectionHeaderRow, { marginTop: Spacing.xl }]}>
              <Text style={[styles.sectionHeading, { color: colors.text }]}>
                Past Approvals Audit Log ({pastSubmissions.length})
              </Text>
            </View>

            {pastSubmissions.map((sub) => (
              <View
                key={sub.id}
                style={[
                  styles.pastSubCard,
                  { backgroundColor: colors.surface, borderColor: colors.borderSubtle },
                ]}
              >
                <View style={styles.pastSubLeft}>
                  <Text style={[styles.pastSubName, { color: colors.text }]}>{sub.userName}</Text>
                  <Text style={[styles.pastSubDate, { color: colors.textMuted }]}>
                    Week of {sub.weekStartDate} • {sub.totalHours.toFixed(1)} hrs
                  </Text>
                  {sub.note && (
                    <Text style={[styles.pastSubNote, { color: '#E11D48' }]}>
                      Feedback: {sub.note}
                    </Text>
                  )}
                </View>
                <View style={{ alignItems: 'flex-end', gap: 6 }}>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: sub.status === 'approved' ? '#10B98120' : '#E11D4820',
                        borderColor: sub.status === 'approved' ? '#10B98150' : '#E11D4850',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        { color: sub.status === 'approved' ? '#059669' : '#E11D48' },
                      ]}
                    >
                      {sub.status === 'approved' ? 'Approved' : 'Rejected'}
                    </Text>
                  </View>

                  {sub.status === 'approved' && (
                    <TouchableOpacity
                      onPress={() => {
                        Alert.alert(
                          'Unlock Timesheet',
                          `Unlock ${sub.userName}'s timesheet for week of ${sub.weekStartDate}? This will reopen it for employee edits.`,
                          [
                            { text: 'Cancel', style: 'cancel' },
                            {
                              text: 'Unlock Timesheet',
                              onPress: async () => {
                                await unlockSubmission(sub.id);
                                Alert.alert('Timesheet Unlocked', 'Timesheet has been returned to draft status.');
                              },
                            },
                          ]
                        );
                      }}
                      style={{
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderWidth: 1,
                        borderColor: colors.borderSubtle,
                        backgroundColor: colors.surfaceSubtle,
                        borderRadius: 2,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <Unlock size={11} color={colors.textMuted} />
                      <Text style={{ fontSize: 10, fontWeight: '700', color: colors.textMuted }}>
                        Unlock
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ========================================================================= */}
        {/* SUBTAB 3: REPORTS & ANALYTICS */}
        {/* ========================================================================= */}
        {activeSubTab === 'reports' && (
          <View>
            {/* Report Header + Export CSV */}
            <View style={[styles.sectionHeaderRow, { marginTop: 0, marginBottom: Spacing.sm }]}>
              <Text style={[styles.sectionHeading, { color: colors.text }]}>Executive Reports</Text>
              <TouchableOpacity
                style={[styles.exportCsvBtn, { backgroundColor: colors.primaryMuted, borderColor: colors.primary }]}
                onPress={handleExportReportCSV}
              >
                <Share2 color={colors.primary} size={13} />
                <Text style={[styles.exportCsvText, { color: colors.primary }]}>Export CSV</Text>
              </TouchableOpacity>
            </View>

            {/* Report Preset Pills */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: Spacing.sm }}
              contentContainerStyle={{ gap: 6 }}
            >
              {REPORT_PRESETS.map((preset) => {
                const active = reportPreset === preset.id;
                return (
                  <TouchableOpacity
                    key={preset.id}
                    style={[
                      styles.presetPill,
                      {
                        backgroundColor: active ? colors.primaryMuted : colors.surface,
                        borderColor: active ? colors.primary : colors.borderSubtle,
                      },
                    ]}
                    onPress={() => setReportPreset(preset.id)}
                  >
                    <Text
                      style={[
                        styles.presetPillText,
                        { color: active ? colors.primary : colors.textMuted },
                      ]}
                    >
                      {preset.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Timeframe Selector */}
            <View style={styles.timeframeRow}>
              {(['week', 'last_week', 'month', 'all'] as ReportTimeframe[]).map((tf) => {
                const isSelected = reportTimeframe === tf;
                const labels: Record<ReportTimeframe, string> = {
                  week: 'This Week',
                  last_week: 'Last Week',
                  month: 'This Month',
                  all: 'All Time',
                };
                return (
                  <TouchableOpacity
                    key={tf}
                    style={[
                      styles.timeframeChip,
                      {
                        backgroundColor: isSelected ? colors.primary : colors.surface,
                        borderColor: isSelected ? colors.primary : colors.borderSubtle,
                      },
                    ]}
                    onPress={() => setReportTimeframe(tf)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.timeframeText,
                        { color: isSelected ? '#FFFFFF' : colors.textMuted },
                      ]}
                    >
                      {labels[tf]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Billable Ratio Banner */}
            <View
              style={[
                styles.ratioBanner,
                { backgroundColor: colors.surface, borderColor: colors.borderSubtle },
              ]}
            >
              <View style={styles.ratioHeader}>
                <Text style={[styles.ratioTitle, { color: colors.text }]}>Billable vs Internal Time</Text>
                <Text style={[styles.ratioPct, { color: colors.primary }]}>
                  {metrics.utilizationRate}% Billable
                </Text>
              </View>
              <View style={[styles.progressTrack, { backgroundColor: colors.surfaceSubtle, height: 10 }]}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${metrics.utilizationRate}%`, backgroundColor: colors.primary },
                  ]}
                />
              </View>
              <View style={styles.ratioLegend}>
                <Text style={[styles.legendItem, { color: colors.textMuted }]}>
                  Billable: <Text style={{ color: colors.text, fontWeight: '700' }}>{metrics.totalBillableHours.toFixed(1)}h</Text>
                </Text>
                <Text style={[styles.legendItem, { color: colors.textMuted }]}>
                  Internal: <Text style={{ color: colors.text, fontWeight: '700' }}>{Math.max(0, metrics.totalTeamHours - metrics.totalBillableHours).toFixed(1)}h</Text>
                </Text>
              </View>
            </View>

            {/* Preset 1: Project Profitability */}
            {reportPreset === 'profitability' && (
              <>
                <Text style={[styles.reportSectionTitle, { color: colors.text }]}>
                  Project Profitability & Margins
                </Text>
                {projectBreakdowns.map((proj) => (
                  <View
                    key={proj.id}
                    style={[
                      styles.reportCard,
                      { backgroundColor: colors.surface, borderColor: colors.borderSubtle },
                    ]}
                  >
                    <View style={styles.reportCardTop}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.reportCardTitle, { color: colors.text }]}>{proj.name}</Text>
                        <Text style={[styles.reportCardSub, { color: colors.textMuted }]}>
                          {proj.clientName} · Margin {proj.marginPercent}% ({formatCurrency(proj.profitAmount)})
                        </Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={[styles.reportCardAmount, { color: colors.primary }]}>
                          {formatCurrency(proj.revenue)}
                        </Text>
                        <Text style={[styles.reportCardHours, { color: colors.textMuted }]}>
                          {proj.hours.toFixed(1)} hrs · Cost {formatCurrency(proj.costAmount)}
                        </Text>
                      </View>
                    </View>
                    <View style={[styles.progressTrack, { backgroundColor: colors.surfaceSubtle, marginTop: 6 }]}>
                      <View
                        style={[
                          styles.progressFill,
                          { width: `${Math.min(100, proj.budgetPct)}%`, backgroundColor: colors.primary },
                        ]}
                      />
                    </View>
                    {Boolean(proj.alertMessage) && (
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 6,
                          marginTop: 8,
                          padding: 6,
                          backgroundColor: proj.riskLevel === 'critical' ? '#E11D4818' : '#F59E0B18',
                          borderColor: proj.riskLevel === 'critical' ? '#E11D4840' : '#F59E0B40',
                          borderWidth: 1,
                        }}
                      >
                        {proj.riskLevel === 'critical' ? (
                          <AlertOctagon size={13} color="#E11D48" />
                        ) : (
                          <AlertTriangle size={13} color="#D97706" />
                        )}
                        <Text
                          style={{
                            flex: 1,
                            fontSize: 10,
                            fontWeight: '600',
                            color: proj.riskLevel === 'critical' ? '#E11D48' : '#B45309',
                          }}
                        >
                          {proj.alertMessage}
                        </Text>
                      </View>
                    )}
                  </View>
                ))}
              </>
            )}

            {/* Preset 2: Client Revenue */}
            {reportPreset === 'clients' && (
              <>
                <Text style={[styles.reportSectionTitle, { color: colors.text }]}>
                  Client Accounts Revenue Summary
                </Text>
                {clientBreakdowns.map((cl, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.reportCard,
                      { backgroundColor: colors.surface, borderColor: colors.borderSubtle },
                    ]}
                  >
                    <View style={styles.reportCardTop}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.reportCardTitle, { color: colors.text }]}>{cl.clientName}</Text>
                        <Text style={[styles.reportCardSub, { color: colors.textMuted }]}>
                          {cl.projectCount} active project{cl.projectCount === 1 ? '' : 's'}
                        </Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={[styles.reportCardAmount, { color: colors.primary }]}>
                          {formatCurrency(cl.revenue)}
                        </Text>
                        <Text style={[styles.reportCardHours, { color: colors.textMuted }]}>
                          {cl.hours.toFixed(1)} hrs · Avg ${cl.hours > 0 ? Math.round(cl.revenue / cl.hours) : 0}/hr
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </>
            )}

            {/* Preset 3: Team Utilization */}
            {reportPreset === 'utilization' && (
              <>
                <Text style={[styles.reportSectionTitle, { color: colors.text }]}>
                  Team Utilization & Labor Margin
                </Text>
                {teamBreakdowns.map((tm) => (
                  <View
                    key={tm.id}
                    style={[
                      styles.reportCard,
                      { backgroundColor: colors.surface, borderColor: colors.borderSubtle },
                    ]}
                  >
                    <View style={styles.reportCardTop}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.reportCardTitle, { color: colors.text }]}>{tm.name}</Text>
                        <Text style={[styles.reportCardSub, { color: colors.textMuted }]}>
                          {tm.role} · Cap {tm.capacity}h
                        </Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={[styles.reportCardAmount, { color: colors.text }]}>
                          {formatCurrency(tm.revenue)}
                        </Text>
                        <Text style={[styles.reportCardHours, { color: colors.primary }]}>
                          {tm.utilizationPct}% utilized ({tm.hours.toFixed(1)}h)
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </>
            )}

            {/* Preset 4: Uninvoiced Ledger */}
            {reportPreset === 'uninvoiced' && (
              <>
                <Text style={[styles.reportSectionTitle, { color: colors.text }]}>
                  Uninvoiced Billable Labor & Expenses ({formatCurrency(metrics.uninvoicedAmount)})
                </Text>
                <View style={[styles.reportCard, { backgroundColor: colors.surface, borderColor: colors.primary }]}>
                  <View style={styles.reportCardTop}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.reportCardTitle, { color: colors.text }]}>Uninvoiced Billable Hours</Text>
                      <Text style={[styles.reportCardSub, { color: colors.textMuted }]}>
                        Net unbilled labor across active retainers
                      </Text>
                    </View>
                    <Text style={[styles.reportCardAmount, { color: colors.primary }]}>
                      {formatCurrency(Math.max(0, metrics.uninvoicedAmount - metrics.uninvoicedExpenseAmount))}
                    </Text>
                  </View>
                </View>

                {expenses
                  .filter((ex) => ex.isBillable && ex.status !== 'invoiced')
                  .map((ex) => (
                    <View
                      key={ex.id}
                      style={[
                        styles.reportCard,
                        { backgroundColor: colors.surface, borderColor: colors.borderSubtle },
                      ]}
                    >
                      <View style={styles.reportCardTop}>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.reportCardTitle, { color: colors.text }]}>{ex.description}</Text>
                          <Text style={[styles.reportCardSub, { color: colors.textMuted }]}>
                            {ex.clientName || 'General'} · {ex.date}
                          </Text>
                        </View>
                        <Text style={[styles.reportCardAmount, { color: colors.text }]}>
                          ${ex.amount.toFixed(2)}
                        </Text>
                      </View>
                    </View>
                  ))}
              </>
            )}

            {/* Preset 5: Detailed Time Entry Audit Log */}
            {reportPreset === 'audit_log' && (
              <>
                <Text style={[styles.reportSectionTitle, { color: colors.text }]}>
                  Detailed Time Entry Audit Log ({entries.length})
                </Text>
                {entries.length === 0 ? (
                  <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
                    <Text style={[styles.emptyDesc, { color: colors.textMuted }]}>
                      No live mobile entries logged yet.
                    </Text>
                  </View>
                ) : (
                  entries.map((e, i) => (
                    <View
                      key={e.id || i}
                      style={[
                        styles.reportCard,
                        { backgroundColor: colors.surface, borderColor: colors.borderSubtle },
                      ]}
                    >
                      <View style={styles.reportCardTop}>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.reportCardTitle, { color: colors.text }]}>
                            {e.projectName || 'Project'} — {e.taskName || 'Task'}
                          </Text>
                          <Text style={[styles.reportCardSub, { color: colors.textMuted }]}>
                            {e.date} · {e.clientName || 'General'}
                          </Text>
                          {Boolean(e.note) && (
                            <Text style={{ fontSize: 11, color: colors.textDim, marginTop: 3 }}>{e.note}</Text>
                          )}
                        </View>
                        <Text style={[styles.reportCardAmount, { color: colors.primary }]}>
                          {e.hours.toFixed(2)}h
                        </Text>
                      </View>
                    </View>
                  ))
                )}
              </>
            )}
          </View>
        )}

        {/* ========================================================================= */}
        {/* SUBTAB 4: TEAM ROSTER & INVOICES */}
        {/* ========================================================================= */}
        {activeSubTab === 'team' && (
          <View>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionHeading, { color: colors.text }]}>
                Team Roster & Rates ({teamMembers.length})
              </Text>
              <TouchableOpacity
                style={[styles.inlinePrimaryBtn, { backgroundColor: colors.primary }]}
                onPress={handleOpenAddMember}
              >
                <Plus color="#FFFFFF" size={14} />
                <Text style={styles.inlinePrimaryBtnText}>Invite Member</Text>
              </TouchableOpacity>
            </View>

            {teamMembers.map((member) => {
              const margin = member.defaultBillingRate - member.defaultCostRate;
              const marginPct = member.defaultBillingRate > 0
                ? Math.round((margin / member.defaultBillingRate) * 100)
                : 0;

              return (
                <TouchableOpacity
                  key={member.id}
                  activeOpacity={0.8}
                  onPress={() => handleOpenEditMember(member)}
                  style={[
                    styles.teamCard,
                    { backgroundColor: colors.surface, borderColor: colors.borderSubtle },
                  ]}
                >
                  <View style={styles.teamCardTop}>
                    <View style={styles.avatarWrap}>
                      <Text style={[styles.avatarText, { color: colors.primary }]}>
                        {member.firstName[0]}{member.lastName[0]}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.teamMemberName, { color: colors.text }]}>
                        {member.firstName} {member.lastName}
                      </Text>
                      <Text style={[styles.teamMemberEmail, { color: colors.textMuted }]}>
                        {member.email} · {member.role.toUpperCase()}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.rateEditButton, { borderColor: colors.borderSubtle }]}
                      onPress={() => handleOpenRateEdit(member)}
                      activeOpacity={0.7}
                    >
                      <Edit3 color={colors.primary} size={14} style={{ marginRight: 4 }} />
                      <Text style={[styles.rateEditText, { color: colors.primary }]}>Rates</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={[styles.teamRatesRow, { borderTopColor: colors.borderSubtle }]}>
                    <View style={styles.rateCol}>
                      <Text style={[styles.rateColLabel, { color: colors.textDim }]}>BILLING RATE</Text>
                      <Text style={[styles.rateColVal, { color: colors.text }]}>${member.defaultBillingRate}/hr</Text>
                    </View>
                    <View style={styles.rateCol}>
                      <Text style={[styles.rateColLabel, { color: colors.textDim }]}>COST RATE</Text>
                      <Text style={[styles.rateColVal, { color: colors.textMuted }]}>${member.defaultCostRate}/hr</Text>
                    </View>
                    <View style={styles.rateCol}>
                      <Text style={[styles.rateColLabel, { color: colors.primary }]}>GROSS MARGIN</Text>
                      <Text style={[styles.rateColVal, { color: colors.primary }]}>{marginPct}%</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}

            {/* Invoicing & Receivables Overview */}
            <View style={[styles.sectionHeaderRow, { marginTop: Spacing.xl }]}>
              <Text style={[styles.sectionHeading, { color: colors.text }]}>
                Invoicing Pipeline ({invoices.length})
              </Text>
              <TouchableOpacity
                style={[styles.inlinePrimaryBtn, { backgroundColor: colors.primary }]}
                onPress={handleOpenCreateInvoice}
              >
                <Plus color="#FFFFFF" size={14} />
                <Text style={styles.inlinePrimaryBtnText}>New Invoice</Text>
              </TouchableOpacity>
            </View>

            {invoices.map((inv) => {
              const statusColors = {
                paid: { bg: '#10B98120', text: '#059669', border: '#10B98150' },
                sent: { bg: `${colors.primary}15`, text: colors.primary, border: `${colors.primary}50` },
                draft: { bg: colors.surfaceSubtle, text: colors.textMuted, border: colors.borderSubtle },
                overdue: { bg: '#E11D4820', text: '#E11D48', border: '#E11D4850' },
              };
              const sc = statusColors[inv.status] || statusColors.draft;

              return (
                <View
                  key={inv.id}
                  style={[
                    styles.invoiceCard,
                    { backgroundColor: colors.surface, borderColor: colors.borderSubtle },
                  ]}
                >
                  <View style={styles.invoiceTop}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.invoiceNumber, { color: colors.text }]}>{inv.invoiceNumber}</Text>
                      <Text style={[styles.invoiceClient, { color: colors.textMuted }]}>{inv.clientName}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={[styles.invoiceAmount, { color: colors.text }]}>
                        {formatCurrency(inv.amount)}
                      </Text>
                      <View style={[styles.statusBadge, { backgroundColor: sc.bg, borderColor: sc.border }]}>
                        <Text style={[styles.statusBadgeText, { color: sc.text }]}>
                          {inv.status.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View style={[styles.invoiceMeta, { borderTopColor: colors.borderSubtle }]}>
                    <Text style={[styles.invoiceMetaText, { color: colors.textDim }]}>
                      Due: {inv.dueDate} • {inv.projectName}
                      {inv.totalHours ? ` (${inv.totalHours.toFixed(1)}h)` : ''}
                    </Text>
                  </View>
                  <View style={styles.invoiceActionsRow}>
                    <TouchableOpacity
                      style={[styles.invActionBtn, { borderColor: colors.borderSubtle, backgroundColor: colors.surfaceSubtle }]}
                      onPress={() => setAuditInvoice(inv)}
                    >
                      <ShieldCheck color={colors.primary} size={13} />
                      <Text style={[styles.invActionText, { color: colors.text }]}>Client Proof</Text>
                    </TouchableOpacity>

                    {inv.status === 'draft' && (
                      <TouchableOpacity
                        style={[styles.invActionBtn, { borderColor: colors.primary, backgroundColor: colors.primaryMuted }]}
                        onPress={() => updateInvoiceStatus(inv.id, 'sent')}
                      >
                        <Send color={colors.primary} size={13} />
                        <Text style={[styles.invActionText, { color: colors.primary }]}>Send Invoice</Text>
                      </TouchableOpacity>
                    )}

                    {(inv.status === 'sent' || inv.status === 'overdue') && (
                      <TouchableOpacity
                        style={[styles.invActionBtn, { borderColor: '#10B981', backgroundColor: '#10B98118' }]}
                        onPress={() => updateInvoiceStatus(inv.id, 'paid')}
                      >
                        <Check color="#059669" size={13} />
                        <Text style={[styles.invActionText, { color: '#059669' }]}>Mark Paid</Text>
                      </TouchableOpacity>
                    )}

                    {inv.status === 'draft' && (
                      <TouchableOpacity
                        onPress={() =>
                          Alert.alert('Delete Draft Invoice', `Delete ${inv.invoiceNumber}?`, [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'Delete', style: 'destructive', onPress: () => deleteInvoice(inv.id) },
                          ])
                        }
                        style={{ padding: 6 }}
                      >
                        <Trash2 color={colors.textDim} size={14} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Reject Timesheet Modal */}
      <Modal visible={rejectModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.borderSubtle }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Return Timesheet with Feedback</Text>
              <TouchableOpacity onPress={() => setRejectModalVisible(false)}>
                <X color={colors.textDim} size={20} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={[styles.modalPrompt, { color: colors.textMuted }]}>
                Provide feedback to {selectedSubForReject?.userName} regarding their {selectedSubForReject?.totalHours.toFixed(1)} submitted hours.
              </Text>

              <TextInput
                style={[
                  styles.rejectInput,
                  { backgroundColor: colors.bg, borderColor: colors.borderSubtle, color: colors.text },
                ]}
                placeholder="e.g. Please add detailed memo notes to your Friday Revit CAD drafting hours."
                placeholderTextColor={colors.textDim}
                value={rejectNote}
                onChangeText={setRejectNote}
                multiline
                numberOfLines={3}
                autoFocus
              />

              <View style={styles.quickChipsRow}>
                {['Add task descriptions', 'Hours exceed budget', 'Missing Friday logs'].map((chip) => (
                  <TouchableOpacity
                    key={chip}
                    style={[styles.quickChip, { backgroundColor: colors.surfaceSubtle, borderColor: colors.borderSubtle }]}
                    onPress={() => setRejectNote(chip)}
                  >
                    <Text style={[styles.quickChipText, { color: colors.textMuted }]}>{chip}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={[styles.modalFooter, { borderTopColor: colors.borderSubtle }]}>
              <TouchableOpacity
                style={[styles.cancelBtn, { borderColor: colors.borderSubtle }]}
                onPress={() => setRejectModalVisible(false)}
              >
                <Text style={[styles.cancelBtnText, { color: colors.textMuted }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: '#E11D48' }]}
                onPress={handleConfirmReject}
              >
                <Text style={styles.saveBtnText}>Return Timesheet</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Edit Rates Modal */}
      <Modal visible={rateModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.borderSubtle }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Edit Rates: {selectedMemberForRate?.firstName} {selectedMemberForRate?.lastName}
              </Text>
              <TouchableOpacity onPress={() => setRateModalVisible(false)}>
                <X color={colors.textDim} size={20} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={[styles.inputLabel, { color: colors.textDim }]}>DEFAULT CLIENT BILLING RATE ($/HR)</Text>
              <TextInput
                style={[
                  styles.rateInput,
                  { backgroundColor: colors.bg, borderColor: colors.borderSubtle, color: colors.text },
                ]}
                keyboardType="decimal-pad"
                value={editBillingRate}
                onChangeText={setEditBillingRate}
                placeholder="165"
                placeholderTextColor={colors.textDim}
              />

              <Text style={[styles.inputLabel, { color: colors.textDim }]}>INTERNAL COST RATE ($/HR)</Text>
              <TextInput
                style={[
                  styles.rateInput,
                  { backgroundColor: colors.bg, borderColor: colors.borderSubtle, color: colors.text },
                ]}
                keyboardType="decimal-pad"
                value={editCostRate}
                onChangeText={setEditCostRate}
                placeholder="65"
                placeholderTextColor={colors.textDim}
              />
            </View>

            <View style={[styles.modalFooter, { borderTopColor: colors.borderSubtle }]}>
              <TouchableOpacity
                style={[styles.cancelBtn, { borderColor: colors.borderSubtle }]}
                onPress={() => setRateModalVisible(false)}
              >
                <Text style={[styles.cancelBtnText, { color: colors.textMuted }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: colors.primary }]}
                onPress={handleSaveRates}
              >
                <Text style={styles.saveBtnText}>Save Rates</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Invite / Edit Team Member Modal */}
      <Modal visible={memberModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.borderSubtle }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {editingMember ? `Edit ${editingMember.firstName}` : 'Invite Team Member'}
              </Text>
              <TouchableOpacity onPress={() => setMemberModalVisible(false)}>
                <X color={colors.textDim} size={20} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
              <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.inputLabel, { color: colors.textDim }]}>FIRST NAME</Text>
                  <TextInput
                    style={[styles.rateInput, { backgroundColor: colors.bg, borderColor: colors.borderSubtle, color: colors.text }]}
                    value={mFirstName}
                    onChangeText={setMFirstName}
                    placeholder="Alex"
                    placeholderTextColor={colors.textDim}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.inputLabel, { color: colors.textDim }]}>LAST NAME</Text>
                  <TextInput
                    style={[styles.rateInput, { backgroundColor: colors.bg, borderColor: colors.borderSubtle, color: colors.text }]}
                    value={mLastName}
                    onChangeText={setMLastName}
                    placeholder="Rivera"
                    placeholderTextColor={colors.textDim}
                  />
                </View>
              </View>

              <Text style={[styles.inputLabel, { color: colors.textDim }]}>WORK EMAIL</Text>
              <TextInput
                style={[styles.rateInput, { backgroundColor: colors.bg, borderColor: colors.borderSubtle, color: colors.text }]}
                value={mEmail}
                onChangeText={setMEmail}
                placeholder="alex@studio.com"
                placeholderTextColor={colors.textDim}
                autoCapitalize="none"
                keyboardType="email-address"
              />

              <Text style={[styles.inputLabel, { color: colors.textDim }]}>WORKSPACE ROLE</Text>
              <View style={{ flexDirection: 'row', gap: 6, marginBottom: Spacing.sm }}>
                {(['employee', 'manager', 'admin'] as const).map((r) => {
                  const active = mRole === r;
                  return (
                    <TouchableOpacity
                      key={r}
                      style={[
                        styles.presetPill,
                        {
                          flex: 1,
                          alignItems: 'center',
                          backgroundColor: active ? colors.primaryMuted : colors.bg,
                          borderColor: active ? colors.primary : colors.borderSubtle,
                        },
                      ]}
                      onPress={() => setMRole(r)}
                    >
                      <Text style={{ fontSize: 12, fontWeight: '700', color: active ? colors.primary : colors.textMuted, textTransform: 'capitalize' }}>
                        {r}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.inputLabel, { color: colors.textDim }]}>WEEKLY HRS</Text>
                  <TextInput
                    style={[styles.rateInput, { backgroundColor: colors.bg, borderColor: colors.borderSubtle, color: colors.text }]}
                    value={mCapacity}
                    onChangeText={setMCapacity}
                    keyboardType="numeric"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.inputLabel, { color: colors.textDim }]}>BILL $/HR</Text>
                  <TextInput
                    style={[styles.rateInput, { backgroundColor: colors.bg, borderColor: colors.borderSubtle, color: colors.text }]}
                    value={mBillRate}
                    onChangeText={setMBillRate}
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.inputLabel, { color: colors.textDim }]}>COST $/HR</Text>
                  <TextInput
                    style={[styles.rateInput, { backgroundColor: colors.bg, borderColor: colors.borderSubtle, color: colors.text }]}
                    value={mCostRate}
                    onChangeText={setMCostRate}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>

              {editingMember && editingMember.id !== 'guest_mobile_user' && (
                <TouchableOpacity
                  style={{
                    marginTop: Spacing.sm,
                    marginBottom: Spacing.md,
                    paddingVertical: 10,
                    borderRadius: Radius.xs,
                    borderWidth: 1,
                    borderColor: colors.danger,
                    alignItems: 'center',
                  }}
                  onPress={() => {
                    Alert.alert('Remove Team Member', `Remove ${editingMember.firstName} ${editingMember.lastName}?`, [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Remove',
                        style: 'destructive',
                        onPress: async () => {
                          await removeTeamMember(editingMember.id);
                          setMemberModalVisible(false);
                        },
                      },
                    ]);
                  }}
                >
                  <Text style={{ color: colors.danger, fontSize: 13, fontWeight: '700' }}>Remove Member</Text>
                </TouchableOpacity>
              )}
            </ScrollView>

            <View style={[styles.modalFooter, { borderTopColor: colors.borderSubtle }]}>
              <TouchableOpacity
                style={[styles.cancelBtn, { borderColor: colors.borderSubtle }]}
                onPress={() => setMemberModalVisible(false)}
              >
                <Text style={[styles.cancelBtnText, { color: colors.textMuted }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: colors.primary }]}
                onPress={handleSaveMember}
              >
                <Text style={styles.saveBtnText}>{editingMember ? 'Save Member' : 'Send Invite'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Create Invoice Modal */}
      <Modal visible={invoiceModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.borderSubtle }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Draft Client Invoice</Text>
              <TouchableOpacity onPress={() => setInvoiceModalVisible(false)}>
                <X color={colors.textDim} size={20} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
              <Text style={[styles.inputLabel, { color: colors.textDim }]}>SELECT PROJECT & CLIENT</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginBottom: 8 }}>
                {projects.map((p) => {
                  const active = invProjectId === p.id;
                  return (
                    <TouchableOpacity
                      key={p.id}
                      style={[
                        styles.presetPill,
                        {
                          backgroundColor: active ? colors.primaryMuted : colors.bg,
                          borderColor: active ? colors.primary : colors.borderSubtle,
                        },
                      ]}
                      onPress={() => setInvProjectId(p.id)}
                    >
                      <Text style={{ fontSize: 12, fontWeight: '700', color: active ? colors.primary : colors.textMuted }}>
                        {p.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <Text style={[styles.inputLabel, { color: colors.textDim }]}>BILLING MODE</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                {([
                  { id: 'hourly', label: 'Hourly Timesheet' },
                  { id: 'progress', label: '25% Progress Milestone' },
                  { id: 'expense', label: 'Hours + Expenses' },
                  { id: 'flat', label: 'Custom Flat Fee' },
                ] as const).map((bm) => {
                  const active = invBillingMode === bm.id;
                  return (
                    <TouchableOpacity
                      key={bm.id}
                      style={[
                        styles.presetPill,
                        {
                          backgroundColor: active ? colors.primaryMuted : colors.bg,
                          borderColor: active ? colors.primary : colors.borderSubtle,
                        },
                      ]}
                      onPress={() => setInvBillingMode(bm.id)}
                    >
                      <Text style={{ fontSize: 11, fontWeight: '700', color: active ? colors.primary : colors.textMuted }}>
                        {bm.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {invBillingMode === 'flat' && (
                <>
                  <Text style={[styles.inputLabel, { color: colors.textDim }]}>CUSTOM INVOICE AMOUNT ($)</Text>
                  <TextInput
                    style={[styles.rateInput, { backgroundColor: colors.bg, borderColor: colors.borderSubtle, color: colors.text }]}
                    value={invCustomAmount}
                    onChangeText={setInvCustomAmount}
                    keyboardType="decimal-pad"
                  />
                </>
              )}

              <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.inputLabel, { color: colors.textDim }]}>DUE DATE (YYYY-MM-DD)</Text>
                  <TextInput
                    style={[styles.rateInput, { backgroundColor: colors.bg, borderColor: colors.borderSubtle, color: colors.text }]}
                    value={invDueDate}
                    onChangeText={setInvDueDate}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.inputLabel, { color: colors.textDim }]}>TAX RATE (%)</Text>
                  <TextInput
                    style={[styles.rateInput, { backgroundColor: colors.bg, borderColor: colors.borderSubtle, color: colors.text }]}
                    value={invTaxRate}
                    onChangeText={setInvTaxRate}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>

              <Text style={[styles.inputLabel, { color: colors.textDim }]}>INVOICE NOTES</Text>
              <TextInput
                style={[styles.rateInput, { backgroundColor: colors.bg, borderColor: colors.borderSubtle, color: colors.text }]}
                value={invNotes}
                onChangeText={setInvNotes}
              />

              <View style={[styles.reportCard, { backgroundColor: colors.surfaceSubtle, borderColor: colors.primary, marginBottom: Spacing.lg }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textMuted }}>
                    Preview Total ({computedInvoiceDraft.hours.toFixed(1)}h)
                  </Text>
                  <Text style={{ fontSize: 20, fontWeight: '800', color: colors.primary }}>
                    ${computedInvoiceDraft.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </Text>
                </View>
              </View>
            </ScrollView>

            <View style={[styles.modalFooter, { borderTopColor: colors.borderSubtle }]}>
              <TouchableOpacity
                style={[styles.cancelBtn, { borderColor: colors.borderSubtle }]}
                onPress={() => setInvoiceModalVisible(false)}
              >
                <Text style={[styles.cancelBtnText, { color: colors.textMuted }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: colors.primary }]}
                onPress={handleSaveNewInvoice}
              >
                <Text style={styles.saveBtnText}>Create Invoice</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Client Audit Proof Modal */}
      <Modal visible={auditInvoice !== null} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.borderSubtle }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <ShieldCheck color={colors.primary} size={18} />
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  Client Audit Proof · {auditInvoice?.invoiceNumber}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setAuditInvoice(null)}>
                <X color={colors.textDim} size={20} />
              </TouchableOpacity>
            </View>

            {auditInvoice && (
              <ScrollView style={styles.modalBody}>
                <View style={[styles.reportCard, { backgroundColor: colors.surfaceSubtle, borderColor: colors.borderSubtle }]}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: colors.primary, letterSpacing: 0.8 }}>
                    VERIFIED BILLING SUMMARY
                  </Text>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: colors.text, marginTop: 4 }}>
                    {auditInvoice.clientName}
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
                    {auditInvoice.projectName}
                  </Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
                    <View>
                      <Text style={{ fontSize: 10, color: colors.textDim }}>VERIFIED HOURS</Text>
                      <Text style={{ fontSize: 15, fontWeight: '800', color: colors.text }}>
                        {(auditInvoice.totalHours || 40).toFixed(1)}h
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ fontSize: 10, color: colors.textDim }}>INVOICE AMOUNT</Text>
                      <Text style={{ fontSize: 15, fontWeight: '800', color: colors.primary }}>
                        {formatCurrency(auditInvoice.amount)}
                      </Text>
                    </View>
                  </View>
                </View>

                <Text style={[styles.inputLabel, { color: colors.textDim }]}>AUDIT VERIFICATION DETAILS</Text>
                <Text style={{ fontSize: 12, color: colors.textMuted, lineHeight: 18, marginBottom: 8 }}>
                  Issue Date: {auditInvoice.issueDate} | Due Date: {auditInvoice.dueDate}{'\n'}
                  Status: {auditInvoice.status.toUpperCase()}{'\n'}
                  Verification Hash: {auditInvoice.auditHash || `VT-PROOF-${auditInvoice.invoiceNumber}`}
                </Text>
                {Boolean(auditInvoice.notes) && (
                  <Text style={{ fontSize: 12, color: colors.text, marginBottom: 12 }}>
                    Notes: {auditInvoice.notes}
                  </Text>
                )}
              </ScrollView>
            )}

            <View style={[styles.modalFooter, { borderTopColor: colors.borderSubtle }]}>
              <TouchableOpacity
                style={[styles.cancelBtn, { borderColor: colors.borderSubtle }]}
                onPress={() => setAuditInvoice(null)}
              >
                <Text style={[styles.cancelBtnText, { color: colors.textMuted }]}>Close</Text>
              </TouchableOpacity>
              {auditInvoice && (
                <TouchableOpacity
                  style={[styles.saveBtn, { backgroundColor: colors.primary, flexDirection: 'row', justifyContent: 'center', gap: 6 }]}
                  onPress={() => handleShareClientProof(auditInvoice)}
                >
                  <Share2 color="#FFFFFF" size={14} />
                  <Text style={styles.saveBtnText}>Share Client Proof</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl * 2,
  },
  subTabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingHorizontal: Spacing.xs,
  },
  subTabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 5,
  },
  subTabTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  tabBadgeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabBadge: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 8,
    marginLeft: 3,
  },
  tabBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: Radius.xs,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  alertBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  alertBannerTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  alertBannerSub: {
    fontSize: 11,
    marginTop: 2,
  },
  gridRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  metricCard: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: Radius.xs,
    borderWidth: 1,
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  metricSub: {
    fontSize: 11,
    fontWeight: '500',
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 6,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  capacityCard: {
    padding: Spacing.md,
    borderRadius: Radius.xs,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  capacityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  capacityTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  capacitySub: {
    fontSize: 11,
    marginTop: 1,
  },
  capacityPct: {
    fontSize: 18,
    fontWeight: '800',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    marginTop: Spacing.sm,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '700',
  },
  projectSummaryCard: {
    padding: Spacing.md,
    borderRadius: Radius.xs,
    borderWidth: 1,
    marginBottom: Spacing.xs,
  },
  projectSummaryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  projectSummaryName: {
    fontSize: 13,
    fontWeight: '700',
  },
  projectSummaryClient: {
    fontSize: 11,
    marginTop: 2,
  },
  projectSummaryHours: {
    fontSize: 13,
    fontWeight: '700',
  },
  budgetMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  budgetMetaText: {
    fontSize: 11,
    fontWeight: '500',
  },
  emptyCard: {
    padding: Spacing.xl,
    borderRadius: Radius.xs,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptyDesc: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 17,
  },
  submissionCard: {
    padding: Spacing.md,
    borderRadius: Radius.xs,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  subCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  avatarWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(244, 63, 94, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 13,
    fontWeight: '800',
  },
  subUserName: {
    fontSize: 14,
    fontWeight: '700',
  },
  subMeta: {
    fontSize: 11,
    marginTop: 2,
  },
  hoursBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.xs,
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
  },
  hoursBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  expandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    marginTop: 6,
  },
  expandText: {
    fontSize: 11,
    fontWeight: '600',
  },
  breakdownDrawer: {
    borderRadius: Radius.xs,
    borderWidth: 1,
    paddingHorizontal: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 7,
  },
  breakdownProj: {
    fontSize: 12,
    fontWeight: '700',
  },
  breakdownTask: {
    fontSize: 11,
  },
  breakdownHours: {
    fontSize: 12,
    fontWeight: '700',
  },
  subActionRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  rejectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: Radius.xs,
    borderWidth: 1,
  },
  rejectBtnText: {
    color: '#E11D48',
    fontSize: 12,
    fontWeight: '700',
  },
  approveBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: Radius.xs,
  },
  approveBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  pastSubCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radius.xs,
    borderWidth: 1,
    marginBottom: Spacing.xs,
  },
  pastSubLeft: {
    flex: 1,
  },
  pastSubName: {
    fontSize: 13,
    fontWeight: '700',
  },
  pastSubDate: {
    fontSize: 11,
    marginTop: 2,
  },
  pastSubNote: {
    fontSize: 11,
    marginTop: 3,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.xs,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  timeframeRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: Spacing.md,
  },
  timeframeChip: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: Radius.xs,
    borderWidth: 1,
    alignItems: 'center',
  },
  timeframeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  ratioBanner: {
    padding: Spacing.md,
    borderRadius: Radius.xs,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  ratioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  ratioTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  ratioPct: {
    fontSize: 13,
    fontWeight: '800',
  },
  ratioLegend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  legendItem: {
    fontSize: 11,
  },
  reportSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginBottom: Spacing.xs,
  },
  reportCard: {
    padding: Spacing.md,
    borderRadius: Radius.xs,
    borderWidth: 1,
    marginBottom: Spacing.xs,
  },
  reportCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reportCardTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  reportCardSub: {
    fontSize: 11,
    marginTop: 2,
  },
  reportCardAmount: {
    fontSize: 13,
    fontWeight: '800',
  },
  reportCardHours: {
    fontSize: 11,
    marginTop: 2,
  },
  teamCard: {
    padding: Spacing.md,
    borderRadius: Radius.xs,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  teamCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: 10,
  },
  teamMemberName: {
    fontSize: 14,
    fontWeight: '700',
  },
  teamMemberEmail: {
    fontSize: 11,
    marginTop: 1,
  },
  rateEditButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.xs,
    borderWidth: 1,
  },
  rateEditText: {
    fontSize: 11,
    fontWeight: '700',
  },
  teamRatesRow: {
    flexDirection: 'row',
    paddingTop: 8,
    borderTopWidth: 1,
  },
  rateCol: {
    flex: 1,
  },
  rateColLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  rateColVal: {
    fontSize: 13,
    fontWeight: '700',
  },
  invoiceCard: {
    padding: Spacing.md,
    borderRadius: Radius.xs,
    borderWidth: 1,
    marginBottom: Spacing.xs,
  },
  invoiceTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  invoiceNumber: {
    fontSize: 13,
    fontWeight: '800',
  },
  invoiceClient: {
    fontSize: 11,
    marginTop: 2,
  },
  invoiceAmount: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 3,
  },
  invoiceMeta: {
    paddingTop: 6,
    marginTop: 6,
    borderTopWidth: 1,
  },
  invoiceMetaText: {
    fontSize: 10,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: Radius.md,
    borderTopRightRadius: Radius.md,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  modalBody: {
    padding: Spacing.md,
  },
  modalPrompt: {
    fontSize: 13,
    marginBottom: Spacing.sm,
    lineHeight: 18,
  },
  rejectInput: {
    borderWidth: 1,
    borderRadius: Radius.xs,
    padding: Spacing.sm,
    fontSize: 13,
    marginBottom: Spacing.sm,
  },
  quickChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  quickChip: {
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: Radius.xs,
    borderWidth: 1,
  },
  quickChipText: {
    fontSize: 11,
    fontWeight: '500',
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 6,
    marginTop: 8,
  },
  rateInput: {
    borderWidth: 1,
    borderRadius: Radius.xs,
    padding: Spacing.sm,
    fontSize: 14,
    marginBottom: Spacing.sm,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderTopWidth: 1,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: Radius.xs,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  saveBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: Radius.xs,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  exportCsvBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.xs,
    borderWidth: 1,
  },
  exportCsvText: {
    fontSize: 11,
    fontWeight: '700',
  },
  presetPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  presetPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  inlinePrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.xs,
  },
  inlinePrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  invoiceActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  invActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: Radius.xs,
    borderWidth: 1,
  },
  invActionText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
