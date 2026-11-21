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
  ActivityIndicator,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import * as AppleAuthentication from 'expo-apple-authentication';
import Svg, { Path } from 'react-native-svg';
import {
  ScanFace,
  ShieldCheck,
  Mail,
  X,
  ArrowRight,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
} from 'lucide-react-native';
import { Spacing, Radius } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

function GoogleLogo({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <Path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <Path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
        fill="#FBBC05"
      />
      <Path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
        fill="#EA4335"
      />
    </Svg>
  );
}

export function AuthModal() {
  const { colors, isDark } = useTheme();
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
    signInWithApple,
    enterDemoMode,
    orgSettings,
  } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [enableBiometrics, setEnableBiometrics] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [ssoLoading, setSsoLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [appleAuthAvailable, setAppleAuthAvailable] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  const visible = !isLoading && (isAuthModalOpen || user === null || isBiometricLocked);

  useEffect(() => {
    if (Platform.OS === 'ios') {
      AppleAuthentication.isAvailableAsync()
        .then(setAppleAuthAvailable)
        .catch(() => setAppleAuthAvailable(false));
    }
  }, []);

  useEffect(() => {
    if (visible && user && !isDemoMode) {
      setEmail(user.email || '');
    }
    if (!visible) {
      setErrorText(null);
    }
  }, [visible, user, isDemoMode]);

  useEffect(() => {
    if (visible && isBiometricLocked && isBiometricSupported) {
      authenticateWithFaceId();
    }
  }, [visible, isBiometricLocked, isBiometricSupported, authenticateWithFaceId]);

  const handleFaceIdPress = async () => {
    setErrorText(null);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    const ok = await authenticateWithFaceId();
    if (!ok) {
      setErrorText(`Could not verify ${biometricLabel}. Try again or sign in below.`);
    } else if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
  };

  const handleAppleSignIn = async () => {
    setErrorText(null);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    setAppleLoading(true);
    try {
      const res = await signInWithApple();
      if (res.ok) {
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        }
      } else if (res.error) {
        setErrorText(res.error);
      }
    } catch (err: any) {
      setErrorText(err?.message || 'Unable to complete Sign in with Apple.');
    } finally {
      setAppleLoading(false);
    }
  };

  const handleCloudSSO = async () => {
    setErrorText(null);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    setSsoLoading(true);
    try {
      const res = await signInWithCloudSSO();
      if (res.ok) {
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        }
      } else if (res.error) {
        setErrorText(res.error);
      }
    } catch (err: any) {
      setErrorText(err?.message || 'Unable to complete Google sign-in.');
    } finally {
      setSsoLoading(false);
    }
  };

  const handleEmailSignIn = async () => {
    setErrorText(null);
    const cleanEmail = email.trim();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorText('Please enter a valid work email address.');
      return;
    }
    if (!password) {
      setErrorText('Please enter your password.');
      return;
    }

    setSubmitting(true);
    try {
      await signInWithWorkspace({
        email: cleanEmail,
        password,
        mode: 'signin',
        enableBiometrics: isBiometricSupported && enableBiometrics,
      });
      setPassword('');
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }
    } catch (err: any) {
      setErrorText(err?.message || 'Unable to sign in right now. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoStudio = async () => {
    setErrorText(null);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
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
            <View style={{ flexShrink: 1 }}>
              <Text style={[styles.headerTitle, { color: colors.text }]}>
                {isBiometricLocked ? 'Workspace Locked' : 'Sign in to VeloTime'}
              </Text>
              <Text style={[styles.headerSub, { color: colors.textMuted }]}>
                {isBiometricLocked
                  ? `${biometricLabel} protection enabled`
                  : 'Sign in with Apple, Google, or your work email to sync your timesheets.'}
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

              {errorText ? (
                <View style={[styles.errorBanner, { borderColor: colors.danger, marginBottom: Spacing.md }]}>
                  <AlertCircle size={15} color={colors.danger} />
                  <Text style={[styles.errorBannerText, { color: colors.danger }]}>{errorText}</Text>
                </View>
              ) : null}

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
                style={[styles.secondaryBtn, { borderColor: colors.border, backgroundColor: colors.surfaceSubtle, marginTop: Spacing.sm }]}
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
              {/* Face ID Quick Unlock Button when saved Keychain credentials exist */}
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
                      Unlock with {biometricLabel}
                    </Text>
                    <Text style={[styles.faceIdSub, { color: colors.textMuted }]}>
                      Restore your saved workspace session
                    </Text>
                  </View>
                  <ArrowRight size={18} color={colors.primary} />
                </TouchableOpacity>
              )}

              {/* Native Sign in with Apple Button (iOS Guideline 4.8) */}
              {Platform.OS === 'ios' && appleAuthAvailable && (
                <View
                  pointerEvents={appleLoading || ssoLoading || submitting ? 'none' : 'auto'}
                  style={{ opacity: appleLoading || ssoLoading || submitting ? 0.7 : 1 }}
                >
                  <AppleAuthentication.AppleAuthenticationButton
                    buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                    buttonStyle={
                      isDark
                        ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
                        : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
                    }
                    cornerRadius={12}
                    style={styles.appleBtn}
                    onPress={handleAppleSignIn}
                  />
                </View>
              )}

              {/* Dedicated Sign in with Google Button */}
              <TouchableOpacity
                style={[
                  styles.googleBtn,
                  { opacity: appleLoading || ssoLoading || submitting ? 0.7 : 1 },
                ]}
                onPress={handleCloudSSO}
                disabled={appleLoading || ssoLoading || submitting}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Sign in with Google"
              >
                {ssoLoading ? (
                  <ActivityIndicator size="small" color="#0F172A" />
                ) : (
                  <GoogleLogo size={20} />
                )}
                <Text style={styles.googleBtnText}>
                  {ssoLoading ? 'Connecting to Google...' : 'Sign in with Google'}
                </Text>
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.dividerRow}>
                <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                <Text style={[styles.dividerText, { color: colors.textDim }]}>
                  OR SIGN IN WITH EMAIL
                </Text>
                <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              </View>

              {/* Sign in with Email Card */}
              <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.label, { color: colors.textMuted }]}>Work Email</Text>
                <View style={[styles.inputWrap, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                  <Mail size={16} color={colors.textDim} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      if (errorText) setErrorText(null);
                    }}
                    placeholder="name@company.com"
                    placeholderTextColor={colors.textDim}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoCorrect={false}
                    textContentType="emailAddress"
                  />
                </View>

                <Text style={[styles.label, { color: colors.textMuted }]}>Password</Text>
                <View style={[styles.inputWrap, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                  <Lock size={16} color={colors.textDim} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      if (errorText) setErrorText(null);
                    }}
                    placeholder="Enter your password"
                    placeholderTextColor={colors.textDim}
                    autoCapitalize="none"
                    autoCorrect={false}
                    secureTextEntry={!showPassword}
                    textContentType="password"
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword((prev) => !prev)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff size={16} color={colors.textDim} />
                    ) : (
                      <Eye size={16} color={colors.textDim} />
                    )}
                  </TouchableOpacity>
                </View>

                {isBiometricSupported && (
                  <View style={[styles.bioToggleRow, { borderTopColor: colors.borderSubtle }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.bioToggleTitle, { color: colors.text }]}>
                        Enable {biometricLabel} quick unlock
                      </Text>
                      <Text style={[styles.bioToggleSub, { color: colors.textMuted }]}>
                        Save encrypted session in iOS Keychain
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

                {errorText ? (
                  <View style={[styles.errorBanner, { borderColor: colors.danger }]}>
                    <AlertCircle size={15} color={colors.danger} />
                    <Text style={[styles.errorBannerText, { color: colors.danger }]}>
                      {errorText}
                    </Text>
                  </View>
                ) : null}

                <TouchableOpacity
                  style={[
                    styles.primaryBtn,
                    {
                      backgroundColor: colors.primary,
                      opacity: appleLoading || submitting || ssoLoading ? 0.7 : 1,
                    },
                  ]}
                  onPress={handleEmailSignIn}
                  disabled={appleLoading || submitting || ssoLoading}
                  activeOpacity={0.85}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color={colors.primaryContrast} />
                  ) : (
                    <ShieldCheck size={18} color={colors.primaryContrast} />
                  )}
                  <Text style={[styles.primaryBtnText, { color: colors.primaryContrast }]}>
                    {submitting ? 'Signing In...' : 'Sign In with Email'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Subtle Demo Option */}
              <TouchableOpacity
                style={styles.demoLinkBtn}
                onPress={handleDemoStudio}
                activeOpacity={0.7}
              >
                <Text style={[styles.demoLinkText, { color: colors.textMuted }]}>
                  Try Interactive Demo Studio
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
    gap: 12,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
  },
  brandRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  brandBadge: {
    width: 34,
    height: 34,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandBadgeText: { fontSize: 18, fontWeight: '800' },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  headerSub: { fontSize: 12, fontWeight: '500', marginTop: 2 },
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
  appleBtn: {
    width: '100%',
    height: 48,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: Spacing.lg,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  googleBtnText: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '700',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 2,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  formCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  label: { fontSize: 12, fontWeight: '600', marginTop: 4 },
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
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    marginTop: Spacing.xs,
    width: '100%',
  },
  errorBannerText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 17,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: Radius.md,
    marginTop: Spacing.sm,
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
  demoLinkBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
  },
  demoLinkText: {
    fontSize: 13,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
