import React, { useState, useCallback } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { LanguageProvider } from './src/context/LanguageContext';
import SplashScreen from './src/screens/SplashScreen';
import AuthScreen from './src/screens/AuthScreen';
import VerifyScreen from './src/screens/VerifyScreen';
import CompleteProfileScreen from './src/screens/CompleteProfileScreen';
import MainTabNavigator from './src/navigation/MainTabNavigator';
import { COLORS } from './src/config/theme';

const Stack = createNativeStackNavigator();

function AppNavigator() {
  const { user, profile, loading, verificationState } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <>
          {verificationState ? (
            <Stack.Screen name="Verify" component={VerifyScreen} />
          ) : (
            <Stack.Screen name="Auth" component={AuthScreen} />
          )}
        </>
      ) : profile && !profile.profileComplete ? (
        <Stack.Screen name="CompleteProfile" component={CompleteProfileScreen} />
      ) : (
        <Stack.Screen name="Main" component={MainTabNavigator} />
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  const handleSplashFinish = useCallback(() => {
    console.log('[App] Splash screen finished, showing main app');
    setShowSplash(false);
  }, []);

  console.log('[App] App component rendering, showSplash:', showSplash);

  if (showSplash) {
    return (
      <SafeAreaProvider>
        <StatusBar style="light" />
        <SplashScreen onFinish={handleSplashFinish} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <AuthProvider>
          <NavigationContainer>
            <StatusBar style="dark" />
            <AppNavigator />
          </NavigationContainer>
        </AuthProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
});
