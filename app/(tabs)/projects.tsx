import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  TextInput,
} from 'react-native';
import {
  Briefcase,
  Search,
  ChevronDown,
  ChevronUp,
  Play,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTimesheet } from '@/src/context/TimesheetContext';
import { useTheme } from '@/src/context/ThemeContext';
import { Spacing, Radius } from '@/src/constants/theme';

export default function ProjectsScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { projects, entries, startTimer } = useTimesheet();
  const [search, setSearch] = useState('');
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(projects[0]?.id || null);

  const filteredProjects = projects.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.clientName && p.clientName.toLowerCase().includes(q))
    );
  });

  const getProjectLoggedHours = (projectName: string) => {
    return entries
      .filter((e) => e.projectName === projectName)
      .reduce((sum, e) => sum + e.hours, 0);
  };

  const handleStartTimerOnTask = (projectId: string, taskId: string) => {
    startTimer(projectId, taskId);
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Search Input */}
        <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
          <Search color={colors.textDim} size={18} style={{ marginRight: Spacing.sm }} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search projects by name or client..."
            placeholderTextColor={colors.textDim}
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
            clearButtonMode="while-editing"
          />
        </View>

        {/* Project List */}
        <Text style={[styles.sectionHeader, { color: colors.textDim }]}>
          ACTIVE CLIENT PROJECTS ({filteredProjects.length})
        </Text>

        {filteredProjects.map((project) => {
          const isExpanded = expandedProjectId === project.id;
          const loggedHours = getProjectLoggedHours(project.name);
          const isTaskBudget = project.budgetType === 'TASK_HOURS';
          const taskBudgetSum = project.tasks?.reduce((sum, t) => sum + (t.budgetHours || 0), 0) || 0;
          const budgetHours = isTaskBudget ? taskBudgetSum : (project.budgetHours || project.budgetLimit || 160);
          const pct = budgetHours > 0 ? Math.min(100, Math.round((loggedHours / budgetHours) * 100)) : 0;

          return (
            <View
              key={project.id}
              style={[
                styles.projectCard,
                { backgroundColor: colors.surface, borderColor: colors.borderSubtle },
              ]}
            >
              {/* Card Header */}
              <TouchableOpacity
                style={styles.cardHeader}
                onPress={() => setExpandedProjectId(isExpanded ? null : project.id)}
                activeOpacity={0.7}
              >
                <View style={styles.headerLeft}>
                  <Briefcase color={colors.primary} size={18} strokeWidth={2.2} />
                  <View style={styles.titleBlock}>
                    <Text style={[styles.projectName, { color: colors.text }]}>{project.name}</Text>
                    {project.clientName && (
                      <Text style={[styles.clientName, { color: colors.textMuted }]}>{project.clientName}</Text>
                    )}
                  </View>
                </View>

                {isExpanded ? (
                  <ChevronUp color={colors.textDim} size={20} />
                ) : (
                  <ChevronDown color={colors.textDim} size={20} />
                )}
              </TouchableOpacity>

              {/* Budget Progress Bar */}
              <View style={styles.budgetSection}>
                <View style={styles.budgetRow}>
                  <Text style={[styles.budgetLabel, { color: colors.textDim }]}>
                    {loggedHours.toFixed(1)} / {budgetHours} hrs logged{isTaskBudget ? ' (Tasks Sum)' : ''}
                  </Text>
                  <Text style={[styles.budgetPct, { color: pct > 90 ? colors.warning : colors.primary }]}>
                    {pct}% of budget
                  </Text>
                </View>
                <View style={[styles.progressBg, { backgroundColor: colors.inputBg, borderColor: colors.borderSubtle }]}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        backgroundColor: pct > 90 ? colors.warning : colors.primary,
                        width: `${pct}%`,
                      },
                    ]}
                  />
                </View>
              </View>

              {/* Expanded Tasks List */}
              {isExpanded && (
                <View style={[styles.tasksContainer, { backgroundColor: colors.surfaceSubtle, borderTopColor: colors.borderSubtle }]}>
                  <Text style={[styles.tasksHeader, { color: colors.textDim }]}>TASKS & DELIVERABLES</Text>
                  {project.tasks.map((task) => (
                    <View key={task.id} style={[styles.taskItem, { borderBottomColor: colors.borderSubtle }]}>
                      <View style={styles.taskInfo}>
                        <Text style={[styles.taskName, { color: colors.text }]}>{task.name}</Text>
                        <View style={styles.taskMetaRow}>
                          {task.budgetHours ? (
                            <Text style={[styles.taskRate, { color: colors.textDim }]}>
                              {task.budgetHours}h budget
                            </Text>
                          ) : (
                            <Text style={[styles.taskRate, { color: colors.textDim }]}>
                              ${task.hourlyRate || project.hourlyRate || 160}/hr
                            </Text>
                          )}
                          <Text style={[styles.taskBillable, { color: colors.primary }]}>
                            {task.isBillable !== false ? 'Billable' : 'Internal'}
                          </Text>
                        </View>
                      </View>

                      {/* Start Timer on this Task Button */}
                      <TouchableOpacity
                        style={[styles.startTaskBtn, { backgroundColor: colors.primary }]}
                        onPress={() => handleStartTimerOnTask(project.id, task.id)}
                        activeOpacity={0.8}
                      >
                        <Play color="#FFFFFF" size={12} strokeWidth={2.8} style={{ marginRight: 4 }} />
                        <Text style={[styles.startTaskBtnText, { color: '#FFFFFF' }]}>Track</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    height: 44,
    marginBottom: Spacing.lg,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.xs,
  },
  projectCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: Spacing.sm,
  },
  titleBlock: {
    marginLeft: Spacing.sm,
    flex: 1,
  },
  projectName: {
    fontSize: 14,
    fontWeight: '700',
  },
  clientName: {
    fontSize: 12,
    marginTop: 2,
  },
  budgetSection: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  budgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  budgetLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  budgetPct: {
    fontSize: 11,
    fontWeight: '700',
  },
  progressBg: {
    height: 6,
    borderRadius: Radius.full,
    overflow: 'hidden',
    borderWidth: 1,
  },
  progressFill: {
    height: '100%',
    borderRadius: Radius.full,
  },
  tasksContainer: {
    borderTopWidth: 1,
    padding: Spacing.md,
  },
  tasksHeader: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  taskInfo: {
    flex: 1,
    paddingRight: Spacing.md,
  },
  taskName: {
    fontSize: 13,
    fontWeight: '600',
  },
  taskMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
    gap: Spacing.sm,
  },
  taskRate: {
    fontSize: 11,
  },
  taskBillable: {
    fontSize: 11,
    fontWeight: '600',
  },
  startTaskBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: Radius.sm,
  },
  startTaskBtnText: {
    fontSize: 11,
    fontWeight: '800',
  },
});
