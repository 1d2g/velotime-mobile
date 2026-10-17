import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  SafeAreaView,
} from 'react-native';
import { X, Search, Check, Briefcase } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { Spacing, Radius } from '../constants/theme';
import { Project } from '../services/api';

interface ProjectPickerModalProps {
  visible: boolean;
  onClose: () => void;
  projects: Project[];
  selectedProjectId: string;
  selectedTaskId: string;
  onSelect: (projectId: string, taskId: string) => void;
}

export function ProjectPickerModal({
  visible,
  onClose,
  projects,
  selectedProjectId,
  selectedTaskId,
  onSelect,
}: ProjectPickerModalProps) {
  const { colors, isDark } = useTheme();
  const [search, setSearch] = useState('');

  const filteredProjects = projects.filter((p) => {
    const q = search.toLowerCase();
    const matchesProject =
      p.name.toLowerCase().includes(q) || (p.clientName && p.clientName.toLowerCase().includes(q));
    const matchesTask = p.tasks.some((t) => t.name.toLowerCase().includes(q));
    return matchesProject || matchesTask;
  });

  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={[styles.overlay, { backgroundColor: isDark ? 'rgba(5, 8, 15, 0.85)' : 'rgba(15, 23, 42, 0.45)' }]}>
        <View style={[styles.sheet, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={[styles.title, { color: colors.text }]}>Select Project & Task</Text>
              <Text style={[styles.subtitle, { color: colors.textMuted }]}>Assign your current timer or time entry</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: colors.surfaceSubtle }]}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X color={colors.textMuted} size={20} />
            </TouchableOpacity>
          </View>

          {/* Search bar */}
          <View style={[styles.searchContainer, { backgroundColor: colors.inputBg, borderColor: colors.borderSubtle }]}>
            <Search color={colors.textDim} size={18} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search projects or tasks..."
              placeholderTextColor={colors.textDim}
              value={search}
              onChangeText={setSearch}
              autoCapitalize="none"
              clearButtonMode="while-editing"
            />
          </View>

          {/* List */}
          <ScrollView style={styles.scrollList} contentContainerStyle={styles.scrollContent}>
            {filteredProjects.map((project) => {
              const isCurrentProject = project.id === selectedProjectId;
              return (
                <View
                  key={project.id}
                  style={[styles.projectCard, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}
                >
                  <View style={[styles.projectHeader, { backgroundColor: colors.surfaceSubtle, borderBottomColor: colors.borderSubtle }]}>
                    <Briefcase color={colors.primary} size={16} strokeWidth={2.2} />
                    <View style={styles.projectNameBlock}>
                      <Text style={[styles.projectName, { color: colors.text }]}>{project.name}</Text>
                      {project.clientName && (
                        <Text style={[styles.clientName, { color: colors.textMuted }]}>{project.clientName}</Text>
                      )}
                    </View>
                  </View>

                  <View style={styles.taskList}>
                    {project.tasks.map((task) => {
                      const isSelected = isCurrentProject && task.id === selectedTaskId;
                      return (
                        <TouchableOpacity
                          key={task.id}
                          style={[
                            styles.taskItem,
                            { borderBottomColor: colors.borderSubtle },
                            isSelected && { backgroundColor: colors.primaryMuted },
                          ]}
                          onPress={() => {
                            onSelect(project.id, task.id);
                            onClose();
                          }}
                          activeOpacity={0.7}
                        >
                          <View style={styles.taskInfo}>
                            <Text
                              style={[
                                styles.taskName,
                                { color: isSelected ? colors.primary : colors.text },
                                isSelected && { fontWeight: '700' },
                              ]}
                            >
                              {task.name}
                            </Text>
                            <Text style={[styles.taskMeta, { color: colors.textDim }]}>
                              {task.isBillable !== false ? 'Billable' : 'Non-billable'}
                              {task.hourlyRate ? ` · $${task.hourlyRate}/hr` : ''}
                            </Text>
                          </View>
                          {isSelected && <Check color={colors.primary} size={18} strokeWidth={2.5} />}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              );
            })}

            {filteredProjects.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>No matching projects or tasks found.</Text>
              </View>
            )}
          </ScrollView>
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
    flex: 1,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    borderTopWidth: 1,
    paddingTop: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    height: 42,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  scrollList: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxxl,
  },
  projectCard: {
    borderRadius: Radius.md,
    borderWidth: 1,
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  projectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
  },
  projectNameBlock: {
    marginLeft: Spacing.sm,
    flex: 1,
  },
  projectName: {
    fontSize: 14,
    fontWeight: '600',
  },
  clientName: {
    fontSize: 11,
    marginTop: 1,
  },
  taskList: {
    paddingVertical: Spacing.xs,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  taskInfo: {
    flex: 1,
    paddingRight: Spacing.md,
  },
  taskName: {
    fontSize: 13,
    fontWeight: '500',
  },
  taskMeta: {
    fontSize: 11,
    marginTop: 2,
  },
  emptyState: {
    paddingVertical: Spacing.xxxl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
  },
});
