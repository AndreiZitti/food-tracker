"use client";

import { useEffect, useState } from "react";

interface Totals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface Goals {
  calorieGoal: number;
  proteinGoal: number;
  carbsGoal: number;
  fatGoal: number;
  displayMode: "simple" | "advanced";
}

interface DailyTotalsProps {
  totals: Totals;
  loading?: boolean;
}

const defaultGoals: Goals = {
  calorieGoal: 2000,
  proteinGoal: 150,
  carbsGoal: 200,
  fatGoal: 65,
  displayMode: "simple",
};

export default function DailyTotals({ totals, loading }: DailyTotalsProps) {
  const [goals, setGoals] = useState<Goals>(defaultGoals);

  useEffect(() => {
    // Load goals from localStorage
    const savedSettings = localStorage.getItem("fittrack-settings");
    if (savedSettings) {
      try {
        setGoals(JSON.parse(savedSettings));
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

  const caloriePercentage = Math.min(
    (totals.calories / goals.calorieGoal) * 100,
    100
  );
  const remaining = goals.calorieGoal - totals.calories;

  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      {/* Main Calories Display */}
      <div className="text-center mb-4">
        <div className="text-4xl font-bold text-slate-900">
          {loading ? (
            <span className="inline-block w-24 h-10 bg-slate-100 animate-pulse rounded" />
          ) : (
            Math.round(totals.calories)
          )}
        </div>
        <div className="text-sm text-slate-500">of {goals.calorieGoal} kcal</div>
      </div>

      {/* Progress Bar */}
      <div className="h-3 bg-slate-100 rounded-full overflow-hidden mb-3">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            totals.calories > goals.calorieGoal ? "bg-rose-500" : "bg-teal-500"
          }`}
          style={{ width: loading ? "0%" : `${caloriePercentage}%` }}
        />
      </div>

      {/* Remaining */}
      <div className="text-center text-sm">
        {loading ? (
          <span className="text-slate-400">Loading...</span>
        ) : (
          <span
            className={`font-medium ${
              remaining >= 0 ? "text-teal-600" : "text-rose-600"
            }`}
          >
            {remaining >= 0
              ? `${Math.round(remaining)} kcal remaining`
              : `${Math.abs(Math.round(remaining))} kcal over`}
          </span>
        )}
      </div>

      {/* Macro Breakdown (Advanced Mode Only) */}
      {goals.displayMode === "advanced" && !loading && (
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-100">
          <div className="text-center">
            <div className="text-lg font-semibold text-slate-900">
              {Math.round(totals.protein)}g
            </div>
            <div className="text-xs text-slate-500">
              Protein ({goals.proteinGoal}g)
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(
                    (totals.protein / goals.proteinGoal) * 100,
                    100
                  )}%`,
                }}
              />
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-slate-900">
              {Math.round(totals.carbs)}g
            </div>
            <div className="text-xs text-slate-500">
              Carbs ({goals.carbsGoal}g)
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(
                    (totals.carbs / goals.carbsGoal) * 100,
                    100
                  )}%`,
                }}
              />
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-slate-900">
              {Math.round(totals.fat)}g
            </div>
            <div className="text-xs text-slate-500">Fat ({goals.fatGoal}g)</div>
            <div className="h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
              <div
                className="h-full bg-pink-500 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(
                    (totals.fat / goals.fatGoal) * 100,
                    100
                  )}%`,
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
