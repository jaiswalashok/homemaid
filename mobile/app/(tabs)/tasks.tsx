import { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  FlatList, ActivityIndicator, Alert, Modal, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/lib/auth-context';
import {
  Task, DailyTaskTemplate, MASTER_TEMPLATES,
  getTodayString, seedDailyTasks, onTasksForDate,
  addTask, updateTaskStatus, deleteTask, copyTemplateToUser,
  getDailyTaskTemplates,
} from '@/lib/tasks';
import { speechToText } from '@/lib/speech';

type TaskStatus = Task['status'];

const STATUS_COLORS: Record<TaskStatus, string> = {
  pending: '#6B7280',
  in_progress: '#3B82F6',
  paused: '#F59E0B',
  completed: '#10B981',
};

const STATUS_ICONS: Record<TaskStatus, string> = {
  pending: '⭕',
  in_progress: '▶️',
  paused: '⏸️',
  completed: '✅',
};

export default function TasksScreen() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTaskText, setNewTaskText] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const unsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!user) return;
    const today = getTodayString();

    seedDailyTasks(today).catch(console.error);

    const unsub = onTasksForDate(today, user.uid, (updatedTasks) => {
      setTasks(updatedTasks);
      setLoading(false);
    });
    unsubRef.current = unsub;
    return () => unsub();
  }, [user]);

  const handleAddTask = async () => {
    if (!newTaskText.trim()) return;
    try {
      await addTask(getTodayString(), newTaskText.trim());
      setNewTaskText('');
    } catch { Alert.alert('Error', 'Could not add task'); }
  };

  const handleStartRecording = async () => {
    try {
      setIsRecording(true);
      await speechToText.startRecording();
    } catch (error: any) {
      setIsRecording(false);
      Alert.alert('Recording Error', error.message || 'Could not start recording');
    }
  };

  const handleStopRecording = async () => {
    try {
      setIsRecording(false);
      const transcription = await speechToText.stopRecording();
      setNewTaskText(transcription);
    } catch (error: any) {
      Alert.alert('Transcription Error', error.message || 'Could not transcribe audio');
    }
  };

  const cycleStatus = async (task: Task) => {
    const next: Record<TaskStatus, TaskStatus> = {
      pending: 'in_progress',
      in_progress: 'completed',
      paused: 'in_progress',
      completed: 'pending',
    };
    await updateTaskStatus(task.id, next[task.status]);
  };

  const confirmDelete = (taskId: string) => {
    Alert.alert('Delete Task', 'Are you sure?', [
      { text: 'Cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteTask(taskId) },
    ]);
  };

  const pending = tasks.filter(t => t.status !== 'completed');
  const done = tasks.filter(t => t.status === 'completed');

  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#4F46E5" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View>
          <Text style={styles.dateText}>{dateStr}</Text>
          <Text style={styles.title}>Today's Tasks</Text>
        </View>
        <TouchableOpacity style={styles.templatesBtn} onPress={() => setShowTemplates(true)}>
          <Text style={styles.templatesBtnText}>📋 Templates</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.progress}>
        <Text style={styles.progressText}>{done.length}/{tasks.length} completed</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: tasks.length ? `${(done.length / tasks.length) * 100}%` : '0%' as any }]} />
        </View>
      </View>

      <FlatList
        data={tasks}
        keyExtractor={t => t.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📝</Text>
            <Text style={styles.emptyTitle}>No tasks yet</Text>
            <Text style={styles.emptyText}>Add a task or browse templates to get started</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => setShowTemplates(true)}>
              <Text style={styles.emptyBtnText}>Browse Templates</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.taskCard, item.status === 'completed' && styles.taskCardDone]}>
            <TouchableOpacity style={styles.statusBtn} onPress={() => cycleStatus(item)}>
              <Text style={styles.statusIcon}>{STATUS_ICONS[item.status]}</Text>
            </TouchableOpacity>
            <View style={styles.taskContent}>
              <Text style={[styles.taskTitle, item.status === 'completed' && styles.taskTitleDone]}>
                {item.title}
              </Text>
              <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[item.status] + '20' }]}>
                <Text style={[styles.statusBadgeText, { color: STATUS_COLORS[item.status] }]}>
                  {item.status.replace('_', ' ')}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => confirmDelete(item.id)} style={styles.deleteBtn}>
              <Text style={styles.deleteBtnText}>🗑️</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Add a task..."
          placeholderTextColor="#9CA3AF"
          value={newTaskText}
          onChangeText={setNewTaskText}
          onSubmitEditing={handleAddTask}
          returnKeyType="done"
        />
        <TouchableOpacity
          style={[styles.micBtn, isRecording && styles.micBtnRecording]}
          onPress={isRecording ? handleStopRecording : handleStartRecording}
        >
          <Text style={[styles.micBtnText, isRecording && styles.micBtnTextRecording]}>
            {isRecording ? '⏹️' : '🎤'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.addBtn, !newTaskText.trim() && styles.addBtnDisabled]}
          onPress={handleAddTask}
          disabled={!newTaskText.trim()}
        >
          <Text style={styles.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      <TemplatesModal visible={showTemplates} onClose={() => setShowTemplates(false)} />
    </SafeAreaView>
  );
}

function TemplatesModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [copiedTitles, setCopiedTitles] = useState<Set<string>>(new Set());
  const [copying, setCopying] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'daily' | 'weekly' | 'biweekly' | 'monthly'>('all');

  useEffect(() => {
    if (visible) {
      getDailyTaskTemplates().then(ut => setCopiedTitles(new Set(ut.map(t => t.title))));
    }
  }, [visible]);

  const handleCopy = async (template: DailyTaskTemplate) => {
    if (copiedTitles.has(template.title)) return;
    setCopying(template.id);
    try {
      await copyTemplateToUser(template);
      setCopiedTitles(new Set([...copiedTitles, template.title]));
    } catch {
      Alert.alert('Error', 'Could not copy template');
    } finally {
      setCopying(null);
    }
  };

  const filtered = filter === 'all' ? MASTER_TEMPLATES : MASTER_TEMPLATES.filter(t => t.recurrence === filter);

  const RECURRENCE_COLORS: Record<string, string> = {
    daily: '#3B82F6',
    weekly: '#10B981',
    biweekly: '#F59E0B',
    monthly: '#8B5CF6',
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modalSafe}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Task Templates</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>Done</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={styles.filterContent}>
          {(['all', 'daily', 'weekly', 'biweekly', 'monthly'] as const).map(f => (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, filter === f && styles.filterChipActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterChipText, filter === f && styles.filterChipTextActive]}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <FlatList
          data={filtered}
          keyExtractor={t => t.id}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          renderItem={({ item }) => {
            const isCopied = copiedTitles.has(item.title);
            const isCopying = copying === item.id;
            return (
              <View style={[styles.templateCard, isCopied && styles.templateCardCopied]}>
                <View style={styles.templateInfo}>
                  <Text style={styles.templateTitle}>{item.title}</Text>
                  <View style={styles.templateMeta}>
                    <View style={[styles.recurrenceBadge, { backgroundColor: (RECURRENCE_COLORS[item.recurrence || 'daily']) + '20' }]}>
                      <Text style={[styles.recurrenceBadgeText, { color: RECURRENCE_COLORS[item.recurrence || 'daily'] }]}>
                        {item.recurrence || 'daily'}
                      </Text>
                    </View>
                    {item.category && <Text style={styles.categoryText}>{item.category}</Text>}
                  </View>
                </View>
                <TouchableOpacity
                  style={[styles.copyBtn, isCopied && styles.copyBtnCopied]}
                  onPress={() => handleCopy(item)}
                  disabled={isCopied || isCopying}
                >
                  {isCopying ? (
                    <ActivityIndicator size="small" color="#4F46E5" />
                  ) : (
                    <Text style={styles.copyBtnText}>{isCopied ? '✓' : '+'}</Text>
                  )}
                </TouchableOpacity>
              </View>
            );
          }}
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#fff',
  },
  dateText: { fontSize: 13, color: '#6B7280', marginBottom: 2 },
  title: { fontSize: 26, fontWeight: '800', color: '#111827' },
  templatesBtn: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  templatesBtnText: { color: '#4F46E5', fontWeight: '600', fontSize: 13 },
  progress: { paddingHorizontal: 20, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  progressText: { fontSize: 13, color: '#6B7280', marginBottom: 6 },
  progressBar: { height: 6, backgroundColor: '#E5E7EB', borderRadius: 3 },
  progressFill: { height: 6, backgroundColor: '#4F46E5', borderRadius: 3 },
  list: { padding: 16, gap: 10, paddingBottom: 100 },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  taskCardDone: { opacity: 0.6 },
  statusBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  statusIcon: { fontSize: 22 },
  taskContent: { flex: 1, gap: 4 },
  taskTitle: { fontSize: 15, fontWeight: '600', color: '#111827' },
  taskTitleDone: { textDecorationLine: 'line-through', color: '#9CA3AF' },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  statusBadgeText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  deleteBtn: { padding: 6 },
  deleteBtnText: { fontSize: 16 },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingBottom: 24,
  },
  input: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
  },
  micBtn: {
    width: 48,
    height: 48,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  micBtnRecording: {
    backgroundColor: '#FEE2E2',
    borderColor: '#EF4444',
  },
  micBtnText: { fontSize: 20 },
  micBtnTextRecording: { fontSize: 20 },
  addBtn: {
    width: 48,
    height: 48,
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtnDisabled: { opacity: 0.4 },
  addBtnText: { color: '#fff', fontSize: 24, fontWeight: '700', lineHeight: 28 },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyIcon: { fontSize: 56 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  emptyText: { fontSize: 15, color: '#6B7280', textAlign: 'center', paddingHorizontal: 20 },
  emptyBtn: { backgroundColor: '#4F46E5', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 8 },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  // Modal
  modalSafe: { flex: 1, backgroundColor: '#F9FAFB' },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },
  closeBtn: { backgroundColor: '#4F46E5', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  closeBtnText: { color: '#fff', fontWeight: '700' },
  filterRow: { backgroundColor: '#fff', maxHeight: 60 },
  filterContent: { paddingHorizontal: 16, paddingVertical: 12, gap: 8, flexDirection: 'row' },
  filterChip: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, backgroundColor: '#F3F4F6', borderWidth: 1.5, borderColor: 'transparent' },
  filterChipActive: { backgroundColor: '#EEF2FF', borderColor: '#4F46E5' },
  filterChipText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  filterChipTextActive: { color: '#4F46E5' },
  templateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    gap: 12,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  templateCardCopied: { borderColor: '#10B981', backgroundColor: '#F0FDF4' },
  templateInfo: { flex: 1, gap: 6 },
  templateTitle: { fontSize: 14, fontWeight: '600', color: '#111827' },
  templateMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  recurrenceBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  recurrenceBadgeText: { fontSize: 11, fontWeight: '600' },
  categoryText: { fontSize: 11, color: '#9CA3AF' },
  copyBtn: {
    width: 36,
    height: 36,
    backgroundColor: '#EEF2FF',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  copyBtnCopied: { backgroundColor: '#D1FAE5' },
  copyBtnText: { color: '#4F46E5', fontWeight: '800', fontSize: 18 },
});
