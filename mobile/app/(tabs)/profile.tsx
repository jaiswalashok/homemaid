import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/lib/auth-context';

export default function ProfileScreen() {
  const { user, profile, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel' },
      {
        text: 'Sign Out', style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/(auth)/landing');
        },
      },
    ]);
  };

  const initials = (user?.displayName || user?.email || 'U')
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.displayName}>{user?.displayName || 'User'}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          <View style={styles.tierBadge}>
            <Text style={styles.tierText}>{profile?.tier === 'premium' ? '⭐ Premium' : '🆓 Free Plan'}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.card}>
            <SettingsRow icon="👤" label="Display Name" value={user?.displayName || '—'} />
            <View style={styles.divider} />
            <SettingsRow icon="📧" label="Email" value={user?.email || '—'} />
            <View style={styles.divider} />
            <SettingsRow icon="🔐" label="Account Status" value={user?.emailVerified ? 'Verified' : 'Unverified'} valueColor={user?.emailVerified ? '#10B981' : '#F59E0B'} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App</Text>
          <View style={styles.card}>
            <SettingsRow icon="🌐" label="Server" value="jaiswals.live" />
            <View style={styles.divider} />
            <SettingsRow icon="📱" label="Version" value="1.0.0" />
            <View style={styles.divider} />
            <SettingsRow icon="🔥" label="Firebase Project" value="homemaid-f7a6e" />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Features</Text>
          <View style={styles.featuresGrid}>
            {[
              { icon: '✅', label: 'Smart Tasks', desc: 'Daily, weekly & monthly scheduling' },
              { icon: '🍳', label: 'Recipes', desc: 'AI-powered recipe import' },
              { icon: '🧾', label: 'Expenses', desc: 'Receipt scanning & tracking' },
              { icon: '🛒', label: 'Grocery', desc: 'AI grocery list parser' },
            ].map((f, i) => (
              <View key={i} style={styles.featureCard}>
                <Text style={styles.featureIcon}>{f.icon}</Text>
                <Text style={styles.featureLabel}>{f.label}</Text>
                <Text style={styles.featureDesc}>{f.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingsRow({ icon, label, value, valueColor }: { icon: string; label: string; value: string; valueColor?: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowIcon}>{icon}</Text>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, valueColor ? { color: valueColor } : {}]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F9FAFB' },
  container: { paddingBottom: 40 },
  header: { alignItems: 'center', paddingVertical: 32, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#4F46E5', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText: { color: '#fff', fontSize: 28, fontWeight: '800' },
  displayName: { fontSize: 22, fontWeight: '800', color: '#111827' },
  email: { fontSize: 14, color: '#9CA3AF', marginTop: 4 },
  tierBadge: { marginTop: 10, backgroundColor: '#EEF2FF', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20 },
  tierText: { color: '#4F46E5', fontWeight: '700', fontSize: 13 },
  section: { paddingHorizontal: 16, marginTop: 24 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  card: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  rowIcon: { fontSize: 20 },
  rowLabel: { flex: 1, fontSize: 15, color: '#374151', fontWeight: '500' },
  rowValue: { fontSize: 14, color: '#9CA3AF', fontWeight: '500' },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginLeft: 52 },
  featuresGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  featureCard: { width: '47%', backgroundColor: '#fff', borderRadius: 16, padding: 16, gap: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  featureIcon: { fontSize: 28 },
  featureLabel: { fontSize: 14, fontWeight: '700', color: '#111827', marginTop: 8 },
  featureDesc: { fontSize: 12, color: '#9CA3AF' },
  signOutBtn: { marginHorizontal: 16, marginTop: 32, backgroundColor: '#FEF2F2', borderRadius: 16, paddingVertical: 16, alignItems: 'center', borderWidth: 1.5, borderColor: '#FECACA' },
  signOutText: { color: '#EF4444', fontWeight: '700', fontSize: 16 },
});
