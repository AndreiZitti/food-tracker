"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { type FoodItem } from "@/lib/openfoodfacts";

type Meal = "breakfast" | "lunch" | "dinner" | "snack";

export default function FoodSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [servings, setServings] = useState(1);
  const [selectedMeal, setSelectedMeal] = useState<Meal>("lunch");
  const [adding, setAdding] = useState(false);

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
        const response = await fetch(`/api/food/search?q=${encodeURIComponent(query)}`);
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

  const handleSelectFood = (food: FoodItem) => {
    setSelectedFood(food);
    setServings(1);
    // Auto-select meal based on time of day
    const hour = new Date().getHours();
    if (hour < 10) setSelectedMeal("breakfast");
    else if (hour < 14) setSelectedMeal("lunch");
    else if (hour < 18) setSelectedMeal("snack");
    else setSelectedMeal("dinner");
  };

  const handleAddFood = async () => {
    if (!selectedFood) return;

    setAdding(true);
    try {
      const response = await fetch("/api/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: new Date().toISOString().split("T")[0],
          meal: selectedMeal,
          foodName: selectedFood.name,
          brand: selectedFood.brand,
          servingSize: selectedFood.servingSize,
          servings: servings,
          calories: Math.round(selectedFood.calories * servings),
          protein: Math.round(selectedFood.protein * servings * 10) / 10,
          carbs: Math.round(selectedFood.carbs * servings * 10) / 10,
          fat: Math.round(selectedFood.fat * servings * 10) / 10,
          source: "openfoodfacts",
          sourceId: selectedFood.sourceId,
        }),
      });

      if (response.ok) {
        router.push("/diary");
      } else {
        alert("Failed to add food. Please try again.");
      }
    } catch (error) {
      console.error("Failed to add food:", error);
      alert("Failed to add food. Please try again.");
    } finally {
      setAdding(false);
    }
  };

  const meals: { value: Meal; label: string }[] = [
    { value: "breakfast", label: "Breakfast" },
    { value: "lunch", label: "Lunch" },
    { value: "dinner", label: "Dinner" },
    { value: "snack", label: "Snack" },
  ];

  // Food detail view
  if (selectedFood) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setSelectedFood(null)}
          className="text-gray-500 hover:text-gray-700 flex items-center gap-1"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Back to search
        </button>

        <div className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="text-xl font-semibold text-gray-900">{selectedFood.name}</h2>
          {selectedFood.brand && (
            <p className="text-gray-500">{selectedFood.brand}</p>
          )}
          <p className="text-sm text-gray-400 mt-1">{selectedFood.servingSize}</p>
        </div>

        {/* Servings adjuster */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Servings</label>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setServings(Math.max(0.5, servings - 0.5))}
              className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-xl font-bold"
            >
              −
            </button>
            <input
              type="number"
              value={servings}
              onChange={(e) => setServings(Math.max(0.1, parseFloat(e.target.value) || 0.1))}
              className="w-20 text-center text-xl font-semibold border rounded-lg py-2"
              step="0.5"
              min="0.1"
            />
            <button
              onClick={() => setServings(servings + 0.5)}
              className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-xl font-bold"
            >
              +
            </button>
          </div>
        </div>

        {/* Nutrition info */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="font-medium text-gray-900 mb-3">Nutrition ({servings} serving{servings !== 1 ? 's' : ''})</h3>
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">{Math.round(selectedFood.calories * servings)}</div>
              <div className="text-xs text-gray-500">kcal</div>
            </div>
            <div>
              <div className="text-xl font-semibold text-gray-900">{Math.round(selectedFood.protein * servings * 10) / 10}g</div>
              <div className="text-xs text-gray-500">Protein</div>
            </div>
            <div>
              <div className="text-xl font-semibold text-gray-900">{Math.round(selectedFood.carbs * servings * 10) / 10}g</div>
              <div className="text-xs text-gray-500">Carbs</div>
            </div>
            <div>
              <div className="text-xl font-semibold text-gray-900">{Math.round(selectedFood.fat * servings * 10) / 10}g</div>
              <div className="text-xs text-gray-500">Fat</div>
            </div>
          </div>
        </div>

        {/* Meal selector */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Add to</label>
          <div className="grid grid-cols-4 gap-2">
            {meals.map((meal) => (
              <button
                key={meal.value}
                onClick={() => setSelectedMeal(meal.value)}
                className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  selectedMeal === meal.value
                    ? "bg-green-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {meal.label}
              </button>
            ))}
          </div>
        </div>

        {/* Add button */}
        <button
          onClick={handleAddFood}
          disabled={adding}
          className="w-full py-4 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white font-semibold rounded-xl transition-colors"
        >
          {adding ? "Adding..." : `Add to ${selectedMeal.charAt(0).toUpperCase() + selectedMeal.slice(1)}`}
        </button>
      </div>
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
          className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          autoFocus
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
          {loading ? (
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          )}
        </div>
      </div>

      {/* Results */}
      {loading && query.length >= 2 ? (
        <div className="text-center py-8 text-gray-500">Searching...</div>
      ) : results.length > 0 ? (
        <div className="space-y-2">
          {results.map((food) => (
            <button
              key={food.id}
              onClick={() => handleSelectFood(food)}
              className="w-full text-left bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{food.name}</div>
                  {food.brand && (
                    <div className="text-sm text-gray-500">{food.brand}</div>
                  )}
                  <div className="text-sm text-gray-400 mt-1">{food.servingSize}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-green-600">{Math.round(food.calories)} kcal</div>
                  <div className="text-xs text-gray-400">per serving</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : searched && query.length >= 2 ? (
        <div className="text-center py-8 text-gray-500">
          No results found. Try a different search term.
        </div>
      ) : (
        <div className="text-center py-8 text-gray-400">
          {query.length > 0 && query.length < 2
            ? "Type at least 2 characters to search"
            : "Search for foods to add to your diary"}
        </div>
      )}
    </div>
  );
}
