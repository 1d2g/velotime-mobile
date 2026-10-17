import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from 'expo-router';
import { Clock, ShieldCheck, Zap } from 'lucide-react-native';
import { Colors, Spacing, Radius } from '@/src/constants/theme';

export default function ModalScreen() {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.header}>
          <Clock color={Colors.primary} size={28} strokeWidth={2.2} />
          <Text style={styles.title}>VeloTime Mobile</Text>
          <Text style={styles.subtitle}>Native Architecture & Offline Sync</Text>
        </View>

        <View style={styles.infoRow}>
          <ShieldCheck color={Colors.primary} size={18} style={{ marginRight: Spacing.sm }} />
          <Text style={styles.infoText}>
            Full offline caching via AsyncStorage with automatic Railway cloud synchronization.
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Zap color={Colors.primary} size={18} style={{ marginRight: Spacing.sm }} />
          <Text style={styles.infoText}>
            Haptic feedback and 60fps native performance built for high-throughput tracking.
          </Text>
        </View>

        <TouchableOpacity style={styles.dismissBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.dismissBtnText}>Close Details</Text>
        </TouchableOpacity>
      </View>

      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 400,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  title: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: '700',
    marginTop: Spacing.sm,
  },
  subtitle: {
    color: Colors.textDim,
    fontSize: 13,
    marginTop: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  infoText: {
    color: Colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  dismissBtn: {
    backgroundColor: Colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    borderRadius: Radius.md,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.lg,
  },
  dismissBtnText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
});
