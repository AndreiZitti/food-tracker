"use client";

import Link from "next/link";

interface MealSectionProps {
  meal: "breakfast" | "lunch" | "dinner" | "snack";
  date: Date;
}

const mealLabels = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snacks",
};

const mealIcons = {
  breakfast: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
    </svg>
  ),
  lunch: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  dinner: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
    </svg>
  ),
  snack: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
    </svg>
  ),
};

export default function MealSection({ meal, date }: MealSectionProps) {
  // Placeholder: In a real app, this would fetch from the database
  const foods: { id: string; name: string; calories: number; servings: number }[] = [];

  const totalCalories = foods.reduce(
    (sum, food) => sum + food.calories * food.servings,
    0
  );

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <span className="text-gray-400">{mealIcons[meal]}</span>
          <h3 className="font-semibold text-gray-900">{mealLabels[meal]}</h3>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">{totalCalories} kcal</span>
          <Link
            href={`/add?meal=${meal}&date=${date.toISOString().split("T")[0]}`}
            className="p-1.5 rounded-full bg-green-100 text-green-600 hover:bg-green-200 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-4 h-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
          </Link>
        </div>
      </div>

      {/* Food List */}
      {foods.length > 0 ? (
        <div className="divide-y divide-gray-100">
          {foods.map((food) => (
            <div
              key={food.id}
              className="flex items-center justify-between p-4 hover:bg-gray-50"
            >
              <div>
                <div className="font-medium text-gray-900">{food.name}</div>
                <div className="text-sm text-gray-500">
                  {food.servings} serving{food.servings !== 1 ? "s" : ""}
                </div>
              </div>
              <div className="text-sm font-medium text-gray-900">
                {food.calories * food.servings} kcal
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-4 text-center text-gray-400 text-sm">
          No foods logged
        </div>
      )}
    </div>
  );
}
