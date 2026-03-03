"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Loader2, Plus, Trash2, CheckCircle } from "lucide-react";
import { collection, addDoc, doc, setDoc, deleteDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import toast from "react-hot-toast";

interface MasterTemplate {
  title: string;
  recurrence: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  category: string;
  dayOfWeek?: number;
  dayOfMonth?: number;
  order: number;
  enabled: boolean;
  description?: string;
}

const MASTER_TEMPLATES: MasterTemplate[] = [
  // ===== DAILY TASKS (Morning Routine) =====
  { title: "Make the beds", recurrence: "daily", category: "Morning Routine", order: 1, enabled: true },
  { title: "Open windows for fresh air", recurrence: "daily", category: "Morning Routine", order: 2, enabled: true },
  { title: "Prepare breakfast", recurrence: "daily", category: "Morning Routine", order: 3, enabled: true },
  { title: "Wash breakfast dishes", recurrence: "daily", category: "Morning Routine", order: 4, enabled: true },
  { title: "Wipe kitchen counters and stove", recurrence: "daily", category: "Morning Routine", order: 5, enabled: true },

  // ===== DAILY TASKS (Laundry) =====
  { title: "Sort and start laundry", recurrence: "daily", category: "Laundry", order: 6, enabled: true },
  { title: "Hang or dry clothes", recurrence: "daily", category: "Laundry", order: 7, enabled: true },
  { title: "Fold and put away dry clothes", recurrence: "daily", category: "Laundry", order: 8, enabled: true },
  { title: "Iron clothes for tomorrow", recurrence: "daily", category: "Laundry", order: 9, enabled: true },

  // ===== DAILY TASKS (Cleaning) =====
  { title: "Sweep all floors", recurrence: "daily", category: "Cleaning", order: 10, enabled: true },
  { title: "Mop the floors", recurrence: "daily", category: "Cleaning", order: 11, enabled: true },
  { title: "Vacuum carpets and rugs", recurrence: "daily", category: "Cleaning", order: 12, enabled: true },
  { title: "Dust furniture and shelves", recurrence: "daily", category: "Cleaning", order: 13, enabled: true },
  { title: "Clean bathroom sink and toilet", recurrence: "daily", category: "Cleaning", order: 14, enabled: true },
  { title: "Wipe bathroom mirror", recurrence: "daily", category: "Cleaning", order: 15, enabled: true },
  { title: "Clean kitchen sink", recurrence: "daily", category: "Cleaning", order: 16, enabled: true },
  { title: "Wipe dining table", recurrence: "daily", category: "Cleaning", order: 17, enabled: true },

  // ===== DAILY TASKS (Kitchen & Meals) =====
  { title: "Prepare lunch", recurrence: "daily", category: "Kitchen & Meals", order: 18, enabled: true },
  { title: "Wash lunch dishes", recurrence: "daily", category: "Kitchen & Meals", order: 19, enabled: true },
  { title: "Prepare snacks for kids", recurrence: "daily", category: "Kitchen & Meals", order: 20, enabled: true },
  { title: "Plan and prepare dinner", recurrence: "daily", category: "Kitchen & Meals", order: 21, enabled: true },
  { title: "Wash dinner dishes", recurrence: "daily", category: "Kitchen & Meals", order: 22, enabled: true },
  { title: "Clean stove and kitchen after dinner", recurrence: "daily", category: "Kitchen & Meals", order: 23, enabled: true },
  { title: "Prepare lunch boxes for tomorrow", recurrence: "daily", category: "Kitchen & Meals", order: 24, enabled: true },

  // ===== DAILY TASKS (Organizing) =====
  { title: "Organize shoes at entryway", recurrence: "daily", category: "Organizing", order: 25, enabled: true },
  { title: "Tidy up living room", recurrence: "daily", category: "Organizing", order: 26, enabled: true },
  { title: "Tidy up children's room", recurrence: "daily", category: "Organizing", order: 27, enabled: true },
  { title: "Put toys back in place", recurrence: "daily", category: "Organizing", order: 28, enabled: true },
  { title: "Sort and handle mail/papers", recurrence: "daily", category: "Organizing", order: 29, enabled: true },

  // ===== DAILY TASKS (Maintenance) =====
  { title: "Take out the trash", recurrence: "daily", category: "Maintenance", order: 30, enabled: true },
  { title: "Replace trash bags", recurrence: "daily", category: "Maintenance", order: 31, enabled: true },
  { title: "Water indoor plants", recurrence: "daily", category: "Maintenance", order: 32, enabled: true },
  { title: "Check and restock groceries", recurrence: "daily", category: "Maintenance", order: 33, enabled: true },
  { title: "Wipe light switches and door handles", recurrence: "daily", category: "Maintenance", order: 34, enabled: true },

  // ===== DAILY TASKS (Evening Routine) =====
  { title: "Set out clothes for tomorrow", recurrence: "daily", category: "Evening Routine", order: 35, enabled: true },
  { title: "Quick tidy-up before bed", recurrence: "daily", category: "Evening Routine", order: 36, enabled: true },
  { title: "Lock all doors and windows", recurrence: "daily", category: "Evening Routine", order: 37, enabled: true },
  { title: "Turn off all lights and appliances", recurrence: "daily", category: "Evening Routine", order: 38, enabled: true },

  // ===== WEEKLY TASKS =====
  { title: "Deep clean refrigerator", recurrence: "weekly", category: "Deep Cleaning", dayOfWeek: 1, order: 39, enabled: true, description: "Monday" },
  { title: "Change bed sheets", recurrence: "weekly", category: "Laundry", dayOfWeek: 1, order: 40, enabled: true, description: "Monday" },
  { title: "Clean bathroom thoroughly", recurrence: "weekly", category: "Deep Cleaning", dayOfWeek: 2, order: 41, enabled: true, description: "Tuesday" },
  { title: "Vacuum under furniture", recurrence: "weekly", category: "Deep Cleaning", dayOfWeek: 3, order: 42, enabled: true, description: "Wednesday" },
  { title: "Clean windows and mirrors", recurrence: "weekly", category: "Deep Cleaning", dayOfWeek: 4, order: 43, enabled: true, description: "Thursday" },
  { title: "Organize pantry and cabinets", recurrence: "weekly", category: "Organizing", dayOfWeek: 5, order: 44, enabled: true, description: "Friday" },
  { title: "Meal prep for the week", recurrence: "weekly", category: "Kitchen & Meals", dayOfWeek: 0, order: 45, enabled: true, description: "Sunday" },
  { title: "Clean and organize garage", recurrence: "weekly", category: "Organizing", dayOfWeek: 6, order: 46, enabled: true, description: "Saturday" },
  { title: "Wash car", recurrence: "weekly", category: "Maintenance", dayOfWeek: 6, order: 47, enabled: true, description: "Saturday" },
  { title: "Water outdoor plants and garden", recurrence: "weekly", category: "Maintenance", dayOfWeek: 0, order: 48, enabled: true, description: "Sunday" },

  // ===== BI-WEEKLY TASKS =====
  { title: "Deep clean oven", recurrence: "biweekly", category: "Deep Cleaning", dayOfWeek: 6, order: 49, enabled: true, description: "Every other Saturday" },
  { title: "Clean ceiling fans", recurrence: "biweekly", category: "Deep Cleaning", dayOfWeek: 6, order: 50, enabled: true, description: "Every other Saturday" },
  { title: "Organize closets", recurrence: "biweekly", category: "Organizing", dayOfWeek: 0, order: 51, enabled: true, description: "Every other Sunday" },
  { title: "Clean baseboards and trim", recurrence: "biweekly", category: "Deep Cleaning", dayOfWeek: 6, order: 52, enabled: true, description: "Every other Saturday" },

  // ===== MONTHLY TASKS =====
  { title: "Deep clean oven and stove", recurrence: "monthly", category: "Deep Cleaning", dayOfMonth: 1, order: 53, enabled: true, description: "1st of month" },
  { title: "Clean ceiling fans and light fixtures", recurrence: "monthly", category: "Deep Cleaning", dayOfMonth: 5, order: 54, enabled: true, description: "5th of month" },
  { title: "Organize closets and wardrobes", recurrence: "monthly", category: "Organizing", dayOfMonth: 10, order: 55, enabled: true, description: "10th of month" },
  { title: "Check and replace air filters", recurrence: "monthly", category: "Maintenance", dayOfMonth: 15, order: 56, enabled: true, description: "15th of month" },
  { title: "Clean behind appliances", recurrence: "monthly", category: "Deep Cleaning", dayOfMonth: 20, order: 57, enabled: true, description: "20th of month" },
  { title: "Review and pay monthly bills", recurrence: "monthly", category: "Administrative", dayOfMonth: 25, order: 58, enabled: true, description: "25th of month" },
  { title: "Clean gutters", recurrence: "monthly", category: "Maintenance", dayOfMonth: 1, order: 59, enabled: true, description: "1st of month" },
  { title: "Check smoke detectors and batteries", recurrence: "monthly", category: "Safety", dayOfMonth: 1, order: 60, enabled: true, description: "1st of month" },
  { title: "Deep clean carpets", recurrence: "monthly", category: "Deep Cleaning", dayOfMonth: 15, order: 61, enabled: true, description: "15th of month" },
  { title: "Organize digital files and photos", recurrence: "monthly", category: "Administrative", dayOfMonth: 28, order: 62, enabled: true, description: "28th of month" },
];

export default function AdminSeedTemplates() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isSeeding, setIsSeeding] = useState(false);
  const [existingCount, setExistingCount] = useState(0);
  const [seededCount, setSeededCount] = useState(0);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    checkExistingTemplates();
  }, []);

  const checkExistingTemplates = async () => {
    try {
      const q = query(collection(db, 'masterTaskTemplates'));
      const snapshot = await getDocs(q);
      setExistingCount(snapshot.size);
    } catch (error) {
      console.error('Error checking existing templates:', error);
    }
  };

  const seedTemplates = async () => {
    if (!user) return;
    
    setIsSeeding(true);
    let successCount = 0;
    
    try {
      for (const template of MASTER_TEMPLATES) {
        try {
          await addDoc(collection(db, 'masterTaskTemplates'), {
            ...template,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          successCount++;
        } catch (error) {
          console.error(`Error adding template "${template.title}":`, error);
        }
      }
      
      setSeededCount(successCount);
      toast.success(`Successfully seeded ${successCount} master templates!`);
      
      // Refresh the count
      await checkExistingTemplates();
      
    } catch (error) {
      console.error('Error seeding templates:', error);
      toast.error('Error seeding templates');
    } finally {
      setIsSeeding(false);
    }
  };

  const deleteAllTemplates = async () => {
    if (!user) return;
    
    try {
      const q = query(collection(db, 'masterTaskTemplates'));
      const snapshot = await getDocs(q);
      
      for (const doc of snapshot.docs) {
        await deleteDoc(doc.ref);
      }
      
      toast.success('Deleted all master templates');
      setExistingCount(0);
      setSeededCount(0);
    } catch (error) {
      console.error('Error deleting templates:', error);
      toast.error('Error deleting templates');
    }
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

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin: Seed Master Templates</h1>
          <p className="text-gray-600 mb-4">
            This page allows you to seed master task templates that all users can browse and copy from.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900">Daily Tasks</h3>
              <p className="text-blue-700">{MASTER_TEMPLATES.filter(t => t.recurrence === 'daily').length} templates</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-900">Weekly Tasks</h3>
              <p className="text-green-700">{MASTER_TEMPLATES.filter(t => t.recurrence === 'weekly').length} templates</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-semibold text-purple-900">Monthly Tasks</h3>
              <p className="text-purple-700">{MASTER_TEMPLATES.filter(t => t.recurrence === 'monthly').length} templates</p>
            </div>
          </div>

          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-sm text-gray-600">
                Current master templates: <span className="font-semibold">{existingCount}</span>
              </p>
              {seededCount > 0 && (
                <p className="text-sm text-green-600">
                  Just seeded: <span className="font-semibold">{seededCount}</span> templates
                </p>
              )}
            </div>
            
            <div className="flex gap-2">
              {existingCount > 0 && (
                <button
                  onClick={deleteAllTemplates}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete All
                </button>
              )}
              
              <button
                onClick={seedTemplates}
                disabled={isSeeding}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                {isSeeding ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                {isSeeding ? 'Seeding...' : 'Seed Templates'}
              </button>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold text-gray-900 mb-3">Template Preview</h3>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {MASTER_TEMPLATES.slice(0, 10).map((template, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium text-gray-900">{template.title}</p>
                    <p className="text-sm text-gray-600">{template.category} • {template.recurrence}</p>
                  </div>
                  <span className="text-xs px-2 py-1 bg-gray-200 rounded">
                    Order: {template.order}
                  </span>
                </div>
              ))}
              {MASTER_TEMPLATES.length > 10 && (
                <p className="text-sm text-gray-500 text-center py-2">
                  ... and {MASTER_TEMPLATES.length - 10} more templates
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-900 mb-2">⚠️ Important</h3>
          <p className="text-yellow-800 text-sm">
            After seeding the templates, remember to delete this admin page for security.
            You can delete the entire /admin/seed-templates/ directory.
          </p>
        </div>
      </div>
    </div>
  );
}
