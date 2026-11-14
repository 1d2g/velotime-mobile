import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Switch,
  TextInput,
  Modal,
  Share,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import * as Haptics from 'expo-haptics';
import {
  User,
  Building,
  RefreshCw,
  LogOut,
  Wifi,
  WifiOff,
  ChevronRight,
  Sun,
  Moon,
  Monitor,
  Check,
  Briefcase,
  BarChart3,
  ScanFace,
  KeyRound,
  Trash2,
  ExternalLink,
  FileText,
  HelpCircle,
  Lock,
  Plug,
  Share2,
  X,
  Sliders,
} from 'lucide-react-native';
import { useAuth } from '@/src/context/AuthContext';
import { useTimesheet } from '@/src/context/TimesheetContext';
import { useExpenses } from '@/src/context/ExpenseContext';
import { useTheme } from '@/src/context/ThemeContext';
import {
  Spacing,
  Radius,
  ThemeMode,
  AccentTheme,
  ACCENT_PALETTES,
} from '@/src/constants/theme';

interface IntegrationConnector {
  id: string;
  name: string;
  category: 'Issue Tracker' | 'Accounting' | 'Messaging' | 'Automation';
  description: string;
  placeholder: string;
}

const INTEGRATIONS_CATALOG: IntegrationConnector[] = [
  {
    id: 'linear',
    name: 'Linear',
    category: 'Issue Tracker',
    description: 'Sync active sprint issues directly into mobile project tasks.',
    placeholder: 'lin_api_...',
  },
  {
    id: 'github',
    name: 'GitHub',
    category: 'Issue Tracker',
    description: 'Link commits and pull requests to billable engineering tasks.',
    placeholder: 'ghp_...',
  },
  {
    id: 'jira',
    name: 'Jira Cloud',
    category: 'Issue Tracker',
    description: 'Import assigned Jira issues and sync logged worklogs.',
    placeholder: 'your-domain.atlassian.net',
  },
  {
    id: 'asana',
    name: 'Asana',
    category: 'Issue Tracker',
    description: 'Turn Asana tasks into one-tap timer targets.',
    placeholder: 'Asana Personal Access Token',
  },
  {
    id: 'basecamp',
    name: 'Basecamp',
    category: 'Issue Tracker',
    description: 'Sync client to-dos and milestones for studio projects.',
    placeholder: 'Basecamp Account ID',
  },
  {
    id: 'slack',
    name: 'Slack',
    category: 'Messaging',
    description: 'Broadcast active timer status and weekly timesheet reminders.',
    placeholder: 'https://hooks.slack.com/services/...',
  },
  {
    id: 'quickbooks',
    name: 'QuickBooks Online',
    category: 'Accounting',
    description: 'Sync billable invoices, clients, and chart of accounts.',
    placeholder: 'Realm / Company ID',
  },
  {
    id: 'toggl',
    name: 'Toggl Track Import',
    category: 'Automation',
    description: 'Import legacy workspaces, projects, and historical time logs.',
    placeholder: 'Toggl API Token',
  },
  {
    id: 'harvest',
    name: 'Harvest Import',
    category: 'Automation',
    description: 'Migrate clients, retainers, and team rate cards seamlessly.',
    placeholder: 'Harvest Access Token',
  },
  {
    id: 'zapier',
    name: 'Zapier Webhooks',
    category: 'Automation',
    description: 'Trigger Zaps on every new time entry, approval, or paid invoice.',
    placeholder: 'https://hooks.zapier.com/hooks/catch/...',
  },
];

const CONNECTOR_STORAGE_KEY = 'velotime_mobile_connectors_v1';

export default function SettingsScreen() {
  const { colors, mode, setMode, accent, setAccent } = useTheme();
  const {
    user,
    token,
    isDemoMode,
    syncStatus,
    enterDemoMode,
    signOut,
    deleteAccount,
    previewRole,
    setPreviewRole,
    isBiometricSupported,
    biometricLabel,
    biometricEnabled,
    setBiometricEnabled,
    authenticateWithFaceId,
    orgSettings,
    updateOrgSettings,
    setAuthModalOpen,
  } = useAuth();
  const { refreshData, entries } = useTimesheet();
  const { expenses } = useExpenses();

  const [isRefreshing, setIsRefreshing] = useState(false);

  // Organization Settings Edit Modal
  const [orgModalVisible, setOrgModalVisible] = useState(false);
  const [draftOrgName, setDraftOrgName] = useState(orgSettings.orgName);
  const [draftInvoicePrefix, setDraftInvoicePrefix] = useState(orgSettings.invoicePrefix);

  // Integrations Hub Modal State
  const [connectedMap, setConnectedMap] = useState<Record<string, string>>({});
  const [activeConnector, setActiveConnector] = useState<IntegrationConnector | null>(null);
  const [connectorCredential, setConnectorCredential] = useState('');

  useEffect(() => {
    AsyncStorage.getItem(CONNECTOR_STORAGE_KEY)
      .then((raw) => {
        if (raw) setConnectedMap(JSON.parse(raw));
      })
      .catch(() => {});
  }, []);

  const handleManualSync = async () => {
    setIsRefreshing(true);
    try {
      await refreshData();
      Alert.alert('Sync Complete', 'Projects and timesheets are up to date with the server.');
    } catch {
      Alert.alert('Sync Offline', 'Could not reach server. Offline entries are cached locally.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleToggleBiometrics = async (value: boolean) => {
    const ok = await setBiometricEnabled(value);
    if (!ok && value) {
      Alert.alert(
        `${biometricLabel} Unavailable`,
        `Please ensure ${biometricLabel} is enrolled on your device and try again.`
      );
    } else if (ok && value) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleTestFaceId = async () => {
    const ok = await authenticateWithFaceId();
    if (ok) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(`${biometricLabel} Verified`, 'Your Keychain workspace session is authenticated.');
    } else {
      Alert.alert(`${biometricLabel} Cancelled`, 'Biometric verification did not complete.');
    }
  };

  const handleExportAccountingCSV = async (preset: 'quickbooks' | 'xero' | 'adp' | 'universal') => {
    const rows: string[] = [];
    let title = 'VeloTime Export';

    if (preset === 'quickbooks') {
      title = 'QuickBooks Time Activity CSV';
      rows.push('Date,Employee,Customer:Project,ServiceItem,Hours,Billable,Notes');
      entries.forEach((e) => {
        rows.push(
          `${e.date},"${user?.firstName || 'Studio'} ${user?.lastName || ''}","${e.clientName || 'Client'}:${e.projectName || 'Project'}","${e.taskName || 'Services'}",${e.hours},${e.isBillable !== false ? 'Yes' : 'No'},"${(e.note || '').replace(/"/g, '""')}"`
        );
      });
    } else if (preset === 'xero') {
      title = 'Xero Billable Time & Expenses CSV';
      rows.push('ContactName,ProjectName,TaskName,Date,Quantity,Billable,Description');
      entries.forEach((e) => {
        rows.push(
          `"${e.clientName || 'Client'}","${e.projectName || 'Project'}","${e.taskName || 'Task'}",${e.date},${e.hours},${e.isBillable !== false ? 'True' : 'False'},"${(e.note || '').replace(/"/g, '""')}"`
        );
      });
      expenses.forEach((ex) => {
        rows.push(
          `"${ex.clientName || 'Client'}","${ex.projectName || 'Project'}","Expense: ${ex.category}",${ex.date},${ex.amount},${ex.isBillable ? 'True' : 'False'},"${ex.description.replace(/"/g, '""')}"`
        );
      });
    } else if (preset === 'adp') {
      title = 'ADP Payroll Batch CSV';
      const totalHrs = entries.reduce((s, e) => s + e.hours, 0);
      rows.push('CompanyCode,FileNumber,EmployeeName,RegularHours,BillableHours');
      const billHrs = entries.filter((e) => e.isBillable !== false).reduce((s, e) => s + e.hours, 0);
      rows.push(
        `VT01,1001,"${user?.firstName || 'Studio'} ${user?.lastName || 'Partner'}",${totalHrs.toFixed(2)},${billHrs.toFixed(2)}`
      );
    } else {
      title = 'Universal VeloTime Timesheet Ledger CSV';
      rows.push('Date,Client,Project,Task,Hours,Billable,Notes');
      entries.forEach((e) => {
        rows.push(
          `${e.date},"${e.clientName || ''}","${e.projectName || ''}","${e.taskName || ''}",${e.hours},${e.isBillable !== false ? 'Yes' : 'No'},"${(e.note || '').replace(/"/g, '""')}"`
        );
      });
    }

    try {
      await Share.share({
        title,
        message: rows.join('\n'),
      });
    } catch {}
  };

  const handleOpenConnector = (connector: IntegrationConnector) => {
    setActiveConnector(connector);
    setConnectorCredential(connectedMap[connector.id] || '');
  };

  const handleSaveConnector = async () => {
    if (!activeConnector) return;
    if (!connectorCredential.trim()) {
      const next = { ...connectedMap };
      delete next[activeConnector.id];
      setConnectedMap(next);
      await AsyncStorage.setItem(CONNECTOR_STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      setActiveConnector(null);
      return;
    }
    const next = { ...connectedMap, [activeConnector.id]: connectorCredential.trim() };
    setConnectedMap(next);
    await AsyncStorage.setItem(CONNECTOR_STORAGE_KEY, JSON.stringify(next)).catch(() => {});
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setActiveConnector(null);
  };

  const handleSaveOrgSettings = async () => {
    await updateOrgSettings({
      orgName: draftOrgName.trim() || 'Metropolis Architecture Studio',
      invoicePrefix: draftInvoicePrefix.trim() || 'INV-2026-',
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setOrgModalVisible(false);
  };

  const handleToggleDemo = () => {
    if (isDemoMode) {
      setAuthModalOpen(true);
    } else {
      Alert.alert(
        'Switch to Demo Studio',
        'Switch to the interactive Metropolis Architecture Studio sandbox?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Enter Demo', onPress: enterDemoMode },
        ]
      );
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Sign out of this workspace session on this device?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account & Erase Data',
      'This will permanently remove your local workspace credentials, saved Keychain tokens, and request account deletion. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: async () => {
            await deleteAccount();
          },
        },
      ]
    );
  };

  const openExternalUrl = async (url: string) => {
    try {
      await WebBrowser.openBrowserAsync(url);
    } catch {}
  };

  const themeOptions: { key: ThemeMode; label: string; icon: any }[] = [
    { key: 'dark', label: 'Dark', icon: Moon },
    { key: 'light', label: 'Light', icon: Sun },
    { key: 'system', label: 'System', icon: Monitor },
  ];

  const roundingOptions: Array<0 | 5 | 6 | 15> = [0, 5, 6, 15];
  const connectedCount = Object.keys(connectedMap).length;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* User / Workspace Card */}
        <View style={[styles.profileCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.avatar, { backgroundColor: colors.primaryMuted, borderColor: colors.primary }]}>
            <User color={colors.primary} size={24} strokeWidth={2.2} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.userName, { color: colors.text }]}>
              {user?.firstName ? `${user.firstName} ${user.lastName || ''}` : 'Active Studio Member'}
            </Text>
            <Text style={[styles.userEmail, { color: colors.textMuted }]}>
              {user?.email || 'demo@velotime.com'}
            </Text>
            <View style={styles.orgRow}>
              <Building color={colors.textDim} size={13} style={{ marginRight: 4 }} />
              <Text style={[styles.orgName, { color: colors.primary }]}>
                {orgSettings.orgName || user?.organization?.name || 'Metropolis Studio'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.switchAccountBtn, { backgroundColor: colors.surfaceSubtle, borderColor: colors.borderSubtle }]}
            onPress={() => setAuthModalOpen(true)}
          >
            <KeyRound color={colors.primary} size={14} />
            <Text style={[styles.switchAccountText, { color: colors.primary }]}>
              {isDemoMode ? 'Sign In' : 'Switch'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Security & Face ID Card */}
        <Text style={[styles.sectionHeader, { color: colors.textDim }]}>FACE ID & KEYCHAIN SECURITY</Text>
        <View style={[styles.settingsGroup, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
          <View style={styles.settingsRow}>
            <View style={styles.rowLeft}>
              <ScanFace color={colors.primary} size={20} style={styles.rowIcon} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowTitle, { color: colors.text }]}>
                  {biometricLabel} Quick Sign-In & Lock
                </Text>
                <Text style={[styles.rowSubtitle, { color: colors.textDim }]}>
                  {isBiometricSupported
                    ? 'Encrypt workspace session in iOS Keychain (zero Clerk config required)'
                    : 'Biometric hardware not enrolled on this device'}
                </Text>
              </View>
            </View>
            <Switch
              value={biometricEnabled}
              onValueChange={handleToggleBiometrics}
              disabled={!isBiometricSupported}
              trackColor={{ false: colors.borderSubtle, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={[styles.rowDivider, { backgroundColor: colors.borderSubtle }]} />

          <TouchableOpacity style={styles.settingsRow} onPress={handleTestFaceId} activeOpacity={0.7}>
            <View style={styles.rowLeft}>
              <Lock color={colors.primary} size={18} style={styles.rowIcon} />
              <View>
                <Text style={[styles.rowTitle, { color: colors.text }]}>Verify {biometricLabel} Now</Text>
                <Text style={[styles.rowSubtitle, { color: colors.textDim }]}>
                  Test native iOS biometric unlock prompt
                </Text>
              </View>
            </View>
            <ChevronRight color={colors.textDim} size={18} />
          </TouchableOpacity>
        </View>

        {/* Role & Workspace Mode Switcher */}
        <Text style={[styles.sectionHeader, { color: colors.textDim }]}>WORKSPACE ROLE & NAVIGATION MODE</Text>
        <View style={[styles.roleCard, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
          <Text style={[styles.rolePrompt, { color: colors.textMuted }]}>
            Toggle between full executive management controls (reports, approvals, invoicing) and the focused team member view.
          </Text>
          <View style={styles.roleSegmentRow}>
            <TouchableOpacity
              style={[
                styles.roleBtn,
                previewRole !== 'employee'
                  ? { backgroundColor: colors.primary, borderColor: colors.primary }
                  : { backgroundColor: colors.surfaceSubtle, borderColor: colors.borderSubtle },
              ]}
              onPress={() => setPreviewRole('admin')}
              activeOpacity={0.7}
            >
              <BarChart3
                color={previewRole !== 'employee' ? '#FFFFFF' : colors.textDim}
                size={16}
                strokeWidth={2.2}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.roleBtnText,
                  { color: previewRole !== 'employee' ? '#FFFFFF' : colors.textMuted },
                ]}
              >
                Manager Mode
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.roleBtn,
                previewRole === 'employee'
                  ? { backgroundColor: colors.primary, borderColor: colors.primary }
                  : { backgroundColor: colors.surfaceSubtle, borderColor: colors.borderSubtle },
              ]}
              onPress={() => setPreviewRole('employee')}
              activeOpacity={0.7}
            >
              <Briefcase
                color={previewRole === 'employee' ? '#FFFFFF' : colors.textDim}
                size={16}
                strokeWidth={2.2}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.roleBtnText,
                  { color: previewRole === 'employee' ? '#FFFFFF' : colors.textMuted },
                ]}
              >
                Employee Mode
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Appearance & Brand Accent Palette */}
        <Text style={[styles.sectionHeader, { color: colors.textDim }]}>APPEARANCE & BRAND ACCENT</Text>
        <View style={[styles.themeSegmentContainer, { backgroundColor: colors.surface, borderColor: colors.borderSubtle, marginBottom: Spacing.sm }]}>
          {themeOptions.map((opt) => {
            const Icon = opt.icon;
            const isSelected = mode === opt.key;
            return (
              <TouchableOpacity
                key={opt.key}
                style={[
                  styles.themeSegmentBtn,
                  isSelected && {
                    backgroundColor: colors.primaryMuted,
                    borderColor: colors.primary,
                  },
                ]}
                onPress={() => setMode(opt.key)}
                activeOpacity={0.7}
              >
                <Icon
                  color={isSelected ? colors.primary : colors.textDim}
                  size={18}
                  strokeWidth={2.2}
                  style={{ marginBottom: 4 }}
                />
                <Text
                  style={[
                    styles.themeSegmentLabel,
                    { color: isSelected ? colors.primary : colors.textMuted },
                    isSelected && { fontWeight: '700' },
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={[styles.accentCard, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
          {(Object.keys(ACCENT_PALETTES) as AccentTheme[]).map((key) => {
            const pal = ACCENT_PALETTES[key];
            const active = accent === key;
            return (
              <TouchableOpacity
                key={key}
                style={[
                  styles.accentPill,
                  {
                    borderColor: active ? pal.swatch : colors.borderSubtle,
                    backgroundColor: active ? colors.surfaceSubtle : 'transparent',
                  },
                ]}
                onPress={() => setAccent(key)}
              >
                <View style={[styles.swatchDot, { backgroundColor: pal.swatch }]} />
                <Text style={[styles.swatchText, { color: active ? colors.text : colors.textMuted }]}>
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Organization & Invoice Defaults */}
        <Text style={[styles.sectionHeader, { color: colors.textDim }]}>ORGANIZATION & TIMER DEFAULTS</Text>
        <View style={[styles.settingsGroup, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
          <TouchableOpacity
            style={styles.settingsRow}
            onPress={() => {
              setDraftOrgName(orgSettings.orgName);
              setDraftInvoicePrefix(orgSettings.invoicePrefix);
              setOrgModalVisible(true);
            }}
          >
            <View style={styles.rowLeft}>
              <Sliders color={colors.primary} size={18} style={styles.rowIcon} />
              <View>
                <Text style={[styles.rowTitle, { color: colors.text }]}>Workspace & Invoice Defaults</Text>
                <Text style={[styles.rowSubtitle, { color: colors.textDim }]}>
                  {orgSettings.orgName} · Prefix: {orgSettings.invoicePrefix}
                </Text>
              </View>
            </View>
            <ChevronRight color={colors.textDim} size={18} />
          </TouchableOpacity>

          <View style={[styles.rowDivider, { backgroundColor: colors.borderSubtle }]} />

          <View style={{ padding: Spacing.md }}>
            <Text style={[styles.rowTitle, { color: colors.text, marginBottom: 6 }]}>
              Stopwatch Rounding Rule
            </Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {roundingOptions.map((mins) => {
                const active = orgSettings.timerRoundingMinutes === mins;
                return (
                  <TouchableOpacity
                    key={mins}
                    style={[
                      styles.roundingChip,
                      {
                        backgroundColor: active ? colors.primaryMuted : colors.surfaceSubtle,
                        borderColor: active ? colors.primary : colors.borderSubtle,
                      },
                    ]}
                    onPress={() => updateOrgSettings({ timerRoundingMinutes: mins })}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: '700',
                        color: active ? colors.primary : colors.textMuted,
                      }}
                    >
                      {mins === 0 ? 'Exact' : `${mins}m`}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* Accounting & Payroll Exports */}
        <Text style={[styles.sectionHeader, { color: colors.textDim }]}>ACCOUNTING & PAYROLL EXPORTS</Text>
        <View style={[styles.exportGridCard, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
          <Text style={[styles.rolePrompt, { color: colors.textMuted, marginBottom: Spacing.sm }]}>
            Export formatted ledger CSVs directly from your mobile device for accounting and payroll runs.
          </Text>
          <View style={styles.exportGrid}>
            {[
              { id: 'quickbooks' as const, label: 'QuickBooks CSV' },
              { id: 'xero' as const, label: 'Xero CSV' },
              { id: 'adp' as const, label: 'ADP Batch' },
              { id: 'universal' as const, label: 'Universal CSV' },
            ].map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.exportBtn, { backgroundColor: colors.surfaceSubtle, borderColor: colors.borderSubtle }]}
                onPress={() => handleExportAccountingCSV(item.id)}
              >
                <Share2 color={colors.primary} size={14} />
                <Text style={[styles.exportBtnText, { color: colors.text }]}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 10 Native Integrations Hub */}
        <Text style={[styles.sectionHeader, { color: colors.textDim }]}>
          INTEGRATIONS HUB ({connectedCount}/10 CONNECTED)
        </Text>
        <View style={[styles.settingsGroup, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
          {INTEGRATIONS_CATALOG.map((conn, idx) => {
            const isConnected = Boolean(connectedMap[conn.id]);
            return (
              <React.Fragment key={conn.id}>
                {idx > 0 && <View style={[styles.rowDivider, { backgroundColor: colors.borderSubtle }]} />}
                <TouchableOpacity style={styles.settingsRow} onPress={() => handleOpenConnector(conn)}>
                  <View style={styles.rowLeft}>
                    <Plug color={isConnected ? '#10B981' : colors.primary} size={17} style={styles.rowIcon} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.rowTitle, { color: colors.text }]}>{conn.name}</Text>
                      <Text style={[styles.rowSubtitle, { color: colors.textDim }]} numberOfLines={1}>
                        {conn.category} · {conn.description}
                      </Text>
                    </View>
                  </View>
                  <View
                    style={[
                      styles.connBadge,
                      {
                        backgroundColor: isConnected ? '#10B98118' : colors.surfaceSubtle,
                        borderColor: isConnected ? '#10B98150' : colors.borderSubtle,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        fontSize: 10,
                        fontWeight: '700',
                        color: isConnected ? '#059669' : colors.textMuted,
                      }}
                    >
                      {isConnected ? 'Active' : 'Configure'}
                    </Text>
                  </View>
                </TouchableOpacity>
              </React.Fragment>
            );
          })}
        </View>

        {/* Sync & Connectivity Section */}
        <Text style={[styles.sectionHeader, { color: colors.textDim }]}>DATA & CLOUD SYNC</Text>
        <View style={[styles.settingsGroup, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
          <View style={styles.settingsRow}>
            <View style={styles.rowLeft}>
              {syncStatus === 'offline' ? (
                <WifiOff color={colors.textDim} size={18} style={styles.rowIcon} />
              ) : (
                <Wifi color={colors.primary} size={18} style={styles.rowIcon} />
              )}
              <View>
                <Text style={[styles.rowTitle, { color: colors.text }]}>Cloud Sync Status</Text>
                <Text style={[styles.rowSubtitle, { color: colors.textDim }]}>
                  {token?.startsWith('vt_live_')
                    ? 'Synced via Workspace REST API (/api/v1)'
                    : isDemoMode
                    ? 'Local Demo Studio Persistence'
                    : 'Offline Cache Active'}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.syncBtn, { backgroundColor: colors.surfaceSubtle, borderColor: colors.borderSubtle }]}
              onPress={handleManualSync}
              disabled={isRefreshing}
              activeOpacity={0.7}
            >
              {isRefreshing ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <>
                  <RefreshCw color={colors.primary} size={14} style={{ marginRight: 4 }} />
                  <Text style={[styles.syncBtnText, { color: colors.primary }]}>Sync</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={[styles.rowDivider, { backgroundColor: colors.borderSubtle }]} />

          <TouchableOpacity style={styles.settingsRow} onPress={handleToggleDemo} activeOpacity={0.7}>
            <View style={styles.rowLeft}>
              <KeyRound color={colors.primary} size={18} style={styles.rowIcon} />
              <View>
                <Text style={[styles.rowTitle, { color: colors.text }]}>
                  {isDemoMode ? 'Connect Cloud Account' : 'Demo Studio Mode'}
                </Text>
                <Text style={[styles.rowSubtitle, { color: colors.textDim }]}>
                  {isDemoMode ? 'Sign in with workspace email or API key' : 'Switch to interactive demo sandbox'}
                </Text>
              </View>
            </View>
            <ChevronRight color={colors.textDim} size={18} />
          </TouchableOpacity>
        </View>

        {/* Legal & Support Links (Apple App Store Guideline 5.1.1 / 4.0) */}
        <Text style={[styles.sectionHeader, { color: colors.textDim }]}>LEGAL & SUPPORT</Text>
        <View style={[styles.settingsGroup, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
          <TouchableOpacity
            style={styles.settingsRow}
            onPress={() => openExternalUrl('https://velotime.dg.tools/privacy')}
          >
            <View style={styles.rowLeft}>
              <FileText color={colors.primary} size={18} style={styles.rowIcon} />
              <Text style={[styles.rowTitle, { color: colors.text }]}>Privacy Policy</Text>
            </View>
            <ExternalLink color={colors.textDim} size={16} />
          </TouchableOpacity>

          <View style={[styles.rowDivider, { backgroundColor: colors.borderSubtle }]} />

          <TouchableOpacity
            style={styles.settingsRow}
            onPress={() => openExternalUrl('https://velotime.dg.tools/terms')}
          >
            <View style={styles.rowLeft}>
              <FileText color={colors.primary} size={18} style={styles.rowIcon} />
              <Text style={[styles.rowTitle, { color: colors.text }]}>Terms of Service</Text>
            </View>
            <ExternalLink color={colors.textDim} size={16} />
          </TouchableOpacity>

          <View style={[styles.rowDivider, { backgroundColor: colors.borderSubtle }]} />

          <TouchableOpacity
            style={styles.settingsRow}
            onPress={() => openExternalUrl('https://velotime.dg.tools')}
          >
            <View style={styles.rowLeft}>
              <HelpCircle color={colors.primary} size={18} style={styles.rowIcon} />
              <Text style={[styles.rowTitle, { color: colors.text }]}>Help & Support Center</Text>
            </View>
            <ExternalLink color={colors.textDim} size={16} />
          </TouchableOpacity>
        </View>

        {/* Account Actions */}
        <Text style={[styles.sectionHeader, { color: colors.textDim }]}>ACCOUNT & SESSION</Text>
        <TouchableOpacity
          style={[styles.signOutBtn, { backgroundColor: colors.surface, borderColor: colors.borderSubtle, marginBottom: Spacing.sm }]}
          onPress={handleSignOut}
          activeOpacity={0.7}
        >
          <LogOut color={colors.text} size={18} strokeWidth={2.2} style={{ marginRight: Spacing.sm }} />
          <Text style={[styles.signOutBtnText, { color: colors.text }]}>Sign Out</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.signOutBtn, { backgroundColor: colors.surface, borderColor: 'rgba(239, 68, 68, 0.35)' }]}
          onPress={handleDeleteAccount}
          activeOpacity={0.7}
        >
          <Trash2 color={colors.danger} size={18} strokeWidth={2.2} style={{ marginRight: Spacing.sm }} />
          <Text style={[styles.signOutBtnText, { color: colors.danger }]}>Delete Account & Erase Data</Text>
        </TouchableOpacity>

        {/* Build Tag (No external web pricing per Apple Guideline 3.1.3(b)) */}
        <View style={styles.versionFooter}>
          <Text style={[styles.versionText, { color: colors.textDim }]}>
            VeloTime Mobile · v1.0.0
          </Text>
          <Text style={[styles.versionSubtext, { color: colors.textDim }]}>
            Retrospective timesheets, live stopwatch, expenses & invoicing
          </Text>
        </View>
      </ScrollView>

      {/* Organization Settings Modal */}
      <Modal visible={orgModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.borderSubtle }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Workspace & Invoice Defaults</Text>
              <TouchableOpacity onPress={() => setOrgModalVisible(false)}>
                <X color={colors.textDim} size={20} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <Text style={[styles.inputLabel, { color: colors.textDim }]}>ORGANIZATION NAME</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: colors.bg, borderColor: colors.borderSubtle, color: colors.text }]}
                value={draftOrgName}
                onChangeText={setDraftOrgName}
                placeholder="Metropolis Architecture Studio"
                placeholderTextColor={colors.textDim}
              />

              <Text style={[styles.inputLabel, { color: colors.textDim }]}>INVOICE NUMBER PREFIX</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: colors.bg, borderColor: colors.borderSubtle, color: colors.text }]}
                value={draftInvoicePrefix}
                onChangeText={setDraftInvoicePrefix}
                placeholder="INV-2026-"
                placeholderTextColor={colors.textDim}
              />
            </View>
            <View style={[styles.modalFooter, { borderTopColor: colors.borderSubtle }]}>
              <TouchableOpacity
                style={[styles.cancelBtn, { borderColor: colors.borderSubtle }]}
                onPress={() => setOrgModalVisible(false)}
              >
                <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textMuted }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: colors.primary }]}
                onPress={handleSaveOrgSettings}
              >
                <Check color="#FFFFFF" size={15} style={{ marginRight: 5 }} />
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#FFFFFF' }}>Save Settings</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Connector Configuration Modal */}
      <Modal visible={activeConnector !== null} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.borderSubtle }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Configure {activeConnector?.name}
              </Text>
              <TouchableOpacity onPress={() => setActiveConnector(null)}>
                <X color={colors.textDim} size={20} />
              </TouchableOpacity>
            </View>
            {activeConnector && (
              <View style={styles.modalBody}>
                <Text style={[styles.rolePrompt, { color: colors.textMuted }]}>
                  {activeConnector.description}
                </Text>
                <Text style={[styles.inputLabel, { color: colors.textDim }]}>
                  API TOKEN / WEBHOOK URL (LEAVE BLANK TO DISCONNECT)
                </Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: colors.bg, borderColor: colors.borderSubtle, color: colors.text }]}
                  value={connectorCredential}
                  onChangeText={setConnectorCredential}
                  placeholder={activeConnector.placeholder}
                  placeholderTextColor={colors.textDim}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            )}
            <View style={[styles.modalFooter, { borderTopColor: colors.borderSubtle }]}>
              <TouchableOpacity
                style={[styles.cancelBtn, { borderColor: colors.borderSubtle }]}
                onPress={() => setActiveConnector(null)}
              >
                <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textMuted }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: colors.primary }]}
                onPress={handleSaveConnector}
              >
                <Check color="#FFFFFF" size={15} style={{ marginRight: 5 }} />
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#FFFFFF' }}>
                  {connectorCredential.trim() ? 'Save Connection' : 'Disconnect'}
                </Text>
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
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl * 2,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
  },
  userEmail: {
    fontSize: 12,
    marginTop: 2,
  },
  orgRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  orgName: {
    fontSize: 12,
    fontWeight: '600',
  },
  switchAccountBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: Radius.sm,
    borderWidth: 1,
  },
  switchAccountText: {
    fontSize: 12,
    fontWeight: '700',
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  roleCard: {
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    marginBottom: Spacing.xl,
  },
  rolePrompt: {
    fontSize: 12,
    lineHeight: 17,
    marginBottom: Spacing.md,
  },
  roleSegmentRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  roleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: Radius.sm,
    borderWidth: 1,
  },
  roleBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  themeSegmentContainer: {
    flexDirection: 'row',
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: 4,
    gap: 4,
  },
  themeSegmentBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  themeSegmentLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  accentCard: {
    flexDirection: 'row',
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: 6,
    gap: 6,
    marginBottom: Spacing.xl,
  },
  accentPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: Radius.sm,
    borderWidth: 1,
  },
  swatchDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  swatchText: {
    fontSize: 11,
    fontWeight: '700',
  },
  roundingChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: Radius.sm,
    borderWidth: 1,
    alignItems: 'center',
  },
  exportGridCard: {
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
  },
  exportGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  exportBtn: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: Radius.sm,
    borderWidth: 1,
  },
  exportBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  connBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.xs,
    borderWidth: 1,
  },
  settingsGroup: {
    borderRadius: Radius.md,
    borderWidth: 1,
    marginBottom: Spacing.xl,
    overflow: 'hidden',
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: Spacing.sm,
  },
  rowIcon: {
    marginRight: Spacing.md,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  rowSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  rowDivider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: Spacing.md + 18 + Spacing.md,
  },
  syncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: Radius.sm,
  },
  syncBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: Radius.md,
    height: 46,
    marginBottom: Spacing.xl,
  },
  signOutBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  versionFooter: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  versionText: {
    fontSize: 11,
    fontWeight: '600',
  },
  versionSubtext: {
    fontSize: 10,
    marginTop: 3,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: Radius.md,
    borderTopRightRadius: Radius.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    marginBottom: 6,
    marginTop: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: Radius.xs,
    padding: Spacing.sm,
    fontSize: 14,
    marginBottom: Spacing.sm,
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
  saveBtn: {
    flex: 2,
    flexDirection: 'row',
    paddingVertical: 12,
    borderRadius: Radius.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
