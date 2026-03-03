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
  Image,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { useLanguage } from '../contexts/LanguageContext';
import { getAllRecipes, addRecipe, deleteRecipe } from '../lib/recipes';
import { parseRecipe, transcribeAudio } from '../lib/api';
import { Recipe } from '../types';

export default function RecipesScreen() {
  const { language } = useLanguage();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [voiceText, setVoiceText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => { loadRecipes(); }, []);

  useEffect(() => {
    if (isRecording) {
      Animated.loop(Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.2, duration: 500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      ])).start();
    } else { pulseAnim.setValue(1); }
  }, [isRecording]);

  const loadRecipes = async () => {
    try { setRecipes(await getAllRecipes()); }
    catch { Alert.alert('Error', 'Failed to load recipes'); }
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
        if (transcription) { setVoiceText(transcription); }
      }
    } catch { Alert.alert('Error', 'Failed to process voice'); }
  };

  const handleAIRecipe = async () => {
    if (!voiceText.trim()) return;
    setIsProcessing(true);
    try {
      const result = await parseRecipe(voiceText.trim(), language);
      const lang = language === 'Hindi' ? 'hi' : 'en';
      const parsed = result[lang] || result.en;
      if (parsed) {
        await addRecipe({
          name: parsed.title,
          ingredients: parsed.ingredients?.map((i: any) => `${i.quantity} ${i.unit} ${i.item}`) || [],
          instructions: parsed.steps?.map((s: any) => `${s.stepNumber}. ${s.instruction}`).join('\n') || '',
          imageUrl: '',
          description: parsed.description,
          cuisine: parsed.cuisine,
          prepTime: parsed.prepTime,
          cookTime: parsed.cookTime,
          servings: parsed.servings,
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('🍳 ' + (language === 'Hindi' ? 'रेसिपी जोड़ी गई!' : 'Recipe Added!'), parsed.title);
        setVoiceText(''); setShowAddForm(false);
        await loadRecipes();
      }
    } catch { Alert.alert('Error', 'Failed to parse recipe'); }
    finally { setIsProcessing(false); }
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8, allowsEditing: true, aspect: [4, 3] });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  };

  const handleDeleteRecipe = (id: string) => {
    Alert.alert(language === 'Hindi' ? 'हटाएं?' : 'Delete?', '', [
      { text: language === 'Hindi' ? 'रद्द' : 'Cancel', style: 'cancel' },
      { text: language === 'Hindi' ? 'हटाएं' : 'Delete', style: 'destructive', onPress: async () => {
        await deleteRecipe(id); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); await loadRecipes();
      }},
    ]);
  };

  if (loading) return <View style={s.centered}><ActivityIndicator size="large" color="#059669" /></View>;

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>{language === 'Hindi' ? 'रेसिपी' : 'Recipes'}</Text>
        <Text style={s.subtitle}>{recipes.length} {language === 'Hindi' ? 'रेसिपी' : 'recipes'}</Text>
      </View>

      <View style={s.addRow}>
        <TouchableOpacity style={s.addBtn} onPress={() => setShowAddForm(true)}>
          <Ionicons name="add-circle" size={20} color="#fff" />
          <Text style={s.addBtnText}>{language === 'Hindi' ? 'रेसिपी जोड़ें' : 'Add Recipe'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={s.list} showsVerticalScrollIndicator={false}>
        {recipes.length === 0 ? (
          <View style={s.empty}>
            <Ionicons name="restaurant-outline" size={64} color="#e5e7eb" />
            <Text style={s.emptyText}>{language === 'Hindi' ? 'कोई रेसिपी नहीं' : 'No recipes yet'}</Text>
            <Text style={s.emptyHint}>{language === 'Hindi' ? 'माइक से बोलें: "बटर चिकन बनाओ"' : 'Try saying: "Make butter chicken"'}</Text>
          </View>
        ) : recipes.map((recipe) => (
          <TouchableOpacity key={recipe.id} style={s.card} onPress={() => setExpandedId(expandedId === recipe.id ? null : recipe.id)} activeOpacity={0.7}>
            {recipe.imageUrl ? (
              <Image source={{ uri: recipe.imageUrl }} style={s.cardImage} />
            ) : (
              <View style={s.cardImagePlaceholder}><Ionicons name="restaurant" size={32} color="#d1d5db" /></View>
            )}
            <View style={s.cardBody}>
              <View style={s.cardHeader}>
                <Text style={s.cardName} numberOfLines={1}>{recipe.name}</Text>
                <TouchableOpacity onPress={() => handleDeleteRecipe(recipe.id)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Ionicons name="trash-outline" size={16} color="#d1d5db" />
                </TouchableOpacity>
              </View>
              {(recipe as any).cuisine && <Text style={s.cardCuisine}>{(recipe as any).cuisine}</Text>}
              <View style={s.cardMeta}>
                {(recipe as any).prepTime && <View style={s.metaChip}><Ionicons name="time-outline" size={11} color="#6b7280" /><Text style={s.metaText}>{(recipe as any).prepTime}</Text></View>}
                {(recipe as any).servings && <View style={s.metaChip}><Ionicons name="people-outline" size={11} color="#6b7280" /><Text style={s.metaText}>{(recipe as any).servings}</Text></View>}
                <View style={s.metaChip}><Ionicons name="leaf-outline" size={11} color="#6b7280" /><Text style={s.metaText}>{recipe.ingredients.length} items</Text></View>
              </View>

              {expandedId === recipe.id && (
                <View style={s.expandedContent}>
                  {(recipe as any).description && <Text style={s.description}>{(recipe as any).description}</Text>}
                  <Text style={s.sectionLabel}>{language === 'Hindi' ? 'सामग्री' : 'Ingredients'}</Text>
                  {recipe.ingredients.map((ing, i) => (
                    <View key={i} style={s.ingRow}>
                      <View style={s.ingDot} />
                      <Text style={s.ingText}>{ing}</Text>
                    </View>
                  ))}
                  <Text style={s.sectionLabel}>{language === 'Hindi' ? 'निर्देश' : 'Instructions'}</Text>
                  <Text style={s.instructionText}>{recipe.instructions}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Add Recipe Modal */}
      <Modal visible={showAddForm} animationType="slide" transparent>
        <View style={s.modalBg}>
          <View style={s.modal}>
            <View style={s.modalHandle} />
            <Text style={s.modalTitle}>{language === 'Hindi' ? 'नई रेसिपी' : 'New Recipe'}</Text>
            <Text style={s.modalHint}>
              {language === 'Hindi'
                ? '🎙️ बोलें या टाइप करें: "बटर चिकन" या "पास्ता बनाओ"'
                : '🎙️ Speak or type: "butter chicken" or "make pasta"'}
            </Text>
            <View style={s.inputRow}>
              <TextInput
                style={s.input}
                placeholder={language === 'Hindi' ? 'कोई भी रेसिपी बताएं...' : 'Describe any recipe...'}
                placeholderTextColor="#9ca3af"
                value={voiceText}
                onChangeText={setVoiceText}
                onSubmitEditing={handleAIRecipe}
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
              <TouchableOpacity style={s.cancelBtn} onPress={() => { setShowAddForm(false); setVoiceText(''); setImageUri(null); }}>
                <Text style={s.cancelText}>{language === 'Hindi' ? 'रद्द' : 'Cancel'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.submitBtn, (!voiceText.trim() || isProcessing) && { opacity: 0.4 }]}
                onPress={handleAIRecipe}
                disabled={!voiceText.trim() || isProcessing}
              >
                {isProcessing ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="sparkles" size={16} color="#fff" />}
                <Text style={s.submitText}>{isProcessing ? (language === 'Hindi' ? 'बना रहे...' : 'Creating...') : (language === 'Hindi' ? 'AI से बनाएं' : 'Create with AI')}</Text>
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
  subtitle: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  addRow: { paddingHorizontal: 20, paddingTop: 12 },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#059669', borderRadius: 12, paddingVertical: 14 },
  addBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  list: { flex: 1, paddingHorizontal: 20, paddingTop: 12 },
  empty: { alignItems: 'center', paddingVertical: 48 },
  emptyText: { fontSize: 15, color: '#9ca3af', marginTop: 12 },
  emptyHint: { fontSize: 12, color: '#d1d5db', marginTop: 4 },
  card: { backgroundColor: '#fff', borderRadius: 14, marginBottom: 12, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  cardImage: { width: '100%', height: 160, resizeMode: 'cover' },
  cardImagePlaceholder: { width: '100%', height: 100, backgroundColor: '#f9fafb', justifyContent: 'center', alignItems: 'center' },
  cardBody: { padding: 14 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardName: { fontSize: 16, fontWeight: '700', color: '#111827', flex: 1, marginRight: 8 },
  cardCuisine: { fontSize: 12, color: '#059669', fontWeight: '500', marginTop: 2 },
  cardMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#f3f4f6', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  metaText: { fontSize: 11, color: '#6b7280' },
  expandedContent: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  description: { fontSize: 13, color: '#6b7280', lineHeight: 18, marginBottom: 12 },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 6, marginTop: 8 },
  ingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 3 },
  ingDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#059669' },
  ingText: { fontSize: 13, color: '#4b5563' },
  instructionText: { fontSize: 13, color: '#4b5563', lineHeight: 20 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalHandle: { width: 36, height: 4, backgroundColor: '#e5e7eb', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 4 },
  modalHint: { fontSize: 12, color: '#6b7280', marginBottom: 16 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  input: { flex: 1, backgroundColor: '#f3f4f6', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: '#1f2937' },
  micBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#059669', justifyContent: 'center', alignItems: 'center' },
  micBtnRec: { backgroundColor: '#dc2626' },
  recHint: { fontSize: 12, color: '#dc2626', marginTop: 8, fontWeight: '500' },
  modalBtns: { flexDirection: 'row', gap: 12, marginTop: 16 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#f3f4f6', alignItems: 'center' },
  cancelText: { fontWeight: '600', color: '#6b7280', fontSize: 15 },
  submitBtn: { flex: 1.5, flexDirection: 'row', gap: 6, paddingVertical: 14, borderRadius: 12, backgroundColor: '#059669', alignItems: 'center', justifyContent: 'center' },
  submitText: { fontWeight: '600', color: '#fff', fontSize: 14 },
});
