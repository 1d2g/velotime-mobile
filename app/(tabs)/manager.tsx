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
} from 'lucide-react-native';
import { useManager, ReportTimeframe } from '@/src/context/ManagerContext';
import { useAuth } from '@/src/context/AuthContext';
import { useTheme } from '@/src/context/ThemeContext';
import { Spacing, Radius } from '@/src/constants/theme';
import { TimesheetSubmission, TeamMember } from '@/src/services/api';

type ManagerSubTab = 'dashboard' | 'approvals' | 'reports' | 'team';

export default function ManagerScreen() {
  const { colors, isDark } = useTheme();
  const { previewRole, setPreviewRole } = useAuth();
  const {
    submissions,
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
    metrics,
    projectBreakdowns,
    teamBreakdowns,
    clientBreakdowns,
  } = useManager();

  const [activeSubTab, setActiveSubTab] = useState<ManagerSubTab>('dashboard');
  const [expandedSubmissionId, setExpandedSubmissionId] = useState<string | null>(null);

  // Reject Modal State
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [selectedSubForReject, setSelectedSubForReject] = useState<TimesheetSubmission | null>(null);
  const [rejectNote, setRejectNote] = useState('');

  // Rate Edit Modal State
  const [rateModalVisible, setRateModalVisible] = useState(false);
  const [selectedMemberForRate, setSelectedMemberForRate] = useState<TeamMember | null>(null);
  const [editBillingRate, setEditBillingRate] = useState('');
  const [editCostRate, setEditCostRate] = useState('');

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
                  Internal: <Text style={{ color: colors.text, fontWeight: '700' }}>{(metrics.totalTeamHours - metrics.totalBillableHours).toFixed(1)}h</Text>
                </Text>
              </View>
            </View>

            {/* Project Financial Breakdown */}
            <Text style={[styles.reportSectionTitle, { color: colors.text }]}>Hours & Revenue by Project</Text>
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
                    <Text style={[styles.reportCardSub, { color: colors.textMuted }]}>{proj.clientName}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.reportCardAmount, { color: colors.primary }]}>
                      {formatCurrency(proj.revenue)}
                    </Text>
                    <Text style={[styles.reportCardHours, { color: colors.textMuted }]}>
                      {proj.hours.toFixed(1)} hrs
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

            {/* Team Utilization Breakdown */}
            <Text style={[styles.reportSectionTitle, { color: colors.text, marginTop: Spacing.xl }]}>
              Team Member Utilization & Revenue
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
                    <Text style={[styles.reportCardSub, { color: colors.textMuted }]}>{tm.role}</Text>
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

            {/* Client Account Breakdown */}
            <Text style={[styles.reportSectionTitle, { color: colors.text, marginTop: Spacing.xl }]}>
              Client Accounts Summary
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
                      {cl.hours.toFixed(1)} hrs billed
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ========================================================================= */}
        {/* SUBTAB 4: TEAM ROSTER & INVOICES */}
        {/* ========================================================================= */}
        {activeSubTab === 'team' && (
          <View>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionHeading, { color: colors.text }]}>
                Team Roster & Billable Rates ({teamMembers.length})
              </Text>
            </View>

            {teamMembers.map((member) => {
              const margin = member.defaultBillingRate - member.defaultCostRate;
              const marginPct = member.defaultBillingRate > 0
                ? Math.round((margin / member.defaultBillingRate) * 100)
                : 0;

              return (
                <View
                  key={member.id}
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
                        {member.email}
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
                </View>
              );
            })}

            {/* Invoicing & Receivables Overview */}
            <View style={[styles.sectionHeaderRow, { marginTop: Spacing.xl }]}>
              <Text style={[styles.sectionHeading, { color: colors.text }]}>
                Invoicing Pipeline ({invoices.length})
              </Text>
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
                    </Text>
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
});
