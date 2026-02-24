"use client";

import { useState } from "react";
import {
  Edit3,
  Trash2,
  Printer,
  PlayCircle,
  Clock,
  Users,
  ChefHat,
  MoreVertical,
  Youtube,
  ShoppingCart,
  ChevronDown,
  ChevronUp,
  Check,
  AlarmClock,
  X,
} from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import { Recipe, deleteRecipe } from "@/lib/recipes";
import { addGroceryItem } from "@/lib/grocery";
import { addTask, getTodayString } from "@/lib/tasks";
import { getCuisineFlag } from "@/lib/cuisine-flags";
import { playUrgentBeepSequence } from "@/lib/beep";
import VideoPlayer from "./VideoPlayer";
import toast from "react-hot-toast";

interface RecipeCardProps {
  recipe: Recipe;
  onEdit: (recipe: Recipe) => void;
  onPrint: (recipe: Recipe) => void;
  onFollowAlong: (recipe: Recipe) => void;
  onDeleted: () => void;
  view: "grid" | "list";
}

export default function RecipeCard({
  recipe,
  onEdit,
  onPrint,
  onFollowAlong,
  onDeleted,
  view,
}: RecipeCardProps) {
  const { t, language } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [videoId, setVideoId] = useState<string | null>(null);
  const [showIngredients, setShowIngredients] = useState(false);
  const [addedIngredients, setAddedIngredients] = useState<Set<number>>(new Set());
  const [crossedOut, setCrossedOut] = useState<Set<number>>(new Set());
  const [cookNowOpen, setCookNowOpen] = useState(false);
  const [cookRemark, setCookRemark] = useState("");
  const [cookReadyTime, setCookReadyTime] = useState("");
  const [addingCookTask, setAddingCookTask] = useState(false);

  const cuisineFlag = getCuisineFlag(recipe.en?.cuisine || "");

  const toggleCrossedOut = (index: number) => {
    setCrossedOut((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const handleAddToGrocery = async (ingredient: { item: string; quantity: string; unit: string }, index: number) => {
    try {
      await addGroceryItem({
        name: `${ingredient.quantity} ${ingredient.unit} ${ingredient.item}`.trim(),
        quantity: ingredient.quantity,
        emoji: "",
        purchased: false,
        source: "recipe",
      });
      setAddedIngredients((prev) => new Set(prev).add(index));
      toast.success(`Added ${ingredient.item} to grocery list`);
    } catch (err: any) {
      toast.error(err.message || "Failed to add to grocery");
    }
  };

  // Pick the right language content
  const content = language === "Hindi" && recipe.hi ? recipe.hi : recipe.en;

  const handleAddAllToGrocery = async () => {
    try {
      for (let i = 0; i < content.ingredients.length; i++) {
        const ing = content.ingredients[i];
        await addGroceryItem({
          name: `${ing.quantity} ${ing.unit} ${ing.item}`.trim(),
          quantity: ing.quantity,
          emoji: "",
          purchased: false,
          source: "recipe",
        });
      }
      const allIdxs = new Set(content.ingredients.map((_: any, i: number) => i));
      setAddedIngredients(allIdxs);
      toast.success(`Added all ${content.ingredients.length} ingredients to grocery list`);
    } catch (err: any) {
      toast.error(err.message || "Failed to add ingredients");
    }
  };

  const handleCookNow = async () => {
    setAddingCookTask(true);
    try {
      const readyNote = cookReadyTime ? ` | Ready by ${cookReadyTime}` : "";
      const remarkNote = cookRemark ? ` | ${cookRemark}` : "";
      const taskTitle = `🍳 Cook: ${content.title}${readyNote}${remarkNote}`;
      await addTask(taskTitle, getTodayString(), true);
      playUrgentBeepSequence(3);
      toast.success(`🍳 "${content.title}" added as urgent task!`);
      setCookNowOpen(false);
      setCookRemark("");
      setCookReadyTime("");
    } catch (err: any) {
      toast.error(err.message || "Failed to add cooking task");
    } finally {
      setAddingCookTask(false);
    }
  };

  const hasEnVideo = !!recipe.videos?.en;
  const hasHiVideo = !!recipe.videos?.hi;

  const handleDelete = async () => {
    if (!confirm(t("confirmDelete"))) return;
    setDeleting(true);
    try {
      await deleteRecipe(recipe.id);
      toast.success("Deleted!");
      onDeleted();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  const imageUrl =
    recipe.images?.[0] ||
    `https://placehold.co/800x600/f97316/ffffff?text=${encodeURIComponent(content.title)}`;

  if (view === "list") {
    return (
      <>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all overflow-hidden">
        <div className="flex flex-col sm:flex-row">
          {/* Image */}
          <div className="sm:w-48 h-40 sm:h-auto flex-shrink-0">
            <img
              src={imageUrl}
              alt={content.title}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Content */}
          <div className="flex-1 p-4 sm:p-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-800">
                  <span className="mr-1.5 text-xl">{cuisineFlag}</span>
                  {content.title}
                </h3>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                  {content.description}
                </p>
              </div>
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-20 min-w-[140px]">
                    <button
                      onClick={() => { onEdit(recipe); setMenuOpen(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-orange-50"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> {t("editRecipe")}
                    </button>
                    <button
                      onClick={() => { onPrint(recipe); setMenuOpen(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-orange-50"
                    >
                      <Printer className="w-3.5 h-3.5" /> {t("printRecipe")}
                    </button>
                    <button
                      onClick={() => { onFollowAlong(recipe); setMenuOpen(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-orange-50"
                    >
                      <PlayCircle className="w-3.5 h-3.5" /> {t("followAlong")}
                    </button>
                    <hr className="my-1 border-gray-100" />
                    <button
                      onClick={() => { handleDelete(); setMenuOpen(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> {t("deleteRecipe")}
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> {content.prepTime} + {content.cookTime}
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" /> {content.servings}
              </span>
              <span className="flex items-center gap-1">
                <ChefHat className="w-3.5 h-3.5" /> {content.cuisine}
              </span>
            </div>

            {/* Ingredients expandable (list view) */}
            {content.ingredients?.length > 0 && (
              <div className="mt-3">
                <button
                  onClick={() => setShowIngredients(!showIngredients)}
                  className="flex items-center justify-between w-full px-3 py-2 rounded-lg bg-green-50 text-green-700 text-xs font-medium hover:bg-green-100 transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <ShoppingCart className="w-3.5 h-3.5" />
                    {content.ingredients.length} {language === "Hindi" ? "सामग्री" : "Ingredients"}
                    {crossedOut.size > 0 && (
                      <span className="text-[10px] text-green-500">({crossedOut.size} at home)</span>
                    )}
                  </span>
                  {showIngredients ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
                {showIngredients && (
                  <div className="mt-1.5 space-y-1">
                    {content.ingredients.map((ing: any, idx: number) => (
                      <div
                        key={idx}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs cursor-pointer transition-all ${
                          crossedOut.has(idx) ? "bg-gray-100" : "bg-gray-50 hover:bg-gray-100"
                        }`}
                        onClick={() => toggleCrossedOut(idx)}
                      >
                        <span className={`flex-1 transition-all ${
                          crossedOut.has(idx) ? "line-through text-gray-400" : "text-gray-700"
                        }`}>
                          <span className="font-medium">{ing.quantity} {ing.unit}</span> {ing.item}
                          {crossedOut.has(idx) && <span className="ml-1 text-[10px] text-green-500">✅ at home</span>}
                        </span>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleAddToGrocery(ing, idx); }}
                          disabled={addedIngredients.has(idx) || crossedOut.has(idx)}
                          className={`flex-shrink-0 p-1.5 rounded-md transition-colors ${
                            addedIngredients.has(idx)
                              ? "text-green-500 bg-green-50"
                              : crossedOut.has(idx)
                              ? "text-gray-300 cursor-not-allowed"
                              : "text-orange-400 hover:text-orange-600 hover:bg-orange-50"
                          }`}
                          title={addedIngredients.has(idx) ? "Added" : crossedOut.has(idx) ? "Already at home" : (language === "Hindi" ? "किराना सूची में जोड़ें" : "Add to grocery list")}
                        >
                          {addedIngredients.has(idx) ? <Check className="w-3.5 h-3.5" /> : <ShoppingCart className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={handleAddAllToGrocery}
                      className="flex items-center justify-center gap-1.5 w-full px-3 py-1.5 rounded-lg bg-green-500 text-white text-xs font-medium hover:bg-green-600 transition-colors mt-1"
                    >
                      <ShoppingCart className="w-3 h-3" />
                      {language === "Hindi" ? "सभी किराना सूची में जोड़ें" : "Add All to Grocery List"}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Quick action buttons */}
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <button
                onClick={() => setCookNowOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-medium hover:bg-red-100 transition-colors"
                title="Add as urgent cooking task"
              >
                <AlarmClock className="w-3.5 h-3.5" /> {language === "Hindi" ? "अभी पकाएं" : "Cook Now"}
              </button>
              <button
                onClick={() => onFollowAlong(recipe)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-50 text-orange-600 text-xs font-medium hover:bg-orange-100 transition-colors"
              >
                <PlayCircle className="w-3.5 h-3.5" /> {t("followAlong")}
              </button>
              <button
                onClick={() => onPrint(recipe)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 text-gray-600 text-xs font-medium hover:bg-gray-100 transition-colors"
              >
                <Printer className="w-3.5 h-3.5" /> {t("printRecipe")}
              </button>
              {hasEnVideo && (
                <button
                  onClick={() => setVideoId(recipe.videos!.en)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-medium hover:bg-red-100 transition-colors"
                >
                  <Youtube className="w-3.5 h-3.5" /> EN
                </button>
              )}
              {hasHiVideo && (
                <button
                  onClick={() => setVideoId(recipe.videos!.hi)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-medium hover:bg-red-100 transition-colors"
                >
                  <Youtube className="w-3.5 h-3.5" /> HI
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Video Player Popup (list view) */}
      <VideoPlayer
        videoId={videoId || ""}
        title={content.title}
        open={!!videoId}
        onClose={() => setVideoId(null)}
      />

      {/* Cook Now Modal (list view) */}
      {cookNowOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setCookNowOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <AlarmClock className="w-5 h-5 text-red-500" />
                {language === "Hindi" ? "अभी पकाएं" : "Cook Now"}
              </h3>
              <button onClick={() => setCookNowOpen(false)} className="p-1 rounded-lg hover:bg-gray-100">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-3">
              {cuisineFlag} <b>{content.title}</b> — {language === "Hindi" ? "तत्काल कार्य के रूप में जोड़ें" : "Add as urgent task"}
            </p>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">
                  {language === "Hindi" ? "कब तक तैयार हो?" : "Ready by when?"}
                </label>
                <input
                  type="time"
                  value={cookReadyTime}
                  onChange={(e) => setCookReadyTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">
                  {language === "Hindi" ? "टिप्पणी (वैकल्पिक)" : "Remark (optional)"}
                </label>
                <input
                  type="text"
                  value={cookRemark}
                  onChange={(e) => setCookRemark(e.target.value)}
                  placeholder={language === "Hindi" ? "जैसे: मेहमानों के लिए" : "e.g. For guests, half portion..."}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                />
              </div>
              <button
                onClick={handleCookNow}
                disabled={addingCookTask}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 text-white text-sm font-semibold hover:from-red-600 hover:to-orange-600 transition-all disabled:opacity-50"
              >
                {addingCookTask ? "Adding..." : "🚨 Add as Urgent Task"}
              </button>
            </div>
          </div>
        </div>
      )}
      </>
    );
  }

  // Grid view
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-all overflow-hidden group">
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={imageUrl}
          alt={content.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute bottom-3 left-3 right-3">
          <h3 className="text-white font-bold text-lg leading-tight drop-shadow-lg">
            <span className="mr-1">{cuisineFlag}</span>{content.title}
          </h3>
          <div className="flex items-center gap-3 mt-1 text-white/80 text-xs">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" /> {content.cookTime}
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" /> {content.servings}
            </span>
          </div>
        </div>

        {/* Menu button */}
        <div className="absolute top-2 right-2">
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
              className="p-1.5 rounded-full bg-black/30 text-white hover:bg-black/50 backdrop-blur-sm"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-20 min-w-[140px]">
                <button
                  onClick={() => { onEdit(recipe); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-orange-50"
                >
                  <Edit3 className="w-3.5 h-3.5" /> {t("editRecipe")}
                </button>
                <button
                  onClick={() => { onPrint(recipe); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-orange-50"
                >
                  <Printer className="w-3.5 h-3.5" /> {t("printRecipe")}
                </button>
                <button
                  onClick={() => { onFollowAlong(recipe); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-orange-50"
                >
                  <PlayCircle className="w-3.5 h-3.5" /> {t("followAlong")}
                </button>
                <hr className="my-1 border-gray-100" />
                <button
                  onClick={() => { handleDelete(); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-3.5 h-3.5" /> {t("deleteRecipe")}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <p className="text-sm text-gray-500 line-clamp-2 mb-3">
          {content.description}
        </p>

        <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
          <span className="px-2 py-0.5 bg-orange-50 text-orange-600 rounded-full font-medium">
            {content.cuisine}
          </span>
          <span>{content.prepTime} prep</span>
        </div>

        {/* Video buttons */}
        {(hasEnVideo || hasHiVideo) && (
          <div className="flex items-center gap-2 mb-3">
            {hasEnVideo && (
              <button
                onClick={() => setVideoId(recipe.videos!.en)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-medium hover:bg-red-100 transition-colors"
              >
                <Youtube className="w-3.5 h-3.5" /> EN Video
              </button>
            )}
            {hasHiVideo && (
              <button
                onClick={() => setVideoId(recipe.videos!.hi)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-medium hover:bg-red-100 transition-colors"
              >
                <Youtube className="w-3.5 h-3.5" /> HI Video
              </button>
            )}
          </div>
        )}

        {/* Ingredients expandable */}
        {content.ingredients?.length > 0 && (
          <div className="mb-3">
            <button
              onClick={() => setShowIngredients(!showIngredients)}
              className="flex items-center justify-between w-full px-3 py-2 rounded-lg bg-green-50 text-green-700 text-xs font-medium hover:bg-green-100 transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <ShoppingCart className="w-3.5 h-3.5" />
                {content.ingredients.length} {language === "Hindi" ? "सामग्री" : "Ingredients"}
                {crossedOut.size > 0 && (
                  <span className="text-[10px] text-green-500">({crossedOut.size} at home)</span>
                )}
              </span>
              {showIngredients ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            {showIngredients && (
              <div className="mt-1.5 space-y-1">
                {content.ingredients.map((ing: any, idx: number) => (
                  <div
                    key={idx}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs cursor-pointer transition-all ${
                      crossedOut.has(idx) ? "bg-gray-100" : "bg-gray-50 hover:bg-gray-100"
                    }`}
                    onClick={() => toggleCrossedOut(idx)}
                  >
                    <span className={`flex-1 transition-all ${
                      crossedOut.has(idx) ? "line-through text-gray-400" : "text-gray-700"
                    }`}>
                      <span className="font-medium">{ing.quantity} {ing.unit}</span> {ing.item}
                      {crossedOut.has(idx) && <span className="ml-1 text-[10px] text-green-500">✅ at home</span>}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleAddToGrocery(ing, idx); }}
                      disabled={addedIngredients.has(idx) || crossedOut.has(idx)}
                      className={`flex-shrink-0 p-1.5 rounded-md transition-colors ${
                        addedIngredients.has(idx)
                          ? "text-green-500 bg-green-50"
                          : crossedOut.has(idx)
                          ? "text-gray-300 cursor-not-allowed"
                          : "text-orange-400 hover:text-orange-600 hover:bg-orange-50"
                      }`}
                      title={addedIngredients.has(idx) ? "Added" : crossedOut.has(idx) ? "Already at home" : (language === "Hindi" ? "किराना सूची में जोड़ें" : "Add to grocery list")}
                    >
                      {addedIngredients.has(idx) ? <Check className="w-3.5 h-3.5" /> : <ShoppingCart className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                ))}
                <button
                  onClick={handleAddAllToGrocery}
                  className="flex items-center justify-center gap-1.5 w-full px-3 py-1.5 rounded-lg bg-green-500 text-white text-xs font-medium hover:bg-green-600 transition-colors mt-1"
                >
                  <ShoppingCart className="w-3 h-3" />
                  {language === "Hindi" ? "सभी किराना सूची में जोड़ें" : "Add All to Grocery List"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCookNowOpen(true)}
            className="p-2 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
            title={language === "Hindi" ? "अभी पकाएं" : "Cook Now"}
          >
            <AlarmClock className="w-4 h-4" />
          </button>
          <button
            onClick={() => onFollowAlong(recipe)}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-medium hover:from-orange-600 hover:to-red-600 transition-all shadow-sm"
          >
            <PlayCircle className="w-3.5 h-3.5" /> {t("followAlong")}
          </button>
          <button
            onClick={() => onPrint(recipe)}
            className="p-2 rounded-xl bg-gray-50 text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <Printer className="w-4 h-4" />
          </button>
          <button
            onClick={() => onEdit(recipe)}
            className="p-2 rounded-xl bg-gray-50 text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="p-2 rounded-xl bg-gray-50 text-red-400 hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Video Player Popup */}
      <VideoPlayer
        videoId={videoId || ""}
        title={content.title}
        open={!!videoId}
        onClose={() => setVideoId(null)}
      />

      {/* Cook Now Modal (grid view) */}
      {cookNowOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setCookNowOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <AlarmClock className="w-5 h-5 text-red-500" />
                {language === "Hindi" ? "अभी पकाएं" : "Cook Now"}
              </h3>
              <button onClick={() => setCookNowOpen(false)} className="p-1 rounded-lg hover:bg-gray-100">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-3">
              {cuisineFlag} <b>{content.title}</b> — {language === "Hindi" ? "तत्काल कार्य के रूप में जोड़ें" : "Add as urgent task"}
            </p>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">
                  {language === "Hindi" ? "कब तक तैयार हो?" : "Ready by when?"}
                </label>
                <input
                  type="time"
                  value={cookReadyTime}
                  onChange={(e) => setCookReadyTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">
                  {language === "Hindi" ? "टिप्पणी (वैकल्पिक)" : "Remark (optional)"}
                </label>
                <input
                  type="text"
                  value={cookRemark}
                  onChange={(e) => setCookRemark(e.target.value)}
                  placeholder={language === "Hindi" ? "जैसे: मेहमानों के लिए" : "e.g. For guests, half portion..."}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                />
              </div>
              <button
                onClick={handleCookNow}
                disabled={addingCookTask}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 text-white text-sm font-semibold hover:from-red-600 hover:to-orange-600 transition-all disabled:opacity-50"
              >
                {addingCookTask ? "Adding..." : "🚨 Add as Urgent Task"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
