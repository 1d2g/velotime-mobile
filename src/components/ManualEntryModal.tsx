import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { X, Clock, ChevronDown, Check } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { Spacing, Radius } from '../constants/theme';
import { Project } from '../services/api';
import { ProjectPickerModal } from './ProjectPickerModal';

interface ManualEntryModalProps {
  visible: boolean;
  onClose: () => void;
  projects: Project[];
  defaultDate?: string;
  initialDate?: string;
  onSave: (date: string, projectId: string, taskId: string, hours: number, note: string) => Promise<void>;
}

const QUICK_HOURS = [0.5, 1.0, 1.5, 2.0, 3.0, 4.0, 7.5];

export function ManualEntryModal({
  visible,
  onClose,
  projects,
  defaultDate,
  initialDate,
  onSave,
}: ManualEntryModalProps) {
  const { colors, isDark } = useTheme();
  const effectiveDate = initialDate || defaultDate || new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(effectiveDate);
  const [projectId, setProjectId] = useState(projects[0]?.id || 'p1');
  const [taskId, setTaskId] = useState(projects[0]?.tasks[0]?.id || 't1_1');
  const [hours, setHours] = useState('1.0');
  const [note, setNote] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (visible) {
      setDate(initialDate || defaultDate || new Date().toISOString().split('T')[0]);
    }
  }, [visible, initialDate, defaultDate]);

  const currentProject = projects.find((p) => p.id === projectId) || projects[0];
  const currentTask = currentProject?.tasks.find((t) => t.id === taskId) || currentProject?.tasks[0];

  const handleSave = async () => {
    const numHours = parseFloat(hours);
    if (isNaN(numHours) || numHours <= 0) {
      Alert.alert('Invalid Hours', 'Please enter a valid number of hours greater than 0.');
      return;
    }
    if (numHours > 24) {
      Alert.alert('Check Hours', 'Logged time cannot exceed 24 hours for a single day.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSave(date, projectId, taskId, numHours, note.trim());
      setNote('');
      setHours('1.0');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <SafeAreaView style={[styles.overlay, { backgroundColor: isDark ? 'rgba(5, 8, 15, 0.85)' : 'rgba(15, 23, 42, 0.45)' }]}>
        <View style={[styles.sheet, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={[styles.title, { color: colors.text }]}>Manual Time Entry</Text>
              <Text style={[styles.subtitle, { color: colors.textMuted }]}>Log retrospective hours for any project</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.surfaceSubtle }]}>
              <X color={colors.textMuted} size={20} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
            {/* Project & Task Selector Pill */}
            <Text style={[styles.fieldLabel, { color: colors.textDim }]}>PROJECT & TASK</Text>
            <TouchableOpacity
              style={[styles.selectorCard, { backgroundColor: colors.surfaceSubtle, borderColor: colors.borderSubtle }]}
              onPress={() => setPickerOpen(true)}
              activeOpacity={0.7}
            >
              <View style={styles.selectorCardInfo}>
                <Text style={[styles.selectorProjectName, { color: colors.text }]}>{currentProject?.name || 'Select Project'}</Text>
                <Text style={[styles.selectorTaskName, { color: colors.primary }]}>{currentTask?.name || 'Select Task'}</Text>
              </View>
              <ChevronDown color={colors.textDim} size={20} />
            </TouchableOpacity>

            {/* Hours selection */}
            <Text style={[styles.fieldLabel, { color: colors.textDim }]}>DURATION (HOURS)</Text>
            <View style={[styles.hoursInputRow, { backgroundColor: colors.inputBg, borderColor: colors.borderSubtle }]}>
              <Clock color={colors.textMuted} size={18} style={styles.hoursIcon} />
              <TextInput
                style={[styles.hoursInput, { color: colors.text }]}
                keyboardType="decimal-pad"
                value={hours}
                onChangeText={setHours}
                placeholder="1.0"
                placeholderTextColor={colors.textDim}
              />
              <Text style={[styles.hoursUnit, { color: colors.textDim }]}>hrs</Text>
            </View>

            {/* Quick Hours Pills */}
            <View style={styles.quickHoursRow}>
              {QUICK_HOURS.map((h) => {
                const isSelected = parseFloat(hours) === h;
                return (
                  <TouchableOpacity
                    key={h}
                    style={[
                      styles.quickHourChip,
                      { backgroundColor: colors.surfaceSubtle, borderColor: colors.borderSubtle },
                      isSelected && {
                        backgroundColor: colors.primaryMuted,
                        borderColor: colors.primary,
                      },
                    ]}
                    onPress={() => setHours(h.toString())}
                  >
                    <Text
                      style={[
                        styles.quickHourText,
                        { color: isSelected ? colors.primary : colors.textMuted },
                        isSelected && { fontWeight: '700' },
                      ]}
                    >
                      {h}h
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Note field */}
            <Text style={[styles.fieldLabel, { color: colors.textDim }]}>NOTE (OPTIONAL)</Text>
            <TextInput
              style={[
                styles.noteInput,
                {
                  backgroundColor: colors.inputBg,
                  borderColor: colors.borderSubtle,
                  color: colors.text,
                },
              ]}
              multiline
              numberOfLines={3}
              placeholder="What did you accomplish?"
              placeholderTextColor={colors.textDim}
              value={note}
              onChangeText={setNote}
            />

            {/* Action button */}
            <TouchableOpacity
              style={[
                styles.saveBtn,
                { backgroundColor: colors.primary },
                isSubmitting && styles.saveBtnDisabled,
              ]}
              onPress={handleSave}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              <Check color="#FFFFFF" size={18} strokeWidth={2.5} style={{ marginRight: Spacing.sm }} />
              <Text style={styles.saveBtnText}>
                {isSubmitting ? 'Logging...' : 'Log Time to Timesheet'}
              </Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Project Picker Modal */}
          <ProjectPickerModal
            visible={pickerOpen}
            onClose={() => setPickerOpen(false)}
            projects={projects}
            selectedProjectId={projectId}
            selectedTaskId={taskId}
            onSelect={(pId, tId) => {
              setProjectId(pId);
              setTaskId(tId);
            }}
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    borderTopWidth: 1,
    paddingTop: Spacing.lg,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  closeBtn: {
    padding: Spacing.xs,
    borderRadius: Radius.full,
  },
  content: {
    paddingHorizontal: Spacing.xl,
  },
  contentInner: {
    paddingBottom: Spacing.xxxl,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: Spacing.xs + 2,
    marginTop: Spacing.sm,
  },
  selectorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  selectorCardInfo: {
    flex: 1,
    paddingRight: Spacing.sm,
  },
  selectorProjectName: {
    fontSize: 14,
    fontWeight: '600',
  },
  selectorTaskName: {
    fontSize: 12,
    marginTop: 3,
  },
  hoursInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    height: 48,
    marginBottom: Spacing.sm,
  },
  hoursIcon: {
    marginRight: Spacing.sm,
  },
  hoursInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
  },
  hoursUnit: {
    fontSize: 14,
    fontWeight: '600',
  },
  quickHoursRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs + 2,
    marginBottom: Spacing.md,
  },
  quickHourChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radius.sm,
    borderWidth: 1,
  },
  quickHourText: {
    fontSize: 12,
    fontWeight: '600',
  },
  noteInput: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
    fontSize: 14,
    minHeight: 70,
    textAlignVertical: 'top',
    marginBottom: Spacing.xl,
  },
  saveBtn: {
    borderRadius: Radius.md,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
