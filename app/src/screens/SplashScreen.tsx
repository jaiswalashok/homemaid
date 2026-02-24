import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../config/theme';

const { width } = Dimensions.get('window');

interface Props {
  onFinish: () => void;
}

export default function SplashScreen({ onFinish }: Props) {
  useEffect(() => {
    const timer = setTimeout(onFinish, 2000);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>🏠</Text>
      <Text style={styles.title}>HomeHelp</Text>
      <Text style={styles.subtitle}>Your Smart Home Assistant</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: width * 0.2,
    marginBottom: 16,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 8,
  },
});
