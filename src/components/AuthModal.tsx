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
  ActivityIndicator,
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
  Globe,
  Eye,
  EyeOff,
} from 'lucide-react-native';
import { Spacing, Radius } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

type AuthMode = 'signin' | 'signup' | 'apikey';

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
    signInWithCloudSSO,
    enterDemoMode,
    orgSettings,
  } = useAuth();

  const [authMode, setAuthMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [orgName, setOrgName] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [enableBiometrics, setEnableBiometrics] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [ssoLoading, setSsoLoading] = useState(false);

  const visible = !isLoading && (isAuthModalOpen || user === null || isBiometricLocked);

  useEffect(() => {
    if (visible && user && !isDemoMode) {
      setEmail(user.email || '');
      setName([user.firstName, user.lastName].filter(Boolean).join(' '));
      setOrgName(user.organization?.name || orgSettings.orgName || '');
    } else if (visible && isDemoMode) {
      setOrgName('');
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

  const handleCloudSSO = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSsoLoading(true);
    try {
      const ok = await signInWithCloudSSO();
      if (ok) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (err: any) {
      Alert.alert('Cloud Sign In Error', err?.message || 'Unable to complete VeloTime Cloud sign-in.');
    } finally {
      setSsoLoading(false);
    }
  };

  const handleSignIn = async () => {
    const cleanEmail = email.trim();
    const cleanApiKey = apiKey.trim();

    if (authMode === 'apikey') {
      if (!cleanApiKey) {
        Alert.alert('Workspace API Key Required', 'Please paste your vt_live_ workspace API key.');
        return;
      }
    } else {
      if (!cleanEmail || !cleanEmail.includes('@')) {
        Alert.alert('Valid Email Required', 'Please enter a valid work email address.');
        return;
      }
      if (authMode === 'signup' && password.length < 6) {
        Alert.alert('Password Required', 'Please choose a password of at least 6 characters.');
        return;
      }
    }

    setSubmitting(true);
    try {
      await signInWithWorkspace({
        email: cleanEmail || undefined,
        password: password || undefined,
        name: name.trim() || undefined,
        orgName: orgName.trim() || undefined,
        apiKey: cleanApiKey || undefined,
        mode: authMode,
        enableBiometrics: isBiometricSupported && enableBiometrics,
      });
      setPassword('');
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
                  : 'Sync timesheets, projects & timers with VeloTime Cloud'}
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
              {/* 1-Tap Face ID Sign-In Card when saved credentials exist */}
              {isBiometricSupported && hasSavedCredentials && (
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
                      Restore your encrypted iOS Keychain workspace session
                    </Text>
                  </View>
                  <ArrowRight size={18} color={colors.primary} />
                </TouchableOpacity>
              )}

              {/* VeloTime Cloud / Google SSO Button */}
              <TouchableOpacity
                style={[
                  styles.ssoBtn,
                  { backgroundColor: colors.surface, borderColor: colors.primary },
                ]}
                onPress={handleCloudSSO}
                disabled={ssoLoading}
                activeOpacity={0.85}
              >
                {ssoLoading ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Globe size={18} color={colors.primary} />
                )}
                <View style={{ flex: 1 }}>
                  <Text style={[styles.ssoBtnTitle, { color: colors.text }]}>
                    {ssoLoading ? 'Opening VeloTime Cloud...' : 'Continue with VeloTime Cloud / Google'}
                  </Text>
                  <Text style={[styles.ssoBtnSub, { color: colors.textMuted }]}>
                    Use your existing web workspace or Google login via Clerk
                  </Text>
                </View>
                <ArrowRight size={16} color={colors.primary} />
              </TouchableOpacity>

              {/* Auth Mode Tabs: Sign In | Create Account | API Key */}
              <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={[styles.modeTabBar, { backgroundColor: colors.surfaceSubtle, borderColor: colors.borderSubtle }]}>
                  {(
                    [
                      { id: 'signin', label: 'Sign In' },
                      { id: 'signup', label: 'Create Account' },
                      { id: 'apikey', label: 'API Key' },
                    ] as const
                  ).map((tab) => {
                    const active = authMode === tab.id;
                    return (
                      <TouchableOpacity
                        key={tab.id}
                        style={[
                          styles.modeTabBtn,
                          active && [styles.modeTabBtnActive, { backgroundColor: colors.surface, borderColor: colors.border }],
                        ]}
                        onPress={() => setAuthMode(tab.id)}
                      >
                        <Text
                          style={[
                            styles.modeTabText,
                            { color: active ? colors.primary : colors.textMuted },
                          ]}
                        >
                          {tab.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {authMode !== 'apikey' ? (
                  <>
                    <Text style={[styles.label, { color: colors.textMuted }]}>Work Email *</Text>
                    <View style={[styles.inputWrap, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                      <Mail size={16} color={colors.textDim} />
                      <TextInput
                        style={[styles.input, { color: colors.text }]}
                        value={email}
                        onChangeText={setEmail}
                        placeholder="you@company.com"
                        placeholderTextColor={colors.textDim}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        autoCorrect={false}
                      />
                    </View>

                    <Text style={[styles.label, { color: colors.textMuted }]}>
                      Password {authMode === 'signup' ? '*' : '(required for password accounts)'}
                    </Text>
                    <View style={[styles.inputWrap, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                      <Lock size={16} color={colors.textDim} />
                      <TextInput
                        style={[styles.input, { color: colors.text }]}
                        value={password}
                        onChangeText={setPassword}
                        placeholder={authMode === 'signup' ? 'Create password (6+ chars)' : 'Enter your password'}
                        placeholderTextColor={colors.textDim}
                        autoCapitalize="none"
                        autoCorrect={false}
                        secureTextEntry={!showPassword}
                      />
                      <TouchableOpacity
                        onPress={() => setShowPassword((prev) => !prev)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        {showPassword ? (
                          <EyeOff size={16} color={colors.textDim} />
                        ) : (
                          <Eye size={16} color={colors.textDim} />
                        )}
                      </TouchableOpacity>
                    </View>

                    {authMode === 'signup' && (
                      <>
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
                            placeholder="My Workspace"
                            placeholderTextColor={colors.textDim}
                          />
                        </View>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <Text style={[styles.label, { color: colors.textMuted }]}>Workspace API Key *</Text>
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
                        secureTextEntry={!showPassword}
                      />
                      <TouchableOpacity
                        onPress={() => setShowPassword((prev) => !prev)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        {showPassword ? (
                          <EyeOff size={16} color={colors.textDim} />
                        ) : (
                          <Eye size={16} color={colors.textDim} />
                        )}
                      </TouchableOpacity>
                    </View>

                    <Text style={[styles.label, { color: colors.textMuted }]}>Work Email (Optional)</Text>
                    <View style={[styles.inputWrap, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                      <Mail size={16} color={colors.textDim} />
                      <TextInput
                        style={[styles.input, { color: colors.text }]}
                        value={email}
                        onChangeText={setEmail}
                        placeholder="Matches workspace member"
                        placeholderTextColor={colors.textDim}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        autoCorrect={false}
                      />
                    </View>
                  </>
                )}

                {isBiometricSupported && (
                  <View style={[styles.bioToggleRow, { borderTopColor: colors.borderSubtle }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.bioToggleTitle, { color: colors.text }]}>
                        Enable {biometricLabel} Quick Sign-In
                      </Text>
                      <Text style={[styles.bioToggleSub, { color: colors.textMuted }]}>
                        Store session token in iOS Keychain for instant {biometricLabel} unlock
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
                  {submitting ? (
                    <ActivityIndicator size="small" color={colors.primaryContrast} />
                  ) : (
                    <ShieldCheck size={18} color={colors.primaryContrast} />
                  )}
                  <Text style={[styles.primaryBtnText, { color: colors.primaryContrast }]}>
                    {submitting
                      ? 'Connecting Workspace...'
                      : authMode === 'signup'
                      ? 'Create Workspace Account'
                      : authMode === 'apikey'
                      ? 'Connect with API Key'
                      : 'Sign In to Workspace'}
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
    gap: Spacing.md,
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
  ssoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
  },
  ssoBtnTitle: { fontSize: 15, fontWeight: '700' },
  ssoBtnSub: { fontSize: 11, marginTop: 2 },
  formCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  modeTabBar: {
    flexDirection: 'row',
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: 3,
    gap: 4,
    marginBottom: 4,
  },
  modeTabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: Radius.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  modeTabBtnActive: {
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  modeTabText: { fontSize: 12, fontWeight: '700' },
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
