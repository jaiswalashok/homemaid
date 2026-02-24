import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { COLORS, SPACING } from '../config/theme';

export default function CompleteProfileScreen() {
  const { completeProfile } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleComplete = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Error', 'Please enter your first and last name.');
      return;
    }
    setLoading(true);
    const result = await completeProfile(firstName.trim(), lastName.trim(), phone.trim() || undefined);
    if (!result.success) {
      Alert.alert('Error', result.message);
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={styles.icon}>👋</Text>
        <Text style={styles.title}>Complete Your Profile</Text>
        <Text style={styles.subtitle}>Tell us a bit about yourself</Text>

        <TextInput
          style={styles.input}
          placeholder="First Name"
          placeholderTextColor={COLORS.gray}
          value={firstName}
          onChangeText={setFirstName}
          autoCapitalize="words"
        />

        <TextInput
          style={styles.input}
          placeholder="Last Name"
          placeholderTextColor={COLORS.gray}
          value={lastName}
          onChangeText={setLastName}
          autoCapitalize="words"
        />

        <TextInput
          style={styles.input}
          placeholder="Phone (optional)"
          placeholderTextColor={COLORS.gray}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />

        <TouchableOpacity
          style={[styles.primaryButton, loading && styles.disabledButton]}
          onPress={handleComplete}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.primaryButtonText}>Get Started</Text>
          )}
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
    marginBottom: SPACING.xl,
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
});
