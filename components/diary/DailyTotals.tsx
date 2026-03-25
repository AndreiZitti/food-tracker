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

const defaultGoals: Goals = {
  calorieGoal: 2000,
  proteinGoal: 150,
  carbsGoal: 200,
  fatGoal: 65,
  displayMode: "simple",
};

function CalorieRing({ percentage, over }: { percentage: number; over: boolean }) {
  const radius = 78;
  const strokeWidth = 12;
  const center = 90;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (Math.min(percentage, 100) / 100) * circumference;

  return (
    <svg width="180" height="180" viewBox="0 0 180 180" className="transform -rotate-90">
      {/* Background ring */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="var(--border-color)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      {/* Progress ring */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={over ? "var(--zfit-error)" : "var(--zfit-primary)"}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={dashOffset}
        className="transition-all duration-700 ease-out"
      />
    </svg>
  );
}

function MacroRing({
  percentage,
  color,
  bgColor,
  value,
  label,
}: {
  percentage: number;
  color: string;
  bgColor: string;
  value: string;
  label: string;
}) {
  const radius = 19;
  const strokeWidth = 5;
  const center = 24;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (Math.min(percentage, 100) / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1.5">
      <svg width="48" height="48" viewBox="0 0 48 48" className="transform -rotate-90">
        <circle cx={center} cy={center} r={radius} fill="none" stroke={bgColor} strokeWidth={strokeWidth} strokeLinecap="round" />
        <circle
          cx={center} cy={center} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={dashOffset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <span className="text-sm font-semibold text-[var(--foreground)]">{value}</span>
      <span className="text-[11px] font-medium text-[var(--zfit-gray-400)]">{label}</span>
    </div>
  );
}

export default function DailyTotals({ totals, loading }: { totals: Totals; loading?: boolean }) {
  const [goals, setGoals] = useState<Goals>(defaultGoals);

  useEffect(() => {
    async function loadGoals() {
      try {
        const res = await fetch("/api/settings");
        if (!res.ok) return;
        const data = await res.json();
        setGoals({
          calorieGoal: data.calorie_goal ?? 2000,
          proteinGoal: data.protein_goal ?? 150,
          carbsGoal: data.carbs_goal ?? 200,
          fatGoal: data.fat_goal ?? 65,
          displayMode: data.display_mode ?? "simple",
        });
      } catch {
        // Use defaults
      }
    }
    loadGoals();
  }, []);

  const caloriePercentage = (totals.calories / goals.calorieGoal) * 100;
  const remaining = goals.calorieGoal - totals.calories;
  const isOver = remaining < 0;

  return (
    <div className="bg-white rounded-[20px] shadow-warm p-6">
      {/* Circular Calorie Ring */}
      <div className="flex flex-col items-center">
        <div className="relative w-[180px] h-[180px]">
          <CalorieRing percentage={loading ? 0 : caloriePercentage} over={isOver} />
          {/* Center text overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {loading ? (
              <span className="inline-block w-20 h-9 bg-[var(--zfit-gray-200)] animate-pulse rounded-lg" />
            ) : (
              <>
                <span className="text-4xl font-bold text-[var(--foreground)] tracking-tight">
                  {Math.round(totals.calories).toLocaleString()}
                </span>
                <span className="text-[13px] font-medium text-[var(--zfit-gray-500)]">
                  of {goals.calorieGoal.toLocaleString()} kcal
                </span>
              </>
            )}
          </div>
        </div>

        {/* Remaining indicator */}
        <div className="mt-3 flex items-center gap-1.5">
          {loading ? (
            <span className="text-[var(--zfit-gray-400)] text-sm">Loading...</span>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
                className={`w-3.5 h-3.5 ${isOver ? "text-[var(--zfit-error)]" : "text-[var(--zfit-primary)]"}`}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d={isOver ? "M2.25 6L9 12.75l4.286-4.286a11.948 11.948 0 014.306 6.43l.776 2.898m0 0l3.182-5.511m-3.182 5.51l-5.511-3.181" : "M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941"} />
              </svg>
              <span className={`text-sm font-semibold ${isOver ? "text-[var(--zfit-error)]" : "text-[var(--zfit-primary)]"}`}>
                {isOver
                  ? `${Math.abs(Math.round(remaining))} kcal over`
                  : `${Math.round(remaining)} kcal remaining`}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Macro Mini Rings (Advanced Mode) */}
      {goals.displayMode === "advanced" && !loading && (
        <div className="flex justify-around mt-5 pt-5 border-t border-[var(--divider-color)]">
          <MacroRing
            percentage={(totals.protein / goals.proteinGoal) * 100}
            color="var(--zfit-protein)"
            bgColor="var(--zfit-protein-bg)"
            value={`${Math.round(totals.protein)}g`}
            label="Protein"
          />
          <MacroRing
            percentage={(totals.carbs / goals.carbsGoal) * 100}
            color="var(--zfit-carbs)"
            bgColor="var(--zfit-carbs-bg)"
            value={`${Math.round(totals.carbs)}g`}
            label="Carbs"
          />
          <MacroRing
            percentage={(totals.fat / goals.fatGoal) * 100}
            color="var(--zfit-fat)"
            bgColor="var(--zfit-fat-bg)"
            value={`${Math.round(totals.fat)}g`}
            label="Fat"
          />
        </div>
      )}
    </div>
  );
}
