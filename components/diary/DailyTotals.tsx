"use client";

import { useEffect, useState } from "react";

interface DailyTotalsProps {
  date: Date;
}

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

const defaultGoals: Goals = {
  calorieGoal: 2000,
  proteinGoal: 150,
  carbsGoal: 200,
  fatGoal: 65,
  displayMode: "simple",
};

export default function DailyTotals({ date }: DailyTotalsProps) {
  const [totals] = useState<Totals>({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  });
  const [goals, setGoals] = useState<Goals>(defaultGoals);

  useEffect(() => {
    // Load goals from localStorage
    const savedSettings = localStorage.getItem("fittrack-settings");
    if (savedSettings) {
      setGoals(JSON.parse(savedSettings));
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
        <div className="text-4xl font-bold text-gray-900">{totals.calories}</div>
        <div className="text-sm text-gray-500">
          of {goals.calorieGoal} kcal
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-3">
        <div
          className="h-full bg-green-500 rounded-full transition-all duration-300"
          style={{ width: `${caloriePercentage}%` }}
        />
      </div>

      {/* Remaining */}
      <div className="text-center text-sm">
        <span
          className={`font-medium ${
            remaining >= 0 ? "text-green-600" : "text-red-600"
          }`}
        >
          {remaining >= 0 ? `${remaining} kcal remaining` : `${Math.abs(remaining)} kcal over`}
        </span>
      </div>

      {/* Macro Breakdown (Advanced Mode Only) */}
      {goals.displayMode === "advanced" && (
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-100">
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">
              {totals.protein}g
            </div>
            <div className="text-xs text-gray-500">
              Protein ({goals.proteinGoal}g)
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full"
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
            <div className="text-lg font-semibold text-gray-900">
              {totals.carbs}g
            </div>
            <div className="text-xs text-gray-500">
              Carbs ({goals.carbsGoal}g)
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
              <div
                className="h-full bg-yellow-500 rounded-full"
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
            <div className="text-lg font-semibold text-gray-900">
              {totals.fat}g
            </div>
            <div className="text-xs text-gray-500">Fat ({goals.fatGoal}g)</div>
            <div className="h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
              <div
                className="h-full bg-red-500 rounded-full"
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
