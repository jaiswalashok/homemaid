"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  Plus,
  Mic,
  MicOff,
  Loader2,
  CheckCircle2,
  Circle,
  PlayCircle,
  PauseCircle,
  Clock,
  AlertTriangle,
  Trash2,
  Volume2,
  VolumeX,
  Settings,
} from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import { ensureAuth } from "@/lib/firebase";
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
} from "@/lib/tasks";
import { Timestamp } from "firebase/firestore";
import toast from "react-hot-toast";
import NavBar from "@/components/NavBar";
import EditDailyTasksDialog from "@/components/EditDailyTasksDialog";

import { playBeep } from "@/lib/beep";

function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export default function TasksPage() {
  const { language } = useLanguage();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTaskText, setNewTaskText] = useState("");
  const [addingTask, setAddingTask] = useState(false);
  const [listening, setListening] = useState(false);
  const [beepingTaskId, setBeepingTaskId] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());
  const [editDailyOpen, setEditDailyOpen] = useState(false);
  const recognitionRef = useRef<any>(null);
  const beepIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const knownTaskIdsRef = useRef<Set<string>>(new Set());
  const initialLoadDoneRef = useRef(false);
  const today = getTodayString();

  // Timer tick every second for live elapsed time
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Beeping for urgent tasks
  useEffect(() => {
    if (beepingTaskId) {
      beepIntervalRef.current = setInterval(() => playBeep(), 1500);
      playBeep(); // immediate first beep
    }
    return () => {
      if (beepIntervalRef.current) {
        clearInterval(beepIntervalRef.current);
        beepIntervalRef.current = null;
      }
    };
  }, [beepingTaskId]);

  // One-time seed + carryover, then start real-time listener
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    async function init() {
      try {
        await ensureAuth();
        // Seed daily tasks if needed
        const seeded = await seedDailyTasks(today);
        if (seeded) console.log("[Tasks] Seeded daily tasks for", today);

        // Carry over incomplete non-daily tasks
        const carried = await carryOverTasks(today);
        if (carried > 0) {
          console.log(`[Tasks] Carried over ${carried} tasks to today`);
          toast.success(`${carried} unfinished task(s) carried over from yesterday`);
        }

        // Start real-time listener
        unsubscribe = onTasksForDate(today, (newTasks) => {
          if (initialLoadDoneRef.current) {
            // Subsequent updates: detect new urgent tasks
            for (const task of newTasks) {
              if (
                task.isUrgent &&
                task.status === "pending" &&
                !knownTaskIdsRef.current.has(task.id)
              ) {
                setBeepingTaskId(task.id);
                toast("🚨 New urgent task!", { icon: "⚠️", duration: 5000 });
                break;
              }
            }
          } else {
            // Initial load: beep if there are recent urgent pending tasks (added < 60s ago)
            const now = Date.now();
            for (const task of newTasks) {
              if (
                task.isUrgent &&
                task.status === "pending" &&
                task.createdAt
              ) {
                const createdMs = task.createdAt instanceof Timestamp
                  ? task.createdAt.toMillis()
                  : new Date(task.createdAt as any).getTime();
                if (now - createdMs < 60000) {
                  setBeepingTaskId(task.id);
                  toast("🚨 Urgent task waiting!", { icon: "⚠️", duration: 5000 });
                  break;
                }
              }
            }
          }

          // Update known IDs
          knownTaskIdsRef.current = new Set(newTasks.map((t) => t.id));
          initialLoadDoneRef.current = true;

          setTasks(newTasks);
          setLoading(false);
        });
      } catch (err) {
        console.error("Failed to load tasks:", err);
        toast.error("Failed to load tasks");
        setLoading(false);
      }
    }

    init();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [today]);

  // Manual reload (for after add/update/delete operations)
  const loadTasks = useCallback(async () => {
    // With real-time listener, this is mostly a no-op since onSnapshot handles updates.
    // But we keep it for explicit refreshes after local mutations.
    try {
      const data = await getTasksForDate(today);
      data.sort((a, b) => {
        if (a.isUrgent && !b.isUrgent) return -1;
        if (!a.isUrgent && b.isUrgent) return 1;
        return a.order - b.order;
      });
      setTasks(data);
    } catch (err) {
      console.error("Failed to reload tasks:", err);
    }
  }, [today]);

  // Get the currently active (in_progress) task
  const activeTask = tasks.find((t) => t.status === "in_progress");

  // Calculate live elapsed time for a task
  const getElapsed = (task: Task): number => {
    if (task.status === "in_progress" && task.startedAt) {
      const startMs = task.startedAt instanceof Timestamp
        ? task.startedAt.toMillis()
        : Date.now();
      return task.elapsedMs + (now - startMs);
    }
    return task.elapsedMs;
  };

  // Handle task tap - the core state machine
  const handleTaskTap = async (task: Task) => {
    try {
      // If this is a beeping urgent task, stop the beep first
      if (beepingTaskId === task.id) {
        setBeepingTaskId(null);
      }

      if (task.status === "pending") {
        // START this task
        // If another task is in progress, pause it first
        if (activeTask && activeTask.id !== task.id) {
          const activeElapsed = getElapsed(activeTask);
          await updateTaskStatus(activeTask.id, "paused", {
            elapsedMs: activeElapsed,
            pausedAt: Timestamp.now(),
            startedAt: null,
          } as any);
        }
        await updateTaskStatus(task.id, "in_progress", {
          startedAt: Timestamp.now(),
        } as any);
        toast.success(`Started: ${task.title}`);
      } else if (task.status === "in_progress") {
        // FINISH this task
        const elapsed = getElapsed(task);
        await updateTaskStatus(task.id, "completed", {
          elapsedMs: elapsed,
          completedAt: Timestamp.now(),
          startedAt: null,
        } as any);
        toast.success(`Completed: ${task.title}`);
      } else if (task.status === "paused") {
        // RESUME this task
        if (activeTask && activeTask.id !== task.id) {
          const activeElapsed = getElapsed(activeTask);
          await updateTaskStatus(activeTask.id, "paused", {
            elapsedMs: activeElapsed,
            pausedAt: Timestamp.now(),
            startedAt: null,
          } as any);
        }
        await updateTaskStatus(task.id, "in_progress", {
          startedAt: Timestamp.now(),
          pausedAt: null,
        } as any);
        toast.success(`Resumed: ${task.title}`);
      }
      // Completed tasks: no action on tap

      await loadTasks();
    } catch (err: any) {
      toast.error(err.message || "Failed to update task");
    }
  };

  // Add a new task (urgent goes to top with beeping)
  const handleAddTask = async (isUrgent: boolean = false) => {
    if (!newTaskText.trim()) return;
    setAddingTask(true);
    try {
      const id = await addTask(newTaskText.trim(), today, isUrgent);
      setNewTaskText("");
      await loadTasks();
      if (isUrgent) {
        setBeepingTaskId(id);
        toast("🚨 Urgent task added!", { icon: "⚠️" });
      } else {
        toast.success("Task added!");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to add task");
    } finally {
      setAddingTask(false);
    }
  };

  // Voice input
  const startListening = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Speech recognition not supported");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = language === "Hindi" ? "hi-IN" : "en-US";
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setNewTaskText(transcript);
      setListening(false);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  // Delete task
  const handleDelete = async (task: Task) => {
    try {
      await deleteTask(task.id);
      if (beepingTaskId === task.id) setBeepingTaskId(null);
      await loadTasks();
      toast.success("Task deleted");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete");
    }
  };

  // Stats
  const completedCount = tasks.filter((t) => t.status === "completed").length;
  const totalCount = tasks.length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const getStatusIcon = (task: Task) => {
    if (task.status === "completed") return <CheckCircle2 className="w-6 h-6 text-green-500" />;
    if (task.status === "in_progress") return <PlayCircle className="w-6 h-6 text-orange-500 animate-pulse" />;
    if (task.status === "paused") return <PauseCircle className="w-6 h-6 text-yellow-500" />;
    return <Circle className="w-6 h-6 text-gray-300" />;
  };

  const getStatusBg = (task: Task) => {
    if (task.status === "completed") return "bg-green-50 border-green-200";
    if (task.status === "in_progress") return "bg-orange-50 border-orange-200 ring-2 ring-orange-300";
    if (task.status === "paused") return "bg-yellow-50 border-yellow-200";
    if (task.isUrgent && task.status === "pending") return "bg-red-50 border-red-300 animate-pulse";
    return "bg-white border-gray-100 hover:border-gray-200";
  };

  return (
    <div className="min-h-screen bg-[#faf7f5]">
      <NavBar />

      {/* Sub-header: progress + settings */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-500 to-indigo-500 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white">
              {language === "Hindi" ? "दैनिक कार्य" : "Daily Tasks"}
            </span>
            <span className="text-[10px] text-indigo-200">{today}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white">
                {completedCount}/{totalCount}
              </span>
              <div className="w-16 h-2 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
            <button
              onClick={() => setEditDailyOpen(true)}
              className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              title={language === "Hindi" ? "कार्य प्रबंधन" : "Manage Tasks"}
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Add Task Bar */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddTask(false);
              }}
              placeholder={language === "Hindi" ? "नया कार्य जोड़ें..." : "Add a new task..."}
              disabled={addingTask}
              className="w-full pl-4 pr-10 py-3 rounded-xl bg-white border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent shadow-sm disabled:opacity-50"
            />
            <button
              onClick={listening ? stopListening : startListening}
              disabled={addingTask}
              className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors ${
                listening
                  ? "bg-red-500 text-white animate-pulse"
                  : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              }`}
            >
              {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          </div>

          {/* Add normal task */}
          <button
            onClick={() => handleAddTask(false)}
            disabled={addingTask || !newTaskText.trim()}
            className="flex items-center gap-1.5 px-4 py-3 rounded-xl bg-indigo-500 text-white text-sm font-medium hover:bg-indigo-600 transition-colors disabled:opacity-50 shadow-sm"
          >
            {addingTask ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {language === "Hindi" ? "जोड़ें" : "Add"}
          </button>

          {/* Add urgent task */}
          <button
            onClick={() => handleAddTask(true)}
            disabled={addingTask || !newTaskText.trim()}
            className="flex items-center gap-1.5 px-4 py-3 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50 shadow-sm"
            title="Add as urgent (will beep)"
          >
            <AlertTriangle className="w-4 h-4" />
            {language === "Hindi" ? "तुरंत" : "Urgent"}
          </button>
        </div>

        {/* Beeping indicator */}
        {beepingTaskId && (
          <div className="mt-2 flex items-center gap-2 px-4 py-2 bg-red-100 border border-red-300 rounded-xl animate-pulse">
            <Volume2 className="w-4 h-4 text-red-600" />
            <span className="text-sm text-red-700 font-medium">
              {language === "Hindi" ? "🚨 नया तुरंत कार्य! टैप करें शुरू करने के लिए" : "🚨 New urgent task! Tap it to start and stop beeping"}
            </span>
            <button
              onClick={() => setBeepingTaskId(null)}
              className="ml-auto p-1 rounded-lg hover:bg-red-200 text-red-600"
            >
              <VolumeX className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Task List */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 pb-12">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
            <p className="text-gray-400 mt-4 text-sm">Loading tasks...</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24">
            <CheckCircle2 className="w-16 h-16 text-gray-200 mb-4" />
            <p className="text-gray-400">No tasks for today</p>
          </div>
        ) : (
          <div className="space-y-2">
            {tasks.map((task) => (
              <div
                key={task.id}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all cursor-pointer ${getStatusBg(task)} ${
                  beepingTaskId === task.id ? "ring-2 ring-red-400 animate-pulse" : ""
                }`}
                onClick={() => {
                  if (task.status !== "completed") handleTaskTap(task);
                }}
              >
                {/* Status icon */}
                <div className="flex-shrink-0">
                  {getStatusIcon(task)}
                </div>

                {/* Task content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-medium ${
                        task.status === "completed"
                          ? "text-gray-400 line-through"
                          : "text-gray-800"
                      }`}
                    >
                      {task.title}
                    </span>
                    {task.isUrgent && (
                      <span className="px-1.5 py-0.5 bg-red-100 text-red-600 text-[10px] font-bold rounded-md uppercase">
                        🚨 Urgent
                      </span>
                    )}
                    {task.source === "telegram" && (
                      <span className="px-1.5 py-0.5 bg-blue-100 text-blue-600 text-[10px] font-bold rounded-md uppercase">
                        Telegram
                      </span>
                    )}
                    {task.isDaily && (
                      <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-600 text-[10px] font-bold rounded-md uppercase">
                        Daily
                      </span>
                    )}
                  </div>

                  {/* Timer / elapsed */}
                  {(task.status === "in_progress" || task.status === "paused" || task.status === "completed") && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3 text-gray-400" />
                      <span className={`text-xs ${
                        task.status === "in_progress" ? "text-orange-600 font-mono font-semibold" : "text-gray-400"
                      }`}>
                        {formatDuration(getElapsed(task))}
                      </span>
                      {task.status === "in_progress" && (
                        <span className="text-[10px] text-orange-400 ml-1">● RUNNING</span>
                      )}
                      {task.status === "paused" && (
                        <span className="text-[10px] text-yellow-500 ml-1">⏸ PAUSED</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Status hint */}
                <div className="flex-shrink-0 text-right">
                  {task.status === "pending" && (
                    <span className="text-[10px] text-gray-400">
                      {language === "Hindi" ? "शुरू करें →" : "Tap to start →"}
                    </span>
                  )}
                  {task.status === "in_progress" && (
                    <span className="text-[10px] text-orange-500">
                      {language === "Hindi" ? "पूरा करें →" : "Tap to finish →"}
                    </span>
                  )}
                  {task.status === "paused" && (
                    <span className="text-[10px] text-yellow-600">
                      {language === "Hindi" ? "जारी रखें →" : "Tap to resume →"}
                    </span>
                  )}
                </div>

                {/* Delete button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(task);
                  }}
                  className="flex-shrink-0 p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Summary */}
        {!loading && tasks.length > 0 && (
          <div className="mt-8 p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              {language === "Hindi" ? "आज का सारांश" : "Today's Summary"}
            </h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-600">{completedCount}</div>
                <div className="text-[10px] text-gray-400 uppercase">{language === "Hindi" ? "पूर्ण" : "Completed"}</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-500">
                  {tasks.filter((t) => t.status === "in_progress" || t.status === "paused").length}
                </div>
                <div className="text-[10px] text-gray-400 uppercase">{language === "Hindi" ? "जारी" : "In Progress"}</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-400">
                  {tasks.filter((t) => t.status === "pending").length}
                </div>
                <div className="text-[10px] text-gray-400 uppercase">{language === "Hindi" ? "बाकी" : "Pending"}</div>
              </div>
            </div>
            <div className="mt-3 w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full transition-all duration-700"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1 text-center">{progressPct}% complete</p>
          </div>
        )}
      </main>

      {/* Edit Daily Tasks Dialog */}
      <EditDailyTasksDialog
        open={editDailyOpen}
        onClose={() => setEditDailyOpen(false)}
      />
    </div>
  );
}
