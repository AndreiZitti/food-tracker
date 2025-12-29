"use client";

import { useState } from "react";
import CalorieChart from "@/components/progress/CalorieChart";
import WeightChart from "@/components/progress/WeightChart";
import WeightLogForm from "@/components/progress/WeightLogForm";

type TimeRange = "7d" | "30d";

export default function ProgressPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>("7d");

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

      {/* Charts */}
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Calories</h2>
          <CalorieChart timeRange={timeRange} />
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Weight</h2>
          <WeightChart timeRange={timeRange} />
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Log Weight</h2>
          <WeightLogForm />
        </div>
      </div>
    </div>
  );
}
