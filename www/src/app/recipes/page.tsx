"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Plus,
  Search,
  LayoutGrid,
  List,
  Loader2,
  UtensilsCrossed,
} from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import { ensureAuth } from "@/lib/firebase";
import { getAllRecipes, Recipe } from "@/lib/recipes";
import { getCuisineTag, getCuisineFlag, ALL_CUISINE_TAGS, DEFAULT_SELECTED_TAGS } from "@/lib/cuisine-flags";
import RecipeCard from "@/components/RecipeCard";
import AddRecipeDialog from "@/components/AddRecipeDialog";
import EditRecipeDialog from "@/components/EditRecipeDialog";
import PrintRecipe from "@/components/PrintRecipe";
import FollowAlongMode from "@/components/FollowAlongMode";
import NavBar from "@/components/NavBar";

export default function Home() {
  const { t, language } = useLanguage();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set(DEFAULT_SELECTED_TAGS));

  // Dialog states
  const [addOpen, setAddOpen] = useState(false);
  const [editRecipe, setEditRecipe] = useState<Recipe | null>(null);
  const [printRecipe, setPrintRecipe] = useState<Recipe | null>(null);
  const [followRecipe, setFollowRecipe] = useState<Recipe | null>(null);

  const loadRecipes = useCallback(async () => {
    try {
      const data = await getAllRecipes();
      setRecipes(data);
    } catch (err) {
      console.error("Failed to load recipes:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    async function init() {
      await ensureAuth();
      await loadRecipes();
    }
    init();
  }, [loadRecipes]);

  // Collect all unique cuisine tags from recipes
  const recipeCuisineTags = useMemo(() => {
    const tags = new Set<string>();
    recipes.forEach((r) => {
      const tag = getCuisineTag(r.en?.cuisine || "");
      if (tag) tags.add(tag);
    });
    // Merge with known tags, prioritize ones that exist in recipes
    return ALL_CUISINE_TAGS.filter((t) => tags.has(t) || DEFAULT_SELECTED_TAGS.includes(t));
  }, [recipes]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  };

  const filteredRecipes = recipes.filter((r) => {
    const q = searchQuery.toLowerCase();
    const en = r.en;
    const hi = r.hi;
    const matchesSearch = !q || (
      en?.title?.toLowerCase().includes(q) ||
      en?.cuisine?.toLowerCase().includes(q) ||
      en?.description?.toLowerCase().includes(q) ||
      hi?.title?.toLowerCase().includes(q) ||
      hi?.cuisine?.toLowerCase().includes(q) ||
      hi?.description?.toLowerCase().includes(q)
    );
    // Tag filter: if any tags selected, recipe must match one
    const recipeTag = getCuisineTag(en?.cuisine || "");
    const matchesTag = selectedTags.size === 0 || selectedTags.has(recipeTag);
    return matchesSearch && matchesTag;
  });

  return (
    <div className="min-h-screen bg-[#faf7f5]">
      <NavBar />

      {/* Toolbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("search")}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent shadow-sm"
            />
          </div>

          {/* View toggle */}
          <div className="flex items-center gap-1 bg-white rounded-xl border border-gray-200 p-1 shadow-sm">
            <button
              onClick={() => setView("grid")}
              className={`p-2 rounded-lg transition-colors ${
                view === "grid"
                  ? "bg-orange-500 text-white"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setView("list")}
              className={`p-2 rounded-lg transition-colors ${
                view === "list"
                  ? "bg-orange-500 text-white"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Add button */}
          <button
            onClick={() => setAddOpen(true)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm font-semibold hover:from-orange-600 hover:to-red-600 transition-all shadow-lg shadow-orange-500/25 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            {t("addRecipe")}
          </button>
        </div>
      </div>

      {/* Cuisine Tag Filter Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-2 mb-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setSelectedTags(new Set())}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              selectedTags.size === 0
                ? "bg-orange-500 text-white shadow-sm"
                : "bg-white text-gray-500 border border-gray-200 hover:border-orange-300"
            }`}
          >
            All
          </button>
          {recipeCuisineTags.map((tag) => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                selectedTags.has(tag)
                  ? "bg-orange-500 text-white shadow-sm"
                  : "bg-white text-gray-500 border border-gray-200 hover:border-orange-300"
              }`}
            >
              {getCuisineFlag(tag)} {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
            <p className="text-gray-400 mt-4 text-sm">Loading recipes...</p>
          </div>
        ) : filteredRecipes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-20 h-20 rounded-full bg-orange-50 flex items-center justify-center mb-4">
              <UtensilsCrossed className="w-10 h-10 text-orange-300" />
            </div>
            <p className="text-gray-500 text-center max-w-sm">
              {searchQuery ? "No recipes match your search." : t("noRecipes")}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setAddOpen(true)}
                className="mt-4 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm font-semibold hover:from-orange-600 hover:to-red-600 transition-all shadow-lg shadow-orange-500/25"
              >
                <Plus className="w-4 h-4" />
                {t("addRecipe")}
              </button>
            )}
          </div>
        ) : view === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredRecipes.map((recipe) => (
              <div key={recipe.id} className="animate-fade-in">
                <RecipeCard
                  recipe={recipe}
                  view="grid"
                  onEdit={setEditRecipe}
                  onPrint={setPrintRecipe}
                  onFollowAlong={setFollowRecipe}
                  onDeleted={loadRecipes}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filteredRecipes.map((recipe) => (
              <div key={recipe.id} className="animate-fade-in">
                <RecipeCard
                  recipe={recipe}
                  view="list"
                  onEdit={setEditRecipe}
                  onPrint={setPrintRecipe}
                  onFollowAlong={setFollowRecipe}
                  onDeleted={loadRecipes}
                />
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Dialogs */}
      <AddRecipeDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdded={loadRecipes}
      />

      <EditRecipeDialog
        recipe={editRecipe}
        open={!!editRecipe}
        onClose={() => setEditRecipe(null)}
        onUpdated={loadRecipes}
      />

      {printRecipe && (
        <PrintRecipe
          recipe={printRecipe}
          open={!!printRecipe}
          onClose={() => setPrintRecipe(null)}
        />
      )}

      {followRecipe && (
        <FollowAlongMode
          recipe={followRecipe}
          open={!!followRecipe}
          onClose={() => setFollowRecipe(null)}
        />
      )}
    </div>
  );
}
