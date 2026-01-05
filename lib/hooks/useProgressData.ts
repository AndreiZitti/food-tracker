import { useState, useEffect, useCallback } from "react";

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

interface ApiWeightLog {
  id: string;
  user_id: string;
  date: string;
  weight: number;
  unit: string;
  created_at: string;
}

interface ApiFoodLog {
  id: string;
  date: string;
  calories: number;
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

  // Get calorie goal from localStorage
  const getCalorieGoal = (): number => {
    if (typeof window === "undefined") return 2000;
    const settings = localStorage.getItem("fittrack-settings");
    if (settings) {
      try {
        return JSON.parse(settings).calorieGoal || 2000;
      } catch {
        return 2000;
      }
    }
    return 2000;
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch calorie data for each day
      const caloriePromises: Promise<CalorieData>[] = [];
      const goal = getCalorieGoal();

      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split("T")[0];
        const dateFormatted = date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });

        caloriePromises.push(
          fetch(`/api/log?date=${dateStr}`)
            .then((res) => res.json())
            .then((entries: ApiFoodLog[]) => {
              const totalCalories = Array.isArray(entries)
                ? entries.reduce((sum, e) => sum + (e.calories || 0), 0)
                : 0;
              return {
                date: dateStr,
                dateFormatted,
                calories: totalCalories,
                goal,
              };
            })
            .catch(() => ({
              date: dateStr,
              dateFormatted,
              calories: 0,
              goal,
            }))
        );
      }

      // Fetch weight data
      const weightResponse = await fetch(`/api/weight?days=${days}`);
      const weightEntries: ApiWeightLog[] = await weightResponse.json();

      // Process calorie data
      const calorieResults = await Promise.all(caloriePromises);
      setCalorieData(calorieResults);

      // Process weight data - map API response to display format
      const processedWeightData: WeightData[] = Array.isArray(weightEntries)
        ? weightEntries.map((entry) => {
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
          })
        : [];
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
      const response = await fetch("/api/weight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weight,
          unit,
          date: new Date().toISOString().split("T")[0],
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save weight");
      }

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
