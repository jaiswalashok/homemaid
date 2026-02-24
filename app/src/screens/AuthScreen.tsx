import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
  Dimensions,
  Linking,
} from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useAuth } from '../context/AuthContext';
import { COLORS, SPACING } from '../config/theme';
import Constants from 'expo-constants';

WebBrowser.maybeCompleteAuthSession();

const { width } = Dimensions.get('window');

type AuthMode = 'login' | 'signup';

export default function AuthScreen() {
  const { initiateSignUp, signIn, signInWithApple, signInWithGoogle, resetPassword, pendingEmail } = useAuth();
  const [mode, setMode] = useState<AuthMode>(pendingEmail ? 'login' : 'login');
  const [email, setEmail] = useState(pendingEmail || '');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const googleIosClientId = Constants.expoConfig?.extra?.googleIosClientId || '';
  const googleAndroidClientId = Constants.expoConfig?.extra?.googleAndroidClientId || '';
  const googleWebClientId = Constants.expoConfig?.extra?.googleWebClientId || '';
  
  const [, googleResponse, googlePromptAsync] = Google.useAuthRequest({
    iosClientId: googleIosClientId,
    androidClientId: googleAndroidClientId,
    webClientId: googleWebClientId,
    scopes: ['profile', 'email'],
    redirectUri: 'com.ashokjaiswal.home:/oauthredirect',
  });

  React.useEffect(() => {
    if (googleResponse?.type === 'success') {
      const { id_token } = googleResponse.params;
      if (id_token) {
        handleGoogleSignIn(id_token);
      }
    }
  }, [googleResponse]);

  const handleGoogleSignIn = async (idToken: string) => {
    setLoading(true);
    const result = await signInWithGoogle(idToken);
    if (!result.success) {
      Alert.alert('Error', result.message);
    }
    setLoading(false);
  };

  const handleEmailAuth = async () => {
    console.log('[AuthScreen] Email auth attempt:', { mode, email: email.trim(), hasPassword: !!password.trim(), hasName: !!name.trim() });
    
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email.');
      return;
    }

    if (mode === 'login') {
      if (!password.trim()) {
        Alert.alert('Error', 'Please enter your password.');
        return;
      }
      setLoading(true);
      console.log('[AuthScreen] Attempting sign in...');
      const result = await signIn(email.trim(), password);
      console.log('[AuthScreen] Sign in result:', result);
      if (!result.success) {
        Alert.alert('Error', result.message);
      }
      setLoading(false);
    } else {
      if (!name.trim()) {
        Alert.alert('Error', 'Please enter your name.');
        return;
      }
      setLoading(true);
      console.log('[AuthScreen] Attempting sign up...');
      const result = await initiateSignUp(email.trim(), name.trim());
      console.log('[AuthScreen] Sign up result:', result);
      if (!result.success) {
        Alert.alert('Error', result.message);
      }
      setLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    try {
      const nonce = Math.random().toString(36).substring(2, 10);
      const hashedNonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        nonce
      );

      const appleCredential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      });

      if (appleCredential.identityToken) {
        setLoading(true);
        const result = await signInWithApple(
          appleCredential.identityToken,
          nonce,
          {
            givenName: appleCredential.fullName?.givenName || undefined,
            familyName: appleCredential.fullName?.familyName || undefined,
          }
        );
        if (!result.success) {
          Alert.alert('Error', result.message);
        }
        setLoading(false);
      }
    } catch (error: any) {
      if (error.code !== 'ERR_REQUEST_CANCELED') {
        Alert.alert('Error', 'Apple sign in failed.');
      }
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Forgot Password', 'Please enter your email first, then tap Forgot Password.');
      return;
    }
    setLoading(true);
    const result = await resetPassword(email.trim());
    Alert.alert(result.success ? 'Success' : 'Error', result.message);
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoContainer}>
          <Text style={styles.logoIcon}>🏠</Text>
          <Text style={styles.logoText}>HomeHelp</Text>
          <Text style={styles.logoSubtext}>Your Smart Home Assistant</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.title}>
            {mode === 'login' ? 'Welcome Back' : 'Create Account'}
          </Text>
          <Text style={styles.subtitle}>
            {mode === 'login'
              ? 'Sign in to continue'
              : 'Sign up to get started'}
          </Text>

          {mode === 'signup' && (
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              placeholderTextColor={COLORS.gray}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              autoCorrect={false}
            />
          )}

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={COLORS.gray}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          {mode === 'login' && (
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={COLORS.gray}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          )}

          <TouchableOpacity
            style={[styles.primaryButton, loading && styles.disabledButton]}
            onPress={handleEmailAuth}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.primaryButtonText}>
                {mode === 'login' ? 'Sign In' : 'Continue'}
              </Text>
            )}
          </TouchableOpacity>

          {mode === 'login' && (
            <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotButton}>
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>
          )}

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {Platform.OS === 'ios' && (
            <TouchableOpacity style={styles.socialButton} onPress={handleAppleSignIn}>
              <Text style={styles.appleIcon}>&#xF8FF;</Text>
              <Text style={styles.socialButtonText}>Continue with Apple</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.socialButton, styles.googleButton]}
            onPress={() => googlePromptAsync()}
          >
            <Text style={styles.googleIcon}>G</Text>
            <Text style={[styles.socialButtonText, styles.googleButtonText]}>
              Continue with Google
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setMode(mode === 'login' ? 'signup' : 'login');
              setPassword('');
              setName('');
            }}
            style={styles.switchButton}
          >
            <Text style={styles.switchText}>
              {mode === 'login'
                ? "Don't have an account? "
                : 'Already have an account? '}
              <Text style={styles.switchTextBold}>
                {mode === 'login' ? 'Sign Up' : 'Sign In'}
              </Text>
            </Text>
          </TouchableOpacity>

          <Text style={styles.legalText}>
            By continuing, you agree to our Terms and Privacy Policy.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: 80,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  logoIcon: {
    fontSize: width * 0.18,
  },
  logoText: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.primary,
    marginTop: 8,
  },
  logoSubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  formContainer: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  input: {
    backgroundColor: COLORS.inputBackground,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  disabledButton: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '600',
  },
  forgotButton: {
    alignSelf: 'center',
    marginTop: 12,
  },
  forgotText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    color: COLORS.gray,
    paddingHorizontal: SPACING.md,
    fontSize: 14,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.black,
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 12,
  },
  appleIcon: {
    color: COLORS.white,
    fontSize: 20,
    marginRight: 8,
  },
  socialButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  googleButton: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  googleIcon: {
    fontSize: 20,
    fontWeight: '700',
    marginRight: 8,
    color: '#4285F4',
  },
  googleButtonText: {
    color: COLORS.textPrimary,
  },
  switchButton: {
    alignSelf: 'center',
    marginTop: SPACING.lg,
    paddingVertical: 8,
  },
  switchText: {
    fontSize: 15,
    color: COLORS.textSecondary,
  },
  switchTextBold: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  legalText: {
    textAlign: 'center',
    fontSize: 12,
    color: COLORS.gray,
    lineHeight: 18,
    marginTop: 16,
    paddingHorizontal: 8,
  },
});
