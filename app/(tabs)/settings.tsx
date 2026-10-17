import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {
  User,
  Building,
  RefreshCw,
  LogOut,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Wifi,
  WifiOff,
  ChevronRight,
  Sun,
  Moon,
  Monitor,
  Check,
} from 'lucide-react-native';
import { useAuth } from '@/src/context/AuthContext';
import { useTimesheet } from '@/src/context/TimesheetContext';
import { useTheme } from '@/src/context/ThemeContext';
import { Spacing, Radius, ThemeMode } from '@/src/constants/theme';

export default function SettingsScreen() {
  const { colors, isDark, mode, setMode } = useTheme();
  const { user, isDemoMode, syncStatus, enterDemoMode, signOut } = useAuth();
  const { refreshData } = useTimesheet();
  const [isRefreshing, setIsRefreshing] = useState(false);

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

  const handleToggleDemo = () => {
    if (isDemoMode) {
      Alert.alert(
        'Exit Demo Mode',
        'Would you like to sign into your custom organization account?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign Out', style: 'destructive', onPress: signOut },
        ]
      );
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
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  };

  const themeOptions: { key: ThemeMode; label: string; icon: any }[] = [
    { key: 'dark', label: 'Dark', icon: Moon },
    { key: 'light', label: 'Light', icon: Sun },
    { key: 'system', label: 'System', icon: Monitor },
  ];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* User / Workspace Card */}
        <View style={[styles.profileCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.avatar, { backgroundColor: colors.surfaceSubtle, borderColor: colors.borderSubtle }]}>
            <User color={colors.primary} size={24} strokeWidth={2.2} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.userName, { color: colors.text }]}>
              {user?.firstName ? `${user.firstName} ${user.lastName || ''}` : 'Active Studio Member'}
            </Text>
            <Text style={[styles.userEmail, { color: colors.textMuted }]}>{user?.email || 'demo@velotime.com'}</Text>
            <View style={styles.orgRow}>
              <Building color={colors.textDim} size={13} style={{ marginRight: 4 }} />
              <Text style={[styles.orgName, { color: colors.primary }]}>{user?.organization?.name || 'Metropolis Studio'}</Text>
            </View>
          </View>
        </View>

        {/* Theme & Appearance Switcher */}
        <Text style={[styles.sectionHeader, { color: colors.textDim }]}>APPEARANCE & THEME</Text>
        <View style={[styles.themeSegmentContainer, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
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

        {/* Demo Mode Sandbox Banner */}
        {isDemoMode && (
          <View style={[styles.demoBanner, { backgroundColor: colors.primaryMuted, borderColor: colors.primary }]}>
            <View style={styles.demoBannerHeader}>
              <Sparkles color={colors.primary} size={16} strokeWidth={2.2} />
              <Text style={[styles.demoBannerTitle, { color: colors.primary }]}>Interactive Demo Sandbox</Text>
            </View>
            <Text style={[styles.demoBannerBody, { color: colors.textMuted }]}>
              You are exploring VeloTime in sandbox mode with live local timers, project tasks, and weekly summaries matching the website design.
            </Text>
          </View>
        )}

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
                <Text style={[styles.rowTitle, { color: colors.text }]}>Cloud Connection</Text>
                <Text style={[styles.rowSubtitle, { color: colors.textDim }]}>
                  {syncStatus === 'offline' ? 'Offline (AsyncStorage active)' : 'Connected to Railway API'}
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
              <Sparkles color={colors.primary} size={18} style={styles.rowIcon} />
              <View>
                <Text style={[styles.rowTitle, { color: colors.text }]}>Demo Studio Mode</Text>
                <Text style={[styles.rowSubtitle, { color: colors.textDim }]}>
                  {isDemoMode ? 'Active (Pre-loaded projects)' : 'Inactive'}
                </Text>
              </View>
            </View>
            <ChevronRight color={colors.textDim} size={18} />
          </TouchableOpacity>
        </View>

        {/* Architecture & Native Spec */}
        <Text style={[styles.sectionHeader, { color: colors.textDim }]}>APPLICATION SPECIFICATIONS</Text>
        <View style={[styles.settingsGroup, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
          <View style={styles.settingsRow}>
            <View style={styles.rowLeft}>
              <Smartphone color={colors.primary} size={18} style={styles.rowIcon} />
              <View>
                <Text style={[styles.rowTitle, { color: colors.text }]}>Native Mobile Architecture</Text>
                <Text style={[styles.rowSubtitle, { color: colors.textDim }]}>React Native & Expo SDK 57 (100% Native)</Text>
              </View>
            </View>
          </View>

          <View style={[styles.rowDivider, { backgroundColor: colors.borderSubtle }]} />

          <View style={styles.settingsRow}>
            <View style={styles.rowLeft}>
              <ShieldCheck color={colors.primary} size={18} style={styles.rowIcon} />
              <View>
                <Text style={[styles.rowTitle, { color: colors.text }]}>Apple Guideline 4.2 Compliance</Text>
                <Text style={[styles.rowSubtitle, { color: colors.textDim }]}>Standalone native UI, haptics, offline storage</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Account Actions */}
        <Text style={[styles.sectionHeader, { color: colors.textDim }]}>SESSION</Text>
        <TouchableOpacity
          style={[styles.signOutBtn, { backgroundColor: colors.surface, borderColor: 'rgba(239, 68, 68, 0.3)' }]}
          onPress={handleSignOut}
          activeOpacity={0.7}
        >
          <LogOut color={colors.danger} size={18} strokeWidth={2.2} style={{ marginRight: Spacing.sm }} />
          <Text style={[styles.signOutBtnText, { color: colors.danger }]}>Reset Mobile Session</Text>
        </TouchableOpacity>

        {/* Build Tag */}
        <View style={styles.versionFooter}>
          <Text style={[styles.versionText, { color: colors.textDim }]}>VeloTime Mobile · v1.0.0 (Build 2026.10)</Text>
          <Text style={[styles.versionSubtext, { color: colors.textDim }]}>$5/seat flat pricing · Retrospective timesheets & timers</Text>
        </View>
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
  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  themeSegmentContainer: {
    flexDirection: 'row',
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: 4,
    marginBottom: Spacing.xl,
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
  demoBanner: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  demoBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  demoBannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 6,
  },
  demoBannerBody: {
    fontSize: 12,
    lineHeight: 17,
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
  },
});
