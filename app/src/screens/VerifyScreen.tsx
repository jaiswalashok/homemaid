import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { COLORS, SPACING } from '../config/theme';

export default function VerifyScreen() {
  const { verificationState, verifyCodeAndSignUp, resendVerificationCode, cancelVerification } = useAuth();
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleVerify = async () => {
    if (!code.trim()) {
      Alert.alert('Error', 'Please enter the verification code.');
      return;
    }
    if (!password.trim() || password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }

    setLoading(true);
    const result = await verifyCodeAndSignUp(code.trim(), password);
    if (!result.success) {
      Alert.alert('Error', result.message);
      if (result.emailExists) {
        cancelVerification();
      }
    }
    setLoading(false);
  };

  const handleResend = async () => {
    setResending(true);
    const result = await resendVerificationCode();
    Alert.alert(result.success ? 'Success' : 'Error', result.message);
    setResending(false);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={styles.icon}>📧</Text>
        <Text style={styles.title}>Verify Your Email</Text>
        <Text style={styles.subtitle}>
          We sent a verification code to{'\n'}
          <Text style={styles.email}>{verificationState?.email}</Text>
        </Text>

        <TextInput
          style={styles.codeInput}
          placeholder="Enter 4-digit code"
          placeholderTextColor={COLORS.gray}
          value={code}
          onChangeText={setCode}
          keyboardType="number-pad"
          maxLength={4}
          textAlign="center"
        />

        <TextInput
          style={styles.input}
          placeholder="Create Password (min 6 chars)"
          placeholderTextColor={COLORS.gray}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          placeholderTextColor={COLORS.gray}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={[styles.primaryButton, loading && styles.disabledButton]}
          onPress={handleVerify}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.primaryButtonText}>Create Account</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={handleResend} disabled={resending} style={styles.resendButton}>
          <Text style={styles.resendText}>
            {resending ? 'Sending...' : "Didn't receive the code? Resend"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={cancelVerification} style={styles.backButton}>
          <Text style={styles.backText}>← Back to Sign In</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: 100,
    alignItems: 'center',
  },
  icon: {
    fontSize: 60,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.xl,
  },
  email: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  codeInput: {
    backgroundColor: COLORS.inputBackground,
    borderRadius: 12,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 16,
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: 8,
    marginBottom: 16,
    width: '100%',
  },
  input: {
    backgroundColor: COLORS.inputBackground,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.textPrimary,
    marginBottom: 12,
    width: '100%',
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    width: '100%',
  },
  disabledButton: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '600',
  },
  resendButton: {
    marginTop: 20,
  },
  resendText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  backButton: {
    marginTop: 16,
  },
  backText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
});
