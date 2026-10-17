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
import { Colors, Spacing, Radius } from '../constants/theme';
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
  const [search, setSearch] = useState('');

  const filteredProjects = projects.filter((p) => {
    const q = search.toLowerCase();
    const matchesProject = p.name.toLowerCase().includes(q) || (p.clientName && p.clientName.toLowerCase().includes(q));
    const matchesTask = p.tasks.some((t) => t.name.toLowerCase().includes(q));
    return matchesProject || matchesTask;
  });

  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Select Project & Task</Text>
              <Text style={styles.subtitle}>Assign your current timer or time entry</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <X color={Colors.textMuted} size={20} />
            </TouchableOpacity>
          </View>

          {/* Search bar */}
          <View style={styles.searchContainer}>
            <Search color={Colors.textDim} size={18} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search projects or tasks..."
              placeholderTextColor={Colors.textDim}
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
                <View key={project.id} style={styles.projectCard}>
                  <View style={styles.projectHeader}>
                    <Briefcase color={Colors.primary} size={16} strokeWidth={2.2} />
                    <View style={styles.projectNameBlock}>
                      <Text style={styles.projectName}>{project.name}</Text>
                      {project.clientName && (
                        <Text style={styles.clientName}>{project.clientName}</Text>
                      )}
                    </View>
                  </View>

                  <View style={styles.taskList}>
                    {project.tasks.map((task) => {
                      const isSelected = isCurrentProject && task.id === selectedTaskId;
                      return (
                        <TouchableOpacity
                          key={task.id}
                          style={[styles.taskItem, isSelected && styles.taskItemSelected]}
                          onPress={() => {
                            onSelect(project.id, task.id);
                            onClose();
                          }}
                          activeOpacity={0.7}
                        >
                          <View style={styles.taskInfo}>
                            <Text style={[styles.taskName, isSelected && styles.taskNameSelected]}>
                              {task.name}
                            </Text>
                            <Text style={styles.taskMeta}>
                              {task.isBillable !== false ? 'Billable' : 'Non-billable'}
                              {task.hourlyRate ? ` · $${task.hourlyRate}/hr` : ''}
                            </Text>
                          </View>
                          {isSelected && <Check color={Colors.primary} size={18} strokeWidth={2.5} />}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              );
            })}

            {filteredProjects.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No matching projects or tasks found.</Text>
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
    backgroundColor: 'rgba(5, 8, 15, 0.85)',
    justifyContent: 'flex-end',
  },
  sheet: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg,
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    paddingHorizontal: Spacing.md,
    height: 42,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: Colors.text,
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
    backgroundColor: Colors.bg,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  projectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.surfaceSubtle,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  projectNameBlock: {
    marginLeft: Spacing.sm,
    flex: 1,
  },
  projectName: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  clientName: {
    color: Colors.textMuted,
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
    borderBottomColor: Colors.borderSubtle,
  },
  taskItemSelected: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
  },
  taskInfo: {
    flex: 1,
    paddingRight: Spacing.md,
  },
  taskName: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: '500',
  },
  taskNameSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
  taskMeta: {
    color: Colors.textDim,
    fontSize: 11,
    marginTop: 2,
  },
  emptyState: {
    paddingVertical: Spacing.xxxl,
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: 14,
  },
});
