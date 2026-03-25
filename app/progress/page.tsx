"use client";

import { useState } from "react";
import CalorieChart from "@/components/progress/CalorieChart";
import WeightChart from "@/components/progress/WeightChart";
import WeightLogForm from "@/components/progress/WeightLogForm";
import { useProgressData } from "@/lib/hooks/useProgressData";

type TimeRange = "7d" | "30d";

export default function ProgressPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>("7d");
  const days = timeRange === "7d" ? 7 : 30;
  const { calorieData, weightData, loading, error, refetch } =
    useProgressData(days);

  return (
    <div className="max-w-lg mx-auto px-5 py-4">
      <h1 className="text-[26px] font-semibold text-[var(--foreground)] tracking-tight mb-5">Progress</h1>

      {/* Pill Segmented Control */}
      <div className="flex bg-[var(--zfit-gray-200)] rounded-xl p-1 mb-6">
        <button
          onClick={() => setTimeRange("7d")}
          className={`flex-1 py-2.5 text-[13px] font-semibold rounded-[10px] transition-all ${
            timeRange === "7d"
              ? "bg-white text-[var(--foreground)] shadow-warm-sm"
              : "text-[var(--zfit-gray-500)] hover:text-[var(--foreground)]"
          }`}
        >
          Last 7 Days
        </button>
        <button
          onClick={() => setTimeRange("30d")}
          className={`flex-1 py-2.5 text-[13px] font-semibold rounded-[10px] transition-all ${
            timeRange === "30d"
              ? "bg-white text-[var(--foreground)] shadow-warm-sm"
              : "text-[var(--zfit-gray-500)] hover:text-[var(--foreground)]"
          }`}
        >
          Last 30 Days
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-[var(--zfit-error)] rounded-xl text-sm border border-red-100">
          {error}
        </div>
      )}

      {/* Charts */}
      <div className="space-y-4">
        <div className="bg-white rounded-2xl shadow-warm p-5">
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">Calories</h2>
          <CalorieChart data={calorieData} timeRange={timeRange} loading={loading} />
        </div>

        <div className="bg-white rounded-2xl shadow-warm p-5">
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">Weight</h2>
          <WeightChart data={weightData} timeRange={timeRange} loading={loading} />
        </div>

        <div className="bg-white rounded-2xl shadow-warm p-5">
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">Log Weight</h2>
          <WeightLogForm onSaved={refetch} />
        </div>
      </div>
    </div>
  );
}
