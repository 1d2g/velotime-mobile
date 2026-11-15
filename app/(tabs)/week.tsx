import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import {
  Calendar,
  CheckCheck,
  Clock,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Check,
  AlertTriangle,
  Lock,
  Edit3,
  Users,
  LogIn,
} from 'lucide-react-native';
import { useAuth } from '@/src/context/AuthContext';
import { useTimesheet } from '@/src/context/TimesheetContext';
import { useManager } from '@/src/context/ManagerContext';
import { useTheme } from '@/src/context/ThemeContext';
import { Spacing, Radius } from '@/src/constants/theme';
import { ManualEntryModal } from '@/src/components/ManualEntryModal';
import { Entry, getLocalDateString } from '@/src/services/api';

export default function WeekScreen() {
  const { colors } = useTheme();
  const { user, isManager, isDemoMode, setAuthModalOpen } = useAuth();
  const {
    projects,
    entries,
    weekOffset,
    weekDates,
    weekLabel,
    weekTotalHours,
    submissionStatus,
    submissionRejectNote,
    logManualEntry,
    updateEntry,
    deleteEntry,
    selectedEmployeeName,
    setSelectedEmployeeName,
    submitWeekTimesheet,
    goToPrevWeek,
    goToNextWeek,
    goToCurrentWeek,
  } = useTimesheet();
  const { teamMembers, submissions, approveSubmission } = useManager();

  const [viewMode, setViewMode] = useState<'week' | 'day' | 'month'>('week');
  const [selectedDayId, setSelectedDayId] = useState<string>('all');
  const [manualModalVisible, setManualModalVisible] = useState(false);
  const [targetDateForEntry, setTargetDateForEntry] = useState<string>(getLocalDateString());
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);

  const isViewingTeamMember = isManager && selectedEmployeeName !== 'My Timesheet';
  const viewedMember = useMemo(() => {
    if (!isViewingTeamMember) return null;
    return teamMembers.find((m) => `${m.firstName} ${m.lastName}` === selectedEmployeeName) || null;
  }, [isViewingTeamMember, teamMembers, selectedEmployeeName]);

  const viewedSubmission = useMemo(() => {
    if (!viewedMember) return null;
    return (
      submissions.find((s) => s.userId === viewedMember.id || s.userName === selectedEmployeeName) ||
      null
    );
  }, [viewedMember, submissions, selectedEmployeeName]);

  const activeMonthPrefix = useMemo(() => {
    const refDate = weekDates[0]?.id || getLocalDateString();
    return refDate.slice(0, 7); // YYYY-MM
  }, [weekDates]);

  const activeMonthLabel = useMemo(() => {
    const [y, m] = activeMonthPrefix.split('-').map(Number);
    if (!y || !m) return 'This Month';
    return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [activeMonthPrefix]);

  const activeDayDate = useMemo(() => {
    if (selectedDayId !== 'all') {
      return selectedDayId;
    }
    const todayStr = getLocalDateString();
    const found = weekDates.find((d) => d.id === todayStr);
    return found ? found.id : weekDates[0]?.id || todayStr;
  }, [selectedDayId, weekDates]);

  const displayedEntries = useMemo(() => {
    if (viewMode === 'month') {
      return entries.filter((e) => e.date?.startsWith(activeMonthPrefix));
    }
    if (viewMode === 'day') {
      return entries.filter((e) => e.date === activeDayDate);
    }
    if (selectedDayId === 'all') {
      const weekDateSet = new Set(weekDates.map((d) => d.id));
      return entries.filter((e) => weekDateSet.has(e.date));
    }
    return entries.filter((e) => e.date === selectedDayId);
  }, [entries, viewMode, activeDayDate, selectedDayId, weekDates, activeMonthPrefix]);

  const monthTotalHours = useMemo(() => {
    return entries
      .filter((e) => e.date?.startsWith(activeMonthPrefix))
      .reduce((sum, e) => sum + e.hours, 0);
  }, [entries, activeMonthPrefix]);

  const monthProjectGroups = useMemo(() => {
    const map: Record<string, { projectName: string; clientName: string; hours: number; count: number }> = {};
    for (const e of entries) {
      if (!e.date?.startsWith(activeMonthPrefix)) continue;
      const key = e.projectName || 'General Project';
      if (!map[key]) {
        map[key] = { projectName: key, clientName: e.clientName || 'General', hours: 0, count: 0 };
      }
      map[key].hours += e.hours;
      map[key].count += 1;
    }
    return Object.values(map).sort((a, b) => b.hours - a.hours);
  }, [entries, activeMonthPrefix]);

  const dailyTotals = useMemo(() => {
    const map: Record<string, number> = {};
    for (const d of weekDates) {
      map[d.id] = 0;
    }
    for (const e of entries) {
      if (map[e.date] !== undefined) {
        map[e.date] += e.hours;
      }
    }
    return map;
  }, [entries, weekDates]);

  const dayTotalHours = useMemo(() => {
    return dailyTotals[activeDayDate] || 0;
  }, [dailyTotals, activeDayDate]);

  const { billablePercentage } = useMemo(() => {
    const billable = displayedEntries
      .filter((e) => e.isBillable !== false)
      .reduce((sum, e) => sum + e.hours, 0);
    const total = displayedEntries.reduce((sum, e) => sum + e.hours, 0);
    const pct = total > 0 ? Math.round((billable / total) * 100) : 100;
    return { billablePercentage: pct };
  }, [displayedEntries]);

  const handleSubmitWeek = async () => {
    Alert.alert(
      'Submit Timesheet',
      `Submit your ${weekTotalHours.toFixed(2)} hours for ${weekLabel} for manager/payroll review?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit Timesheet',
          onPress: async () => {
            await submitWeekTimesheet();
            Alert.alert(
              'Timesheet Submitted',
              'Your timesheet has been submitted successfully and locked for approval.'
            );
          },
        },
      ]
    );
  };

  const isApprovedLocked = submissionStatus === 'approved';

  const handleOpenAddForDay = (dateStr: string) => {
    if (isApprovedLocked) {
      Alert.alert(
        'Timesheet Approved & Locked',
        'This timesheet has already been approved by your manager and locked from further edits. Contact your manager if an adjustment is required.'
      );
      return;
    }
    setEditingEntry(null);
    setTargetDateForEntry(dateStr);
    setManualModalVisible(true);
  };

  const handleEditEntry = (entry: Entry) => {
    if (isApprovedLocked) {
      Alert.alert(
        'Timesheet Approved & Locked',
        'This timesheet has already been approved and locked from edits.'
      );
      return;
    }
    setEditingEntry(entry);
    setManualModalVisible(true);
  };

  const handleDeleteEntry = (entryId: string, projectName: string, hours: number) => {
    if (isApprovedLocked) {
      Alert.alert(
        'Timesheet Approved & Locked',
        'This timesheet is locked from deletion. Contact your manager if changes are needed.'
      );
      return;
    }
    Alert.alert(
      'Delete Time Entry',
      `Delete ${hours} hrs logged for "${projectName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteEntry(entryId) },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Top Workspace & Sign-In Bar */}
        <View style={styles.topWorkspaceRow}>
          <TouchableOpacity
            style={[styles.workspacePill, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}
            onPress={() => setAuthModalOpen(true)}
            activeOpacity={0.75}
          >
            <View style={[styles.workspaceDot, { backgroundColor: colors.primary }]} />
            <Text style={[styles.workspacePillText, { color: colors.text }]} numberOfLines={1}>
              {user?.organization?.name || 'Metropolis Studio'}
            </Text>
            {isDemoMode && (
              <View style={[styles.demoBadge, { backgroundColor: colors.primaryMuted }]}>
                <Text style={[styles.demoBadgeText, { color: colors.primary }]}>DEMO</Text>
              </View>
            )}
          </TouchableOpacity>

          {isDemoMode && (
            <TouchableOpacity
              style={[styles.topSignInBtn, { backgroundColor: colors.primary }]}
              onPress={() => setAuthModalOpen(true)}
              activeOpacity={0.8}
            >
              <LogIn color={colors.primaryContrast} size={12} />
              <Text style={[styles.topSignInText, { color: colors.primaryContrast }]}>Sign In</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Week Navigation Header Bar */}
        <View style={[styles.navCard, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
          <View style={styles.navControls}>
            <TouchableOpacity
              onPress={goToPrevWeek}
              style={[styles.navArrowBtn, { borderColor: colors.borderSubtle }]}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <ChevronLeft color={colors.text} size={18} />
            </TouchableOpacity>

            <TouchableOpacity onPress={goToCurrentWeek} style={styles.navTitleCenter}>
              <Text style={[styles.navWeekTitle, { color: colors.text }]}>
                {viewMode === 'month' ? activeMonthLabel : weekLabel}
              </Text>
              {weekOffset !== 0 ? (
                <Text style={[styles.jumpTodayText, { color: colors.primary }]}>Jump to Today</Text>
              ) : (
                <Text style={[styles.currentWeekTag, { color: colors.textMuted }]}>
                  {viewMode === 'month' ? 'Monthly Summary' : 'Current Active Week'}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={goToNextWeek}
              style={[styles.navArrowBtn, { borderColor: colors.borderSubtle }]}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <ChevronRight color={colors.text} size={18} />
            </TouchableOpacity>
          </View>

          {/* View Mode Switcher: Week View vs Day View vs Month View */}
          <View style={[styles.modeSwitcher, { backgroundColor: colors.surfaceSubtle }]}>
            {(['week', 'day', 'month'] as const).map((m) => (
              <TouchableOpacity
                key={m}
                style={[
                  styles.modeBtn,
                  viewMode === m && [styles.modeBtnActive, { backgroundColor: colors.surface }],
                ]}
                onPress={() => setViewMode(m)}
              >
                <Text
                  style={[
                    styles.modeBtnText,
                    { color: viewMode === m ? colors.primary : colors.textMuted },
                  ]}
                >
                  {m === 'week' ? 'Week View' : m === 'day' ? 'Day View' : 'Month View'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Manager Employee Timesheet Switcher */}
        {isManager && (
          <View style={{ marginBottom: Spacing.sm }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <Users color={colors.primary} size={13} />
              <Text style={[styles.filterSectionTitle, { color: colors.textDim, marginBottom: 0 }]}>
                VIEWING TIMESHEET FOR
              </Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
              {['My Timesheet', ...teamMembers.filter((m) => m.id !== 'guest_mobile_user').map((m) => `${m.firstName} ${m.lastName}`)].map((name) => {
                const active = selectedEmployeeName === name;
                return (
                  <TouchableOpacity
                    key={name}
                    style={[
                      styles.employeeChip,
                      {
                        backgroundColor: active ? colors.primaryMuted : colors.surface,
                        borderColor: active ? colors.primary : colors.borderSubtle,
                      },
                    ]}
                    onPress={() => setSelectedEmployeeName(name)}
                  >
                    <Text
                      style={[
                        styles.employeeChipText,
                        { color: active ? colors.primary : colors.textMuted },
                      ]}
                    >
                      {name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Team Member Timesheet View (when Manager inspects a direct report) */}
        {isViewingTeamMember && viewedMember && (
          <View style={[styles.teamInspectCard, { backgroundColor: colors.surface, borderColor: colors.primary }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <Text style={[styles.teamInspectTitle, { color: colors.text }]}>
                  {viewedMember.firstName} {viewedMember.lastName}
                </Text>
                <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
                  {viewedMember.email} · Weekly Capacity {viewedMember.capacityHours}h
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setSelectedEmployeeName('My Timesheet')}
                style={[styles.resetEmployeeBtn, { backgroundColor: colors.surfaceSubtle }]}
              >
                <Text style={{ fontSize: 11, fontWeight: '700', color: colors.primary }}>Back to Mine</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.teamInspectStats, { borderTopColor: colors.borderSubtle }]}>
              <View>
                <Text style={{ fontSize: 18, fontWeight: '800', color: colors.text }}>
                  {(viewedSubmission?.totalHours || viewedMember.weeklyLoggedHours || 38.5).toFixed(1)}h
                </Text>
                <Text style={{ fontSize: 10, color: colors.textDim }}>WEEK LOGGED</Text>
              </View>
              <View>
                <Text style={{ fontSize: 18, fontWeight: '800', color: colors.primary }}>
                  {(viewedSubmission?.billableHours || (viewedMember.weeklyLoggedHours || 36) * 0.92).toFixed(1)}h
                </Text>
                <Text style={{ fontSize: 10, color: colors.textDim }}>BILLABLE</Text>
              </View>
              {viewedSubmission && viewedSubmission.status === 'submitted' ? (
                <TouchableOpacity
                  style={[styles.approveDirectBtn, { backgroundColor: '#10B981' }]}
                  onPress={async () => {
                    await approveSubmission(viewedSubmission.id);
                    Alert.alert('Approved', `${viewedMember.firstName}'s timesheet has been approved.`);
                  }}
                >
                  <CheckCheck color="#FFFFFF" size={14} />
                  <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '700' }}>Approve Week</Text>
                </TouchableOpacity>
              ) : (
                <View style={[styles.memberStatusPill, { backgroundColor: colors.surfaceSubtle }]}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase' }}>
                    {viewedSubmission?.status || 'active'}
                  </Text>
                </View>
              )}
            </View>

            {viewedSubmission?.breakdown && viewedSubmission.breakdown.length > 0 && (
              <View style={{ marginTop: 10, gap: 6 }}>
                {viewedSubmission.breakdown.map((b, i) => (
                  <View key={i} style={[styles.memberBreakRow, { backgroundColor: colors.surfaceSubtle }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: colors.text }}>{b.projectName}</Text>
                      <Text style={{ fontSize: 11, color: colors.textMuted }}>{b.taskName}</Text>
                    </View>
                    <Text style={{ fontSize: 13, fontWeight: '800', color: colors.primary }}>{b.hours}h</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Submission Status Banner */}
        <View
          style={[
            styles.statusBanner,
            submissionStatus === 'approved'
              ? { backgroundColor: '#10B98115', borderColor: '#10B98150' }
              : submissionStatus === 'submitted'
              ? { backgroundColor: `${colors.primary}12`, borderColor: `${colors.primary}50` }
              : submissionStatus === 'rejected'
              ? { backgroundColor: '#E11D4815', borderColor: '#E11D4850' }
              : { backgroundColor: colors.surface, borderColor: colors.borderSubtle },
          ]}
        >
          <View style={styles.statusBannerLeft}>
            {submissionStatus === 'approved' ? (
              <Lock color="#10B981" size={16} strokeWidth={2.5} style={{ marginRight: 6 }} />
            ) : submissionStatus === 'submitted' ? (
              <Clock color={colors.primary} size={16} strokeWidth={2.2} style={{ marginRight: 6 }} />
            ) : submissionStatus === 'rejected' ? (
              <AlertTriangle color="#E11D48" size={16} strokeWidth={2.2} style={{ marginRight: 6 }} />
            ) : (
              <Calendar color={colors.textDim} size={16} strokeWidth={2.2} style={{ marginRight: 6 }} />
            )}
            <View>
              <Text
                style={[
                  styles.statusBannerTitle,
                  {
                    color:
                      submissionStatus === 'approved'
                        ? '#059669'
                        : submissionStatus === 'submitted'
                        ? colors.primary
                        : submissionStatus === 'rejected'
                        ? '#E11D48'
                        : colors.text,
                  },
                ]}
              >
                {submissionStatus === 'approved'
                  ? 'Timesheet Approved & Locked'
                  : submissionStatus === 'submitted'
                  ? 'Submitted • Awaiting Manager Approval'
                  : submissionStatus === 'rejected'
                  ? 'Returned for Revision'
                  : 'Weekly Timesheet Draft'}
              </Text>
              <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 1 }}>
                {submissionStatus === 'approved'
                  ? 'Locked from employee edits. Contact your manager to reopen.'
                  : submissionStatus === 'submitted'
                  ? 'Locked while pending manager review.'
                  : submissionStatus === 'rejected'
                  ? 'Returned for revision. Please review notes and resubmit.'
                  : 'Draft entries are editable until submitted.'}
              </Text>
              {submissionRejectNote && submissionStatus === 'rejected' && (
                <Text style={[styles.statusRejectNote, { color: '#E11D48' }]}>
                  Feedback: {submissionRejectNote}
                </Text>
              )}
            </View>
          </View>

          {submissionStatus === 'draft' || submissionStatus === 'rejected' ? (
            <TouchableOpacity
              style={[styles.submitActionBtn, { backgroundColor: colors.primary }]}
              onPress={handleSubmitWeek}
              disabled={weekTotalHours === 0}
            >
              <Text style={styles.submitActionBtnText}>Submit Week</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Summary Metrics Row */}
        <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
          <View style={styles.summaryMetricsRow}>
            <View style={styles.metricItem}>
              <Text style={[styles.metricValue, { color: colors.text }]}>
                {viewMode === 'day'
                  ? dayTotalHours.toFixed(1)
                  : viewMode === 'month'
                  ? monthTotalHours.toFixed(1)
                  : weekTotalHours.toFixed(1)}h
              </Text>
              <Text style={[styles.metricLabel, { color: colors.textDim }]}>
                {viewMode === 'day' ? 'Day Hours' : viewMode === 'month' ? 'Month Total' : 'Week Total'}
              </Text>
            </View>
            <View style={[styles.metricDivider, { backgroundColor: colors.borderSubtle }]} />
            <View style={styles.metricItem}>
              <Text style={[styles.metricValue, { color: colors.primary }]}>{billablePercentage}%</Text>
              <Text style={[styles.metricLabel, { color: colors.textDim }]}>Billable</Text>
            </View>
            <View style={[styles.metricDivider, { backgroundColor: colors.borderSubtle }]} />
            <View style={styles.metricItem}>
              <Text style={[styles.metricValue, { color: colors.text }]}>
                {viewMode === 'day'
                  ? Math.max(0, 8.0 - dayTotalHours).toFixed(1)
                  : viewMode === 'month'
                  ? Math.max(0, 160.0 - monthTotalHours).toFixed(1)
                  : Math.max(0, 40.0 - weekTotalHours).toFixed(1)}h
              </Text>
              <Text style={[styles.metricLabel, { color: colors.textDim }]}>
                {viewMode === 'day' ? 'To 8h Target' : viewMode === 'month' ? 'To 160h Target' : 'To 40h Target'}
              </Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={[styles.progressTrack, { backgroundColor: colors.surfaceSubtle }]}>
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: colors.primary,
                  width: `${Math.min(
                    100,
                    viewMode === 'day'
                      ? (dayTotalHours / 8.0) * 100
                      : viewMode === 'month'
                      ? (monthTotalHours / 160.0) * 100
                      : (weekTotalHours / 40.0) * 100
                  )}%`,
                },
              ]}
            />
          </View>
        </View>

        {/* Month View Project Summary Cards */}
        {viewMode === 'month' && monthProjectGroups.length > 0 && (
          <View style={{ marginBottom: Spacing.md }}>
            <Text style={[styles.filterSectionTitle, { color: colors.textDim }]}>
              MONTH BREAKDOWN BY PROJECT
            </Text>
            <View style={[styles.monthSummaryCard, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
              {monthProjectGroups.map((pg, idx) => (
                <View
                  key={pg.projectName}
                  style={[
                    styles.monthProjRow,
                    idx > 0 && { borderTopWidth: 1, borderTopColor: colors.borderSubtle },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text }}>{pg.projectName}</Text>
                    <Text style={{ fontSize: 11, color: colors.textMuted }}>
                      {pg.clientName} · {pg.count} {pg.count === 1 ? 'entry' : 'entries'}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: colors.primary }}>{pg.hours.toFixed(2)}h</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Day Selector Pills Bar (Shown in Week and Day modes) */}
        {viewMode !== 'month' && (
          <>
            <Text style={[styles.filterSectionTitle, { color: colors.textDim }]}>
              {viewMode === 'day' ? 'SELECT DAY TO VIEW' : 'FILTER BY DAY'}
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.daySelectorScroll}
              contentContainerStyle={styles.daySelectorContent}
            >
              {viewMode === 'week' && (
                <TouchableOpacity
                  style={[
                    styles.dayPill,
                    {
                      backgroundColor: selectedDayId === 'all' ? `${colors.primary}18` : colors.surface,
                      borderColor: selectedDayId === 'all' ? colors.primary : colors.borderSubtle,
                    },
                  ]}
                  onPress={() => setSelectedDayId('all')}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.dayLabel,
                      { color: selectedDayId === 'all' ? colors.primary : colors.textMuted },
                    ]}
                  >
                    All
                  </Text>
                  <Text
                    style={[
                      styles.dayHours,
                      { color: selectedDayId === 'all' ? colors.primary : colors.text },
                    ]}
                  >
                    {weekTotalHours.toFixed(1)}h
                  </Text>
                </TouchableOpacity>
              )}

              {weekDates.map((day) => {
                const isSelected = viewMode === 'day' ? activeDayDate === day.id : selectedDayId === day.id;
                const hours = dailyTotals[day.id] || 0;
                return (
                  <TouchableOpacity
                    key={day.id}
                    style={[
                      styles.dayPill,
                      {
                        backgroundColor: isSelected ? `${colors.primary}18` : colors.surface,
                        borderColor: isSelected ? colors.primary : colors.borderSubtle,
                      },
                    ]}
                    onPress={() => {
                      setSelectedDayId(day.id);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.dayPillHeader}>
                      <Text
                        style={[
                          styles.dayLabel,
                          { color: isSelected ? colors.primary : colors.textMuted },
                        ]}
                      >
                        {day.label}
                      </Text>
                      {day.isToday && (
                        <View style={[styles.todayIndicatorDot, { backgroundColor: colors.primary }]} />
                      )}
                    </View>
                    <Text style={[styles.dayDateStr, { color: colors.textDim }]}>{day.dateStr}</Text>
                    <Text
                      style={[
                        styles.dayHours,
                        { color: isSelected ? colors.primary : colors.text },
                      ]}
                    >
                      {hours > 0 ? `${hours.toFixed(1)}h` : '–'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </>
        )}

        {/* Entries Header */}
        <View style={styles.entriesSectionHeader}>
          <View>
            <Text style={[styles.entriesSectionTitle, { color: colors.text }]}>
              {viewMode === 'month'
                ? `${activeMonthLabel} Entries`
                : viewMode === 'day'
                ? `Entries for ${activeDayDate}`
                : selectedDayId === 'all'
                ? 'All Week Entries'
                : `Entries for ${selectedDayId}`}
            </Text>
            <Text style={[styles.entriesSectionSubtitle, { color: colors.textDim }]}>
              {displayedEntries.length} {displayedEntries.length === 1 ? 'entry' : 'entries'} ·{' '}
              {displayedEntries.reduce((s, e) => s + e.hours, 0).toFixed(2)} hrs
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.addTimeBtn,
              { backgroundColor: isApprovedLocked ? colors.surfaceSubtle : colors.primary },
            ]}
            onPress={() =>
              handleOpenAddForDay(
                viewMode === 'day'
                  ? activeDayDate
                  : selectedDayId === 'all'
                  ? getLocalDateString()
                  : selectedDayId
              )
            }
            activeOpacity={0.8}
          >
            {isApprovedLocked ? (
              <>
                <Lock color={colors.textDim} size={13} strokeWidth={2.5} style={{ marginRight: 4 }} />
                <Text style={[styles.addTimeBtnText, { color: colors.textMuted }]}>Locked</Text>
              </>
            ) : (
              <>
                <Plus color="#FFFFFF" size={15} strokeWidth={2.5} style={{ marginRight: 4 }} />
                <Text style={styles.addTimeBtnText}>Add Time</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Entries List */}
        {displayedEntries.length === 0 ? (
          <View style={[styles.emptyDayCard, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
            <Clock color={colors.textDim} size={28} strokeWidth={1.5} style={{ marginBottom: Spacing.sm }} />
            <Text style={[styles.emptyDayText, { color: colors.textMuted }]}>No entries recorded for this day</Text>
            <TouchableOpacity
              style={[styles.emptyDayAddBtn, { backgroundColor: colors.primary }]}
              onPress={() =>
                handleOpenAddForDay(
                  viewMode === 'day'
                    ? activeDayDate
                    : selectedDayId === 'all'
                    ? getLocalDateString()
                    : selectedDayId
                )
              }
            >
              <Text style={styles.emptyDayAddBtnText}>Log Time Now</Text>
            </TouchableOpacity>
          </View>
        ) : (
          displayedEntries.map((entry, idx) => (
            <TouchableOpacity
              key={entry.id || idx}
              activeOpacity={0.75}
              onPress={() => handleEditEntry(entry)}
              style={[styles.entryCard, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}
            >
              <View style={styles.entryHeader}>
                <View style={styles.entryProjectInfo}>
                  <Text style={[styles.entryProjectName, { color: colors.text }]}>{entry.projectName}</Text>
                  <Text style={[styles.entryTaskName, { color: colors.primary }]}>{entry.taskName}</Text>
                </View>
                <View style={[styles.entryHoursBadge, { backgroundColor: colors.surfaceSubtle }]}>
                  <Text style={[styles.entryHoursText, { color: colors.text }]}>{entry.hours.toFixed(2)}h</Text>
                </View>
              </View>

              {Boolean(entry.note) && (
                <Text style={[styles.entryNote, { color: colors.textMuted }]}>{entry.note}</Text>
              )}

              <View style={[styles.entryFooter, { borderTopColor: colors.borderSubtle }]}>
                <Text style={[styles.entryClientTag, { color: colors.textDim }]}>
                  {entry.date} · {entry.clientName || 'General'}
                  {entry.isBillable !== false ? ' · Billable' : ''}
                </Text>

                {isApprovedLocked ? (
                  <View style={styles.deleteBtn}>
                    <Lock color={colors.textDim} size={13} strokeWidth={2} />
                  </View>
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <Edit3 color={colors.textDim} size={14} />
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() =>
                        handleDeleteEntry(entry.id || String(idx), entry.projectName || 'Project', entry.hours)
                      }
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Trash2 color={colors.textDim} size={15} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Manual Entry / Edit Modal */}
      <ManualEntryModal
        visible={manualModalVisible}
        onClose={() => {
          setManualModalVisible(false);
          setEditingEntry(null);
        }}
        initialDate={targetDateForEntry}
        initialEntry={editingEntry}
        onDeleteEntry={async (id) => {
          await deleteEntry(id);
          setEditingEntry(null);
        }}
        onSave={async (date, projectId, taskId, hours, note, existingId) => {
          if (existingId) {
            await updateEntry(existingId, { date, projectId, taskId, hours, note });
          } else {
            await logManualEntry(date, projectId, taskId, hours, note);
          }
          setEditingEntry(null);
          setManualModalVisible(false);
        }}
        projects={projects}
      />
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
  navCard: {
    borderRadius: Radius.xs,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  navControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  navArrowBtn: {
    width: 34,
    height: 34,
    borderRadius: Radius.xs,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTitleCenter: {
    alignItems: 'center',
  },
  navWeekTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  currentWeekTag: {
    fontSize: 11,
    marginTop: 2,
  },
  jumpTodayText: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  modeSwitcher: {
    flexDirection: 'row',
    borderRadius: Radius.xs,
    padding: 3,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: Radius.xs,
    alignItems: 'center',
  },
  modeBtnActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  modeBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: Radius.xs,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  statusBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusBannerTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  statusRejectNote: {
    fontSize: 11,
    marginTop: 2,
    fontWeight: '600',
  },
  submitActionBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: Radius.xs,
  },
  submitActionBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  summaryCard: {
    padding: Spacing.md,
    borderRadius: Radius.xs,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  summaryMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    height: 24,
  },
  progressTrack: {
    height: 5,
    borderRadius: 2.5,
    overflow: 'hidden',
    marginTop: Spacing.md,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2.5,
  },
  filterSectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: Spacing.xs,
  },
  daySelectorScroll: {
    marginBottom: Spacing.md,
  },
  daySelectorContent: {
    gap: 6,
  },
  dayPill: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: Radius.xs,
    borderWidth: 1,
    alignItems: 'center',
    minWidth: 54,
  },
  dayPillHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dayLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  todayIndicatorDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginLeft: 3,
  },
  dayDateStr: {
    fontSize: 10,
    marginTop: 1,
  },
  dayHours: {
    fontSize: 12,
    fontWeight: '800',
    marginTop: 3,
  },
  entriesSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  entriesSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  entriesSectionSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  addTimeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 11,
    borderRadius: Radius.xs,
  },
  addTimeBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyDayCard: {
    padding: Spacing.xl,
    borderRadius: Radius.xs,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
  },
  emptyDayText: {
    fontSize: 13,
    marginBottom: Spacing.sm,
  },
  emptyDayAddBtn: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: Radius.xs,
  },
  emptyDayAddBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  entryCard: {
    padding: Spacing.md,
    borderRadius: Radius.xs,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  entryProjectInfo: {
    flex: 1,
  },
  entryProjectName: {
    fontSize: 13,
    fontWeight: '700',
  },
  entryTaskName: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 1,
  },
  entryHoursBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: Radius.xs,
  },
  entryHoursText: {
    fontSize: 12,
    fontWeight: '800',
  },
  entryNote: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 8,
  },
  entryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 6,
    borderTopWidth: 1,
  },
  entryClientTag: {
    fontSize: 10,
    fontWeight: '500',
  },
  deleteBtn: {
    padding: 2,
  },
  employeeChip: {
    paddingVertical: 6,
    paddingHorizontal: 11,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  employeeChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  teamInspectCard: {
    borderRadius: Radius.md,
    borderWidth: 1.5,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  teamInspectTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  resetEmployeeBtn: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: Radius.sm,
  },
  teamInspectStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
  },
  approveDirectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: Radius.sm,
  },
  memberStatusPill: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: Radius.sm,
  },
  memberBreakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 8,
    borderRadius: Radius.xs,
  },
  monthSummaryCard: {
    borderRadius: Radius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  monthProjRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
  },
  topWorkspaceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
    gap: 8,
  },
  workspacePill: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    paddingVertical: 5,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  workspaceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  workspacePillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  demoBadge: {
    marginLeft: 6,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
  },
  demoBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  topSignInBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: Radius.full,
  },
  topSignInText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
