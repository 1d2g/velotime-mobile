import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from 'expo-router';
import { Clock, ShieldCheck, Zap } from 'lucide-react-native';
import { useTheme } from '@/src/context/ThemeContext';
import { Spacing, Radius } from '@/src/constants/theme';

export default function ModalScreen() {
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.header}>
          <Clock color={colors.primary} size={28} strokeWidth={2.2} />
          <Text style={[styles.title, { color: colors.text }]}>VeloTime Mobile</Text>
          <Text style={[styles.subtitle, { color: colors.textDim }]}>Native Architecture & Offline Sync</Text>
        </View>

        <View style={styles.infoRow}>
          <ShieldCheck color={colors.primary} size={18} style={{ marginRight: Spacing.sm }} />
          <Text style={[styles.infoText, { color: colors.textMuted }]}>
            Full offline caching via AsyncStorage with automatic Railway cloud synchronization.
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Zap color={colors.primary} size={18} style={{ marginRight: Spacing.sm }} />
          <Text style={[styles.infoText, { color: colors.textMuted }]}>
            Haptic feedback and 60fps native performance built for high-throughput tracking.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.dismissBtn, { backgroundColor: colors.surfaceSubtle, borderColor: colors.borderSubtle }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.dismissBtnText, { color: colors.primary }]}>Close Details</Text>
        </TouchableOpacity>
      </View>

      <StatusBar style={isDark ? 'light' : 'dark'} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  card: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 400,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: Spacing.sm,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  dismissBtn: {
    borderWidth: 1,
    borderRadius: Radius.md,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.lg,
  },
  dismissBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
