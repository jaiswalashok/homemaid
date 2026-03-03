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
import { getTasksForDate, addTask, updateTaskStatus, deleteTask, seedDailyTasks } from '../lib/tasks';
import { transcribeAudio } from '../lib/api';
import { Task } from '../types';

export default function TasksScreen() {
  const { language } = useLanguage();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [selectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => { loadTasks(); }, [selectedDate]);

  useEffect(() => {
    if (isRecording) {
      Animated.loop(Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.2, duration: 500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      ])).start();
    } else { pulseAnim.setValue(1); }
  }, [isRecording]);

  const loadTasks = async () => {
    try {
      let data = await getTasksForDate(selectedDate);
      if (data.length === 0) {
        await seedDailyTasks(selectedDate);
        data = await getTasksForDate(selectedDate);
      }
      setTasks(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load tasks');
    } finally { setLoading(false); }
  };

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;
    try {
      await addTask({ title: newTaskTitle.trim(), completed: false, date: selectedDate, isDaily: false });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setNewTaskTitle('');
      setShowAddForm(false);
      await loadTasks();
    } catch (error) { Alert.alert('Error', 'Failed to add task'); }
  };

  const handleToggleTask = async (id: string, completed: boolean) => {
    try {
      await updateTaskStatus(id, !completed);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await loadTasks();
    } catch (error) { Alert.alert('Error', 'Failed to update task'); }
  };

  const handleDeleteTask = async (id: string) => {
    Alert.alert(language === 'Hindi' ? 'कार्य हटाएं' : 'Delete Task', language === 'Hindi' ? 'क्या आप वाकई हटाना चाहते हैं?' : 'Are you sure?', [
      { text: language === 'Hindi' ? 'रद्द करें' : 'Cancel', style: 'cancel' },
      { text: language === 'Hindi' ? 'हटाएं' : 'Delete', style: 'destructive', onPress: async () => {
        await deleteTask(id); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); await loadTasks();
      }},
    ]);
  };

  const startVoice = async () => {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) { Alert.alert('Permission needed', 'Mic access required'); return; }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording: rec } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecording(rec);
      setIsRecording(true);
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
        if (transcription) setNewTaskTitle(transcription);
      }
    } catch { Alert.alert('Error', 'Failed to process voice'); }
  };

  const completedCount = tasks.filter((t) => t.completed).length;
  const progress = tasks.length > 0 ? completedCount / tasks.length : 0;

  if (loading) {
    return <View style={s.centered}><ActivityIndicator size="large" color="#3b82f6" /></View>;
  }

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>{language === 'Hindi' ? 'कार्य' : 'Tasks'}</Text>
        <View style={s.progressRow}>
          <View style={s.progressBar}>
            <View style={[s.progressFill, { width: `${progress * 100}%` }]} />
          </View>
          <Text style={s.progressText}>{completedCount}/{tasks.length}</Text>
        </View>
      </View>

      <View style={s.addRow}>
        <TouchableOpacity style={s.addBtn} onPress={() => setShowAddForm(true)}>
          <Ionicons name="add-circle" size={20} color="#fff" />
          <Text style={s.addBtnText}>{language === 'Hindi' ? 'कार्य जोड़ें' : 'Add Task'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={s.list} showsVerticalScrollIndicator={false}>
        {tasks.map((task) => (
          <TouchableOpacity
            key={task.id}
            style={s.taskCard}
            onPress={() => handleToggleTask(task.id, task.completed)}
            activeOpacity={0.7}
          >
            <View style={[s.check, task.completed && s.checkDone]}>
              {task.completed && <Ionicons name="checkmark" size={14} color="#fff" />}
            </View>
            <Text style={[s.taskTitle, task.completed && s.taskDone]} numberOfLines={2}>{task.title}</Text>
            {task.isDaily && (
              <View style={s.badge}><Ionicons name="repeat" size={10} color="#3b82f6" /><Text style={s.badgeText}>Daily</Text></View>
            )}
            <TouchableOpacity onPress={() => handleDeleteTask(task.id)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="trash-outline" size={18} color="#d1d5db" />
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
        {tasks.length === 0 && (
          <View style={s.empty}>
            <Ionicons name="checkmark-done-circle-outline" size={64} color="#e5e7eb" />
            <Text style={s.emptyText}>{language === 'Hindi' ? 'कोई कार्य नहीं' : 'No tasks for today'}</Text>
          </View>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Add Task Modal */}
      <Modal visible={showAddForm} animationType="slide" transparent>
        <View style={s.modalBg}>
          <View style={s.modal}>
            <View style={s.modalHandle} />
            <Text style={s.modalTitle}>{language === 'Hindi' ? 'नया कार्य' : 'New Task'}</Text>
            <View style={s.inputRow}>
              <TextInput
                style={s.input}
                placeholder={language === 'Hindi' ? 'क्या करना है?' : 'What needs to be done?'}
                placeholderTextColor="#9ca3af"
                value={newTaskTitle}
                onChangeText={setNewTaskTitle}
                autoFocus
                onSubmitEditing={handleAddTask}
                returnKeyType="done"
              />
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <TouchableOpacity
                  style={[s.micBtn, isRecording && s.micBtnRec]}
                  onPress={isRecording ? stopVoice : startVoice}
                >
                  <Ionicons name={isRecording ? 'stop' : 'mic'} size={18} color="#fff" />
                </TouchableOpacity>
              </Animated.View>
            </View>
            {isRecording && <Text style={s.recHint}>{language === 'Hindi' ? 'सुन रहा हूँ...' : 'Listening...'}</Text>}
            <View style={s.modalBtns}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => { setShowAddForm(false); setNewTaskTitle(''); }}>
                <Text style={s.cancelText}>{language === 'Hindi' ? 'रद्द' : 'Cancel'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.submitBtn, !newTaskTitle.trim() && { opacity: 0.4 }]} onPress={handleAddTask} disabled={!newTaskTitle.trim()}>
                <Ionicons name="add" size={18} color="#fff" />
                <Text style={s.submitText}>{language === 'Hindi' ? 'जोड़ें' : 'Add'}</Text>
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
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16, backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: '700', color: '#111827' },
  progressRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 10 },
  progressBar: { flex: 1, height: 6, backgroundColor: '#e5e7eb', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#3b82f6', borderRadius: 3 },
  progressText: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  addRow: { paddingHorizontal: 20, paddingTop: 12 },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#3b82f6', borderRadius: 12, paddingVertical: 14 },
  addBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  list: { flex: 1, paddingHorizontal: 20, paddingTop: 12 },
  taskCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 14, padding: 16, marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  check: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#d1d5db',
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  checkDone: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  taskTitle: { flex: 1, fontSize: 15, color: '#1f2937', marginRight: 8 },
  taskDone: { textDecorationLine: 'line-through', color: '#9ca3af' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#eff6ff', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3, marginRight: 8 },
  badgeText: { fontSize: 10, color: '#3b82f6', fontWeight: '600' },
  empty: { alignItems: 'center', paddingVertical: 48 },
  emptyText: { fontSize: 15, color: '#9ca3af', marginTop: 12 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalHandle: { width: 36, height: 4, backgroundColor: '#e5e7eb', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 16 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  input: { flex: 1, backgroundColor: '#f3f4f6', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: '#1f2937' },
  micBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#3b82f6', justifyContent: 'center', alignItems: 'center' },
  micBtnRec: { backgroundColor: '#dc2626' },
  recHint: { fontSize: 12, color: '#dc2626', marginTop: 8, fontWeight: '500' },
  modalBtns: { flexDirection: 'row', gap: 12, marginTop: 16 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#f3f4f6', alignItems: 'center' },
  cancelText: { fontWeight: '600', color: '#6b7280', fontSize: 15 },
  submitBtn: { flex: 1, flexDirection: 'row', gap: 6, paddingVertical: 14, borderRadius: 12, backgroundColor: '#3b82f6', alignItems: 'center', justifyContent: 'center' },
  submitText: { fontWeight: '600', color: '#fff', fontSize: 15 },
});
