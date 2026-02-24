"use client";

import { useState, useEffect, useRef } from "react";
import { X, Loader2, Save, Camera, ImageIcon } from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import { updateRecipe, Recipe } from "@/lib/recipes";
import { uploadImageToStorage } from "@/lib/storage";
import toast from "react-hot-toast";

interface EditRecipeDialogProps {
  recipe: Recipe | null;
  open: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

export default function EditRecipeDialog({
  recipe,
  open,
  onClose,
  onUpdated,
}: EditRecipeDialogProps) {
  const { t, language } = useLanguage();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [prepTime, setPrepTime] = useState("");
  const [cookTime, setCookTime] = useState("");
  const [servings, setServings] = useState(4);
  const [ingredientsText, setIngredientsText] = useState("");
  const [stepsText, setStepsText] = useState("");
  const [loading, setLoading] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (recipe) {
      const content = language === "Hindi" && recipe.hi ? recipe.hi : recipe.en;
      setTitle(content.title);
      setDescription(content.description);
      setCuisine(content.cuisine);
      setPrepTime(content.prepTime);
      setCookTime(content.cookTime);
      setServings(content.servings);
      setIngredientsText(
        content.ingredients
          .map((i) => `${i.quantity} ${i.unit} ${i.item}`)
          .join("\n")
      );
      setStepsText(
        content.steps.map((s) => `${s.stepNumber}. ${s.instruction}`).join("\n")
      );
      setPhotoPreview(recipe.images?.[0] || "");
      setPhotoFile(null);
    }
  }, [recipe, language]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!recipe) return;
    setLoading(true);
    try {
      const ingredients = ingredientsText
        .split("\n")
        .filter((l) => l.trim())
        .map((line) => {
          const parts = line.trim().split(/\s+/);
          return {
            quantity: parts[0] || "",
            unit: parts[1] || "",
            item: parts.slice(2).join(" ") || line.trim(),
          };
        });

      const steps = stepsText
        .split("\n")
        .filter((l) => l.trim())
        .map((line, idx) => ({
          stepNumber: idx + 1,
          instruction: line.replace(/^\d+\.\s*/, "").trim(),
        }));

      const langKey = language === "Hindi" ? "hi" : "en";
      const updatedContent = {
        title,
        description,
        cuisine,
        prepTime,
        cookTime,
        servings,
        ingredients,
        steps,
      };

      // Upload new photo if selected
      let updateData: any = { [langKey]: updatedContent };
      if (photoFile) {
        const arrayBuffer = await photoFile.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        const ts = Date.now();
        const ext = photoFile.name.split(".").pop() || "jpg";
        const url = await uploadImageToStorage(
          bytes,
          `recipes/${ts}_${title.replace(/\s+/g, "_")}.${ext}`,
          photoFile.type
        );
        updateData.images = [url];
      }

      await updateRecipe(recipe.id, updateData);

      toast.success("Recipe updated!");
      onUpdated();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to update");
    } finally {
      setLoading(false);
    }
  };

  if (!open || !recipe) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-orange-500 to-red-500 sticky top-0 z-10">
          <h2 className="text-lg font-bold text-white">{t("editRecipe")}</h2>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cuisine
              </label>
              <input
                value={cuisine}
                onChange={(e) => setCuisine(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("servings")}
              </label>
              <input
                type="number"
                value={servings}
                onChange={(e) => setServings(Number(e.target.value))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("prepTime")}
              </label>
              <input
                value={prepTime}
                onChange={(e) => setPrepTime(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("cookTime")}
              </label>
              <input
                value={cookTime}
                onChange={(e) => setCookTime(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("ingredients")} (one per line)
            </label>
            <textarea
              value={ingredientsText}
              onChange={(e) => setIngredientsText(e.target.value)}
              rows={5}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50 font-mono"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("steps")} (one per line)
            </label>
            <textarea
              value={stepsText}
              onChange={(e) => setStepsText(e.target.value)}
              rows={6}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50 font-mono"
            />
          </div>

          {/* Photo Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Recipe Photo
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
            />
            <div className="flex items-start gap-4">
              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt="Recipe"
                  className="w-32 h-24 object-cover rounded-xl border border-gray-200"
                />
              ) : (
                <div className="w-32 h-24 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center bg-gray-50">
                  <ImageIcon className="w-8 h-8 text-gray-300" />
                </div>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                <Camera className="w-4 h-4" />
                {photoPreview ? "Change Photo" : "Upload Photo"}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 sticky bottom-0">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-200 transition-colors"
          >
            {t("cancel")}
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600 transition-all disabled:opacity-50 shadow-lg shadow-orange-500/25"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {t("save")}
          </button>
        </div>
      </div>
    </div>
  );
}
