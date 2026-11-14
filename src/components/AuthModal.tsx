import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Switch,
  Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  ScanFace,
  ShieldCheck,
  Mail,
  KeyRound,
  Building2,
  User as UserIcon,
  X,
  ArrowRight,
  Lock,
} from 'lucide-react-native';
import { Spacing, Radius } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { useAuth, UserRole } from '../context/AuthContext';

export function AuthModal() {
  const { colors } = useTheme();
  const {
    user,
    isLoading,
    isDemoMode,
    isAuthModalOpen,
    setAuthModalOpen,
    isBiometricSupported,
    biometricLabel,
    isBiometricLocked,
    hasSavedCredentials,
    authenticateWithFaceId,
    signInWithWorkspace,
    enterDemoMode,
    orgSettings,
  } = useAuth();

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [orgName, setOrgName] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [role, setRole] = useState<UserRole>('admin');
  const [enableBiometrics, setEnableBiometrics] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const visible = !isLoading && (isAuthModalOpen || user === null || isBiometricLocked);

  useEffect(() => {
    if (visible && user && !isDemoMode) {
      setEmail(user.email || '');
      setName([user.firstName, user.lastName].filter(Boolean).join(' '));
      setOrgName(user.organization?.name || orgSettings.orgName || '');
    } else if (visible && !orgName) {
      setOrgName(orgSettings.orgName || 'VeloTime Workspace');
    }
  }, [visible, user, isDemoMode, orgSettings.orgName]);

  useEffect(() => {
    if (visible && isBiometricLocked && isBiometricSupported) {
      authenticateWithFaceId();
    }
  }, [visible, isBiometricLocked, isBiometricSupported, authenticateWithFaceId]);

  const handleFaceIdPress = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const ok = await authenticateWithFaceId();
    if (!ok) {
      Alert.alert(
        `${biometricLabel} Not Verified`,
        `Could not verify ${biometricLabel}. You can try again or sign in with your workspace email.`
      );
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleSignIn = async () => {
    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      Alert.alert('Valid Email Required', 'Please enter a valid work email address.');
      return;
    }

    setSubmitting(true);
    try {
      await signInWithWorkspace({
        email: cleanEmail,
        name: name.trim() || undefined,
        orgName: orgName.trim() || undefined,
        apiKey: apiKey.trim() || undefined,
        role,
        enableBiometrics: isBiometricSupported && enableBiometrics,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      Alert.alert('Sign In Error', err?.message || 'Unable to sign in right now.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoStudio = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await enterDemoMode();
  };

  const canDismiss = Boolean(user !== null && !isBiometricLocked);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => {
        if (canDismiss) setAuthModalOpen(false);
      }}
    >
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.bg }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Top Bar */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.brandRow}>
            <View style={[styles.brandBadge, { backgroundColor: colors.primary }]}>
              <Text style={[styles.brandBadgeText, { color: colors.primaryContrast }]}>V</Text>
            </View>
            <View>
              <Text style={[styles.headerTitle, { color: colors.text }]}>
                {isBiometricLocked ? 'Workspace Locked' : 'VeloTime Sign In'}
              </Text>
              <Text style={[styles.headerSub, { color: colors.textMuted }]}>
                {isBiometricLocked
                  ? `${biometricLabel} protection enabled`
                  : 'Connect your workspace or enter Interactive Studio'}
              </Text>
            </View>
          </View>

          {canDismiss && (
            <TouchableOpacity
              onPress={() => setAuthModalOpen(false)}
              style={[styles.closeBtn, { backgroundColor: colors.surfaceSubtle }]}
              accessibilityLabel="Close Sign In"
            >
              <X size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {isBiometricLocked ? (
            <View style={[styles.lockCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[styles.lockIconWrap, { backgroundColor: colors.primaryMuted }]}>
                <ScanFace size={44} color={colors.primary} />
              </View>
              <Text style={[styles.lockTitle, { color: colors.text }]}>
                Unlock {orgSettings.orgName || 'VeloTime'}
              </Text>
              <Text style={[styles.lockDesc, { color: colors.textMuted }]}>
                Use {biometricLabel} to decrypt your Keychain session credentials and access timesheets, invoices, and live timers.
              </Text>

              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
                onPress={handleFaceIdPress}
                activeOpacity={0.85}
              >
                <ScanFace size={20} color={colors.primaryContrast} />
                <Text style={[styles.primaryBtnText, { color: colors.primaryContrast }]}>
                  Unlock with {biometricLabel}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.secondaryBtn, { borderColor: colors.border, backgroundColor: colors.surfaceSubtle }]}
                onPress={handleDemoStudio}
              >
                <Lock size={15} color={colors.textMuted} />
                <Text style={[styles.secondaryBtnText, { color: colors.text }]}>
                  Switch to Interactive Demo Studio
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* 1-Tap Face ID Sign-In Card */}
              {isBiometricSupported && (
                <TouchableOpacity
                  style={[
                    styles.faceIdCard,
                    { backgroundColor: colors.primaryMuted, borderColor: colors.primary },
                  ]}
                  onPress={handleFaceIdPress}
                  activeOpacity={0.85}
                >
                  <View style={[styles.faceIdIcon, { backgroundColor: colors.primary }]}>
                    <ScanFace size={24} color={colors.primaryContrast} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.faceIdTitle, { color: colors.text }]}>
                      Sign in with {biometricLabel}
                    </Text>
                    <Text style={[styles.faceIdSub, { color: colors.textMuted }]}>
                      {hasSavedCredentials
                        ? 'Restore your encrypted iOS Keychain workspace session'
                        : 'Verify biometrics to unlock workspace access immediately'}
                    </Text>
                  </View>
                  <ArrowRight size={18} color={colors.primary} />
                </TouchableOpacity>
              )}

              {/* Standard Workspace Sign-In Form */}
              <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.sectionHeading, { color: colors.textMuted }]}>
                  WORKSPACE CREDENTIALS
                </Text>

                <Text style={[styles.label, { color: colors.textMuted }]}>Work Email *</Text>
                <View style={[styles.inputWrap, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                  <Mail size={16} color={colors.textDim} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="you@studio.com"
                    placeholderTextColor={colors.textDim}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoCorrect={false}
                  />
                </View>

                <Text style={[styles.label, { color: colors.textMuted }]}>Full Name</Text>
                <View style={[styles.inputWrap, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                  <UserIcon size={16} color={colors.textDim} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    value={name}
                    onChangeText={setName}
                    placeholder="Sarah Chen"
                    placeholderTextColor={colors.textDim}
                  />
                </View>

                <Text style={[styles.label, { color: colors.textMuted }]}>Workspace / Organization</Text>
                <View style={[styles.inputWrap, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                  <Building2 size={16} color={colors.textDim} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    value={orgName}
                    onChangeText={setOrgName}
                    placeholder="Metropolis Architecture Studio"
                    placeholderTextColor={colors.textDim}
                  />
                </View>

                <Text style={[styles.label, { color: colors.textMuted }]}>
                  Workspace API Key (Optional for Cloud Sync)
                </Text>
                <View style={[styles.inputWrap, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                  <KeyRound size={16} color={colors.textDim} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    value={apiKey}
                    onChangeText={setApiKey}
                    placeholder="vt_live_..."
                    placeholderTextColor={colors.textDim}
                    autoCapitalize="none"
                    autoCorrect={false}
                    secureTextEntry
                  />
                </View>

                <Text style={[styles.label, { color: colors.textMuted }]}>Workspace Role</Text>
                <View style={styles.roleRow}>
                  {(['admin', 'employee'] as const).map((r) => {
                    const active = role === r;
                    return (
                      <TouchableOpacity
                        key={r}
                        style={[
                          styles.roleChip,
                          {
                            backgroundColor: active ? colors.primaryMuted : colors.surfaceSubtle,
                            borderColor: active ? colors.primary : colors.border,
                          },
                        ]}
                        onPress={() => setRole(r)}
                      >
                        <Text
                          style={[
                            styles.roleChipText,
                            { color: active ? colors.primary : colors.textMuted },
                          ]}
                        >
                          {r === 'admin' ? 'Admin / Manager' : 'Team Member'}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {isBiometricSupported && (
                  <View style={[styles.bioToggleRow, { borderTopColor: colors.borderSubtle }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.bioToggleTitle, { color: colors.text }]}>
                        Enable {biometricLabel} Quick Sign-In
                      </Text>
                      <Text style={[styles.bioToggleSub, { color: colors.textMuted }]}>
                        Store session token in iOS Keychain for instant Face ID unlock
                      </Text>
                    </View>
                    <Switch
                      value={enableBiometrics}
                      onValueChange={setEnableBiometrics}
                      trackColor={{ false: colors.border, true: colors.primary }}
                      thumbColor="#FFFFFF"
                    />
                  </View>
                )}

                <TouchableOpacity
                  style={[styles.primaryBtn, { backgroundColor: colors.primary, opacity: submitting ? 0.7 : 1 }]}
                  onPress={handleSignIn}
                  disabled={submitting}
                  activeOpacity={0.85}
                >
                  <ShieldCheck size={18} color={colors.primaryContrast} />
                  <Text style={[styles.primaryBtnText, { color: colors.primaryContrast }]}>
                    {submitting ? 'Connecting Workspace...' : 'Sign In to Workspace'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Demo Studio Option */}
              <TouchableOpacity
                style={[styles.secondaryBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
                onPress={handleDemoStudio}
              >
                <Text style={[styles.secondaryBtnText, { color: colors.text }]}>
                  Continue in Interactive Demo Studio
                </Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  brandBadge: {
    width: 34,
    height: 34,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandBadgeText: { fontSize: 18, fontWeight: '800' },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  headerSub: { fontSize: 12, fontWeight: '500', marginTop: 1 },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: Spacing.lg,
    gap: Spacing.lg,
    paddingBottom: 48,
  },
  lockCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.xxl,
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  lockIconWrap: {
    width: 84,
    height: 84,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  lockTitle: { fontSize: 22, fontWeight: '800', textAlign: 'center' },
  lockDesc: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  faceIdCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
  },
  faceIdIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  faceIdTitle: { fontSize: 16, fontWeight: '700' },
  faceIdSub: { fontSize: 12, marginTop: 2 },
  formCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  sectionHeading: { fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 4 },
  label: { fontSize: 12, fontWeight: '600', marginTop: 6 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    height: 46,
  },
  input: { flex: 1, fontSize: 15 },
  roleRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  roleChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  roleChipText: { fontSize: 13, fontWeight: '700' },
  bioToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: Spacing.md,
    marginTop: Spacing.sm,
    borderTopWidth: 1,
  },
  bioToggleTitle: { fontSize: 14, fontWeight: '700' },
  bioToggleSub: { fontSize: 11, marginTop: 2 },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: Radius.md,
    marginTop: Spacing.md,
    width: '100%',
  },
  primaryBtnText: { fontSize: 15, fontWeight: '700' },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 46,
    borderRadius: Radius.md,
    borderWidth: 1,
    width: '100%',
  },
  secondaryBtnText: { fontSize: 14, fontWeight: '600' },
});
