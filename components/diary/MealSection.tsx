"use client";

import { useState } from "react";
import Link from "next/link";
import { type FoodLogEntry } from "@/types/food";

interface MealSectionProps {
  meal: "breakfast" | "lunch" | "dinner" | "snack";
  date: Date;
  foods: FoodLogEntry[];
  loading?: boolean;
  onDelete?: (id: string) => Promise<boolean>;
}

const mealLabels = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snacks",
};

const mealIcons = {
  breakfast: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="w-5 h-5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
      />
    </svg>
  ),
  lunch: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="w-5 h-5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
  dinner: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="w-5 h-5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"
      />
    </svg>
  ),
  snack: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="w-5 h-5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
      />
    </svg>
  ),
};

export default function MealSection({
  meal,
  date,
  foods,
  loading,
  onDelete,
}: MealSectionProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const totalCalories = foods.reduce((sum, food) => sum + (food.calories || 0), 0);

  const handleDelete = async (id: string) => {
    if (!onDelete) return;
    setDeletingId(id);
    const success = await onDelete(id);
    if (!success) {
      alert("Failed to delete entry");
    }
    setDeletingId(null);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <span className="text-slate-400">{mealIcons[meal]}</span>
          <h3 className="font-semibold text-slate-900">{mealLabels[meal]}</h3>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500">
            {loading ? "..." : `${Math.round(totalCalories)} kcal`}
          </span>
          <Link
            href={`/add?meal=${meal}&date=${date.toISOString().split("T")[0]}`}
            className="p-1.5 rounded-full bg-teal-100 text-teal-600 hover:bg-teal-200 transition-colors"
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
      {loading ? (
        <div className="p-4 text-center text-slate-400 text-sm">Loading...</div>
      ) : foods.length > 0 ? (
        <div className="divide-y divide-slate-100">
          {foods.map((food) => (
            <div
              key={food.id}
              className="flex items-center justify-between p-4 hover:bg-slate-50 group"
            >
              <div className="flex-1 min-w-0">
                <div className="font-medium text-slate-900 truncate">
                  {food.foodName}
                </div>
                <div className="text-sm text-slate-500">
                  {food.servings} serving{food.servings !== 1 ? "s" : ""}
                  {food.brand && ` • ${food.brand}`}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-sm font-medium text-slate-900">
                  {Math.round(food.calories)} kcal
                </div>
                {onDelete && (
                  <button
                    onClick={() => handleDelete(food.id)}
                    disabled={deletingId === food.id}
                    className="p-1 text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all disabled:opacity-50"
                    title="Delete"
                  >
                    {deletingId === food.id ? (
                      <svg
                        className="animate-spin w-4 h-4"
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
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        ></path>
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-4 h-4"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                        />
                      </svg>
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-4 text-center text-slate-400 text-sm">
          No foods logged
        </div>
      )}
    </div>
  );
}
