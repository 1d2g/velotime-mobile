import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  TextInput,
  Modal,
  Alert,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Briefcase,
  Search,
  ChevronDown,
  ChevronUp,
  Play,
  Plus,
  X,
  Check,
  Layers,
  Edit3,
  Trash2,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTimesheet } from '@/src/context/TimesheetContext';
import { useTheme } from '@/src/context/ThemeContext';
import { Spacing, Radius } from '@/src/constants/theme';
import { Project, Task } from '@/src/services/api';

export default function ProjectsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const {
    projects,
    entries,
    startTimer,
    addProject,
    editProject,
    deleteProject,
    addTaskToProject,
    editTask,
    deleteTask,
  } = useTimesheet();
  const [search, setSearch] = useState('');
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(projects[0]?.id || null);

  // Project Modal State (Create or Edit)
  const [newProjectModalVisible, setNewProjectModalVisible] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [newProjectName, setNewProjectName] = useState('');
  const [newClientName, setNewClientName] = useState('');
  const [newHourlyRate, setNewHourlyRate] = useState('165');
  const [newBudgetType, setNewBudgetType] = useState<'PROJECT_HOURS' | 'TASK_HOURS'>('PROJECT_HOURS');
  const [newBudgetHours, setNewBudgetHours] = useState('120');
  const [newInitialTask, setNewInitialTask] = useState('General Consultation & Design');

  // Task Modal State (Add or Edit)
  const [addTaskModalVisible, setAddTaskModalVisible] = useState(false);
  const [targetProjectIdForTask, setTargetProjectIdForTask] = useState<string | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskRate, setNewTaskRate] = useState('165');
  const [newTaskBudgetHours, setNewTaskBudgetHours] = useState('40');
  const [newTaskBillable, setNewTaskBillable] = useState(true);

  const filteredProjects = projects.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.clientName && p.clientName.toLowerCase().includes(q))
    );
  });

  const getProjectLoggedHours = (project: Project) => {
    const taskIds = new Set(project.tasks.map((t) => t.id));
    return entries
      .filter(
        (e) =>
          e.projectId === project.id ||
          taskIds.has(e.taskId) ||
          (e.projectName && e.projectName.toLowerCase() === project.name.toLowerCase())
      )
      .reduce((sum, e) => sum + e.hours, 0);
  };

  const handleStartTimerOnTask = (projectId: string, taskId: string) => {
    startTimer(projectId, taskId);
    router.replace('/(tabs)');
  };

  const handleOpenAddProject = () => {
    setEditingProjectId(null);
    setNewProjectName('');
    setNewClientName('');
    setNewHourlyRate('165');
    setNewBudgetType('PROJECT_HOURS');
    setNewBudgetHours('120');
    setNewInitialTask('General Consultation & Design');
    setNewProjectModalVisible(true);
  };

  const handleOpenEditProject = (project: Project) => {
    setEditingProjectId(project.id);
    setNewProjectName(project.name);
    setNewClientName(project.clientName || '');
    setNewHourlyRate(String(project.hourlyRate || 165));
    setNewBudgetType(project.budgetType === 'TASK_HOURS' ? 'TASK_HOURS' : 'PROJECT_HOURS');
    setNewBudgetHours(String(project.budgetHours || project.budgetLimit || 120));
    setNewProjectModalVisible(true);
  };

  const handleDeleteProjectConfirm = (project: Project) => {
    Alert.alert('Delete Project', `Remove "${project.name}" and its tasks?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteProject(project.id),
      },
    ]);
  };

  const handleSaveProject = async () => {
    if (!newProjectName.trim()) {
      Alert.alert('Missing Project Name', 'Please provide a name for this project.');
      return;
    }
    const rate = parseFloat(newHourlyRate) || 165;
    const bHours = parseFloat(newBudgetHours) || 100;

    if (editingProjectId) {
      await editProject(editingProjectId, {
        name: newProjectName.trim(),
        clientName: newClientName.trim() || 'General Client',
        hourlyRate: rate,
        budgetHours: bHours,
        budget: bHours * rate,
        budgetType: newBudgetType,
      });
    } else {
      await addProject({
        name: newProjectName.trim(),
        clientName: newClientName.trim() || 'General Client',
        hourlyRate: rate,
        budgetHours: bHours,
        budget: bHours * rate,
        budgetType: newBudgetType,
        tasks: [
          {
            name: newInitialTask.trim() || 'General Work',
            hourlyRate: rate,
            isBillable: true,
            budgetHours: newBudgetType === 'TASK_HOURS' ? bHours : undefined,
          },
        ],
      });
    }

    setNewProjectModalVisible(false);
    setEditingProjectId(null);
  };

  const handleOpenAddTask = (projectId: string, projectRate?: number) => {
    setTargetProjectIdForTask(projectId);
    setEditingTaskId(null);
    setNewTaskName('');
    setNewTaskRate(String(projectRate || 165));
    setNewTaskBudgetHours('30');
    setNewTaskBillable(true);
    setAddTaskModalVisible(true);
  };

  const handleOpenEditTask = (projectId: string, task: Task, projectRate?: number) => {
    setTargetProjectIdForTask(projectId);
    setEditingTaskId(task.id);
    setNewTaskName(task.name);
    setNewTaskRate(String(task.hourlyRate || projectRate || 165));
    setNewTaskBudgetHours(String(task.budgetHours || ''));
    setNewTaskBillable(task.isBillable !== false);
    setAddTaskModalVisible(true);
  };

  const handleDeleteTaskConfirm = (projectId: string, task: Task) => {
    Alert.alert('Delete Task', `Remove "${task.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteTask(projectId, task.id),
      },
    ]);
  };

  const handleSaveTask = async () => {
    if (!targetProjectIdForTask) return;
    if (!newTaskName.trim()) {
      Alert.alert('Missing Task Name', 'Please provide a title for this deliverable task.');
      return;
    }

    const rate = parseFloat(newTaskRate) || 165;
    const bHours = parseFloat(newTaskBudgetHours) || 0;

    if (editingTaskId) {
      await editTask(targetProjectIdForTask, editingTaskId, {
        name: newTaskName.trim(),
        hourlyRate: rate,
        isBillable: newTaskBillable,
        budgetHours: bHours > 0 ? bHours : undefined,
      });
    } else {
      await addTaskToProject(targetProjectIdForTask, {
        name: newTaskName.trim(),
        hourlyRate: rate,
        isBillable: newTaskBillable,
        budgetHours: bHours > 0 ? bHours : undefined,
      });
    }

    setAddTaskModalVisible(false);
    setEditingTaskId(null);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Top Header with Create Project Action */}
        <View style={styles.actionBar}>
          <Text style={[styles.sectionHeader, { color: colors.text }]}>
            Client Projects ({filteredProjects.length})
          </Text>
          <TouchableOpacity
            style={[styles.newProjectBtn, { backgroundColor: colors.primary }]}
            onPress={handleOpenAddProject}
            activeOpacity={0.8}
          >
            <Plus color="#FFFFFF" size={15} strokeWidth={2.5} style={{ marginRight: 4 }} />
            <Text style={styles.newProjectBtnText}>New Project</Text>
          </TouchableOpacity>
        </View>

        {/* Search Input */}
        <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
          <Search color={colors.textDim} size={16} style={{ marginRight: Spacing.sm }} />
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

        {filteredProjects.map((project) => {
          const isExpanded = expandedProjectId === project.id;
          const loggedHours = getProjectLoggedHours(project);
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
                  <ChevronUp color={colors.textDim} size={18} />
                ) : (
                  <ChevronDown color={colors.textDim} size={18} />
                )}
              </TouchableOpacity>

              {/* Budget Progress Bar */}
              <View style={styles.budgetSection}>
                <View style={styles.budgetRow}>
                  <Text style={[styles.budgetLabel, { color: colors.textDim }]}>
                    {loggedHours.toFixed(1)} / {budgetHours} hrs logged{isTaskBudget ? ' (Task Sum)' : ''}
                  </Text>
                  <Text style={[styles.budgetPct, { color: pct > 90 ? '#E11D48' : colors.primary }]}>
                    {pct}% of budget
                  </Text>
                </View>
                <View style={[styles.progressBg, { backgroundColor: colors.surfaceSubtle }]}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        backgroundColor: pct > 90 ? '#E11D48' : colors.primary,
                        width: `${pct}%`,
                      },
                    ]}
                  />
                </View>
              </View>

              {/* Expanded Tasks List */}
              {isExpanded && (
                <View
                  style={[
                    styles.tasksContainer,
                    { backgroundColor: colors.surfaceSubtle, borderTopColor: colors.borderSubtle },
                  ]}
                >
                  <View style={styles.tasksHeaderRow}>
                    <Text style={[styles.tasksHeader, { color: colors.textDim }]}>
                      TASKS & DELIVERABLES ({project.tasks.length})
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <TouchableOpacity
                        style={styles.addTaskInlineBtn}
                        onPress={() => handleOpenAddTask(project.id, project.hourlyRate)}
                        activeOpacity={0.7}
                      >
                        <Plus color={colors.primary} size={13} strokeWidth={2.5} style={{ marginRight: 3 }} />
                        <Text style={[styles.addTaskInlineText, { color: colors.primary }]}>Add Task</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleOpenEditProject(project)}
                        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                      >
                        <Edit3 color={colors.textMuted} size={14} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDeleteProjectConfirm(project)}
                        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                      >
                        <Trash2 color={colors.danger} size={14} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {project.tasks.map((task) => (
                    <View key={task.id} style={[styles.taskItem, { borderBottomColor: colors.borderSubtle }]}>
                      <TouchableOpacity
                        style={styles.taskInfo}
                        onPress={() => handleOpenEditTask(project.id, task, project.hourlyRate)}
                        activeOpacity={0.7}
                      >
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
                      </TouchableOpacity>

                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <TouchableOpacity
                          onPress={() => handleDeleteTaskConfirm(project.id, task)}
                          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                        >
                          <Trash2 color={colors.textDim} size={13} />
                        </TouchableOpacity>
                        {/* Start Timer on this Task Button */}
                        <TouchableOpacity
                          style={[styles.startTaskBtn, { backgroundColor: colors.primary }]}
                          onPress={() => handleStartTimerOnTask(project.id, task.id)}
                          activeOpacity={0.8}
                        >
                          <Play color="#FFFFFF" size={11} strokeWidth={2.8} style={{ marginRight: 4 }} />
                          <Text style={styles.startTaskBtnText}>Track</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* Create New Project Modal */}
      <Modal visible={newProjectModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.borderSubtle }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Briefcase color={colors.primary} size={18} strokeWidth={2.2} style={{ marginRight: 8 }} />
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  {editingProjectId ? 'Edit Project' : 'Create New Project'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setNewProjectModalVisible(false)}>
                <X color={colors.textDim} size={20} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={[styles.inputLabel, { color: colors.textDim }]}>PROJECT NAME</Text>
              <TextInput
                style={[
                  styles.textInput,
                  { backgroundColor: colors.bg, borderColor: colors.borderSubtle, color: colors.text },
                ]}
                placeholder="e.g. Tribeca Commercial Loft Renovation"
                placeholderTextColor={colors.textDim}
                value={newProjectName}
                onChangeText={setNewProjectName}
                autoFocus
              />

              <Text style={[styles.inputLabel, { color: colors.textDim }]}>CLIENT ACCOUNT NAME</Text>
              <TextInput
                style={[
                  styles.textInput,
                  { backgroundColor: colors.bg, borderColor: colors.borderSubtle, color: colors.text },
                ]}
                placeholder="e.g. Soho Realty Partners"
                placeholderTextColor={colors.textDim}
                value={newClientName}
                onChangeText={setNewClientName}
              />

              <View style={styles.formRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.inputLabel, { color: colors.textDim }]}>HOURLY RATE ($/HR)</Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      { backgroundColor: colors.bg, borderColor: colors.borderSubtle, color: colors.text },
                    ]}
                    keyboardType="numeric"
                    value={newHourlyRate}
                    onChangeText={setNewHourlyRate}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.inputLabel, { color: colors.textDim }]}>BUDGET HOURS</Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      { backgroundColor: colors.bg, borderColor: colors.borderSubtle, color: colors.text },
                    ]}
                    keyboardType="numeric"
                    value={newBudgetHours}
                    onChangeText={setNewBudgetHours}
                  />
                </View>
              </View>

              <Text style={[styles.inputLabel, { color: colors.textDim }]}>BUDGET ARCHITECTURE</Text>
              <View style={styles.budgetTypeRow}>
                <TouchableOpacity
                  style={[
                    styles.budgetTypeChip,
                    {
                      backgroundColor: newBudgetType === 'PROJECT_HOURS' ? colors.primary : colors.bg,
                      borderColor: newBudgetType === 'PROJECT_HOURS' ? colors.primary : colors.borderSubtle,
                    },
                  ]}
                  onPress={() => setNewBudgetType('PROJECT_HOURS')}
                >
                  <Text
                    style={[
                      styles.budgetTypeChipText,
                      { color: newBudgetType === 'PROJECT_HOURS' ? '#FFFFFF' : colors.textMuted },
                    ]}
                  >
                    Project-Level Cap
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.budgetTypeChip,
                    {
                      backgroundColor: newBudgetType === 'TASK_HOURS' ? colors.primary : colors.bg,
                      borderColor: newBudgetType === 'TASK_HOURS' ? colors.primary : colors.borderSubtle,
                    },
                  ]}
                  onPress={() => setNewBudgetType('TASK_HOURS')}
                >
                  <Text
                    style={[
                      styles.budgetTypeChipText,
                      { color: newBudgetType === 'TASK_HOURS' ? '#FFFFFF' : colors.textMuted },
                    ]}
                  >
                    Task-Level Sum
                  </Text>
                </TouchableOpacity>
              </View>

              {!editingProjectId && (
                <>
                  <Text style={[styles.inputLabel, { color: colors.textDim }]}>INITIAL TASK DELIVERABLE</Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      { backgroundColor: colors.bg, borderColor: colors.borderSubtle, color: colors.text },
                    ]}
                    placeholder="e.g. Schematic Architecture & CAD"
                    placeholderTextColor={colors.textDim}
                    value={newInitialTask}
                    onChangeText={setNewInitialTask}
                  />
                </>
              )}
            </ScrollView>

            <View style={[styles.modalFooter, { borderTopColor: colors.borderSubtle }]}>
              <TouchableOpacity
                style={[styles.cancelBtn, { borderColor: colors.borderSubtle }]}
                onPress={() => setNewProjectModalVisible(false)}
              >
                <Text style={[styles.cancelBtnText, { color: colors.textMuted }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: colors.primary }]}
                onPress={handleSaveProject}
              >
                <Check color="#FFFFFF" size={16} strokeWidth={2.5} style={{ marginRight: 4 }} />
                <Text style={styles.saveBtnText}>Save Project</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Add Task Modal */}
      <Modal visible={addTaskModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.borderSubtle }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Layers color={colors.primary} size={18} strokeWidth={2.2} style={{ marginRight: 8 }} />
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  {editingTaskId ? 'Edit Project Task' : 'Add Project Task'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setAddTaskModalVisible(false)}>
                <X color={colors.textDim} size={20} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={[styles.inputLabel, { color: colors.textDim }]}>TASK / DELIVERABLE TITLE</Text>
              <TextInput
                style={[
                  styles.textInput,
                  { backgroundColor: colors.bg, borderColor: colors.borderSubtle, color: colors.text },
                ]}
                placeholder="e.g. Structural Engineering Peer Review"
                placeholderTextColor={colors.textDim}
                value={newTaskName}
                onChangeText={setNewTaskName}
                autoFocus
              />

              <View style={styles.formRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.inputLabel, { color: colors.textDim }]}>TASK HOURLY RATE ($)</Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      { backgroundColor: colors.bg, borderColor: colors.borderSubtle, color: colors.text },
                    ]}
                    keyboardType="numeric"
                    value={newTaskRate}
                    onChangeText={setNewTaskRate}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.inputLabel, { color: colors.textDim }]}>BUDGET HOURS</Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      { backgroundColor: colors.bg, borderColor: colors.borderSubtle, color: colors.text },
                    ]}
                    keyboardType="numeric"
                    value={newTaskBudgetHours}
                    onChangeText={setNewTaskBudgetHours}
                  />
                </View>
              </View>

              <View style={[styles.switchRow, { borderColor: colors.borderSubtle }]}>
                <View>
                  <Text style={[styles.switchTitle, { color: colors.text }]}>Billable to Client</Text>
                  <Text style={[styles.switchSub, { color: colors.textMuted }]}>Include on invoices</Text>
                </View>
                <Switch
                  value={newTaskBillable}
                  onValueChange={setNewTaskBillable}
                  trackColor={{ false: colors.borderSubtle, true: colors.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>

            <View style={[styles.modalFooter, { borderTopColor: colors.borderSubtle }]}>
              <TouchableOpacity
                style={[styles.cancelBtn, { borderColor: colors.borderSubtle }]}
                onPress={() => setAddTaskModalVisible(false)}
              >
                <Text style={[styles.cancelBtnText, { color: colors.textMuted }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: colors.primary }]}
                onPress={handleSaveTask}
              >
                <Check color="#FFFFFF" size={16} strokeWidth={2.5} style={{ marginRight: 4 }} />
                <Text style={styles.saveBtnText}>{editingTaskId ? 'Save Task' : 'Add Task'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
    padding: Spacing.md,
    paddingBottom: Spacing.xxl * 2,
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sectionHeader: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  newProjectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: Radius.xs,
  },
  newProjectBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Radius.xs,
    paddingHorizontal: Spacing.md,
    height: 42,
    marginBottom: Spacing.md,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
  },
  projectCard: {
    borderRadius: Radius.xs,
    borderWidth: 1,
    marginBottom: Spacing.sm,
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
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  tasksContainer: {
    borderTopWidth: 1,
    padding: Spacing.md,
  },
  tasksHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  tasksHeader: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  addTaskInlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  addTaskInlineText: {
    fontSize: 11,
    fontWeight: '700',
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
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
    borderRadius: Radius.xs,
  },
  startTaskBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: Radius.md,
    borderTopRightRadius: Radius.md,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  modalBody: {
    padding: Spacing.md,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 5,
    marginTop: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: Radius.xs,
    padding: Spacing.sm,
    fontSize: 13,
  },
  formRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  budgetTypeRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  budgetTypeChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: Radius.xs,
    borderWidth: 1,
    alignItems: 'center',
  },
  budgetTypeChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.md,
    marginTop: Spacing.sm,
    borderTopWidth: 1,
  },
  switchTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  switchSub: {
    fontSize: 11,
    marginTop: 1,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderTopWidth: 1,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: Radius.xs,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  saveBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: Radius.xs,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
