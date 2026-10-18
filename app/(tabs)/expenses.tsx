import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  TextInput,
  Modal,
  Switch,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Receipt,
  Plus,
  Search,
  Briefcase,
  Trash2,
  Check,
  Calendar,
  X,
  Tag,
  DollarSign,
  ChevronDown,
} from 'lucide-react-native';
import { useExpenses } from '@/src/context/ExpenseContext';
import { useTimesheet } from '@/src/context/TimesheetContext';
import { useTheme } from '@/src/context/ThemeContext';
import { Spacing, Radius } from '@/src/constants/theme';
import { Expense, getLocalDateString } from '@/src/services/api';

const CATEGORIES = [
  'Travel & Site Visits',
  'Meals & Hospitality',
  'Materials & Samples',
  'Software & Tools',
  'Office Supplies',
  'Client Meeting',
  'Other',
];

export default function ExpensesScreen() {
  const { colors, isDark } = useTheme();
  const { expenses, addExpense, deleteExpense, totalExpensesAmount, billableExpensesAmount } = useExpenses();
  const { projects } = useTimesheet();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [modalVisible, setModalVisible] = useState(false);

  // Form State
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState<string>(projects[0]?.id || 'p1');
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [isBillable, setIsBillable] = useState(true);
  const [dateStr, setDateStr] = useState(getLocalDateString());
  const [projectPickerOpen, setProjectPickerOpen] = useState(false);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const matchSearch =
        search.trim() === '' ||
        e.description.toLowerCase().includes(search.toLowerCase()) ||
        (e.projectName && e.projectName.toLowerCase().includes(search.toLowerCase())) ||
        (e.clientName && e.clientName.toLowerCase().includes(search.toLowerCase()));

      const matchCategory = selectedCategory === 'All' || e.category === selectedCategory;
      return matchSearch && matchCategory;
    });
  }, [expenses, search, selectedCategory]);

  const selectedProject = projects.find((p) => p.id === projectId) || projects[0];

  const handleOpenModal = () => {
    setAmount('');
    setDescription('');
    setProjectId(projects[0]?.id || 'p1');
    setCategory(CATEGORIES[0]);
    setIsBillable(true);
    setDateStr(getLocalDateString());
    setModalVisible(true);
  };

  const handleSaveExpense = async () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid expense amount greater than $0.00.');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Missing Description', 'Please provide a brief description of the expense.');
      return;
    }

    const proj = projects.find((p) => p.id === projectId) || projects[0];

    await addExpense({
      amount: Math.round(numAmount * 100) / 100,
      description: description.trim(),
      category,
      date: dateStr,
      projectId: proj.id,
      projectName: proj.name,
      clientName: proj.clientName || 'General Client',
      isBillable,
    });

    setModalVisible(false);
  };

  const handleDeleteExpense = (id: string, desc: string, amt: number) => {
    Alert.alert(
      'Delete Expense',
      `Are you sure you want to delete "${desc}" ($${amt.toFixed(2)})?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteExpense(id);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* KPI Summary Cards */}
        <View style={styles.kpiRow}>
          <View
            style={[
              styles.kpiCard,
              { backgroundColor: colors.surface, borderColor: colors.borderSubtle },
            ]}
          >
            <Text style={[styles.kpiLabel, { color: colors.textDim }]}>TOTAL EXPENSES</Text>
            <Text style={[styles.kpiValue, { color: colors.text }]}>
              ${totalExpensesAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
            <Text style={[styles.kpiSub, { color: colors.textMuted }]}>
              {expenses.length} logged receipt{expenses.length === 1 ? '' : 's'}
            </Text>
          </View>

          <View
            style={[
              styles.kpiCard,
              { backgroundColor: colors.surface, borderColor: colors.borderSubtle },
            ]}
          >
            <Text style={[styles.kpiLabel, { color: colors.primary }]}>BILLABLE AMOUNT</Text>
            <Text style={[styles.kpiValue, { color: colors.primary }]}>
              ${billableExpensesAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
            <Text style={[styles.kpiSub, { color: colors.textMuted }]}>
              {totalExpensesAmount > 0
                ? `${Math.round((billableExpensesAmount / totalExpensesAmount) * 100)}% to client invoices`
                : '100% billable'}
            </Text>
          </View>
        </View>

        {/* Action Header & Log Expense Button */}
        <View style={styles.actionBar}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Receipts & Purchases</Text>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={handleOpenModal}
            activeOpacity={0.8}
          >
            <Plus color="#FFFFFF" size={16} strokeWidth={2.5} style={{ marginRight: 4 }} />
            <Text style={styles.addButtonText}>Log Expense</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View
          style={[
            styles.searchBar,
            { backgroundColor: colors.surface, borderColor: colors.borderSubtle },
          ]}
        >
          <Search color={colors.textDim} size={16} style={{ marginRight: Spacing.sm }} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search by description, project, or client..."
            placeholderTextColor={colors.textDim}
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
            clearButtonMode="while-editing"
          />
        </View>

        {/* Category Horizontal Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
          contentContainerStyle={styles.categoryScrollContent}
        >
          {['All', ...CATEGORIES].map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryChip,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.surface,
                    borderColor: isSelected ? colors.primary : colors.borderSubtle,
                  },
                ]}
                onPress={() => setSelectedCategory(cat)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    { color: isSelected ? '#FFFFFF' : colors.textMuted },
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Expenses List */}
        {filteredExpenses.length === 0 ? (
          <View
            style={[
              styles.emptyCard,
              { backgroundColor: colors.surface, borderColor: colors.borderSubtle },
            ]}
          >
            <Receipt color={colors.textDim} size={36} strokeWidth={1.5} style={{ marginBottom: Spacing.md }} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Expenses Recorded</Text>
            <Text style={[styles.emptyDesc, { color: colors.textMuted }]}>
              {search || selectedCategory !== 'All'
                ? 'No expenses match your search filter.'
                : 'Log travel, materials, client hospitality, and subscriptions to invoice clients.'}
            </Text>
            <TouchableOpacity
              style={[styles.emptyButton, { backgroundColor: colors.primary }]}
              onPress={handleOpenModal}
              activeOpacity={0.8}
            >
              <Plus color="#FFFFFF" size={16} strokeWidth={2.2} style={{ marginRight: 6 }} />
              <Text style={styles.emptyButtonText}>Add First Expense</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredExpenses.map((expense) => {
            return (
              <View
                key={expense.id}
                style={[
                  styles.expenseCard,
                  { backgroundColor: colors.surface, borderColor: colors.borderSubtle },
                ]}
              >
                <View style={styles.cardTopRow}>
                  <View style={styles.cardHeaderLeft}>
                    <Text style={[styles.amountText, { color: colors.text }]}>
                      ${Number(expense.amount).toFixed(2)}
                    </Text>
                    <View
                      style={[
                        styles.badge,
                        {
                          backgroundColor: expense.isBillable ? '#10B98120' : colors.surfaceSubtle,
                          borderColor: expense.isBillable ? '#10B98150' : colors.borderSubtle,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.badgeText,
                          { color: expense.isBillable ? '#059669' : colors.textMuted },
                        ]}
                      >
                        {expense.isBillable ? 'Billable' : 'Internal'}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={() => handleDeleteExpense(expense.id, expense.description, Number(expense.amount))}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    style={styles.deleteButton}
                  >
                    <Trash2 color={colors.textDim} size={15} />
                  </TouchableOpacity>
                </View>

                {/* Description */}
                <Text style={[styles.expenseDesc, { color: colors.text }]}>
                  {expense.description}
                </Text>

                {/* Project & Client */}
                <View style={styles.projectMetaRow}>
                  <Briefcase color={colors.primary} size={13} style={{ marginRight: 5 }} />
                  <Text style={[styles.projectMetaText, { color: colors.textMuted }]} numberOfLines={1}>
                    {expense.projectName || 'General Project'}
                    {expense.clientName ? ` (${expense.clientName})` : ''}
                  </Text>
                </View>

                {/* Footer: Date & Category */}
                <View style={[styles.cardFooter, { borderTopColor: colors.borderSubtle }]}>
                  <View style={styles.footerItem}>
                    <Calendar color={colors.textDim} size={12} style={{ marginRight: 4 }} />
                    <Text style={[styles.footerText, { color: colors.textDim }]}>{expense.date}</Text>
                  </View>
                  <View style={styles.footerItem}>
                    <Tag color={colors.textDim} size={12} style={{ marginRight: 4 }} />
                    <Text style={[styles.footerText, { color: colors.textDim }]}>{expense.category}</Text>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Log Expense Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            {/* Modal Header */}
            <View style={[styles.modalHeader, { borderBottomColor: colors.borderSubtle }]}>
              <View style={styles.modalHeaderLeft}>
                <Receipt color={colors.primary} size={20} strokeWidth={2.2} style={{ marginRight: 8 }} />
                <Text style={[styles.modalTitle, { color: colors.text }]}>Log New Expense</Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <X color={colors.textDim} size={20} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Amount Input */}
              <Text style={[styles.inputLabel, { color: colors.textDim }]}>AMOUNT ($ USD)</Text>
              <View
                style={[
                  styles.amountInputContainer,
                  { backgroundColor: colors.bg, borderColor: colors.borderSubtle },
                ]}
              >
                <DollarSign color={colors.primary} size={22} style={{ marginRight: 4 }} />
                <TextInput
                  style={[styles.amountInput, { color: colors.text }]}
                  placeholder="0.00"
                  placeholderTextColor={colors.textDim}
                  keyboardType="decimal-pad"
                  value={amount}
                  onChangeText={setAmount}
                  autoFocus
                />
              </View>

              {/* Description Input */}
              <Text style={[styles.inputLabel, { color: colors.textDim }]}>DESCRIPTION / NOTE</Text>
              <TextInput
                style={[
                  styles.textInput,
                  { backgroundColor: colors.bg, borderColor: colors.borderSubtle, color: colors.text },
                ]}
                placeholder="e.g. Site survey photography, client lunch, sample materials..."
                placeholderTextColor={colors.textDim}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={2}
              />

              {/* Project Selection */}
              <Text style={[styles.inputLabel, { color: colors.textDim }]}>ASSIGNED CLIENT PROJECT</Text>
              <TouchableOpacity
                style={[
                  styles.selectBox,
                  { backgroundColor: colors.bg, borderColor: colors.borderSubtle },
                ]}
                onPress={() => setProjectPickerOpen(!projectPickerOpen)}
                activeOpacity={0.7}
              >
                <View style={styles.selectBoxLeft}>
                  <Briefcase color={colors.primary} size={16} style={{ marginRight: 8 }} />
                  <Text style={[styles.selectBoxText, { color: colors.text }]} numberOfLines={1}>
                    {selectedProject.name}
                  </Text>
                </View>
                <ChevronDown color={colors.textDim} size={16} />
              </TouchableOpacity>

              {/* Project Options List if open */}
              {projectPickerOpen && (
                <View
                  style={[
                    styles.dropdownList,
                    { backgroundColor: colors.surfaceSubtle, borderColor: colors.borderSubtle },
                  ]}
                >
                  {projects.map((p) => {
                    const isSelected = p.id === projectId;
                    return (
                      <TouchableOpacity
                        key={p.id}
                        style={[
                          styles.dropdownItem,
                          isSelected && { backgroundColor: `${colors.primary}15` },
                        ]}
                        onPress={() => {
                          setProjectId(p.id);
                          setProjectPickerOpen(false);
                        }}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.dropdownItemTitle, { color: colors.text }]}>{p.name}</Text>
                          {p.clientName && (
                            <Text style={[styles.dropdownItemSub, { color: colors.textMuted }]}>
                              {p.clientName}
                            </Text>
                          )}
                        </View>
                        {isSelected && <Check color={colors.primary} size={16} />}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {/* Category Chips */}
              <Text style={[styles.inputLabel, { color: colors.textDim }]}>EXPENSE CATEGORY</Text>
              <View style={styles.categoryChipGrid}>
                {CATEGORIES.map((cat) => {
                  const isSelected = category === cat;
                  return (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.formCategoryChip,
                        {
                          backgroundColor: isSelected ? colors.primary : colors.bg,
                          borderColor: isSelected ? colors.primary : colors.borderSubtle,
                        },
                      ]}
                      onPress={() => setCategory(cat)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.formCategoryChipText,
                          { color: isSelected ? '#FFFFFF' : colors.textMuted },
                        ]}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Date Input */}
              <Text style={[styles.inputLabel, { color: colors.textDim }]}>EXPENSE DATE (YYYY-MM-DD)</Text>
              <TextInput
                style={[
                  styles.textInput,
                  { backgroundColor: colors.bg, borderColor: colors.borderSubtle, color: colors.text },
                ]}
                value={dateStr}
                onChangeText={setDateStr}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textDim}
              />

              {/* Billable Toggle */}
              <View style={[styles.switchRow, { borderColor: colors.borderSubtle }]}>
                <View>
                  <Text style={[styles.switchTitle, { color: colors.text }]}>Billable to Client</Text>
                  <Text style={[styles.switchSubtitle, { color: colors.textMuted }]}>
                    Include this receipt on future client invoices
                  </Text>
                </View>
                <Switch
                  value={isBillable}
                  onValueChange={setIsBillable}
                  trackColor={{ false: colors.borderSubtle, true: colors.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </ScrollView>

            {/* Modal Actions */}
            <View style={[styles.modalFooter, { borderTopColor: colors.borderSubtle }]}>
              <TouchableOpacity
                style={[styles.cancelBtn, { borderColor: colors.borderSubtle }]}
                onPress={() => setModalVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={[styles.cancelBtnText, { color: colors.textMuted }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: colors.primary }]}
                onPress={handleSaveExpense}
                activeOpacity={0.8}
              >
                <Check color="#FFFFFF" size={16} strokeWidth={2.5} style={{ marginRight: 6 }} />
                <Text style={styles.saveBtnText}>Save Expense</Text>
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
  kpiRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  kpiCard: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: Radius.sm,
    borderWidth: 1,
  },
  kpiLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  kpiValue: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  kpiSub: {
    fontSize: 11,
    fontWeight: '500',
  },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: Radius.xs,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.xs,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    padding: 0,
  },
  categoryScroll: {
    marginBottom: Spacing.md,
  },
  categoryScrollContent: {
    gap: 6,
  },
  categoryChip: {
    paddingVertical: 5,
    paddingHorizontal: 11,
    borderRadius: Radius.xs,
    borderWidth: 1,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyCard: {
    padding: Spacing.xl,
    borderRadius: Radius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.md,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptyDesc: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: Spacing.lg,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: Radius.xs,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  expenseCard: {
    padding: Spacing.md,
    borderRadius: Radius.sm,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  amountText: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  badge: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: Radius.xs,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  deleteButton: {
    padding: 4,
  },
  expenseDesc: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    lineHeight: 19,
  },
  projectMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  projectMetaText: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 11,
    fontWeight: '500',
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
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
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
    marginBottom: 6,
    marginTop: 10,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.xs,
    borderWidth: 1,
    height: 48,
  },
  amountInput: {
    flex: 1,
    fontSize: 22,
    fontWeight: '800',
  },
  textInput: {
    borderWidth: 1,
    borderRadius: Radius.xs,
    padding: Spacing.sm,
    fontSize: 13,
  },
  selectBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: Radius.xs,
    padding: Spacing.sm,
    height: 42,
  },
  selectBoxLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  selectBoxText: {
    fontSize: 13,
    fontWeight: '600',
  },
  dropdownList: {
    borderWidth: 1,
    borderRadius: Radius.xs,
    marginTop: 4,
    marginBottom: 6,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.sm,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(150,150,150,0.15)',
  },
  dropdownItemTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  dropdownItemSub: {
    fontSize: 11,
  },
  categoryChipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  formCategoryChip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: Radius.xs,
    borderWidth: 1,
  },
  formCategoryChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: Spacing.md,
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  switchTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  switchSubtitle: {
    fontSize: 11,
    marginTop: 2,
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
    fontSize: 14,
    fontWeight: '600',
  },
  saveBtn: {
    flex: 2,
    flexDirection: 'row',
    paddingVertical: 12,
    borderRadius: Radius.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
