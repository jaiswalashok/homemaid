import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  Vibration,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  CheckCircle2,
  Circle,
  PlayCircle,
  PauseCircle,
  Clock,
  AlertTriangle,
  Trash2,
  Plus,
} from 'lucide-react-native';
import { useLanguage } from '../context/LanguageContext';
import {
  Task,
  getTodayString,
  getTasksForDate,
  onTasksForDate,
  seedDailyTasks,
  addTask,
  updateTaskStatus,
  deleteTask,
  carryOverTasks,
} from '../services/tasks';
import { Timestamp } from 'firebase/firestore';
import { COLORS, SPACING, RADIUS } from '../config/theme';

function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export default function TasksScreen() {
  const { t, language } = useLanguage();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTaskText, setNewTaskText] = useState('');
  const [addingTask, setAddingTask] = useState(false);
  const [now, setNow] = useState(Date.now());
  const today = getTodayString();

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    async function init() {
      try {
        await seedDailyTasks(today);
        const carried = await carryOverTasks(today);
        if (carried > 0) {
          Alert.alert('Tasks', `${carried} unfinished task(s) carried over from yesterday`);
        }

        unsubscribe = onTasksForDate(today, (newTasks) => {
          setTasks(newTasks);
          setLoading(false);
        });
      } catch (err) {
        console.error('Failed to load tasks:', err);
        setLoading(false);
      }
    }

    init();
    return () => { if (unsubscribe) unsubscribe(); };
  }, [today]);

  const loadTasks = useCallback(async () => {
    try {
      const data = await getTasksForDate(today);
      data.sort((a, b) => {
        if (a.isUrgent && !b.isUrgent) return -1;
        if (!a.isUrgent && b.isUrgent) return 1;
        return a.order - b.order;
      });
      setTasks(data);
    } catch (err) {
      console.error('Failed to reload tasks:', err);
    }
  }, [today]);

  const activeTask = tasks.find((t) => t.status === 'in_progress');

  const getElapsed = (task: Task): number => {
    if (task.status === 'in_progress' && task.startedAt) {
      const startMs = task.startedAt instanceof Timestamp
        ? task.startedAt.toMillis()
        : Date.now();
      return task.elapsedMs + (now - startMs);
    }
    return task.elapsedMs;
  };

  const handleTaskTap = async (task: Task) => {
    try {
      if (task.status === 'pending') {
        if (activeTask && activeTask.id !== task.id) {
          const activeElapsed = getElapsed(activeTask);
          await updateTaskStatus(activeTask.id, 'paused', {
            elapsedMs: activeElapsed,
            pausedAt: Timestamp.now(),
            startedAt: null,
          } as any);
        }
        await updateTaskStatus(task.id, 'in_progress', {
          startedAt: Timestamp.now(),
        } as any);
        Vibration.vibrate(50);
      } else if (task.status === 'in_progress') {
        const elapsed = getElapsed(task);
        await updateTaskStatus(task.id, 'completed', {
          elapsedMs: elapsed,
          completedAt: Timestamp.now(),
          startedAt: null,
        } as any);
        Vibration.vibrate([0, 50, 50, 50]);
      } else if (task.status === 'paused') {
        if (activeTask && activeTask.id !== task.id) {
          const activeElapsed = getElapsed(activeTask);
          await updateTaskStatus(activeTask.id, 'paused', {
            elapsedMs: activeElapsed,
            pausedAt: Timestamp.now(),
            startedAt: null,
          } as any);
        }
        await updateTaskStatus(task.id, 'in_progress', {
          startedAt: Timestamp.now(),
          pausedAt: null,
        } as any);
        Vibration.vibrate(50);
      }
      await loadTasks();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update task');
    }
  };

  const handleAddTask = async (isUrgent: boolean = false) => {
    if (!newTaskText.trim()) return;
    setAddingTask(true);
    try {
      await addTask(newTaskText.trim(), today, isUrgent);
      setNewTaskText('');
      await loadTasks();
      if (isUrgent) Vibration.vibrate([0, 100, 50, 100]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to add task');
    } finally {
      setAddingTask(false);
    }
  };

  const handleDelete = async (task: Task) => {
    Alert.alert('Delete Task', `Delete "${task.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteTask(task.id);
            await loadTasks();
          } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to delete');
          }
        },
      },
    ]);
  };

  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const totalCount = tasks.length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const getStatusIcon = (task: Task) => {
    if (task.status === 'completed') return <CheckCircle2 size={24} color={COLORS.success} />;
    if (task.status === 'in_progress') return <PlayCircle size={24} color={COLORS.accent} />;
    if (task.status === 'paused') return <PauseCircle size={24} color={COLORS.warning} />;
    return <Circle size={24} color={COLORS.border} />;
  };

  const getStatusBg = (task: Task) => {
    if (task.status === 'completed') return { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' };
    if (task.status === 'in_progress') return { backgroundColor: '#FFF7ED', borderColor: '#FED7AA' };
    if (task.status === 'paused') return { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' };
    if (task.isUrgent && task.status === 'pending') return { backgroundColor: '#FEF2F2', borderColor: '#FECACA' };
    return { backgroundColor: COLORS.white, borderColor: COLORS.border };
  };

  const renderTask = ({ item: task }: { item: Task }) => (
    <TouchableOpacity
      style={[styles.taskItem, getStatusBg(task), task.status === 'completed' && { opacity: 0.7 }]}
      onPress={() => { if (task.status !== 'completed') handleTaskTap(task); }}
      onLongPress={() => handleDelete(task)}
      activeOpacity={0.7}
    >
      <View style={styles.taskIcon}>{getStatusIcon(task)}</View>
      <View style={styles.taskContent}>
        <View style={styles.taskTitleRow}>
          <Text style={[styles.taskTitle, task.status === 'completed' && styles.taskTitleDone]}>
            {task.title}
          </Text>
          {task.isUrgent && (
            <View style={styles.urgentBadge}>
              <Text style={styles.urgentBadgeText}>URGENT</Text>
            </View>
          )}
          {task.isDaily && (
            <View style={styles.dailyBadge}>
              <Text style={styles.dailyBadgeText}>DAILY</Text>
            </View>
          )}
        </View>
        {(task.status === 'in_progress' || task.status === 'paused' || task.status === 'completed') && (
          <View style={styles.timerRow}>
            <Clock size={12} color={COLORS.gray} />
            <Text style={[styles.timerText, task.status === 'in_progress' && styles.timerActive]}>
              {formatDuration(getElapsed(task))}
            </Text>
            {task.status === 'in_progress' && <Text style={styles.runningDot}>● RUNNING</Text>}
            {task.status === 'paused' && <Text style={styles.pausedText}>⏸ PAUSED</Text>}
          </View>
        )}
      </View>
      <View style={styles.taskHint}>
        {task.status === 'pending' && <Text style={styles.hintText}>Tap to start →</Text>}
        {task.status === 'in_progress' && <Text style={[styles.hintText, { color: COLORS.accent }]}>Tap to finish →</Text>}
        {task.status === 'paused' && <Text style={[styles.hintText, { color: COLORS.warning }]}>Tap to resume →</Text>}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>{t('tasks')}</Text>
          <Text style={styles.headerDate}>{today}</Text>
        </View>
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>{completedCount}/{totalCount}</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
          </View>
        </View>
      </View>

      {/* Add Task Bar */}
      <View style={styles.addBar}>
        <TextInput
          style={styles.addInput}
          value={newTaskText}
          onChangeText={setNewTaskText}
          placeholder={t('addTask')}
          placeholderTextColor={COLORS.gray}
          editable={!addingTask}
          onSubmitEditing={() => handleAddTask(false)}
          returnKeyType="done"
        />
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => handleAddTask(false)}
          disabled={addingTask || !newTaskText.trim()}
        >
          {addingTask ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <Plus size={20} color={COLORS.white} />
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.urgentButton}
          onPress={() => handleAddTask(true)}
          disabled={addingTask || !newTaskText.trim()}
        >
          <AlertTriangle size={20} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {/* Task List */}
      {loading ? (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={COLORS.tasks} />
          <Text style={styles.emptyText}>Loading tasks...</Text>
        </View>
      ) : tasks.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>✅</Text>
          <Text style={styles.emptyText}>{t('noTasks')}</Text>
        </View>
      ) : (
        <FlatList
          data={tasks}
          renderItem={renderTask}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={() => (
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>{t('summary')}</Text>
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryNumber, { color: COLORS.success }]}>{completedCount}</Text>
                  <Text style={styles.summaryLabel}>{t('completed')}</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryNumber, { color: COLORS.accent }]}>
                    {tasks.filter((t) => t.status === 'in_progress' || t.status === 'paused').length}
                  </Text>
                  <Text style={styles.summaryLabel}>{t('inProgress')}</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryNumber, { color: COLORS.gray }]}>
                    {tasks.filter((t) => t.status === 'pending').length}
                  </Text>
                  <Text style={styles.summaryLabel}>{t('pending')}</Text>
                </View>
              </View>
              <View style={styles.summaryProgressBar}>
                <View style={[styles.summaryProgressFill, { width: `${progressPct}%` }]} />
              </View>
              <Text style={styles.summaryPercent}>{progressPct}% complete</Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.tasks,
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: COLORS.white },
  headerDate: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  progressContainer: { alignItems: 'flex-end' },
  progressText: { fontSize: 14, fontWeight: '600', color: COLORS.white, marginBottom: 4 },
  progressBar: { width: 60, height: 6, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: COLORS.white, borderRadius: 3 },
  addBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: 8,
  },
  addInput: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  addButton: {
    backgroundColor: COLORS.tasks,
    borderRadius: RADIUS.md,
    padding: 12,
  },
  urgentButton: {
    backgroundColor: COLORS.urgent,
    borderRadius: RADIUS.md,
    padding: 12,
  },
  listContent: { paddingHorizontal: SPACING.md, paddingBottom: 100 },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginBottom: 6,
  },
  taskIcon: { marginRight: 12 },
  taskContent: { flex: 1 },
  taskTitleRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  taskTitle: { fontSize: 14, fontWeight: '500', color: COLORS.textPrimary },
  taskTitleDone: { color: COLORS.gray, textDecorationLine: 'line-through' },
  urgentBadge: { backgroundColor: '#FEE2E2', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  urgentBadgeText: { fontSize: 9, fontWeight: '700', color: COLORS.urgent },
  dailyBadge: { backgroundColor: '#E0E7FF', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  dailyBadgeText: { fontSize: 9, fontWeight: '700', color: COLORS.tasks },
  timerRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 },
  timerText: { fontSize: 11, color: COLORS.gray },
  timerActive: { color: COLORS.accent, fontWeight: '600', fontVariant: ['tabular-nums'] },
  runningDot: { fontSize: 9, color: COLORS.accent, marginLeft: 4 },
  pausedText: { fontSize: 9, color: COLORS.warning, marginLeft: 4 },
  taskHint: { marginLeft: 8 },
  hintText: { fontSize: 10, color: COLORS.gray },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyIcon: { fontSize: 60, marginBottom: 12 },
  emptyText: { fontSize: 15, color: COLORS.gray },
  summaryCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginTop: SPACING.lg,
  },
  summaryTitle: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-around' },
  summaryItem: { alignItems: 'center' },
  summaryNumber: { fontSize: 24, fontWeight: '700' },
  summaryLabel: { fontSize: 10, color: COLORS.gray, textTransform: 'uppercase', marginTop: 2 },
  summaryProgressBar: {
    height: 8,
    backgroundColor: COLORS.lightGray,
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 12,
  },
  summaryProgressFill: { height: '100%', backgroundColor: COLORS.success, borderRadius: 4 },
  summaryPercent: { fontSize: 11, color: COLORS.gray, textAlign: 'center', marginTop: 4 },
});
