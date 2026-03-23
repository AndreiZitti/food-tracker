"use client";

import { useState, useRef } from "react";
import { type FoodItem } from "@/types/food";
import FoodDetail from "./FoodDetail";

type ScanState =
  | "idle"
  | "analyzing"
  | "result"
  | "follow_up"
  | "detail";

interface NutritionEstimate {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize: string;
  confidence: "high" | "medium" | "low";
}

interface AiResponse {
  status: "estimated" | "need_info";
  imageType: string;
  estimate?: NutritionEstimate;
  followUpQuestion?: string;
  followUpOptions?: string[];
  reasoning?: string;
}

export default function SmartFoodScanner() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [state, setState] = useState<ScanState>("idle");
  const [images, setImages] = useState<string[]>([]);
  const [context, setContext] = useState("");
  const [response, setResponse] = useState<AiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });

    e.target.value = "";
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const analyze = async (extraBody?: {
    followUpAnswer?: string;
    previousEstimate?: NutritionEstimate;
  }) => {
    setState("analyzing");
    setError(null);

    try {
      const res = await fetch("/api/food/ai-estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          images,
          context: context || undefined,
          ...extraBody,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to analyze");
      }

      const data: AiResponse = await res.json();
      setResponse(data);

      if (data.status === "need_info") {
        setState("follow_up");
      } else {
        setState("result");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
      setState("idle");
    }
  };

  const handleFollowUpAnswer = (answer: string) => {
    analyze({
      followUpAnswer: answer,
      previousEstimate: response?.estimate,
    });
  };

  const handleConfirm = () => {
    if (!response?.estimate) return;
    const est = response.estimate;

    const foodItem: FoodItem = {
      id: `ai-${Date.now()}`,
      source: "label_scan",
      name: est.name,
      servingSize: est.servingSize,
      calories: est.calories,
      protein: est.protein,
      carbs: est.carbs,
      fat: est.fat,
    };

    setSelectedFood(foodItem);
    setState("detail");
  };

  const reset = () => {
    setState("idle");
    setImages([]);
    setContext("");
    setResponse(null);
    setError(null);
    setSelectedFood(null);
  };

  if (state === "detail" && selectedFood) {
    return (
      <FoodDetail
        food={selectedFood}
        onBack={() => setState("result")}
        confidenceBadge={
          response?.estimate?.confidence === "high" ? "exact" : "estimated"
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
          {error}
        </div>
      )}

      {(state === "idle" || state === "result" || state === "follow_up") && (
        <>
          {images.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {images.map((img, i) => (
                <div key={i} className="relative w-20 h-20">
                  <img
                    src={img}
                    alt={`Photo ${i + 1}`}
                    className="w-20 h-20 object-cover rounded-lg border border-slate-200"
                  />
                  <button
                    onClick={() => removeImage(i)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>
              ))}
              {images.length < 5 && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-20 h-20 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center text-slate-400 hover:border-teal-400 hover:text-teal-500 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                </button>
              )}
            </div>
          )}

          {/* Description field — always visible */}
          {state === "idle" && (
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">
                Describe what you ate
              </label>
              <textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="e.g. 'Carbonara with bacon, egg-based sauce, no cream' or 'large schnitzel with fries from a restaurant'"
                rows={2}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
              />
            </div>
          )}

          {/* Photo buttons */}
          {images.length === 0 && state === "idle" && (
            <div>
              <p className="text-xs text-slate-400 mb-2">
                Optionally add photos for better accuracy (food, menu, label, delivery app)
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex flex-col items-center gap-2 p-3 bg-teal-50 border border-teal-200 rounded-xl hover:bg-teal-100 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-teal-600">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                  </svg>
                  <span className="text-sm font-medium text-teal-700">Take Photo</span>
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-slate-600">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                  </svg>
                  <span className="text-sm font-medium text-slate-700">From Gallery</span>
                </button>
              </div>
            </div>
          )}

          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            className="hidden"
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Analyze button — enabled when there's text OR photos */}
          {state === "idle" && (images.length > 0 || context.trim().length > 0) && (
            <button
              onClick={() => analyze()}
              className="w-full py-3 bg-teal-500 text-white font-semibold rounded-xl hover:bg-teal-600 transition-colors flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
              </svg>
              Analyze with AI
            </button>
          )}
        </>
      )}

      {state === "analyzing" && (
        <div className="text-center py-12">
          <svg
            className="animate-spin h-10 w-10 mx-auto mb-4 text-teal-500"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-slate-600 font-medium">Analyzing your food...</p>
          <p className="text-sm text-slate-400 mt-1">This usually takes a few seconds</p>
        </div>
      )}

      {state === "result" && response?.estimate && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                response.estimate.confidence === "high"
                  ? "bg-emerald-100 text-emerald-700"
                  : response.estimate.confidence === "medium"
                  ? "bg-amber-100 text-amber-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {response.estimate.confidence === "high" ? "High" : response.estimate.confidence === "medium" ? "Medium" : "Low"} confidence
            </span>
            <span className="text-xs text-slate-400">
              {response.imageType === "nutrition_label" ? "From label" : "AI estimate"}
            </span>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4">
            <h3 className="font-semibold text-lg text-slate-900">
              {response.estimate.name}
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              {response.estimate.servingSize}
            </p>

            <div className="grid grid-cols-4 gap-4 text-center mt-4">
              <div>
                <div className="text-2xl font-bold text-teal-600">
                  {response.estimate.calories}
                </div>
                <div className="text-xs text-slate-500">kcal</div>
              </div>
              <div>
                <div className="text-xl font-semibold text-indigo-600">
                  {response.estimate.protein}g
                </div>
                <div className="text-xs text-slate-500">Protein</div>
              </div>
              <div>
                <div className="text-xl font-semibold text-amber-600">
                  {response.estimate.carbs}g
                </div>
                <div className="text-xs text-slate-500">Carbs</div>
              </div>
              <div>
                <div className="text-xl font-semibold text-pink-600">
                  {response.estimate.fat}g
                </div>
                <div className="text-xs text-slate-500">Fat</div>
              </div>
            </div>
          </div>

          {response.reasoning && (
            <p className="text-sm text-slate-500 italic">
              {response.reasoning}
            </p>
          )}

          {images.length < 5 && response.estimate.confidence !== "high" && (
            <button
              onClick={() => {
                setState("idle");
              }}
              className="w-full py-2 text-sm text-teal-600 border border-teal-200 rounded-lg hover:bg-teal-50 transition-colors"
            >
              + Add another photo for better accuracy
            </button>
          )}

          <div className="flex gap-3">
            <button
              onClick={reset}
              className="flex-1 py-3 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200 transition-colors"
            >
              Start Over
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 py-3 bg-teal-500 text-white font-semibold rounded-xl hover:bg-teal-600 transition-colors"
            >
              Log This Food
            </button>
          </div>
        </div>
      )}

      {state === "follow_up" && response?.followUpQuestion && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="font-medium text-amber-800 mb-1">Need a bit more info</p>
            <p className="text-sm text-amber-700">{response.followUpQuestion}</p>
          </div>

          {response.followUpOptions && response.followUpOptions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {response.followUpOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => handleFollowUpAnswer(option)}
                  className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium hover:border-teal-400 hover:bg-teal-50 transition-colors"
                >
                  {option}
                </button>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Or type your answer..."
              className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.currentTarget.value) {
                  handleFollowUpAnswer(e.currentTarget.value);
                }
              }}
            />
          </div>

          <button
            onClick={reset}
            className="w-full py-2 text-sm text-slate-500 hover:text-slate-700"
          >
            Start over instead
          </button>
        </div>
      )}
    </div>
  );
}
