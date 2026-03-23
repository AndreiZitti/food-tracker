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

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch settings and weight in parallel
      const [settingsRes, weightRes] = await Promise.all([
        fetch("/api/settings"),
        fetch(`/api/weight?days=${days}`),
      ]);

      let goal = 2000;
      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        goal = settingsData.calorie_goal ?? 2000;
      }

      // Fetch calorie data for each day
      const calorieResults: CalorieData[] = [];
      const datePromises: Promise<void>[] = [];

      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split("T")[0];
        const dateFormatted = date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });

        datePromises.push(
          fetch(`/api/log?date=${dateStr}`)
            .then((res) => (res.ok ? res.json() : []))
            .then((entries: Array<{ calories?: number }>) => {
              const totalCalories = entries.reduce(
                (sum: number, e: { calories?: number }) => sum + (e.calories || 0),
                0
              );
              calorieResults.push({
                date: dateStr,
                dateFormatted,
                calories: totalCalories,
                goal,
              });
            })
        );
      }

      await Promise.all(datePromises);

      // Sort by date
      calorieResults.sort((a, b) => a.date.localeCompare(b.date));
      setCalorieData(calorieResults);

      // Process weight data
      if (weightRes.ok) {
        const weightEntries = await weightRes.json();
        const processedWeightData: WeightData[] = weightEntries.map(
          (entry: { date: string; weight: number; unit: string }) => {
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
          }
        );
        setWeightData(processedWeightData);
      }
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
      const res = await fetch("/api/weight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weight, unit }),
      });
      if (!res.ok) throw new Error("Failed to save weight");
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
    async function load() {
      try {
        const settingsRes = await fetch("/api/settings");
        let goal = 2000;
        if (settingsRes.ok) {
          const settingsData = await settingsRes.json();
          goal = settingsData.calorie_goal ?? 2000;
        }

        const results: CalorieData[] = [];
        const promises: Promise<void>[] = [];

        for (let i = days - 1; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split("T")[0];
          const dateFormatted = date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          });

          promises.push(
            fetch(`/api/log?date=${dateStr}`)
              .then((res) => (res.ok ? res.json() : []))
              .then((entries: Array<{ calories?: number }>) => {
                const totalCalories = entries.reduce(
                  (sum: number, e: { calories?: number }) => sum + (e.calories || 0),
                  0
                );
                results.push({
                  date: dateStr,
                  dateFormatted,
                  calories: totalCalories,
                  goal,
                });
              })
          );
        }

        await Promise.all(promises);
        results.sort((a, b) => a.date.localeCompare(b.date));
        setData(results);
      } catch (err) {
        console.error("Error fetching calorie history:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [days]);

  return { data, loading };
}
