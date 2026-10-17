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
} from 'lucide-react-native';
import { useAuth } from '@/src/context/AuthContext';
import { useTimesheet } from '@/src/context/TimesheetContext';
import { useTheme } from '@/src/context/ThemeContext';
import { Spacing, Radius } from '@/src/constants/theme';
import { ManualEntryModal } from '@/src/components/ManualEntryModal';

export default function WeekScreen() {
  const { colors, isDark } = useTheme();
  const { isDemoMode } = useAuth();
  const {
    projects,
    entries,
    weekDates,
    weekTotalHours,
    logManualEntry,
    deleteEntry,
    submitWeekTimesheet,
  } = useTimesheet();

  const [selectedDayId, setSelectedDayId] = useState<string>('all');
  const [manualModalVisible, setManualModalVisible] = useState(false);
  const [targetDateForEntry, setTargetDateForEntry] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [isSubmitted, setIsSubmitted] = useState(false);

  const displayedEntries = useMemo(() => {
    if (selectedDayId === 'all') {
      const weekDateSet = new Set(weekDates.map((d) => d.id));
      return entries.filter((e) => weekDateSet.has(e.date));
    }
    return entries.filter((e) => e.date === selectedDayId);
  }, [entries, selectedDayId, weekDates]);

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
      `Submit your ${weekTotalHours.toFixed(2)} hours for this week for manager/payroll review?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit Timesheet',
          onPress: async () => {
            await submitWeekTimesheet();
            setIsSubmitted(true);
            Alert.alert(
              'Timesheet Submitted',
              'Your timesheet has been submitted successfully and locked for approval.'
            );
          },
        },
      ]
    );
  };

  const handleOpenAddForDay = (dateStr: string) => {
    setTargetDateForEntry(dateStr);
    setManualModalVisible(true);
  };

  const handleDeleteEntry = (entryId: string, projectName: string, hours: number) => {
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
        {/* Weekly Header Summary Card */}
        <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.summaryHeader}>
            <View>
              <Text style={[styles.summaryTitle, { color: colors.text }]}>Current Week</Text>
              <Text style={[styles.summarySubtitle, { color: colors.textMuted }]}>
                {weekDates[0]?.dateStr} – {weekDates[6]?.dateStr}
              </Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                isSubmitted
                  ? { backgroundColor: colors.primaryMuted, borderColor: colors.primary }
                  : { backgroundColor: colors.surfaceSubtle, borderColor: colors.borderSubtle },
              ]}
            >
              <Text
                style={[
                  styles.statusBadgeText,
                  { color: isSubmitted ? colors.primary : colors.textMuted },
                ]}
              >
                {isSubmitted ? 'SUBMITTED' : 'DRAFT'}
              </Text>
            </View>
          </View>

          <View style={[styles.summaryMetricsRow, { backgroundColor: colors.surfaceSubtle, borderColor: colors.borderSubtle }]}>
            <View style={styles.metricItem}>
              <Text style={[styles.metricValue, { color: colors.text }]}>{weekTotalHours.toFixed(2)}</Text>
              <Text style={[styles.metricLabel, { color: colors.textDim }]}>Total Hours</Text>
            </View>
            <View style={[styles.metricDivider, { backgroundColor: colors.borderSubtle }]} />
            <View style={styles.metricItem}>
              <Text style={[styles.metricValue, { color: colors.text }]}>{billablePercentage}%</Text>
              <Text style={[styles.metricLabel, { color: colors.textDim }]}>Billable</Text>
            </View>
            <View style={[styles.metricDivider, { backgroundColor: colors.borderSubtle }]} />
            <View style={styles.metricItem}>
              <Text style={[styles.metricValue, { color: colors.text }]}>{Math.max(0, 40 - weekTotalHours).toFixed(1)}h</Text>
              <Text style={[styles.metricLabel, { color: colors.textDim }]}>To 40h Target</Text>
            </View>
          </View>

          {/* Target Progress Bar */}
          <View style={[styles.progressBarBg, { backgroundColor: colors.inputBg, borderColor: colors.borderSubtle }]}>
            <View
              style={[
                styles.progressBarFill,
                {
                  backgroundColor: colors.primary,
                  width: `${Math.min(100, (weekTotalHours / 40) * 100)}%`,
                },
              ]}
            />
          </View>

          {/* Submit Action Button */}
          <TouchableOpacity
            style={[
              styles.submitBtn,
              { backgroundColor: isSubmitted ? colors.surfaceSubtle : colors.primary },
              isSubmitted && { borderWidth: 1, borderColor: colors.borderSubtle },
            ]}
            onPress={handleSubmitWeek}
            disabled={isSubmitted || weekTotalHours === 0}
            activeOpacity={0.8}
          >
            <CheckCheck
              color={isSubmitted ? colors.textDim : '#FFFFFF'}
              size={18}
              strokeWidth={2.5}
              style={{ marginRight: Spacing.sm }}
            />
            <Text
              style={[
                styles.submitBtnText,
                { color: isSubmitted ? colors.textDim : '#FFFFFF' },
              ]}
            >
              {isSubmitted ? 'Timesheet Submitted' : 'Submit Week for Review'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Day Selector Pills Bar */}
        <Text style={[styles.filterSectionTitle, { color: colors.textDim }]}>SELECT DAY</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.daySelectorScroll}
          contentContainerStyle={styles.daySelectorContent}
        >
          {/* All Week Pill */}
          <TouchableOpacity
            style={[
              styles.dayPill,
              {
                backgroundColor: selectedDayId === 'all' ? colors.primaryMuted : colors.surface,
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
                { color: selectedDayId === 'all' ? colors.primaryText : colors.text },
              ]}
            >
              {weekTotalHours.toFixed(1)}h
            </Text>
          </TouchableOpacity>

          {/* Individual Day Pills */}
          {weekDates.map((day) => {
            const isSelected = selectedDayId === day.id;
            const hours = dailyTotals[day.id] || 0;
            return (
              <TouchableOpacity
                key={day.id}
                style={[
                  styles.dayPill,
                  {
                    backgroundColor: isSelected ? colors.primaryMuted : colors.surface,
                    borderColor: isSelected ? colors.primary : colors.borderSubtle,
                  },
                ]}
                onPress={() => setSelectedDayId(day.id)}
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
                    { color: isSelected ? colors.primaryText : colors.text },
                  ]}
                >
                  {hours > 0 ? `${hours.toFixed(1)}h` : '–'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Entries Header */}
        <View style={styles.entriesSectionHeader}>
          <View>
            <Text style={[styles.entriesSectionTitle, { color: colors.text }]}>
              {selectedDayId === 'all' ? 'All Week Entries' : `Entries for ${selectedDayId}`}
            </Text>
            <Text style={[styles.entriesSectionSubtitle, { color: colors.textDim }]}>
              {displayedEntries.length} {displayedEntries.length === 1 ? 'entry' : 'entries'} ·{' '}
              {displayedEntries.reduce((s, e) => s + e.hours, 0).toFixed(2)} hrs
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.addTimeBtn, { backgroundColor: colors.surfaceSubtle, borderColor: colors.borderSubtle }]}
            onPress={() =>
              handleOpenAddForDay(
                selectedDayId === 'all' ? new Date().toISOString().split('T')[0] : selectedDayId
              )
            }
            activeOpacity={0.7}
          >
            <Plus color={colors.primary} size={16} strokeWidth={2.5} style={{ marginRight: 4 }} />
            <Text style={[styles.addTimeBtnText, { color: colors.primary }]}>Add</Text>
          </TouchableOpacity>
        </View>

        {/* Entries List */}
        {displayedEntries.length === 0 ? (
          <View style={[styles.emptyDayCard, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
            <Clock color={colors.border} size={28} strokeWidth={1.5} style={{ marginBottom: Spacing.sm }} />
            <Text style={[styles.emptyDayText, { color: colors.textMuted }]}>No entries for this selection</Text>
            <TouchableOpacity
              style={[styles.emptyDayAddBtn, { backgroundColor: colors.surfaceSubtle, borderColor: colors.borderSubtle }]}
              onPress={() =>
                handleOpenAddForDay(
                  selectedDayId === 'all' ? new Date().toISOString().split('T')[0] : selectedDayId
                )
              }
            >
              <Text style={[styles.emptyDayAddBtnText, { color: colors.primary }]}>Log Time Now</Text>
            </TouchableOpacity>
          </View>
        ) : (
          displayedEntries.map((entry, idx) => (
            <View
              key={entry.id || idx}
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
            </View>
          ))
        )}
      </ScrollView>

      {/* Manual Entry Modal */}
      <ManualEntryModal
        visible={manualModalVisible}
        onClose={() => setManualModalVisible(false)}
        projects={projects}
        defaultDate={targetDateForEntry}
        onSave={async (d, p, t, h, n) => {
          await logManualEntry(d, p, t, h, n);
        }}
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
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl * 2,
  },
  summaryCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  summarySubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: Radius.sm,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  summaryMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    marginBottom: Spacing.md,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    height: 24,
  },
  progressBarBg: {
    height: 6,
    borderRadius: Radius.full,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
    borderWidth: 1,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: Radius.full,
  },
  submitBtn: {
    borderRadius: Radius.md,
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  filterSectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  daySelectorScroll: {
    marginBottom: Spacing.xl,
  },
  daySelectorContent: {
    gap: Spacing.xs + 2,
  },
  dayPill: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingVertical: 8,
    paddingHorizontal: 12,
    minWidth: 58,
    alignItems: 'center',
  },
  dayPillHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dayLabel: {
    fontSize: 12,
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
    marginTop: 2,
  },
  dayHours: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  entriesSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.xs,
  },
  entriesSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  entriesSectionSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  addTimeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: Radius.sm,
  },
  addTimeBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  emptyDayCard: {
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyDayText: {
    fontSize: 13,
    marginBottom: Spacing.md,
  },
  emptyDayAddBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: Radius.sm,
    borderWidth: 1,
  },
  emptyDayAddBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  entryCard: {
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  entryProjectInfo: {
    flex: 1,
    paddingRight: Spacing.sm,
  },
  entryProjectName: {
    fontSize: 13,
    fontWeight: '700',
  },
  entryTaskName: {
    fontSize: 12,
    marginTop: 2,
  },
  entryHoursBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: Radius.sm,
  },
  entryHoursText: {
    fontSize: 12,
    fontWeight: '700',
  },
  entryNote: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: Spacing.sm,
  },
  entryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.md,
    paddingTop: Spacing.xs + 2,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  entryClientTag: {
    fontSize: 11,
  },
  deleteBtn: {
    padding: 4,
  },
});
