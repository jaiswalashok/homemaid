"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Loader2, Plus, Copy, CheckCircle, Search, Filter } from "lucide-react";
import { getMasterTaskTemplates, getDailyTaskTemplates, copyMasterTemplateToUser, DailyTaskTemplate, requireAuth } from "@/lib/tasks";
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import toast from "react-hot-toast";

interface MasterTemplate {
  id: string;
  title: string;
  recurrence: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  category: string;
  dayOfWeek?: number;
  dayOfMonth?: number;
  order: number;
  enabled: boolean;
  description?: string;
}

export default function TemplatesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [masterTemplates, setMasterTemplates] = useState<DailyTaskTemplate[]>([]);
  const [userTemplates, setUserTemplates] = useState<DailyTaskTemplate[]>([]);
  const [copiedTemplateTitles, setCopiedTemplateTitles] = useState<Set<string>>(new Set());
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedRecurrence, setSelectedRecurrence] = useState("all");
  const [copyingTemplate, setCopyingTemplate] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      loadTemplates();
    }
  }, [user]);

  const loadTemplates = async () => {
    try {
      setLoadingTemplates(true);
      
      // Hardcoded master templates for immediate availability
      const hardcodedMasterTemplates: DailyTaskTemplate[] = [
        // ===== DAILY TASKS (Morning Routine) =====
        { id: "daily-1", title: "Make the beds", recurrence: "daily", category: "Morning Routine", order: 1, enabled: true },
        { id: "daily-2", title: "Open windows for fresh air", recurrence: "daily", category: "Morning Routine", order: 2, enabled: true },
        { id: "daily-3", title: "Prepare breakfast", recurrence: "daily", category: "Morning Routine", order: 3, enabled: true },
        { id: "daily-4", title: "Wash breakfast dishes", recurrence: "daily", category: "Morning Routine", order: 4, enabled: true },
        { id: "daily-5", title: "Wipe kitchen counters and stove", recurrence: "daily", category: "Morning Routine", order: 5, enabled: true },

        // ===== DAILY TASKS (Laundry) =====
        { id: "daily-6", title: "Sort and start laundry", recurrence: "daily", category: "Laundry", order: 6, enabled: true },
        { id: "daily-7", title: "Hang or dry clothes", recurrence: "daily", category: "Laundry", order: 7, enabled: true },
        { id: "daily-8", title: "Fold and put away dry clothes", recurrence: "daily", category: "Laundry", order: 8, enabled: true },
        { id: "daily-9", title: "Iron clothes for tomorrow", recurrence: "daily", category: "Laundry", order: 9, enabled: true },

        // ===== DAILY TASKS (Cleaning) =====
        { id: "daily-10", title: "Sweep all floors", recurrence: "daily", category: "Cleaning", order: 10, enabled: true },
        { id: "daily-11", title: "Mop the floors", recurrence: "daily", category: "Cleaning", order: 11, enabled: true },
        { id: "daily-12", title: "Vacuum carpets and rugs", recurrence: "daily", category: "Cleaning", order: 12, enabled: true },
        { id: "daily-13", title: "Dust furniture and shelves", recurrence: "daily", category: "Cleaning", order: 13, enabled: true },
        { id: "daily-14", title: "Clean bathroom sink and toilet", recurrence: "daily", category: "Cleaning", order: 14, enabled: true },
        { id: "daily-15", title: "Wipe bathroom mirror", recurrence: "daily", category: "Cleaning", order: 15, enabled: true },
        { id: "daily-16", title: "Clean kitchen sink", recurrence: "daily", category: "Cleaning", order: 16, enabled: true },
        { id: "daily-17", title: "Wipe dining table", recurrence: "daily", category: "Cleaning", order: 17, enabled: true },

        // ===== DAILY TASKS (Kitchen & Meals) =====
        { id: "daily-18", title: "Prepare lunch", recurrence: "daily", category: "Kitchen & Meals", order: 18, enabled: true },
        { id: "daily-19", title: "Wash lunch dishes", recurrence: "daily", category: "Kitchen & Meals", order: 19, enabled: true },
        { id: "daily-20", title: "Prepare snacks for kids", recurrence: "daily", category: "Kitchen & Meals", order: 20, enabled: true },
        { id: "daily-21", title: "Plan and prepare dinner", recurrence: "daily", category: "Kitchen & Meals", order: 21, enabled: true },
        { id: "daily-22", title: "Wash dinner dishes", recurrence: "daily", category: "Kitchen & Meals", order: 22, enabled: true },
        { id: "daily-23", title: "Clean stove and kitchen after dinner", recurrence: "daily", category: "Kitchen & Meals", order: 23, enabled: true },
        { id: "daily-24", title: "Prepare lunch boxes for tomorrow", recurrence: "daily", category: "Kitchen & Meals", order: 24, enabled: true },

        // ===== DAILY TASKS (Organizing) =====
        { id: "daily-25", title: "Organize shoes at entryway", recurrence: "daily", category: "Organizing", order: 25, enabled: true },
        { id: "daily-26", title: "Tidy up living room", recurrence: "daily", category: "Organizing", order: 26, enabled: true },
        { id: "daily-27", title: "Tidy up children's room", recurrence: "daily", category: "Organizing", order: 27, enabled: true },
        { id: "daily-28", title: "Put toys back in place", recurrence: "daily", category: "Organizing", order: 28, enabled: true },
        { id: "daily-29", title: "Sort and handle mail/papers", recurrence: "daily", category: "Organizing", order: 29, enabled: true },

        // ===== DAILY TASKS (Maintenance) =====
        { id: "daily-30", title: "Take out the trash", recurrence: "daily", category: "Maintenance", order: 30, enabled: true },
        { id: "daily-31", title: "Replace trash bags", recurrence: "daily", category: "Maintenance", order: 31, enabled: true },
        { id: "daily-32", title: "Water indoor plants", recurrence: "daily", category: "Maintenance", order: 32, enabled: true },
        { id: "daily-33", title: "Check and restock groceries", recurrence: "daily", category: "Maintenance", order: 33, enabled: true },
        { id: "daily-34", title: "Wipe light switches and door handles", recurrence: "daily", category: "Maintenance", order: 34, enabled: true },

        // ===== DAILY TASKS (Evening Routine) =====
        { id: "daily-35", title: "Set out clothes for tomorrow", recurrence: "daily", category: "Evening Routine", order: 35, enabled: true },
        { id: "daily-36", title: "Quick tidy-up before bed", recurrence: "daily", category: "Evening Routine", order: 36, enabled: true },
        { id: "daily-37", title: "Lock all doors and windows", recurrence: "daily", category: "Evening Routine", order: 37, enabled: true },
        { id: "daily-38", title: "Turn off all lights and appliances", recurrence: "daily", category: "Evening Routine", order: 38, enabled: true },

        // ===== WEEKLY TASKS =====
        { id: "weekly-1", title: "Deep clean refrigerator", recurrence: "weekly", category: "Deep Cleaning", dayOfWeek: 1, order: 39, enabled: true, description: "Monday" },
        { id: "weekly-2", title: "Change bed sheets", recurrence: "weekly", category: "Laundry", dayOfWeek: 1, order: 40, enabled: true, description: "Monday" },
        { id: "weekly-3", title: "Clean bathroom thoroughly", recurrence: "weekly", category: "Deep Cleaning", dayOfWeek: 2, order: 41, enabled: true, description: "Tuesday" },
        { id: "weekly-4", title: "Vacuum under furniture", recurrence: "weekly", category: "Deep Cleaning", dayOfWeek: 3, order: 42, enabled: true, description: "Wednesday" },
        { id: "weekly-5", title: "Clean windows and mirrors", recurrence: "weekly", category: "Deep Cleaning", dayOfWeek: 4, order: 43, enabled: true, description: "Thursday" },
        { id: "weekly-6", title: "Organize pantry and cabinets", recurrence: "weekly", category: "Organizing", dayOfWeek: 5, order: 44, enabled: true, description: "Friday" },
        { id: "weekly-7", title: "Meal prep for the week", recurrence: "weekly", category: "Kitchen & Meals", dayOfWeek: 0, order: 45, enabled: true, description: "Sunday" },
        { id: "weekly-8", title: "Clean and organize garage", recurrence: "weekly", category: "Organizing", dayOfWeek: 6, order: 46, enabled: true, description: "Saturday" },
        { id: "weekly-9", title: "Wash car", recurrence: "weekly", category: "Maintenance", dayOfWeek: 6, order: 47, enabled: true, description: "Saturday" },
        { id: "weekly-10", title: "Water outdoor plants and garden", recurrence: "weekly", category: "Maintenance", dayOfWeek: 0, order: 48, enabled: true, description: "Sunday" },

        // ===== BI-WEEKLY TASKS =====
        { id: "biweekly-1", title: "Deep clean oven", recurrence: "biweekly", category: "Deep Cleaning", dayOfWeek: 6, order: 49, enabled: true, description: "Every other Saturday" },
        { id: "biweekly-2", title: "Clean ceiling fans", recurrence: "biweekly", category: "Deep Cleaning", dayOfWeek: 6, order: 50, enabled: true, description: "Every other Saturday" },
        { id: "biweekly-3", title: "Organize closets", recurrence: "biweekly", category: "Organizing", dayOfWeek: 0, order: 51, enabled: true, description: "Every other Sunday" },
        { id: "biweekly-4", title: "Clean baseboards and trim", recurrence: "biweekly", category: "Deep Cleaning", dayOfWeek: 6, order: 52, enabled: true, description: "Every other Saturday" },

        // ===== MONTHLY TASKS =====
        { id: "monthly-1", title: "Deep clean oven and stove", recurrence: "monthly", category: "Deep Cleaning", dayOfMonth: 1, order: 53, enabled: true, description: "1st of month" },
        { id: "monthly-2", title: "Clean ceiling fans and light fixtures", recurrence: "monthly", category: "Deep Cleaning", dayOfMonth: 5, order: 54, enabled: true, description: "5th of month" },
        { id: "monthly-3", title: "Organize closets and wardrobes", recurrence: "monthly", category: "Organizing", dayOfMonth: 10, order: 55, enabled: true, description: "10th of month" },
        { id: "monthly-4", title: "Check and replace air filters", recurrence: "monthly", category: "Maintenance", dayOfMonth: 15, order: 56, enabled: true, description: "15th of month" },
        { id: "monthly-5", title: "Clean behind appliances", recurrence: "monthly", category: "Deep Cleaning", dayOfMonth: 20, order: 57, enabled: true, description: "20th of month" },
        { id: "monthly-6", title: "Review and pay monthly bills", recurrence: "monthly", category: "Administrative", dayOfMonth: 25, order: 58, enabled: true, description: "25th of month" },
        { id: "monthly-7", title: "Clean gutters", recurrence: "monthly", category: "Maintenance", dayOfMonth: 1, order: 59, enabled: true, description: "1st of month" },
        { id: "monthly-8", title: "Check smoke detectors and batteries", recurrence: "monthly", category: "Safety", dayOfMonth: 1, order: 60, enabled: true, description: "1st of month" },
        { id: "monthly-9", title: "Deep clean carpets", recurrence: "monthly", category: "Deep Cleaning", dayOfMonth: 15, order: 61, enabled: true, description: "15th of month" },
        { id: "monthly-10", title: "Organize digital files and photos", recurrence: "monthly", category: "Administrative", dayOfMonth: 28, order: 62, enabled: true, description: "28th of month" },
      ];
      
      // Get user templates
      const user = await getDailyTaskTemplates();
      
      setMasterTemplates(hardcodedMasterTemplates);
      setUserTemplates(user);
      setCopiedTemplateTitles(new Set(user.map(t => t.title)));
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error('Error loading templates');
    } finally {
      setLoadingTemplates(false);
    }
  };

  const copyTemplate = async (templateId: string, title: string) => {
    if (copiedTemplateTitles.has(title)) {
      toast.error('You already have this template');
      return;
    }

    setCopyingTemplate(templateId);
    try {
      // Find the template in our hardcoded list
      const template = masterTemplates.find(t => t.id === templateId);
      if (!template) {
        throw new Error('Template not found');
      }

      // Create user template directly without needing master templates in database
      const user = await requireAuth();
      const templateData: any = {
        title: template.title,
        order: template.order,
        enabled: template.enabled,
        userId: user.uid,
        recurrence: template.recurrence || "daily",
      };
      
      // Only add optional fields if they exist
      if (template.dayOfWeek !== undefined) templateData.dayOfWeek = template.dayOfWeek;
      if (template.dayOfMonth !== undefined) templateData.dayOfMonth = template.dayOfMonth;
      if (template.category) templateData.category = template.category;
      if (template.description) templateData.description = template.description;
      
      await addDoc(collection(db, 'dailyTaskTemplates'), templateData);
      
      setCopiedTemplateTitles(new Set([...copiedTemplateTitles, title]));
      toast.success('Template copied to your personal list!');
      
      // Reload user templates to get the full template object
      const userTemplates = await getDailyTaskTemplates();
      setUserTemplates(userTemplates);
    } catch (error) {
      console.error('Error copying template:', error);
      toast.error('Error copying template');
    } finally {
      setCopyingTemplate(null);
    }
  };

  const categories = Array.from(new Set(masterTemplates.map(t => t.category || 'Uncategorized')));
  
  const filteredTemplates = masterTemplates.filter(template => {
    const matchesSearch = template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (template.category?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || template.category === selectedCategory;
    const matchesRecurrence = selectedRecurrence === "all" || template.recurrence === selectedRecurrence;
    
    return matchesSearch && matchesCategory && matchesRecurrence;
  });

  const isTemplateCopied = (title: string) => copiedTemplateTitles.has(title);

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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Task Templates</h1>
          <p className="text-gray-600">
            Browse and copy master task templates to build your personal task list
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search templates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            
            <select
              value={selectedRecurrence}
              onChange={(e) => setSelectedRecurrence(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Frequencies</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="biweekly">Bi-weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900">Total Templates</h3>
            <p className="text-2xl font-bold text-blue-600">{masterTemplates.length}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-green-900">Your Templates</h3>
            <p className="text-2xl font-bold text-green-600">{userTemplates.length}</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="font-semibold text-purple-900">Daily</h3>
            <p className="text-2xl font-bold text-purple-600">
              {masterTemplates.filter(t => t.recurrence === 'daily').length}
            </p>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <h3 className="font-semibold text-orange-900">Weekly+</h3>
            <p className="text-2xl font-bold text-orange-600">
              {masterTemplates.filter(t => t.recurrence !== 'daily').length}
            </p>
          </div>
        </div>

        {/* Templates List */}
        {loadingTemplates ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTemplates.map((template) => {
              const isCopied = isTemplateCopied(template.title);
              const isCopying = copyingTemplate === template.id;
              
              return (
                <div
                  key={template.id}
                  className={`bg-white rounded-xl shadow-sm p-6 border-2 transition-all ${
                    isCopied ? 'border-green-500 bg-green-50' : 'border-transparent hover:border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{template.title}</h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          template.recurrence === 'daily' ? 'bg-blue-100 text-blue-700' :
                          template.recurrence === 'weekly' ? 'bg-green-100 text-green-700' :
                          template.recurrence === 'biweekly' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-purple-100 text-purple-700'
                        }`}>
                          {template.recurrence}
                        </span>
                        <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">
                          {template.category}
                        </span>
                      </div>
                      
                      {template.description && (
                        <p className="text-gray-600 mb-2">{template.description}</p>
                      )}
                      
                      <div className="text-sm text-gray-500">
                        Order: {template.order}
                        {template.dayOfWeek !== undefined && ` • Day: ${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][template.dayOfWeek]}`}
                        {template.dayOfMonth !== undefined && ` • Day: ${template.dayOfMonth}${template.dayOfMonth === 1 ? 'st' : template.dayOfMonth === 2 ? 'nd' : template.dayOfMonth === 3 ? 'rd' : 'th'}`}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      {isCopied ? (
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle className="w-5 h-5" />
                          <span className="text-sm font-medium">Copied</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => copyTemplate(template.id, template.title)}
                          disabled={isCopying}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white rounded-lg transition-colors flex items-center gap-2"
                        >
                          {isCopying ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                          {isCopying ? 'Copying...' : 'Copy'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            
            {filteredTemplates.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">No templates found matching your filters</p>
              </div>
            )}
          </div>
        )}
        
        {/* Action */}
        <div className="mt-8 text-center">
          <button
            onClick={() => router.push('/tasks')}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
          >
            Go to Tasks ({userTemplates.length} templates copied)
          </button>
        </div>
      </div>
    </div>
  );
}
