import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  User,
  Globe,
  LogOut,
  ChevronRight,
  Info,
  Bell,
  Shield,
  Moon,
  Bug,
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useLanguage, LANGUAGES, Language } from '../context/LanguageContext';
import { COLORS, SPACING, RADIUS } from '../config/theme';
import DebugScreen from './DebugScreen';

export default function SettingsScreen() {
  const { user, profile, signOut } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const [showDebug, setShowDebug] = React.useState(false);

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  };

  const handleLanguageToggle = () => {
    const nextLang: Language = language === 'English' ? 'Hindi' : 'English';
    setLanguage(nextLang);
  };

  const displayName = profile
    ? `${profile.firstName} ${profile.lastName}`.trim()
    : user?.displayName || 'User';

  if (showDebug) {
    return <DebugScreen onBack={() => setShowDebug(false)} />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('settings')}</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {displayName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{displayName}</Text>
            <Text style={styles.profileEmail}>{user?.email}</Text>
          </View>
        </View>

        {/* Settings Sections */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>

          <TouchableOpacity style={styles.settingItem} onPress={handleLanguageToggle}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: '#EFF6FF' }]}>
                <Globe size={18} color="#3B82F6" />
              </View>
              <View>
                <Text style={styles.settingLabel}>{t('language')}</Text>
                <Text style={styles.settingValue}>{language}</Text>
              </View>
            </View>
            <ChevronRight size={18} color={COLORS.gray} />
          </TouchableOpacity>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: '#FFF7ED' }]}>
                <Bell size={18} color={COLORS.recipes} />
              </View>
              <View>
                <Text style={styles.settingLabel}>Notifications</Text>
                <Text style={styles.settingValue}>Enabled</Text>
              </View>
            </View>
            <ChevronRight size={18} color={COLORS.gray} />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: '#F5F3FF' }]}>
                <Moon size={18} color={COLORS.expenses} />
              </View>
              <View>
                <Text style={styles.settingLabel}>Appearance</Text>
                <Text style={styles.settingValue}>Light</Text>
              </View>
            </View>
            <ChevronRight size={18} color={COLORS.gray} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: '#F0FDF4' }]}>
                <Info size={18} color={COLORS.success} />
              </View>
              <View>
                <Text style={styles.settingLabel}>Version</Text>
                <Text style={styles.settingValue}>1.0.0</Text>
              </View>
            </View>
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: '#FEF2F2' }]}>
                <Shield size={18} color={COLORS.urgent} />
              </View>
              <View>
                <Text style={styles.settingLabel}>Privacy Policy</Text>
              </View>
            </View>
            <ChevronRight size={18} color={COLORS.gray} />
          </View>

          <TouchableOpacity style={styles.settingItem} onPress={() => setShowDebug(true)}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: '#F3F4F6' }]}>
                <Bug size={18} color={COLORS.gray} />
              </View>
              <View>
                <Text style={styles.settingLabel}>Debug Logs</Text>
                <Text style={styles.settingValue}>View app logs</Text>
              </View>
            </View>
            <ChevronRight size={18} color={COLORS.gray} />
          </TouchableOpacity>
        </View>

        {/* Sign Out */}
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <LogOut size={18} color={COLORS.urgent} />
          <Text style={styles.signOutText}>{t('signOut')}</Text>
        </TouchableOpacity>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>🏠 HomeHelp</Text>
          <Text style={styles.footerSubtext}>Your Smart Home Assistant</Text>
          <Text style={styles.footerCopy}>© 2026 HomeHelp. All rights reserved.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.primary,
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: COLORS.white },
  content: { flex: 1 },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarText: { fontSize: 24, fontWeight: '700', color: COLORS.white },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },
  profileEmail: { fontSize: 14, color: COLORS.textSecondary, marginTop: 2 },
  section: {
    marginTop: SPACING.lg,
    marginHorizontal: SPACING.md,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.gray,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    paddingLeft: 4,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 4,
  },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingLabel: { fontSize: 15, fontWeight: '500', color: COLORS.textPrimary },
  settingValue: { fontSize: 12, color: COLORS.textSecondary, marginTop: 1 },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    marginHorizontal: SPACING.md,
    marginTop: SPACING.xl,
    paddingVertical: 16,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#FECACA',
    gap: 8,
  },
  signOutText: { fontSize: 16, fontWeight: '600', color: COLORS.urgent },
  footer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    paddingBottom: 40,
  },
  footerText: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },
  footerSubtext: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4 },
  footerCopy: { fontSize: 11, color: COLORS.border, marginTop: 8 },
});
