# Smart AI Food Scanner — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the current multi-step scan-label flow with a single smart AI scanner that accepts 1+ photos, classifies the image type, estimates nutrition directly, and asks specific follow-up questions when uncertain.

**Architecture:** One new API route (`/api/food/ai-estimate`) accepts multiple images, sends them all to Gemini in a single call, and returns a nutrition estimate with confidence. The frontend is a step/card UI (not chat) that replaces `NutritionLabelScanner`. Labels still get exact extraction; everything else gets AI-estimated macros directly — no separate search-nutrition step.

**Tech Stack:** Gemini 2.0 Flash (vision), Next.js API routes, React state machine component

---

## Task 1: New API Route — `/api/food/ai-estimate`

**Files:**
- Create: `app/api/food/ai-estimate/route.ts`

This is the brain of the feature. It replaces both `scan-label` and `search-nutrition` with a single endpoint.

**Step 1: Create the route file**

```ts
// app/api/food/ai-estimate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getAuthenticatedUser } from "@/lib/auth";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

interface AiEstimateRequest {
  images: string[];            // base64 data URLs
  context?: string;            // optional user-provided context ("this is from Restaurant X")
  followUpAnswer?: string;     // answer to a follow-up question from a previous call
  previousEstimate?: object;   // the previous estimate (so AI can refine)
}

interface NutritionEstimate {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize: string;
  confidence: "high" | "medium" | "low";
}

interface AiEstimateResponse {
  status: "estimated" | "need_info";
  imageType: "nutrition_label" | "menu" | "food_photo" | "delivery_app" | "multiple";
  estimate?: NutritionEstimate;
  followUpQuestion?: string;    // specific question if AI needs more info
  followUpOptions?: string[];   // suggested answers (optional, for quick-tap)
  reasoning?: string;           // short explanation of how the AI arrived at the estimate
}

const ESTIMATE_PROMPT = `You are a nutrition estimation expert. Analyze the provided food image(s) and respond with JSON only (no markdown fences).

First, classify the image(s):
- "nutrition_label" — a nutrition facts panel
- "menu" — a restaurant menu or menu board
- "food_photo" — a photo of actual food/dish
- "delivery_app" — a screenshot from a food delivery app
- "multiple" — if multiple image types are provided together

Then, estimate the nutritional content:

IF "nutrition_label": Extract the exact values from the label.

FOR ALL OTHER TYPES: Estimate the total nutritional values for what is shown. Consider:
- Typical restaurant/homemade portion sizes
- Visible ingredients and cooking method
- Sauce, oil, butter, cheese that may not be obvious
- Side dishes visible in the photo

ALWAYS return this JSON structure:
{
  "status": "estimated",
  "imageType": "nutrition_label" | "menu" | "food_photo" | "delivery_app" | "multiple",
  "estimate": {
    "name": "descriptive name of the food item",
    "calories": integer,
    "protein": grams as number,
    "carbs": grams as number,
    "fat": grams as number,
    "servingSize": "description of what this estimate covers (e.g. '1 whole schnitzel with fries', '1 slice')",
    "confidence": "high" | "medium" | "low"
  },
  "reasoning": "1-2 sentences explaining your estimate (e.g. 'Based on a typical 200g breaded pork schnitzel with 150g of fries')"
}

ONLY if the image is too unclear, unrecognizable, or not food-related, return:
{
  "status": "need_info",
  "imageType": "food_photo",
  "followUpQuestion": "specific question (e.g. 'I can see a bowl but can't tell what's in it. Is this soup, pasta, or something else?')",
  "followUpOptions": ["Soup", "Pasta", "Rice bowl", "Other"]
}

Rules:
- ALWAYS try to estimate. Only ask a follow-up if you truly cannot identify the food.
- For nutrition labels, confidence should be "high" and values should be exact.
- Be specific in the name (e.g. "Wiener Schnitzel with French Fries" not "Meat with sides")
- Round calories to nearest 10, macros to nearest 1g
- If multiple photos are provided, use ALL of them together for a better estimate (e.g. menu name + food photo = better estimate than either alone)
- Err on the side of slightly overestimating calories (people tend to underestimate)`;

const REFINE_PROMPT_SUFFIX = `

The user previously received this estimate and has provided additional information.
Previous estimate: {previousEstimate}
User's answer: {followUpAnswer}

Refine the estimate based on this new information. Return the same JSON structure with updated values.`;

export async function POST(request: NextRequest) {
  const auth = await getAuthenticatedUser();
  if (auth instanceof NextResponse) return auth;

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "Gemini API key not configured" },
      { status: 500 }
    );
  }

  try {
    const body: AiEstimateRequest = await request.json();
    const { images, context, followUpAnswer, previousEstimate } = body;

    if (!images || images.length === 0) {
      return NextResponse.json(
        { error: "At least one image is required" },
        { status: 400 }
      );
    }

    if (images.length > 5) {
      return NextResponse.json(
        { error: "Maximum 5 images allowed" },
        { status: 400 }
      );
    }

    // Build prompt
    let prompt = ESTIMATE_PROMPT;

    if (context) {
      prompt += `\n\nAdditional context from user: "${context}"`;
    }

    if (followUpAnswer && previousEstimate) {
      prompt += REFINE_PROMPT_SUFFIX
        .replace("{previousEstimate}", JSON.stringify(previousEstimate))
        .replace("{followUpAnswer}", followUpAnswer);
    }

    // Build content parts: prompt + all images
    const parts: Array<string | { inlineData: { mimeType: string; data: string } }> = [prompt];

    for (const image of images) {
      const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
      let mimeType = "image/jpeg";
      if (image.startsWith("data:image/png")) mimeType = "image/png";
      else if (image.startsWith("data:image/webp")) mimeType = "image/webp";

      parts.push({
        inlineData: { mimeType, data: base64Data },
      });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(parts);
    const response = await result.response;
    const text = response.text();

    // Parse response
    const cleanedText = text
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    const analysis: AiEstimateResponse = JSON.parse(cleanedText);

    return NextResponse.json(analysis);
  } catch (error) {
    console.error("AI estimate error:", error);
    return NextResponse.json(
      { error: "Failed to analyze food image" },
      { status: 500 }
    );
  }
}
```

**Step 2: Verify it builds**

Run: `npm run build`
Expected: Compiles successfully, `/api/food/ai-estimate` appears in route list

**Step 3: Commit**

```bash
git add app/api/food/ai-estimate/route.ts
git commit -m "feat: add /api/food/ai-estimate route — single-call AI nutrition estimation"
```

---

## Task 2: New Component — `SmartFoodScanner`

**Files:**
- Create: `components/food/SmartFoodScanner.tsx`

This replaces `NutritionLabelScanner.tsx`. It's a step/card UI with these states:

```
upload → analyzing → result → (optional: followUp → analyzing → result) → confirm
```

**Step 1: Create the component**

```tsx
// components/food/SmartFoodScanner.tsx
"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { type FoodItem } from "@/types/food";
import FoodDetail from "./FoodDetail";

type ScanState =
  | "idle"          // show upload buttons
  | "analyzing"     // spinner while AI processes
  | "result"        // show estimate with edit option
  | "follow_up"    // AI asked a question
  | "detail";       // FoodDetail view for final confirm

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
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [state, setState] = useState<ScanState>("idle");
  const [images, setImages] = useState<string[]>([]);
  const [context, setContext] = useState("");
  const [response, setResponse] = useState<AiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);

  // --- Image handling ---

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

    // Reset input so same file can be re-selected
    e.target.value = "";
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  // --- AI call ---

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

  // --- Follow-up handling ---

  const handleFollowUpAnswer = (answer: string) => {
    analyze({
      followUpAnswer: answer,
      previousEstimate: response?.estimate,
    });
  };

  // --- Proceed to FoodDetail ---

  const handleConfirm = () => {
    if (!response?.estimate) return;
    const est = response.estimate;

    const foodItem: FoodItem = {
      id: `ai-${Date.now()}`,
      source: "label_scan", // reuse existing source type for AI estimates
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

  // --- Reset ---

  const reset = () => {
    setState("idle");
    setImages([]);
    setContext("");
    setResponse(null);
    setError(null);
    setSelectedFood(null);
  };

  // --- Render ---

  // FoodDetail for final confirmation
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
      {/* Error banner */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* === IDLE / UPLOAD STATE === */}
      {(state === "idle" || state === "result" || state === "follow_up") && (
        <>
          {/* Image thumbnails */}
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

          {/* Upload buttons (only when no images yet) */}
          {images.length === 0 && (
            <div className="space-y-3">
              <p className="text-sm text-slate-500">
                Take a photo of your food, menu, nutrition label, or delivery app screenshot. Add multiple photos for better accuracy.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex flex-col items-center gap-2 p-4 bg-teal-50 border border-teal-200 rounded-xl hover:bg-teal-100 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-teal-600">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                  </svg>
                  <span className="text-sm font-medium text-teal-700">Take Photo</span>
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center gap-2 p-4 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-slate-600">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                  </svg>
                  <span className="text-sm font-medium text-slate-700">From Gallery</span>
                </button>
              </div>
            </div>
          )}

          {/* Hidden file inputs */}
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

          {/* Optional context field */}
          {images.length > 0 && state === "idle" && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  Extra context (optional)
                </label>
                <input
                  type="text"
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="e.g. 'from Pizza Hut', 'large portion', 'homemade'"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <button
                onClick={() => analyze()}
                className="w-full py-3 bg-teal-500 text-white font-semibold rounded-xl hover:bg-teal-600 transition-colors flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                </svg>
                Analyze with AI
              </button>
            </>
          )}
        </>
      )}

      {/* === ANALYZING STATE === */}
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

      {/* === RESULT STATE === */}
      {state === "result" && response?.estimate && (
        <div className="space-y-4">
          {/* Confidence badge */}
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

          {/* Estimate card */}
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

          {/* Reasoning */}
          {response.reasoning && (
            <p className="text-sm text-slate-500 italic">
              {response.reasoning}
            </p>
          )}

          {/* Add more photos hint */}
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

          {/* Action buttons */}
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

      {/* === FOLLOW-UP QUESTION STATE === */}
      {state === "follow_up" && response?.followUpQuestion && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="font-medium text-amber-800 mb-1">Need a bit more info</p>
            <p className="text-sm text-amber-700">{response.followUpQuestion}</p>
          </div>

          {/* Quick-tap options */}
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

          {/* Free-text answer */}
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
```

**Step 2: Verify it builds**

Run: `npm run build`
Expected: Compiles successfully

**Step 3: Commit**

```bash
git add components/food/SmartFoodScanner.tsx
git commit -m "feat: add SmartFoodScanner component — multi-photo AI food estimation UI"
```

---

## Task 3: Wire up the Add page

**Files:**
- Modify: `app/add/page.tsx`

Replace the "AI Label" tab with "AI" and swap `NutritionLabelScanner` for `SmartFoodScanner`.

**Step 1: Read the current add page**

Read `app/add/page.tsx` to see the exact tab structure and imports.

**Step 2: Update imports and tab config**

- Remove: `import NutritionLabelScanner from "@/components/food/NutritionLabelScanner";`
- Add: `import SmartFoodScanner from "@/components/food/SmartFoodScanner";`
- Change the tab label from `"AI Label"` (or whatever it's called) to `"AI"`
- Change the tab content to render `<SmartFoodScanner />` instead of `<NutritionLabelScanner />`

**Step 3: Verify it builds**

Run: `npm run build`
Expected: Compiles successfully

**Step 4: Commit**

```bash
git add app/add/page.tsx
git commit -m "feat: replace AI Label tab with smart AI scanner"
```

---

## Task 4: Protect the new route in middleware

**Files:**
- Verify: `lib/supabase/middleware.ts`

The middleware currently protects all `/api/` routes except `/api/food/search` and `/api/food/barcode`. The new `/api/food/ai-estimate` route is already protected by this rule AND has its own `getAuthenticatedUser()` call. No changes needed — just verify.

**Step 1: Verify middleware covers the new route**

Read `lib/supabase/middleware.ts` and confirm the public API paths don't include `ai-estimate`.

**Step 2: No commit needed** (no changes)

---

## Task 5: Clean up old scan flow (optional, can defer)

**Files:**
- Potentially delete: `app/api/food/scan-label/route.ts`
- Potentially delete: `app/api/food/search-nutrition/route.ts`
- Potentially simplify: `components/food/NutritionLabelScanner.tsx`
- Modify: `types/food.ts` — remove `ScanResult`, `NeedsSearchScanResult`, `SearchNutritionResult` types if unused

**Step 1: Check for remaining references to old routes/components**

Search the codebase for:
- `scan-label`
- `search-nutrition`
- `NutritionLabelScanner`

**Step 2: If no references remain, delete the old files**

Only delete if nothing imports them. If NutritionLabelScanner is still imported somewhere other than add/page.tsx, leave it for now.

**Step 3: Commit**

```bash
git add -A
git commit -m "chore: remove old scan-label and search-nutrition flows"
```

---

## Task 6: Build & Manual Test

**Step 1: Full build**

Run: `npm run build`
Expected: Clean build, no errors

**Step 2: Manual testing checklist**

1. Open `/add` page → verify "AI" tab appears
2. Click "AI" tab → see upload buttons (Take Photo / From Gallery)
3. Upload a food photo → see "Analyze with AI" button
4. Click analyze → loading spinner → result card with macros
5. Verify confidence badge shows
6. Verify "Add another photo" button shows for medium/low confidence
7. Click "Log This Food" → goes to FoodDetail → add to meal → redirects to diary
8. Test with a nutrition label photo → should get "high" confidence exact values
9. Test with an unclear photo → should get follow-up question with quick-tap options
10. Test "Start Over" button → resets to idle state

---

## Summary of New/Modified Files

| File | Action |
|------|--------|
| `app/api/food/ai-estimate/route.ts` | **CREATE** — single-call AI estimation endpoint |
| `components/food/SmartFoodScanner.tsx` | **CREATE** — multi-photo step/card UI |
| `app/add/page.tsx` | **MODIFY** — swap AI Label tab for AI tab |
| `app/api/food/scan-label/route.ts` | **DELETE** (Task 5, optional) |
| `app/api/food/search-nutrition/route.ts` | **DELETE** (Task 5, optional) |
| `components/food/NutritionLabelScanner.tsx` | **DELETE** (Task 5, optional) |
