"use client";

import { useRef } from "react";
import { Printer, X } from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import { Recipe } from "@/lib/recipes";

interface PrintRecipeProps {
  recipe: Recipe;
  open: boolean;
  onClose: () => void;
}

export default function PrintRecipe({ recipe, open, onClose }: PrintRecipeProps) {
  const { t, language } = useLanguage();
  const printRef = useRef<HTMLDivElement>(null);

  const en = recipe.en;
  const hi = recipe.hi;
  const content = language === "Hindi" && hi ? hi : en;

  const handlePrint = () => {
    const printEl = printRef.current;
    if (!printEl) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${en.title} - Annapurna</title>
        <style>
          @page {
            size: landscape;
            margin: 0.5in;
          }
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Georgia', 'Times New Roman', serif;
            color: #1a1a1a;
            background: white;
          }
          .print-container {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 24px;
            height: 100vh;
            padding: 16px;
          }
          .section {
            padding: 16px;
            border-radius: 8px;
          }
          .photos-section {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }
          .photos-section img {
            width: 100%;
            height: auto;
            border-radius: 8px;
            object-fit: cover;
            max-height: 180px;
          }
          .recipe-title {
            font-size: 22px;
            font-weight: bold;
            color: #c2410c;
            margin-bottom: 4px;
            text-align: center;
          }
          .recipe-meta {
            font-size: 11px;
            color: #666;
            text-align: center;
            margin-bottom: 12px;
          }
          .section-title {
            font-size: 16px;
            font-weight: bold;
            color: #c2410c;
            border-bottom: 2px solid #fed7aa;
            padding-bottom: 6px;
            margin-bottom: 12px;
          }
          .ingredient-item {
            font-size: 13px;
            padding: 4px 0;
            border-bottom: 1px dotted #e5e7eb;
            display: flex;
            justify-content: space-between;
          }
          .ingredient-name {
            font-weight: 500;
          }
          .ingredient-qty {
            color: #666;
            font-size: 12px;
          }
          .step-item {
            font-size: 13px;
            padding: 6px 0;
            border-bottom: 1px solid #f3f4f6;
            display: flex;
            gap: 8px;
          }
          .step-number {
            font-weight: bold;
            color: #c2410c;
            min-width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #fff7ed;
            border-radius: 50%;
            font-size: 12px;
            flex-shrink: 0;
          }
          .step-text {
            line-height: 1.5;
          }
          .step-duration {
            font-size: 11px;
            color: #999;
            font-style: italic;
          }
          .footer {
            text-align: center;
            font-size: 10px;
            color: #999;
            margin-top: 8px;
          }
        </style>
      </head>
      <body>
        <div class="print-container">
          <!-- Photos Column -->
          <div class="section photos-section">
            <div class="recipe-title">${en.title}</div>
            <div style="font-size: 14px; color: #c2410c; text-align: center; margin-bottom: 4px;">${hi ? hi.title : ''}</div>
            <div class="recipe-meta">
              ${en.cuisine} · ${en.prepTime} prep · ${en.cookTime} cook · ${en.servings} servings
            </div>
            ${recipe.images
              .slice(0, 3)
              .map(
                (img) =>
                  `<img src="${img}" alt="${en.title}" crossorigin="anonymous" />`
              )
              .join("")}
            <p style="font-size: 12px; color: #666; line-height: 1.5; margin-top: 8px;">
              ${en.description}
            </p>
            ${hi ? `<p style="font-size: 12px; color: #888; line-height: 1.5; margin-top: 4px; font-style: italic;">${hi.description}</p>` : ''}
            <div class="footer">Annapurna Family Recipes</div>
          </div>

          <!-- Ingredients Column -->
          <div class="section">
            <div class="section-title">Ingredients / सामग्री</div>
            ${en.ingredients
              .map(
                (ing, idx) => `
              <div class="ingredient-item">
                <span class="ingredient-name">${ing.item}${hi && hi.ingredients[idx] ? ` <span style="color:#999;font-size:11px">(${hi.ingredients[idx].item})</span>` : ''}</span>
                <span class="ingredient-qty">${ing.quantity} ${ing.unit}</span>
              </div>
            `
              )
              .join("")}
          </div>

          <!-- Steps Column -->
          <div class="section">
            <div class="section-title">Steps / चरण</div>
            ${en.steps
              .map(
                (step, idx) => `
              <div class="step-item">
                <div class="step-number">${step.stepNumber}</div>
                <div>
                  <div class="step-text">${step.instruction}</div>
                  ${hi && hi.steps[idx] ? `<div style="font-size:11px;color:#888;margin-top:2px">${hi.steps[idx].instruction}</div>` : ''}
                  ${step.duration ? `<div class="step-duration">${step.duration}</div>` : ""}
                </div>
              </div>
            `
              )
              .join("")}
          </div>
        </div>
      </body>
      </html>
    `);

    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">
            {t("printRecipe")} — {content.title}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm font-medium hover:from-orange-600 hover:to-red-600 transition-all shadow-lg shadow-orange-500/25"
            >
              <Printer className="w-4 h-4" />
              {t("printRecipe")}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Preview */}
        <div className="p-6 overflow-auto bg-gray-100" style={{ maxHeight: "calc(90vh - 72px)" }}>
          <div
            ref={printRef}
            className="bg-white rounded-xl shadow-lg mx-auto"
            style={{ aspectRatio: "11/8.5", maxWidth: "900px" }}
          >
            <div className="grid grid-cols-3 gap-4 p-6 h-full">
              {/* Photos */}
              <div className="flex flex-col gap-3">
                <h3 className="text-lg font-bold text-orange-700 text-center">
                  {en.title}
                </h3>
                {hi && (
                  <p className="text-sm text-orange-600 text-center">{hi.title}</p>
                )}
                <p className="text-xs text-gray-500 text-center">
                  {en.cuisine} · {en.prepTime} prep · {en.cookTime}{" "}
                  cook · {en.servings} servings
                </p>
                {recipe.images.slice(0, 3).map((img, i) => (
                  <img
                    key={i}
                    src={img}
                    alt={en.title}
                    className="w-full h-28 object-cover rounded-lg"
                  />
                ))}
                <p className="text-xs text-gray-500 leading-relaxed">
                  {en.description}
                </p>
                {hi && (
                  <p className="text-xs text-gray-400 leading-relaxed italic">
                    {hi.description}
                  </p>
                )}
              </div>

              {/* Ingredients */}
              <div>
                <h3 className="text-sm font-bold text-orange-700 border-b-2 border-orange-200 pb-1 mb-3">
                  Ingredients / सामग्री
                </h3>
                <div className="space-y-1.5">
                  {en.ingredients.map((ing, i) => (
                    <div
                      key={i}
                      className="flex justify-between text-xs border-b border-dotted border-gray-200 pb-1"
                    >
                      <span className="font-medium text-gray-800">
                        {ing.item}
                        {hi && hi.ingredients[i] && (
                          <span className="text-gray-400 ml-1">({hi.ingredients[i].item})</span>
                        )}
                      </span>
                      <span className="text-gray-500">
                        {ing.quantity} {ing.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Steps */}
              <div>
                <h3 className="text-sm font-bold text-orange-700 border-b-2 border-orange-200 pb-1 mb-3">
                  Steps / चरण
                </h3>
                <div className="space-y-2">
                  {en.steps.map((step, i) => (
                    <div key={i} className="flex gap-2 text-xs">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-orange-50 text-orange-700 font-bold flex items-center justify-center text-[10px]">
                        {step.stepNumber}
                      </span>
                      <div>
                        <p className="text-gray-800 leading-relaxed">
                          {step.instruction}
                        </p>
                        {hi && hi.steps[i] && (
                          <p className="text-gray-400 leading-relaxed text-[10px]">
                            {hi.steps[i].instruction}
                          </p>
                        )}
                        {step.duration && (
                          <p className="text-gray-400 italic text-[10px]">
                            {step.duration}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
