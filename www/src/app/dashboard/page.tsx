"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
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
import { useAuth } from "@/lib/auth-context";
import {
  Task,
  TaskStatus,
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

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { t } = useLanguage();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [timers, setTimers] = useState<Record<string, number>>({});
  const [activeTimers, setActiveTimers] = useState<Set<string>>(new Set());
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
    const unsubscribe = onTasksForDate(today, (updatedTasks) => {
      setTasks(updatedTasks);
    });

    return () => {
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
      await updateTaskStatus(taskId, newStatus as TaskStatus);
      if (newStatus === "completed") {
        playBeep();
        toast.success(t("taskCompleted"));
      }
    } catch (error) {
      console.error("Error updating task:", error);
      toast.error(t("errorUpdatingTask"));
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
            {t("Edit Recurring Tasks")}
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
              placeholder={t("Start typing to add a task e.g. Prepare lunch box")}
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
                  className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-4"
                >
                  <button
                    onClick={() => handleToggleStatus(task.id, task.status)}
                    className="flex-shrink-0"
                  >
                    <Circle className="w-6 h-6 text-gray-400 hover:text-indigo-600 transition-colors" />
                  </button>
                  
                  <div className="flex-1">
                    <p className="text-gray-900 font-medium">{task.title}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {timers[task.id] && (
                      <span className="text-sm font-mono text-gray-600">
                        {formatDuration(timers[task.id])}
                      </span>
                    )}
                    
                    {activeTimers.has(task.id) ? (
                      <button
                        onClick={() => stopTimer(task.id)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <PauseCircle className="w-5 h-5 text-orange-600" />
                      </button>
                    ) : (
                      <button
                        onClick={() => startTimer(task.id)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <PlayCircle className="w-5 h-5 text-green-600" />
                      </button>
                    )}
                    
                    {timers[task.id] && (
                      <button
                        onClick={() => resetTimer(task.id)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Clock className="w-5 h-5 text-gray-600" />
                      </button>
                    )}

                    <button
                      onClick={() => handleDeleteTask(task.id)}
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
                  className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-4 opacity-60"
                >
                  <button
                    onClick={() => handleToggleStatus(task.id, task.status)}
                    className="flex-shrink-0"
                  >
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  </button>
                  
                  <div className="flex-1">
                    <p className="text-gray-600 line-through">{task.title}</p>
                  </div>

                  <button
                    onClick={() => handleDeleteTask(task.id)}
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
            <p className="text-gray-500">{t("No tasks found, start with 'Add New Task' above")}</p>
          </div>
        )}
      </div>

      {showEditDialog && (
        <EditDailyTasksDialog open={showEditDialog} onClose={() => setShowEditDialog(false)} />
      )}
    </div>
  );
}
