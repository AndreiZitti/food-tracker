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
    <div className="max-w-lg mx-auto px-4 py-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Progress</h1>

      {/* Time Range Selector */}
      <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
        <button
          onClick={() => setTimeRange("7d")}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
            timeRange === "7d"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Last 7 Days
        </button>
        <button
          onClick={() => setTimeRange("30d")}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
            timeRange === "30d"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Last 30 Days
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Charts */}
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Calories</h2>
          <CalorieChart data={calorieData} timeRange={timeRange} loading={loading} />
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Weight</h2>
          <WeightChart data={weightData} timeRange={timeRange} loading={loading} />
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Log Weight</h2>
          <WeightLogForm onSaved={refetch} />
        </div>
      </div>
    </div>
  );
}
