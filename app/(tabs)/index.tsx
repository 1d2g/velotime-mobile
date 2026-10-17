import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  SafeAreaView,
  Platform,
} from 'react-native';
import {
  Play,
  Pause,
  RotateCcw,
  Check,
  Plus,
  Trash2,
  Clock,
  Briefcase,
  ChevronRight,
  Wifi,
  WifiOff,
} from 'lucide-react-native';
import { useAuth } from '@/src/context/AuthContext';
import { useTimesheet } from '@/src/context/TimesheetContext';
import { useTheme } from '@/src/context/ThemeContext';
import { Spacing, Radius } from '@/src/constants/theme';
import { ProjectPickerModal } from '@/src/components/ProjectPickerModal';
import { ManualEntryModal } from '@/src/components/ManualEntryModal';

export default function TimerScreen() {
  const { colors, isDark } = useTheme();
  const { user, isDemoMode, syncStatus } = useAuth();
  const {
    projects,
    activeTimer,
    todayEntries,
    todayTotalHours,
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
    saveTimer,
    setTimerNote,
    setTimerProjectAndTask,
    logManualEntry,
    deleteEntry,
  } = useTimesheet();

  const [projectPickerVisible, setProjectPickerVisible] = useState(false);
  const [manualModalVisible, setManualModalVisible] = useState(false);

  const currentProject =
    projects.find((p) => p.id === activeTimer.projectId) || projects[0] || { name: 'Select Project', tasks: [] };
  const currentTask =
    currentProject.tasks.find((t) => t.id === activeTimer.taskId) ||
    currentProject.tasks[0] || { id: 'default', name: 'General Work' };

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const handleStartStop = () => {
    if (activeTimer.isRunning) {
      pauseTimer();
    } else {
      if (activeTimer.elapsedSeconds > 0) {
        resumeTimer();
      } else {
        startTimer(activeTimer.projectId, activeTimer.taskId, activeTimer.note);
      }
    }
  };

  const handleSave = async () => {
    if (activeTimer.elapsedSeconds < 30) {
      Alert.alert(
        'Timer Under 30 Seconds',
        'Your timer has only run for a few seconds. Do you want to log a minimum of 0.05 hours (3 minutes) or keep timing?',
        [
          { text: 'Keep Timing', style: 'cancel' },
          {
            text: 'Log 0.05 hr',
            onPress: async () => {
              await saveTimer();
            },
          },
        ]
      );
      return;
    }
    await saveTimer();
  };

  const handleConfirmReset = () => {
    if (activeTimer.elapsedSeconds === 0) return;
    Alert.alert(
      'Reset Timer',
      'Are you sure you want to discard this timer session? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: resetTimer },
      ]
    );
  };

  const handleDeleteEntry = (entryId: string, projectTitle: string, hours: number) => {
    Alert.alert(
      'Delete Time Entry',
      `Delete ${hours} hrs logged for "${projectTitle}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteEntry(entryId) },
      ]
    );
  };

  const todayDateLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        {/* Workspace & Sync Status Bar */}
        <View style={styles.statusBarRow}>
          <View style={[styles.workspaceBadge, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
            <View style={[styles.statusDot, { backgroundColor: colors.primary }]} />
            <Text style={[styles.workspaceText, { color: colors.text }]}>
              {user?.organization?.name || 'Metropolis Studio'}
            </Text>
            {isDemoMode && (
              <View style={[styles.demoTagWrap, { backgroundColor: colors.primaryMuted }]}>
                <Text style={[styles.demoTag, { color: colors.primary }]}>DEMO</Text>
              </View>
            )}
          </View>

          <View style={styles.syncBadge}>
            {syncStatus === 'offline' ? (
              <>
                <WifiOff color={colors.textDim} size={12} style={{ marginRight: 4 }} />
                <Text style={[styles.syncText, { color: colors.textDim }]}>Offline</Text>
              </>
            ) : (
              <>
                <Wifi color={colors.primary} size={12} style={{ marginRight: 4 }} />
                <Text style={[styles.syncText, { color: colors.primary }]}>Synced</Text>
              </>
            )}
          </View>
        </View>

        {/* Stopwatch Main Card */}
        <View
          style={[
            styles.stopwatchCard,
            { backgroundColor: colors.surface, borderColor: activeTimer.isRunning ? colors.primary : colors.border },
          ]}
        >
          {/* Project & Task Selector Pill */}
          <TouchableOpacity
            style={[styles.selectorRow, { backgroundColor: colors.surfaceSubtle, borderColor: colors.borderSubtle }]}
            onPress={() => setProjectPickerVisible(true)}
            activeOpacity={0.7}
          >
            <View style={styles.selectorLeft}>
              <Briefcase color={colors.primary} size={16} strokeWidth={2.2} />
              <View style={styles.selectorLabels}>
                <Text style={[styles.selectorProject, { color: colors.text }]} numberOfLines={1}>
                  {currentProject.name}
                </Text>
                <Text style={[styles.selectorTask, { color: colors.primary }]} numberOfLines={1}>
                  {currentTask.name}
                </Text>
              </View>
            </View>
            <ChevronRight color={colors.textDim} size={18} />
          </TouchableOpacity>

          {/* Monospace Digital Display */}
          <View style={styles.displayContainer}>
            <Text style={[styles.digitalDisplay, { color: colors.text }]}>
              {formatTime(activeTimer.elapsedSeconds)}
            </Text>
            {activeTimer.isRunning && (
              <View style={styles.liveIndicator}>
                <View style={[styles.livePulse, { backgroundColor: colors.primary }]} />
                <Text style={[styles.liveText, { color: colors.primary }]}>RECORDING</Text>
              </View>
            )}
          </View>

          {/* Quick Note Input */}
          <TextInput
            style={[
              styles.noteInput,
              {
                backgroundColor: colors.inputBg,
                borderColor: colors.borderSubtle,
                color: colors.text,
              },
            ]}
            placeholder="Add note or deliverable details..."
            placeholderTextColor={colors.textDim}
            value={activeTimer.note}
            onChangeText={setTimerNote}
            returnKeyType="done"
          />

          {/* Controls Bar */}
          <View style={styles.controlsRow}>
            {activeTimer.elapsedSeconds > 0 && (
              <TouchableOpacity
                style={[
                  styles.iconButton,
                  { backgroundColor: colors.surfaceSubtle, borderColor: colors.borderSubtle },
                ]}
                onPress={handleConfirmReset}
                activeOpacity={0.7}
              >
                <RotateCcw color={colors.textMuted} size={20} strokeWidth={2.2} />
              </TouchableOpacity>
            )}

            {/* Primary Start / Pause Button */}
            <TouchableOpacity
              style={[
                styles.primaryBtn,
                activeTimer.isRunning
                  ? { backgroundColor: colors.warning }
                  : { backgroundColor: colors.primary },
                activeTimer.elapsedSeconds === 0 && { flex: 1 },
              ]}
              onPress={handleStartStop}
              activeOpacity={0.8}
            >
              {activeTimer.isRunning ? (
                <>
                  <Pause color="#FFFFFF" size={20} strokeWidth={2.5} style={{ marginRight: Spacing.sm }} />
                  <Text style={[styles.primaryBtnText, { color: '#FFFFFF' }]}>Pause</Text>
                </>
              ) : (
                <>
                  <Play color="#FFFFFF" size={20} strokeWidth={2.5} style={{ marginRight: Spacing.sm }} />
                  <Text style={[styles.primaryBtnText, { color: '#FFFFFF' }]}>
                    {activeTimer.elapsedSeconds > 0 ? 'Resume' : 'Start Timer'}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* Save / Log Entry Button */}
            {activeTimer.elapsedSeconds > 0 && (
              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: colors.surfaceSubtle, borderColor: colors.primary }]}
                onPress={handleSave}
                activeOpacity={0.8}
              >
                <Check color={colors.primary} size={18} strokeWidth={2.5} style={{ marginRight: Spacing.xs }} />
                <Text style={[styles.saveBtnText, { color: colors.primary }]}>Log</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Quick Manual Entry Strip */}
        <TouchableOpacity
          style={[styles.manualEntryBtn, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}
          onPress={() => setManualModalVisible(true)}
          activeOpacity={0.7}
        >
          <View style={styles.manualBtnLeft}>
            <Clock color={colors.primary} size={16} strokeWidth={2.2} />
            <Text style={[styles.manualBtnText, { color: colors.textMuted }]}>
              Add manual hours or past time
            </Text>
          </View>
          <Plus color={colors.primary} size={18} strokeWidth={2.5} />
        </TouchableOpacity>

        {/* Today's Entries Section Header */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Today's Log</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textDim }]}>{todayDateLabel}</Text>
          </View>
          <View style={[styles.hoursPill, { backgroundColor: colors.primaryMuted, borderColor: colors.primary }]}>
            <Text style={[styles.hoursPillText, { color: colors.primaryText }]}>
              {todayTotalHours.toFixed(2)} hrs
            </Text>
          </View>
        </View>

        {/* Today's Entries List */}
        {todayEntries.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
            <Clock color={colors.border} size={32} strokeWidth={1.5} style={{ marginBottom: Spacing.md }} />
            <Text style={[styles.emptyTitle, { color: colors.textMuted }]}>No hours recorded today</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textDim }]}>
              Hit Start Timer or add manual hours above to start logging.
            </Text>
          </View>
        ) : (
          todayEntries.map((entry, idx) => (
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
                  {entry.clientName || 'General'}
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

      {/* Project Picker Modal */}
      <ProjectPickerModal
        visible={projectPickerVisible}
        onClose={() => setProjectPickerVisible(false)}
        projects={projects}
        selectedProjectId={activeTimer.projectId}
        selectedTaskId={activeTimer.taskId}
        onSelect={(pId, tId) => setTimerProjectAndTask(pId, tId)}
      />

      {/* Manual Entry Modal */}
      <ManualEntryModal
        visible={manualModalVisible}
        onClose={() => setManualModalVisible(false)}
        projects={projects}
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
  statusBarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  workspaceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: Spacing.xs + 2,
  },
  workspaceText: {
    fontSize: 12,
    fontWeight: '600',
  },
  demoTagWrap: {
    marginLeft: 6,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
  },
  demoTag: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  syncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  syncText: {
    fontSize: 11,
    fontWeight: '600',
  },
  stopwatchCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  selectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  selectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: Spacing.sm,
  },
  selectorLabels: {
    marginLeft: Spacing.sm,
    flex: 1,
  },
  selectorProject: {
    fontSize: 13,
    fontWeight: '700',
  },
  selectorTask: {
    fontSize: 12,
    marginTop: 1,
    fontWeight: '600',
  },
  displayContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
  },
  digitalDisplay: {
    fontSize: 54,
    fontWeight: '800',
    letterSpacing: 2,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  livePulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  liveText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  noteInput: {
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    height: 42,
    fontSize: 13,
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtn: {
    flex: 2,
    height: 48,
    borderRadius: Radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
  saveBtn: {
    flex: 1,
    height: 48,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
  manualEntryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  manualBtnLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  manualBtnText: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: Spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.xs,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  hoursPill: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  hoursPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  emptyCard: {
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptySubtitle: {
    fontSize: 12,
    marginTop: Spacing.xs,
    textAlign: 'center',
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
