"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { type FoodItem } from "@/types/food";

type Meal = "breakfast" | "lunch" | "dinner" | "snack";

interface FoodDetailProps {
  food: FoodItem;
  onBack: () => void;
  /** Optional: override the date for logging (defaults to today) */
  date?: string;
}

export default function FoodDetail({ food, onBack, date }: FoodDetailProps) {
  const router = useRouter();
  const [servings, setServings] = useState(1);
  const [selectedMeal, setSelectedMeal] = useState<Meal>(() => {
    // Auto-select meal based on time of day
    const hour = new Date().getHours();
    if (hour < 10) return "breakfast";
    if (hour < 14) return "lunch";
    if (hour < 18) return "snack";
    return "dinner";
  });
  const [adding, setAdding] = useState(false);

  const handleAddFood = async () => {
    setAdding(true);
    try {
      const logDate = date || new Date().toISOString().split("T")[0];
      const response = await fetch("/api/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: logDate,
          meal: selectedMeal,
          foodName: food.name,
          brand: food.brand,
          servingSize: food.servingSize,
          servings: servings,
          calories: Math.round(food.calories * servings),
          protein: Math.round(food.protein * servings * 10) / 10,
          carbs: Math.round(food.carbs * servings * 10) / 10,
          fat: Math.round(food.fat * servings * 10) / 10,
          source: food.source,
          sourceId: food.sourceId,
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

  return (
    <div className="space-y-4">
      <button
        onClick={onBack}
        className="text-slate-500 hover:text-slate-700 flex items-center gap-1"
      >
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
            d="M15.75 19.5L8.25 12l7.5-7.5"
          />
        </svg>
        Back
      </button>

      <div className="bg-white rounded-xl shadow-sm p-4">
        {food.imageUrl && (
          <img
            src={food.imageUrl}
            alt={food.name}
            className="w-20 h-20 object-contain mx-auto mb-3 rounded-lg"
          />
        )}
        <h2 className="text-xl font-semibold text-slate-900">{food.name}</h2>
        {food.brand && <p className="text-slate-500">{food.brand}</p>}
        <p className="text-sm text-slate-400 mt-1">{food.servingSize}</p>
        {food.nutritionGrade && (
          <span
            className={`inline-block mt-2 px-2 py-0.5 text-xs font-bold rounded ${
              food.nutritionGrade === "a"
                ? "bg-emerald-100 text-emerald-700"
                : food.nutritionGrade === "b"
                ? "bg-lime-100 text-lime-700"
                : food.nutritionGrade === "c"
                ? "bg-amber-100 text-amber-700"
                : food.nutritionGrade === "d"
                ? "bg-orange-100 text-orange-700"
                : "bg-rose-100 text-rose-700"
            }`}
          >
            Nutri-Score {food.nutritionGrade.toUpperCase()}
          </span>
        )}
      </div>

      {/* Servings adjuster */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Servings
        </label>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setServings(Math.max(0.5, servings - 0.5))}
            className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-xl font-bold"
          >
            −
          </button>
          <input
            type="number"
            value={servings}
            onChange={(e) =>
              setServings(Math.max(0.1, parseFloat(e.target.value) || 0.1))
            }
            className="w-20 text-center text-xl font-semibold border border-slate-200 rounded-lg py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
            step="0.5"
            min="0.1"
          />
          <button
            onClick={() => setServings(servings + 0.5)}
            className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-xl font-bold"
          >
            +
          </button>
        </div>
      </div>

      {/* Nutrition info */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <h3 className="font-medium text-slate-900 mb-3">
          Nutrition ({servings} serving{servings !== 1 ? "s" : ""})
        </h3>
        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-teal-600">
              {Math.round(food.calories * servings)}
            </div>
            <div className="text-xs text-slate-500">kcal</div>
          </div>
          <div>
            <div className="text-xl font-semibold text-indigo-600">
              {Math.round(food.protein * servings * 10) / 10}g
            </div>
            <div className="text-xs text-slate-500">Protein</div>
          </div>
          <div>
            <div className="text-xl font-semibold text-amber-600">
              {Math.round(food.carbs * servings * 10) / 10}g
            </div>
            <div className="text-xs text-slate-500">Carbs</div>
          </div>
          <div>
            <div className="text-xl font-semibold text-pink-600">
              {Math.round(food.fat * servings * 10) / 10}g
            </div>
            <div className="text-xs text-slate-500">Fat</div>
          </div>
        </div>
      </div>

      {/* Meal selector */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Add to
        </label>
        <div className="grid grid-cols-4 gap-2">
          {meals.map((meal) => (
            <button
              key={meal.value}
              onClick={() => setSelectedMeal(meal.value)}
              className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                selectedMeal === meal.value
                  ? "bg-teal-500 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
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
        className="w-full py-4 bg-teal-500 hover:bg-teal-600 disabled:bg-teal-300 text-white font-semibold rounded-xl transition-colors"
      >
        {adding
          ? "Adding..."
          : `Add to ${selectedMeal.charAt(0).toUpperCase() + selectedMeal.slice(1)}`}
      </button>
    </div>
  );
}
