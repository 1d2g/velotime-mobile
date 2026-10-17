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
import { Colors, Spacing, Radius } from '@/src/constants/theme';
import { ProjectPickerModal } from '@/src/components/ProjectPickerModal';
import { ManualEntryModal } from '@/src/components/ManualEntryModal';

export default function TimerScreen() {
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

  // Active project & task helpers
  const currentProject =
    projects.find((p) => p.id === activeTimer.projectId) || projects[0] || { name: 'Select Project', tasks: [] };
  const currentTask =
    currentProject.tasks.find((t) => t.id === activeTimer.taskId) ||
    currentProject.tasks[0] || { id: 'default', name: 'General Work' };

  // Format digital stopwatch display
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

  // Formatted today date
  const todayDateLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} keyboardShouldPersistTaps="handled">
        {/* Workspace & Sync Status Bar */}
        <View style={styles.statusBarRow}>
          <View style={styles.workspaceBadge}>
            <View style={styles.statusDot} />
            <Text style={styles.workspaceText}>
              {user?.organization?.name || 'Metropolis Studio'}
            </Text>
            {isDemoMode && <Text style={styles.demoTag}>DEMO</Text>}
          </View>

          <View style={styles.syncBadge}>
            {syncStatus === 'offline' ? (
              <>
                <WifiOff color={Colors.textDim} size={12} style={{ marginRight: 4 }} />
                <Text style={styles.syncText}>Offline</Text>
              </>
            ) : (
              <>
                <Wifi color={Colors.primary} size={12} style={{ marginRight: 4 }} />
                <Text style={[styles.syncText, { color: Colors.primaryText }]}>Synced</Text>
              </>
            )}
          </View>
        </View>

        {/* Stopwatch Main Card */}
        <View style={[styles.stopwatchCard, activeTimer.isRunning && styles.stopwatchCardActive]}>
          {/* Project & Task Selector Pill */}
          <TouchableOpacity
            style={styles.selectorRow}
            onPress={() => setProjectPickerVisible(true)}
            activeOpacity={0.7}
          >
            <View style={styles.selectorLeft}>
              <Briefcase color={Colors.primary} size={16} strokeWidth={2.2} />
              <View style={styles.selectorLabels}>
                <Text style={styles.selectorProject} numberOfLines={1}>
                  {currentProject.name}
                </Text>
                <Text style={styles.selectorTask} numberOfLines={1}>
                  {currentTask.name}
                </Text>
              </View>
            </View>
            <ChevronRight color={Colors.textDim} size={18} />
          </TouchableOpacity>

          {/* Monospace Digital Display */}
          <View style={styles.displayContainer}>
            <Text style={styles.digitalDisplay}>
              {formatTime(activeTimer.elapsedSeconds)}
            </Text>
            {activeTimer.isRunning && (
              <View style={styles.liveIndicator}>
                <View style={styles.livePulse} />
                <Text style={styles.liveText}>RECORDING</Text>
              </View>
            )}
          </View>

          {/* Quick Note Input */}
          <TextInput
            style={styles.noteInput}
            placeholder="Add note or deliverable details..."
            placeholderTextColor={Colors.textDim}
            value={activeTimer.note}
            onChangeText={setTimerNote}
            returnKeyType="done"
          />

          {/* Controls Bar */}
          <View style={styles.controlsRow}>
            {/* Reset Button (visible when timer has elapsed seconds) */}
            {activeTimer.elapsedSeconds > 0 && (
              <TouchableOpacity
                style={styles.iconButton}
                onPress={handleConfirmReset}
                activeOpacity={0.7}
              >
                <RotateCcw color={Colors.textMuted} size={20} strokeWidth={2.2} />
              </TouchableOpacity>
            )}

            {/* Primary Start / Pause Button */}
            <TouchableOpacity
              style={[
                styles.primaryBtn,
                activeTimer.isRunning ? styles.pauseBtn : styles.startBtn,
                activeTimer.elapsedSeconds === 0 && { flex: 1 },
              ]}
              onPress={handleStartStop}
              activeOpacity={0.8}
            >
              {activeTimer.isRunning ? (
                <>
                  <Pause color="#090D16" size={20} strokeWidth={2.5} style={{ marginRight: Spacing.sm }} />
                  <Text style={styles.primaryBtnText}>Pause</Text>
                </>
              ) : (
                <>
                  <Play color="#090D16" size={20} strokeWidth={2.5} style={{ marginRight: Spacing.sm }} />
                  <Text style={styles.primaryBtnText}>
                    {activeTimer.elapsedSeconds > 0 ? 'Resume' : 'Start Timer'}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* Save / Log Entry Button (visible when timer has run) */}
            {activeTimer.elapsedSeconds > 0 && (
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSave}
                activeOpacity={0.8}
              >
                <Check color="#090D16" size={20} strokeWidth={2.5} style={{ marginRight: Spacing.xs }} />
                <Text style={styles.saveBtnText}>Log</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Quick Manual Entry Strip */}
        <TouchableOpacity
          style={styles.manualEntryBtn}
          onPress={() => setManualModalVisible(true)}
          activeOpacity={0.7}
        >
          <View style={styles.manualBtnLeft}>
            <Clock color={Colors.primary} size={16} strokeWidth={2.2} />
            <Text style={styles.manualBtnText}>Add manual hours or past time</Text>
          </View>
          <Plus color={Colors.primary} size={18} strokeWidth={2.5} />
        </TouchableOpacity>

        {/* Today's Entries Section Header */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Today's Log</Text>
            <Text style={styles.sectionSubtitle}>{todayDateLabel}</Text>
          </View>
          <View style={styles.hoursPill}>
            <Text style={styles.hoursPillText}>{todayTotalHours.toFixed(2)} hrs</Text>
          </View>
        </View>

        {/* Today's Entries List */}
        {todayEntries.length === 0 ? (
          <View style={styles.emptyCard}>
            <Clock color={Colors.border} size={32} strokeWidth={1.5} style={{ marginBottom: Spacing.md }} />
            <Text style={styles.emptyTitle}>No hours recorded today</Text>
            <Text style={styles.emptySubtitle}>
              Hit Start Timer or add manual hours above to start logging.
            </Text>
          </View>
        ) : (
          todayEntries.map((entry, idx) => (
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
                  {entry.clientName || 'General'}
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
    backgroundColor: Colors.bg,
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
    backgroundColor: Colors.surface,
    paddingVertical: 5,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
    marginRight: Spacing.xs + 2,
  },
  workspaceText: {
    color: Colors.text,
    fontSize: 12,
    fontWeight: '600',
  },
  demoTag: {
    marginLeft: 6,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    color: Colors.accent,
    fontSize: 9,
    fontWeight: '700',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  syncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  syncText: {
    color: Colors.textDim,
    fontSize: 11,
    fontWeight: '600',
  },
  stopwatchCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  stopwatchCardActive: {
    borderColor: Colors.primary,
  },
  selectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.bg,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
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
    color: Colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  selectorTask: {
    color: Colors.primary,
    fontSize: 12,
    marginTop: 1,
  },
  displayContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
  },
  digitalDisplay: {
    color: Colors.text,
    fontSize: 54,
    fontWeight: '700',
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
    backgroundColor: Colors.primary,
    marginRight: 6,
  },
  liveText: {
    color: Colors.primaryText,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  noteInput: {
    backgroundColor: Colors.bg,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    paddingHorizontal: Spacing.md,
    height: 42,
    color: Colors.text,
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
    backgroundColor: Colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
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
  startBtn: {
    backgroundColor: Colors.primary,
  },
  pauseBtn: {
    backgroundColor: Colors.warning,
  },
  primaryBtnText: {
    color: '#090D16',
    fontSize: 15,
    fontWeight: '700',
  },
  saveBtn: {
    flex: 1,
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    color: '#090D16',
    fontSize: 15,
    fontWeight: '700',
  },
  manualEntryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
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
    color: Colors.textMuted,
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
    color: Colors.text,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    color: Colors.textDim,
    fontSize: 12,
    marginTop: 2,
  },
  hoursPill: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  hoursPillText: {
    color: Colors.primaryText,
    fontSize: 12,
    fontWeight: '700',
  },
  emptyCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    padding: Spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    color: Colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  emptySubtitle: {
    color: Colors.textDim,
    fontSize: 12,
    marginTop: Spacing.xs,
    textAlign: 'center',
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
