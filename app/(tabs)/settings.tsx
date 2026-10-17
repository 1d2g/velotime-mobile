import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  Switch,
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
} from 'lucide-react-native';
import { useAuth, DEMO_USER } from '@/src/context/AuthContext';
import { useTimesheet } from '@/src/context/TimesheetContext';
import { Colors, Spacing, Radius } from '@/src/constants/theme';

export default function SettingsScreen() {
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* User / Workspace Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <User color={Colors.primary} size={24} strokeWidth={2.2} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>
              {user?.firstName ? `${user.firstName} ${user.lastName || ''}` : 'Active Studio Member'}
            </Text>
            <Text style={styles.userEmail}>{user?.email || 'demo@velotime.com'}</Text>
            <View style={styles.orgRow}>
              <Building color={Colors.textDim} size={13} style={{ marginRight: 4 }} />
              <Text style={styles.orgName}>{user?.organization?.name || 'Metropolis Studio'}</Text>
            </View>
          </View>
        </View>

        {/* Demo Mode Sandbox Banner */}
        {isDemoMode && (
          <View style={styles.demoBanner}>
            <View style={styles.demoBannerHeader}>
              <Sparkles color={Colors.accent} size={16} strokeWidth={2.2} />
              <Text style={styles.demoBannerTitle}>Interactive Demo Sandbox</Text>
            </View>
            <Text style={styles.demoBannerBody}>
              You are exploring VeloTime in sandbox mode with live local timers, project tasks, and weekly summaries. No authentication required.
            </Text>
          </View>
        )}

        {/* Sync & Connectivity Section */}
        <Text style={styles.sectionHeader}>DATA & CLOUD SYNC</Text>
        <View style={styles.settingsGroup}>
          <View style={styles.settingsRow}>
            <View style={styles.rowLeft}>
              {syncStatus === 'offline' ? (
                <WifiOff color={Colors.textDim} size={18} style={styles.rowIcon} />
              ) : (
                <Wifi color={Colors.primary} size={18} style={styles.rowIcon} />
              )}
              <View>
                <Text style={styles.rowTitle}>Cloud Connection</Text>
                <Text style={styles.rowSubtitle}>
                  {syncStatus === 'offline' ? 'Offline (AsyncStorage active)' : 'Connected to Railway API'}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.syncBtn}
              onPress={handleManualSync}
              disabled={isRefreshing}
              activeOpacity={0.7}
            >
              {isRefreshing ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <>
                  <RefreshCw color={Colors.primary} size={14} style={{ marginRight: 4 }} />
                  <Text style={styles.syncBtnText}>Sync</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.rowDivider} />

          <TouchableOpacity style={styles.settingsRow} onPress={handleToggleDemo} activeOpacity={0.7}>
            <View style={styles.rowLeft}>
              <Sparkles color={Colors.accent} size={18} style={styles.rowIcon} />
              <View>
                <Text style={styles.rowTitle}>Demo Studio Mode</Text>
                <Text style={styles.rowSubtitle}>
                  {isDemoMode ? 'Active (Pre-loaded projects)' : 'Inactive'}
                </Text>
              </View>
            </View>
            <ChevronRight color={Colors.textDim} size={18} />
          </TouchableOpacity>
        </View>

        {/* Architecture & Native Spec */}
        <Text style={styles.sectionHeader}>APPLICATION SPECIFICATIONS</Text>
        <View style={styles.settingsGroup}>
          <View style={styles.settingsRow}>
            <View style={styles.rowLeft}>
              <Smartphone color={Colors.primary} size={18} style={styles.rowIcon} />
              <View>
                <Text style={styles.rowTitle}>Native Mobile Architecture</Text>
                <Text style={styles.rowSubtitle}>React Native & Expo SDK 58 (100% Native)</Text>
              </View>
            </View>
          </View>

          <View style={styles.rowDivider} />

          <View style={styles.settingsRow}>
            <View style={styles.rowLeft}>
              <ShieldCheck color={Colors.primary} size={18} style={styles.rowIcon} />
              <View>
                <Text style={styles.rowTitle}>Apple Guideline 4.2 Compliance</Text>
                <Text style={styles.rowSubtitle}>Standalone native UI, haptics, offline storage</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Account Actions */}
        <Text style={styles.sectionHeader}>SESSION</Text>
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut} activeOpacity={0.7}>
          <LogOut color={Colors.danger} size={18} strokeWidth={2.2} style={{ marginRight: Spacing.sm }} />
          <Text style={styles.signOutBtnText}>Reset Mobile Session</Text>
        </TouchableOpacity>

        {/* Build Tag */}
        <View style={styles.versionFooter}>
          <Text style={styles.versionText}>VeloTime Mobile · v1.0.0 (Build 2026.10)</Text>
          <Text style={styles.versionSubtext}>$5/seat flat pricing · Retrospective timesheets & timers</Text>
        </View>
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
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  userEmail: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  orgRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  orgName: {
    color: Colors.primaryText,
    fontSize: 12,
    fontWeight: '600',
  },
  demoBanner: {
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
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
    color: Colors.accent,
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 6,
  },
  demoBannerBody: {
    color: Colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
  },
  sectionHeader: {
    color: Colors.textDim,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  settingsGroup: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
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
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  rowSubtitle: {
    color: Colors.textDim,
    fontSize: 11,
    marginTop: 2,
  },
  rowDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.borderSubtle,
    marginLeft: Spacing.md + 18 + Spacing.md,
  },
  syncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: Radius.sm,
  },
  syncBtnText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: Radius.md,
    height: 46,
    marginBottom: Spacing.xl,
  },
  signOutBtnText: {
    color: Colors.danger,
    fontSize: 14,
    fontWeight: '700',
  },
  versionFooter: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  versionText: {
    color: Colors.textDim,
    fontSize: 11,
    fontWeight: '600',
  },
  versionSubtext: {
    color: Colors.textDim,
    fontSize: 10,
    marginTop: 3,
  },
});
