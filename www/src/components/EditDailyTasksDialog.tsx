"use client";

import { useState, useEffect } from "react";
import { X, Plus, Trash2, Loader2, ToggleLeft, ToggleRight, ChefHat, CalendarDays, CalendarRange, Calendar } from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import {
  DailyTaskTemplate,
  TaskRecurrence,
  getDailyTaskTemplates,
  addDailyTaskTemplate,
  updateDailyTaskTemplate,
  deleteDailyTaskTemplate,
  seedDailyTaskTemplates,
} from "@/lib/tasks";
import { getAllRecipes, Recipe } from "@/lib/recipes";
import { getCuisineFlag } from "@/lib/cuisine-flags";
import toast from "react-hot-toast";

const RECURRENCE_TABS: { key: TaskRecurrence; label: string; labelHi: string; icon: any }[] = [
  { key: "daily", label: "Daily", labelHi: "दैनिक", icon: CalendarDays },
  { key: "weekly", label: "Weekly", labelHi: "साप्ताहिक", icon: CalendarRange },
  { key: "biweekly", label: "Biweekly", labelHi: "पाक्षिक", icon: CalendarRange },
  { key: "monthly", label: "Monthly", labelHi: "मासिक", icon: Calendar },
];

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_NAMES_HI = ["रवि", "सोम", "मंगल", "बुध", "गुरु", "शुक्र", "शनि"];

interface EditDailyTasksDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function EditDailyTasksDialog({ open, onClose }: EditDailyTasksDialogProps) {
  const { language } = useLanguage();
  const [templates, setTemplates] = useState<DailyTaskTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TaskRecurrence>("daily");
  const [newTask, setNewTask] = useState("");
  const [newDayOfWeek, setNewDayOfWeek] = useState(1); // Monday
  const [newDayOfMonth, setNewDayOfMonth] = useState(1);
  const [adding, setAdding] = useState(false);
  // Recipe picker
  const [showRecipePicker, setShowRecipePicker] = useState(false);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loadingRecipes, setLoadingRecipes] = useState(false);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      await seedDailyTaskTemplates();
      const data = await getDailyTaskTemplates();
      setTemplates(data);
    } catch (err) {
      console.error("Failed to load templates:", err);
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  const loadRecipes = async () => {
    setLoadingRecipes(true);
    try {
      const data = await getAllRecipes();
      setRecipes(data);
    } catch (err) {
      console.error("Failed to load recipes:", err);
    } finally {
      setLoadingRecipes(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadTemplates();
      loadRecipes();
    }
  }, [open]);

  const handleAdd = async () => {
    if (!newTask.trim()) return;
    setAdding(true);
    try {
      await addDailyTaskTemplate(newTask.trim(), {
        recurrence: activeTab,
        ...(activeTab === "weekly" || activeTab === "biweekly" ? { dayOfWeek: newDayOfWeek } : {}),
        ...(activeTab === "monthly" ? { dayOfMonth: newDayOfMonth } : {}),
      });
      setNewTask("");
      await loadTemplates();
      toast.success(`Task added to ${activeTab} list`);
    } catch (err: any) {
      toast.error(err.message || "Failed to add");
    } finally {
      setAdding(false);
    }
  };

  const handleAddRecipe = async (recipe: Recipe) => {
    try {
      const title = recipe.en?.title || "Recipe";
      await addDailyTaskTemplate(`Cook: ${title}`, {
        recurrence: activeTab,
        ...(activeTab === "weekly" || activeTab === "biweekly" ? { dayOfWeek: newDayOfWeek } : {}),
        ...(activeTab === "monthly" ? { dayOfMonth: newDayOfMonth } : {}),
        isRecipe: true,
        recipeId: recipe.id,
      });
      await loadTemplates();
      setShowRecipePicker(false);
      toast.success(`🍳 "${title}" added as ${activeTab} cooking task`);
    } catch (err: any) {
      toast.error(err.message || "Failed to add recipe task");
    }
  };

  const handleToggle = async (tmpl: DailyTaskTemplate) => {
    try {
      await updateDailyTaskTemplate(tmpl.id, { enabled: !tmpl.enabled });
      setTemplates((prev) =>
        prev.map((t) => (t.id === tmpl.id ? { ...t, enabled: !t.enabled } : t))
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to update");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDailyTaskTemplate(id);
      setTemplates((prev) => prev.filter((t) => t.id !== id));
      toast.success("Task removed");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete");
    }
  };

  const handleRename = async (tmpl: DailyTaskTemplate, newTitle: string) => {
    if (!newTitle.trim() || newTitle === tmpl.title) return;
    try {
      await updateDailyTaskTemplate(tmpl.id, { title: newTitle.trim() });
      setTemplates((prev) =>
        prev.map((t) => (t.id === tmpl.id ? { ...t, title: newTitle.trim() } : t))
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to rename");
    }
  };

  const handleChangeRecurrence = async (tmpl: DailyTaskTemplate, recurrence: TaskRecurrence) => {
    try {
      await updateDailyTaskTemplate(tmpl.id, { recurrence });
      setTemplates((prev) =>
        prev.map((t) => (t.id === tmpl.id ? { ...t, recurrence } : t))
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to update");
    }
  };

  if (!open) return null;

  // Filter templates by active tab
  const filtered = templates.filter((t) => (t.recurrence || "daily") === activeTab);
  const enabledCount = filtered.filter((t) => t.enabled).length;
  const dayNames = language === "Hindi" ? DAY_NAMES_HI : DAY_NAMES;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-800">
              {language === "Hindi" ? "कार्य प्रबंधन" : "Manage Tasks"}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {enabledCount} {language === "Hindi" ? "सक्रिय" : "active"} / {filtered.length} {language === "Hindi" ? "कुल" : "total"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Recurrence Tabs */}
        <div className="flex items-center gap-1 px-4 py-2 border-b border-gray-100 overflow-x-auto">
          {RECURRENCE_TABS.map((tab) => {
            const Icon = tab.icon;
            const count = templates.filter((t) => (t.recurrence || "daily") === tab.key).length;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.key
                    ? "bg-indigo-500 text-white shadow-sm"
                    : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {language === "Hindi" ? tab.labelHi : tab.label}
                {count > 0 && (
                  <span className={`text-[10px] px-1 rounded-full ${
                    activeTab === tab.key ? "bg-white/20" : "bg-gray-200"
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Add new task section */}
        <div className="px-6 py-3 border-b border-gray-50 space-y-2">
          {/* Day picker for weekly/biweekly */}
          {(activeTab === "weekly" || activeTab === "biweekly") && (
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-500 mr-1">{language === "Hindi" ? "दिन:" : "Day:"}</span>
              {dayNames.map((d, i) => (
                <button
                  key={i}
                  onClick={() => setNewDayOfWeek(i)}
                  className={`px-2 py-1 rounded text-[10px] font-medium transition-all ${
                    newDayOfWeek === i
                      ? "bg-indigo-500 text-white"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          )}
          {/* Day of month picker for monthly */}
          {activeTab === "monthly" && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">{language === "Hindi" ? "तारीख:" : "Day of month:"}</span>
              <select
                value={newDayOfMonth}
                onChange={(e) => setNewDayOfMonth(Number(e.target.value))}
                className="px-2 py-1 rounded-lg bg-gray-50 border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          )}
          {/* Task input + recipe picker button */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
              placeholder={language === "Hindi" ? "नया कार्य जोड़ें..." : "Add new task..."}
              disabled={adding}
              className="flex-1 px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-50"
            />
            <button
              onClick={handleAdd}
              disabled={adding || !newTask.trim()}
              className="flex items-center gap-1 px-3 py-2 rounded-lg bg-indigo-500 text-white text-sm font-medium hover:bg-indigo-600 transition-colors disabled:opacity-50"
            >
              {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setShowRecipePicker(!showRecipePicker)}
              className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                showRecipePicker
                  ? "bg-orange-500 text-white"
                  : "bg-orange-50 text-orange-600 hover:bg-orange-100"
              }`}
              title={language === "Hindi" ? "रेसिपी से जोड़ें" : "Add from recipe"}
            >
              <ChefHat className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Recipe Picker (collapsible) */}
        {showRecipePicker && (
          <div className="px-6 py-2 border-b border-gray-100 bg-orange-50/50 max-h-40 overflow-y-auto">
            <p className="text-[10px] text-orange-600 font-medium mb-1.5">
              {language === "Hindi" ? "रेसिपी चुनें:" : "Pick a recipe to add as recurring task:"}
            </p>
            {loadingRecipes ? (
              <Loader2 className="w-4 h-4 text-orange-400 animate-spin mx-auto my-2" />
            ) : recipes.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-2">No recipes found</p>
            ) : (
              <div className="space-y-1">
                {recipes.map((r) => {
                  const title = r.en?.title || "Untitled";
                  const cuisine = r.en?.cuisine || "";
                  const flag = getCuisineFlag(cuisine);
                  const alreadyAdded = templates.some((t) => t.recipeId === r.id && (t.recurrence || "daily") === activeTab);
                  return (
                    <button
                      key={r.id}
                      onClick={() => !alreadyAdded && handleAddRecipe(r)}
                      disabled={alreadyAdded}
                      className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-left transition-all ${
                        alreadyAdded
                          ? "bg-green-50 text-green-600 cursor-default"
                          : "bg-white hover:bg-orange-100 text-gray-700"
                      }`}
                    >
                      <span>{flag}</span>
                      <span className="flex-1 truncate">{title}</span>
                      {alreadyAdded && <span className="text-[10px]">✓ Added</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Task list */}
        <div className="flex-1 overflow-y-auto px-6 py-3">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-gray-400 py-12 text-sm">
              {language === "Hindi" ? "कोई कार्य नहीं" : `No ${activeTab} tasks configured`}
            </p>
          ) : (
            <div className="space-y-1">
              {filtered.map((tmpl) => (
                <div
                  key={tmpl.id}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                    tmpl.enabled
                      ? "bg-white border-gray-100 hover:border-gray-200"
                      : "bg-gray-50 border-gray-50 opacity-60"
                  }`}
                >
                  {/* Toggle */}
                  <button
                    onClick={() => handleToggle(tmpl)}
                    className="flex-shrink-0"
                    title={tmpl.enabled ? "Disable" : "Enable"}
                  >
                    {tmpl.enabled ? (
                      <ToggleRight className="w-6 h-6 text-indigo-500" />
                    ) : (
                      <ToggleLeft className="w-6 h-6 text-gray-300" />
                    )}
                  </button>

                  {/* Recipe icon */}
                  {tmpl.isRecipe && (
                    <ChefHat className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />
                  )}

                  {/* Editable title */}
                  <input
                    type="text"
                    defaultValue={tmpl.title}
                    onBlur={(e) => handleRename(tmpl, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                    }}
                    className={`flex-1 bg-transparent text-sm border-none focus:outline-none focus:ring-0 min-w-0 ${
                      tmpl.enabled ? "text-gray-700" : "text-gray-400 line-through"
                    }`}
                  />

                  {/* Day badge for weekly/biweekly */}
                  {(tmpl.recurrence === "weekly" || tmpl.recurrence === "biweekly") && tmpl.dayOfWeek !== undefined && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 font-medium flex-shrink-0">
                      {dayNames[tmpl.dayOfWeek]}
                    </span>
                  )}
                  {/* Day badge for monthly */}
                  {tmpl.recurrence === "monthly" && tmpl.dayOfMonth !== undefined && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-50 text-purple-600 font-medium flex-shrink-0">
                      {tmpl.dayOfMonth}{tmpl.dayOfMonth === 1 ? "st" : tmpl.dayOfMonth === 2 ? "nd" : tmpl.dayOfMonth === 3 ? "rd" : "th"}
                    </span>
                  )}

                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(tmpl.id)}
                    className="flex-shrink-0 p-1 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <p className="text-[10px] text-gray-400 text-center">
            {language === "Hindi"
              ? "बदलाव कल से लागू होंगे। कार्य को सक्षम/अक्षम करने के लिए टॉगल करें। नाम बदलने के लिए क्लिक करें।"
              : "Changes take effect from next occurrence. Toggle to enable/disable. Click name to rename."}
          </p>
        </div>
      </div>
    </div>
  );
}
