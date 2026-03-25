"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { type FoodItem } from "@/types/food";
import FoodDetail from "@/components/food/FoodDetail";
import BarcodeScanner from "@/components/food/BarcodeScanner";
import SmartFoodScanner from "@/components/food/SmartFoodScanner";
import ManualEntryForm from "@/components/food/ManualEntryForm";
import { getRecentFoods, type RecentFood } from "@/lib/db/food-log-dal";
import { useAuthContext } from "@/lib/auth/auth-context";

type OverlayMode = null | "barcode" | "ai" | "manual";

const mealLabels: Record<string, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
};

export default function AddFoodPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin h-8 w-8 border-4 border-[var(--zfit-primary)] border-t-transparent rounded-full" /></div>}>
      <AddFoodContent />
    </Suspense>
  );
}

function AddFoodContent() {
  const searchParams = useSearchParams();
  const meal = searchParams.get("meal") || "breakfast";
  const { mode } = useAuthContext();

  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const [recentFoods, setRecentFoods] = useState<RecentFood[]>([]);
  const [recentLoading, setRecentLoading] = useState(true);

  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [overlayMode, setOverlayMode] = useState<OverlayMode>(null);

  // Fetch recent foods from IndexedDB on mount
  useEffect(() => {
    (async () => {
      try {
        const foods = await getRecentFoods(10);
        setRecentFoods(foods);
      } catch {
        // ignore – IndexedDB may not be available
      } finally {
        setRecentLoading(false);
      }
    })();
  }, []);

  // Debounced search
  useEffect(() => {
    if (query.trim().length < 2) {
      setSearchResults([]);
      setSearched(false);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchLoading(true);
      setSearched(true);
      try {
        const res = await fetch(`/api/food/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setSearchResults(data.items || []);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const handleSelectRecent = useCallback((food: RecentFood) => {
    setSelectedFood({
      id: `recent-${Date.now()}`,
      source: food.source as FoodItem["source"],
      sourceId: food.source_id,
      name: food.food_name,
      brand: food.brand,
      servingSize: food.serving_size,
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
    });
  }, []);

  // Full-screen overlays for barcode/AI/manual
  if (overlayMode === "barcode") return <BarcodeScanner />;
  if (overlayMode === "ai") return <SmartFoodScanner />;
  if (overlayMode === "manual") return <ManualEntryForm />;
  if (selectedFood) return <FoodDetail food={selectedFood} onBack={() => setSelectedFood(null)} />;

  const isSearching = query.trim().length >= 2;
  const topRecentFoods = recentFoods.slice(0, 3);

  return (
    <div className="max-w-lg mx-auto px-5 py-4">
      {/* Header with meal badge */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-[26px] font-semibold text-[var(--foreground)] tracking-tight">Add Food</h1>
        <span className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[var(--zfit-primary-subtle)] text-[var(--zfit-primary)] rounded-full text-xs font-semibold">
          {mealLabels[meal] || "Breakfast"}
        </span>
      </div>

      {/* Search bar with action icons */}
      <div className="relative mb-5">
        <div className="flex items-center bg-white rounded-2xl border border-[var(--border-color)] shadow-warm-sm px-4 h-[52px] gap-3">
          {/* Search icon */}
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-[var(--zfit-gray-400)] flex-shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>

          {/* Input */}
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search foods..."
            className="flex-1 bg-transparent text-[15px] text-[var(--foreground)] placeholder:text-[var(--zfit-gray-400)] outline-none"
          />

          {/* Loading spinner or action icons */}
          {searchLoading ? (
            <svg className="animate-spin h-5 w-5 text-[var(--zfit-primary)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <div className="flex items-center gap-1">
              {/* Barcode button */}
              <button
                onClick={() => setOverlayMode("barcode")}
                className="btn-sm p-2 rounded-xl hover:bg-[var(--zfit-gray-200)] transition-colors"
                title="Scan barcode"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-[var(--zfit-gray-500)]">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM19.5 19.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75H16.5v-.75z" />
                </svg>
              </button>
              {/* AI photo button */}
              <button
                onClick={() => {
                  if (mode === "guest") {
                    alert("Sign in to use the AI food scanner");
                    return;
                  }
                  setOverlayMode("ai");
                }}
                className={`btn-sm p-2 rounded-xl hover:bg-[var(--zfit-gray-200)] transition-colors ${mode === "guest" ? "opacity-40" : ""}`}
                title={mode === "guest" ? "Sign in to use AI scanner" : "AI food scanner"}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-[var(--zfit-gray-500)]">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Search Results */}
      {isSearching ? (
        <div>
          <p className="text-[13px] font-semibold text-[var(--zfit-gray-500)] mb-3">
            {searchLoading ? "Searching..." : `Results for "${query}"`}
          </p>
          {searchResults.length > 0 ? (
            <div className="space-y-2">
              {searchResults.map((food) => (
                <button
                  key={food.id}
                  onClick={() => setSelectedFood(food)}
                  className="w-full text-left bg-white rounded-2xl shadow-warm-sm px-4 py-3 flex items-center justify-between hover:shadow-warm transition-shadow"
                >
                  <div className="flex-1 min-w-0 mr-3">
                    <div className="font-medium text-[15px] text-[var(--foreground)] truncate">{food.name}</div>
                    {food.brand && <div className="text-xs text-[var(--zfit-gray-400)]">{food.brand}</div>}
                    <div className="text-xs text-[var(--zfit-gray-400)] mt-0.5">{food.servingSize}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-[15px] font-bold text-[var(--zfit-primary)]">{Math.round(food.calories)}</span>
                    <span className="text-xs text-[var(--zfit-gray-400)] ml-1">kcal</span>
                  </div>
                </button>
              ))}
            </div>
          ) : searched && !searchLoading ? (
            <div className="text-center py-8 text-[var(--zfit-gray-400)] text-sm">
              No results found. Try a different term.
            </div>
          ) : null}
        </div>
      ) : (
        <>
          {/* Quick-add chips from top recent foods */}
          {topRecentFoods.length > 0 && (
            <div className="mb-5">
              <p className="text-[13px] font-semibold text-[var(--zfit-gray-500)] mb-2.5">Quick add</p>
              <div className="flex flex-wrap gap-2">
                {topRecentFoods.map((food, i) => (
                  <button
                    key={i}
                    onClick={() => handleSelectRecent(food)}
                    className="btn-sm flex items-center gap-1.5 px-3.5 py-2 bg-white border border-[var(--border-color)] rounded-full text-[13px] font-medium text-[var(--foreground)] hover:border-[var(--zfit-primary)] hover:bg-[var(--zfit-primary-subtle)] transition-colors"
                  >
                    <span className="text-[var(--zfit-primary)] font-bold">{food.calories}</span>
                    <span className="truncate max-w-[120px]">{food.food_name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Recent foods list */}
          <div className="mb-5">
            <p className="text-[13px] font-semibold text-[var(--zfit-gray-500)] mb-2.5">Recently logged</p>
            {recentLoading ? (
              <div className="text-center py-6">
                <svg className="animate-spin h-6 w-6 mx-auto text-[var(--zfit-primary)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
            ) : recentFoods.length > 0 ? (
              <div className="bg-white rounded-2xl shadow-warm-sm overflow-hidden">
                {recentFoods.map((food, i) => (
                  <button
                    key={`${food.food_name}-${i}`}
                    onClick={() => handleSelectRecent(food)}
                    className="w-full text-left px-4 py-3 flex items-center justify-between border-b border-[var(--divider-color)] last:border-b-0 hover:bg-[var(--zfit-gray-50)] transition-colors"
                  >
                    <div className="flex-1 min-w-0 mr-3">
                      <div className="font-medium text-[15px] text-[var(--foreground)] truncate">{food.food_name}</div>
                      <div className="text-xs text-[var(--zfit-gray-400)] mt-0.5">
                        {food.serving_size}
                        {food.count > 1 && (
                          <span className="ml-2 px-1.5 py-0.5 bg-[var(--zfit-primary-subtle)] text-[var(--zfit-primary)] rounded-full text-[10px] font-semibold">
                            {food.count}x
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[15px] font-bold text-[var(--foreground)]">{food.calories}</span>
                      <div className="w-8 h-8 rounded-full bg-[var(--zfit-primary-subtle)] flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 text-[var(--zfit-primary)]">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-white rounded-2xl shadow-warm-sm">
                <div className="w-14 h-14 mx-auto mb-3 bg-[var(--zfit-gray-200)] rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7 text-[var(--zfit-gray-400)]">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="font-medium text-[var(--foreground)]">No recent foods</p>
                <p className="text-sm text-[var(--zfit-gray-400)] mt-1">Foods you add will appear here</p>
              </div>
            )}
          </div>

          {/* Manual entry link */}
          <button
            onClick={() => setOverlayMode("manual")}
            className="w-full flex items-center justify-center gap-2 py-3 text-sm font-medium text-[var(--zfit-gray-500)] hover:text-[var(--zfit-primary)] transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
            </svg>
            Can&apos;t find it? Add manually
          </button>
        </>
      )}
    </div>
  );
}
