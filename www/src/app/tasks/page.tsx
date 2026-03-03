"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Plus, Mic, MicOff, Loader2, CheckCircle2, Circle, PlayCircle, PauseCircle, Clock, AlertTriangle, Trash2, Volume2, VolumeX, Settings, Copy, X } from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import { useAuth } from "@/lib/auth-context";
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
  DailyTaskTemplate,
  getDailyTaskTemplates,
} from "@/lib/tasks";
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
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
  const router = useRouter();
  const { user, loading } = useAuth();
  const { t } = useLanguage();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showTemplatesDialog, setShowTemplatesDialog] = useState(false);
  const [timers, setTimers] = useState<Record<string, number>>({});
  const [activeTimers, setActiveTimers] = useState<Set<string>>(new Set());
  const [hasSeeded, setHasSeeded] = useState(false);
  const intervalRefs = useRef<Record<string, NodeJS.Timeout>>({});

  // Redirect to landing if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/landing');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;

    const today = getTodayString();
    console.log("[TasksPage] Initializing for user:", user.uid, "today:", today);
    
    // Generate tasks from user templates for today
    console.log("[TasksPage] Generating tasks from templates...");
    seedDailyTasks(today).catch(console.error);
    
    // Set up real-time listener for tasks
    console.log("[TasksPage] Setting up real-time listener for tasks...");
    const unsubscribe = onTasksForDate(today, user.uid, (updatedTasks: Task[]) => {
      console.log("[TasksPage] Tasks updated:", updatedTasks.length, "tasks");
      console.log("[TasksPage] Tasks:", updatedTasks);
      setTasks(updatedTasks);
    });

    return () => {
      console.log("[TasksPage] Cleaning up listeners");
      unsubscribe();
      Object.values(intervalRefs.current).forEach(clearInterval);
    };
  }, [user]);

  const handleAddTask = async () => {
    if (!newTaskTitle.trim() || !user) return;
    setIsAddingTask(true);
    try {
      const today = getTodayString();
      await addTask(today, newTaskTitle.trim());
      setNewTaskTitle("");
      toast.success(t("taskAdded"));
    } catch (error) {
      console.error("Error adding task:", error);
      toast.error(t("errorAddingTask"));
    } finally {
      setIsAddingTask(false);
    }
  };

  const handleToggleStatus = async (taskId: string, currentStatus: string) => {
    if (!user) return;
    const newStatus = currentStatus === "completed" ? "pending" : "completed";
    try {
      await updateTaskStatus(taskId, newStatus);
      if (newStatus === "completed") {
        playBeep();
        toast.success(t("taskCompleted"));
      }
    } catch (error) {
      console.error("Error updating task:", error);
      toast.error(t("errorUpdatingTask"));
    }
  };

  const handleTaskClick = (task: Task) => {
    if (task.status === "completed") {
      // If completed, restart timer
      resetTimer(task.id);
      startTimer(task.id);
      handleToggleStatus(task.id, task.status);
    } else if (activeTimers.has(task.id)) {
      // If timer is running, mark complete
      stopTimer(task.id);
      handleToggleStatus(task.id, task.status);
    } else {
      // If not started, start timer
      startTimer(task.id);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!user) return;
    try {
      await deleteTask(taskId);
      toast.success(t("taskDeleted"));
    } catch (error) {
      console.error("Error deleting task:", error);
      toast.error(t("errorDeletingTask"));
    }
  };

  const startTimer = (taskId: string) => {
    if (activeTimers.has(taskId)) return;
    
    const newActiveTimers = new Set(activeTimers);
    newActiveTimers.add(taskId);
    setActiveTimers(newActiveTimers);

    intervalRefs.current[taskId] = setInterval(() => {
      setTimers((prev) => ({
        ...prev,
        [taskId]: (prev[taskId] || 0) + 1000,
      }));
    }, 1000);
  };

  const stopTimer = (taskId: string) => {
    if (intervalRefs.current[taskId]) {
      clearInterval(intervalRefs.current[taskId]);
      delete intervalRefs.current[taskId];
    }
    const newActiveTimers = new Set(activeTimers);
    newActiveTimers.delete(taskId);
    setActiveTimers(newActiveTimers);
  };

  const resetTimer = (taskId: string) => {
    stopTimer(taskId);
    setTimers((prev) => {
      const newTimers = { ...prev };
      delete newTimers[taskId];
      return newTimers;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const pendingTasks = tasks.filter((t) => t.status === "pending");
  const completedTasks = tasks.filter((t) => t.status === "completed");

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">{t("tasks")}</h1>
          <button
            onClick={() => setShowEditDialog(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
          >
            <Settings className="w-4 h-4" />
            {t("editDailyTasks")}
          </button>
        </div>

        {/* Add Task */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex gap-2">
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleAddTask()}
              placeholder={t("addNewTask")}
              className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={handleAddTask}
              disabled={isAddingTask || !newTaskTitle.trim()}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              {isAddingTask ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              {t("add")}
            </button>
          </div>
        </div>

        {/* Pending Tasks */}
        {pendingTasks.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-3">{t("pending")}</h2>
            <div className="space-y-2">
              {pendingTasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => handleTaskClick(task)}
                  className={`bg-white rounded-xl shadow-sm p-4 flex items-center gap-4 cursor-pointer transition-all ${
                    activeTimers.has(task.id) 
                      ? 'ring-2 ring-green-500 bg-green-50' 
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex-shrink-0">
                    {activeTimers.has(task.id) ? (
                      <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                        <PlayCircle className="w-4 h-4 text-white" />
                      </div>
                    ) : (
                      <Circle className="w-6 h-6 text-gray-400 hover:text-indigo-600 transition-colors" />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <p className={`font-medium ${
                      activeTimers.has(task.id) ? 'text-green-900' : 'text-gray-900'
                    }`}>
                      {task.title}
                    </p>
                    {activeTimers.has(task.id) && (
                      <p className="text-sm text-green-600 mt-1">Tap again to complete</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {timers[task.id] && (
                      <span className="text-sm font-mono text-gray-600">
                        {formatDuration(timers[task.id])}
                      </span>
                    )}
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTask(task.id);
                      }}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5 text-red-600" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Completed Tasks */}
        {completedTasks.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-700 mb-3">{t("completed")}</h2>
            <div className="space-y-2">
              {completedTasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => handleTaskClick(task)}
                  className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-4 opacity-60 cursor-pointer hover:opacity-80 transition-opacity"
                >
                  <div className="flex-shrink-0">
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  </div>
                  
                  <div className="flex-1">
                    <p className="text-gray-600 line-through">{task.title}</p>
                    <p className="text-sm text-gray-400 mt-1">Tap to restart</p>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteTask(task.id);
                    }}
                    className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5 text-red-600" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {tasks.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">{t("noTasksYet")}</p>
            <button
              onClick={() => setShowTemplatesDialog(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
            >
              Browse Templates
            </button>
          </div>
        )}
      </div>

      {showEditDialog && (
        <EditDailyTasksDialog open={true} onClose={() => setShowEditDialog(false)} />
      )}

      {/* Templates Dialog */}
      {showTemplatesDialog && <TemplatesDialog onClose={() => setShowTemplatesDialog(false)} />}

      {/* Floating Action Button for Templates */}
      <button
        onClick={() => setShowTemplatesDialog(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center group"
      >
        <Copy className="w-6 h-6" />
        <span className="absolute right-full mr-3 px-3 py-1 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Browse Templates
        </span>
      </button>
    </div>
  );
}

// Templates Dialog Component
function TemplatesDialog({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<DailyTaskTemplate[]>([]);
  const [copiedTitles, setCopiedTitles] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [copyingId, setCopyingId] = useState<string | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      // Hardcoded master templates
      const masterTemplates: DailyTaskTemplate[] = [
        // Daily tasks (showing first 20 for brevity)
        { id: "daily-1", title: "Make the beds", recurrence: "daily", category: "Morning Routine", order: 1, enabled: true },
        { id: "daily-2", title: "Open windows for fresh air", recurrence: "daily", category: "Morning Routine", order: 2, enabled: true },
        { id: "daily-3", title: "Prepare breakfast", recurrence: "daily", category: "Morning Routine", order: 3, enabled: true },
        { id: "daily-4", title: "Wash breakfast dishes", recurrence: "daily", category: "Morning Routine", order: 4, enabled: true },
        { id: "daily-5", title: "Wipe kitchen counters and stove", recurrence: "daily", category: "Morning Routine", order: 5, enabled: true },
        { id: "daily-6", title: "Sort and start laundry", recurrence: "daily", category: "Laundry", order: 6, enabled: true },
        { id: "daily-7", title: "Hang or dry clothes", recurrence: "daily", category: "Laundry", order: 7, enabled: true },
        { id: "daily-8", title: "Fold and put away dry clothes", recurrence: "daily", category: "Laundry", order: 8, enabled: true },
        { id: "daily-9", title: "Iron clothes for tomorrow", recurrence: "daily", category: "Laundry", order: 9, enabled: true },
        { id: "daily-10", title: "Sweep all floors", recurrence: "daily", category: "Cleaning", order: 10, enabled: true },
        { id: "daily-11", title: "Mop the floors", recurrence: "daily", category: "Cleaning", order: 11, enabled: true },
        { id: "daily-12", title: "Vacuum carpets and rugs", recurrence: "daily", category: "Cleaning", order: 12, enabled: true },
        { id: "daily-13", title: "Dust furniture and shelves", recurrence: "daily", category: "Cleaning", order: 13, enabled: true },
        { id: "daily-14", title: "Clean bathroom sink and toilet", recurrence: "daily", category: "Cleaning", order: 14, enabled: true },
        { id: "daily-15", title: "Wipe bathroom mirror", recurrence: "daily", category: "Cleaning", order: 15, enabled: true },
        { id: "daily-16", title: "Clean kitchen sink", recurrence: "daily", category: "Cleaning", order: 16, enabled: true },
        { id: "daily-17", title: "Wipe dining table", recurrence: "daily", category: "Cleaning", order: 17, enabled: true },
        { id: "daily-18", title: "Prepare lunch", recurrence: "daily", category: "Kitchen & Meals", order: 18, enabled: true },
        { id: "daily-19", title: "Wash lunch dishes", recurrence: "daily", category: "Kitchen & Meals", order: 19, enabled: true },
        { id: "daily-20", title: "Prepare snacks for kids", recurrence: "daily", category: "Kitchen & Meals", order: 20, enabled: true },
      ];

      const userTemplates = await getDailyTaskTemplates();
      setTemplates(masterTemplates);
      setCopiedTitles(new Set(userTemplates.map(t => t.title)));
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyTemplate = async (template: DailyTaskTemplate) => {
    if (copiedTitles.has(template.title)) return;

    setCopyingId(template.id);
    try {
      const templateData: any = {
        title: template.title,
        order: template.order,
        enabled: template.enabled,
        userId: user?.uid,
        recurrence: template.recurrence || "daily",
      };
      
      if (template.dayOfWeek !== undefined) templateData.dayOfWeek = template.dayOfWeek;
      if (template.dayOfMonth !== undefined) templateData.dayOfMonth = template.dayOfMonth;
      if (template.category) templateData.category = template.category;
      if (template.description) templateData.description = template.description;
      
      await addDoc(collection(db, 'dailyTaskTemplates'), templateData);
      setCopiedTitles(new Set([...copiedTitles, template.title]));
      toast.success('Template copied!');
    } catch (error) {
      toast.error('Error copying template');
    } finally {
      setCopyingId(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Browse Templates</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map((template) => {
                const isCopied = copiedTitles.has(template.title);
                const isCopying = copyingId === template.id;
                
                return (
                  <div
                    key={template.id}
                    className={`p-4 border rounded-lg transition-all ${
                      isCopied ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{template.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                            {template.recurrence}
                          </span>
                          <span className="text-xs text-gray-500">
                            {template.category}
                          </span>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => copyTemplate(template)}
                        disabled={isCopied || isCopying}
                        className={`p-2 rounded-lg transition-colors ${
                          isCopied
                            ? 'bg-green-100 text-green-600'
                            : 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200'
                        } ${isCopying ? 'opacity-50' : ''}`}
                      >
                        {isCopying ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : isCopied ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        <div className="p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
