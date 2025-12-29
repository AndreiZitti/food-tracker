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

interface WeightChartProps {
  timeRange: "7d" | "30d";
}

// Generate sample data for demonstration
const generateData = (days: number) => {
  const data = [];
  const today = new Date();
  let weight = 75; // Starting weight

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    // Small random fluctuation
    weight += (Math.random() - 0.5) * 0.4;
    data.push({
      date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      weight: Math.round(weight * 10) / 10,
    });
  }

  return data;
};

export default function WeightChart({ timeRange }: WeightChartProps) {
  const days = timeRange === "7d" ? 7 : 30;
  const data = generateData(days);

  return (
    <div className="h-64" data-testid="weight-chart">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="date"
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
            formatter={(value) => [`${value} kg`, "Weight"]}
          />
          <Line
            type="monotone"
            dataKey="weight"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ fill: "#3b82f6", strokeWidth: 2, r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
