"use client";

import { useState, useEffect } from "react";
import { type FoodItem } from "@/types/food";
import FoodDetail from "./FoodDetail";

export default function FoodSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);

  // Debounced search
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setSearched(false);
      return;
    }

    const debounceTimer = setTimeout(async () => {
      setLoading(true);
      setSearched(true);

      try {
        const response = await fetch(
          `/api/food/search?q=${encodeURIComponent(query)}`
        );
        const data = await response.json();
        setResults(data.items || []);
      } catch (error) {
        console.error("Search failed:", error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [query]);

  // Food detail view
  if (selectedFood) {
    return (
      <FoodDetail food={selectedFood} onBack={() => setSelectedFood(null)} />
    );
  }

  return (
    <div>
      {/* Search Input */}
      <div className="relative mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for food..."
          className="w-full px-4 py-3 pr-12 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          autoFocus
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
          {loading ? (
            <svg
              className="animate-spin h-5 w-5"
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
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
              />
            </svg>
          )}
        </div>
      </div>

      {/* Results */}
      {loading && query.length >= 2 ? (
        <div className="text-center py-8 text-slate-500">Searching...</div>
      ) : results.length > 0 ? (
        <div className="space-y-2">
          {results.map((food) => (
            <button
              key={food.id}
              onClick={() => setSelectedFood(food)}
              className="w-full text-left bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="font-medium text-slate-900">{food.name}</div>
                  {food.brand && (
                    <div className="text-sm text-slate-500">{food.brand}</div>
                  )}
                  <div className="text-sm text-slate-400 mt-1">
                    {food.servingSize}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-teal-600">
                    {Math.round(food.calories)} kcal
                  </div>
                  <div className="text-xs text-slate-400">per serving</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : searched && query.length >= 2 ? (
        <div className="text-center py-8 text-slate-500">
          No results found. Try a different search term.
        </div>
      ) : (
        <div className="text-center py-8 text-slate-400">
          {query.length > 0 && query.length < 2
            ? "Type at least 2 characters to search"
            : "Search for foods to add to your diary"}
        </div>
      )}
    </div>
  );
}
