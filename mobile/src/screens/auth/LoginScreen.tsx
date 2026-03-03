import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';

type AuthMode = 'login' | 'signup' | 'forgot-password';

export default function LoginScreen() {
  const { signIn, signUp, resetPassword } = useAuth();
  const { language } = useLanguage();
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'forgot-password') {
        await resetPassword(email);
        Alert.alert(
          'Success',
          'Password reset email sent! Check your inbox.',
          [{ text: 'OK', onPress: () => setMode('login') }]
        );
      } else if (mode === 'signup') {
        if (!password || password.length < 6) {
          Alert.alert('Error', 'Password must be at least 6 characters');
          return;
        }
        await signUp(email, password);
        Alert.alert(
          'Success',
          'Account created! Please check your email to verify your account.',
          [{ text: 'OK', onPress: () => setMode('login') }]
        );
      } else {
        if (!password) {
          Alert.alert('Error', 'Please enter your password');
          return;
        }
        await signIn(email, password);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.logo}>🏠</Text>
          <Text style={styles.title}>
            {language === 'Hindi' ? 'होममेड' : 'HomeMaid'}
          </Text>
          <Text style={styles.subtitle}>
            {mode === 'forgot-password'
              ? language === 'Hindi'
                ? 'पासवर्ड रीसेट करें'
                : 'Reset Password'
              : mode === 'signup'
              ? language === 'Hindi'
                ? 'खाता बनाएं'
                : 'Create Account'
              : language === 'Hindi'
              ? 'स्वागत है'
              : 'Welcome Back'}
          </Text>
        </View>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder={language === 'Hindi' ? 'ईमेल' : 'Email'}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />

          {mode !== 'forgot-password' && (
            <TextInput
              style={styles.input}
              placeholder={language === 'Hindi' ? 'पासवर्ड' : 'Password'}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />
          )}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading
                ? language === 'Hindi'
                  ? 'प्रतीक्षा करें...'
                  : 'Please wait...'
                : mode === 'forgot-password'
                ? language === 'Hindi'
                  ? 'रीसेट लिंक भेजें'
                  : 'Send Reset Link'
                : mode === 'signup'
                ? language === 'Hindi'
                  ? 'साइन अप करें'
                  : 'Sign Up'
                : language === 'Hindi'
                ? 'लॉगिन करें'
                : 'Login'}
            </Text>
          </TouchableOpacity>

          {mode === 'login' && (
            <TouchableOpacity onPress={() => setMode('forgot-password')}>
              <Text style={styles.link}>
                {language === 'Hindi' ? 'पासवर्ड भूल गए?' : 'Forgot Password?'}
              </Text>
            </TouchableOpacity>
          )}

          <View style={styles.footer}>
            {mode === 'login' ? (
              <>
                <Text style={styles.footerText}>
                  {language === 'Hindi' ? 'खाता नहीं है?' : "Don't have an account?"}
                </Text>
                <TouchableOpacity onPress={() => setMode('signup')}>
                  <Text style={styles.footerLink}>
                    {language === 'Hindi' ? 'साइन अप करें' : 'Sign Up'}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.footerText}>
                  {language === 'Hindi' ? 'पहले से खाता है?' : 'Already have an account?'}
                </Text>
                <TouchableOpacity onPress={() => setMode('login')}>
                  <Text style={styles.footerLink}>
                    {language === 'Hindi' ? 'लॉगिन करें' : 'Login'}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#faf7f5',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logo: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  form: {
    width: '100%',
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#f97316',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  link: {
    color: '#f97316',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  footerText: {
    color: '#6b7280',
    fontSize: 14,
  },
  footerLink: {
    color: '#f97316',
    fontSize: 14,
    fontWeight: '600',
  },
});
