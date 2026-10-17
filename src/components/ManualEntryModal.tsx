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
import { Colors, Spacing, Radius } from '../constants/theme';
import { Project } from '../services/api';
import { ProjectPickerModal } from './ProjectPickerModal';

interface ManualEntryModalProps {
  visible: boolean;
  onClose: () => void;
  projects: Project[];
  defaultDate?: string;
  onSave: (date: string, projectId: string, taskId: string, hours: number, note: string) => Promise<void>;
}

const QUICK_HOURS = [0.5, 1.0, 1.5, 2.0, 3.0, 4.0, 7.5];

export function ManualEntryModal({
  visible,
  onClose,
  projects,
  defaultDate,
  onSave,
}: ManualEntryModalProps) {
  const todayStr = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(defaultDate || todayStr);
  const [projectId, setProjectId] = useState(projects[0]?.id || 'p1');
  const [taskId, setTaskId] = useState(projects[0]?.tasks[0]?.id || 't1_1');
  const [hours, setHours] = useState('1.0');
  const [note, setNote] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    <Modal visible={visible} animationType="slide" transparent presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Manual Time Entry</Text>
              <Text style={styles.subtitle}>Log retrospective hours for any project</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X color={Colors.textMuted} size={20} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
            {/* Project & Task Selector Pill */}
            <Text style={styles.fieldLabel}>PROJECT & TASK</Text>
            <TouchableOpacity
              style={styles.selectorCard}
              onPress={() => setPickerOpen(true)}
              activeOpacity={0.7}
            >
              <View style={styles.selectorCardInfo}>
                <Text style={styles.selectorProjectName}>{currentProject?.name || 'Select Project'}</Text>
                <Text style={styles.selectorTaskName}>{currentTask?.name || 'Select Task'}</Text>
              </View>
              <ChevronDown color={Colors.textDim} size={20} />
            </TouchableOpacity>

            {/* Hours selection */}
            <Text style={styles.fieldLabel}>DURATION (HOURS)</Text>
            <View style={styles.hoursInputRow}>
              <Clock color={Colors.textMuted} size={18} style={styles.hoursIcon} />
              <TextInput
                style={styles.hoursInput}
                keyboardType="decimal-pad"
                value={hours}
                onChangeText={setHours}
                placeholder="1.0"
                placeholderTextColor={Colors.textDim}
              />
              <Text style={styles.hoursUnit}>hrs</Text>
            </View>

            {/* Quick Hours Pills */}
            <View style={styles.quickHoursRow}>
              {QUICK_HOURS.map((h) => {
                const isSelected = parseFloat(hours) === h;
                return (
                  <TouchableOpacity
                    key={h}
                    style={[styles.quickHourChip, isSelected && styles.quickHourChipSelected]}
                    onPress={() => setHours(h.toString())}
                  >
                    <Text style={[styles.quickHourText, isSelected && styles.quickHourTextSelected]}>
                      {h}h
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Note field */}
            <Text style={styles.fieldLabel}>NOTE (OPTIONAL)</Text>
            <TextInput
              style={styles.noteInput}
              multiline
              numberOfLines={3}
              placeholder="What did you accomplish?"
              placeholderTextColor={Colors.textDim}
              value={note}
              onChangeText={setNote}
            />

            {/* Action button */}
            <TouchableOpacity
              style={[styles.saveBtn, isSubmitting && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              <Check color="#090D16" size={18} strokeWidth={2.5} style={{ marginRight: Spacing.sm }} />
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
    backgroundColor: 'rgba(5, 8, 15, 0.85)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
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
    color: Colors.text,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  subtitle: {
    color: Colors.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  closeBtn: {
    padding: Spacing.xs,
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: Radius.full,
  },
  content: {
    paddingHorizontal: Spacing.xl,
  },
  contentInner: {
    paddingBottom: Spacing.xxxl,
  },
  fieldLabel: {
    color: Colors.textDim,
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
    backgroundColor: Colors.bg,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  selectorCardInfo: {
    flex: 1,
    paddingRight: Spacing.sm,
  },
  selectorProjectName: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  selectorTaskName: {
    color: Colors.primary,
    fontSize: 12,
    marginTop: 3,
  },
  hoursInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
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
    color: Colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  hoursUnit: {
    color: Colors.textDim,
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
    backgroundColor: Colors.surfaceSubtle,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  quickHourChipSelected: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: Colors.primary,
  },
  quickHourText: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  quickHourTextSelected: {
    color: Colors.primary,
    fontWeight: '700',
  },
  noteInput: {
    backgroundColor: Colors.bg,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    borderRadius: Radius.md,
    padding: Spacing.md,
    color: Colors.text,
    fontSize: 14,
    minHeight: 70,
    textAlignVertical: 'top',
    marginBottom: Spacing.xl,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
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
    color: '#090D16',
    fontSize: 15,
    fontWeight: '700',
  },
});
