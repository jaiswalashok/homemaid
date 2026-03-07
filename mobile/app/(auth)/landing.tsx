import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function LandingScreen() {
  const router = useRouter();

  return (
    <LinearGradient colors={['#4F46E5', '#7C3AED']} style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.content}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoEmoji}>🏠</Text>
            <Text style={styles.appName}>HomeMaid</Text>
            <Text style={styles.tagline}>Your smart home assistant</Text>
          </View>

          <View style={styles.features}>
            {[
              { icon: '✅', label: 'Smart daily task scheduling' },
              { icon: '🍳', label: 'Recipe manager with AI' },
              { icon: '🧾', label: 'Expense tracking & scanning' },
              { icon: '🛒', label: 'AI-powered grocery lists' },
            ].map((f, i) => (
              <View key={i} style={styles.featureRow}>
                <Text style={styles.featureIcon}>{f.icon}</Text>
                <Text style={styles.featureLabel}>{f.label}</Text>
              </View>
            ))}
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => router.push('/(auth)/signup')}
            >
              <Text style={styles.primaryBtnText}>Get Started Free</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => router.push('/(auth)/login')}
            >
              <Text style={styles.secondaryBtnText}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: 'space-between',
    paddingVertical: 40,
  },
  logoContainer: { alignItems: 'center', marginTop: 40 },
  logoEmoji: { fontSize: 72, marginBottom: 16 },
  appName: { fontSize: 40, fontWeight: '800', color: '#fff', letterSpacing: -1 },
  tagline: { fontSize: 18, color: 'rgba(255,255,255,0.8)', marginTop: 8 },
  features: { gap: 16 },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: 16,
    gap: 16,
  },
  featureIcon: { fontSize: 28 },
  featureLabel: { fontSize: 16, color: '#fff', fontWeight: '500', flex: 1 },
  actions: { gap: 12 },
  primaryBtn: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#4F46E5', fontSize: 18, fontWeight: '700' },
  secondaryBtn: {
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
  },
  secondaryBtnText: { color: '#fff', fontSize: 18, fontWeight: '600' },
});
