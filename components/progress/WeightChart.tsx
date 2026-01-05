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

interface WeightDataPoint {
  date: string;
  dateFormatted: string;
  weight: number;
  unit: string;
}

interface WeightChartProps {
  data: WeightDataPoint[];
  timeRange: "7d" | "30d";
  loading?: boolean;
}

export default function WeightChart({
  data,
  timeRange,
  loading,
}: WeightChartProps) {
  if (loading) {
    return (
      <div
        className="h-64 flex items-center justify-center"
        data-testid="weight-chart"
      >
        <div className="text-gray-400">Loading chart data...</div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div
        className="h-64 flex items-center justify-center"
        data-testid="weight-chart"
      >
        <div className="text-center text-gray-400">
          <p>No weight data available</p>
          <p className="text-sm mt-1">Log your weight below to track progress</p>
        </div>
      </div>
    );
  }

  // Get the unit from the first entry (assuming consistent units)
  const unit = data[0]?.unit || "kg";

  return (
    <div className="h-64" data-testid="weight-chart">
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
            domain={["dataMin - 2", "dataMax + 2"]}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            }}
            formatter={(value) => [`${value} ${unit}`, "Weight"]}
          />
          <Line
            type="monotone"
            dataKey="weight"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ fill: "#3b82f6", strokeWidth: 2, r: 3 }}
            activeDot={{ r: 5 }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
