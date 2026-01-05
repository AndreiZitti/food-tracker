"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface CalorieDataPoint {
  date: string;
  dateFormatted: string;
  calories: number;
  goal: number;
}

interface CalorieChartProps {
  data: CalorieDataPoint[];
  timeRange: "7d" | "30d";
  loading?: boolean;
}

export default function CalorieChart({
  data,
  timeRange,
  loading,
}: CalorieChartProps) {
  if (loading) {
    return (
      <div
        className="h-64 flex items-center justify-center"
        data-testid="calorie-chart"
      >
        <div className="text-slate-400">Loading chart data...</div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div
        className="h-64 flex items-center justify-center"
        data-testid="calorie-chart"
      >
        <div className="text-center text-slate-400">
          <p>No calorie data available</p>
          <p className="text-sm mt-1">Start logging food to see your progress</p>
        </div>
      </div>
    );
  }

  // Check if there's any actual calorie data
  const hasCalories = data.some((d) => d.calories > 0);

  if (!hasCalories) {
    return (
      <div
        className="h-64 flex items-center justify-center"
        data-testid="calorie-chart"
      >
        <div className="text-center text-slate-400">
          <p>No calories logged yet</p>
          <p className="text-sm mt-1">Add food to your diary to track progress</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-64" data-testid="calorie-chart">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="dateFormatted"
            tick={{ fontSize: 10, fill: "#9ca3af" }}
            tickLine={false}
            axisLine={{ stroke: "#e5e7eb" }}
            interval={timeRange === "30d" ? 4 : 0}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "#9ca3af" }}
            tickLine={false}
            axisLine={{ stroke: "#e5e7eb" }}
            domain={[0, "auto"]}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            }}
            formatter={(value) => [
              `${Math.round(value as number)} kcal`,
              "",
            ]}
          />
          <Line
            type="monotone"
            dataKey="goal"
            stroke="#cbd5e1"
            strokeDasharray="5 5"
            strokeWidth={2}
            dot={false}
            name="goal"
          />
          <Line
            type="monotone"
            dataKey="calories"
            stroke="#0d9488"
            strokeWidth={2}
            dot={{ fill: "#0d9488", strokeWidth: 2, r: 3 }}
            activeDot={{ r: 5 }}
            name="calories"
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
