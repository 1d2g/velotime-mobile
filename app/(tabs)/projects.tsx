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
  Clock,
  DollarSign,
  CheckCircle2,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTimesheet } from '@/src/context/TimesheetContext';
import { Colors, Spacing, Radius } from '@/src/constants/theme';

export default function ProjectsScreen() {
  const router = useRouter();
  const { projects, entries, startTimer } = useTimesheet();
  const [search, setSearch] = useState('');
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(projects[0]?.id || null);

  // Filter projects
  const filteredProjects = projects.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.clientName && p.clientName.toLowerCase().includes(q))
    );
  });

  // Calculate project hours logged from all entries
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
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Search Input */}
        <View style={styles.searchBar}>
          <Search color={Colors.textDim} size={18} style={{ marginRight: Spacing.sm }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search projects by name or client..."
            placeholderTextColor={Colors.textDim}
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
            clearButtonMode="while-editing"
          />
        </View>

        {/* Project List */}
        <Text style={styles.sectionHeader}>ACTIVE CLIENT PROJECTS ({filteredProjects.length})</Text>

        {filteredProjects.map((project) => {
          const isExpanded = expandedProjectId === project.id;
          const loggedHours = getProjectLoggedHours(project.name);
          const budgetHours = project.budgetHours || 160;
          const pct = Math.min(100, Math.round((loggedHours / budgetHours) * 100));

          return (
            <View key={project.id} style={styles.projectCard}>
              {/* Card Header */}
              <TouchableOpacity
                style={styles.cardHeader}
                onPress={() => setExpandedProjectId(isExpanded ? null : project.id)}
                activeOpacity={0.7}
              >
                <View style={styles.headerLeft}>
                  <Briefcase color={Colors.primary} size={18} strokeWidth={2.2} />
                  <View style={styles.titleBlock}>
                    <Text style={styles.projectName}>{project.name}</Text>
                    {project.clientName && (
                      <Text style={styles.clientName}>{project.clientName}</Text>
                    )}
                  </View>
                </View>

                {isExpanded ? (
                  <ChevronUp color={Colors.textDim} size={20} />
                ) : (
                  <ChevronDown color={Colors.textDim} size={20} />
                )}
              </TouchableOpacity>

              {/* Budget Progress Bar */}
              <View style={styles.budgetSection}>
                <View style={styles.budgetRow}>
                  <Text style={styles.budgetLabel}>
                    {loggedHours.toFixed(1)} / {budgetHours} hrs logged
                  </Text>
                  <Text style={[styles.budgetPct, pct > 90 && { color: Colors.warning }]}>
                    {pct}% of budget
                  </Text>
                </View>
                <View style={styles.progressBg}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${pct}%` },
                      pct > 90 && { backgroundColor: Colors.warning },
                    ]}
                  />
                </View>
              </View>

              {/* Expanded Tasks List */}
              {isExpanded && (
                <View style={styles.tasksContainer}>
                  <Text style={styles.tasksHeader}>TASKS & DELIVERABLES</Text>
                  {project.tasks.map((task) => (
                    <View key={task.id} style={styles.taskItem}>
                      <View style={styles.taskInfo}>
                        <Text style={styles.taskName}>{task.name}</Text>
                        <View style={styles.taskMetaRow}>
                          <Text style={styles.taskRate}>
                            ${task.hourlyRate || project.hourlyRate || 160}/hr
                          </Text>
                          <Text style={styles.taskBillable}>
                            {task.isBillable !== false ? 'Billable' : 'Internal'}
                          </Text>
                        </View>
                      </View>

                      {/* Start Timer on this Task Button */}
                      <TouchableOpacity
                        style={styles.startTaskBtn}
                        onPress={() => handleStartTimerOnTask(project.id, task.id)}
                        activeOpacity={0.8}
                      >
                        <Play color="#090D16" size={12} strokeWidth={2.8} style={{ marginRight: 4 }} />
                        <Text style={styles.startTaskBtnText}>Track</Text>
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
    backgroundColor: Colors.bg,
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
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    height: 44,
    marginBottom: Spacing.lg,
  },
  searchInput: {
    flex: 1,
    color: Colors.text,
    fontSize: 14,
  },
  sectionHeader: {
    color: Colors.textDim,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.xs,
  },
  projectCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
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
    color: Colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  clientName: {
    color: Colors.textMuted,
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
    color: Colors.textDim,
    fontSize: 11,
    fontWeight: '600',
  },
  budgetPct: {
    color: Colors.primaryText,
    fontSize: 11,
    fontWeight: '700',
  },
  progressBg: {
    height: 6,
    backgroundColor: Colors.bg,
    borderRadius: Radius.full,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
  },
  tasksContainer: {
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
    backgroundColor: Colors.bg,
    padding: Spacing.md,
  },
  tasksHeader: {
    color: Colors.textDim,
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
    borderBottomColor: Colors.borderSubtle,
  },
  taskInfo: {
    flex: 1,
    paddingRight: Spacing.md,
  },
  taskName: {
    color: Colors.text,
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
    color: Colors.textDim,
    fontSize: 11,
  },
  taskBillable: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: '600',
  },
  startTaskBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: Radius.sm,
  },
  startTaskBtnText: {
    color: '#090D16',
    fontSize: 11,
    fontWeight: '800',
  },
});
