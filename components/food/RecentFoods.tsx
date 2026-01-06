"use client";

import { useState, useEffect } from "react";
import { type FoodItem } from "@/types/food";
import { getRecentFoods, type RecentFood } from "@/lib/localStorage";
import FoodDetail from "./FoodDetail";

export default function RecentFoods() {
  const [recentFoods, setRecentFoods] = useState<RecentFood[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);

  useEffect(() => {
    fetchRecentFoods();
  }, []);

  const fetchRecentFoods = () => {
    setLoading(true);
    try {
      const foods = getRecentFoods(20);
      setRecentFoods(foods);
    } catch (err) {
      console.error("Error fetching recent foods:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectFood = (food: RecentFood) => {
    // Convert RecentFood to FoodItem format for FoodDetail
    const foodItem: FoodItem = {
      id: `recent-${Date.now()}`,
      source: food.source as FoodItem["source"],
      sourceId: food.sourceId,
      name: food.foodName,
      brand: food.brand,
      servingSize: food.servingSize,
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
    };
    setSelectedFood(foodItem);
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  // Show food detail view when a food is selected
  if (selectedFood) {
    return <FoodDetail food={selectedFood} onBack={() => setSelectedFood(null)} />;
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <svg
          className="animate-spin h-8 w-8 mx-auto mb-3 text-teal-500"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        <p className="text-slate-500">Loading recent foods...</p>
      </div>
    );
  }

  if (recentFoods.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-8 h-8 text-slate-400"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-slate-700 mb-1">No recent foods</h3>
        <p className="text-sm text-slate-500">
          Foods you add will appear here for quick access
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm text-slate-500 mb-4">
        Tap to quickly add foods you&apos;ve logged before
      </p>

      <div className="space-y-2">
        {recentFoods.map((food, index) => (
          <button
            key={`${food.foodName}-${food.brand}-${index}`}
            onClick={() => handleSelectFood(food)}
            className="w-full p-3 bg-white border border-slate-200 rounded-xl hover:border-teal-300 hover:bg-teal-50 transition-colors text-left"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-slate-800 truncate">
                  {food.foodName}
                </h3>
                {food.brand && (
                  <p className="text-sm text-slate-500 truncate">{food.brand}</p>
                )}
                <p className="text-xs text-slate-400 mt-1">
                  {food.servingSize} · {formatTimeAgo(food.lastUsed)}
                  {food.count > 1 && (
                    <span className="ml-2 px-1.5 py-0.5 bg-teal-100 text-teal-700 rounded-full">
                      {food.count}x
                    </span>
                  )}
                </p>
              </div>
              <div className="text-right ml-3">
                <span className="text-lg font-semibold text-slate-800">
                  {food.calories}
                </span>
                <span className="text-sm text-slate-500 ml-1">kcal</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
