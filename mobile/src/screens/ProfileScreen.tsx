import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

export default function ProfileScreen() {
  const { user, signOut, sendVerificationEmail } = useAuth();
  const { language, setLanguage } = useLanguage();

  const handleSignOut = () => {
    Alert.alert(
      language === 'Hindi' ? 'साइन आउट' : 'Sign Out',
      language === 'Hindi' ? 'क्या आप वाकई साइन आउट करना चाहते हैं?' : 'Are you sure?',
      [
        { text: language === 'Hindi' ? 'रद्द' : 'Cancel', style: 'cancel' },
        { text: language === 'Hindi' ? 'साइन आउट' : 'Sign Out', style: 'destructive', onPress: async () => {
          try { await signOut(); } catch { Alert.alert('Error', 'Failed to sign out'); }
        }},
      ]
    );
  };

  const handleResendVerification = async () => {
    try {
      await sendVerificationEmail();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('✅', language === 'Hindi' ? 'सत्यापन ईमेल भेजा गया!' : 'Verification email sent!');
    } catch { Alert.alert('Error', 'Failed to send verification email'); }
  };

  const initial = user?.displayName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || '?';

  return (
    <ScrollView style={s.container} showsVerticalScrollIndicator={false}>
      <View style={s.header}>
        <View style={s.avatar}><Text style={s.avatarText}>{initial}</Text></View>
        <Text style={s.name}>{user?.displayName || user?.email?.split('@')[0]}</Text>
        <Text style={s.email}>{user?.email}</Text>
        {user?.emailVerified ? (
          <View style={s.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={14} color="#059669" />
            <Text style={s.verifiedText}>{language === 'Hindi' ? 'सत्यापित' : 'Verified'}</Text>
          </View>
        ) : (
          <TouchableOpacity style={s.unverifiedBadge} onPress={handleResendVerification}>
            <Ionicons name="alert-circle" size={14} color="#d97706" />
            <Text style={s.unverifiedText}>{language === 'Hindi' ? 'ईमेल सत्यापित करें' : 'Verify Email'}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Settings */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>{language === 'Hindi' ? 'सेटिंग्स' : 'Settings'}</Text>

        <View style={s.card}>
          <View style={s.row}>
            <View style={s.rowLeft}>
              <Ionicons name="language" size={20} color="#ea580c" />
              <Text style={s.rowLabel}>{language === 'Hindi' ? 'भाषा' : 'Language'}</Text>
            </View>
            <View style={s.langToggle}>
              <Text style={[s.langOpt, language === 'English' && s.langActive]}>EN</Text>
              <Switch
                value={language === 'Hindi'}
                onValueChange={(val) => { setLanguage(val ? 'Hindi' : 'English'); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                trackColor={{ false: '#e5e7eb', true: '#fed7aa' }}
                thumbColor={language === 'Hindi' ? '#ea580c' : '#fff'}
                style={{ marginHorizontal: 6 }}
              />
              <Text style={[s.langOpt, language === 'Hindi' && s.langActive]}>हि</Text>
            </View>
          </View>
        </View>

        <View style={s.card}>
          <View style={s.row}>
            <View style={s.rowLeft}>
              <Ionicons name="notifications-outline" size={20} color="#3b82f6" />
              <Text style={s.rowLabel}>{language === 'Hindi' ? 'सूचनाएं' : 'Notifications'}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#d1d5db" />
          </View>
        </View>
      </View>

      {/* About */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>{language === 'Hindi' ? 'ऐप के बारे में' : 'About'}</Text>

        <View style={s.card}>
          <View style={s.row}>
            <View style={s.rowLeft}>
              <Ionicons name="information-circle-outline" size={20} color="#6b7280" />
              <Text style={s.rowLabel}>{language === 'Hindi' ? 'संस्करण' : 'Version'}</Text>
            </View>
            <Text style={s.rowValue}>1.0.0</Text>
          </View>
        </View>

        <View style={s.card}>
          <View style={s.row}>
            <View style={s.rowLeft}>
              <Ionicons name="sparkles" size={20} color="#7c3aed" />
              <Text style={s.rowLabel}>{language === 'Hindi' ? 'AI द्वारा संचालित' : 'Powered by AI'}</Text>
            </View>
            <Text style={s.rowValue}>Gemini</Text>
          </View>
        </View>
      </View>

      {/* Sign Out */}
      <View style={s.section}>
        <TouchableOpacity style={s.signOutBtn} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={20} color="#dc2626" />
          <Text style={s.signOutText}>{language === 'Hindi' ? 'साइन आउट' : 'Sign Out'}</Text>
        </TouchableOpacity>
      </View>

      <View style={s.footer}>
        <Text style={s.footerText}>🍲 HomeMaid</Text>
        <Text style={s.footerSubtext}>{language === 'Hindi' ? 'आपके घर के लिए बनाया गया' : 'Made for your home'}</Text>
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#faf7f5' },
  header: { alignItems: 'center', paddingTop: 60, paddingBottom: 24, backgroundColor: '#fff' },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#ea580c', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText: { fontSize: 28, fontWeight: '700', color: '#fff' },
  name: { fontSize: 20, fontWeight: '700', color: '#111827' },
  email: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#ecfdf5', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, marginTop: 8 },
  verifiedText: { fontSize: 12, color: '#059669', fontWeight: '600' },
  unverifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#fffbeb', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, marginTop: 8 },
  unverifiedText: { fontSize: 12, color: '#d97706', fontWeight: '600' },
  section: { paddingHorizontal: 20, paddingTop: 20 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  card: { backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 3, elevation: 1 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowLabel: { fontSize: 15, color: '#1f2937', fontWeight: '500' },
  rowValue: { fontSize: 13, color: '#9ca3af' },
  langToggle: { flexDirection: 'row', alignItems: 'center' },
  langOpt: { fontSize: 13, fontWeight: '600', color: '#d1d5db' },
  langActive: { color: '#ea580c' },
  signOutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#fef2f2', borderRadius: 14, paddingVertical: 16, borderWidth: 1, borderColor: '#fecaca' },
  signOutText: { fontSize: 15, fontWeight: '600', color: '#dc2626' },
  footer: { alignItems: 'center', paddingVertical: 24 },
  footerText: { fontSize: 16, fontWeight: '700', color: '#d1d5db' },
  footerSubtext: { fontSize: 12, color: '#d1d5db', marginTop: 2 },
});
