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
  TrendingUp,
  FileCheck2,
} from 'lucide-react-native';
import { useAuth } from '@/src/context/AuthContext';
import { useTimesheet } from '@/src/context/TimesheetContext';
import { Colors, Spacing, Radius } from '@/src/constants/theme';
import { ManualEntryModal } from '@/src/components/ManualEntryModal';

export default function WeekScreen() {
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

  const [selectedDayId, setSelectedDayId] = useState<string>('all'); // 'all' or 'YYYY-MM-DD'
  const [manualModalVisible, setManualModalVisible] = useState(false);
  const [targetDateForEntry, setTargetDateForEntry] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Filter entries based on selected day
  const displayedEntries = useMemo(() => {
    if (selectedDayId === 'all') {
      const weekDateSet = new Set(weekDates.map((d) => d.id));
      return entries.filter((e) => weekDateSet.has(e.date));
    }
    return entries.filter((e) => e.date === selectedDayId);
  }, [entries, selectedDayId, weekDates]);

  // Compute daily totals for the week date pills
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

  // Calculate billable vs non-billable
  const { billableHours, billablePercentage } = useMemo(() => {
    const billable = displayedEntries
      .filter((e) => e.isBillable !== false)
      .reduce((sum, e) => sum + e.hours, 0);
    const total = displayedEntries.reduce((sum, e) => sum + e.hours, 0);
    const pct = total > 0 ? Math.round((billable / total) * 100) : 100;
    return { billableHours: billable, billablePercentage: pct };
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
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Weekly Header Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <View>
              <Text style={styles.summaryTitle}>Current Week</Text>
              <Text style={styles.summarySubtitle}>
                {weekDates[0]?.dateStr} – {weekDates[6]?.dateStr}
              </Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                isSubmitted ? styles.statusBadgeSubmitted : styles.statusBadgeDraft,
              ]}
            >
              <Text
                style={[
                  styles.statusBadgeText,
                  isSubmitted ? styles.statusBadgeTextSubmitted : styles.statusBadgeTextDraft,
                ]}
              >
                {isSubmitted ? 'SUBMITTED' : 'DRAFT'}
              </Text>
            </View>
          </View>

          <View style={styles.summaryMetricsRow}>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{weekTotalHours.toFixed(2)}</Text>
              <Text style={styles.metricLabel}>Total Hours</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{billablePercentage}%</Text>
              <Text style={styles.metricLabel}>Billable</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{Math.max(0, 40 - weekTotalHours).toFixed(1)}h</Text>
              <Text style={styles.metricLabel}>To 40h Target</Text>
            </View>
          </View>

          {/* Target Progress Bar */}
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${Math.min(100, (weekTotalHours / 40) * 100)}%` },
              ]}
            />
          </View>

          {/* Submit Action Button */}
          <TouchableOpacity
            style={[styles.submitBtn, isSubmitted && styles.submitBtnDisabled]}
            onPress={handleSubmitWeek}
            disabled={isSubmitted || weekTotalHours === 0}
            activeOpacity={0.8}
          >
            <CheckCheck
              color={isSubmitted ? Colors.textDim : '#090D16'}
              size={18}
              strokeWidth={2.5}
              style={{ marginRight: Spacing.sm }}
            />
            <Text
              style={[
                styles.submitBtnText,
                isSubmitted && { color: Colors.textDim },
              ]}
            >
              {isSubmitted ? 'Timesheet Submitted' : 'Submit Week for Review'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Day Selector Pills Bar */}
        <Text style={styles.filterSectionTitle}>SELECT DAY</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.daySelectorScroll}
          contentContainerStyle={styles.daySelectorContent}
        >
          {/* All Week Pill */}
          <TouchableOpacity
            style={[styles.dayPill, selectedDayId === 'all' && styles.dayPillSelected]}
            onPress={() => setSelectedDayId('all')}
            activeOpacity={0.7}
          >
            <Text style={[styles.dayLabel, selectedDayId === 'all' && styles.dayLabelSelected]}>
              All
            </Text>
            <Text style={[styles.dayHours, selectedDayId === 'all' && styles.dayHoursSelected]}>
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
                  isSelected && styles.dayPillSelected,
                  day.isToday && !isSelected && styles.dayPillToday,
                ]}
                onPress={() => setSelectedDayId(day.id)}
                activeOpacity={0.7}
              >
                <View style={styles.dayPillHeader}>
                  <Text style={[styles.dayLabel, isSelected && styles.dayLabelSelected]}>
                    {day.label}
                  </Text>
                  {day.isToday && <View style={styles.todayIndicatorDot} />}
                </View>
                <Text style={styles.dayDateStr}>{day.dateStr}</Text>
                <Text style={[styles.dayHours, isSelected && styles.dayHoursSelected]}>
                  {hours > 0 ? `${hours.toFixed(1)}h` : '–'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Entries Header */}
        <View style={styles.entriesSectionHeader}>
          <View>
            <Text style={styles.entriesSectionTitle}>
              {selectedDayId === 'all' ? 'All Week Entries' : `Entries for ${selectedDayId}`}
            </Text>
            <Text style={styles.entriesSectionSubtitle}>
              {displayedEntries.length} {displayedEntries.length === 1 ? 'entry' : 'entries'} ·{' '}
              {displayedEntries.reduce((s, e) => s + e.hours, 0).toFixed(2)} hrs
            </Text>
          </View>

          {/* Quick Add For Day */}
          <TouchableOpacity
            style={styles.addTimeBtn}
            onPress={() =>
              handleOpenAddForDay(
                selectedDayId === 'all' ? new Date().toISOString().split('T')[0] : selectedDayId
              )
            }
            activeOpacity={0.7}
          >
            <Plus color={Colors.primary} size={16} strokeWidth={2.5} style={{ marginRight: 4 }} />
            <Text style={styles.addTimeBtnText}>Add</Text>
          </TouchableOpacity>
        </View>

        {/* Entries List */}
        {displayedEntries.length === 0 ? (
          <View style={styles.emptyDayCard}>
            <Clock color={Colors.border} size={28} strokeWidth={1.5} style={{ marginBottom: Spacing.sm }} />
            <Text style={styles.emptyDayText}>No entries for this selection</Text>
            <TouchableOpacity
              style={styles.emptyDayAddBtn}
              onPress={() =>
                handleOpenAddForDay(
                  selectedDayId === 'all' ? new Date().toISOString().split('T')[0] : selectedDayId
                )
              }
            >
              <Text style={styles.emptyDayAddBtnText}>Log Time Now</Text>
            </TouchableOpacity>
          </View>
        ) : (
          displayedEntries.map((entry, idx) => (
            <View key={entry.id || idx} style={styles.entryCard}>
              <View style={styles.entryHeader}>
                <View style={styles.entryProjectInfo}>
                  <Text style={styles.entryProjectName}>{entry.projectName}</Text>
                  <Text style={styles.entryTaskName}>{entry.taskName}</Text>
                </View>
                <View style={styles.entryHoursBadge}>
                  <Text style={styles.entryHoursText}>{entry.hours.toFixed(2)}h</Text>
                </View>
              </View>

              {Boolean(entry.note) && (
                <Text style={styles.entryNote}>{entry.note}</Text>
              )}

              <View style={styles.entryFooter}>
                <Text style={styles.entryClientTag}>
                  {entry.date} · {entry.clientName || 'General'}
                  {entry.isBillable !== false ? ' · Billable' : ''}
                </Text>

                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDeleteEntry(entry.id || String(idx), entry.projectName || 'Project', entry.hours)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Trash2 color={Colors.textDim} size={15} />
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
    backgroundColor: Colors.bg,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl * 2,
  },
  summaryCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
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
    color: Colors.text,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  summarySubtitle: {
    color: Colors.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: Radius.sm,
    borderWidth: 1,
  },
  statusBadgeDraft: {
    backgroundColor: 'rgba(148, 163, 184, 0.1)',
    borderColor: Colors.borderSubtle,
  },
  statusBadgeSubmitted: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: Colors.primary,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  statusBadgeTextDraft: {
    color: Colors.textMuted,
  },
  statusBadgeTextSubmitted: {
    color: Colors.primaryText,
  },
  summaryMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.bg,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    marginBottom: Spacing.md,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricValue: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  metricLabel: {
    color: Colors.textDim,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.borderSubtle,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: Colors.bg,
    borderRadius: Radius.full,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
  },
  submitBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnDisabled: {
    backgroundColor: Colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  submitBtnText: {
    color: '#090D16',
    fontSize: 14,
    fontWeight: '700',
  },
  filterSectionTitle: {
    color: Colors.textDim,
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
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    borderRadius: Radius.md,
    paddingVertical: 8,
    paddingHorizontal: 12,
    minWidth: 58,
    alignItems: 'center',
  },
  dayPillSelected: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: Colors.primary,
  },
  dayPillToday: {
    borderColor: Colors.border,
  },
  dayPillHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dayLabel: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  dayLabelSelected: {
    color: Colors.primary,
  },
  todayIndicatorDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.primary,
    marginLeft: 3,
  },
  dayDateStr: {
    color: Colors.textDim,
    fontSize: 10,
    marginTop: 2,
  },
  dayHours: {
    color: Colors.text,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  dayHoursSelected: {
    color: Colors.primaryText,
  },
  entriesSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.xs,
  },
  entriesSectionTitle: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  entriesSectionSubtitle: {
    color: Colors.textDim,
    fontSize: 12,
    marginTop: 2,
  },
  addTimeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: Radius.sm,
  },
  addTimeBtnText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  emptyDayCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    padding: Spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyDayText: {
    color: Colors.textMuted,
    fontSize: 13,
    marginBottom: Spacing.md,
  },
  emptyDayAddBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  emptyDayAddBtnText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  entryCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
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
    color: Colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  entryTaskName: {
    color: Colors.primary,
    fontSize: 12,
    marginTop: 2,
  },
  entryHoursBadge: {
    backgroundColor: Colors.surfaceSubtle,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: Radius.sm,
  },
  entryHoursText: {
    color: Colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
  entryNote: {
    color: Colors.textMuted,
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
    borderTopColor: Colors.borderSubtle,
  },
  entryClientTag: {
    color: Colors.textDim,
    fontSize: 11,
  },
  deleteBtn: {
    padding: 4,
  },
});
