import { useState, useEffect, useCallback } from "react";
import {
  getFoodLogEntries,
  getWeightLogEntries,
  addWeightLogEntry,
  getSettings,
  getAllFoodLogEntries,
} from "@/lib/localStorage";

interface CalorieData {
  date: string;
  dateFormatted: string;
  calories: number;
  goal: number;
}

interface WeightData {
  date: string;
  dateFormatted: string;
  weight: number;
  unit: string;
}

interface ProgressData {
  calorieData: CalorieData[];
  weightData: WeightData[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useProgressData(days: number = 7): ProgressData {
  const [calorieData, setCalorieData] = useState<CalorieData[]>([]);
  const [weightData, setWeightData] = useState<WeightData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    setError(null);

    try {
      const settings = getSettings();
      const goal = settings.calorieGoal;

      // Get calorie data for each day
      const calorieResults: CalorieData[] = [];
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split("T")[0];
        const dateFormatted = date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });

        const entries = getFoodLogEntries(dateStr);
        const totalCalories = entries.reduce((sum, e) => sum + (e.calories || 0), 0);

        calorieResults.push({
          date: dateStr,
          dateFormatted,
          calories: totalCalories,
          goal,
        });
      }

      setCalorieData(calorieResults);

      // Get weight data
      const weightEntries = getWeightLogEntries(days);
      const processedWeightData: WeightData[] = weightEntries.map((entry) => {
        const date = new Date(entry.date);
        return {
          date: entry.date,
          dateFormatted: date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          weight: entry.weight,
          unit: entry.unit,
        };
      });

      setWeightData(processedWeightData);
    } catch (err) {
      console.error("Error fetching progress data:", err);
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    calorieData,
    weightData,
    loading,
    error,
    refetch: fetchData,
  };
}

export function useWeightLog() {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const logWeight = async (
    weight: number,
    unit: "kg" | "lbs"
  ): Promise<boolean> => {
    setSaving(true);
    setError(null);

    try {
      addWeightLogEntry(weight, unit);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save weight");
      return false;
    } finally {
      setSaving(false);
    }
  };

  return { logWeight, saving, error };
}

// Hook to get calorie data for a specific date range (for charts)
export function useCalorieHistory(days: number = 30) {
  const [data, setData] = useState<CalorieData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const settings = getSettings();
    const goal = settings.calorieGoal;

    const results: CalorieData[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      const dateFormatted = date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });

      const entries = getFoodLogEntries(dateStr);
      const totalCalories = entries.reduce((sum, e) => sum + (e.calories || 0), 0);

      results.push({
        date: dateStr,
        dateFormatted,
        calories: totalCalories,
        goal,
      });
    }

    setData(results);
    setLoading(false);
  }, [days]);

  return { data, loading };
}
