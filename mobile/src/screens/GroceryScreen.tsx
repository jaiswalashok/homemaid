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
  Modal,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { useLanguage } from '../contexts/LanguageContext';
import { getAllGroceries, addGroceryItem, updateGroceryItem, deleteGroceryItem } from '../lib/grocery';
import { formatGrocery, transcribeAudio } from '../lib/api';
import { GroceryItem } from '../types';

export default function GroceryScreen() {
  const { language } = useLanguage();
  const [groceries, setGroceries] = useState<GroceryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [voiceText, setVoiceText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => { loadGroceries(); }, []);

  useEffect(() => {
    if (isRecording) {
      Animated.loop(Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.2, duration: 500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      ])).start();
    } else { pulseAnim.setValue(1); }
  }, [isRecording]);

  const loadGroceries = async () => {
    try { setGroceries(await getAllGroceries()); }
    catch { Alert.alert('Error', 'Failed to load grocery list'); }
    finally { setLoading(false); }
  };

  const startVoice = async () => {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) { Alert.alert('Permission needed', 'Mic access required'); return; }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording: rec } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecording(rec); setIsRecording(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch { Alert.alert('Error', 'Failed to start recording'); }
  };

  const stopVoice = async () => {
    if (!recording) return;
    setIsRecording(false);
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      if (uri) {
        const { transcription } = await transcribeAudio(uri, language);
        if (transcription) setVoiceText(transcription);
      }
    } catch { Alert.alert('Error', 'Failed to process voice'); }
  };

  const handleAIAdd = async () => {
    if (!voiceText.trim()) return;
    setIsProcessing(true);
    try {
      const { items } = await formatGrocery(voiceText.trim());
      if (items && items.length > 0) {
        for (const item of items) {
          await addGroceryItem({ name: item, quantity: 1, unit: 'pcs', purchased: false });
        }
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('🛒 ' + (language === 'Hindi' ? 'जोड़ा गया!' : 'Added!'), `${items.length} item(s) added`);
        setVoiceText(''); setShowAddForm(false);
        await loadGroceries();
      }
    } catch { Alert.alert('Error', 'Failed to add items'); }
    finally { setIsProcessing(false); }
  };

  const handleToggleItem = async (id: string, purchased: boolean) => {
    try {
      await updateGroceryItem(id, { purchased: !purchased });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await loadGroceries();
    } catch { Alert.alert('Error', 'Failed to update item'); }
  };

  const handleDeleteItem = (id: string) => {
    Alert.alert(language === 'Hindi' ? 'हटाएं?' : 'Delete?', '', [
      { text: language === 'Hindi' ? 'रद्द' : 'Cancel', style: 'cancel' },
      { text: language === 'Hindi' ? 'हटाएं' : 'Delete', style: 'destructive', onPress: async () => {
        await deleteGroceryItem(id); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); await loadGroceries();
      }},
    ]);
  };

  const pendingItems = groceries.filter((g) => !g.purchased);
  const purchasedItems = groceries.filter((g) => g.purchased);

  if (loading) return <View style={s.centered}><ActivityIndicator size="large" color="#7c3aed" /></View>;

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>{language === 'Hindi' ? 'किराना सूची' : 'Grocery List'}</Text>
        <View style={s.headerMeta}>
          <View style={s.countBadge}><Text style={s.countText}>{pendingItems.length} {language === 'Hindi' ? 'बाकी' : 'to buy'}</Text></View>
          {purchasedItems.length > 0 && <View style={[s.countBadge, { backgroundColor: '#ecfdf5' }]}><Text style={[s.countText, { color: '#059669' }]}>{purchasedItems.length} {language === 'Hindi' ? 'खरीदा' : 'done'}</Text></View>}
        </View>
      </View>

      <View style={s.addRow}>
        <TouchableOpacity style={s.addBtn} onPress={() => setShowAddForm(true)}>
          <Ionicons name="add-circle" size={20} color="#fff" />
          <Text style={s.addBtnText}>{language === 'Hindi' ? 'सामान जोड़ें' : 'Add Items'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={s.list} showsVerticalScrollIndicator={false}>
        {pendingItems.length > 0 && (
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <Ionicons name="bag-outline" size={14} color="#7c3aed" />
              <Text style={s.sectionTitle}>{language === 'Hindi' ? 'खरीदने के लिए' : 'To Buy'}</Text>
            </View>
            {pendingItems.map((item) => (
              <TouchableOpacity key={item.id} style={s.itemCard} onPress={() => handleToggleItem(item.id, item.purchased)} activeOpacity={0.7}>
                <View style={s.check}/>
                <Text style={s.itemName}>{item.name}</Text>
                <TouchableOpacity onPress={() => handleDeleteItem(item.id)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Ionicons name="close-circle" size={18} color="#e5e7eb" />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {purchasedItems.length > 0 && (
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <Ionicons name="checkmark-done" size={14} color="#059669" />
              <Text style={[s.sectionTitle, { color: '#059669' }]}>{language === 'Hindi' ? 'खरीदा गया' : 'Purchased'}</Text>
            </View>
            {purchasedItems.map((item) => (
              <TouchableOpacity key={item.id} style={[s.itemCard, { opacity: 0.6 }]} onPress={() => handleToggleItem(item.id, item.purchased)} activeOpacity={0.7}>
                <View style={s.checkDone}><Ionicons name="checkmark" size={12} color="#fff" /></View>
                <Text style={s.itemDone}>{item.name}</Text>
                <TouchableOpacity onPress={() => handleDeleteItem(item.id)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Ionicons name="close-circle" size={18} color="#e5e7eb" />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {groceries.length === 0 && (
          <View style={s.empty}>
            <Ionicons name="cart-outline" size={64} color="#e5e7eb" />
            <Text style={s.emptyText}>{language === 'Hindi' ? 'सूची खाली है' : 'Your list is empty'}</Text>
            <Text style={s.emptyHint}>{language === 'Hindi' ? '"दूध, अंडे और ब्रेड" बोलकर जोड़ें' : 'Say "milk, eggs and bread" to add'}</Text>
          </View>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Add Modal */}
      <Modal visible={showAddForm} animationType="slide" transparent>
        <View style={s.modalBg}>
          <View style={s.modal}>
            <View style={s.modalHandle} />
            <Text style={s.modalTitle}>{language === 'Hindi' ? 'किराना जोड़ें' : 'Add Grocery Items'}</Text>
            <Text style={s.modalHint}>
              {language === 'Hindi'
                ? '🎙️ बोलें: "दूध, अंडे, ब्रेड और टमाटर" — AI स्वचालित रूप से सूची बनाएगा'
                : '🎙️ Say: "milk, eggs, bread and tomatoes" — AI will format the list'}
            </Text>
            <View style={s.inputRow}>
              <TextInput
                style={s.input}
                placeholder={language === 'Hindi' ? 'क्या खरीदना है...' : 'What do you need to buy...'}
                placeholderTextColor="#9ca3af"
                value={voiceText}
                onChangeText={setVoiceText}
                onSubmitEditing={handleAIAdd}
                returnKeyType="send"
              />
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <TouchableOpacity style={[s.micBtn, isRecording && s.micBtnRec]} onPress={isRecording ? stopVoice : startVoice} disabled={isProcessing}>
                  <Ionicons name={isRecording ? 'stop' : 'mic'} size={18} color="#fff" />
                </TouchableOpacity>
              </Animated.View>
            </View>
            {isRecording && <Text style={s.recHint}>{language === 'Hindi' ? 'सुन रहा हूँ...' : 'Listening...'}</Text>}
            <View style={s.modalBtns}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => { setShowAddForm(false); setVoiceText(''); }}>
                <Text style={s.cancelText}>{language === 'Hindi' ? 'रद्द' : 'Cancel'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.submitBtn, (!voiceText.trim() || isProcessing) && { opacity: 0.4 }]}
                onPress={handleAIAdd}
                disabled={!voiceText.trim() || isProcessing}
              >
                {isProcessing ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="sparkles" size={16} color="#fff" />}
                <Text style={s.submitText}>{isProcessing ? (language === 'Hindi' ? 'जोड़ रहे...' : 'Adding...') : (language === 'Hindi' ? 'AI से जोड़ें' : 'Add with AI')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#faf7f5' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 12, backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: '700', color: '#111827' },
  headerMeta: { flexDirection: 'row', gap: 8, marginTop: 8 },
  countBadge: { backgroundColor: '#f5f3ff', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  countText: { fontSize: 12, fontWeight: '600', color: '#7c3aed' },
  addRow: { paddingHorizontal: 20, paddingTop: 12 },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#7c3aed', borderRadius: 12, paddingVertical: 14 },
  addBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  list: { flex: 1, paddingHorizontal: 20, paddingTop: 12 },
  section: { marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#7c3aed', textTransform: 'uppercase', letterSpacing: 0.5 },
  itemCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 12, padding: 14, marginBottom: 6, gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 3, elevation: 1,
  },
  check: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#d1d5db' },
  checkDone: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#059669', justifyContent: 'center', alignItems: 'center' },
  itemName: { flex: 1, fontSize: 15, color: '#1f2937' },
  itemDone: { flex: 1, fontSize: 15, color: '#9ca3af', textDecorationLine: 'line-through' },
  empty: { alignItems: 'center', paddingVertical: 48 },
  emptyText: { fontSize: 15, color: '#9ca3af', marginTop: 12 },
  emptyHint: { fontSize: 12, color: '#d1d5db', marginTop: 4 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalHandle: { width: 36, height: 4, backgroundColor: '#e5e7eb', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 4 },
  modalHint: { fontSize: 12, color: '#6b7280', marginBottom: 16 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  input: { flex: 1, backgroundColor: '#f3f4f6', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: '#1f2937' },
  micBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#7c3aed', justifyContent: 'center', alignItems: 'center' },
  micBtnRec: { backgroundColor: '#dc2626' },
  recHint: { fontSize: 12, color: '#dc2626', marginTop: 8, fontWeight: '500' },
  modalBtns: { flexDirection: 'row', gap: 12, marginTop: 16 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#f3f4f6', alignItems: 'center' },
  cancelText: { fontWeight: '600', color: '#6b7280', fontSize: 15 },
  submitBtn: { flex: 1.5, flexDirection: 'row', gap: 6, paddingVertical: 14, borderRadius: 12, backgroundColor: '#7c3aed', alignItems: 'center', justifyContent: 'center' },
  submitText: { fontWeight: '600', color: '#fff', fontSize: 14 },
});
