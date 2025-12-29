"use client";

import { useState } from "react";
import { searchFoods, type FoodItem } from "@/lib/openfoodfacts";

export default function FoodSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);

    try {
      const searchResult = await searchFoods(query);
      setResults(searchResult.items);
    } catch (error) {
      console.error("Search failed:", error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Search Form */}
      <form onSubmit={handleSearch} className="mb-4">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for food..."
            className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
          <button
            type="submit"
            disabled={loading}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-green-600"
          >
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
          </button>
        </div>
      </form>

      {/* Results */}
      {loading ? (
        <div className="text-center py-8 text-gray-500">Searching...</div>
      ) : results.length > 0 ? (
        <div className="space-y-2">
          {results.map((food) => (
            <button
              key={food.id}
              className="w-full text-left bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow"
            >
              <div className="font-medium text-gray-900">{food.name}</div>
              {food.brand && (
                <div className="text-sm text-gray-500">{food.brand}</div>
              )}
              <div className="text-sm text-gray-600 mt-1">
                {food.calories} kcal | {food.servingSize}
              </div>
            </button>
          ))}
        </div>
      ) : searched ? (
        <div className="text-center py-8 text-gray-500">
          No results found. Try a different search term.
        </div>
      ) : (
        <div className="text-center py-8 text-gray-400">
          Search for foods to add to your diary
        </div>
      )}
    </div>
  );
}
