import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { parseUserCommand, transcribeAudio } from '../lib/api';
import { addTask } from '../lib/tasks';
import { addGroceryItem } from '../lib/grocery';
import { addExpense } from '../lib/expenses';

const { width } = Dimensions.get('window');

export default function DashboardScreen({ navigation }: any) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [voiceText, setVoiceText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.3, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording]);

  const startRecording = async () => {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        Alert.alert('Permission needed', 'Microphone access is required for voice input');
        return;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording: rec } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(rec);
      setIsRecording(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (err) {
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    setIsRecording(false);
    setIsProcessing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      if (uri) {
        const { transcription } = await transcribeAudio(uri, language);
        if (transcription) {
          setVoiceText(transcription);
          await handleCommand(transcription);
        } else {
          Alert.alert('Error', "Couldn't understand that. Try again.");
        }
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to process recording');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCommand = async (text: string) => {
    setIsProcessing(true);
    try {
      const result = await parseUserCommand(text);
      const { intent, data } = result;

      if (intent === 'add_task' && data.items?.length > 0) {
        const today = new Date().toISOString().split('T')[0];
        for (const item of data.items) {
          await addTask({ title: item, completed: false, date: today, isDaily: false });
        }
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('✅ Tasks Added', `${data.items.length} task(s) added`, [
          { text: 'View', onPress: () => navigation.navigate('Tasks') },
          { text: 'OK' },
        ]);
      } else if (intent === 'add_grocery' && data.items?.length > 0) {
        for (const item of data.items) {
          await addGroceryItem({ name: item, quantity: 1, unit: 'pcs', purchased: false });
        }
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('🛒 Grocery Added', `${data.items.length} item(s) added`, [
          { text: 'View', onPress: () => navigation.navigate('Grocery') },
          { text: 'OK' },
        ]);
      } else if (intent === 'add_expense' && data.expense?.amount > 0) {
        const exp = data.expense;
        await addExpense({
          vendor: exp.vendor || 'Unknown',
          vendorFullName: exp.vendor || 'Unknown',
          type: exp.type || 'Other',
          amount: exp.amount,
          emoji: '💰',
          discount: 0,
          displayDate: new Date().toLocaleDateString(),
          date: new Date().toISOString().split('T')[0],
          address: '',
          paymentMethod: 'Unknown',
          items: exp.items || [],
          source: 'manual',
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('💰 Expense Added', `$${exp.amount} at ${exp.vendor}`, [
          { text: 'View', onPress: () => navigation.navigate('Expenses') },
          { text: 'OK' },
        ]);
      } else if (intent === 'add_recipe' && data.items?.length > 0) {
        navigation.navigate('Recipes');
        Alert.alert('🍳 Recipe', `Try searching for: ${data.items.join(', ')}`);
      } else {
        Alert.alert(
          language === 'Hindi' ? 'समझ नहीं पाया' : "Didn't understand",
          language === 'Hindi' ? 'कृपया फिर से कहें' : 'Try saying something like "add milk and eggs to grocery" or "buy bread"'
        );
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to process command');
    } finally {
      setIsProcessing(false);
      setVoiceText('');
    }
  };

  const handleTextSubmit = () => {
    if (voiceText.trim()) {
      handleCommand(voiceText.trim());
    }
  };

  const quickActions = [
    { title: language === 'Hindi' ? 'कार्य' : 'Tasks', screen: 'Tasks', icon: 'checkmark-circle' as const, color: '#3b82f6', bg: '#eff6ff' },
    { title: language === 'Hindi' ? 'खर्च' : 'Expenses', screen: 'Expenses', icon: 'receipt' as const, color: '#ea580c', bg: '#fff7ed' },
    { title: language === 'Hindi' ? 'रेसिपी' : 'Recipes', screen: 'Recipes', icon: 'restaurant' as const, color: '#059669', bg: '#ecfdf5' },
    { title: language === 'Hindi' ? 'किराना' : 'Grocery', screen: 'Grocery', icon: 'cart' as const, color: '#7c3aed', bg: '#f5f3ff' },
  ];

  const hour = new Date().getHours();
  const greeting = hour < 12
    ? language === 'Hindi' ? 'सुप्रभात' : 'Good Morning'
    : hour < 17
    ? language === 'Hindi' ? 'शुभ दोपहर' : 'Good Afternoon'
    : language === 'Hindi' ? 'शुभ संध्या' : 'Good Evening';

  return (
    <ScrollView style={s.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerTop}>
          <View>
            <Text style={s.greeting}>{greeting} 👋</Text>
            <Text style={s.email}>{user?.displayName || user?.email?.split('@')[0]}</Text>
          </View>
          <TouchableOpacity style={s.avatarBtn} onPress={() => navigation.navigate('Profile')}>
            <Text style={s.avatarText}>
              {user?.email?.charAt(0).toUpperCase() || '?'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Voice / Text Command Bar */}
      <View style={s.commandSection}>
        <View style={s.commandBar}>
          <Ionicons name="search" size={18} color="#9ca3af" />
          <TextInput
            style={s.commandInput}
            placeholder={language === 'Hindi' ? '"दूध और अंडे खरीदो" या "टास्क जोड़ो"' : '"Buy milk and eggs" or "Add a task"'}
            placeholderTextColor="#9ca3af"
            value={voiceText}
            onChangeText={setVoiceText}
            onSubmitEditing={handleTextSubmit}
            returnKeyType="send"
          />
          {isProcessing ? (
            <ActivityIndicator size="small" color="#ea580c" />
          ) : (
            <TouchableOpacity onPress={voiceText.trim() ? handleTextSubmit : undefined}>
              <Ionicons name="send" size={20} color={voiceText.trim() ? '#ea580c' : '#d1d5db'} />
            </TouchableOpacity>
          )}
        </View>

        {/* Mic Button */}
        <Animated.View style={[s.micContainer, { transform: [{ scale: pulseAnim }] }]}>
          <TouchableOpacity
            style={[s.micButton, isRecording && s.micButtonRecording]}
            onPress={isRecording ? stopRecording : startRecording}
            disabled={isProcessing}
          >
            <Ionicons
              name={isRecording ? 'stop' : 'mic'}
              size={22}
              color="#fff"
            />
          </TouchableOpacity>
        </Animated.View>
        {isRecording && (
          <Text style={s.recordingHint}>
            {language === 'Hindi' ? 'सुन रहा हूँ... बोलें फिर बंद करें' : 'Listening... speak then tap stop'}
          </Text>
        )}
      </View>

      {/* Quick Actions Grid */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>
          {language === 'Hindi' ? 'त्वरित कार्य' : 'Quick Actions'}
        </Text>
        <View style={s.grid}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.screen}
              style={[s.card, { backgroundColor: action.bg }]}
              onPress={() => navigation.navigate(action.screen)}
              activeOpacity={0.7}
            >
              <View style={[s.cardIcon, { backgroundColor: action.color }]}>
                <Ionicons name={action.icon} size={20} color="#fff" />
              </View>
              <Text style={[s.cardTitle, { color: action.color }]}>{action.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Tips */}
      <View style={s.section}>
        <View style={s.tipCard}>
          <View style={s.tipIcon}>
            <Ionicons name="bulb" size={20} color="#f59e0b" />
          </View>
          <View style={s.tipContent}>
            <Text style={s.tipTitle}>
              {language === 'Hindi' ? '💡 सुझाव' : '💡 Tip'}
            </Text>
            <Text style={s.tipText}>
              {language === 'Hindi'
                ? 'माइक बटन दबाकर बोलें: "किराने में दूध और ब्रेड जोड़ो" या "50 डॉलर वॉलमार्ट पर खर्च किया"'
                : 'Tap the mic and say: "Add milk and bread to grocery" or "Spent $50 at Walmart"'}
            </Text>
          </View>
        </View>
      </View>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#faf7f5' },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20, backgroundColor: '#fff' },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greeting: { fontSize: 26, fontWeight: '700', color: '#111827' },
  email: { fontSize: 14, color: '#6b7280', marginTop: 2 },
  avatarBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#ea580c',
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  commandSection: { paddingHorizontal: 20, paddingTop: 16, alignItems: 'center' },
  commandBar: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 14, paddingHorizontal: 14, height: 48, width: '100%',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  commandInput: { flex: 1, fontSize: 14, color: '#1f2937', marginLeft: 10, marginRight: 8 },
  micContainer: { marginTop: 16 },
  micButton: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: '#ea580c',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#ea580c', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 8, elevation: 8,
  },
  micButtonRecording: { backgroundColor: '#dc2626' },
  recordingHint: { marginTop: 8, fontSize: 12, color: '#dc2626', fontWeight: '500' },
  section: { paddingHorizontal: 20, paddingTop: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#374151', marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: {
    width: (width - 52) / 2, borderRadius: 16, padding: 20,
  },
  cardIcon: {
    width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  cardTitle: { fontSize: 15, fontWeight: '600' },
  tipCard: {
    flexDirection: 'row', backgroundColor: '#fffbeb', borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: '#fef3c7',
  },
  tipIcon: { marginRight: 12, marginTop: 2 },
  tipContent: { flex: 1 },
  tipTitle: { fontSize: 13, fontWeight: '700', color: '#92400e', marginBottom: 4 },
  tipText: { fontSize: 12, color: '#78716c', lineHeight: 18 },
});
